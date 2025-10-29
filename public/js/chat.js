// Chat functionality for Desa Wire AI Assistant
class DesaChat {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.scrollBtn = document.getElementById('scrollBtn');
        this.isTyping = false;
        
        this.initializeChat();
        this.setupEventListeners();
    }

    initializeChat() {
        // Set current time
        this.updateTime();
        
        // Set welcome message time
        const welcomeTime = document.getElementById('welcomeTime');
        if (welcomeTime) {
            welcomeTime.textContent = this.getCurrentTime();
        }

        // Show scroll button after a delay
        setTimeout(() => {
            this.showScrollButton();
        }, 2000);
    }

    setupEventListeners() {
        // Auto-resize input
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
        });

        // Scroll detection
        this.chatMessages.addEventListener('scroll', () => {
            this.handleScroll();
        });

        // Focus input on load
        this.messageInput.focus();
    }

    updateTime() {
        const currentTime = document.getElementById('currentTime');
        if (currentTime) {
            currentTime.textContent = this.getCurrentTime();
        }
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    handleKeyPress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';

        // Show typing indicator
        this.showTypingIndicator();

        // Simulate AI response
        setTimeout(() => {
            this.hideTypingIndicator();
            this.generateAIResponse(message);
        }, 1500 + Math.random() * 1000);
    }

    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const avatar = document.createElement('div');
        avatar.className = `message-avatar ${sender}`;
        avatar.textContent = sender === 'user' ? 'U' : 'AI';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        if (sender === 'ai') {
            const senderLabel = document.createElement('div');
            senderLabel.className = 'message-sender';
            senderLabel.textContent = 'Desa Wire AI Agent';
            messageContent.appendChild(senderLabel);
        }

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = content;

        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = this.getCurrentTime();

        messageContent.appendChild(bubble);
        messageContent.appendChild(time);

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);

        // Insert before typing indicator
        this.chatMessages.insertBefore(messageDiv, this.typingIndicator);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }

    generateAIResponse(userMessage) {
        const responses = this.getAIResponses(userMessage.toLowerCase());
        const response = responses[Math.floor(Math.random() * responses.length)];
        this.addMessage(response, 'ai');
    }

    getAIResponses(userMessage) {
        // Context-aware responses based on user input
        if (userMessage.includes('hello') || userMessage.includes('hi')) {
            return [
                "Hello! I'm here to help you with Desa Wire. How can I assist you today?",
                "Hi there! Welcome to Desa Wire. What would you like to know?",
                "Hello! I'm DesaBot, your AI assistant. How can I help you?"
            ];
        }

        if (userMessage.includes('project') || userMessage.includes('construction')) {
            return [
                "I can help you with project management, scheduling, and construction workflows. What specific aspect would you like to explore?",
                "For project-related questions, I can assist with planning, resource allocation, and progress tracking. What do you need help with?",
                "Desa Wire excels in construction project management. I can guide you through our features and best practices."
            ];
        }

        if (userMessage.includes('help') || userMessage.includes('support')) {
            return [
                "I'm here to help! You can ask me about Desa Wire features, project management, or any technical questions.",
                "I can assist with Desa Wire functionality, troubleshooting, and best practices. What do you need help with?",
                "I'm your Desa Wire assistant. Feel free to ask about features, workflows, or any questions you have."
            ];
        }

        if (userMessage.includes('schedule') || userMessage.includes('timeline')) {
            return [
                "I can help you with scheduling and timeline management. Desa Wire offers powerful tools for project scheduling and resource planning.",
                "For scheduling questions, I can guide you through creating timelines, managing dependencies, and tracking progress.",
                "Desa Wire's scheduling features help you stay on track. What specific scheduling challenge are you facing?"
            ];
        }

        if (userMessage.includes('team') || userMessage.includes('collaboration')) {
            return [
                "Desa Wire promotes seamless team collaboration with real-time updates, shared workspaces, and communication tools.",
                "I can help you set up team workflows, manage permissions, and optimize collaboration in Desa Wire.",
                "Team collaboration is a core feature of Desa Wire. What aspect of team management would you like to explore?"
            ];
        }

        if (userMessage.includes('report') || userMessage.includes('analytics')) {
            return [
                "Desa Wire provides comprehensive reporting and analytics to track project performance and team productivity.",
                "I can help you generate reports, set up dashboards, and analyze project data in Desa Wire.",
                "Our reporting features give you insights into project progress and team performance. What reports do you need?"
            ];
        }

        // Default responses
        return [
            "That's an interesting question! I'm here to help you get the most out of Desa Wire. Could you provide more details?",
            "I understand you're looking for information. Let me help you find what you need in Desa Wire.",
            "Thanks for your message! I'm DesaBot, and I'm here to assist you with Desa Wire. What would you like to know more about?",
            "I'm here to help you navigate Desa Wire effectively. Could you clarify what you're looking for?",
            "That's a great question! I can help you with Desa Wire features and best practices. What specific area interests you?"
        ];
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        this.hideScrollButton();
    }

    handleScroll() {
        const { scrollTop, scrollHeight, clientHeight } = this.chatMessages;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
        
        if (isNearBottom) {
            this.hideScrollButton();
        } else {
            this.showScrollButton();
        }
    }

    showScrollButton() {
        this.scrollBtn.classList.remove('hidden');
    }

    hideScrollButton() {
        this.scrollBtn.classList.add('hidden');
    }
}

// Global functions for HTML onclick events
function handleKeyPress(event) {
    chat.handleKeyPress(event);
}

function attachFile() {
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif';
    
    fileInput.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Simulate file attachment
            chat.addMessage(`📎 Attached: ${file.name}`, 'user');
            
            // Show AI response about file
            setTimeout(() => {
                chat.hideTypingIndicator();
                chat.addMessage("I've received your file attachment. I can help you analyze documents, images, or other files related to your Desa Wire projects. What would you like me to help you with regarding this file?", 'ai');
            }, 1000);
        }
    };
    
    fileInput.click();
}

function showKnowledgeBase() {
    chat.addMessage("Check out the Knowledgebase!", 'user');
    
    setTimeout(() => {
        chat.hideTypingIndicator();
        chat.addMessage("Great choice! The Desa Wire Knowledge Base contains comprehensive guides, tutorials, and best practices. Here are some key areas:\n\n• Project Setup & Configuration\n• Team Management & Collaboration\n• Scheduling & Timeline Management\n• Reporting & Analytics\n• Mobile App Usage\n• Integration with Other Tools\n\nWhat specific topic would you like to explore in the Knowledge Base?", 'ai');
    }, 1000);
}

// Initialize chat when DOM is loaded
let chat;
document.addEventListener('DOMContentLoaded', () => {
    chat = new DesaChat();
});

// Handle window resize
window.addEventListener('resize', () => {
    if (chat) {
        chat.scrollToBottom();
    }
});
