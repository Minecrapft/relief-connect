
# QRelief — Disaster Relief Distribution PWA

A mobile-first installable web app (PWA) for managing relief distribution with QR-based beneficiary verification, built for Android & iOS via "Add to Home Screen."

## Roles & Access

- **Administrator** — manages events, inventory, beneficiaries (approves signups), staff accounts, and views all reports.
- **Staff (Field Responder)** — scans beneficiary QR codes at events, logs distributions, views assigned events.
- **Beneficiary** — self-signs up, waits for approval, then accesses a personal dashboard with their unique QR code and claim history.

## Core Features

### 1. Authentication & Onboarding
- Email/password signup with role selection (beneficiary self-signup; staff/admin created by admin)
- Beneficiary signup collects: full name, household size, address, contact, government ID number
- Admin "Pending Approvals" queue — approve/reject with notes; on approval, a unique QR code is generated
- Login redirects each role to its appropriate home screen

### 2. Beneficiary App
- Personal dashboard: profile, household info, approval status
- **My QR Code** screen — large, high-contrast QR for scanning at events (works offline)
- Claim history: list of past distributions (event, items received, date, staff who released)
- Notifications for upcoming events in their area

### 3. Staff App — QR Scanner & Distribution
- "Active Events" list — pick the event they're working
- **Camera-based QR scanner** (full-screen, with torch toggle)
- On scan:
  - Verifies beneficiary is approved
  - Checks if they've already claimed in this event (blocks duplicates with clear warning)
  - Shows beneficiary profile + items they're entitled to in this event
  - Staff selects items released → confirms → logs distribution
- Manual lookup fallback (search by name/ID if QR is damaged)
- Recent scans feed

### 4. Admin Dashboard
- **Events** — create distribution events (name, location, date/time window, item allocations per beneficiary, assigned staff). Active/upcoming/past tabs.
- **Inventory** — relief items with stock levels, units, low-stock alerts, stock-in/stock-out logs. Auto-decrements when staff log a distribution.
- **Beneficiaries** — searchable list, approval queue, view profile + claim history, deactivate/flag
- **Staff Management** — invite/create staff accounts, assign to events
- **Reports & Analytics** — real-time stats (beneficiaries served, packages distributed, inventory remaining, distribution rate), per-event breakdown, exportable CSV

### 5. Offline Mode (PWA + Service Worker)
- Beneficiary list, active event, and inventory cached on device when staff opens the app online
- QR scans + distribution logs queued in local IndexedDB when offline
- Visible "Offline — X pending sync" indicator
- Auto-sync when connection returns; conflict resolution flags duplicate claims that occurred across devices while offline
- Beneficiary's QR code always works offline (it's just their ID)

## Data Model (Lovable Cloud)

- `profiles` — user info linked to auth
- `user_roles` — separate table (admin/staff/beneficiary), enforced via security-definer function
- `beneficiaries` — household details, approval status, QR token
- `staff_assignments` — staff ↔ event mapping
- `events` — distribution events with location, schedule, status
- `event_items` — items + per-beneficiary allocation per event
- `inventory_items` — relief goods catalog and stock levels
- `inventory_movements` — stock-in/out audit log
- `distributions` — every claim record (beneficiary, event, items, staff, timestamp, sync status)

RLS policies ensure beneficiaries only see their own data, staff only see assigned events, admins see everything.

## Design Direction

- Mobile-first, high-contrast, large tap targets (field use, gloves, sunlight)
- Clean utility aesthetic — calm blue/teal primary with orange accent for action/alert states
- Bottom tab navigation per role
- Big, unmistakable scanner UI; clear success/duplicate/error states with haptic + sound feedback

## Build Order

1. Auth + roles + role-based routing shells
2. Beneficiary signup → admin approval → QR generation & display
3. Inventory + events CRUD (admin)
4. Staff scanner + distribution logging (online)
5. Admin dashboards & reports
6. Offline mode + sync layer
7. PWA manifest + service worker + install prompt
