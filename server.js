require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3002;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname));
app.set('view cache', false); // Disable view caching during development

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'desa-wire-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    name: 'sessionId', // Custom cookie name
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    }
}));

// Serve static files (if any) with no-cache
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res) => {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
}));

// Middleware to disable caching for all HTML pages
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Middleware to add logged-in user to all views
app.use((req, res, next) => {
    // Debug logging
    if (req.path !== '/favicon.ico') {
        console.log(`\n=== REQUEST: ${req.path} ===`);
        console.log('Session ID:', req.sessionID);
        console.log('Session userName:', req.session?.userName);
        console.log('Session userEmail:', req.session?.userEmail);
        console.log('========================\n');
    }

    // Make user available to all templates
    res.locals.loggedInUser = {
        username: req.session?.userName || 'Guest',
        email: req.session?.userEmail || 'guest@desa.com',
        role: req.session?.userRole || 'user',
        id: req.session?.userId || null
    };
    next();
});

// Import routes and database
const authRoutes = require('./routes/authRoutes');
const projectsRoutes = require('./routes/projectsRoutes');
const peopleRoutes = require('./routes/peopleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const plansRoutes = require('./routes/plansRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const projectsController = require('./controllers/projectsController');
const accountController = require('./controllers/accountController');
const { plansDB } = require('./database/db');

// Define specific routes BEFORE the catch-all projects routes
app.get('/login', (req, res) => {
    res.render('login');
});

// Main page route
app.get('/main', (req, res) => {
    res.render('main_page');
});

app.get('/account', (req, res) => {
    res.render('account', {
        user: res.locals.loggedInUser // Use logged-in user from middleware
    });
});

// Plans route (formerly interface)
app.get('/plans', (req, res) => {
    // Check if user is logged in
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }

    // Get projects from database based on user permissions
    const { projectsDB, projectUsersDB } = require('./database/db');
    const userId = req.session.userId;
    const userRole = req.session.userRole || 'user';

    let userProjects;
    if (userRole === 'admin') {
        userProjects = projectsDB.getAll();
    } else {
        const userProjectIds = projectUsersDB.getProjectsByUser(userId);
        userProjects = projectsDB.getAll().filter(p => userProjectIds.includes(p.id));
    }

    res.render('interface', {
        user: res.locals.loggedInUser,
        projects: userProjects,
        projectName: 'Plans'
    });
});

// Keep /interface as alias for backward compatibility
app.get('/interface', (req, res) => {
    res.redirect('/plans');
});

// Specifications route
app.get('/specifications', (req, res) => {
    // Check if user is logged in
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }

    // Get projects from database based on user permissions
    const { projectsDB, projectUsersDB } = require('./database/db');
    const userId = req.session.userId;
    const userRole = req.session.userRole || 'user';

    let userProjects;
    if (userRole === 'admin') {
        userProjects = projectsDB.getAll();
    } else {
        const userProjectIds = projectUsersDB.getProjectsByUser(userId);
        userProjects = projectsDB.getAll().filter(p => userProjectIds.includes(p.id));
    }

    res.render('specifications', {
        user: res.locals.loggedInUser,
        projects: userProjects,
        projectName: 'Specifications'
    });
});

// Project-specific Plans route
app.get('/project/:id/plans', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }

    const projectId = req.params.id;
    const projectName = req.query.name || 'Project';
    const { projectsDB, projectUsersDB } = require('./database/db');
    const userId = req.session.userId;
    const userRole = req.session.userRole || 'user';

    // Check if user has permission to view this project
    const project = projectsDB.findById(projectId);
    if (!project) {
        return res.status(404).send('Project not found');
    }

    if (userRole !== 'admin') {
        const userProjectIds = projectUsersDB.getProjectsByUser(userId);
        if (!userProjectIds.includes(projectId)) {
            return res.status(403).send('Access denied');
        }
    }

    // Get all projects for sidebar
    let userProjects;
    if (userRole === 'admin') {
        userProjects = projectsDB.getAll();
    } else {
        const userProjectIds = projectUsersDB.getProjectsByUser(userId);
        userProjects = projectsDB.getAll().filter(p => userProjectIds.includes(p.id));
    }

    res.render('interface', {
        user: res.locals.loggedInUser,
        projects: userProjects,
        project: project,
        projectName: projectName,
        currentProjectId: projectId
    });
});

