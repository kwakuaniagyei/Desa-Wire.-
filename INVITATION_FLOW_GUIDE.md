# Email Invitation → Project Access Flow

## How It Works

When you invite someone via email and specify projects, they automatically get access to those projects. Here's the complete flow:

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Admin Invites User to Projects                         │
└─────────────────────────────────────────────────────────────────┘

Admin on People Page:
  ↓
"Invite to Project" button
  ↓
Enter: newuser@example.com
Select Projects: "good, AMFUL"
  ↓
Send Invitation
  ↓
✉️ Email sent with invitation link


┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: User Receives Email & Clicks Link                      │
└─────────────────────────────────────────────────────────────────┘

User receives email:
  "You've been invited to: good, AMFUL"
  ↓
Clicks invitation link
  ↓
Registration page opens
  (Email pre-filled, projects listed)


┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: User Completes Registration                            │
└─────────────────────────────────────────────────────────────────┘

User enters:
  - First Name
  - Last Name
  - Phone
  - Password
  ↓
Submits registration form


┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: System Automatically Assigns Projects                  │
└─────────────────────────────────────────────────────────────────┘

Backend (processInvitationAcceptance):
  ✅ Create user account
  ✅ Parse invited projects from invitation
  ✅ Automatically assign user to each project
  ✅ Add entries to project-users.json
  ✅ Mark invitation as used
  ✅ Send confirmation email


┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: User Logs In & Sees Only Their Projects                │
└─────────────────────────────────────────────────────────────────┘

User logs in with credentials
  ↓
getFilteredProjects() checks user role
  ↓
User role = "user" (not admin)
  ↓
Query project-users.json for this user's projects
  ↓
Return ONLY: "good", "AMFUL"
  ↓
User sees 2 projects on main page
  ↓
User CANNOT see "Sample project - MPE" ❌
```

## Example Scenario

### Scenario: Invite contractor to specific projects

1. **Admin action:**
   ```
   Email: contractor@company.com
   Projects: Construction Project, Renovation Project
   ```

2. **What happens automatically:**
   - Invitation email sent
   - User registers via link
   - System assigns user to both projects
   - User logs in
   - User sees ONLY: "Construction Project" and "Renovation Project"
   - User CANNOT see other company projects

3. **Result:**
   - ✅ Contractor has access to their projects
   - ✅ Contractor cannot see unrelated projects
   - ✅ Admin sees all projects
   - ✅ No manual assignment needed!

## Technical Details

### Database Tables

**invitations.json:**
```json
{
  "token": "abc123...",
  "email": "newuser@example.com",
  "projects": "good, AMFUL",  ← Project names/IDs
  "expiresAt": "2024-10-08T...",
  "used": false
}
```

**project-users.json** (created after registration):
```json
[
  { "userId": 1011, "projectId": "1" },  ← good
  { "userId": 1011, "projectId": "2" }   ← AMFUL
]
```

### Code Flow

```javascript
// In processInvitationAcceptance()

1. Create user account
   const newUser = peopleDB.create({ ... });

2. Get invited projects from invitation
   const invitedProjects = invitation.projects.split(',');
   // ["good", "AMFUL"]

3. Find matching projects in database
   const project = projectsDB.getAll().find(p =>
     p.name.toLowerCase() === "good"
   );

4. Assign user to each project
   projectUsersDB.addUserToProject(userId, projectId);
   // Creates relationship in project-users.json

5. When user logs in later
   const userProjects = getFilteredProjects(userId, userRole);
   // Returns only projects user is assigned to
```

## Comparison: Admin vs Regular User

### Admin Login (admin@desa.ca)
```
Login → Check role → role = "admin"
  ↓
getFilteredProjects() → "return ALL projects"
  ↓
Sees: ✅ good
      ✅ AMFUL
      ✅ Sample project - MPE
      ✅ All other projects
```

### Regular User Login (invited user)
```
Login → Check role → role = "user"
  ↓
getFilteredProjects() → "query project-users table"
  ↓
Find projects where userId matches
  ↓
Sees: ✅ good (assigned)
      ✅ AMFUL (assigned)
      ❌ Sample project - MPE (not assigned)
```

## Security

- ✅ Permission checks on every page load
- ✅ Cannot access project by guessing URL
- ✅ 403 Forbidden if user tries `/projects/project/3` without access
- ✅ API endpoints filter results by user role
- ✅ Session-based authentication

## Summary

**Before:** Manual project assignment needed after user registration

**Now:**
- ✅ Invite with project names in email
- ✅ User registers
- ✅ **Automatically assigned to invited projects**
- ✅ User logs in and sees only their projects
- ✅ Zero manual work needed!

This creates a seamless flow where invited users immediately have the right level of access without any additional admin work! 🎉
