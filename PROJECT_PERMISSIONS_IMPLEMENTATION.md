# Project Permission System Implementation

## Overview
Implemented a role-based access control (RBAC) system where:
- **Admin users** can see ALL projects in the system
- **Regular users** can only see projects they've been invited to/assigned to
- **Email invitations** automatically assign users to specified projects upon registration

## What Was Changed

### 1. Database Structure (`database/db.js`)
Added three new database tables:

#### `projects.json`
Stores all project data (migrated from in-memory array)

#### `project-users.json`
Relationship table that maps users to projects:
```json
[
  { "userId": 3, "projectId": "1" },
  { "userId": 3, "projectId": "2" }
]
```

#### Database Operations Added:
- `projectsDB` - CRUD operations for projects
- `projectUsersDB` - Manage user-project relationships
  - `getProjectsByUser(userId)` - Get all projects for a user
  - `getUsersByProject(projectId)` - Get all users for a project
  - `addUserToProject(userId, projectId)` - Assign user to project
  - `removeUserFromProject(userId, projectId)` - Remove user from project

### 2. Projects Controller (`controllers/projectsController.js`)
Updated all project endpoints to use database and implement permission filtering:

#### New Helper Function:
```javascript
getFilteredProjects(userId, userRole)
```
- Returns all projects if user is admin
- Returns only assigned projects if user is regular user

#### Updated Endpoints:
- `getProjects()` - Filters projects based on user role
- `getProjectsData()` - API endpoint with role-based filtering
- `getProjectById()` - Added permission check (403 if no access)
- All CRUD operations now use database instead of in-memory array

#### New Endpoints:
- `POST /add-user` - Add user to project
- `POST /remove-user` - Remove user from project

### 3. Routes (`routes/projectsRoutes.js`)
Added new routes:
```javascript
router.post('/add-user', projectsController.addUserToProject);
router.post('/remove-user', projectsController.removeUserFromProject);
```

### 4. People Controller (`controllers/peopleController.js`)
Updated invitation system to automatically assign projects:

#### Enhanced `processInvitationAcceptance()`:
When a user accepts an email invitation:
1. Creates user account
2. **Automatically assigns user to invited projects**
3. Parses project names/IDs from invitation
4. Adds user-project relationships to database
5. User can immediately access assigned projects after login

Example flow:
```javascript
// User invited to "good, AMFUL" projects
// After registration, user automatically gets access to both projects
// User ID offset (+1000) matches authController logic for people DB users
```

## Test Users

### Admin Users (See ALL projects):
1. **IT Admin**
   - Email: `it@desa.ca`
   - Password: `desa123`
   - Role: `admin`

2. **Administrator**
   - Email: `admin@desa.ca`
   - Password: `admin123`
   - Role: `admin`

### Regular User (See only assigned projects):
3. **Regular User**
   - Email: `user@desa.ca`
   - Password: `user123`
   - Role: `user`
   - Assigned to: Project "good" (ID: 1) and "AMFUL" (ID: 2)
   - **Cannot see**: "Sample project - MPE" (ID: 3)

## Testing

### Automated Tests

#### Test 1: Basic Permission System
```bash
node test-project-permissions.js
```

#### Test 2: Invitation + Project Assignment Flow
```bash
node test-invitation-flow.js
```
This test simulates:
- Sending invitation to projects "good, AMFUL"
- User registration via invitation link
- Automatic assignment to invited projects
- Verification that user can only access invited projects

### Manual Testing

#### Test 1: Admin Access
1. Login as `it@desa.ca` / `desa123`
2. Should see all 3 projects on the main page

#### Test 2: Regular User Access
1. Login as `user@desa.ca` / `user123`
2. Should see only 2 projects (good, AMFUL)
3. Should NOT see "Sample project - MPE"
4. Trying to access `/projects/project/3` directly should show "Access denied"

#### Test 3: Email Invitation Flow
1. As admin, go to People page
2. Click "Invite to Project"
3. Enter email: `newuser@test.com`
4. Select projects: `good, AMFUL`
5. Send invitation
6. User receives email with invitation link
7. User clicks link and registers
8. User logs in and should see ONLY the 2 invited projects (good, AMFUL)
9. User should NOT see "Sample project - MPE"

## How to Assign Users to Projects

### Method 1: Email Invitation (Recommended)
The easiest way - users are automatically assigned when they accept invitation:

1. Go to People page
2. Click "Invite to Project" button
3. Enter email addresses (comma-separated)
4. Select/enter project names
5. Send invitation
6. **When user accepts and registers, they are automatically assigned to those projects!**

### Method 2: API Endpoint
```bash
curl -X POST http://localhost:3002/projects/add-user \
  -H "Content-Type: application/json" \
  -d '{"userId": 3, "projectId": "3"}'
```

### Method 2: Direct Database Edit
Edit `database/project-users.json`:
```json
[
  { "userId": 3, "projectId": "1" },
  { "userId": 3, "projectId": "2" },
  { "userId": 3, "projectId": "3" }
]
```

### Method 3: Programmatically
```javascript
const { projectUsersDB } = require('./database/db');
projectUsersDB.addUserToProject(userId, projectId);
```

## Security Features

1. **Role-Based Access Control**
   - Admin: Full access to all projects
   - User: Access only to assigned projects

2. **Permission Checks**
   - Project view page checks permissions (403 error if denied)
   - API endpoints filter results based on user role

3. **Session-Based Authentication**
   - Uses `req.session.userId` and `req.session.userRole`
   - Permissions checked on every request

## Key Features

✅ **Automatic Project Assignment via Email**
- When you invite someone via email and specify projects
- They automatically get access to those projects upon registration
- No manual assignment needed!

✅ **Role-Based Access Control**
- Admins see everything
- Regular users see only their projects

✅ **Secure Access**
- Permission checks on every page load
- 403 error if user tries to access unauthorized project

## Future Enhancements

Consider adding:
1. ✅ ~~Project invitation system~~ - **IMPLEMENTED!**
2. **Admin UI** - Interface for admins to manage project assignments
3. **Project roles** - Different roles within projects (viewer, editor, admin)
4. **Project ownership** - Track who created each project
5. **Audit logging** - Track who accesses which projects

## Files Modified

1. `database/db.js` - Added projects and project-users database operations
2. `controllers/projectsController.js` - Implemented role-based filtering
3. `controllers/peopleController.js` - **Enhanced invitation system to auto-assign projects**
4. `routes/projectsRoutes.js` - Added new routes for user management
5. Created `test-project-permissions.js` - Permission test script
6. Created `test-invitation-flow.js` - Invitation flow test script

## Database Files Created

1. `database/projects.json` - Project data
2. `database/project-users.json` - User-project relationships

## Notes

- The system maintains backward compatibility
- Existing functionality is preserved
- Admin users have unrestricted access
- Regular users see only their assigned projects
- Permission checks happen at both view and API levels
