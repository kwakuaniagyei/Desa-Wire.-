// Floating Chat Widget for Desa Wire
class DesaChatWidget {
    constructor() {
        this.isOpen = false;
        this.isMinimized = false;
        this.messages = [];
        this.attachedFiles = [];
        this.conversationContext = [];
        this.isTyping = false;
        this.initializeWidget();
    }

    initializeWidget() {
        this.createWidgetHTML();
        this.setupEventListeners();
        this.loadWelcomeMessage();
    }

    createWidgetHTML() {
        const widgetHTML = `
            <div id="desaChatWidget" class="desa-chat-widget">
                <!-- Chat Button -->
                <div id="chatButton" class="chat-button">
                    <div class="chat-button-icon">
                        <img src="/img/img.webp" alt="Desa Wire" class="chat-logo">
                    </div>
                    <div class="chat-button-text">
                        <span class="chat-title">Chat with Desa Wire</span>
                        <span class="chat-subtitle">AI Assistant</span>
                    </div>
                    <div class="chat-button-arrow">▼</div>
                </div>

                <!-- Chat Window -->
                <div id="chatWindow" class="chat-window">
                    <div class="chat-header">
                        <div class="chat-header-left">
                            <img src="/img/img.webp" alt="Desa Wire" class="chat-header-logo">
                            <div class="chat-header-text">
                                <div class="chat-header-title">Chat with Desa Wire</div>
                                <div class="chat-header-status">Online</div>
                            </div>
                        </div>
                        <div class="chat-header-actions">
                            <button class="chat-minimize-btn" id="minimizeBtn">−</button>
                            <button class="chat-close-btn" id="closeBtn">×</button>
                        </div>
                    </div>

                    <div class="chat-messages" id="chatMessages">
                        <div class="chat-info">This chat is recorded using a cloud service.</div>
                        <div class="chat-timestamp" id="chatTimestamp"></div>
                    </div>

                    <div class="chat-input-area">
                        <div class="chat-typing-indicator" id="typingIndicator">
                            <div class="typing-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <span>Desa Wire AI is typing...</span>
                        </div>
                        
                        <!-- File Preview Area -->
                        <div class="file-preview-area" id="filePreviewArea" style="display: none;">
                            <div class="file-preview-header">
                                <span>Attached Files:</span>
                                <button class="clear-files-btn" id="clearFilesBtn">Clear All</button>
                            </div>
                            <div class="file-preview-list" id="filePreviewList"></div>
                        </div>

                        <!-- Help Options -->
                        <div class="help-options">
                            <button id="contactHumanBtn" class="help-btn" title="Contact Human Support">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                Contact Human
                            </button>
                            <button id="knowledgeBaseBtn" class="help-btn" title="Search Knowledge Base">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                                </svg>
                                Knowledge Base
                            </button>
                        </div>
                        
                        <div class="chat-input-container">
                            <button class="chat-attachment-btn" id="attachmentBtn" title="Attach files">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                                </svg>
                            </button>
                            <textarea id="chatInput" class="chat-input" placeholder="Ask me anything about Desa Wire..." maxlength="1000" rows="1"></textarea>
                            <button class="chat-send-btn" id="sendBtn">Send</button>
                        </div>
                        
                        <!-- Hidden file input -->
                        <input type="file" id="fileInput" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.xlsx,.xls,.ppt,.pptx" style="display: none;" />
                    </div>
                </div>
            </div>
        `;

        // Add CSS styles
        const styles = `
            <style>
                .desa-chat-widget {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 10000;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .chat-button {
                    background: #F98B2F;
                    color: white;
                    border-radius: 25px;
                    padding: 12px 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    box-shadow: 0 4px 20px rgba(249, 139, 47, 0.3);
                    transition: all 0.3s ease;
                    min-width: 280px;
                }

                .chat-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 25px rgba(249, 139, 47, 0.4);
                }

                .chat-button-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .chat-logo {
                    width: 32px;
                    height: 32px;
                    object-fit: contain;
                }

                .chat-button-text {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }

                .chat-title {
                    font-size: 14px;
                    font-weight: 600;
                    line-height: 1.2;
                }

                .chat-subtitle {
                    font-size: 12px;
                    opacity: 0.9;
                    line-height: 1.2;
                }

                .chat-button-arrow {
                    font-size: 12px;
                    transition: transform 0.3s ease;
                }

                .chat-window {
                    position: absolute;
                    bottom: 70px;
                    right: 0;
                    width: 320px !important;
                    height: 450px !important;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 10px 50px rgba(0, 0, 0, 0.2);
                    display: none;
                    flex-direction: column;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                }

                .chat-window.open {
                    display: flex;
                    animation: slideUp 0.3s ease;
                }

                .chat-window.minimized {
                    height: 60px;
                    overflow: hidden;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .chat-header {
                    background: #F98B2F;
                    color: white;
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-radius: 12px 12px 0 0;
                }

                .chat-header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .chat-header-logo {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: white;
                    padding: 4px;
                }

                .chat-header-title {
                    font-size: 16px;
                    font-weight: 600;
                }

                .chat-header-status {
                    font-size: 12px;
                    opacity: 0.9;
                }

                .chat-header-actions {
                    display: flex;
                    gap: 8px;
                }

                .chat-minimize-btn,
                .chat-close-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: background 0.2s;
                }

                .chat-minimize-btn:hover,
                .chat-close-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .chat-messages {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    background: linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%);
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }

                /* Custom scrollbar for professional look */
                .chat-messages::-webkit-scrollbar {
                    width: 8px;
                }

                .chat-messages::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }

                .chat-messages::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }

                .chat-messages::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }

                .chat-info {
                    text-align: center;
                    color: #6c757d;
                    font-size: 11px;
                    margin-bottom: 8px;
                }

                .chat-timestamp {
                    text-align: center;
                    color: #6c757d;
                    font-size: 11px;
                    margin-bottom: 16px;
                }

                .chat-message {
                    display: flex;
                    gap: 10px;
                    align-items: flex-start;
                    max-width: 90%;
                }

                .chat-message.user {
                    align-self: flex-end;
                    flex-direction: row-reverse;
                }

                .chat-message-avatar {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 600;
                    flex-shrink: 0;
                }

                .chat-message-avatar.ai {
                    background: #A7D9D9;
                    color: white;
                }

                .chat-message-avatar.user {
                    background: #F98B2F;
                    color: white;
                }

                .chat-message-content {
                    position: relative;
                }

                .chat-message-sender {
                    font-size: 11px;
                    color: #6c757d;
                    margin-bottom: 4px;
                }

                .chat-message-bubble {
                    background: #ffffff;
                    padding: 20px 24px;
                    border-radius: 12px;
                    position: relative;
                    word-wrap: break-word;
                    line-height: 1.8;
                    font-size: 15px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif;
                    letter-spacing: 0.3px;
                    color: #1a202c;
                    white-space: pre-wrap;
                    font-weight: 400;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
                    transition: box-shadow 0.2s ease;
                }

                .chat-message-bubble:hover {
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
                }

                .chat-message.user .chat-message-bubble {
                    background: linear-gradient(135deg, #F98B2F 0%, #e67e22 100%);
                    color: white;
                    border: none;
                    box-shadow: 0 2px 8px rgba(249, 139, 47, 0.25);
                }

                .chat-message.user .chat-message-bubble:hover {
                    box-shadow: 0 3px 12px rgba(249, 139, 47, 0.35);
                }

                /* Smooth entrance animation */
                @keyframes messageSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .chat-message {
                    animation: messageSlideIn 0.3s ease-out;
                }

                /* Professional styling for AI responses */
                .chat-message-bubble strong {
                    font-weight: 700;
                    color: #0f172a;
                    display: block;
                    margin-top: 20px;
                    margin-bottom: 12px;
                    padding-bottom: 6px;
                    font-size: 16px;
                    letter-spacing: 0.1px;
                    line-height: 1.4;
                    border-bottom: 1px solid #e2e8f0;
                }

                /* First strong element shouldn't have top margin */
                .chat-message-bubble strong:first-child {
                    margin-top: 0;
                }

                .chat-message.user .chat-message-bubble strong {
                    color: white;
                }

                .chat-message-bubble em {
                    font-style: italic;
                    color: #475569;
                    font-weight: 450;
                }

                /* Ultra-professional section headers */
                .chat-message-bubble h1,
                .chat-message-bubble h2,
                .chat-message-bubble h3 {
                    font-weight: 700;
                    margin-top: 18px;
                    margin-bottom: 12px;
                    color: #0f172a;
                    line-height: 1.3;
                    letter-spacing: -0.3px;
                }

                .chat-message-bubble h1 {
                    font-size: 18px;
                    border-bottom: 2px solid #E2E8F0;
                    padding-bottom: 8px;
                }

                .chat-message-bubble h2 {
                    font-size: 17px;
                    color: #1e293b;
                }

                .chat-message-bubble h3 {
                    font-size: 16px;
                    color: #334155;
                }

                /* Beautifully organized lists */
                .chat-message-bubble ul,
                .chat-message-bubble ol {
                    margin: 14px 0;
                    padding-left: 0;
                    list-style: none;
                }

                .chat-message-bubble li {
                    margin: 10px 0;
                    padding-left: 28px;
                    position: relative;
                    line-height: 1.8;
                    color: #1e293b;
                    font-size: 15px;
                }

                /* Custom beautiful bullets */
                .chat-message-bubble ul li::before {
                    content: '●';
                    position: absolute;
                    left: 8px;
                    color: #F98B2F;
                    font-weight: 700;
                    font-size: 12px;
                    line-height: 1.8;
                }

                /* Numbered lists */
                .chat-message-bubble ol {
                    counter-reset: item;
                }

                .chat-message-bubble ol li {
                    counter-increment: item;
                }

                .chat-message-bubble ol li::before {
                    content: counter(item) '.';
                    position: absolute;
                    left: 4px;
                    color: #F98B2F;
                    font-weight: 700;
                    font-size: 15px;
                }

                /* Paragraphs */
                .chat-message-bubble p {
                    margin: 10px 0;
                    color: #1e293b;
                }

                /* Code or technical text */
                .chat-message-bubble code {
                    background: #e2e8f0;
                    padding: 3px 8px;
                    border-radius: 5px;
                    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Courier New', monospace;
                    font-size: 14px;
                    color: #0f172a;
                    font-weight: 500;
                    border: 1px solid #cbd5e1;
                }

                /* Links */
                .chat-message-bubble a {
                    color: #F98B2F;
                    text-decoration: none;
                    font-weight: 500;
                    border-bottom: 1px solid transparent;
                    transition: border-color 0.2s;
                }

                .chat-message-bubble a:hover {
                    border-bottom-color: #F98B2F;
                }

                /* Horizontal rules */
                .chat-message-bubble hr {
                    border: none;
                    border-top: 1px solid #E2E8F0;
                    margin: 16px 0;
                }

                /* Blockquotes */
                .chat-message-bubble blockquote {
                    border-left: 3px solid #F98B2F;
                    padding-left: 16px;
                    margin: 12px 0;
                    color: #475569;
                    font-style: italic;
                }

                .chat-message-bubble::before {
                    content: '';
                    position: absolute;
                    width: 0;
                    height: 0;
                    border: 6px solid transparent;
                }

                .chat-message:not(.user) .chat-message-bubble::before {
                    left: -12px;
                    top: 10px;
                    border-right-color: #E0E0E0;
                    border-left: 0;
                }

                .chat-message.user .chat-message-bubble::before {
                    right: -12px;
                    top: 10px;
                    border-left-color: #F98B2F;
                    border-right: 0;
                }

                .chat-message-time {
                    font-size: 10px;
                    color: #6c757d;
                    margin-top: 4px;
                }

                .chat-typing-indicator {
                    display: none;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 14px;
                    background: #E0E0E0;
                    border-radius: 16px;
                    max-width: 85%;
                    margin-bottom: 8px;
                }

                .chat-typing-indicator.show {
                    display: flex;
                }

                .typing-dots {
                    display: flex;
                    gap: 3px;
                }

                .typing-dots span {
                    width: 6px;
                    height: 6px;
                    background: #6c757d;
                    border-radius: 50%;
                    animation: typing 1.4s infinite ease-in-out;
                }

                .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
                .typing-dots span:nth-child(2) { animation-delay: -0.16s; }

                @keyframes typing {
                    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
                    40% { transform: scale(1); opacity: 1; }
                }

                .chat-input-area {
                    padding: 16px;
                    background: white;
                    border-top: 1px solid #e2e8f0;
                }

                .file-preview-area {
                    background: #f8f9fa;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 12px;
                    max-height: 200px;
                    overflow-y: auto;
                }

                .file-preview-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #4a5568;
                }

                .clear-files-btn {
                    background: none;
                    border: none;
                    color: #e53e3e;
                    font-size: 12px;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: background 0.2s;
                }

                .clear-files-btn:hover {
                    background: #fed7d7;
                }

                .help-options {
                    display: flex;
                    gap: 8px;
                    padding: 8px 16px;
                    background: #f8f9fa;
                    border-top: 1px solid #e2e8f0;
                }

                .help-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 16px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .help-btn:hover {
                    background: #5a6268;
                }

                .help-btn svg {
                    width: 14px;
                    height: 14px;
                }

                .file-preview-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .file-preview-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 12px;
                }

                .file-icon {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    color: white;
                }

                .file-icon.pdf { background: #e53e3e; }
                .file-icon.doc, .file-icon.docx { background: #3182ce; }
                .file-icon.jpg, .file-icon.jpeg, .file-icon.png, .file-icon.gif { background: #38a169; }
                .file-icon.txt { background: #718096; }
                .file-icon.xlsx, .file-icon.xls { background: #38a169; }
                .file-icon.ppt, .file-icon.pptx { background: #d69e2e; }

                .file-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .file-name {
                    font-weight: 500;
                    color: #2d3748;
                    margin-bottom: 2px;
                }

                .file-size {
                    color: #718096;
                    font-size: 11px;
                }

                .file-remove-btn {
                    background: none;
                    border: none;
                    color: #e53e3e;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: background 0.2s;
                }

                .file-remove-btn:hover {
                    background: #fed7d7;
                }

                .chat-input-container {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                .chat-attachment-btn {
                    background: none;
                    border: 2px solid #F98B2F;
                    color: #F98B2F;
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .chat-attachment-btn:hover {
                    background: #F98B2F;
                    color: white;
                }

                .chat-input {
                    flex: 1;
                    border: 2px solid #F98B2F;
                    border-radius: 20px;
                    padding: 10px 16px;
                    font-size: 14px;
                    outline: none;
                    transition: border-color 0.2s;
                    resize: none;
                    min-height: 20px;
                    max-height: 120px;
                    overflow-y: auto;
                    line-height: 1.4;
                    font-family: inherit;
                }

                .chat-input:focus {
                    border-color: #e67e22;
                }

                .chat-send-btn {
                    background: #F98B2F;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                }

                .chat-send-btn:hover {
                    background: #e67e22;
                }

                /* Responsive design */
                @media (min-width: 1400px) {
                    .chat-window {
                        width: 380px !important;
                        height: 520px !important;
                    }
                }

                @media (max-width: 768px) {
                    .chat-window {
                        width: 280px !important;
                        height: 420px !important;
                    }
                }

                @media (max-width: 480px) {
                    .desa-chat-widget {
                        bottom: 10px;
                        right: 10px;
                        left: 10px;
                    }

                    .chat-button {
                        min-width: auto;
                        width: 100%;
                    }

                    .chat-window {
                        width: 100% !important;
                        height: 380px !important;
                        bottom: 60px;
                    }
                }
            </style>
        `;

        // Add styles to head
        if (!document.getElementById('desa-chat-styles')) {
            const styleElement = document.createElement('div');
            styleElement.id = 'desa-chat-styles';
            styleElement.innerHTML = styles;
            document.head.appendChild(styleElement);
        }

        // Add widget to body
        const widgetElement = document.createElement('div');
        widgetElement.innerHTML = widgetHTML;
        document.body.appendChild(widgetElement.firstElementChild);
    }

