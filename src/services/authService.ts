import api from './api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

class AuthService {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  }

  // Register (Admin only)
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  // Get current user
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  }

  // Update profile
  async updateProfile(data: Partial<RegisterData>) {
    const response = await api.put('/auth/profile', data);
    return response.data;
  }

  // Logout (client-side)
  logout() {
    localStorage.removeItem('auth-storage');
  }
}

export const authService = new AuthService();
