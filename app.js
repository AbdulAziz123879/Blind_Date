// Database-backed Dashboard Logic

document.addEventListener('DOMContentLoaded', async function() {
    if (document.getElementById('userAvatar')) {
        await initDashboard();
    }
});

async function initDashboard() {
    try {
        const profile = await AuthAPI.getProfile();
        
        // Set user avatar
        document.getElementById('userAvatar').textContent = 
            profile.anonName?.substring(0, 2) || 'Me';
        
        // Load profile data into settings form
        if (document.getElementById('anonName')) {
            document.getElementById('anonName').value = profile.anonName || '';
            document.getElementById('anonBio').value = profile.bio || '';
        }
        
        // Load conversations
        await loadConversations();
        
        // Setup sliders
        setupSliders();
        
        // Set filters if exists
        if (profile.preferences) {
            document.getElementById('genderPref').value = profile.preferences.gender || 'any';
            document.getElementById('ageMin').value = profile.preferences.ageMin || 25;
            document.getElementById('ageMax').value = profile.preferences.ageMax || 35;
            document.getElementById('distancePref').value = profile.preferences.distance || 'any';
            
            // Trigger update
            document.getElementById('ageMin').dispatchEvent(new Event('input'));
        }
        
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        if (error.message.includes('403') || error.message.includes('401')) {
            logout();
        }
    }
}

function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const sectionMap = {
        'discover': 'discoverSection',
        'conversations': 'conversationsSection',
        'settings': 'settingsSection'
    };
    
    const sectionId = sectionMap[sectionName];
    if (sectionId) {
        document.getElementById(sectionId).classList.add('active');
    }
    
    if (event && event.target) {
        event.target.closest('.nav-item').classList.add('active');
    }
}

function setupSliders() {
    const ageMin = document.getElementById('ageMin');
    const ageMax = document.getElementById('ageMax');
    
    if (!ageMin || !ageMax) return;
    
    function updateRange() {
        const min = parseInt(ageMin.value);
        const max = parseInt(ageMax.value);
        
        if (min > max) {
            ageMin.value = max;
        }
        
        document.getElementById('ageDisplay').textContent = `${ageMin.value} - ${ageMax.value}`;
    }
    
    ageMin.addEventListener('input', updateRange);
    ageMax.addEventListener('input', updateRange);
}

async function saveProfile() {
    const anonName = document.getElementById('anonName').value;
    const anonBio = document.getElementById('anonBio').value;
    
    if (!anonName) {
        alert('Please enter an anonymous display name');
        return;
    }
    
    try {
        await AuthAPI.updateProfile({
            anonName: anonName,
            bio: anonBio
        });
        alert('Profile saved!');
        document.getElementById('userAvatar').textContent = anonName.substring(0, 2);
    } catch (error) {
        alert('Failed to save profile: ' + error.message);
    }
}

async function loadConversations() {
    const container = document.getElementById('conversationsList');
    
    try {
        const conversations = await ChatAPI.getConversations();
        
        if (conversations.length === 0) {
            container.innerHTML = '<p class="empty-state">No active conversations. Go to Discover to find a match!</p>';
            return;
        }
        
        container.innerHTML = conversations.map(conv => `
            <a href="chat.html?id=${conv.id}&name=${encodeURIComponent(conv.partnerName)}" class="conversation-item">
                <div class="conv-avatar">${conv.partnerName?.substring(0, 2) || '??'}</div>
                <div class="conv-info">
                    <h3>${conv.partnerName || 'Anonymous User'}</h3>
                    <p>${conv.lastMessage || 'Start chatting...'}</p>
                </div>
                <div class="conv-meta">
                    <div class="conv-time">${formatTime(conv.lastActive)}</div>
                    ${conv.unread ? '<span class="unread">New</span>' : ''}
                </div>
            </a>
        `).join('');
        
        // Update badge
        const unreadCount = conversations.filter(c => c.unread).length;
        document.getElementById('unreadCount').textContent = unreadCount;
        
    } catch (error) {
        container.innerHTML = '<p class="empty-state">Failed to load conversations</p>';
    }
}

function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
}