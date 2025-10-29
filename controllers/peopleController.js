// People Controller
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const projectsController = require('./projectsController');
const notificationController = require('./notificationController');
const { peopleDB, invitationsDB, usersDB, projectsDB, projectUsersDB } = require('../database/db');

// Sample people data - replaced with database
let people = [
    {
        id: 1,
        name: 'Michael Murray',
        email: 'mmurray@desa.ca',
        company: 'Desa Glass',
        phone: '+1 (403) 796-2517',
        projects: 29,
        role: 'Account owner',
        status: 'Active'
    },
    {
        id: 2,
        name: 'Damien Kelly',
        email: 'dkelly@desa.ca',
        company: 'Desa Glass',
        phone: '+1 (587) 223-5116',
        projects: 73,
        role: 'Account manager',
        status: 'Active'
    },
    {
        id: 3,
        name: 'Sarah Johnson',
        email: 'sjohnson@desa.ca',
        company: 'Desa Glass',
        phone: '+1 (403) 555-0123',
        projects: 15,
        role: 'Project manager',
        status: 'Active'
    },
    {
        id: 4,
        name: 'David Chen',
        email: 'dchen@desa.ca',
        company: 'Desa Glass',
        phone: '+1 (403) 555-0456',
        projects: 42,
        role: 'Senior developer',
        status: 'Active'
    },
    {
        id: 5,
        name: 'Emily Rodriguez',
        email: 'erodriguez@desa.ca',
        company: 'Desa Glass',
        phone: '+1 (403) 555-0789',
        projects: 8,
        role: 'Designer',
        status: 'Active'
    }
];

// Get all people (render page)
const getPeople = (req, res) => {
    const { projectsDB } = require('../database/db');

    // Get all projects from database
    const allProjects = projectsDB.getAll();

    // Get people from database
    const people = peopleDB.getAll();

    // Update project counts dynamically based on actual assignments
    const peopleWithProjectCounts = people.map(person => {
        // Calculate actual project count from project-users table
        const userId = person.id + 1000; // People DB users have +1000 offset
        const assignedProjectIds = projectUsersDB.getProjectsByUser(userId);

        return {
            ...person,
            projects: assignedProjectIds.length // Update with actual count
        };
    });

    console.log('Projects being passed to people page:', allProjects);

    res.render('people', {
        user: res.locals.loggedInUser, // Use logged-in user from middleware
        people: peopleWithProjectCounts,
        projects: allProjects  // Pass projects to the people page
    });
};

// Get new users (render page)
const getNewUsers = (req, res) => {
    // Get people from database
    const people = peopleDB.getAll();

    // Filter users added in the last 30 days (for demo, we'll show users with no projects or low project count)
    const newUsers = people.filter(p => p.projects < 20);

    res.render('new-users', {
        user: res.locals.loggedInUser, // Use logged-in user from middleware
        newUsers: newUsers
    });
};

// Get people data (API endpoint)
const getPeopleData = (req, res) => {
    const people = peopleDB.getAll();

    // Update project counts dynamically based on actual assignments
    const peopleWithProjectCounts = people.map(person => {
        // Calculate actual project count from project-users table
        const userId = person.id + 1000; // People DB users have +1000 offset
        const assignedProjectIds = projectUsersDB.getProjectsByUser(userId);

        return {
            ...person,
            projects: assignedProjectIds.length // Update with actual count
        };
    });

    res.json({
        status: 'success',
        data: peopleWithProjectCounts
    });
};

// Get single person
const getPersonById = (req, res) => {
    const personId = parseInt(req.params.id);
    const person = peopleDB.findById(personId);

    if (person) {
        res.json({ status: 'success', person: person });
    } else {
        res.status(404).json({ status: 'error', message: 'Person not found' });
    }
};

// Create new person
const createPerson = (req, res) => {
    const { name, email, role, status } = req.body;

    const newPerson = peopleDB.create({
        name: name,
        email: email,
        role: role || 'Team Member',
        status: status || 'Active'
    });

    res.json({
        status: 'success',
        message: 'Person created successfully',
        personId: newPerson.id,
        person: newPerson
    });
};

// Update person
const updatePerson = (req, res) => {
    const personId = parseInt(req.params.id);
    const { name, email, role, status } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (status) updates.status = status;

    const updatedPerson = peopleDB.update(personId, updates);

    if (updatedPerson) {
        res.json({
            status: 'success',
            message: 'Person updated successfully',
            person: updatedPerson
        });
    } else {
        res.status(404).json({ status: 'error', message: 'Person not found' });
    }
};

