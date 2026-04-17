-- ============================================
-- QRelief: Full Schema
-- ============================================

-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'beneficiary');

-- Approval status enum
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Event status enum
CREATE TYPE public.event_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled');

-- ============================================
-- Profiles
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  contact_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- User roles (separate table — security critical)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================
-- Beneficiaries
-- ============================================
CREATE TABLE public.beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  household_size INT NOT NULL DEFAULT 1,
  address TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  government_id TEXT NOT NULL,
  status public.approval_status NOT NULL DEFAULT 'pending',
  qr_token UUID UNIQUE DEFAULT gen_random_uuid(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_beneficiaries_status ON public.beneficiaries(status);
CREATE INDEX idx_beneficiaries_qr_token ON public.beneficiaries(qr_token);

-- ============================================
-- Inventory items
-- ============================================
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'pcs',
  stock INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Inventory movements (audit log)
-- ============================================
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  delta INT NOT NULL,
  reason TEXT NOT NULL,
  reference_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Events
-- ============================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status public.event_status NOT NULL DEFAULT 'upcoming',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_events_status ON public.events(status);

-- ============================================
-- Event items (per-event allocations)
-- ============================================
CREATE TABLE public.event_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  allocation_per_beneficiary INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, item_id)
);

ALTER TABLE public.event_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Staff assignments
-- ============================================
CREATE TABLE public.staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, staff_id)
);

ALTER TABLE public.staff_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Distributions (claim records)
-- ============================================
CREATE TABLE public.distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  beneficiary_id UUID NOT NULL REFERENCES public.beneficiaries(id) ON DELETE RESTRICT,
  staff_id UUID REFERENCES auth.users(id),
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{item_id, name, quantity, unit}]
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, beneficiary_id) -- prevents duplicate claims per event
);

ALTER TABLE public.distributions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_distributions_event ON public.distributions(event_id);
CREATE INDEX idx_distributions_beneficiary ON public.distributions(beneficiary_id);

-- ============================================
-- Updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_beneficiaries_updated BEFORE UPDATE ON public.beneficiaries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_inventory_items_updated BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, contact_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'contact_number', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Auto-decrement inventory on distribution
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_distribution_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec JSONB;
  item_uuid UUID;
  qty INT;
BEGIN
  FOR rec IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    item_uuid := (rec->>'item_id')::UUID;
    qty := (rec->>'quantity')::INT;
    IF item_uuid IS NOT NULL AND qty > 0 THEN
      UPDATE public.inventory_items SET stock = stock - qty WHERE id = item_uuid;
      INSERT INTO public.inventory_movements (item_id, delta, reason, reference_id, created_by)
      VALUES (item_uuid, -qty, 'distribution', NEW.id, NEW.staff_id);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_distribution_created
AFTER INSERT ON public.distributions
FOR EACH ROW EXECUTE FUNCTION public.handle_distribution_inventory();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles: users see own; admins see all
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_roles: users can view their own roles; admins manage
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Beneficiaries: own row OR admin OR staff (for scanning verification)
CREATE POLICY "Beneficiaries view own" ON public.beneficiaries FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Beneficiaries insert own" ON public.beneficiaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Beneficiaries update own pending" ON public.beneficiaries FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins manage beneficiaries" ON public.beneficiaries FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Inventory: admins manage; staff read
CREATE POLICY "Authenticated view inventory" ON public.inventory_items FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Admins manage inventory" ON public.inventory_items FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view movements" ON public.inventory_movements FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert movements" ON public.inventory_movements FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Events: anyone authenticated can read; admins manage
CREATE POLICY "Authenticated view events" ON public.events FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage events" ON public.events FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Event items
CREATE POLICY "Authenticated view event items" ON public.event_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage event items" ON public.event_items FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Staff assignments
CREATE POLICY "Staff view own assignments" ON public.staff_assignments FOR SELECT USING (auth.uid() = staff_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage assignments" ON public.staff_assignments FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Distributions: beneficiary sees own; staff/admin see all
CREATE POLICY "View distributions" ON public.distributions FOR SELECT USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'staff')
  OR EXISTS (SELECT 1 FROM public.beneficiaries b WHERE b.id = beneficiary_id AND b.user_id = auth.uid())
);
CREATE POLICY "Staff log distributions" ON public.distributions FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admins manage distributions" ON public.distributions FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));