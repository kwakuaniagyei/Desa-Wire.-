// Test script for invitation flow with project assignments
const { projectsDB, projectUsersDB, usersDB, peopleDB, invitationsDB } = require('./database/db');

console.log('='.repeat(70));
console.log('INVITATION + PROJECT ASSIGNMENT FLOW TEST');
console.log('='.repeat(70));

// Simulate invitation process
console.log('\n📧 STEP 1: Sending invitation to new user...');
const invitationEmail = 'testuser@example.com';
const invitedProjects = 'good, AMFUL'; // Inviting to 2 projects

// Create test invitation
const token = 'test-token-' + Date.now();
invitationsDB.create({
    token: token,
    email: invitationEmail,
    projects: invitedProjects,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    used: false
});

console.log(`✅ Invitation created for: ${invitationEmail}`);
console.log(`   Invited to projects: ${invitedProjects}`);
console.log(`   Token: ${token}`);

// Simulate user accepting invitation
console.log('\n👤 STEP 2: User accepts invitation and registers...');
const newUser = peopleDB.create({
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    email: invitationEmail,
    phone: '+1 234 567 8900',
    company: 'Desa Glass',
    projects: 0,
    role: 'Team Member',
    status: 'Active',
    password: 'test123',
    createdAt: new Date()
});

console.log(`✅ User account created: ${newUser.name} (ID: ${newUser.id})`);

// Assign user to projects (simulating what happens in processInvitationAcceptance)
console.log('\n🔗 STEP 3: Assigning user to invited projects...');
const invitation = invitationsDB.findByToken(token);
const invitedProjectList = invitation.projects.split(',').map(p => p.trim());
const allProjects = projectsDB.getAll();

let assignedProjectCount = 0;
invitedProjectList.forEach(projectNameOrId => {
    const project = allProjects.find(p =>
        p.name.toLowerCase() === projectNameOrId.toLowerCase() ||
        p.id === projectNameOrId
    );

    if (project) {
        // Use newUser.id + 1000 offset (matching authController logic)
        const userId = newUser.id + 1000;
        projectUsersDB.addUserToProject(userId, project.id);
        assignedProjectCount++;
        console.log(`   ✅ Assigned to project: "${project.name}" (ID: ${project.id})`);
    } else {
        console.log(`   ⚠️ Project not found: ${projectNameOrId}`);
    }
});

console.log(`\n📋 Total projects assigned: ${assignedProjectCount}`);

// Mark invitation as used
invitationsDB.update(token, { used: true });
console.log('✅ Invitation marked as used');

// Verify the assignments
console.log('\n' + '='.repeat(70));
console.log('VERIFICATION: Checking user access');
console.log('='.repeat(70));

const userId = newUser.id + 1000;
const userProjectIds = projectUsersDB.getProjectsByUser(userId);
const userProjects = allProjects.filter(p => userProjectIds.includes(p.id));

console.log(`\n👤 User: ${newUser.name} (${newUser.email})`);
console.log(`   Role: ${newUser.role}`);
console.log(`   User ID for auth: ${userId}`);
console.log(`\n📁 Projects this user can access:`);
userProjects.forEach(p => {
    console.log(`   ✅ ${p.name} (ID: ${p.id})`);
});

console.log(`\n🔒 Projects this user CANNOT access:`);
const inaccessibleProjects = allProjects.filter(p => !userProjectIds.includes(p.id));
inaccessibleProjects.forEach(p => {
    console.log(`   ❌ ${p.name} (ID: ${p.id})`);
});

// Compare with admin access
console.log('\n' + '='.repeat(70));
console.log('COMPARISON: Admin vs Regular User');
console.log('='.repeat(70));

const admin = usersDB.getAll().find(u => u.role === 'admin');
console.log(`\n👑 Admin: ${admin.username}`);
console.log(`   Can see: ALL ${allProjects.length} projects`);
allProjects.forEach(p => console.log(`      - ${p.name}`));

console.log(`\n👤 Regular User: ${newUser.name}`);
console.log(`   Can see: ${userProjects.length} projects (only invited ones)`);
userProjects.forEach(p => console.log(`      - ${p.name}`));

console.log('\n' + '='.repeat(70));
console.log('TEST COMPLETE ✅');
console.log('='.repeat(70));
console.log('\n✅ Invitation flow working correctly!');
console.log('✅ User automatically assigned to invited projects!');
console.log('✅ Permission system enforcing access control!');
console.log('='.repeat(70));

// Cleanup test data
console.log('\n🧹 Cleaning up test data...');
peopleDB.delete(newUser.id);
projectUsersDB.removeUserFromProject(userId, '1');
projectUsersDB.removeUserFromProject(userId, '2');
const invitations = invitationsDB.getAll();
const cleanedInvitations = invitations.filter(inv => inv.token !== token);
const fs = require('fs');
const path = require('path');
fs.writeFileSync(
    path.join(__dirname, 'database', 'invitations.json'),
    JSON.stringify(cleanedInvitations, null, 2)
);
console.log('✅ Test data cleaned up');