// Update person role (admin only)
const updatePersonRole = (req, res) => {
    // Check if user is admin
    if (!req.session || req.session.userRole !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'Admin access required to change roles'
        });
    }

    const personId = parseInt(req.params.id);
    const { role } = req.body;

    if (!role) {
        return res.status(400).json({
            status: 'error',
            message: 'Role is required'
        });
    }

    console.log(`\n====== ROLE UPDATE REQUEST ======`);
    console.log(`Admin: ${req.session.userEmail}`);
    console.log(`Person ID: ${personId}`);
    console.log(`New Role: ${role}`);

    const person = peopleDB.findById(personId);

    if (!person) {
        return res.status(404).json({
            status: 'error',
            message: 'Person not found'
        });
    }

    const oldRole = person.role;
    const updatedPerson = peopleDB.update(personId, { role: role });

    console.log(`✅ Role updated for ${person.name} (${person.email})`);
    console.log(`   Old Role: ${oldRole}`);
    console.log(`   New Role: ${role}`);
    console.log(`=================================\n`);

    // Add notification for role change
    notificationController.addNotification(
        'Role updated',
        `${person.name}'s role has been changed from ${oldRole} to ${role}`,
        'People',
        null,
        'role-change'
    );

    // Send email notification to the user about role change
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Role Updated - DESA Wire</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f7f9;
                    line-height: 1.6;
                }
                .email-wrapper {
                    max-width: 600px;
                    margin: 40px auto;
                    background: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                }
                .header {
                    background: #1a202c;
                    padding: 30px 40px;
                    text-align: left;
                    border-bottom: 3px solid #f59e0b;
                }
                .logo {
                    color: #ffffff;
                    font-size: 24px;
                    font-weight: 600;
                    margin: 0;
                    letter-spacing: 0.5px;
                }
                .logo-badge {
                    display: inline-block;
                    background: #f59e0b;
                    color: #ffffff;
                    width: 40px;
                    height: 40px;
                    line-height: 40px;
                    text-align: center;
                    border-radius: 6px;
                    font-weight: 700;
                    font-size: 20px;
                    margin-right: 12px;
                    vertical-align: middle;
                }
                .content {
                    padding: 40px;
                    color: #2d3748;
                }
                .greeting {
                    font-size: 16px;
                    color: #2d3748;
                    margin-bottom: 24px;
                }
                .update-badge {
                    background: #fef3c7;
                    color: #92400e;
                    padding: 12px 20px;
                    border-radius: 6px;
                    font-weight: 600;
                    display: inline-block;
                    margin-bottom: 24px;
                }
                .intro {
                    font-size: 15px;
                    color: #4a5568;
                    margin-bottom: 28px;
                    line-height: 1.7;
                }
                .role-box {
                    background: #f7fafc;
                    border-left: 4px solid #f59e0b;
                    padding: 20px 24px;
                    margin: 28px 0;
                    border-radius: 4px;
                }
                .role-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #718096;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 12px;
                }
                .role-change {
                    font-size: 16px;
                    color: #2d3748;
                    margin: 8px 0;
                }
                .role-old {
                    text-decoration: line-through;
                    color: #a0aec0;
                }
                .role-new {
                    font-weight: 600;
                    color: #f59e0b;
                }
                .arrow {
                    color: #718096;
                    margin: 0 12px;
                }
                .info-box {
                    background: #ebf8ff;
                    border-left: 4px solid #3182ce;
                    padding: 20px 24px;
                    margin: 28px 0;
                    border-radius: 4px;
                }
                .info-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #2c5282;
                    margin-bottom: 8px;
                }
                .info-text {
                    font-size: 14px;
                    color: #4a5568;
                    margin: 0;
                }
                .cta-section {
                    text-align: center;
                    margin: 36px 0;
                }
                .cta-button {
                    display: inline-block;
                    background: #f59e0b;
                    color: #ffffff;
                    padding: 14px 32px;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 15px;
                    transition: background 0.3s;
                }
                .cta-button:hover {
                    background: #d97706;
                }
                .footer {
                    background: #f7fafc;
                    padding: 32px 40px;
                    text-align: center;
                    color: #718096;
                    font-size: 13px;
                    line-height: 1.8;
                }
                .footer-divider {
                    border: 0;
                    height: 1px;
                    background: #e2e8f0;
                    margin: 20px 0;
                }
                .company-info {
                    color: #2d3748;
                    font-weight: 600;
                    margin-bottom: 8px;
                }
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <div class="header">
                    <span class="logo-badge">D</span>
                    <h1 class="logo" style="display: inline; vertical-align: middle;">DESA Wire</h1>
                </div>

                <div class="content">
                    <div class="update-badge">🔔 Role Updated</div>

                    <div class="greeting">
                        Hello ${person.name},
                    </div>

                    <div class="intro">
                        Your account role has been updated by an administrator. This change may affect your access permissions and capabilities within the DESA Wire platform.
                    </div>

                    <div class="role-box">
                        <div class="role-label">Role Change</div>
                        <div class="role-change">
                            <span class="role-old">${oldRole}</span>
                            <span class="arrow">→</span>
                            <span class="role-new">${role}</span>
                        </div>
                    </div>

                    <div class="info-box">
                        <div class="info-label">What does this mean?</div>
                        <div class="info-text">
                            Your new role as <strong>${role}</strong> may grant you different permissions and access levels. Please log in to see any changes to your account.
                        </div>
                    </div>

                    <div class="cta-section">
                        <a href="http://localhost:3002/login" class="cta-button">Log In to Your Account</a>
                    </div>

                    <div class="intro">
                        If you have any questions about this change or your new permissions, please contact your administrator.
                    </div>
                </div>

                <div class="footer">
                    <div class="company-info">DESA Wire Project Management System</div>
                    <div>Secure Project Collaboration Platform</div>

                    <hr class="footer-divider">

                    <div style="font-size: 12px; color: #a0aec0;">
                        © ${new Date().getFullYear()} DESA. All rights reserved.<br>
                        This is an automated message from an unmonitored email address.
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    const plainText = `Role Updated - DESA Wire

Hello ${person.name},

Your account role has been updated by an administrator.

ROLE CHANGE:
${oldRole} → ${role}

WHAT DOES THIS MEAN?
Your new role as ${role} may grant you different permissions and access levels. Please log in to see any changes to your account.

Log in to your account: http://localhost:3002/login

If you have any questions about this change or your new permissions, please contact your administrator.

---
DESA Wire Project Management System
© ${new Date().getFullYear()} DESA. All rights reserved.`;

    // Send email asynchronously (don't block the response)
    sendEmail(
        person.email,
        `Your Role Has Been Updated - DESA Wire`,
        htmlContent,
        plainText
    ).then(() => {
        console.log(`📧 Role change email sent to ${person.email}`);
    }).catch((error) => {
        console.error(`❌ Failed to send role change email to ${person.email}:`, error.message);
    });

    res.json({
        status: 'success',
        message: `Role updated to ${role}`,
        person: updatedPerson
    });
};

// Delete person
const deletePerson = (req, res) => {
    const personId = parseInt(req.params.id);
    const deleted = peopleDB.delete(personId);

    if (deleted) {
        res.json({
            status: 'success',
            message: 'Person deleted successfully'
        });
    } else {
        res.status(404).json({ status: 'error', message: 'Person not found' });
    }
};