// Project-specific Specifications route
app.get('/project/:id/specifications', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }

    const projectId = req.params.id;
    const projectName = req.query.name || 'Project';
    const { projectsDB, projectUsersDB } = require('./database/db');
    const userId = req.session.userId;
    const userRole = req.session.userRole || 'user';

    // Check if user has permission to view this project
    const project = projectsDB.findById(projectId);
    if (!project) {
        return res.status(404).send('Project not found');
    }

    if (userRole !== 'admin') {
        const userProjectIds = projectUsersDB.getProjectsByUser(userId);
        if (!userProjectIds.includes(projectId)) {
            return res.status(403).send('Access denied');
        }
    }

    // Get all projects for sidebar
    let userProjects;
    if (userRole === 'admin') {
        userProjects = projectsDB.getAll();
    } else {
        const userProjectIds = projectUsersDB.getProjectsByUser(userId);
        userProjects = projectsDB.getAll().filter(p => userProjectIds.includes(p.id));
    }

    res.render('specifications', {
        user: res.locals.loggedInUser,
        projects: userProjects,
        project: project,
        projectName: projectName,
        currentProjectId: projectId
    });
});

// Project-specific Tasks route
app.get('/project/:id/tasks', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }

    const projectId = req.params.id;
    const projectName = req.query.name || 'Project';
    const { projectsDB, projectUsersDB } = require('./database/db');
    const userId = req.session.userId;
    const userRole = req.session.userRole || 'user';

    // Check if user has permission to view this project
    const project = projectsDB.findById(projectId);
    if (!project) {
        return res.status(404).send('Project not found');
    }

    if (userRole !== 'admin') {
        const userProjectIds = projectUsersDB.getProjectsByUser(userId);
        if (!userProjectIds.includes(projectId)) {
            return res.status(403).send('Access denied');
        }
    }

    res.render('task', {
        user: res.locals.loggedInUser,
        projectName: projectName,
        project: project,
        currentProjectId: projectId
    });
});

// Project-specific Photos route
app.get('/project/:id/photos', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }

    const projectId = req.params.id;
    const projectName = req.query.name || 'Project';
    const { projectsDB, projectUsersDB } = require('./database/db');
    const userId = req.session.userId;
    const userRole = req.session.userRole || 'user';

    // Check if user has permission to view this project
    const project = projectsDB.findById(projectId);
    if (!project) {
        return res.status(404).send('Project not found');
    }

    if (userRole !== 'admin') {
        const userProjectIds = projectUsersDB.getProjectsByUser(userId);
        if (!userProjectIds.includes(projectId)) {
            return res.status(403).send('Access denied');
        }
    }

    res.render('photos', {
        user: res.locals.loggedInUser,
        projectName: projectName,
        project: project,
        currentProjectId: projectId
    });
});

// Project-specific Forms route
app.get('/project/:id/forms', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }

    const projectId = req.params.id;
    const projectName = req.query.name || 'Project';
    const { projectsDB, projectUsersDB } = require('./database/db');
    const userId = req.session.userId;
    const userRole = req.session.userRole || 'user';

    // Check if user has permission to view this project
    const project = projectsDB.findById(projectId);
    if (!project) {
        return res.status(404).send('Project not found');
    }

    if (userRole !== 'admin') {
        const userProjectIds = projectUsersDB.getProjectsByUser(userId);
        if (!userProjectIds.includes(projectId)) {
            return res.status(403).send('Access denied');
        }
    }

    res.render('form', {
        user: res.locals.loggedInUser,
        projectName: projectName,
        project: project,
        currentProjectId: projectId
    });
});

// Project-specific Files route
app.get('/project/:id/files', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }

    const projectId = req.params.id;
    const projectName = req.query.name || 'Project';
    const { projectsDB, projectUsersDB } = require('./database/db');
    const userId = req.session.userId;
    const userRole = req.session.userRole || 'user';

    // Check if user has permission to view this project
    const project = projectsDB.findById(projectId);
    if (!project) {
        return res.status(404).send('Project not found');
    }

    if (userRole !== 'admin') {
        const userProjectIds = projectUsersDB.getProjectsByUser(userId);
        if (!userProjectIds.includes(projectId)) {
            return res.status(403).send('Access denied');
        }
    }

    res.render('files', {
        user: res.locals.loggedInUser,
        projectName: projectName,
        project: project,
        currentProjectId: projectId
    });
});

// Tasks route
app.get('/tasks', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }

    res.render('task', {
        user: res.locals.loggedInUser,
        projectName: 'Tasks'
    });
});

// Photos route
app.get('/photos', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }
    
    res.render('photos', {
        user: res.locals.loggedInUser,
        projectName: 'Photos'
    });
});

// Forms route
app.get('/forms', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }
    
    res.render('form', {
        user: res.locals.loggedInUser,
        projectName: 'Forms'
    });
});

// Files route
app.get('/files', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }

    res.render('files', {
        user: res.locals.loggedInUser,
        projectName: 'Files'
    });
});

