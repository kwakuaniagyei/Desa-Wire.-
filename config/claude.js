// Claude AI Configuration for Desa Wire
const Anthropic = require('@anthropic-ai/sdk');

class ClaudeAI {
    constructor() {
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY || 'your-claude-api-key-here'
        });
        this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
        this.maxTokens = parseInt(process.env.CLAUDE_MAX_TOKENS) || 2000;
    }

    async generateResponse(message, context = [], attachments = []) {
        try {
            // Build conversation context
            const conversationHistory = this.buildConversationContext(context);
            
            // Create system prompt for Desa Wire
            const systemPrompt = this.createSystemPrompt(attachments);
            
            // Prepare the message
            const userMessage = this.prepareUserMessage(message, attachments);
            
            // Generate response using Claude
            const response = await this.anthropic.messages.create({
                model: this.model,
                max_tokens: this.maxTokens,
                system: systemPrompt,
                messages: [
                    ...conversationHistory,
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                temperature: 0.7,
                top_p: 0.9
            });

            return {
                success: true,
                response: response.content[0].text,
                usage: response.usage,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Claude API Error:', error);
            return {
                success: false,
                error: error.message,
                fallback: true
            };
        }
    }

    createSystemPrompt(attachments = []) {
        return `You are DesaBot, an expert AI assistant for Desa Wire, a comprehensive construction project management platform. You provide professional, detailed, and actionable guidance for construction project management.

**Your Expertise:**
- Construction project management and planning
- Resource allocation and scheduling
- Team collaboration and communication
- Quality control and safety management
- Budget tracking and cost management
- Regulatory compliance and documentation
- Desa Wire platform features and best practices
- Industry standards and methodologies

**Your Response Style:**
- Professional and comprehensive
- Actionable with specific steps
- Research-backed and evidence-based
- Context-aware and conversational
- Structured with clear sections
- Include relevant examples and best practices
- Ask follow-up questions to provide better assistance

**Current Context:**
${attachments.length > 0 ? `User has shared ${attachments.length} file(s): ${attachments.map(f => f.name).join(', ')}` : 'No files attached'}

**Response Guidelines:**
1. Always provide detailed, professional responses
2. Structure information with clear headings and bullet points
3. Include practical examples and actionable steps
4. Reference Desa Wire features when relevant
5. Ask clarifying questions to provide better assistance
6. Maintain a helpful and professional tone
7. Focus on construction project management best practices

Remember: You are helping users succeed with their construction projects using Desa Wire's powerful project management tools.`;
    }

    buildConversationContext(context) {
        if (!context || context.length === 0) {
            return [];
        }

        return context.slice(-6).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));
    }

    prepareUserMessage(message, attachments = []) {
        let userMessage = message;
        
        if (attachments.length > 0) {
            userMessage += `\n\n[Attachments: ${attachments.map(f => f.name).join(', ')}]`;
        }
        
        return userMessage;
    }

    // Fallback response generator for when Claude API is unavailable
    generateFallbackResponse(message, context = []) {
        const messageLower = message.toLowerCase();
        
        // Enhanced fallback responses
        if (messageLower.includes('project') && messageLower.includes('management')) {
            return `Project management in construction involves coordinating complex activities, managing multiple stakeholders, and delivering projects on time and within budget. Here's a comprehensive overview:

**Key Components of Construction Project Management:**

**Planning Phase:**
• Project scope definition and requirements analysis
• Resource allocation and budget planning
• Timeline development and milestone setting
• Risk assessment and mitigation strategies
• Stakeholder identification and communication planning

**Execution Phase:**
• Team coordination and task assignment
• Resource management and procurement
• Progress monitoring and quality control
• Safety compliance and regulatory adherence
• Change management and scope control

**Control Phase:**
• Performance tracking and reporting
• Cost control and budget management
• Schedule adherence and timeline adjustments
• Quality assurance and compliance monitoring
• Risk management and issue resolution

**Desa Wire's Project Management Features:**
• Comprehensive project planning tools
• Real-time collaboration and communication
• Resource allocation and scheduling
• Progress tracking and reporting
• Document management and version control
• Mobile access for field updates

Would you like me to elaborate on any specific aspect of project management or help you with a particular challenge you're facing?`;
        }
        
        if (messageLower.includes('schedule') || messageLower.includes('timeline')) {
            return `Creating effective project schedules is crucial for construction project success. Here's a comprehensive approach:

**Schedule Development Process:**

**1. Project Breakdown Structure (PBS):**
• Identify all project phases and deliverables
• Break down complex tasks into manageable components
• Estimate task durations and resource requirements
• Identify dependencies and critical path activities

**2. Resource Planning:**
• Allocate team members based on skills and availability
• Plan equipment and material requirements
• Consider resource constraints and conflicts
• Build in buffer time for unexpected delays

**3. Timeline Creation:**
• Use Gantt charts for visual scheduling
• Identify critical path and non-critical activities
• Set milestones and checkpoints
• Plan for weather delays and seasonal factors

**4. Risk Management:**
• Identify potential schedule risks
• Develop contingency plans
• Set up early warning systems
• Establish escalation procedures

**Desa Wire Scheduling Features:**
• Drag-and-drop scheduling interface
• Real-time progress tracking
• Resource conflict detection
• Mobile access for field updates
• Automated notifications and alerts

**Best Practices:**
• Start with high-level milestones
• Break down complex tasks
• Consider seasonal and weather factors
• Regular schedule reviews and updates
• Clear communication of schedule changes

What specific scheduling challenge are you facing? I can provide targeted guidance for your situation.`;
        }
        
        if (messageLower.includes('budget') || messageLower.includes('cost')) {
            return `Budget management is critical for construction project success. Here's a comprehensive approach to cost control:

**Budget Planning and Control:**

**1. Budget Development:**
• Detailed cost estimation and analysis
• Resource cost planning and allocation
• Contingency planning and risk assessment
• Baseline budget establishment

**2. Cost Tracking:**
• Real-time expense monitoring
• Budget variance analysis
• Cost performance reporting
• Change order management

**3. Financial Control:**
• Regular budget reviews and updates
• Cost optimization strategies
• Resource efficiency improvements
• Stakeholder financial reporting

**Desa Wire Budget Features:**
• Comprehensive budget tracking tools
• Real-time cost monitoring
• Automated budget alerts
• Financial reporting and analytics
• Change order management

**Best Practices:**
• Establish clear budget baselines
• Regular budget reviews and updates
• Implement cost control measures
• Monitor budget performance continuously
• Communicate budget status to stakeholders

What specific budget management challenge are you facing? I can provide targeted guidance for your situation.`;
        }
        
        // Default professional response
        return `I'm here to help you with your Desa Wire project management needs! I can assist with:

**Project Management:**
• Project planning and execution strategies
• Resource allocation and scheduling
• Team collaboration and communication
• Quality control and compliance management

**Construction-Specific:**
• Safety management and protocols
• Equipment and material tracking
• Site progress monitoring
• Regulatory compliance and documentation

**Desa Wire Features:**
• Platform navigation and setup
• Advanced feature utilization
• Workflow optimization
• Integration and customization

**Best Practices:**
• Industry standards and methodologies
• Efficiency improvements and optimization
• Risk management strategies
• Performance monitoring and reporting

What specific area would you like to explore? I can provide detailed guidance, step-by-step instructions, or answer any questions you have about construction project management with Desa Wire.`;
    }
}

module.exports = ClaudeAI;
