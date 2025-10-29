# Notification System

This document describes the notification system implemented in Desa Wire.

## Overview

The notification system provides real-time updates for various activities across Projects, People, and Account management. It features a clean, modern interface with filtering capabilities similar to modern project management tools.

## Features

### Interface
- **Clean Design**: Matches the modern aesthetic of the main application
- **Filtering**: Filter by unread status, project, and notification type
- **Real-time Updates**: Notifications are updated dynamically
- **Responsive**: Works on desktop and mobile devices

### Notification Types
- **People**: User invitations, team member additions
- **Project**: Project updates, milestones, creation
- **Account**: Export completions, security updates
- **Tasks**: Task assignments and updates
- **Forms**: Form submissions
- **Alerts**: System alerts and maintenance notifications

### Filtering Options
- **Unread Only**: Show only unread notifications
- **Project Filter**: Filter by specific projects
- **Type Filter**: Filter by notification type (Plans, Tasks, Forms, People, Alerts, Project, Account)

## File Structure

```
/controllers/notificationController.js    # Notification business logic
/routes/notificationRoutes.js            # API routes for notifications
/notifications.ejs                       # Main notifications page
/public/js/notifications.js             # Shared notification utilities
```

## API Endpoints

### GET /notifications
Renders the notifications page with filtering interface.

### GET /notifications/api/notifications
Returns notification data with optional filtering:
- `unreadOnly=true`: Filter unread notifications only
- `type=Project`: Filter by notification type
- `project=ProjectName`: Filter by project name

### PATCH /notifications/:id/read
Marks a specific notification as read.

### PATCH /notifications/read-all
Marks all notifications as read.

### POST /notifications
Creates a new notification.

### DELETE /notifications/:id
Deletes a notification.

## Integration

The notification system is integrated into:
- **Projects Page**: Shows notifications when projects are created/updated
- **People Page**: Shows notifications when users are invited or exported
- **Account Page**: Shows account-related notifications
- **Header**: Notification bell with unread count badge

## Usage

### Creating Notifications
Use the `addNotification` function from the notification controller:

```javascript
notificationController.addNotification(
    'Notification Title',
    'Notification message',
    'Type', // People, Project, Account, etc.
    'ProjectName', // Optional project name
    'category' // Optional category
);
```

### Real-time Updates
The system automatically updates notification counts in the header and refreshes the notification list when actions are performed.

## Styling

The notification interface uses:
- Clean, modern design with proper spacing
- Color-coded notification types
- Smooth animations and transitions
- Responsive grid layout
- Consistent with the main application theme

## Future Enhancements

- Real-time WebSocket updates
- Email notifications
- Push notifications
- Notification preferences
- Bulk actions
- Archive functionality

