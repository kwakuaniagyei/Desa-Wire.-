// Authentication Controller
const peopleController = require('./peopleController');
const { usersDB } = require('../database/db');

// Helper function to get all users (including invited users from people)
const getAllUsers = () => {
    // Get default users from database
    const defaultUsers = usersDB.getAll();

    // Get invited users from people database
    const invitedUsers = peopleController.getPeopleArray()
        .filter(person => person.password) // Only include people with passwords (invited users)
        .map(person => ({
            id: person.id + 1000, // Offset IDs to avoid conflicts
            email: person.email,
            password: person.password,
            username: person.name,
            role: person.role || 'user',
            status: person.status?.toLowerCase() || 'active'
        }));

    return [...defaultUsers, ...invitedUsers];
};

// Login function
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user by email (check both default users and invited users)
        const allUsers = getAllUsers();
        const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password (in production, use bcrypt to compare hashed passwords)
        if (user.password !== password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Account is inactive. Please contact support.'
            });
        }

        // Create session (in production, use proper session management)
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        req.session.userName = user.username;
        req.session.userRole = user.role;

        // Log successful login
        console.log(`===== LOGIN SUCCESSFUL =====`);
        console.log(`User: ${user.email}`);
        console.log(`Username: ${user.username}`);
        console.log(`Role: ${user.role}`);
        console.log(`Session ID: ${req.sessionID}`);
        console.log(`Session data:`, req.session);
        console.log(`Time: ${new Date().toISOString()}`);
        console.log(`============================`);

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Logout function
const logout = (req, res) => {
    try {
        // Clear session
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destruction error:', err);
                }
            });
        }

        console.log(`===== LOGOUT =====`);
        console.log(`Time: ${new Date().toISOString()}`);
        console.log(`==================`);

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get current user
const getCurrentUser = (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        // Find user from all users (including invited users)
        const allUsers = getAllUsers();
        const user = allUsers.find(u => u.id === req.session.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    next();
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    const user = users.find(u => u.id === req.session.userId);
    if (!user || user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

module.exports = {
    login,
    logout,
    getCurrentUser,
    requireAuth,
    requireAdmin
};
