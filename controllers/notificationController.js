// Notification Controller
const projectsController = require('./projectsController');

// Sample notifications data - replace with database queries later
let notifications = [
    {
        id: 1,
        title: 'New user invited',
        message: 'Michael Murray has been invited to project AMFUL',
        time: '5 minutes ago',
        unread: true,
        type: 'People',
        project: 'AMFUL',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        category: 'invitation'
    },
    {
        id: 2,
        title: 'Project updated',
        message: 'Sample project - MPE has been updated with new members',
        time: '1 hour ago',
        unread: true,
        type: 'Project',
        project: 'Sample project - MPE',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        category: 'update'
    },
    {
        id: 3,
        title: 'Export completed',
        message: 'User list export has been sent to your email',
        time: '2 hours ago',
        unread: true,
        type: 'Account',
        project: null,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        category: 'export'
    },
    {
        id: 4,
        title: 'Task assigned',
        message: 'New task "Review design mockups" has been assigned to you',
        time: '3 hours ago',
        unread: false,
        type: 'Tasks',
        project: 'AMFUL',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        category: 'task'
    },
    {
        id: 5,
        title: 'Form submitted',
        message: 'Safety inspection form has been submitted by John Doe',
        time: '1 day ago',
        unread: false,
        type: 'Forms',
        project: 'Sample project - MPE',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        category: 'form'
    },
    {
        id: 6,
        title: 'System alert',
        message: 'Scheduled maintenance will occur tomorrow at 2 AM',
        time: '2 days ago',
        unread: false,
        type: 'Alerts',
        project: null,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'alert'
    },
    {
        id: 7,
        title: 'Project milestone reached',
        message: 'AMFUL project has reached 75% completion',
        time: '3 hours ago',
        unread: true,
        type: 'Project',
        project: 'AMFUL',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        category: 'milestone'
    },
    {
        id: 8,
        title: 'Team member added',
        message: 'Sarah Johnson has been added to Sample project - MPE',
        time: '4 hours ago',
        unread: true,
        type: 'People',
        project: 'Sample project - MPE',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        category: 'team'
    },
    {
        id: 9,
        title: 'Security update',
        message: 'Two-factor authentication has been enabled for your account',
        time: '1 day ago',
        unread: false,
        type: 'Account',
        project: null,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        category: 'security'
    }
];

// Get all notifications (render page)
const getNotifications = (req, res) => {
    // Get projects from the controller
    const userProjects = projectsController.projects || [];

    console.log('Notifications being rendered:', notifications.length);

    res.render('notifications', {
        user: {
            username: 'Stephen',
            email: 'stephen@desa.com'
        },
        notifications: notifications,
        projects: userProjects
    });
};

// Get notifications data (API endpoint)
const getNotificationsData = (req, res) => {
    const { unreadOnly, type, project } = req.query;
    
    let filteredNotifications = [...notifications];
    
    // Filter by unread only
    if (unreadOnly === 'true') {
        filteredNotifications = filteredNotifications.filter(n => n.unread);
    }
    
    // Filter by type
    if (type && type !== 'all') {
        filteredNotifications = filteredNotifications.filter(n => n.type === type);
    }
    
    // Filter by project
    if (project && project !== 'all') {
        filteredNotifications = filteredNotifications.filter(n => n.project === project);
    }
    
    // Sort by timestamp (newest first)
    filteredNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
        status: 'success',
        data: filteredNotifications,
        total: notifications.length,
        unreadCount: notifications.filter(n => n.unread).length
    });
};

// Get single notification
const getNotificationById = (req, res) => {
    const notificationId = parseInt(req.params.id);
    const notification = notifications.find(n => n.id === notificationId);

    if (notification) {
        res.json({ status: 'success', notification: notification });
    } else {
        res.status(404).json({ status: 'error', message: 'Notification not found' });
    }
};

// Create new notification
const createNotification = (req, res) => {
    const { title, message, type, project, category } = req.body;

    const newNotification = {
        id: notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1,
        title: title,
        message: message,
        time: 'Just now',
        unread: true,
        type: type || 'General',
        project: project || null,
        timestamp: new Date().toISOString(),
        category: category || 'general'
    };

    notifications.unshift(newNotification); // Add to beginning

    res.json({
        status: 'success',
        message: 'Notification created successfully',
        notificationId: newNotification.id,
        notification: newNotification
    });
};

// Mark notification as read
const markAsRead = (req, res) => {
    const notificationId = parseInt(req.params.id);
    const notification = notifications.find(n => n.id === notificationId);

    if (notification) {
        notification.unread = false;
        res.json({
            status: 'success',
            message: 'Notification marked as read',
            notification: notification
        });
    } else {
        res.status(404).json({ status: 'error', message: 'Notification not found' });
    }
};

// Mark all notifications as read
const markAllAsRead = (req, res) => {
    notifications.forEach(notification => {
        notification.unread = false;
    });

    res.json({
        status: 'success',
        message: 'All notifications marked as read',
        unreadCount: 0
    });
};

// Delete notification
const deleteNotification = (req, res) => {
    const notificationId = parseInt(req.params.id);
    const notificationIndex = notifications.findIndex(n => n.id === notificationId);

    if (notificationIndex !== -1) {
        notifications.splice(notificationIndex, 1);
        res.json({
            status: 'success',
            message: 'Notification deleted successfully'
        });
    } else {
        res.status(404).json({ status: 'error', message: 'Notification not found' });
    }
};

// Get notification statistics
const getNotificationStats = (req, res) => {
    const stats = {
        total: notifications.length,
        unread: notifications.filter(n => n.unread).length,
        byType: {},
        byProject: {},
        recent: notifications.slice(0, 5)
    };

    // Count by type
    notifications.forEach(notification => {
        stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
        if (notification.project) {
            stats.byProject[notification.project] = (stats.byProject[notification.project] || 0) + 1;
        }
    });

    res.json({
        status: 'success',
        stats: stats
    });
};

// Helper function to add notification (for other controllers to use)
const addNotification = (title, message, type, project = null, category = 'general') => {
    const newNotification = {
        id: notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1,
        title: title,
        message: message,
        time: 'Just now',
        unread: true,
        type: type,
        project: project,
        timestamp: new Date().toISOString(),
        category: category
    };

    notifications.unshift(newNotification);
    return newNotification;
};

module.exports = {
    getNotifications,
    getNotificationsData,
    getNotificationById,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationStats,
    addNotification,
    notifications // Export notifications array for other modules to access
};
