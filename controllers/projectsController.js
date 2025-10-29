// Projects Controller
const notificationController = require('./notificationController');
const { projectsDB, projectUsersDB } = require('../database/db');

// Helper function to get filtered projects based on user role
const getFilteredProjects = (userId, userRole) => {
    const allProjects = projectsDB.getAll();

    // If user is admin, return all projects
    if (userRole === 'admin') {
        return allProjects;
    }

    // For regular users, return only projects they're assigned to
    const userProjectIds = projectUsersDB.getProjectsByUser(userId);
    return allProjects.filter(project => userProjectIds.includes(project.id));
};

// Get all projects (filtered by user role)
const getProjects = (req, res) => {
    // Check if user is logged in
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }

    const userId = req.session.userId;
    const userRole = req.session.userRole || 'user';

    const filteredProjects = getFilteredProjects(userId, userRole);

    res.render('mainpage', {
        user: res.locals.loggedInUser, // Use logged-in user from middleware
        projects: filteredProjects
    });
};

// Get projects data (API endpoint - filtered by user role)
const getProjectsData = (req, res) => {
    // Check if user is logged in
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication required. Please log in.'
        });
    }

    const userId = req.session.userId;
    const userRole = req.session.userRole || 'user';

    const filteredProjects = getFilteredProjects(userId, userRole);

    res.json({
        status: 'success',
        projects: filteredProjects
    });
};

// Get single project (with permission check)
const getProjectById = (req, res) => {
    // Check if user is logged in
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }

    const projectId = req.params.id;
    const userId = req.session.userId;
    const userRole = req.session.userRole || 'user';

    const project = projectsDB.findById(projectId);

    if (!project) {
        return res.status(404).send('Project not found');
    }

    // Check if user has permission to view this project
    if (userRole !== 'admin') {
        const userProjectIds = projectUsersDB.getProjectsByUser(userId);
        if (!userProjectIds.includes(projectId)) {
            return res.status(403).send('Access denied: You do not have permission to view this project');
        }
    }

    // Get all projects the user has access to (for sidebar)
    const filteredProjects = getFilteredProjects(userId, userRole);

    res.render('project-view', {
        user: res.locals.loggedInUser,
        project: project,
        projectName: project.name,
        projects: filteredProjects
    });
};

// Create new project
const createProject = (req, res) => {
    const { name, type } = req.body;
    const userId = req.session?.userId;

    const newProject = {
        id: Date.now().toString(),
        name: name,
        type: type || '',
        members: 1, // Creator is the first member
        status: 'active',
        isFavorite: false,
        isStarred: false
    };

    projectsDB.create(newProject);

    // Automatically assign the creator to the project
    if (userId) {
        projectUsersDB.addUserToProject(userId, newProject.id);
    }

    // Add notification for project creation
    notificationController.addNotification(
        'Project created',
        `New project "${name}" has been created`,
        'Project',
        name,
        'creation'
    );

    res.json({
        status: 'success',
        message: 'Project created successfully',
        projectId: newProject.id,
        project: newProject
    });
};

// Update project
const updateProject = (req, res) => {
    const projectId = req.params.id;
    const { name, type, members, status } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (members !== undefined) updates.members = members;
    if (status) updates.status = status;

    const updatedProject = projectsDB.update(projectId, updates);

    if (updatedProject) {
        res.json({
            status: 'success',
            message: 'Project updated successfully',
            project: updatedProject
        });
    } else {
        res.status(404).json({ status: 'error', message: 'Project not found' });
    }
};

// Delete project
const deleteProject = (req, res) => {
    const projectId = req.params.id;
    const deleted = projectsDB.delete(projectId);

    if (deleted) {
        // Also remove all user associations with this project
        projectUsersDB.removeAllUsersFromProject(projectId);

        res.json({
            status: 'success',
            message: 'Project deleted successfully'
        });
    } else {
        res.status(404).json({ status: 'error', message: 'Project not found' });
    }
};

// Toggle favorite
const toggleFavorite = (req, res) => {
    const projectId = req.params.id;
    const project = projectsDB.findById(projectId);

    if (project) {
        const updatedProject = projectsDB.update(projectId, {
            isFavorite: !project.isFavorite
        });

        res.json({
            status: 'success',
            isFavorite: updatedProject.isFavorite
        });
    } else {
        res.status(404).json({ status: 'error', message: 'Project not found' });
    }
};

// Toggle star
const toggleStar = (req, res) => {
    const projectId = req.params.id;
    const project = projectsDB.findById(projectId);

    if (project) {
        const updatedProject = projectsDB.update(projectId, {
            isStarred: !project.isStarred
        });

        res.json({
            status: 'success',
            isStarred: updatedProject.isStarred
        });
    } else {
        res.status(404).json({ status: 'error', message: 'Project not found' });
    }
};

// Duplicate project
const duplicateProject = (req, res) => {
    const projectId = req.params.id;
    const project = projectsDB.findById(projectId);

    if (project) {
        const newProject = {
            ...project,
            id: Date.now().toString(),
            name: project.name + ' (Copy)',
            members: 0
        };

        projectsDB.create(newProject);

        res.json({
            status: 'success',
            message: 'Project duplicated successfully',
            project: newProject
        });
    } else {
        res.status(404).json({ status: 'error', message: 'Project not found' });
    }
};

// Add user to project
const addUserToProject = (req, res) => {
    const { userId, projectId } = req.body;

    if (!userId || !projectId) {
        return res.status(400).json({
            status: 'error',
            message: 'userId and projectId are required'
        });
    }

    const added = projectUsersDB.addUserToProject(parseInt(userId), projectId);

    if (added) {
        res.json({
            status: 'success',
            message: 'User added to project successfully'
        });
    } else {
        res.json({
            status: 'success',
            message: 'User already has access to this project'
        });
    }
};

// Remove user from project
const removeUserFromProject = (req, res) => {
    const { userId, projectId } = req.body;

    if (!userId || !projectId) {
        return res.status(400).json({
            status: 'error',
            message: 'userId and projectId are required'
        });
    }

    const removed = projectUsersDB.removeUserFromProject(parseInt(userId), projectId);

    if (removed) {
        res.json({
            status: 'success',
            message: 'User removed from project successfully'
        });
    } else {
        res.status(404).json({
            status: 'error',
            message: 'User-project relationship not found'
        });
    }
};

module.exports = {
    getProjects,
    getProjectsData,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    toggleFavorite,
    toggleStar,
    duplicateProject,
    addUserToProject,
    removeUserFromProject,
    projects: projectsDB.getAll() // Export projects for backward compatibility
};
