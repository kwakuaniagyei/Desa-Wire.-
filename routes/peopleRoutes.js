const express = require('express');
const router = express.Router();
const peopleController = require('../controllers/peopleController');

// Get all people
router.get('/', peopleController.getPeople);

// Get new users page
router.get('/new-users', peopleController.getNewUsers);

// API endpoint for people data
router.get('/api/people', peopleController.getPeopleData);

// Accept invitation page (must be before /:id route)
router.get('/accept-invitation', peopleController.getAcceptInvitation);

// Get single person
router.get('/:id', peopleController.getPersonById);

// Create new person
router.post('/', peopleController.createPerson);

// Update person
router.put('/:id', peopleController.updatePerson);

// Update person role (admin only)
router.patch('/:id/role', peopleController.updatePersonRole);

// Delete person
router.delete('/:id', peopleController.deletePerson);

// Export people to email
router.post('/export', peopleController.exportPeopleToEmail);

// Invite users to project
router.post('/invite-to-project', peopleController.inviteToProject);

// Process invitation acceptance
router.post('/accept-invitation', peopleController.processInvitationAcceptance);

module.exports = router;