// Main Plans route
app.get('/mainplan', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }

    try {
        const projectName = req.query.name || 'Plans';
        const projectId = req.query.projectId || null;
        const userId = req.session.userId;
        const userRole = req.session.userRole || 'user';

        // Get all projects, plans, and folders
        const { projectsDB, projectUsersDB, plansDB, foldersDB } = require('./database/db');
        const allProjects = projectsDB.getAll() || [];
        let projects = allProjects;

        // Filter projects based on user role
        if (userRole !== 'admin') {
            const userProjectIds = projectUsersDB.getProjectsByUser(userId) || [];
            projects = allProjects.filter(project => userProjectIds.includes(project.id));
        }

        // Get plans and folders for the selected project
        let plansList = [];
        let foldersList = [];
        if (projectId) {
            plansList = plansDB.getByProject(projectId) || [];
            foldersList = foldersDB.getByProject(projectId) || [];
        }

        res.render('mainplan', {
            user: res.locals.loggedInUser,
            projectName: projectName,
            projectId: projectId,
            projects: projects || [],
            plans: plansList,
            folders: foldersList
        });
    } catch (error) {
        console.error('Error in /mainplan route:', error);
        res.render('mainplan', {
            user: res.locals.loggedInUser,
            projectName: req.query.name || 'Plans',
            projectId: req.query.projectId || null,
            projects: [],
            plans: [],
            folders: []
        });
    }
});

// API endpoints (must be before the catch-all route)
const notificationController = require('./controllers/notificationController');
app.get('/api/projects', projectsController.getProjectsData);
app.get('/api/notifications', notificationController.getNotificationsData);
app.get('/api/account', accountController.getAccountData);
app.post('/api/account/settings', accountController.updateAccountSettings);
app.post('/api/account/password', accountController.changePassword);
app.post('/api/account/two-factor', accountController.toggleTwoFactor);

// Update plan details (Sheet # and Description, Rotation, Notes)
app.put('/api/plans/:id', (req, res) => {
    try {
        const planId = req.params.id;
        const { name, sheetNumber, description, rotation, notes } = req.body;

        console.log('📝 Updating plan:', planId, { name, sheetNumber, description, rotation, notes });

        // Build update object with only provided fields
        const updates = {};
        if (name) updates.name = name;
        if (sheetNumber) updates.sheetNumber = sheetNumber;
        if (description !== undefined) updates.description = description;
        if (rotation !== undefined) updates.rotation = rotation;
        if (notes !== undefined) updates.notes = notes;

        // Update using the database object
        const updatedPlan = plansDB.update(planId, updates);

        if (!updatedPlan) {
            console.error('❌ Plan not found:', planId);
            return res.json({ success: false, error: 'Plan not found' });
        }

        console.log('✅ Plan saved permanently to database:', planId, {
            name: updatedPlan.name,
            sheetNumber: updatedPlan.sheetNumber,
            description: updatedPlan.description,
            rotation: updatedPlan.rotation,
            notes: updatedPlan.notes
        });

        res.json({
            success: true,
            message: 'Plan updated successfully',
            plan: updatedPlan
        });
    } catch (error) {
        console.error('❌ Error updating plan:', error);
        res.json({ success: false, error: error.message });
    }
});

// Delete plan
app.delete('/api/plans/:id', (req, res) => {
    try {
        const planId = req.params.id;

        console.log('🗑️ Deleting plan:', planId);

        const success = plansDB.delete(planId);

        if (success) {
            console.log('✅ Plan deleted successfully:', planId);
            res.json({
                success: true,
                message: 'Plan deleted successfully'
            });
        } else {
            console.error('❌ Plan not found:', planId);
            res.json({ success: false, error: 'Plan not found' });
        }
    } catch (error) {
        console.error('❌ Error deleting plan:', error);
        res.json({ success: false, error: error.message });
    }
});

