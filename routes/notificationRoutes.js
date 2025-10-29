const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Get notifications page
router.get('/', notificationController.getNotifications);

// API endpoint for notifications data
router.get('/api/notifications', notificationController.getNotificationsData);

// Get notification statistics
router.get('/api/stats', notificationController.getNotificationStats);

// Get single notification
router.get('/:id', notificationController.getNotificationById);

// Create new notification
router.post('/', notificationController.createNotification);

// Mark notification as read
router.patch('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;

