document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const themeToggle = document.getElementById('theme-toggle');
    const themeToggleMobile = document.getElementById('theme-toggle-mobile');
    const authSection = document.getElementById('auth-section');
    const chatContainer = document.getElementById('chat-container');
    const emailInput = document.getElementById('email-input');
    const loginForm = document.getElementById('login-form');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');
    const typingIndicator = document.getElementById('typing-indicator');
    const userDisplayEmail = document.getElementById('user-display-email');

    // State
    let userEmail = sessionStorage.getItem('bookleaf_email') || '';
    let chatHistory = JSON.parse(sessionStorage.getItem('bookleaf_chat_history')) || [];
    
    // Webhook URL
    const WEBHOOK_URL = 'https://mukul1811.app.n8n.cloud/webhook/query';

    // Theme initialization
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.className = savedTheme;
    updateThemeIcon(savedTheme);

    function toggleTheme() {
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.className = newTheme;
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }

    if(themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if(themeToggleMobile) themeToggleMobile.addEventListener('click', toggleTheme);

    function updateThemeIcon(theme) {
        const iconMobile = themeToggleMobile ? themeToggleMobile.querySelector('span') : null;
        const iconDesk = themeToggle ? themeToggle.querySelector('span') : null;
        const textDesk = document.getElementById('theme-text');
        
        const iconName = theme === 'dark' ? 'light_mode' : 'dark_mode';
        const labelName = theme === 'dark' ? 'Light Mode' : 'Dark Mode';

        if(iconMobile) iconMobile.textContent = iconName;
        if(iconDesk) iconDesk.textContent = iconName;
        if(textDesk) textDesk.textContent = labelName;
    }

    // Auth screen initialization
    if (userEmail) {
        showChatScreen(false); // Jump immediately
        restoreChatHistory();
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        if (email && validateEmail(email)) {
            userEmail = email;
            sessionStorage.setItem('bookleaf_email', email);
            
            // Transition out login form
            authSection.style.transform = 'scale(0.95)';
            authSection.style.opacity = '0';
            
            setTimeout(() => {
                showChatScreen(true);
                // Add welcome message if history is empty
                if (chatHistory.length === 0) {
                    setTimeout(() => {
                        addBotMessage(`Hello! I'm your BookLeaf Publishing AI assistant.\n\nI can help you check your royalty status, verify when your book goes live, or answer questions about our packages. What do you need to know today?`);
                    }, 500);
                }
            }, 300);
        } else {
            alert('Please enter a valid email address.');
        }
    });

    function showChatScreen(animate = true) {
        authSection.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        
        // Force reflow for animation
        void chatContainer.offsetWidth;
        
        chatContainer.classList.remove('opacity-0', 'scale-95');
        chatContainer.classList.add('opacity-100', 'scale-100');
        
        if (userDisplayEmail) userDisplayEmail.textContent = userEmail;
        messageInput.focus();
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Chat functionality
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (!message) return;

        messageInput.value = '';
        addUserMessage(message);
        typingIndicator.classList.remove('hidden');
        scrollToBottom();

        try {
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                },
                body: new URLSearchParams({
                    email: userEmail,
                    query: message,
                }).toString(),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            typingIndicator.classList.add('hidden');
            if (data.success === false) {
                addErrorMessage(data.response || "Sorry, I'm experiencing technical difficulties.");
            } else {
                addBotMessage(data.response, data.answer_source === 'fallback' || data.confidence < 80);
            }
        } catch (error) {
            console.error('Error contacting webhook:', error);
            typingIndicator.classList.add('hidden');
            addErrorMessage(`Cannot connect to the server. ${error.message || 'Request failed.'}`);
        }
    });

    // Premium UI Builders
    function addUserMessage(text) {
        const wrap = document.createElement('div');
        wrap.className = 'flex justify-end msg-anim w-full';
        
        const bubble = document.createElement('div');
        bubble.className = 'px-5 py-4 rounded-[1.5rem] rounded-tr-sm text-[15px] font-medium bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/20 max-w-[80%] break-words leading-relaxed';
        bubble.textContent = text;
        
        wrap.appendChild(bubble);
        chatMessages.appendChild(wrap);
        saveToHistory({ sender: 'user', text });
        scrollToBottom();
    }

    function addBotMessage(text, isEscalated = false) {
        const wrap = document.createElement('div');
        wrap.className = 'flex items-start gap-4 msg-anim w-full';
        
        // Avatar
        const avatar = document.createElement('div');
        avatar.className = 'w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm';
        avatar.innerHTML = `<span class="material-symbols-outlined text-[20px] text-white">auto_stories</span>`;
        
        const bubbleWrap = document.createElement('div');
        bubbleWrap.className = 'flex flex-col items-start max-w-[80%]';

        const bubble = document.createElement('div');
        bubble.className = 'px-6 py-4 rounded-[1.5rem] rounded-tl-sm text-[15px] font-medium bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-sm break-words leading-relaxed';
        
        let contentHtml = `<p class="whitespace-pre-wrap">${formatText(text)}</p>`;
        
        if (isEscalated) {
            contentHtml += `
            <div class="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
               <div class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full border border-orange-200 dark:border-orange-500/20 shadow-sm">
                  <span class="material-symbols-outlined text-[14px]">support_agent</span> Handed to Human Agent
               </div>
            </div>`;
        }
        
        bubble.innerHTML = contentHtml;
        bubbleWrap.appendChild(bubble);
        wrap.appendChild(avatar);
        wrap.appendChild(bubbleWrap);
        
        chatMessages.appendChild(wrap);
        saveToHistory({ sender: 'bot', text, isEscalated });
        scrollToBottom();
    }

    function addErrorMessage(text) {
        const wrap = document.createElement('div');
        wrap.className = 'flex items-start gap-3 msg-anim w-full';
        
        const bubble = document.createElement('div');
        bubble.className = 'px-5 py-4 rounded-[1.5rem] rounded-tl-sm text-[15px] font-medium bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 shadow-sm flex items-start gap-3 max-w-[80%] break-words';
        bubble.innerHTML = `<span class="material-symbols-outlined text-[20px] mt-0.5">error</span> <p class="leading-relaxed">${text}</p>`;
        
        wrap.appendChild(bubble);
        chatMessages.appendChild(wrap);
        saveToHistory({ sender: 'error', text });
        scrollToBottom();
    }

    function formatText(text) {
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // History management
    function saveToHistory(messageObj) {
        chatHistory.push(messageObj);
        sessionStorage.setItem('bookleaf_chat_history', JSON.stringify(chatHistory));
    }

    function restoreChatHistory() {
        chatHistory.forEach(msg => {
            if (msg.sender === 'user') {
                const wrap = document.createElement('div');
                wrap.className = 'flex justify-end w-full';
                const bubble = document.createElement('div');
                bubble.className = 'px-5 py-4 rounded-[1.5rem] rounded-tr-sm text-[15px] font-medium bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/20 max-w-[80%] break-words leading-relaxed';
                bubble.textContent = msg.text;
                wrap.appendChild(bubble);
                chatMessages.appendChild(wrap);
            } else if (msg.sender === 'bot') {
                const wrap = document.createElement('div');
                wrap.className = 'flex items-start gap-4 w-full';
                const avatar = document.createElement('div');
                avatar.className = 'w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm';
                avatar.innerHTML = `<span class="material-symbols-outlined text-[20px] text-white">auto_stories</span>`;
                const bubbleWrap = document.createElement('div');
                bubbleWrap.className = 'flex flex-col items-start max-w-[80%]';
                const bubble = document.createElement('div');
                bubble.className = 'px-6 py-4 rounded-[1.5rem] rounded-tl-sm text-[15px] font-medium bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-sm break-words leading-relaxed';
                let contentHtml = `<p class="whitespace-pre-wrap">${formatText(msg.text)}</p>`;
                if (msg.isEscalated) {
                    contentHtml += `<div class="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3"><div class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full border border-orange-200 dark:border-orange-500/20 shadow-sm"><span class="material-symbols-outlined text-[14px]">support_agent</span> Handed to Human Agent</div></div>`;
                }
                bubble.innerHTML = contentHtml;
                bubbleWrap.appendChild(bubble);
                wrap.appendChild(avatar);
                wrap.appendChild(bubbleWrap);
                chatMessages.appendChild(wrap);
            } else if (msg.sender === 'error') {
                const wrap = document.createElement('div');
                wrap.className = 'flex items-start gap-3 w-full';
                const bubble = document.createElement('div');
                bubble.className = 'px-5 py-4 rounded-[1.5rem] rounded-tl-sm text-[15px] font-medium bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 shadow-sm flex items-start gap-3 max-w-[80%] break-words';
                bubble.innerHTML = `<span class="material-symbols-outlined text-[20px] mt-0.5">error</span> <p class="leading-relaxed">${msg.text}</p>`;
                wrap.appendChild(bubble);
                chatMessages.appendChild(wrap);
            }
        });
        setTimeout(scrollToBottom, 50);
    }
});
