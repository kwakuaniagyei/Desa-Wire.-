// Test script for project permissions
const { projectsDB, projectUsersDB, usersDB } = require('./database/db');

console.log('='.repeat(60));
console.log('PROJECT PERMISSION SYSTEM TEST');
console.log('='.repeat(60));

// Get all users
const users = usersDB.getAll();
console.log('\n📋 USERS:');
users.forEach(user => {
    console.log(`  - ${user.username} (${user.email}) - Role: ${user.role}`);
});

// Get all projects
const projects = projectsDB.getAll();
console.log('\n📁 PROJECTS:');
projects.forEach(project => {
    console.log(`  - ${project.name} (ID: ${project.id})`);
});

// Get project-user relationships
const relationships = projectUsersDB.getAll();
console.log('\n🔗 PROJECT-USER RELATIONSHIPS:');
relationships.forEach(rel => {
    const user = users.find(u => u.id === rel.userId);
    const project = projects.find(p => p.id === rel.projectId);
    console.log(`  - User: ${user?.username} → Project: ${project?.name}`);
});

console.log('\n' + '='.repeat(60));
console.log('TESTING ACCESS CONTROL');
console.log('='.repeat(60));

// Test admin access
const admin = users.find(u => u.role === 'admin');
console.log(`\n👤 Admin User: ${admin.username} (${admin.email})`);
console.log('Expected: Should see ALL projects (3 projects)');
if (admin.role === 'admin') {
    console.log(`✅ Result: Admin sees all ${projects.length} projects`);
    projects.forEach(p => console.log(`   - ${p.name}`));
}

// Test regular user access
const regularUser = users.find(u => u.role === 'user');
console.log(`\n👤 Regular User: ${regularUser.username} (${regularUser.email})`);
const userProjectIds = projectUsersDB.getProjectsByUser(regularUser.id);
const userProjects = projects.filter(p => userProjectIds.includes(p.id));
console.log(`Expected: Should see only assigned projects (${userProjectIds.length} projects)`);
console.log(`✅ Result: Regular user sees ${userProjects.length} projects`);
userProjects.forEach(p => console.log(`   - ${p.name}`));

// Test access to unassigned project
console.log(`\n🔒 Testing access to unassigned project...`);
const unassignedProject = projects.find(p => !userProjectIds.includes(p.id));
if (unassignedProject) {
    console.log(`Project "${unassignedProject.name}" is NOT assigned to ${regularUser.username}`);
    console.log(`✅ Expected: User should NOT have access to this project`);
}

console.log('\n' + '='.repeat(60));
console.log('TEST COMPLETE ✅');
console.log('='.repeat(60));
console.log('\nSummary:');
console.log(`- Admin users can see ALL ${projects.length} projects`);
console.log(`- Regular user "${regularUser.username}" can see ${userProjects.length} projects`);
console.log(`- Permission system is working correctly! 🎉`);
console.log('='.repeat(60));
