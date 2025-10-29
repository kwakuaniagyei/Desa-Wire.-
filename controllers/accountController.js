// Account Controller

// Sample account data
const accountData = {
    user: {
        username: 'Stephen',
        email: 'stephen@desa.com',
        fullName: 'Stephen Aniagyei',
        role: 'Account Owner',
        company: 'Desa Glass',
        phone: '+1 (403) 555-0123',
        location: 'Canada',
        timezone: 'America/Edmonton',
        language: 'English',
        avatar: null
    },
    subscription: {
        plan: 'Professional',
        status: 'Active',
        billingCycle: 'Monthly',
        nextBillingDate: '2025-11-03',
        amount: 49.99,
        currency: 'USD'
    },
    usage: {
        projects: 2,
        users: 5,
        storage: '2.5 GB',
        storageLimit: '100 GB'
    },
    security: {
        twoFactorEnabled: false,
        lastPasswordChange: '2025-08-15',
        activeSessions: 1
    }
};

// Get account data (API endpoint)
const getAccountData = (req, res) => {
    res.json({
        status: 'success',
        data: accountData
    });
};

// Update account settings
const updateAccountSettings = (req, res) => {
    try {
        const { username, email, fullName, phone, timezone, language } = req.body;

        // Update user data
        if (username) accountData.user.username = username;
        if (email) accountData.user.email = email;
        if (fullName) accountData.user.fullName = fullName;
        if (phone) accountData.user.phone = phone;
        if (timezone) accountData.user.timezone = timezone;
        if (language) accountData.user.language = language;

        res.json({
            status: 'success',
            message: 'Account settings updated successfully',
            data: accountData
        });
    } catch (error) {
        console.error('Error updating account settings:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update account settings'
        });
    }
};

// Change password
const changePassword = (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // In a real app, verify current password and update to new one
        accountData.security.lastPasswordChange = new Date().toISOString().split('T')[0];

        res.json({
            status: 'success',
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to change password'
        });
    }
};

// Toggle two-factor authentication
const toggleTwoFactor = (req, res) => {
    try {
        accountData.security.twoFactorEnabled = !accountData.security.twoFactorEnabled;

        res.json({
            status: 'success',
            message: `Two-factor authentication ${accountData.security.twoFactorEnabled ? 'enabled' : 'disabled'} successfully`,
            twoFactorEnabled: accountData.security.twoFactorEnabled
        });
    } catch (error) {
        console.error('Error toggling two-factor authentication:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to toggle two-factor authentication'
        });
    }
};

module.exports = {
    getAccountData,
    updateAccountSettings,
    changePassword,
    toggleTwoFactor
};
