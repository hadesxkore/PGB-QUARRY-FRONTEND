import { create } from 'zustand';

export interface User {
  _id: string;
  username: string;
  name: string;
  email: string;
  contactNumber: string;
  location: string;
  company?: string;
  role: 'user' | 'admin' | 'superadmin';
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  isLoading: false,
  error: null,

  setUsers: (users) => set({ users }),
  
  addUser: (user) => set((state) => ({ 
    users: [...state.users, user] 
  })),
  
  updateUser: (id, updatedUser) => set((state) => ({
    users: state.users.map((user) => 
      user._id === id ? { ...user, ...updatedUser } : user
    )
  })),
  
  deleteUser: (id) => set((state) => ({
    users: state.users.filter((user) => user._id !== id)
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
}));