// Export people to email
const exportPeopleToEmail = async (req, res) => {
    console.log('========================================');
    console.log('EXPORT FUNCTION CALLED');
    console.log('Request body:', req.body);
    console.log('========================================');

    try {
        const { userEmail = 'stephen.aniagyei12345@gmail.com' } = req.body;

        console.log('Target email:', userEmail);

        // Get people from database
        const people = peopleDB.getAll();

        // Generate CSV content
        const csvContent = generateCSV(people);
        console.log('CSV generated, size:', csvContent.length);

        // Generate HTML content
        const htmlContent = generateHTML(people);

        // Check if SMTP is configured
        const smtpConfigured = process.env.SMTP_USER &&
                              process.env.SMTP_PASS &&
                              process.env.SMTP_USER !== 'your-email@gmail.com' &&
                              process.env.SMTP_PASS !== 'your-app-password' &&
                              process.env.SMTP_USER.length > 10 &&
                              process.env.SMTP_PASS.length > 10;

        console.log('SMTP Configuration Check:');
        console.log('- SMTP_USER:', process.env.SMTP_USER);
        console.log('- SMTP_PASS length:', process.env.SMTP_PASS?.length);
        console.log('- SMTP Configured:', smtpConfigured);

        if (!smtpConfigured) {
            // Simulate email sending
            await new Promise(resolve => setTimeout(resolve, 1500));

            console.log('===== EMAIL EXPORT SIMULATION =====');
            console.log(`To: ${userEmail}`);
            console.log(`Subject: Desa Wire - User List Export`);
            console.log(`Users exported: ${people.length}`);
            console.log(`CSV size: ${csvContent.length} bytes`);
            console.log(`HTML size: ${htmlContent.length} bytes`);
            console.log('Note: Configure SMTP in .env to send real emails');
            console.log('===================================');

            // Add notification for export
            notificationController.addNotification(
                'Export completed',
                'User list export has been sent to your email',
                'Account',
                null,
                'export'
            );

            res.json({
                status: 'success',
                message: 'User list exported successfully (simulated)',
                email: userEmail,
                exportedCount: people.length,
                note: 'Email sending is simulated. Configure SMTP credentials in .env for real emails.'
            });
            return;
        }

        // Configure nodemailer with SMTP settings from environment variables
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Verify transporter configuration
        await transporter.verify();
        console.log('SMTP connection verified successfully');

        const mailOptions = {
            from: {
                name: 'Desa Wire',
                address: process.env.EMAIL_FROM || 'noreply@desawire.com'
            },
            to: userEmail,
            subject: 'Desa Wire - User List Export',
            html: htmlContent,
            attachments: [
                {
                    filename: 'desa-wire-users.csv',
                    content: csvContent,
                    contentType: 'text/csv'
                }
            ]
        };

        // Send email
        console.log('Attempting to send email...');
        console.log(`From: ${process.env.EMAIL_FROM}`);
        console.log(`To: ${userEmail}`);

        const info = await transporter.sendMail(mailOptions);

        console.log('===== EMAIL SENT SUCCESSFULLY =====');
        console.log(`To: ${userEmail}`);
        console.log(`Subject: Desa Wire - User List Export`);
        console.log(`Users exported: ${people.length}`);
        console.log(`Message ID: ${info.messageId}`);
        console.log(`Accepted: ${info.accepted}`);
        console.log(`Rejected: ${info.rejected}`);
        console.log(`Response: ${info.response}`);
        console.log('===================================');

        // Add notification for export
        notificationController.addNotification(
            'Export completed',
            'User list export has been sent to your email',
            'Account',
            null,
            'export'
        );

        res.json({
            status: 'success',
            message: 'User list exported and sent to email successfully',
            email: userEmail,
            exportedCount: people.length,
            messageId: info.messageId
        });

    } catch (error) {
        console.error('Email export error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to send email export',
            error: error.message
        });
    }
};

