import api from './api';
import type { User } from '../store/userStore';

export interface CreateUserData {
  username: string;
  name: string;
  email: string;
  password: string;
  contactNumber: string;
  location: string;
  company?: string;
  role?: 'user' | 'admin' | 'superadmin';
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  contactNumber?: string;
  location?: string;
  company?: string;
  role?: 'user' | 'admin' | 'superadmin';
  isActive?: boolean;
  password?: string;
}

export const userService = {
  // Get all users (Admin only)
  async getAllUsers(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data.data;
  },

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  },

  // Create new user (Admin only)
  async createUser(userData: CreateUserData): Promise<User> {
    const response = await api.post('/users', userData);
    return response.data.data;
  },

  // Update user
  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    const response = await api.put(`/users/${id}`, userData);
    return response.data.data;
  },

  // Delete user (Admin only)
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  // Toggle user active status
  async toggleUserStatus(id: string, isActive: boolean): Promise<User> {
    const response = await api.put(`/users/${id}`, { isActive });
    return response.data.data;
  },
};