// Rotate plan and create version
app.post('/api/plans/:id/rotate', (req, res) => {
    try {
        const { id } = req.params;
        const { rotation, description, notes } = req.body;

        console.log('📐 Rotating plan:', id, 'to', rotation, 'degrees');

        // Update plan rotation in database
        const updatedPlan = plansDB.update(id, { rotation });

        if (!updatedPlan) {
            console.error('❌ Plan not found:', id);
            return res.json({ success: false, error: 'Plan not found' });
        }

        console.log('✅ Rotation saved:', id, rotation);

        res.json({
            success: true,
            message: 'Plan rotated and version created',
            plan: updatedPlan
        });
    } catch (error) {
        console.error('❌ Error rotating plan:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get version history
app.get('/api/plans/:id/versions', (req, res) => {
    try {
        const { id } = req.params;

        console.log('📚 Loading version history for plan:', id);

        // Get the plan to fetch its versions
        const plan = plansDB.getById(id);

        if (!plan) {
            console.error('❌ Plan not found:', id);
            return res.json({ success: false, error: 'Plan not found' });
        }

        // Return versions array (you can extend this to load from a versions table if needed)
        const versions = plan.versions || [];

        res.json({
            success: true,
            versions: versions
        });
    } catch (error) {
        console.error('❌ Error loading versions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new version
app.post('/api/plans/:id/versions', (req, res) => {
    try {
        const { id } = req.params;
        const { description, notes } = req.body;

        console.log('🆕 Creating new version for plan:', id);

        // Get current plan data
        const plan = plansDB.getById(id);

        if (!plan) {
            console.error('❌ Plan not found:', id);
            return res.status(404).json({ success: false, error: 'Plan not found' });
        }

        // Create version entry
        const newVersion = {
            id: Date.now().toString(),
            name: plan.name || 'desa wire.pdf',
            rotation: plan.rotation || 0,
            description: description || new Date().toISOString().split('T')[0],
            notes: notes || '--',
            preview: plan.preview || '/img/pdf-placeholder.png',
            uploadedBy: 'User',
            createdAt: new Date().toISOString()
        };

        // Add to versions array in plan
        if (!plan.versions) {
            plan.versions = [];
        }
        plan.versions.push(newVersion);

        // Update plan with versions
        plansDB.update(id, { versions: plan.versions });

        console.log('✅ New version created for plan:', id);

        res.json({
            success: true,
            message: 'New version created',
            versionId: newVersion.id
        });
    } catch (error) {
        console.error('❌ Error creating version:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update version
app.put('/api/plans/:id/versions/:versionId', (req, res) => {
    try {
        const { id, versionId } = req.params;
        const { description, notes } = req.body;

        console.log('📝 Updating version:', versionId, 'for plan:', id, { description, notes });

        // Get the plan
        const plan = plansDB.findById(id);

        if (!plan) {
            console.error('❌ Plan not found:', id);
            return res.status(404).json({ success: false, error: 'Plan not found' });
        }

        // Find and update the version
        if (plan.versions && Array.isArray(plan.versions)) {
            const versionIndex = plan.versions.findIndex(v => v.id === versionId);

            if (versionIndex !== -1) {
                // Version found, update it
                if (description !== undefined) plan.versions[versionIndex].description = description;
                if (notes !== undefined) plan.versions[versionIndex].notes = notes;

                plansDB.update(id, { versions: plan.versions });
                console.log('✅ Version updated for plan:', id);
                res.json({
                    success: true,
                    message: 'Version updated successfully',
                    version: plan.versions[versionIndex]
                });
            } else {
                console.error('❌ Version not found:', versionId);
                res.status(404).json({ success: false, error: 'Version not found' });
            }
        } else {
            console.error('❌ No versions found for plan:', id);
            res.status(404).json({ success: false, error: 'No versions available' });
        }
    } catch (error) {
        console.error('❌ Error updating version:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete version
app.delete('/api/plans/:id/versions/:versionId', (req, res) => {
    try {
        const { id, versionId } = req.params;

        console.log('🗑️ Deleting version:', versionId, 'from plan:', id);

        // Get the plan
        const plan = plansDB.findById(id);

        if (!plan) {
            console.error('❌ Plan not found:', id);
            return res.status(404).json({ success: false, error: 'Plan not found' });
        }

        // Find and remove the version
        if (plan.versions && Array.isArray(plan.versions)) {
            const initialLength = plan.versions.length;
            plan.versions = plan.versions.filter(v => v.id !== versionId);

            if (plan.versions.length < initialLength) {
                // Version was found and removed
                plansDB.update(id, { versions: plan.versions });
                console.log('✅ Version deleted for plan:', id);
                res.json({
                    success: true,
                    message: 'Version deleted successfully'
                });
            } else {
                console.error('❌ Version not found:', versionId);
                res.status(404).json({ success: false, error: 'Version not found' });
            }
        } else {
            console.error('❌ No versions found for plan:', id);
            res.status(404).json({ success: false, error: 'No versions available' });
        }
    } catch (error) {
        console.error('❌ Error deleting version:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Use routes (projects routes must come AFTER specific routes to avoid catching them)
app.use('/auth', authRoutes);
app.use('/auth', integrationRoutes);
app.use('/people', peopleRoutes);
app.use('/notifications', notificationRoutes);
app.use('/chat', chatRoutes);
app.use('/', plansRoutes);
app.use('/', projectsRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Desa Wire application running on http://localhost:${PORT}`);
    console.log('Available routes:');
    console.log(`  - http://localhost:${PORT}/login (authentication)`);
    console.log(`  - http://localhost:${PORT}/ (mainpage/projects)`);
    console.log(`  - http://localhost:${PORT}/people`);
    console.log(`  - http://localhost:${PORT}/notifications`);
    console.log(`  - http://localhost:${PORT}/account`);
    console.log(`  - http://localhost:${PORT}/chat (AI Assistant)`);
    console.log(`  - http://localhost:${PORT}/interface (New Interface)`);
    console.log(`  - http://localhost:${PORT}/mainplan (Main Plans View)`);
});