// Generate CSV content
const generateCSV = (peopleData) => {
    const headers = ['Name', 'Email', 'Login Email', 'Username', 'Company', 'Phone', 'Projects', 'Account Role', 'Status'];
    const csvRows = [headers.join(',')];

    peopleData.forEach(person => {
        const row = [
            `"${person.name}"`,
            `"${person.email}"`,
            `"${person.email}"`, // Login Email (same as email)
            `"${person.firstName && person.lastName ? person.firstName + ' ' + person.lastName : person.name}"`, // Username
            `"${person.company}"`,
            `"${person.phone}"`,
            person.projects,
            `"${person.role}"`,
            `"${person.status}"`
        ];
        csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
};

// Generate HTML content
const generateHTML = (peopleData) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                .header h1 { margin: 0; font-size: 24px; }
                .header p { margin: 5px 0 0 0; opacity: 0.9; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
                th { background: #f7fafc; font-weight: 600; color: #2d3748; }
                tr:hover { background: #f8fafc; }
                .footer { margin-top: 30px; padding: 20px; background: #f7fafc; border-radius: 8px; text-align: center; color: #718096; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Desa Wire - User List Export</h1>
                <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Login Email</th>
                        <th>Username</th>
                        <th>Company</th>
                        <th>Phone</th>
                        <th>Projects</th>
                        <th>Account Role</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${peopleData.map(person => `
                        <tr>
                            <td>${person.name}</td>
                            <td>${person.email}</td>
                            <td>${person.email}</td>
                            <td>${person.firstName && person.lastName ? person.firstName + ' ' + person.lastName : person.name}</td>
                            <td>${person.company}</td>
                            <td>${person.phone}</td>
                            <td>${person.projects}</td>
                            <td>${person.role}</td>
                            <td>${person.status}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                <p>This export was generated from the Desa Wire People Management System.</p>
                <p>Total users: ${peopleData.length}</p>
            </div>
        </body>
        </html>
    `;
};

// Generate unique invitation token
const generateInvitationToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Send email using SendGrid (preferred) or fall back to Gmail SMTP
const sendEmail = async (to, subject, html, text) => {
    // Check if SendGrid is configured
    const sendGridConfigured = process.env.SENDGRID_API_KEY &&
                               process.env.SENDGRID_FROM_EMAIL;

    if (sendGridConfigured) {
        try {
            console.log('Using SendGrid to send email...');
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);

            const msg = {
                to: to,
                from: {
                    email: process.env.SENDGRID_FROM_EMAIL,
                    name: process.env.SENDGRID_FROM_NAME || 'DESA Wire'
                },
                subject: subject,
                text: text,
                html: html
            };

            await sgMail.send(msg);
            console.log(`✅ Email sent via SendGrid to: ${to}`);
            return { success: true, provider: 'SendGrid' };

        } catch (error) {
            console.error('SendGrid error:', error.message);
            console.log('Falling back to Gmail SMTP...');
        }
    }

    // Fall back to Gmail SMTP
    const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;

    if (smtpConfigured) {
        try {
            console.log('Using Gmail SMTP to send email...');
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            const mailOptions = {
                from: {
                    name: 'DESA Wire',
                    address: process.env.EMAIL_FROM || process.env.SMTP_USER
                },
                to: to,
                subject: subject,
                html: html,
                text: text
            };

            await transporter.sendMail(mailOptions);
            console.log(`✅ Email sent via Gmail SMTP to: ${to}`);
            return { success: true, provider: 'Gmail' };

        } catch (error) {
            console.error('Gmail SMTP error:', error.message);
            throw error;
        }
    }

    throw new Error('No email service configured');
};

// Send email confirmation after successful registration
const sendEmailConfirmation = async (email, fullName) => {
    console.log('>>> sendEmailConfirmation called <<<');
    console.log('Email:', email);
    console.log('Name:', fullName);

    try {
        const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                        .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to DESA Wire!</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${fullName}! 🎉</h2>
                            <p>Your registration has been completed successfully. Welcome to the team!</p>

                            <p><strong>What's next?</strong></p>
                            <ul>
                                <li>Log in to your DESA Wire account using your email and password</li>
                                <li>Explore your assigned projects</li>
                                <li>Collaborate with your team members</li>
                                <li>Stay connected with real-time updates</li>
                            </ul>

                            <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>

                            <p>Best regards,<br><strong>The DESA Wire Team</strong></p>
                        </div>
                        <div class="footer">
                            <p>This is an automated message. Please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>
        `;

        const text = `Hello ${fullName}!\n\nYour registration has been completed successfully. Welcome to DESA Wire!\n\nYou can now log in to your DESA Wire account using your email and password.\n\nBest regards,\nThe DESA Wire Team`;

        await sendEmail(
            email,
            'Welcome to DESA Wire - Registration Complete! 🎉',
            html,
            text
        );

    } catch (error) {
        console.error('❌ Email confirmation failed:', error.message);
        // Don't throw error - just log it so registration can complete
    }
};

// Invite users to project
const inviteToProject = async (req, res) => {
    try {
        const { emails, projects, message } = req.body;

        console.log('========================================');
        console.log('INVITE TO PROJECT FUNCTION CALLED');
        console.log('Emails:', emails);
        console.log('Projects:', projects);
        console.log('Message:', message);
        console.log('========================================');

        // Parse emails (comma-separated)
        const emailList = emails.split(',').map(email => email.trim()).filter(email => email);

        if (emailList.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide at least one valid email address'
            });
        }

        // Check if SMTP is configured
        const smtpConfigured = process.env.SMTP_USER &&
                              process.env.SMTP_PASS &&
                              process.env.SMTP_USER !== 'your-email@gmail.com' &&
                              process.env.SMTP_PASS !== 'your-app-password' &&
                              process.env.SMTP_USER.length > 10 &&
                              process.env.SMTP_PASS.length > 10;

        console.log('SMTP Configuration Check:');
        console.log('- SMTP_USER:', process.env.SMTP_USER);
        console.log('- SMTP Configured:', smtpConfigured);

        if (!smtpConfigured) {
            // Simulate email sending
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Generate invitation tokens for each email
            const invitationLinks = emailList.map(email => {
                const token = generateInvitationToken();

                // Store invitation token with expiry (24 hours) in database
                invitationsDB.create({
                    token: token,
                    email: email,
                    projects: projects,
                    createdAt: new Date(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                    used: false
                });

                return `http://localhost:3002/people/accept-invitation?token=${token}`;
            });

            console.log('===== INVITATION EMAIL SIMULATION =====');
            console.log(`To: ${emailList.join(', ')}`);
            console.log(`Projects: ${projects}`);
            console.log(`Message: ${message || 'N/A'}`);
            console.log('Invitation Links:');
            invitationLinks.forEach((link, index) => {
                console.log(`  ${emailList[index]}: ${link}`);
            });
            console.log('Note: Configure SMTP in .env to send real emails');
            console.log('=======================================');

            // Add notification for invitation
            try {
                notificationController.addNotification(
                    'New user invited',
                    `${emailList.length} user(s) have been invited to ${projects}`,
                    'People',
                    projects,
                    'invitation'
                );
            } catch (notifError) {
                console.error('Notification error (non-fatal):', notifError);
            }

            console.log('About to send response...');

            res.json({
                status: 'success',
                message: `Invitation sent successfully to ${emailList.length} user(s) (simulated)`,
                emailsSent: emailList.length,
                invitationLinks: invitationLinks,
                note: 'Email sending is simulated. Configure SMTP credentials in .env for real emails.'
            });

            console.log('Response sent successfully!');
            return;
        }

        // Send invitation emails via SendGrid (or Gmail fallback)
        console.log(`Preparing to send ${emailList.length} email(s)...`);

        const emailPromises = emailList.map(async (email) => {
            console.log(`Processing email for: ${email}`);

            // Check if user already exists
            const existingPerson = peopleDB.findByEmail(email);
            const existingUser = usersDB.findByEmail(email);
            const isExistingUser = !!(existingPerson || existingUser);

            console.log(`User ${email} - Existing: ${isExistingUser}`);

            if (isExistingUser) {
                // EXISTING USER - Auto-add to project and send notification email
                let userId;
                if (existingPerson) {
                    userId = existingPerson.id + 1000;
                    console.log(`Found in peopleDB - ID: ${existingPerson.id}, userId: ${userId}`);
                } else if (existingUser) {
                    userId = existingUser.id;
                    console.log(`Found in usersDB - userId: ${userId}`);
                }

                // Parse and assign projects
                const invitedProjects = projects.split(',').map(p => p.trim());
                const allProjects = projectsDB.getAll();
                let assignedProjectCount = 0;

                invitedProjects.forEach(projectNameOrId => {
                    const project = allProjects.find(p =>
                        p.name.toLowerCase() === projectNameOrId.toLowerCase() ||
                        p.id === projectNameOrId
                    );

                    if (project) {
                        const added = projectUsersDB.addUserToProject(userId, project.id);
                        if (added) {
                            assignedProjectCount++;
                            console.log(`✅ Auto-added existing user to project "${project.name}" (projectId: ${project.id})`);
                        } else {
                            console.log(`ℹ️ User already has access to project "${project.name}"`);
                        }
                    }
                });

                // Send notification email for existing users
                const userName = existingPerson ? existingPerson.name : existingUser.username;
                const htmlContent = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Project Access Granted - DESA Wire</title>
                        <style>
                            body {
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                margin: 0;
                                padding: 0;
                                background-color: #f4f7f9;
                                line-height: 1.6;
                            }
                            .email-wrapper {
                                max-width: 600px;
                                margin: 40px auto;
                                background: #ffffff;
                                border-radius: 8px;
                                overflow: hidden;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                            }
                            .header {
                                background: #1a202c;
                                padding: 30px 40px;
                                text-align: left;
                                border-bottom: 3px solid #48bb78;
                            }
                            .logo {
                                color: #ffffff;
                                font-size: 24px;
                                font-weight: 600;
                                margin: 0;
                                letter-spacing: 0.5px;
                            }
                            .logo-badge {
                                display: inline-block;
                                background: #48bb78;
                                color: #ffffff;
                                width: 40px;
                                height: 40px;
                                line-height: 40px;
                                text-align: center;
                                border-radius: 6px;
                                font-weight: 700;
                                font-size: 20px;
                                margin-right: 12px;
                                vertical-align: middle;
                            }
                            .content {
                                padding: 40px;
                                color: #2d3748;
                            }
                            .greeting {
                                font-size: 16px;
                                color: #2d3748;
                                margin-bottom: 24px;
                            }
                            .success-badge {
                                background: #c6f6d5;
                                color: #22543d;
                                padding: 12px 20px;
                                border-radius: 6px;
                                font-weight: 600;
                                display: inline-block;
                                margin-bottom: 24px;
                            }
                            .intro {
                                font-size: 15px;
                                color: #4a5568;
                                margin-bottom: 28px;
                                line-height: 1.7;
                            }
                            .project-box {
                                background: #f7fafc;
                                border-left: 4px solid #48bb78;
                                padding: 20px 24px;
                                margin: 28px 0;
                                border-radius: 4px;
                            }
                            .project-label {
                                font-size: 13px;
                                font-weight: 600;
                                color: #718096;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                                margin-bottom: 12px;
                            }
                            .project-name {
                                font-size: 16px;
                                font-weight: 600;
                                color: #2d3748;
                                margin: 0;
                            }
                            .message-box {
                                background: #fff5f5;
                                border-left: 4px solid #fc8181;
                                padding: 20px 24px;
                                margin: 28px 0;
                                border-radius: 4px;
                            }
                            .message-label {
                                font-size: 13px;
                                font-weight: 600;
                                color: #c53030;
                                margin-bottom: 8px;
                            }
                            .message-text {
                                font-size: 15px;
                                color: #4a5568;
                                margin: 0;
                                font-style: italic;
                            }
                            .cta-section {
                                text-align: center;
                                margin: 36px 0;
                            }
                            .cta-button {
                                display: inline-block;
                                background: #48bb78;
                                color: #ffffff;
                                padding: 14px 32px;
                                text-decoration: none;
                                border-radius: 6px;
                                font-weight: 600;
                                font-size: 15px;
                                transition: background 0.3s;
                            }
                            .cta-button:hover {
                                background: #38a169;
                            }
                            .footer {
                                background: #f7fafc;
                                padding: 32px 40px;
                                text-align: center;
                                color: #718096;
                                font-size: 13px;
                                line-height: 1.8;
                            }
                            .footer-divider {
                                border: 0;
                                height: 1px;
                                background: #e2e8f0;
                                margin: 20px 0;
                            }
                            .company-info {
                                color: #2d3748;
                                font-weight: 600;
                                margin-bottom: 8px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="email-wrapper">
                            <div class="header">
                                <span class="logo-badge">D</span>
                                <h1 class="logo" style="display: inline; vertical-align: middle;">DESA Wire</h1>
                            </div>

                            <div class="content">
                                <div class="success-badge">✅ Access Granted</div>

                                <div class="greeting">
                                    Hello ${userName},
                                </div>

                                <div class="intro">
                                    Great news! You have been granted access to new project(s) in DESA Wire. You can now view and collaborate on these projects immediately.
                                </div>

                                <div class="project-box">
                                    <div class="project-label">New Project Access</div>
                                    <div class="project-name">${projects}</div>
                                </div>

                                ${message ? `
                                <div class="message-box">
                                    <div class="message-label">Message from Administrator</div>
                                    <div class="message-text">${message}</div>
                                </div>
                                ` : ''}

                                <div class="cta-section">
                                    <a href="http://localhost:3002/login" class="cta-button">Log In to View Projects</a>
                                </div>

                                <div class="intro">
                                    Simply log in to your DESA Wire account to start working on your new project(s). No additional action is required.
                                </div>
                            </div>

                            <div class="footer">
                                <div class="company-info">DESA Wire Project Management System</div>
                                <div>Secure Project Collaboration Platform</div>

                                <hr class="footer-divider">

                                <div style="font-size: 12px; color: #a0aec0;">
                                    © ${new Date().getFullYear()} DESA. All rights reserved.<br>
                                    This is an automated message from an unmonitored email address.
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                `;

                const plainText = `Project Access Granted - DESA Wire

Hello ${userName},

Great news! You have been granted access to new project(s) in DESA Wire.

NEW PROJECT ACCESS: ${projects}

${message ? `MESSAGE FROM ADMINISTRATOR:\n${message}\n\n` : ''}Simply log in to your DESA Wire account to start working on your new project(s):
http://localhost:3002/login

No additional action is required.

---
DESA Wire Project Management System
© ${new Date().getFullYear()} DESA. All rights reserved.`;

                try {
                    const result = await sendEmail(
                        email,
                        `Project Access Granted - ${projects} | DESA Wire`,
                        htmlContent,
                        plainText
                    );
                    console.log(`✓ Notification email sent via ${result.provider} to ${email}`);
                    return result;
                } catch (mailError) {
                    console.error(`✗ Failed to send notification email to ${email}:`, mailError.message);
                    return { error: mailError.message, email: email };
                }

            } else {
                // NEW USER - Send invitation with acceptance link
                console.log(`New user - sending invitation with acceptance link`);

                // Generate unique token for this invitation
                const token = generateInvitationToken();

                // Store invitation token with expiry (24 hours) in database
                invitationsDB.create({
                    token: token,
                    email: email,
                    projects: projects,
                    createdAt: new Date(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                    used: false
                });

                console.log(`Token created for ${email}: ${token}`);

                // Create invitation link with token
                const invitationLink = `http://localhost:3002/people/accept-invitation?token=${token}`;
                console.log(`Invitation link: ${invitationLink}`);

                const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta name="x-apple-disable-message-reformatting">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <title>Project Collaboration Invitation - DESA Wire</title>
                    <!--[if mso]>
                    <style type="text/css">
                        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
                    </style>
                    <![endif]-->
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            margin: 0;
                            padding: 0;
                            background-color: #f4f7f9;
                            line-height: 1.6;
                        }
                        .email-wrapper {
                            max-width: 600px;
                            margin: 40px auto;
                            background: #ffffff;
                            border-radius: 8px;
                            overflow: hidden;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                        }
                        .header {
                            background: #1a202c;
                            padding: 30px 40px;
                            text-align: left;
                            border-bottom: 3px solid #3182ce;
                        }
                        .logo {
                            color: #ffffff;
                            font-size: 24px;
                            font-weight: 600;
                            margin: 0;
                            letter-spacing: 0.5px;
                        }
                        .logo-badge {
                            display: inline-block;
                            background: #3182ce;
                            color: #ffffff;
                            width: 40px;
                            height: 40px;
                            line-height: 40px;
                            text-align: center;
                            border-radius: 6px;
                            font-weight: 700;
                            font-size: 20px;
                            margin-right: 12px;
                            vertical-align: middle;
                        }
                        .content {
                            padding: 40px;
                            color: #2d3748;
                        }
                        .greeting {
                            font-size: 16px;
                            color: #2d3748;
                            margin-bottom: 24px;
                        }
                        .intro {
                            font-size: 15px;
                            color: #4a5568;
                            margin-bottom: 28px;
                            line-height: 1.7;
                        }
                        .project-box {
                            background: #f7fafc;
                            border-left: 4px solid #3182ce;
                            padding: 20px 24px;
                            margin: 28px 0;
                            border-radius: 4px;
                        }
                        .project-label {
                            font-size: 13px;
                            font-weight: 600;
                            color: #718096;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            margin-bottom: 12px;
                        }
                        .project-name {
                            font-size: 16px;
                            font-weight: 600;
                            color: #2d3748;
                            margin: 0;
                        }
                        .message-box {
                            background: #fff5f5;
                            border-left: 4px solid #fc8181;
                            padding: 20px 24px;
                            margin: 28px 0;
                            border-radius: 4px;
                        }
                        .message-label {
                            font-size: 13px;
                            font-weight: 600;
                            color: #c53030;
                            margin-bottom: 8px;
                        }
                        .message-text {
                            font-size: 15px;
                            color: #4a5568;
                            margin: 0;
                            font-style: italic;
                        }
                        .cta-section {
                            text-align: center;
                            margin: 36px 0;
                        }
                        .cta-button {
                            display: inline-block;
                            background: #3182ce;
                            color: #ffffff;
                            padding: 14px 32px;
                            text-decoration: none;
                            border-radius: 6px;
                            font-weight: 600;
                            font-size: 15px;
                            transition: background 0.3s;
                        }
                        .cta-button:hover {
                            background: #2c5282;
                        }
                        .expiry-notice {
                            font-size: 13px;
                            color: #718096;
                            text-align: center;
                            margin-top: 24px;
                            padding-top: 24px;
                            border-top: 1px solid #e2e8f0;
                        }
                        .footer {
                            background: #f7fafc;
                            padding: 32px 40px;
                            text-align: center;
                            color: #718096;
                            font-size: 13px;
                            line-height: 1.8;
                        }
                        .footer-divider {
                            border: 0;
                            height: 1px;
                            background: #e2e8f0;
                            margin: 20px 0;
                        }
                        .company-info {
                            color: #2d3748;
                            font-weight: 600;
                            margin-bottom: 8px;
                        }
                        .legal-text {
                            font-size: 12px;
                            color: #a0aec0;
                            margin-top: 16px;
                        }
                    </style>
                </head>
                <body>
                    <div class="email-wrapper">
                        <div class="header">
                            <span class="logo-badge">D</span>
                            <h1 class="logo" style="display: inline; vertical-align: middle;">DESA Wire</h1>
                        </div>

                        <div class="content">
                            <div class="greeting">
                                Dear Colleague,
                            </div>

                            <div class="intro">
                                You have been invited to collaborate on a project through the DESA Wire project management platform. This invitation grants you access to project resources, team communications, and collaborative tools.
                            </div>

                            <div class="project-box">
                                <div class="project-label">Assigned Project(s)</div>
                                <div class="project-name">${projects}</div>
                            </div>

                            ${message ? `
                            <div class="message-box">
                                <div class="message-label">Message from Project Administrator</div>
                                <div class="message-text">${message}</div>
                            </div>
                            ` : ''}

                            <div class="cta-section">
                                <a href="${invitationLink}" class="cta-button">Accept Invitation & Create Account</a>
                            </div>

                            <div class="expiry-notice">
                                <strong>Important:</strong> This invitation link will expire in 24 hours for security purposes.<br>
                                If you did not expect this invitation, please disregard this email.
                            </div>
                        </div>

                        <div class="footer">
                            <div class="company-info">DESA Wire Project Management System</div>
                            <div>Secure Project Collaboration Platform</div>

                            <hr class="footer-divider">

                            <div class="legal-text">
                                © ${new Date().getFullYear()} DESA. All rights reserved.<br>
                                This is an automated message from an unmonitored email address. Please do not reply directly to this email.
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            console.log(`Attempting to send email to ${email}...`);

            try {
                const plainText = `Project Collaboration Invitation - DESA Wire

Dear Colleague,

You have been invited to collaborate on a project through the DESA Wire project management platform.

ASSIGNED PROJECT(S): ${projects}

${message ? `MESSAGE FROM ADMINISTRATOR:\n${message}\n\n` : ''}To accept this invitation and create your account, please visit:
${invitationLink}

IMPORTANT: This invitation link will expire in 24 hours for security purposes.

If you did not expect this invitation, please disregard this email.

---
DESA Wire Project Management System
© ${new Date().getFullYear()} DESA. All rights reserved.
This is an automated message from an unmonitored email address.`;

                const result = await sendEmail(
                    email,
                    `Project Collaboration Invitation - ${projects} | DESA Wire`,
                    htmlContent,
                    plainText
                );
                console.log(`✓ Email sent via ${result.provider} to ${email}`);
                return result;
            } catch (mailError) {
                console.error(`✗ Failed to send email to ${email}:`, mailError.message);
                return { error: mailError.message, email: email };
            }
            }
        });

        console.log('Waiting for all emails to complete...');

        // Wait for all emails to be sent
        const results = await Promise.all(emailPromises);

        console.log('All email promises resolved!');

        // Check how many succeeded
        const successful = results.filter(r => !r.error);
        const failed = results.filter(r => r.error);

        console.log('===== INVITATIONS PROCESSING COMPLETE =====');
        console.log(`Successful: ${successful.length}`);
        console.log(`Failed: ${failed.length}`);
        if (failed.length > 0) {
            console.log('Failed emails:', failed.map(f => f.email).join(', '));
        }
        console.log('==========================================');

        // Add notification for invitation
        try {
            notificationController.addNotification(
                'New user invited',
                `${successful.length} user(s) have been invited to ${projects}`,
                'People',
                projects,
                'invitation'
            );
        } catch (notifError) {
            console.error('Notification error (non-fatal):', notifError);
        }

        res.json({
            status: 'success',
            message: `Invitations sent: ${successful.length} succeeded, ${failed.length} failed`,
            emailsSent: successful.length,
            emailsFailed: failed.length
        });

    } catch (error) {
        console.error('====== INVITATION ERROR ======');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        console.error('==============================');
        res.status(500).json({
            status: 'error',
            message: 'Failed to send invitations. Please try again.',
            error: error.message,
            stack: error.stack
        });
    }
};

// Get accept invitation page
const getAcceptInvitation = (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).send('Invalid invitation link');
    }

    // Find invitation by token from database
    const invitation = invitationsDB.findByToken(token);

    if (!invitation) {
        return res.status(404).render('error', {
            message: 'Invitation not found',
            description: 'This invitation link is invalid or has been deleted.'
        });
    }

    // Check if token is expired
    if (new Date() > invitation.expiresAt) {
        return res.status(410).render('error', {
            message: 'Invitation expired',
            description: 'This invitation link has expired. Please request a new invitation.'
        });
    }

    // Check if token is already used
    if (invitation.used) {
        return res.status(400).render('error', {
            message: 'Invitation already used',
            description: 'This invitation has already been accepted.'
        });
    }

    // Check if user with this email already exists in database
    const existingPerson = peopleDB.findByEmail(invitation.email);
    const existingUser = usersDB.findByEmail(invitation.email);

    if (existingPerson || existingUser) {
        // User already exists - add them to the invited projects instead
        console.log(`\n====== EXISTING USER INVITATION ======`);
        console.log(`User ${invitation.email} already exists`);

        let userId;
        if (existingPerson) {
            userId = existingPerson.id + 1000;
            console.log(`Found in peopleDB - ID: ${existingPerson.id}, userId: ${userId}`);
        } else if (existingUser) {
            userId = existingUser.id;
            console.log(`Found in usersDB - userId: ${userId}`);
        }

        // Parse and assign projects
        const invitedProjects = invitation.projects.split(',').map(p => p.trim());
        const allProjects = projectsDB.getAll();
        let assignedProjectCount = 0;

        invitedProjects.forEach(projectNameOrId => {
            const project = allProjects.find(p =>
                p.name.toLowerCase() === projectNameOrId.toLowerCase() ||
                p.id === projectNameOrId
            );

            if (project) {
                const added = projectUsersDB.addUserToProject(userId, project.id);
                if (added) {
                    assignedProjectCount++;
                    console.log(`✅ Added existing user to project "${project.name}" (projectId: ${project.id})`);
                } else {
                    console.log(`ℹ️ User already has access to project "${project.name}"`);
                }
            } else {
                console.error(`❌ Project not found: "${projectNameOrId}"`);
            }
        });

        // Mark invitation as used
        invitationsDB.update(token, { used: true });

        console.log(`📋 Total: Added to ${assignedProjectCount} new project(s)`);
        console.log(`=====================================\n`);

        // Show success page and redirect to login
        return res.render('error', {
            message: 'Projects Added Successfully!',
            description: `You've been added to ${assignedProjectCount} new project(s). Please log in to see your updated projects.`,
            redirectUrl: '/login?email=' + encodeURIComponent(invitation.email),
            redirectText: 'Go to Login'
        });
    }

    // Render accept invitation page for new users
    res.render('accept-invitation', {
        token: token,
        email: invitation.email,
        projects: invitation.projects
    });
};

// Process invitation acceptance and create user
const processInvitationAcceptance = async (req, res) => {
    try {
        const { token, firstName, lastName, password, phone } = req.body;

        // Validate inputs
        if (!token || !firstName || !lastName || !password || !phone) {
            return res.status(400).json({
                status: 'error',
                message: 'All fields are required'
            });
        }

        // Find invitation by token from database
        const invitation = invitationsDB.findByToken(token);

        if (!invitation) {
            return res.status(404).json({
                status: 'error',
                message: 'Invitation not found'
            });
        }

        // Check if token is expired
        if (new Date() > invitation.expiresAt) {
            return res.status(410).json({
                status: 'error',
                message: 'Invitation expired'
            });
        }

        // Check if token is already used
        if (invitation.used) {
            return res.status(400).json({
                status: 'error',
                message: 'Invitation already used'
            });
        }

        // Create new user in database
        const fullName = `${firstName} ${lastName}`;
        const newUser = peopleDB.create({
            name: fullName,
            firstName: firstName,
            lastName: lastName,
            email: invitation.email,
            phone: phone,
            company: 'Desa Glass',
            projects: 0,
            role: 'Team Member',
            status: 'Active',
            password: password, // In production, hash this password!
            createdAt: new Date()
        });

        // Assign user to the invited projects
        // Parse project names/IDs from invitation
        const invitedProjects = invitation.projects.split(',').map(p => p.trim());
        const allProjects = projectsDB.getAll();

        console.log(`\n====== PROJECT ASSIGNMENT DEBUG ======`);
        console.log(`User: ${newUser.email} (peopleDB ID: ${newUser.id})`);
        console.log(`Invited projects from invitation: ${JSON.stringify(invitedProjects)}`);
        console.log(`All available projects:`, allProjects.map(p => ({ id: p.id, name: p.name })));

        let assignedProjectCount = 0;
        invitedProjects.forEach(projectNameOrId => {
            // Find project by name or ID
            const project = allProjects.find(p =>
                p.name.toLowerCase() === projectNameOrId.toLowerCase() ||
                p.id === projectNameOrId
            );

            if (project) {
                // Use newUser.id + 1000 offset for people DB users (matching authController logic)
                const userId = newUser.id + 1000;
                const added = projectUsersDB.addUserToProject(userId, project.id);
                assignedProjectCount++;
                console.log(`✅ Assigned user ${newUser.email} (userId: ${userId}) to project "${project.name}" (projectId: ${project.id}) - Added: ${added}`);
            } else {
                console.error(`❌ Project not found: "${projectNameOrId}"`);
                console.error(`   Attempted to match against: ${allProjects.map(p => `"${p.name}"`).join(', ')}`);
            }
        });

        console.log(`📋 Total: User assigned to ${assignedProjectCount} out of ${invitedProjects.length} project(s)`);

        // Verify the assignment by reading back from database
        const verifyAssignedProjects = projectUsersDB.getProjectsByUser(newUser.id + 1000);
        console.log(`🔍 Verification: User ${newUser.id + 1000} has access to projects:`, verifyAssignedProjects);
        console.log(`======================================\n`);

        // Mark invitation as used in database
        invitationsDB.update(token, { used: true });

        // Send email confirmation
        console.log('About to send email confirmation...');
        console.log('Email:', invitation.email);
        console.log('Full Name:', fullName);
        await sendEmailConfirmation(invitation.email, fullName);
        console.log('Email confirmation function completed.');

        // Add notification
        notificationController.addNotification(
            'New user joined',
            `${fullName} (${invitation.email}) has accepted the invitation and joined the system`,
            'People',
            invitation.projects,
            'user-joined'
        );

        console.log('===== USER CREATED SUCCESSFULLY =====');
        console.log(`Name: ${fullName}`);
        console.log(`Email: ${newUser.email}`);
        console.log(`Phone: ${newUser.phone}`);
        console.log(`Projects: ${invitation.projects}`);
        console.log('=====================================');

        res.json({
            status: 'success',
            message: 'Account created successfully!',
            user: {
                id: newUser.id,
                email: newUser.email,
                name: fullName,
                firstName: firstName,
                lastName: lastName
            }
        });

    } catch (error) {
        console.error('Invitation acceptance error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to process invitation. Please try again.',
            error: error.message
        });
    }
};

// Helper function to get people array (for auth controller)
const getPeopleArray = () => {
    return peopleDB.getAll();
};

module.exports = {
    getPeople,
    getNewUsers,
    getPeopleData,
    getPersonById,
    createPerson,
    updatePerson,
    updatePersonRole,
    deletePerson,
    exportPeopleToEmail,
    inviteToProject,
    getAcceptInvitation,
    processInvitationAcceptance,
    getPeopleArray
};
