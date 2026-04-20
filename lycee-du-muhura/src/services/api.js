// API service for making HTTP requests to the backend
const API_URL = 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = API_URL;
  }

  // Get auth token from localStorage
  getToken() {
    return localStorage.getItem('token');
  }

  // Set auth token
  setToken(token) {
    localStorage.setItem('token', token);
  }

  // Remove auth token
  removeToken() {
    localStorage.removeItem('token');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  }

  // Get auth headers
  getAuthHeaders() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server error: ${text.substring(0, 100)}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Authentication methods
  async login(userId, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId, password })
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async logout() {
    this.removeToken();
  }

  async verifyToken() {
    return await this.request('/api/auth/verify');
  }

  // Student methods
  async getStudents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/students?${queryString}` : '/api/students';
    return await this.request(endpoint);
  }

  async getStudent(id) {
    return await this.request(`/api/students/${id}`);
  }

  async createStudent(studentData) {
    return await this.request('/api/students', {
      method: 'POST',
      body: JSON.stringify(studentData)
    });
  }

  async updateStudent(id, studentData) {
    return await this.request(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData)
    });
  }

  async deleteStudent(id) {
    return await this.request(`/api/students/${id}`, {
      method: 'DELETE'
    });
  }

  async getStudentStats() {
    return await this.request('/api/students/stats/overview');
  }

  // Course methods
  async getCourses() {
    return await this.request('/api/courses');
  }

  async getCourse(id) {
    return await this.request(`/api/courses/${id}`);
  }

  async createCourse(courseData) {
    return await this.request('/api/courses', {
      method: 'POST',
      body: JSON.stringify(courseData)
    });
  }

  async updateCourse(id, courseData) {
    return await this.request(`/api/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData)
    });
  }

  async deleteCourse(id) {
    return await this.request(`/api/courses/${id}`, {
      method: 'DELETE'
    });
  }

  // Alumni methods
  async getAlumni(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/alumni?${queryString}` : '/api/alumni';
    return await this.request(endpoint);
  }

  async searchAlumni(name) {
    return await this.getAlumni({ name });
  }

  async getAlumnus(id) {
    return await this.request(`/api/alumni/${id}`);
  }

  async getAlumniStats() {
    return await this.request('/api/alumni/stats/overview');
  }

  async createAlumnus(alumnusData) {
    return await this.request('/api/alumni', {
      method: 'POST',
      body: JSON.stringify(alumnusData)
    });
  }

  async updateAlumnus(id, alumnusData) {
    return await this.request(`/api/alumni/${id}`, {
      method: 'PUT',
      body: JSON.stringify(alumnusData)
    });
  }

  async deleteAlumnus(id) {
    return await this.request(`/api/alumni/${id}`, {
      method: 'DELETE'
    });
  }

  // File upload method
  async uploadPhoto(file) {
    const url = `${this.baseURL}/api/upload/student-photo`;
    const token = this.getToken();
    
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: Don't set Content-Type for FormData, browser sets it with boundary
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload photo');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }
}

export default new ApiService();
