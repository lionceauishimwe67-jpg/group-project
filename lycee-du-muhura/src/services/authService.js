const API_URL = 'http://localhost:5000/api/auth';

class AuthService {
  // Login Step 1
  async login(userId, password) {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: userId, password })
    });
    
    const data = await response.json();
    
    if (data.success && data.require2FA) {
      localStorage.setItem('tempToken', data.tempToken);
      return { require2FA: true };
    }
    
    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  }

  // Login Step 2 - Verify 2FA
  async verify2FA(token) {
    const tempToken = localStorage.getItem('tempToken');
    
    const response = await fetch(`${API_URL}/verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, tempToken })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.removeItem('tempToken');
    }
    
    return data;
  }

  // Register
  async register(userData) {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return await response.json();
  }

  // Setup 2FA
  async setup2FA() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/setup-2fa`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return await response.json();
  }

  // Enable 2FA
  async enable2FA(token) {
    const authToken = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/enable-2fa`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ token })
    });
    return await response.json();
  }

  // Disable 2FA
  async disable2FA(token) {
    const authToken = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/disable-2fa`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ token })
    });
    return await response.json();
  }

  // Get current user
  async getMe() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }

  // Logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tempToken');
  }

  // Get token
  getToken() {
    return localStorage.getItem('token');
  }

  // Check if authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  // Get user
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Check role
  hasRole(role) {
    const user = this.getUser();
    return user && user.role === role;
  }

  // Check permission
  hasPermission(permission) {
    const user = this.getUser();
    if (!user) return false;
    const permissions = {
      admin: ['all', 'students', 'teachers', 'grades', 'attendance', 'finance', 'settings'],
      teacher: ['students', 'grades', 'attendance', 'courses', 'notes', 'books'],
      student: ['own_grades', 'own_attendance', 'courses', 'books', 'notes'],
      parent: ['child_grades', 'child_attendance', 'payments', 'reports']
    };
    const userPerms = permissions[user.role] || [];
    return userPerms.includes('all') || userPerms.includes(permission);
  }
}

export default new AuthService();
