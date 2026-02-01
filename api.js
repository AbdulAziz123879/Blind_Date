// const API_URL = 'http://localhost:3000/api';

// class API {
//     static async request(endpoint, options = {}) {
//         const url = `${API_URL}${endpoint}`;
        
//         const token = localStorage.getItem('anondate_token');
//         const headers = {
//             'Content-Type': 'application/json',
//             ...options.headers
//         };
        
//         if (token) {
//             headers['Authorization'] = `Bearer ${token}`;
//         }
        
//         try {
//             const response = await fetch(url, {
//                 ...options,
//                 headers
//             });
            
//             const data = await response.json();
            
//             if (!response.ok) {
//                 throw new Error(data.error || 'Request failed');
//             }
            
//             return data;
//         } catch (error) {
//             console.error('API Error:', error);
//             throw error;
//         }
//     }
    
//     static async post(endpoint, body) {
//         return this.request(endpoint, {
//             method: 'POST',
//             body: JSON.stringify(body)
//         });
//     }
    
//     static async get(endpoint) {
//         return this.request(endpoint, {
//             method: 'GET'
//         });
//     }
    
//     static async put(endpoint, body) {
//         return this.request(endpoint, {
//             method: 'PUT',
//             body: JSON.stringify(body)
//         });
//     }
// }

// // Auth API
// const AuthAPI = {
//     signup: (email, password, anonName) => 
//         API.post('/auth/signup', { email, password, anonName }),
    
//     login: (email, password) => 
//         API.post('/auth/login', { email, password }),
    
//     getProfile: () => 
//         API.get('/profile'),
    
//     updateProfile: (data) => 
//         API.put('/profile', data)
// };

// // Matching API
// const MatchingAPI = {
//     findMatches: (answers, filters) => 
//         API.post('/matches/find', { answers, filters }),
    
//     startConversation: (matchId) => 
//         API.post('/conversations', { matchId })
// };

// // Chat API
// const ChatAPI = {
//     getConversations: () => 
//         API.get('/conversations'),
    
//     getMessages: (convId) => 
//         API.get(`/conversations/${convId}/messages`),
    
//     sendMessage: (convId, text) => 
//         API.post(`/conversations/${convId}/messages`, { text }),
    
//     updateReveal: (convId, level) => 
//         API.post(`/conversations/${convId}/reveal`, { level }),
    
//     blockUser: (userId, reason) => 
//         API.post('/block', { userId, reason })
// };


// const API_URL = 'http://localhost:3000/api';

// class API {
//     static async request(endpoint, options = {}) {
//         const url = `${API_URL}${endpoint}`;
        
//         const token = localStorage.getItem('anondate_token');
//         const headers = {
//             'Content-Type': 'application/json',
//             ...options.headers
//         };
        
//         if (token) {
//             headers['Authorization'] = `Bearer ${token}`;
//         }
        
//         try {
//             const response = await fetch(url, {
//                 ...options,
//                 headers
//             });
            
//             const data = await response.json();
            
//             if (!response.ok) {
//                 throw new Error(data.error || 'Request failed');
//             }
            
//             return data;
//         } catch (error) {
//             console.error('API Error:', error);
//             throw error;
//         }
//     }
    
//     static async post(endpoint, body) {
//         return this.request(endpoint, {
//             method: 'POST',
//             body: JSON.stringify(body)
//         });
//     }
    
//     static async get(endpoint) {
//         return this.request(endpoint, {
//             method: 'GET'
//         });
//     }
    
//     static async put(endpoint, body) {
//         return this.request(endpoint, {
//             method: 'PUT',
//             body: JSON.stringify(body)
//         });
//     }
// }

// // Auth API
// const AuthAPI = {
//     signup: (email, password, anonName) => 
//         API.post('/auth/signup', { email, password, anonName }),
    
//     login: (email, password) => 
//         API.post('/auth/login', { email, password }),
    
//     getProfile: () => 
//         API.get('/profile'),
    
//     updateProfile: (data) => 
//         API.put('/profile', data)
// };

// // Matching API
// const MatchingAPI = {
//     findMatches: (answers, filters) => 
//         API.post('/matches/find', { answers, filters }),
    
//     startConversation: (matchId) => 
//         API.post('/conversations', { matchId })
// };

// // Chat API
// const ChatAPI = {
//     getConversations: () => 
//         API.get('/conversations'),
    
//     getMessages: (convId) => 
//         API.get(`/conversations/${convId}/messages`),
    
//     sendMessage: (convId, text) => 
//         API.post(`/conversations/${convId}/messages`, { text }),
    
//     updateReveal: (convId, level) => 
//         API.post(`/conversations/${convId}/reveal`, { level }),
    
//     blockUser: (userId, reason) => 
//         API.post('/block', { userId, reason })
// };



const API_URL = 'http://localhost:3000/api';

class API {
    static async request(endpoint, options = {}) {
        const url = `${API_URL}${endpoint}`;
        
        const token = localStorage.getItem('anondate_token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        try {
            const response = await fetch(url, {
                ...options,
                headers
            });
            
            // Check content type before parsing
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server returned non-JSON response. Check server logs.');
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `Request failed with status ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            console.error('Endpoint:', endpoint);
            console.error('Options:', options);
            throw error;
        }
    }
    
    static async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
    
    static async get(endpoint) {
        return this.request(endpoint, {
            method: 'GET'
        });
    }
    
    static async put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }
}

// Auth API
const AuthAPI = {
    signup: (email, password, anonName) => 
        API.post('/auth/signup', { email, password, anonName }),
    
    login: (email, password) => 
        API.post('/auth/login', { email, password }),
    
    getProfile: () => 
        API.get('/profile'),
    
    updateProfile: (data) => 
        API.put('/profile', data)
};

// Matching API
const MatchingAPI = {
    findMatches: (answers, filters) => 
        API.post('/matches/find', { answers, filters }),
    
    startConversation: (matchId) => 
        API.post('/conversations', { matchId })
};

// Chat API
const ChatAPI = {
    getConversations: () => 
        API.get('/conversations'),
    
    getMessages: (convId) => 
        API.get(`/conversations/${convId}/messages`),
    
    sendMessage: (convId, text) => 
        API.post(`/conversations/${convId}/messages`, { text }),
    
    updateReveal: (convId, level) => 
        API.post(`/conversations/${convId}/reveal`, { level }),
    
    blockUser: (userId, reason) => 
        API.post('/block', { userId, reason })
};