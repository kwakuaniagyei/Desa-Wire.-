const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projectsController');

// Get all projects (mainpage)
router.get('/', projectsController.getProjects);

// Get single project
router.get('/project/:id', projectsController.getProjectById);

// Create new project
router.post('/create-project', projectsController.createProject);

// Update project
router.put('/:id', projectsController.updateProject);

// Delete project
router.delete('/:id', projectsController.deleteProject);

// Toggle favorite
router.post('/:id/favorite', projectsController.toggleFavorite);

// Toggle star
router.post('/:id/star', projectsController.toggleStar);

// Duplicate project
router.post('/:id/duplicate', projectsController.duplicateProject);

// Add user to project
router.post('/add-user', projectsController.addUserToProject);

// Remove user from project
router.post('/remove-user', projectsController.removeUserFromProject);

module.exports = router;
