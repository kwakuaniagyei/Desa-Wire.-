// Simple JSON-based database for data persistence
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname);

// Helper function to read JSON file
const readJSON = (filename) => {
    try {
        const filePath = path.join(DB_DIR, filename);
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return null;
    }
};

// Helper function to write JSON file
const writeJSON = (filename, data) => {
    try {
        const filePath = path.join(DB_DIR, filename);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Error writing ${filename}:`, error);
        return false;
    }
};

// Initialize database files if they don't exist
const initializeDB = () => {
    // Initialize users.json with default users
    if (!fs.existsSync(path.join(DB_DIR, 'users.json'))) {
        const defaultUsers = [
            {
                id: 1,
                email: 'it@desa.ca',
                password: 'desa123',
                username: 'IT Admin',
                role: 'admin',
                status: 'active'
            },
            {
                id: 2,
                email: 'admin@desa.ca',
                password: 'admin123',
                username: 'Administrator',
                role: 'admin',
                status: 'active'
            },
            {
                id: 3,
                email: 'user@desa.ca',
                password: 'user123',
                username: 'Regular User',
                role: 'user',
                status: 'active'
            }
        ];
        writeJSON('users.json', defaultUsers);
        console.log('✅ Initialized users.json');
    }

    // Initialize people.json with sample people
    if (!fs.existsSync(path.join(DB_DIR, 'people.json'))) {
        const defaultPeople = [
            {
                id: 1,
                name: 'Michael Murray',
                email: 'mmurray@desa.ca',
                company: 'Desa Glass',
                phone: '+1 (403) 796-2517',
                projects: 29,
                role: 'Account owner',
                status: 'Active'
            },
            {
                id: 2,
                name: 'Damien Kelly',
                email: 'dkelly@desa.ca',
                company: 'Desa Glass',
                phone: '+1 (587) 223-5116',
                projects: 73,
                role: 'Account manager',
                status: 'Active'
            },
            {
                id: 3,
                name: 'Sarah Johnson',
                email: 'sjohnson@desa.ca',
                company: 'Desa Glass',
                phone: '+1 (403) 555-0123',
                projects: 15,
                role: 'Project manager',
                status: 'Active'
            },
            {
                id: 4,
                name: 'David Chen',
                email: 'dchen@desa.ca',
                company: 'Desa Glass',
                phone: '+1 (403) 555-0456',
                projects: 42,
                role: 'Senior developer',
                status: 'Active'
            },
            {
                id: 5,
                name: 'Emily Rodriguez',
                email: 'erodriguez@desa.ca',
                company: 'Desa Glass',
                phone: '+1 (403) 555-0789',
                projects: 8,
                role: 'Designer',
                status: 'Active'
            }
        ];
        writeJSON('people.json', defaultPeople);
        console.log('✅ Initialized people.json');
    }

    // Initialize invitations.json
    if (!fs.existsSync(path.join(DB_DIR, 'invitations.json'))) {
        writeJSON('invitations.json', []);
        console.log('✅ Initialized invitations.json');
    }

    // Initialize projects.json
    if (!fs.existsSync(path.join(DB_DIR, 'projects.json'))) {
        const defaultProjects = [
            {
                id: '1',
                name: 'good',
                type: 'Construction',
                members: 12,
                status: 'active',
                isFavorite: false,
                isStarred: false
            },
            {
                id: '2',
                name: 'AMFUL',
                type: 'CANA',
                members: 11,
                status: 'active',
                isFavorite: false,
                isStarred: false
            },
            {
                id: '3',
                name: 'Sample project - MPE',
                type: '',
                members: 7,
                status: 'active',
                isFavorite: false,
                isStarred: false
            }
        ];
        writeJSON('projects.json', defaultProjects);
        console.log('✅ Initialized projects.json');
    }

    // Initialize project-users.json (relationship table)
    if (!fs.existsSync(path.join(DB_DIR, 'project-users.json'))) {
        // Sample relationships: user ID 3 (regular user) has access to projects 1 and 2
        const defaultProjectUsers = [
            { userId: 3, projectId: '1' },
            { userId: 3, projectId: '2' }
        ];
        writeJSON('project-users.json', defaultProjectUsers);
        console.log('✅ Initialized project-users.json');
    }

    // Initialize plans.json
    if (!fs.existsSync(path.join(DB_DIR, 'plans.json'))) {
        writeJSON('plans.json', []);
        console.log('✅ Initialized plans.json');
    }

    // Initialize folders.json
    if (!fs.existsSync(path.join(DB_DIR, 'folders.json'))) {
        writeJSON('folders.json', []);
        console.log('✅ Initialized folders.json');
    }

    // Initialize specifications.json
    if (!fs.existsSync(path.join(DB_DIR, 'specifications.json'))) {
        writeJSON('specifications.json', []);
        console.log('✅ Initialized specifications.json');
    }
};

// Database operations for Users
const usersDB = {
    getAll: () => readJSON('users.json') || [],

    findById: (id) => {
        const users = usersDB.getAll();
        return users.find(u => u.id === id);
    },

    findByEmail: (email) => {
        const users = usersDB.getAll();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase());
    },

    create: (user) => {
        const users = usersDB.getAll();
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        const newUser = { id: newId, ...user };
        users.push(newUser);
        writeJSON('users.json', users);
        return newUser;
    },

    update: (id, updates) => {
        const users = usersDB.getAll();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            writeJSON('users.json', users);
            return users[index];
        }
        return null;
    },

    delete: (id) => {
        const users = usersDB.getAll();
        const filtered = users.filter(u => u.id !== id);
        writeJSON('users.json', filtered);
        return filtered.length < users.length;
    }
};

// Database operations for People
const peopleDB = {
    getAll: () => readJSON('people.json') || [],

    findById: (id) => {
        const people = peopleDB.getAll();
        return people.find(p => p.id === id);
    },

    findByEmail: (email) => {
        const people = peopleDB.getAll();
        return people.find(p => p.email.toLowerCase() === email.toLowerCase());
    },

    create: (person) => {
        const people = peopleDB.getAll();
        const newId = people.length > 0 ? Math.max(...people.map(p => p.id)) + 1 : 1;
        const newPerson = { id: newId, ...person };
        people.push(newPerson);
        writeJSON('people.json', people);
        return newPerson;
    },

    update: (id, updates) => {
        const people = peopleDB.getAll();
        const index = people.findIndex(p => p.id === id);
        if (index !== -1) {
            people[index] = { ...people[index], ...updates };
            writeJSON('people.json', people);
            return people[index];
        }
        return null;
    },

    delete: (id) => {
        const people = peopleDB.getAll();
        const filtered = people.filter(p => p.id !== id);
        writeJSON('people.json', filtered);
        return filtered.length < people.length;
    }
};

// Database operations for Invitations
const invitationsDB = {
    getAll: () => readJSON('invitations.json') || [],

    findByToken: (token) => {
        const invitations = invitationsDB.getAll();
        return invitations.find(i => i.token === token);
    },

    create: (invitation) => {
        const invitations = invitationsDB.getAll();
        invitations.push(invitation);
        writeJSON('invitations.json', invitations);
        return invitation;
    },

    update: (token, updates) => {
        const invitations = invitationsDB.getAll();
        const index = invitations.findIndex(i => i.token === token);
        if (index !== -1) {
            invitations[index] = { ...invitations[index], ...updates };
            writeJSON('invitations.json', invitations);
            return invitations[index];
        }
        return null;
    },

    deleteExpired: () => {
        const invitations = invitationsDB.getAll();
        const now = new Date();
        const filtered = invitations.filter(i => new Date(i.expiresAt) > now);
        writeJSON('invitations.json', filtered);
        return invitations.length - filtered.length;
    }
};

// Database operations for Projects
const projectsDB = {
    getAll: () => readJSON('projects.json') || [],

    findById: (id) => {
        const projects = projectsDB.getAll();
        return projects.find(p => p.id === id);
    },

    create: (project) => {
        const projects = projectsDB.getAll();
        const newProject = { ...project };
        projects.push(newProject);
        writeJSON('projects.json', projects);
        return newProject;
    },

    update: (id, updates) => {
        const projects = projectsDB.getAll();
        const index = projects.findIndex(p => p.id === id);
        if (index !== -1) {
            projects[index] = { ...projects[index], ...updates };
            writeJSON('projects.json', projects);
            return projects[index];
        }
        return null;
    },

    delete: (id) => {
        const projects = projectsDB.getAll();
        const filtered = projects.filter(p => p.id !== id);
        writeJSON('projects.json', filtered);
        return filtered.length < projects.length;
    }
};

// Database operations for Project-User relationships
const projectUsersDB = {
    getAll: () => readJSON('project-users.json') || [],

    // Get all project IDs for a user
    getProjectsByUser: (userId) => {
        const relations = projectUsersDB.getAll();
        return relations
            .filter(r => r.userId === userId)
            .map(r => r.projectId);
    },

    // Get all user IDs for a project
    getUsersByProject: (projectId) => {
        const relations = projectUsersDB.getAll();
        return relations
            .filter(r => r.projectId === projectId)
            .map(r => r.userId);
    },

    // Add user to project
    addUserToProject: (userId, projectId) => {
        const relations = projectUsersDB.getAll();
        // Check if relationship already exists
        const exists = relations.some(r => r.userId === userId && r.projectId === projectId);
        if (!exists) {
            relations.push({ userId, projectId });
            writeJSON('project-users.json', relations);
            return true;
        }
        return false;
    },

    // Remove user from project
    removeUserFromProject: (userId, projectId) => {
        const relations = projectUsersDB.getAll();
        const filtered = relations.filter(r => !(r.userId === userId && r.projectId === projectId));
        writeJSON('project-users.json', filtered);
        return filtered.length < relations.length;
    },

    // Remove all users from a project
    removeAllUsersFromProject: (projectId) => {
        const relations = projectUsersDB.getAll();
        const filtered = relations.filter(r => r.projectId !== projectId);
        writeJSON('project-users.json', filtered);
        return true;
    }
};

// Database operations for Plans/Files
const plansDB = {
    getAll: () => readJSON('plans.json') || [],

    findById: (id) => {
        const plans = plansDB.getAll();
        return plans.find(p => p.id === id);
    },

    getByProject: (projectId) => {
        const plans = plansDB.getAll();
        return plans.filter(p => p.projectId === projectId);
    },

    getByFolder: (folderId) => {
        const plans = plansDB.getAll();
        return plans.filter(p => p.folderId === folderId);
    },

    create: (plan) => {
        const plans = plansDB.getAll();
        const newPlan = { ...plan };
        plans.push(newPlan);
        writeJSON('plans.json', plans);
        return newPlan;
    },

    update: (id, updates) => {
        const plans = plansDB.getAll();
        const index = plans.findIndex(p => p.id === id);
        if (index !== -1) {
            plans[index] = { ...plans[index], ...updates };
            writeJSON('plans.json', plans);
            return plans[index];
        }
        return null;
    },

    delete: (id) => {
        const plans = plansDB.getAll();
        const filtered = plans.filter(p => p.id !== id);
        writeJSON('plans.json', filtered);
        return filtered.length < plans.length;
    },

    deleteMany: (ids) => {
        const plans = plansDB.getAll();
        const filtered = plans.filter(p => !ids.includes(p.id));
        writeJSON('plans.json', filtered);
        return plans.length - filtered.length;
    }
};

// Database operations for Folders
const foldersDB = {
    getAll: () => readJSON('folders.json') || [],

    findById: (id) => {
        const folders = foldersDB.getAll();
        return folders.find(f => f.id === id);
    },

    getByProject: (projectId) => {
        const folders = foldersDB.getAll();
        return folders.filter(f => f.projectId === projectId);
    },

    create: (folder) => {
        const folders = foldersDB.getAll();
        const newFolder = { ...folder };
        folders.push(newFolder);
        writeJSON('folders.json', folders);
        return newFolder;
    },

    update: (id, updates) => {
        const folders = foldersDB.getAll();
        const index = folders.findIndex(f => f.id === id);
        if (index !== -1) {
            folders[index] = { ...folders[index], ...updates };
            writeJSON('folders.json', folders);
            return folders[index];
        }
        return null;
    },

    delete: (id) => {
        const folders = foldersDB.getAll();
        const filtered = folders.filter(f => f.id !== id);
        writeJSON('folders.json', filtered);
        return filtered.length < folders.length;
    }
};

// Database operations for Specifications
const specificationsDB = {
    getAll: () => readJSON('specifications.json') || [],

    findById: (id) => {
        const specs = specificationsDB.getAll();
        return specs.find(s => s.id === id);
    },

    getByProject: (projectId) => {
        const specs = specificationsDB.getAll();
        return specs.filter(s => s.projectId === projectId);
    },

    create: (spec) => {
        const specs = specificationsDB.getAll();
        const newSpec = { ...spec };
        specs.push(newSpec);
        writeJSON('specifications.json', specs);
        return newSpec;
    },

    update: (id, updates) => {
        const specs = specificationsDB.getAll();
        const index = specs.findIndex(s => s.id === id);
        if (index !== -1) {
            specs[index] = { ...specs[index], ...updates };
            writeJSON('specifications.json', specs);
            return specs[index];
        }
        return null;
    },

    delete: (id) => {
        const specs = specificationsDB.getAll();
        const filtered = specs.filter(s => s.id !== id);
        writeJSON('specifications.json', filtered);
        return filtered.length < specs.length;
    },

    deleteMany: (ids) => {
        const specs = specificationsDB.getAll();
        const filtered = specs.filter(s => !ids.includes(s.id));
        writeJSON('specifications.json', filtered);
        return specs.length - filtered.length;
    }
};

// Initialize database on module load
initializeDB();

module.exports = {
    usersDB,
    peopleDB,
    invitationsDB,
    projectsDB,
    projectUsersDB,
    plansDB,
    foldersDB,
    specificationsDB,
    initializeDB
};
