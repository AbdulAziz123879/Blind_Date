let currentQuestion = 0;
let userAnswers = {};
let currentFilters = {};

const COMPATIBILITY_QUESTIONS = [
    {
        id: 1,
        icon: "🎯",
        question: "What's your ideal weekend?",
        subtitle: "Choose what excites you most",
        options: [
            { value: 'adventure', icon: '🏔️', text: 'Outdoor adventure & hiking' },
            { value: 'cozy', icon: '📚', text: 'Cozy reading & coffee' },
            { value: 'social', icon: '🎉', text: 'Social gatherings & parties' },
            { value: 'creative', icon: '🎨', text: 'Creative projects & art' }
        ]
    },
    {
        id: 2,
        icon: "💭",
        question: "How do you handle conflict?",
        subtitle: "Select your natural tendency",
        options: [
            { value: 'discuss', icon: '🗣️', text: 'Discuss immediately' },
            { value: 'reflect', icon: '🧘', text: 'Take time to reflect' },
            { value: 'compromise', icon: '🤝', text: 'Find middle ground' },
            { value: 'humor', icon: '😄', text: 'Use humor to diffuse' }
        ]
    },
    {
        id: 3,
        icon: "🎵",
        question: "What's your love language?",
        subtitle: "How do you show affection?",
        options: [
            { value: 'quality', icon: '⏰', text: 'Quality time together' },
            { value: 'words', icon: '💝', text: 'Words of affirmation' },
            { value: 'touch', icon: '🤗', text: 'Physical touch' },
            { value: 'gifts', icon: '🎁', text: 'Thoughtful gifts' }
        ]
    }
];

// Initialize range slider
document.addEventListener('DOMContentLoaded', function() {
    const ageMin = document.getElementById('ageMin');
    const ageMax = document.getElementById('ageMax');
    const ageDisplay = document.getElementById('ageDisplay');
    const rangeFill = document.getElementById('rangeFill');
    
    function updateRange() {
        let min = parseInt(ageMin.value);
        let max = parseInt(ageMax.value);
        
        if (min > max) {
            [min, max] = [max, min];
        }
        
        ageDisplay.textContent = `${min} - ${max}`;
        
        const minPercent = ((min - 18) / (80 - 18)) * 100;
        const maxPercent = ((max - 18) / (80 - 18)) * 100;
        
        rangeFill.style.left = minPercent + '%';
        rangeFill.style.width = (maxPercent - minPercent) + '%';
    }
    
    if (ageMin && ageMax) {
        ageMin.addEventListener('input', updateRange);
        ageMax.addEventListener('input', updateRange);
        updateRange();
    }
});

function collectFilters() {
    return {
        gender: document.getElementById('genderPref')?.value || 'any',
        ageMin: parseInt(document.getElementById('ageMin')?.value || 18),
        ageMax: parseInt(document.getElementById('ageMax')?.value || 80),
        distance: document.getElementById('distancePref')?.value || 'any'
    };
}

async function startCompatibilityQuiz() {
    currentFilters = collectFilters();
    
    // Save preferences to profile
    try {
        await AuthAPI.updateProfile({ preferences: currentFilters });
    } catch (e) {
        console.error('Failed to save preferences', e);
    }
    
    document.getElementById('filterStep').classList.add('hidden');
    document.getElementById('compatibilityQuiz').classList.remove('hidden');
    currentQuestion = 0;
    userAnswers = {};
    renderQuestion();
}

function renderQuestion() {
    const q = COMPATIBILITY_QUESTIONS[currentQuestion];
    
    const progress = ((currentQuestion) / COMPATIBILITY_QUESTIONS.length) * 100;
    document.getElementById('quizProgress').style.width = progress + '%';
    document.getElementById('currentQ').textContent = currentQuestion + 1;
    
    const card = document.querySelector('.question-card');
    card.style.animation = 'none';
    setTimeout(() => {
        card.style.animation = 'fadeIn 0.5s';
    }, 10);
    
    document.getElementById('qIcon').textContent = q.icon;
    document.getElementById('qText').textContent = q.question;
    document.querySelector('.question-subtitle').textContent = q.subtitle;
    
    const grid = document.getElementById('optionsGrid');
    grid.innerHTML = q.options.map(opt => `
        <div class="option-card" onclick="selectOption('${opt.value}', this)">
            <div class="option-icon">${opt.icon}</div>
            <div class="option-text">${opt.text}</div>
        </div>
    `).join('');
}

function selectOption(value, element) {
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    element.classList.add('selected');
    userAnswers[COMPATIBILITY_QUESTIONS[currentQuestion].id] = value;
    
    setTimeout(() => {
        nextQuestion();
    }, 600);
}

function nextQuestion() {
    currentQuestion++;
    
    if (currentQuestion < COMPATIBILITY_QUESTIONS.length) {
        renderQuestion();
    } else {
        finishQuiz();
    }
}

function skipQuestion() {
    nextQuestion();
}

async function finishQuiz() {
    document.getElementById('compatibilityQuiz').classList.add('hidden');
    document.getElementById('matchingAnimation').classList.remove('hidden');
    
    const statuses = [
        "Analyzing your personality profile...",
        "Searching compatible matches in database...",
        "Calculating compatibility scores...",
        "Finalizing results..."
    ];
    
    let i = 0;
    const statusEl = document.getElementById('matchingStatus');
    
    const interval = setInterval(() => {
        if (i < statuses.length) {
            statusEl.textContent = statuses[i];
            i++;
        }
    }, 800);
    
    try {
        const data = await MatchingAPI.findMatches(userAnswers, currentFilters);
        
        clearInterval(interval);
        document.getElementById('matchingAnimation').classList.add('hidden');
        document.getElementById('matchResults').classList.remove('hidden');
        displayMatches(data.matches);
    } catch (error) {
        clearInterval(interval);
        alert('Failed to find matches: ' + error.message);
        retakeQuiz();
    }
}

function displayMatches(matches) {
    document.getElementById('matchCount').textContent = matches.length;
    
    const grid = document.getElementById('matchesGrid');
    if (matches.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No matches found. Try adjusting your filters.</p>';
        return;
    }
    
    grid.innerHTML = matches.map((match, index) => `
        <div class="match-card" style="animation-delay: ${index * 0.1}s">
            <div class="match-compatibility">${match.compatibility}% Match</div>
            <div class="match-avatar" style="font-size: 4rem; background: var(--gradient-${['vibrant', 'cool', 'warm'][index % 3]})">
                ${match.avatar}
            </div>
            <h3>${match.name}</h3>
            <div class="match-distance">
                <span>📍</span>
                <span>${match.distance}</span>
                ${match.age ? `<span>• ${match.age} years</span>` : ''}
            </div>
            <p>${match.bio || 'No bio yet'}</p>
            <div class="match-traits">
                ${(match.interests || []).slice(0, 3).map(t => `<span class="trait-tag">${t}</span>`).join('') || `<span class="trait-tag">New User</span>`}
            </div>
            <button class="match-action" onclick="startConversation('${match.id}', '${match.name}')">
                <span>💬</span>
                <span>Start Conversation</span>
            </button>
        </div>
    `).join('');
}

function retakeQuiz() {
    document.getElementById('matchResults').classList.add('hidden');
    document.getElementById('filterStep').classList.remove('hidden');
}

async function startConversation(matchId, matchName) {
    try {
        const data = await MatchingAPI.startConversation(matchId);
        window.location.href = `chat.html?id=${data.conversationId}&name=${encodeURIComponent(matchName)}`;
    } catch (error) {
        alert('Failed to start conversation: ' + error.message);
    }
}