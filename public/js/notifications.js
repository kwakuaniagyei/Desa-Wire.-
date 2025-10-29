// Shared notification utilities

// Load notifications and update badge count
async function loadNotifications() {
    try {
        const response = await fetch('/notifications/api/notifications');
        const result = await response.json();
        
        if (result.status === 'success') {
            updateNotificationBadge(result.unreadCount);
            return result.data;
        }
    } catch (error) {
        // Error loading notifications
    }
    return [];
}

// Update notification badge in header
function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Mark notification as read
async function markNotificationAsRead(notificationId) {
    try {
        const response = await fetch(`/notifications/${notificationId}/read`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            // Reload notifications to update count
            loadNotifications();
        }
    } catch (error) {
        // Error marking notification as read
    }
}

// Initialize notification system
function initNotifications() {
    // Load notifications on page load
    loadNotifications();
    
    // Set up periodic refresh (every 30 seconds)
    setInterval(loadNotifications, 30000);
}

// Export functions for use in other scripts
window.NotificationUtils = {
    loadNotifications,
    updateNotificationBadge,
    markNotificationAsRead,
    initNotifications
};

