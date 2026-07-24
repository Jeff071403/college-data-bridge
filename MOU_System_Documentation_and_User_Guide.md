# MOU Lifecycle & Document Management System
## System Documentation & Operational User Manual

---

## 1. Executive Summary & Purpose
The **MOU Lifecycle & Document Management System** is an enterprise-grade SaaS application designed for colleges and universities. It streamlines the management of Memorandums of Understanding (MOUs), industrial partnerships, student internships, and joint research initiatives.

### Key Capabilities
- **Centralized Document Repository**: Replaces scattered local folders with structured, role-permissioned cloud storage.
- **Smart Expiry Calculation**: Computes exact expiry dates from the actual **Signed Date** (`Signed Date + Duration`).
- **Daily Automated Reminders**: Fires notifications at 30, 15, 7, and 1 day(s) before agreement expiry.
- **One-Click Renewal**: Clones prior agreement details into a new version while locking past records for compliance audits.
- **Dynamic MOU Templates**: Allows administrators to create custom templates (*Internship, Placement, Research, Industry Collaboration, etc.*) with custom fields and explanatory notes.

---

## 2. Technology Stack
- **Frontend**: React (Vite), Material-UI (MUI v9), Recharts, Lucide & MUI Icons, Custom Animation CSS (`index.css`)
- **Backend**: Python Django REST Framework (DRF), SQLite / PostgreSQL
- **Authentication**: JWT Auth & Custom Role-Based Access Control (RBAC)

---

## 3. User Roles & Permissions Matrix

| Permission / Capability | Super Admin | Admin / Lawyer | Dept. Coordinator | View Only |
|---|:---:|:---:|:---:|:---:|
| Create & Upload Original MOUs | ✅ | ✅ | ❌ | ❌ |
| Upload Signed MOUs | ✅ | ✅ | ✅ | ❌ |
| Approve / Reject Signed MOUs | ✅ | ✅ | ❌ | ❌ |
| Execute One-Click Renewal | ✅ | ✅ | ❌ | ❌ |
| Configure Dynamic Templates | ✅ | ✅ | ❌ | ❌ |
| View System Security Audit Logs | ✅ | ✅ | ❌ | ❌ |
| Custom User Permission Overrides | ✅ | ❌ | ❌ | ❌ |

---

## 4. MOU Lifecycle Workflow

```
[1. Draft] ➔ [2. Shared] ➔ [3. Signed] ➔ [4. Pending Verification] ➔ [5. Active] ➔ [6. Expiring Soon] ➔ [7. Expired / Renewed]
```

1. **Draft**: Created by Administrator.
2. **Shared**: Distributed to target department coordinators.
3. **Signed**: Executed copy uploaded with Signed Date.
4. **Pending Verification**: Submitted for legal compliance review.
5. **Active**: Approved by Administrator. Expiry countdown active.
6. **Expiring Soon**: Auto-triggered when Expiry Date ≤ 30 days.
7. **Expired / Renewed**: Passed end date or superseded by a renewal version.

---

## 5. Expiry Date Calculation Formula

$$\text{Calculated Expiry Date} = \text{Signed Date} + \text{Duration (Months)}$$

- Default Signed Date = Current System Date (fully editable).
- Duration read automatically from agreement template (e.g. 12 Months).
- Real-time live preview box displays calculated date prior to submission.

---

## 6. Project File Reference

- **Documentation**: [MOU_System_Documentation_and_User_Guide.txt](file:///c:/Users/acer/Desktop/college%20data%20bridge/MOU_System_Documentation_and_User_Guide.txt)
- **MOU Repository Page**: [MOURepository.jsx](file:///c:/Users/acer/Desktop/college%20data%20bridge/frontend/src/pages/MOURepository.jsx)
- **MOU Detail Page**: [MOUDetail.jsx](file:///c:/Users/acer/Desktop/college%20data%20bridge/frontend/src/pages/MOUDetail.jsx)
- **MOU Creation Wizard**: [MOUCreate.jsx](file:///c:/Users/acer/Desktop/college%20data%20bridge/frontend/src/pages/MOUCreate.jsx)
- **Executive Reports**: [Reports.jsx](file:///c:/Users/acer/Desktop/college%20data%20bridge/frontend/src/pages/Reports.jsx)
- **Template Admin**: [Templates.jsx](file:///c:/Users/acer/Desktop/college%20data%20bridge/frontend/src/pages/Templates.jsx)
- **System Map Diagram**: [SystemMap.jsx](file:///c:/Users/acer/Desktop/college%20data%20bridge/frontend/src/pages/SystemMap.jsx)