    setupEventListeners() {
        const chatButton = document.getElementById('chatButton');
        const chatWindow = document.getElementById('chatWindow');
        const minimizeBtn = document.getElementById('minimizeBtn');
        const closeBtn = document.getElementById('closeBtn');
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        const attachmentBtn = document.getElementById('attachmentBtn');
        const fileInput = document.getElementById('fileInput');
        const clearFilesBtn = document.getElementById('clearFilesBtn');

        // Toggle chat window
        chatButton.addEventListener('click', () => {
            this.toggleChat();
        });

        // Minimize chat
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.minimizeChat();
        });

        // Close chat
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeChat();
        });

        // Send message
        sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea and real-time input validation
        chatInput.addEventListener('input', (e) => {
            this.autoResizeTextarea(e.target);
            this.formatUserInput(e.target);
        });

        // Prevent sending while AI is typing
        chatInput.addEventListener('keydown', (e) => {
            if (this.isTyping && e.key === 'Enter') {
                e.preventDefault();
            }
        });

        // Attachment functionality
        attachmentBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });

        clearFilesBtn.addEventListener('click', () => {
            this.clearAllFiles();
        });

        // Help options
        const contactHumanBtn = document.getElementById('contactHumanBtn');
        const knowledgeBaseBtn = document.getElementById('knowledgeBaseBtn');

        contactHumanBtn.addEventListener('click', () => {
            this.contactHumanSupport();
        });

        knowledgeBaseBtn.addEventListener('click', () => {
            this.searchKnowledgeBase();
        });

        // Update timestamp
        this.updateTimestamp();
        setInterval(() => this.updateTimestamp(), 60000); // Update every minute
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        const chatWindow = document.getElementById('chatWindow');
        const chatButton = document.getElementById('chatButton');
        const arrow = chatButton.querySelector('.chat-button-arrow');

        chatWindow.classList.add('open');
        arrow.style.transform = 'rotate(180deg)';
        this.isOpen = true;
        this.isMinimized = false;

        // Focus input
        setTimeout(() => {
            document.getElementById('chatInput').focus();
        }, 300);
    }

    closeChat() {
        const chatWindow = document.getElementById('chatWindow');
        const chatButton = document.getElementById('chatButton');
        const arrow = chatButton.querySelector('.chat-button-arrow');

        chatWindow.classList.remove('open');
        arrow.style.transform = 'rotate(0deg)';
        this.isOpen = false;
        this.isMinimized = false;
    }

    minimizeChat() {
        const chatWindow = document.getElementById('chatWindow');
        
        if (this.isMinimized) {
            chatWindow.classList.remove('minimized');
            this.isMinimized = false;
        } else {
            chatWindow.classList.add('minimized');
            this.isMinimized = true;
        }
    }

    loadWelcomeMessage() {
        setTimeout(() => {
            this.addMessage("Hi there! I'm DesaBot, your dedicated AI Agent, and I'm here to help. How can I assist you today?", 'ai');
        }, 1000);
    }

    async sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();

        if (!message && this.attachedFiles.length === 0) return;
        if (this.isTyping) return;

        // Add user message with attachments
        this.addMessage(message, 'user', this.attachedFiles);
        
        // Add to conversation context
        this.conversationContext.push({
            role: 'user',
            content: message,
            attachments: this.attachedFiles,
            timestamp: new Date().toISOString()
        });

        chatInput.value = '';

        // Clear attached files
        this.clearAllFiles();

        // Generate intelligent AI response
        await this.generateIntelligentResponse(message, this.attachedFiles);
    }

    addMessage(content, sender, attachments = []) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;

        const avatar = document.createElement('div');
        avatar.className = `chat-message-avatar ${sender}`;
        avatar.textContent = sender === 'user' ? 'U' : 'AI';

        const messageContent = document.createElement('div');
        messageContent.className = 'chat-message-content';

        if (sender === 'ai') {
            const senderLabel = document.createElement('div');
            senderLabel.className = 'chat-message-sender';
            senderLabel.textContent = 'Desa Wire AI Agent';
            messageContent.appendChild(senderLabel);
        }

        const bubble = document.createElement('div');
        bubble.className = 'chat-message-bubble';

        // Parse markdown-style formatting for better readability
        let formattedContent = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/__(.*?)__/g, '<strong>$1</strong>') // Bold alternative
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
            .replace(/_(.*?)_/g, '<em>$1</em>') // Italic alternative
            .replace(/`(.*?)`/g, '<code>$1</code>') // Code
            .replace(/^### (.*?)$/gm, '<h3>$1</h3>') // H3
            .replace(/^## (.*?)$/gm, '<h2>$1</h2>') // H2
            .replace(/^# (.*?)$/gm, '<h1>$1</h1>'); // H1

        bubble.innerHTML = formattedContent;

        // Add attachments if any
        if (attachments && attachments.length > 0) {
            const attachmentsDiv = document.createElement('div');
            attachmentsDiv.className = 'message-attachments';
            attachmentsDiv.style.marginTop = '8px';
            attachmentsDiv.style.display = 'flex';
            attachmentsDiv.style.flexDirection = 'column';
            attachmentsDiv.style.gap = '4px';

            attachments.forEach(file => {
                const attachmentItem = document.createElement('div');
                attachmentItem.className = 'message-attachment-item';
                attachmentItem.style.display = 'flex';
                attachmentItem.style.alignItems = 'center';
                attachmentItem.style.gap = '8px';
                attachmentItem.style.padding = '6px';
                attachmentItem.style.background = sender === 'user' ? 'rgba(255,255,255,0.2)' : '#f1f5f9';
                attachmentItem.style.borderRadius = '6px';
                attachmentItem.style.fontSize = '12px';

                const fileIcon = document.createElement('div');
                fileIcon.className = `file-icon ${this.getFileExtension(file.name)}`;
                fileIcon.style.width = '20px';
                fileIcon.style.height = '20px';
                fileIcon.style.display = 'flex';
                fileIcon.style.alignItems = 'center';
                fileIcon.style.justifyContent = 'center';
                fileIcon.style.borderRadius = '4px';
                fileIcon.style.fontSize = '10px';
                fileIcon.style.fontWeight = '600';
                fileIcon.style.color = 'white';
                fileIcon.textContent = this.getFileExtension(file.name).toUpperCase();

                const fileName = document.createElement('span');
                fileName.style.color = sender === 'user' ? 'white' : '#2d3748';
                fileName.style.fontWeight = '500';
                fileName.textContent = file.name;

                attachmentItem.appendChild(fileIcon);
                attachmentItem.appendChild(fileName);
                attachmentsDiv.appendChild(attachmentItem);
            });

            bubble.appendChild(attachmentsDiv);
        }

        const time = document.createElement('div');
        time.className = 'chat-message-time';
        time.textContent = this.getCurrentTime();

        messageContent.appendChild(bubble);
        messageContent.appendChild(time);

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);

        chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        typingIndicator.classList.add('show');
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        typingIndicator.classList.remove('show');
    }

    async generateIntelligentResponse(userMessage, attachments = []) {
        try {
            // Show typing indicator
            this.showTypingIndicator();
            this.isTyping = true;
            
            // Prepare data for Claude API
            const requestData = {
                message: userMessage,
                userId: 'desa-wire-user',
                attachments: attachments,
                conversationContext: this.conversationContext
            };
            
            // Call Claude API
            const response = await fetch('/chat/api/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            
            this.hideTypingIndicator();
            this.isTyping = false;
            
            if (result.success) {
                // Add AI response to conversation
                this.addMessage(result.response, 'ai');
                
                // Add to conversation context
                this.conversationContext.push({
                    role: 'assistant',
                    content: result.response,
                    timestamp: result.timestamp
                });
                
                // Keep conversation context manageable (last 10 messages)
                if (this.conversationContext.length > 10) {
                    this.conversationContext = this.conversationContext.slice(-10);
                }
                
                // Show source indicator
                if (result.source === 'claude') {
                    this.showNotification('Response generated by Claude AI', 'info');
                }
            } else {
                throw new Error(result.error || 'Failed to generate response');
            }
        } catch (error) {
            this.hideTypingIndicator();
            this.isTyping = false;
            
            // Fallback to local response
            const fallbackResponse = this.generateContextualResponse(userMessage, attachments);
            this.addMessage(fallbackResponse, 'ai');
            
            this.conversationContext.push({
                role: 'assistant',
                content: fallbackResponse,
                timestamp: new Date().toISOString()
            });
            
            this.showNotification('Using fallback response', 'info');
        }
    }

    generateContextualResponse(userMessage, attachments = []) {
        const message = userMessage.toLowerCase();
        const context = this.analyzeConversationContext();
        
        // Enhanced AI response generation with research capabilities
        if (attachments.length > 0) {
            return this.generateAttachmentResponse(userMessage, attachments, context);
        }
        
        // Analyze user intent and provide comprehensive responses
        const intent = this.analyzeUserIntent(message);
        return this.generateComprehensiveResponse(intent, message, context);
    }

    analyzeConversationContext() {
        const recentMessages = this.conversationContext.slice(-5);
        const topics = [];
        const questions = [];
        
        recentMessages.forEach(msg => {
            if (msg.role === 'user') {
                const words = msg.content.toLowerCase().split(' ');
                words.forEach(word => {
                    if (word.length > 3) {
                        topics.push(word);
                    }
                });
                if (msg.content.includes('?')) {
                    questions.push(msg.content);
                }
            }
        });
        
        return {
            topics: [...new Set(topics)],
            questions: questions,
            messageCount: recentMessages.length
        };
    }

    analyzeUserIntent(message) {
        const messageLower = message.toLowerCase();
        
        // Intent classification
        if (messageLower.includes('how') || messageLower.includes('how to')) {
            return 'how-to';
        }
        if (messageLower.includes('what') || messageLower.includes('what is')) {
            return 'definition';
        }
        if (messageLower.includes('why') || messageLower.includes('why is')) {
            return 'explanation';
        }
        if (messageLower.includes('when') || messageLower.includes('when should')) {
            return 'timing';
        }
        if (messageLower.includes('where') || messageLower.includes('where can')) {
            return 'location';
        }
        if (messageLower.includes('best') || messageLower.includes('recommend')) {
            return 'recommendation';
        }
        if (messageLower.includes('problem') || messageLower.includes('issue') || messageLower.includes('error')) {
            return 'troubleshooting';
        }
        if (messageLower.includes('compare') || messageLower.includes('vs') || messageLower.includes('difference')) {
            return 'comparison';
        }
        if (messageLower.includes('example') || messageLower.includes('sample')) {
            return 'example';
        }
        
        return 'general';
    }

    generateAttachmentResponse(message, attachments, context) {
        const fileTypes = attachments.map(file => file.name.split('.').pop().toLowerCase());
        
        if (fileTypes.some(type => ['pdf', 'doc', 'docx'].includes(type))) {
            return `I see you've shared a document! This is excellent for providing context to your question. 

Based on the document you've uploaded, I can help you with:

**Document Analysis:**
• Extract key information and specifications
• Identify project requirements and constraints
• Analyze technical details and compliance requirements
• Review contract terms and project scope

**Construction Planning:**
• Create project timelines based on document specifications
• Develop resource allocation strategies
• Identify potential risks and mitigation strategies
• Set up quality control checkpoints

**Project Management:**
• Organize document workflows and approval processes
• Set up document version control and collaboration
• Create task assignments based on document requirements
• Establish communication protocols for stakeholders

What specific aspect of this document would you like me to help you analyze or implement in Desa Wire? I can provide step-by-step guidance tailored to your specific needs.`;
        }
        
        if (fileTypes.some(type => ['jpg', 'jpeg', 'png', 'gif'].includes(type))) {
            return `Thank you for sharing an image! Visual context is incredibly valuable for construction project management.

I can help you with:

**Image Analysis:**
• Site progress assessment and documentation
• Safety compliance verification
• Quality control inspection points
• Resource and equipment identification

**Project Documentation:**
• Create photo-based progress reports
• Set up visual inspection checklists
• Organize site photos by location and date
• Generate visual project timelines

**Team Collaboration:**
• Share site updates with stakeholders
• Create visual communication channels
• Set up photo-based task assignments
• Establish visual quality standards

**Desa Wire Integration:**
• Upload and organize project photos
• Create photo-based project reports
• Set up visual progress tracking
• Establish photo documentation workflows

What would you like me to help you understand or implement based on this image? I can provide specific guidance on how to leverage this visual information in your Desa Wire project management workflow.`;
        }
        
        if (fileTypes.some(type => ['xlsx', 'xls'].includes(type))) {
            return `I see you've shared a spreadsheet! Data analysis is crucial for effective project management.

I can help you with:

**Data Analysis:**
• Budget tracking and cost analysis
• Resource allocation optimization
• Schedule performance evaluation
• Risk assessment and mitigation

**Project Planning:**
• Create comprehensive project budgets
• Develop resource allocation strategies
• Set up performance tracking systems
• Establish reporting and analytics workflows

**Desa Wire Integration:**
• Import and organize project data
• Create custom dashboards and reports
• Set up automated data synchronization
• Establish data-driven decision making processes

**Best Practices:**
• Data validation and quality control
• Performance metrics and KPIs
• Trend analysis and forecasting
• Stakeholder reporting and communication

What specific analysis or implementation would you like me to help you with? I can provide detailed guidance on how to leverage this data effectively in your Desa Wire project management system.`;
        }
        
        return `I've received your file attachment! I can help you analyze and utilize this information effectively in your Desa Wire project management workflow. What specific aspect would you like me to help you with?`;
    }

    generateComprehensiveResponse(intent, message, context) {
        const responses = {
            'how-to': this.generateHowToResponse(message, context),
            'definition': this.generateDefinitionResponse(message, context),
            'explanation': this.generateExplanationResponse(message, context),
            'timing': this.generateTimingResponse(message, context),
            'location': this.generateLocationResponse(message, context),
            'recommendation': this.generateRecommendationResponse(message, context),
            'troubleshooting': this.generateTroubleshootingResponse(message, context),
            'comparison': this.generateComparisonResponse(message, context),
            'example': this.generateExampleResponse(message, context),
            'general': this.generateGeneralResponse(message, context)
        };
        
        return responses[intent] || responses['general'];
    }

    generateHowToResponse(message, context) {
        if (message.includes('project')) {
            return `I'll guide you through creating and managing projects in Desa Wire step by step:

**Project Creation Process:**

1. **Initial Setup:**
   • Navigate to the Projects section
   • Click "New Project" button
   • Enter project name and description
   • Select project template or start blank

2. **Project Configuration:**
   • Set project timeline and milestones
   • Define project phases and deliverables
   • Assign team members and roles
   • Set up communication channels

3. **Resource Planning:**
   • Allocate budget and resources
   • Schedule equipment and materials
   • Plan workforce requirements
   • Set up quality control checkpoints

4. **Implementation:**
   • Create task assignments
   • Set up progress tracking
   • Establish reporting schedules
   • Monitor performance metrics

**Best Practices:**
• Start with clear project objectives
• Involve all stakeholders in planning
• Set realistic timelines and budgets
• Establish regular communication protocols
• Monitor progress continuously

Would you like me to elaborate on any specific step or help you with a particular aspect of project management?`;
        }
        
        if (message.includes('schedule') || message.includes('timeline')) {
            return `Creating effective project schedules is crucial for success. Here's a comprehensive approach:

**Schedule Development Process:**

1. **Project Breakdown:**
   • Identify all project phases
   • List all tasks and deliverables
   • Estimate task durations
   • Identify dependencies between tasks

2. **Resource Allocation:**
   • Assign team members to tasks
   • Allocate equipment and materials
   • Consider resource availability
   • Plan for resource conflicts

3. **Timeline Creation:**
   • Use Gantt charts for visualization
   • Identify critical path
   • Set milestones and checkpoints
   • Build in buffer time for delays

4. **Risk Management:**
   • Identify potential delays
   • Plan contingency measures
   • Set up early warning systems
   • Establish escalation procedures

**Desa Wire Features:**
• Drag-and-drop scheduling interface
• Real-time progress tracking
• Automated notifications and alerts
• Resource conflict detection
• Mobile access for field updates

**Pro Tips:**
• Start with high-level milestones
• Break down complex tasks
• Consider seasonal factors
• Plan for weather delays
• Regular schedule reviews

What specific scheduling challenge are you facing? I can provide targeted guidance for your situation.`;
        }
        
        return `I'd be happy to help you with that! To provide the most accurate step-by-step guidance, could you provide more specific details about what you're trying to accomplish? This will help me tailor my instructions to your exact needs.`;
    }

    generateDefinitionResponse(message, context) {
        if (message.includes('project management')) {
            return `**Project Management** is the application of knowledge, skills, tools, and techniques to project activities to meet project requirements.

**Key Components:**

**Planning:**
• Defining project scope and objectives
• Creating project schedules and timelines
• Allocating resources and budget
• Identifying risks and mitigation strategies

**Execution:**
• Coordinating team activities
• Managing resources and materials
• Monitoring progress and performance
• Ensuring quality standards

**Control:**
• Tracking project progress
• Managing changes and variations
• Controlling costs and schedule
• Ensuring compliance with requirements

**Closure:**
• Completing project deliverables
• Conducting project reviews
• Documenting lessons learned
• Transitioning to operations

**In Construction Context:**
Project management in construction involves coordinating complex activities, managing multiple stakeholders, ensuring safety compliance, and delivering projects on time and within budget.

**Desa Wire's Role:**
Desa Wire provides comprehensive project management tools specifically designed for construction projects, including scheduling, resource management, collaboration, and reporting capabilities.

Would you like me to explain any specific aspect of project management in more detail?`;
        }
        
        return `I'd be happy to define that for you! Could you provide more specific details about what term or concept you'd like me to explain? This will help me give you a comprehensive and accurate definition.`;
    }

    generateExplanationResponse(message, context) {
        return `I'd be happy to explain that in detail! To provide the most comprehensive explanation, could you specify what aspect you'd like me to focus on? I can cover the underlying principles, practical applications, and how it relates to your Desa Wire project management needs.`;
    }

    generateTimingResponse(message, context) {
        return `Timing is crucial in project management! To give you the most relevant guidance, could you specify what type of timing question you have? I can help with project phases, task scheduling, resource allocation timing, or any other timing-related aspects of your Desa Wire project.`;
    }

    generateLocationResponse(message, context) {
        return `I can help you with location-based project management! Could you provide more details about what specific location information you need? I can assist with site management, geographic project organization, or location-based features in Desa Wire.`;
    }

    generateRecommendationResponse(message, context) {
        return `I'd be happy to provide recommendations! To give you the most relevant suggestions, could you share more details about your specific situation, goals, or challenges? I can recommend best practices, tools, strategies, or approaches tailored to your Desa Wire project management needs.`;
    }

    generateTroubleshootingResponse(message, context) {
        return `I'm here to help troubleshoot your issue! To provide the most effective solution, could you describe the specific problem you're experiencing? Include details about what you were trying to do, what happened, and any error messages you received. I'll provide step-by-step troubleshooting guidance.`;
    }

    generateComparisonResponse(message, context) {
        return `I can help you compare different options! To provide a thorough comparison, could you specify what you'd like me to compare? I can analyze different approaches, tools, methods, or strategies related to your Desa Wire project management needs.`;
    }

    generateExampleResponse(message, context) {
        return `I'd be happy to provide examples! To give you the most relevant examples, could you specify what type of examples you're looking for? I can provide real-world scenarios, use cases, templates, or sample workflows related to your Desa Wire project management needs.`;
    }

    generateGeneralResponse(message, context) {
        return `I'm here to help you with your Desa Wire project management needs! I can assist with:

**Project Management:**
• Project planning and execution
• Resource allocation and scheduling
• Team collaboration and communication
• Quality control and compliance

**Construction-Specific:**
• Safety management and protocols
• Equipment and material tracking
• Site progress monitoring
• Regulatory compliance

**Desa Wire Features:**
• Platform navigation and setup
• Advanced feature utilization
• Workflow optimization
• Integration and customization

**Best Practices:**
• Industry standards and methodologies
• Efficiency improvements
• Risk management strategies
• Performance optimization

What specific area would you like to explore? I can provide detailed guidance, step-by-step instructions, or answer any questions you have about construction project management with Desa Wire.`;
    }

    getAIResponses(userMessage) {
        // Enhanced intelligent responses with context awareness
        const message = userMessage.toLowerCase();
        
        // Greeting responses
        if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
            return [
                "Hello! I'm DesaBot, your intelligent AI assistant for Desa Wire. I'm here to help you with project management, construction workflows, and any questions you might have. How can I assist you today?",
                "Hi there! Welcome to Desa Wire. I'm equipped with advanced knowledge about construction project management, team collaboration, and Desa Wire's features. What would you like to explore?",
                "Hello! I'm your dedicated AI assistant, ready to help you navigate Desa Wire's powerful project management tools. What can I help you with today?"
            ];
        }

        // Project management intelligence
        if (message.includes('project') || message.includes('construction') || message.includes('build')) {
            return [
                "I can help you with comprehensive project management strategies! Desa Wire offers advanced tools for construction project planning, resource allocation, progress tracking, and team coordination. Are you looking to create a new project, manage existing ones, or optimize your current workflows?",
                "For construction projects, I recommend starting with clear project phases, defining milestones, and setting up proper communication channels. Desa Wire's project templates can help streamline this process. What specific aspect of project management interests you?",
                "Project management in construction requires careful planning and execution. I can guide you through Desa Wire's features like Gantt charts, resource management, document sharing, and real-time collaboration tools. What's your current project challenge?"
            ];
        }

        // Technical support and troubleshooting
        if (message.includes('help') || message.includes('support') || message.includes('problem') || message.includes('issue')) {
            return [
                "I'm here to provide comprehensive support! I can help with Desa Wire functionality, troubleshooting technical issues, optimizing workflows, and best practices. Please describe your specific issue or question, and I'll provide detailed guidance.",
                "For technical support, I can assist with account settings, project configurations, user permissions, data export, and integration setup. What specific area do you need help with?",
                "I'm equipped to handle various support scenarios including login issues, project access problems, notification settings, and feature explanations. Let me know what you're experiencing, and I'll provide step-by-step solutions."
            ];
        }

        // Scheduling and timeline intelligence
        if (message.includes('schedule') || message.includes('timeline') || message.includes('deadline') || message.includes('milestone')) {
            return [
                "Scheduling is crucial for project success! I can help you create comprehensive project timelines, set realistic milestones, manage dependencies, and track progress. Desa Wire's scheduling tools include Gantt charts, critical path analysis, and resource allocation. What type of scheduling challenge are you facing?",
                "For effective timeline management, consider breaking projects into phases, identifying critical dependencies, and setting buffer time for unexpected delays. I can guide you through Desa Wire's advanced scheduling features. What's your timeline goal?",
                "Timeline optimization requires understanding project scope, resource availability, and potential risks. I can help you create flexible schedules that adapt to changes while maintaining project objectives. What scheduling aspect would you like to explore?"
            ];
        }

        // Team collaboration intelligence
        if (message.includes('team') || message.includes('collaboration') || message.includes('member') || message.includes('user')) {
            return [
                "Team collaboration is essential for project success! I can help you set up effective team structures, manage user permissions, establish communication protocols, and optimize workflow coordination. Desa Wire provides real-time collaboration tools, shared workspaces, and integrated communication features. What team management challenge are you facing?",
                "For successful team collaboration, consider role-based access control, clear communication channels, regular check-ins, and shared documentation. I can guide you through Desa Wire's team management features. How can I help optimize your team workflow?",
                "Effective team management involves understanding individual strengths, setting clear expectations, and maintaining open communication. I can help you leverage Desa Wire's collaboration tools to enhance team productivity. What aspect of team management interests you?"
            ];
        }

        // Reporting and analytics intelligence
        if (message.includes('report') || message.includes('analytics') || message.includes('data') || message.includes('metrics')) {
            return [
                "Data-driven insights are crucial for project success! I can help you generate comprehensive reports, set up custom dashboards, analyze project performance metrics, and identify improvement opportunities. Desa Wire offers advanced reporting tools for budget tracking, progress analysis, and team productivity. What type of reporting do you need?",
                "For effective project analytics, focus on key performance indicators (KPIs) like budget variance, schedule adherence, resource utilization, and quality metrics. I can guide you through Desa Wire's reporting features. What insights are you looking to gain?",
                "Project analytics help identify trends, predict risks, and optimize performance. I can help you create custom reports, set up automated notifications, and interpret data to make informed decisions. What reporting challenge can I help you solve?"
            ];
        }

        // Budget and cost management
        if (message.includes('budget') || message.includes('cost') || message.includes('financial') || message.includes('money')) {
            return [
                "Budget management is critical for project success! I can help you create detailed budgets, track expenses, monitor cost variances, and optimize resource allocation. Desa Wire provides comprehensive financial tracking tools, cost analysis reports, and budget forecasting capabilities. What budget management challenge are you facing?",
                "For effective cost control, establish clear budget baselines, implement regular cost monitoring, and set up alerts for budget overruns. I can guide you through Desa Wire's financial management features. How can I help optimize your project finances?",
                "Financial planning requires understanding project scope, resource costs, and potential risks. I can help you create realistic budgets, track expenses, and identify cost-saving opportunities. What financial aspect would you like to explore?"
            ];
        }

        // Quality and safety management
        if (message.includes('quality') || message.includes('safety') || message.includes('inspection') || message.includes('compliance')) {
            return [
                "Quality and safety are paramount in construction! I can help you establish quality control processes, implement safety protocols, manage inspections, and ensure compliance with regulations. Desa Wire provides tools for quality checklists, safety documentation, and compliance tracking. What quality or safety challenge are you addressing?",
                "For effective quality management, establish clear standards, implement regular inspections, and maintain detailed documentation. I can guide you through Desa Wire's quality control features. How can I help improve your quality processes?",
                "Safety management requires proactive planning, regular training, and continuous monitoring. I can help you set up safety protocols, track incidents, and ensure regulatory compliance. What safety aspect would you like to focus on?"
            ];
        }

        // Document management
        if (message.includes('document') || message.includes('file') || message.includes('attachment') || message.includes('upload')) {
            return [
                "Document management is essential for project organization! I can help you organize project files, set up document workflows, manage version control, and ensure proper access permissions. Desa Wire provides comprehensive document management with cloud storage, collaboration features, and automated organization. What document management challenge are you facing?",
                "For effective document control, establish clear naming conventions, implement version tracking, and set up automated backup systems. I can guide you through Desa Wire's document management features. How can I help optimize your document workflow?",
                "Proper document management ensures team access to current information and maintains project history. I can help you set up document templates, approval workflows, and access controls. What document management aspect interests you?"
            ];
        }

        // Advanced project features
        if (message.includes('advanced') || message.includes('feature') || message.includes('capability') || message.includes('function')) {
            return [
                "Desa Wire offers advanced features for sophisticated project management! I can help you explore automation tools, custom workflows, API integrations, advanced reporting, and scalability options. What advanced functionality are you interested in learning about?",
                "For power users, Desa Wire provides customization options, advanced analytics, third-party integrations, and enterprise-level features. I can guide you through these capabilities. What advanced feature would you like to explore?",
                "Desa Wire's advanced features include automated workflows, custom dashboards, advanced permissions, and integration capabilities. I can help you leverage these tools for maximum efficiency. What advanced aspect interests you?"
            ];
        }

        // Training and learning
        if (message.includes('learn') || message.includes('training') || message.includes('tutorial') || message.includes('guide')) {
            return [
                "I'm here to help you master Desa Wire! I can provide step-by-step tutorials, best practice guides, workflow optimization tips, and advanced feature training. Whether you're a beginner or looking to enhance your skills, I can tailor the learning experience to your needs. What would you like to learn about?",
                "For effective learning, I recommend starting with core features, then exploring advanced capabilities. I can provide personalized training paths, practical examples, and hands-on guidance. What aspect of Desa Wire would you like to master?",
                "Continuous learning is key to maximizing Desa Wire's potential! I can help you stay updated with new features, learn optimization techniques, and develop advanced workflows. What learning goal do you have?"
            ];
        }

        // Contextual and intelligent responses
        if (message.includes('how') || message.includes('what') || message.includes('why') || message.includes('when') || message.includes('where')) {
            return [
                "That's a great question! I'm designed to provide detailed, actionable answers about Desa Wire's features and best practices. Could you provide more specific details about what you're trying to accomplish? This will help me give you the most relevant and helpful guidance.",
                "I'd be happy to help you with that! To provide the most accurate assistance, could you share more context about your specific situation or goal? This will allow me to tailor my response to your exact needs.",
                "Excellent question! I'm equipped with comprehensive knowledge about Desa Wire and construction project management. With a bit more detail about your specific scenario, I can provide targeted advice and step-by-step guidance."
            ];
        }

        // Default intelligent responses
        return [
            "I understand you're looking for information about Desa Wire. I'm designed to provide comprehensive assistance with project management, construction workflows, and technical support. Could you provide more specific details about what you'd like to know? I'm here to help you succeed!",
            "That's an interesting topic! I'm equipped with extensive knowledge about Desa Wire's features, best practices, and construction project management. To give you the most helpful response, could you share more context about your specific needs or challenges?",
            "I'm here to provide intelligent, actionable guidance! I can help with project management strategies, technical support, workflow optimization, and best practices. What specific aspect of Desa Wire or construction project management would you like to explore?",
            "Great question! I'm designed to offer detailed, context-aware assistance. Whether you need help with project setup, team management, reporting, or advanced features, I can provide step-by-step guidance. What would you like to accomplish?",
            "I'm ready to help you succeed with Desa Wire! I can assist with everything from basic features to advanced project management strategies. What specific challenge or goal are you working on? I'll provide tailored advice to help you achieve it."
        ];
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    updateTimestamp() {
        const timestamp = document.getElementById('chatTimestamp');
        if (timestamp) {
            timestamp.textContent = this.getCurrentTime();
        }
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    handleFileSelection(files) {
        const fileArray = Array.from(files);
        const maxFileSize = 10 * 1024 * 1024; // 10MB limit
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'text/plain',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];

        fileArray.forEach(file => {
            if (file.size > maxFileSize) {
                this.showNotification(`File ${file.name} is too large. Maximum size is 10MB.`, 'error');
                return;
            }

            if (!allowedTypes.includes(file.type)) {
                this.showNotification(`File type ${file.type} is not supported.`, 'error');
                return;
            }

            // Check if file already exists
            const exists = this.attachedFiles.some(f => f.name === file.name && f.size === file.size);
            if (!exists) {
                this.attachedFiles.push(file);
            }
        });

        this.updateFilePreview();
    }

    updateFilePreview() {
        const filePreviewArea = document.getElementById('filePreviewArea');
        const filePreviewList = document.getElementById('filePreviewList');

        if (this.attachedFiles.length === 0) {
            filePreviewArea.style.display = 'none';
            return;
        }

        filePreviewArea.style.display = 'block';
        filePreviewList.innerHTML = '';

        this.attachedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-preview-item';

            const fileIcon = document.createElement('div');
            fileIcon.className = `file-icon ${this.getFileExtension(file.name)}`;
            fileIcon.textContent = this.getFileExtension(file.name).toUpperCase();

            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';

            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.textContent = file.name;

            const fileSize = document.createElement('div');
            fileSize.className = 'file-size';
            fileSize.textContent = this.formatFileSize(file.size);

            fileInfo.appendChild(fileName);
            fileInfo.appendChild(fileSize);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'file-remove-btn';
            removeBtn.innerHTML = '×';
            removeBtn.addEventListener('click', () => {
                this.removeFile(index);
            });

            fileItem.appendChild(fileIcon);
            fileItem.appendChild(fileInfo);
            fileItem.appendChild(removeBtn);

            filePreviewList.appendChild(fileItem);
        });
    }

    removeFile(index) {
        this.attachedFiles.splice(index, 1);
        this.updateFilePreview();
    }

    clearAllFiles() {
        this.attachedFiles = [];
        this.updateFilePreview();
        document.getElementById('fileInput').value = '';
    }

    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    autoResizeTextarea(textarea) {
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        
        // Set height to scrollHeight, with min and max constraints
        const minHeight = 20;
        const maxHeight = 120;
        const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
        
        textarea.style.height = newHeight + 'px';
        
        // Show scrollbar if content exceeds max height
        if (textarea.scrollHeight > maxHeight) {
            textarea.style.overflowY = 'auto';
        } else {
            textarea.style.overflowY = 'hidden';
        }
    }

    formatUserInput(input) {
        // Professional input formatting
        let value = input.value;
        
        // Remove excessive whitespace
        value = value.replace(/\s+/g, ' ');
        
        // Capitalize first letter of sentences
        value = value.replace(/([.!?])\s*([a-z])/g, (match, p1, p2) => {
            return p1 + ' ' + p2.toUpperCase();
        });
        
        // Ensure proper capitalization at the beginning
        if (value.length > 0) {
            value = value.charAt(0).toUpperCase() + value.slice(1);
        }
        
        // Update input value
        input.value = value;
        
        // Update character count
        this.updateCharacterCount(value.length);
    }

    updateCharacterCount(length) {
        let counter = document.getElementById('charCounter');
        if (!counter) {
            counter = document.createElement('div');
            counter.id = 'charCounter';
            counter.style.cssText = `
                position: absolute;
                bottom: -20px;
                right: 0;
                font-size: 11px;
                color: #718096;
                pointer-events: none;
            `;
            document.getElementById('chatInput').parentElement.style.position = 'relative';
            document.getElementById('chatInput').parentElement.appendChild(counter);
        }
        
        counter.textContent = `${length}/1000`;
        counter.style.color = length > 900 ? '#e53e3e' : '#718096';
    }

    contactHumanSupport() {
        this.addMessage("I'm connecting you with our human support team. Please provide a brief description of your issue:", 'ai');
        
        // Show contact form or redirect
        setTimeout(() => {
            this.addMessage("**Contact Options:**\n\n• **Email:** support@desawire.com\n• **Phone:** +1 (555) 123-4567\n• **Live Chat:** Available 9 AM - 6 PM EST\n• **Emergency:** Call our 24/7 hotline\n\n**Please include:**\n• Your project details\n• Specific issue description\n• Any error messages\n• Screenshots if applicable", 'ai');
            
            this.showNotification('Human support contact information provided', 'info');
        }, 1000);
    }

    searchKnowledgeBase() {
        this.addMessage("I can help you search our knowledge base. What specific topic would you like to explore?", 'ai');
        
        setTimeout(() => {
            this.addMessage("**Knowledge Base Categories:**\n\n• **Project Management:** Planning, scheduling, resource allocation\n• **Construction Best Practices:** Safety, quality control, compliance\n• **Desa Wire Features:** Platform navigation, advanced tools\n• **Troubleshooting:** Common issues and solutions\n• **API Documentation:** Integration guides and examples\n• **Training Materials:** Video tutorials and guides\n\n**Popular Topics:**\n• How to create project timelines\n• Budget management strategies\n• Team collaboration setup\n• Mobile app usage\n• Report generation\n\nWhat would you like to learn more about?", 'ai');
        }, 1000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#e53e3e' : '#48bb78'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10001;
            font-weight: 500;
            font-size: 14px;
            max-width: 300px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize chat widget when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DesaChatWidget();
});
