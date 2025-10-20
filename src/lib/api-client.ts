const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on init
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'An error occurred');
    }

    return response.json();
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token);
    return response.user;
  }

  async register(data: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.setToken(null);
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Users
  async getUsers() {
    return this.request<any[]>('/users');
  }

  async createUser(data: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  // Athletes
  async getAthletes() {
    return this.request<any[]>('/athletes');
  }

  async createAthlete(data: any) {
    return this.request('/athletes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAthlete(id: string, data: any) {
    return this.request(`/athletes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAthlete(id: string) {
    return this.request(`/athletes/${id}`, { method: 'DELETE' });
  }

  // Results
  async getResults() {
    return this.request<any[]>('/results');
  }

  async createResult(data: any) {
    return this.request('/results', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteResult(id: string) {
    return this.request(`/results/${id}`, { method: 'DELETE' });
  }

  // Events
  async getEvents() {
    return this.request<any[]>('/events');
  }

  async createEvent(data: any) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id: string) {
    return this.request(`/events/${id}`, { method: 'DELETE' });
  }

  // Access Requests
  async getAccessRequests() {
    return this.request<any[]>('/access-requests');
  }

  async createAccessRequest(data: any) {
    return this.request('/access-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAccessRequest(id: string, status: string) {
    return this.request(`/access-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Messages
  async getMessages() {
    return this.request<any[]>('/messages');
  }

  async createMessage(data: any) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markMessagesAsRead(messageIds: string[]) {
    return this.request('/messages/mark-read', {
      method: 'POST',
      body: JSON.stringify({ messageIds }),
    });
  }

  // Permissions
  async getPermissions() {
    return this.request<any[]>('/permissions');
  }

  async createPermission(data: any) {
    return this.request('/permissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePermission(id: string, data: any) {
    return this.request(`/permissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePermission(id: string) {
    return this.request(`/permissions/${id}`, { method: 'DELETE' });
  }

  // Roles
  async getRoles() {
    return this.request<any[]>('/roles');
  }

  async createRole(data: any) {
    return this.request('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRole(id: string, data: any) {
    return this.request(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRole(id: string) {
    return this.request(`/roles/${id}`, { method: 'DELETE' });
  }

  // Approval Requests
  async getApprovalRequests() {
    return this.request<any[]>('/approval-requests');
  }

  async approveRequest(id: string) {
    return this.request(`/approval-requests/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectRequest(id: string, reason?: string) {
    return this.request(`/approval-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async deleteApprovalRequest(id: string) {
    return this.request(`/approval-requests/${id}`, { method: 'DELETE' });
  }

  // Age Categories
  async getAgeCategories() {
    return this.request<any[]>('/age-categories');
  }

  async createAgeCategory(data: any) {
    return this.request('/age-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAgeCategory(id: string, data: any) {
    return this.request(`/age-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAgeCategory(id: string) {
    return this.request(`/age-categories/${id}`, { method: 'DELETE' });
  }

  // Probes
  async getProbes() {
    return this.request<any[]>('/probes');
  }

  async createProbe(data: any) {
    return this.request('/probes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProbe(id: string, data: any) {
    return this.request(`/probes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProbe(id: string) {
    return this.request(`/probes/${id}`, { method: 'DELETE' });
  }

  // User Permissions
  async getUserPermissions() {
    return this.request<any[]>('/user-permissions');
  }

  async grantPermission(data: any) {
    return this.request('/user-permissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async revokePermission(id: string) {
    return this.request(`/user-permissions/${id}`, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
