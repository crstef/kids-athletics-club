# Granular Permission System Design

## Problem with Current System
- ❌ Hard-coded tabs per role (Coach sees "Athletes", "Results", etc.)
- ❌ Binary: permission exists or doesn't (no granularity)
- ❌ Can't customize what components/widgets each role sees
- ❌ No dynamic dashboard configuration by admin
- ❌ Not professional enough for enterprise use

## Solution: Component-Level Granular Permissions

### 1. New Database Schema

```sql
-- Components (smallest unit of UI)
CREATE TABLE components (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  description TEXT,
  component_type VARCHAR(50), -- 'tab', 'widget', 'section', 'action'
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

Example: 
- athletes-list (tab)
- athletes-create (action inside athletes tab)
- results-chart (widget on dashboard)
- user-management (section)

-- Component Permissions (granular)
CREATE TABLE component_permissions (
  id UUID PRIMARY KEY,
  role_id UUID NOT NULL,
  component_id UUID NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  custom_fields JSONB, -- Extra config: hide_email, read_only_mode, etc.
  created_at TIMESTAMP,
  UNIQUE(role_id, component_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE
);

-- Dynamic Dashboards
CREATE TABLE dashboard_layouts (
  id UUID PRIMARY KEY,
  role_id UUID NOT NULL,
  name VARCHAR(100),
  components JSONB, -- Array of component IDs + layout config
  is_default BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

Example dashboard_layouts.components:
{
  "layout": "grid",
  "rows": [
    {
      "cols": 2,
      "components": [
        { "componentId": "athlete-stats", "width": "50%", "order": 1 },
        { "componentId": "recent-results", "width": "50%", "order": 2 }
      ]
    },
    {
      "cols": 1,
      "components": [
        { "componentId": "performance-chart", "width": "100%", "order": 1 }
      ]
    }
  ]
}
```

### 2. How It Works

#### Admin Dashboard - Permission Builder UI

```
SuperAdmin sees:
┌─────────────────────────────────────────┐
│ Roles & Components Management            │
├─────────────────────────────────────────┤
│ Select Role: [Coach ▼]                  │
│                                         │
│ Available Components:                   │
│ ☑ Athletes Tab                          │
│  ├─ ☑ View Athletes                     │
│  ├─ ☑ Create Athlete                    │
│  ├─ ☑ Edit Athlete                      │
│  └─ ☐ Delete Athlete                    │
│ ☑ Results Tab                           │
│  ├─ ☑ View Results                      │
│  ├─ ☑ Create Result                     │
│  ├─ ✓ Edit Result (custom: own only)   │
│  └─ ☐ Delete Result                     │
│ ☑ Messages Tab                          │
│  ├─ ☑ View Messages                     │
│  ├─ ☑ Send Message                      │
│  └─ ☐ Manage Messages                   │
│ ☐ Users Management (hidden for coach)   │
│ ☐ Roles Management (hidden for coach)   │
│                                         │
│ [Save Changes] [Preview as Coach]       │
└─────────────────────────────────────────┘
```

#### Dashboard Builder UI

```
┌──────────────────────────────────────────┐
│ Dashboard Designer - Coach Dashboard      │
├──────────────────────────────────────────┤
│ [Add Widget ▼]                           │
│                                          │
│ ┌─────────────────┬──────────────────┐   │
│ │ Athletes Stats  │ Recent Results   │   │
│ │ (Component)     │ (Component)      │   │
│ │ [Delete] [Edit] │ [Delete] [Edit]  │   │
│ └─────────────────┴──────────────────┘   │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ Performance Chart                    │ │
│ │ (Component)                          │ │
│ │ [Delete] [Edit]                      │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ [Save Layout] [Preview] [Revert]        │
└──────────────────────────────────────────┘
```

### 3. Database Data Structure Example

**Components:**
```
athletes-list | View list of athletes | tab
athletes-create | Create new athlete | action
athletes-edit | Edit athlete info | action
athletes-delete | Delete athlete | action
results-list | View results | tab
results-create | Record new result | action
results-chart | Performance chart widget | widget
users-management | User admin section | tab
roles-management | Role admin section | tab
permissions-management | Permissions admin section | tab
```

