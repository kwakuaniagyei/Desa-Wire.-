// Google Gemini AI Configuration for Desa Wire
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAI {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || 'your-gemini-api-key-here';
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.modelName = process.env.GEMINI_MODEL || 'gemini-pro-latest';

        // Configure model with generation settings for faster responses
        this.model = this.genAI.getGenerativeModel({
            model: this.modelName,
            generationConfig: {
                maxOutputTokens: 500, // Limit response length for speed
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
            }
        });
    }

    async generateResponse(message, context = [], attachments = []) {
        try {
            // Create a shorter, optimized prompt for faster responses
            let prompt = `You are DesaBot, a helpful AI assistant for Desa Wire construction project management. Give concise, professional answers.\n\n`;

            // Add only last 2 messages for context (reduced for speed)
            if (context && context.length > 0) {
                const recentContext = context.slice(-2);
                recentContext.forEach(msg => {
                    const role = msg.role === 'user' ? 'User' : 'Assistant';
                    // Limit context length
                    const content = msg.content.substring(0, 200);
                    prompt += `${role}: ${content}\n`;
                });
                prompt += '\n';
            }

            // Add current message
            prompt += `User: ${message}\n\nAssistant:`;

            // Generate response using Gemini with timeout
            const result = await Promise.race([
                this.model.generateContent(prompt),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timeout')), 3000)
                )
            ]);

            const response = result.response;
            const text = response.text();

            return {
                success: true,
                response: text,
                usage: {
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    total_tokens: 0
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Gemini API Error:', error);
            return {
                success: false,
                error: error.message,
                fallback: true
            };
        }
    }

    // Fallback response generator for when Gemini API is unavailable
    generateFallbackResponse(message, context = []) {
        const messageLower = message.toLowerCase();

        // Quick greeting
        if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower.includes('hey')) {
            return `Hello! I'm DesaBot, your AI assistant for Desa Wire construction project management platform. I can help you with:

• **Project Planning** - Create and manage construction projects
• **Scheduling** - Build timelines, track milestones
• **Budget Management** - Monitor costs and expenses
• **Team Collaboration** - Coordinate with your team
• **Reporting** - Generate project insights

What would you like to explore?`;
        }

        // Project management
        if (messageLower.includes('project')) {
            return `**Project Management with Desa Wire**

I can help you manage construction projects effectively! Here's how:

**Getting Started:**
1. **Create Projects** - Set up new construction projects with detailed information
2. **Define Scope** - Outline deliverables, phases, and objectives
3. **Set Timelines** - Establish start/end dates and key milestones
4. **Assign Teams** - Add team members and define their roles

**Key Features:**
• **Dashboard** - Real-time project overview and status
• **Task Management** - Create, assign, and track work items
• **Document Storage** - Centralize plans, permits, and specifications
• **Progress Tracking** - Monitor completion and identify delays
• **Mobile Access** - Update from the job site

**Best Practices:**
✓ Start with clear objectives and success criteria
✓ Break projects into manageable phases
✓ Establish regular check-ins with your team
✓ Document changes and decisions promptly
✓ Monitor progress against baseline plan

What specific aspect of project management would you like help with?`;
        }

        // Schedule/timeline
        if (messageLower.includes('schedule') || messageLower.includes('timeline')) {
            return `**Project Scheduling in Desa Wire**

Effective scheduling is critical for construction success! Here's how to create great schedules:

**Schedule Development:**
1. **Break Down Work** - Divide project into tasks and activities
2. **Estimate Durations** - Determine realistic timeframes for each task
3. **Identify Dependencies** - Link tasks that must follow each other
4. **Allocate Resources** - Assign workers, equipment, materials
5. **Set Milestones** - Mark key deliverables and checkpoints

**Desa Wire Scheduling Tools:**
• **Gantt Charts** - Visual timeline of all project activities
• **Critical Path** - Identify tasks that impact project duration
• **Resource Leveling** - Balance workload across team
• **Progress Updates** - Track actual vs. planned completion
• **What-If Analysis** - Model schedule changes

**Pro Tips:**
✓ Add buffer time for weather delays and unforeseen issues
✓ Consider material lead times and delivery schedules
✓ Coordinate with subcontractors early
✓ Update schedule weekly with actual progress
✓ Communicate changes to all stakeholders immediately

Need help with a specific scheduling challenge?`;
        }

        // Budget/cost
        if (messageLower.includes('budget') || messageLower.includes('cost') || messageLower.includes('financial')) {
            return `**Budget Management in Desa Wire**

Control costs and maximize profitability with effective budget management:

**Budget Planning:**
1. **Estimate Costs** - Calculate labor, materials, equipment, overhead
2. **Set Contingencies** - Add reserves for unexpected expenses
3. **Create Budget** - Build detailed line-item budget
4. **Get Approval** - Review with stakeholders and finalize
5. **Establish Baselines** - Lock in approved budget for tracking

**Cost Control:**
• **Track Expenses** - Record all actual costs in real-time
• **Monitor Variances** - Compare actual vs. budget continuously
• **Forecast Completion** - Project final costs based on trends
• **Manage Changes** - Document and approve cost changes
• **Generate Reports** - Share financial status with stakeholders

**Cost Management Best Practices:**
✓ Review budget weekly - catch overruns early
✓ Track labor hours daily - prevent overtime surprises
✓ Get multiple quotes for major purchases
✓ Monitor material waste and theft
✓ Document all change orders with cost impacts
✓ Maintain detailed records for billing and claims

**Key Metrics:**
• Budget variance percentage
• Cost performance index (CPI)
• Estimate at completion (EAC)
• Cash flow projections

What aspect of budget management do you need help with?`;
        }

        // Team/collaboration
        if (messageLower.includes('team') || messageLower.includes('collaboration') || messageLower.includes('user')) {
            return `**Team Collaboration in Desa Wire**

Effective teamwork drives project success! Here's how to maximize collaboration:

**Team Setup:**
1. **Add Team Members** - Invite users to your projects
2. **Assign Roles** - Define permissions (admin, manager, member)
3. **Set Responsibilities** - Clarify who does what
4. **Establish Communication** - Set up channels and protocols

**Collaboration Tools:**
• **Shared Dashboards** - Everyone sees real-time status
• **Task Assignments** - Clear ownership and accountability
• **Document Sharing** - Central repository for plans and specs
• **Comments & Discussions** - In-context communication
• **Notifications** - Stay informed of updates and changes
• **Mobile App** - Field teams update progress on-site

**Communication Best Practices:**
✓ Hold daily standup meetings (15 minutes max)
✓ Use project chat for quick questions
✓ Document decisions in writing
✓ Share photos from the field regularly
✓ Escalate issues immediately
✓ Celebrate milestones and wins

**Team Management Tips:**
• Set clear expectations from day one
• Provide necessary training on Desa Wire
• Review team performance regularly
• Address conflicts promptly
• Recognize good work publicly

How can I help improve your team collaboration?`;
        }

        // Reporting/analytics
        if (messageLower.includes('report') || messageLower.includes('analytics') || messageLower.includes('data')) {
            return `**Reporting & Analytics in Desa Wire**

Make data-driven decisions with comprehensive reporting:

**Available Reports:**
• **Project Status** - Overall health and progress
• **Schedule Performance** - On-time completion tracking
• **Budget Analysis** - Cost tracking and variances
• **Resource Utilization** - Team and equipment usage
• **Quality Metrics** - Inspection results and issues
• **Safety Records** - Incidents and compliance
• **Custom Reports** - Build your own metrics

**Report Features:**
✓ Real-time data - Always current information
✓ Visual dashboards - Charts and graphs
✓ Exportable - PDF, Excel, CSV formats
✓ Scheduled delivery - Automatic email distribution
✓ Drill-down capability - View detailed data

**Key Metrics to Track:**
1. Schedule Performance Index (SPI)
2. Cost Performance Index (CPI)
3. Percent complete by phase
4. Open issues and RFIs
5. Safety incident rate
6. Quality inspection pass rate

What reporting needs do you have?`;
        }

        // Safety/quality
        if (messageLower.includes('safety') || messageLower.includes('quality') || messageLower.includes('inspection')) {
            return `**Safety & Quality Management**

Desa Wire helps you maintain high standards:

**Safety Management:**
• Daily safety briefings and toolbox talks
• Incident reporting and investigation
• Safety inspection checklists
• PPE compliance tracking
• OSHA recordkeeping
• Safety training records

**Quality Control:**
• Inspection checklists and schedules
• Photo documentation
• Punch list management
• Defect tracking and resolution
• Material testing records
• Quality assurance reports

**Best Practices:**
✓ Safety first - Never compromise on safety
✓ Document everything with photos
✓ Address issues immediately
✓ Train workers on quality standards
✓ Conduct regular inspections
✓ Learn from mistakes

How can I help with safety or quality management?`;
        }

        // Default - comprehensive help
        return `**Welcome to Desa Wire!**

I'm DesaBot, your AI assistant for construction project management. I can help you with:

**📋 Project Management**
• Create and organize construction projects
• Track progress and milestones
• Manage project documentation

**📅 Scheduling**
• Build comprehensive timelines
• Track task dependencies
• Monitor schedule performance

**💰 Budget Control**
• Track costs and expenses
• Monitor budget variances
• Generate financial reports

**👥 Team Collaboration**
• Coordinate with team members
• Assign tasks and responsibilities
• Share updates and documents

**📊 Reporting & Analytics**
• Generate project reports
• Track key performance metrics
• Export data for analysis

**🔧 Additional Features**
• Safety management and compliance
• Quality control and inspections
• Mobile field updates
• Document management

**What would you like to do?**
Just ask me about any topic above, or describe your specific challenge. I'm here to help you succeed with Desa Wire!`;
    }
}

module.exports = GeminiAI;
