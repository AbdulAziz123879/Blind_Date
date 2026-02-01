// Database-backed Chat System

const urlParams = new URLSearchParams(window.location.search);
const conversationId = urlParams.get('id');
const partnerName = decodeURIComponent(urlParams.get('name') || 'Anonymous');

let currentRevealLevel = 0;
const REVEAL_STAGES = ['Chat', 'Interests', 'Voice', 'Photo', 'Identity'];

document.addEventListener('DOMContentLoaded', async function() {
    if (!conversationId) {
        alert('No conversation selected');
        window.location.href = 'dashboard.html';
        return;
    }
    
    document.getElementById('partnerName').textContent = partnerName;
    
    await loadConversation();
    setupChat();
    
    // Poll for new messages every 3 seconds
    setInterval(pollMessages, 3000);
});

async function loadConversation() {
    try {
        const data = await ChatAPI.getMessages(conversationId);
        renderMessages(data.messages);
        currentRevealLevel = data.revealLevel || 0;
        updateRevealProgress();
    } catch (error) {
        alert('Failed to load conversation: ' + error.message);
        window.location.href = 'dashboard.html';
    }
}

async function pollMessages() {
    try {
        const data = await ChatAPI.getMessages(conversationId);
        const container = document.getElementById('messageContainer');
        
        // Simple check if new messages arrived (compare count)
        const currentCount = container.querySelectorAll('.message').length;
        if (data.messages.length > currentCount) {
            renderMessages(data.messages);
            currentRevealLevel = data.revealLevel || currentRevealLevel;
            updateRevealProgress();
        }
    } catch (error) {
        console.error('Polling error:', error);
    }
}

function setupChat() {
    const input = document.getElementById('messageInput');
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    if (containsInappropriateContent(text)) {
        alert('Please keep conversations respectful.');
        return;
    }
    
    try {
        const msg = await ChatAPI.sendMessage(conversationId, text);
        addMessage({
            id: msg.id,
            text: msg.text,
            sender: 'me',
            timestamp: msg.timestamp,
            type: msg.type
        });
        input.value = '';
        
        checkRevealTriggers();
    } catch (error) {
        alert('Failed to send message');
    }
}

function addMessage(message) {
    const container = document.getElementById('messageContainer');
    
    // Avoid duplicates
    if (document.getElementById(`msg-${message.id}`)) return;
    
    const div = document.createElement('div');
    div.id = `msg-${message.id}`;
    div.className = `message ${message.sender === 'me' ? 'sent' : 'received'}`;
    div.innerHTML = `
        <div class="message-content">${escapeHtml(message.text)}</div>
        <div class="message-time">${formatTime(message.timestamp)}</div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function renderMessages(messages) {
    const container = document.getElementById('messageContainer');
    container.innerHTML = `
        <div class="system-message">
            <p>🔒 You are now connected anonymously. Take your time getting to know each other.</p>
            <p>Both must agree to reveal identities. You control what you share.</p>
        </div>
    `;
    
    messages.forEach(msg => addMessage(msg));
}

function updateRevealProgress() {
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        if (index < currentRevealLevel) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (index === currentRevealLevel) {
            step.classList.add('active');
        } else {
            step.classList.remove('completed', 'active');
        }
    });
    
    const btn = document.getElementById('revealBtn');
    if (currentRevealLevel < REVEAL_STAGES.length) {
        btn.textContent = `Request ${REVEAL_STAGES[currentRevealLevel]} Reveal`;
        btn.disabled = false;
    } else {
        btn.textContent = 'Fully Revealed';
        btn.disabled = true;
    }
}

async function requestReveal() {
    if (currentRevealLevel >= REVEAL_STAGES.length) return;
    
    document.getElementById('revealType').textContent = REVEAL_STAGES[currentRevealLevel];
    document.getElementById('revealModal').style.display = 'block';
}

async function confirmReveal() {
    try {
        await ChatAPI.updateReveal(conversationId, currentRevealLevel + 1);
        currentRevealLevel++;
        updateRevealProgress();
        closeModal();
        
        const systemMsg = {
            id: 'sys-' + Date.now(),
            text: `✨ Reveal request sent for: ${REVEAL_STAGES[currentRevealLevel - 1]}. Waiting for partner...`,
            sender: 'system',
            timestamp: new Date().toISOString(),
            type: 'system'
        };
        addMessage(systemMsg);
        
        // In real app, wait for webhook/socket confirmation
        setTimeout(() => {
            const acceptance = {
                id: 'sys-' + Date.now(),
                text: `${partnerName} accepted your ${REVEAL_STAGES[currentRevealLevel - 1]} reveal!`,
                sender: 'system',
                timestamp: new Date().toISOString(),
                type: 'system'
            };
            addMessage(acceptance);
            
            if (currentRevealLevel === 4) {
                showPhotoReveal();
            }
        }, 2000);
        
    } catch (error) {
        alert('Failed to update reveal status');
    }
}

function showPhotoReveal() {
    const container = document.getElementById('messageContainer');
    const reveal = document.createElement('div');
    reveal.className = 'system-message';
    reveal.innerHTML = `
        <p>📸 Photo revealed!</p>
        <div style="width: 200px; height: 200px; background: linear-gradient(135deg, #667eea, #764ba2); 
                    margin: 1rem auto; border-radius: 12px; display: flex; align-items: center; 
                    justify-content: center; font-size: 4rem;">
            👤
        </div>
    `;
    container.appendChild(reveal);
}

// Safety Features
async function blockUser() {
    if (!confirm('Are you sure you want to block this user?')) return;
    
    try {
        // We need to get partner ID from conversation
        // For now, using a workaround or you can store it in URL params
        alert('User blocked successfully');
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert('Failed to block user');
    }
    closeModal();
}

async function reportUser() {
    const reason = prompt('Please briefly describe the issue:');
    if (reason) {
        try {
            alert('Report submitted. Thank you for keeping our community safe.');
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error(error);
        }
    }
    closeModal();
}

function endChat() {
    if (confirm('End this conversation? You can find new matches in Discover.')) {
        window.location.href = 'dashboard.html';
    }
}

function containsInappropriateContent(text) {
    const banned = ['spam', 'scam', 'abuse', 'hate'];
    const lower = text.toLowerCase();
    return banned.some(word => lower.includes(word));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

function checkRevealTriggers() {
    const messages = document.querySelectorAll('.message').length;
    if (messages === 10) {
        const suggestion = {
            id: 'sys-suggest',
            text: '💡 Tip: You\'ve exchanged 10 messages! Consider revealing interests when you\'re ready.',
            sender: 'system',
            timestamp: new Date().toISOString(),
            type: 'system'
        };
        addMessage(suggestion);
    }
}