**Component Permissions for Coach Role:**
```
role_id: coach-123
┌──────────────────────┬──────────┬────────┬──────┬────────┐
│ component_id         │ can_view │ create │ edit │ delete │
├──────────────────────┼──────────┼────────┼──────┼────────┤
│ athletes-list        │ true     │ true   │ true │ false  │
│ athletes-create      │ true     │ true   │ false│ false  │
│ athletes-edit        │ true     │ false  │ true │ false  │
│ athletes-delete      │ false    │ false  │ false│ false  │
│ results-list         │ true     │ true   │ true │ false  │
│ results-create       │ true     │ true   │ false│ false  │
│ results-chart        │ true     │ false  │ false│ false  │
│ messages-list        │ true     │ true   │ false│ false  │
│ users-management     │ false    │ false  │ false│ false  │
│ roles-management     │ false    │ false  │ false│ false  │
└──────────────────────┴──────────┴────────┴──────┴────────┘
```

### 4. Backend API Endpoints

```typescript
// Get available components
GET /api/components

// Get permissions for a role
GET /api/roles/:roleId/component-permissions

// Update component permissions for a role
PUT /api/roles/:roleId/component-permissions
Body: {
  componentId: "athletes-list",
  canView: true,
  canCreate: true,
  canEdit: true,
  canDelete: false,
  customFields: { readOnlyMode: true }
}

// Get dashboard layout for current user's role
GET /api/dashboards/my-layout
Response: {
  components: [
    { id: "athletes-stats", order: 1, width: "50%" },
    { id: "recent-results", order: 2, width: "50%" }
  ]
}

// Update dashboard layout
PUT /api/dashboards/layout
Body: {
  roleId: "coach-123",
  layout: {
    rows: [
      { cols: 2, components: [...] }
    ]
  }
}

// Get user's accessible components (considering role + user permissions)
GET /api/me/components
Response: {
  tabs: [
    { id: "athletes", label: "Atleți", canView: true, ... },
    { id: "results", label: "Rezultate", canView: true, ... }
  ],
  hidden: [
    { id: "users", label: "Utilizatori", reason: "No permission" }
  ]
}
```

### 5. Frontend Changes

**App.tsx - Dynamic Tab Generation:**
```typescript
// OLD (hard-coded):
const TABS = {
  coach: ['athletes', 'results', 'messages'],
  parent: ['athletes', 'messages'],
  superadmin: ['athletes', 'results', 'users', 'roles', ...]
}

// NEW (dynamic):
const [availableTabs, setAvailableTabs] = useState([])

useEffect(() => {
  const fetchTabs = async () => {
    const response = await apiClient.request('/me/components')
    setAvailableTabs(response.tabs.filter(t => t.canView))
  }
  fetchTabs()
}, [user])

return (
  <Tabs>
    {availableTabs.map(tab => (
      <TabsContent key={tab.id} value={tab.id}>
        {renderComponent(tab.id)}
      </TabsContent>
    ))}
  </Tabs>
)
```

**Component Rendering (Granular Control):**
```typescript
interface ComponentProps {
  componentId: string
  permissions: ComponentPermissions
}

export function DynamicComponent({ componentId, permissions }: ComponentProps) {
  // Only render allowed actions
  return (
    <div>
      <h2>{getComponentLabel(componentId)}</h2>
      
      {permissions.canView && <ComponentContent />}
      
      {permissions.canCreate && <CreateButton />}
      {permissions.canEdit && <EditButton />}
      {permissions.canDelete && <DeleteButton />}
      
      {permissions.customFields?.readOnlyMode && (
        <Alert>This is read-only mode</Alert>
      )}
    </div>
  )
}
```

### 6. Benefits

✅ **Granular Control:**
- Admin can give Coach permission to VIEW athletes but NOT DELETE
- Can hide "Users" tab for coaches
- Can show "Messages" only to specific roles

✅ **Dynamic & Flexible:**
- Change permissions without code deploy
- Add new components without touching code
- Configure dashboards per role visually

✅ **Professional:**
- Real enterprise-grade permission system
- Scalable to 50+ components
- Audit trail possible (who changed what permission when)

✅ **User-Friendly:**
- Visual permission builder UI
- Drag-drop dashboard designer
- Preview as role before saving

### 7. Migration Path

1. Keep role_permissions for backward compat
2. Add components table + component_permissions
3. Create admin UI for component permissions
4. Update frontend to read from components endpoint
5. Deprecate old role-based hard-coded tabs

---

## Summary

Instead of:
```
Coach Role → show [Athletes, Results, Messages] tabs
```

Now:
```
Coach Role → can VIEW athletes-list, can CREATE athletes, 
            cannot DELETE athletes, cannot see users-management
            can SEE these 3 widgets on dashboard, etc.
```

This is TRUE granular permission system suitable for enterprise apps! 🎯

