import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface Truck {
  _id: string;
  plateNumber: string;
  brand: string;
  model: string;
  capacity: string;
  company: string;
  owner: string;
  status: 'Active' | 'Inactive';
  currentStatus: 'IN' | 'OUT' | 'AVAILABLE';
  lastLogTime: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TruckStore {
  trucks: Truck[];
  socket: Socket | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initializeSocket: () => void;
  disconnectSocket: () => void;
  fetchTrucks: () => Promise<void>;
  addTruck: (truckData: Omit<Truck, '_id' | 'owner' | 'currentStatus' | 'lastLogTime' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTruck: (id: string, truckData: Partial<Truck>) => Promise<void>;
  deleteTruck: (id: string) => Promise<void>;
  setTrucks: (trucks: Truck[]) => void;
}

const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useTruckStore = create<TruckStore>((set, get) => ({
  trucks: [],
  socket: null,
  isConnected: false,
  isLoading: false,
  error: null,

  initializeSocket: () => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('✅ Truck WebSocket connected');
      set({ isConnected: true });
      get().fetchTrucks();
    });

    socket.on('disconnect', () => {
      console.log('❌ Truck WebSocket disconnected');
      set({ isConnected: false });
    });

    // Real-time truck events
    socket.on('truck:created', (truck: Truck) => {
      console.log('🚚 New truck created via WebSocket:', truck);
      set((state) => {
        // Check if truck already exists to prevent duplicates
        const exists = state.trucks.some(t => t._id === truck._id);
        if (exists) {
          console.log('⚠️ Truck already exists, skipping duplicate:', truck._id);
          return state;
        }
        console.log('✅ Adding truck from WebSocket');
        return {
          trucks: [...state.trucks, truck],
        };
      });
    });

    socket.on('truck:updated', (updatedTruck: Truck) => {
      console.log('🔄 Truck updated:', updatedTruck);
      set((state) => ({
        trucks: state.trucks.map((truck) =>
          truck._id === updatedTruck._id ? updatedTruck : truck
        ),
      }));
    });

    socket.on('truck:deleted', (deletedId: string) => {
      console.log('🗑️ Truck deleted:', deletedId);
      set((state) => ({
        trucks: state.trucks.filter((truck) => truck._id !== deletedId),
      }));
    });

    // Listen for truck log events to update status
    socket.on('truckLog:created', (data: any) => {
      console.log('📋 Truck log created:', data);
      // Refetch trucks to get updated statuses
      get().fetchTrucks();
    });

    socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error);
      set({ error: error.message || 'Socket error occurred' });
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  fetchTrucks: async () => {
    set({ isLoading: true, error: null });
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;
      
      const response = await fetch(`${API_URL}/trucks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trucks');
      }

      const data = await response.json();
      set({ trucks: data.data || data.trucks || data, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching trucks:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  addTruck: async (truckData) => {
    set({ isLoading: true, error: null });
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;
      
      const response = await fetch(`${API_URL}/trucks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(truckData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add truck');
      }

      const result = await response.json();
      const newTruck = result.data || result;
      
      console.log('✅ Truck created successfully:', newTruck);
      console.log('⏳ Waiting for WebSocket to add truck to state...');
      
      // Don't add immediately - let WebSocket handle it to avoid duplicates
      // Just set loading to false
      set({ isLoading: false });
    } catch (error: any) {
      console.error('Error adding truck:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateTruck: async (id, truckData) => {
    set({ isLoading: true, error: null });
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;
      const response = await fetch(`${API_URL}/trucks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(truckData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update truck');
      }

      const result = await response.json();
      const updatedTruck = result.data || result;
      
      // Update state immediately (don't rely only on WebSocket)
      set((state) => ({
        trucks: state.trucks.map((truck) =>
          truck._id === id ? updatedTruck : truck
        ),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Error updating truck:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteTruck: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;
      const response = await fetch(`${API_URL}/trucks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete truck');
      }

      // Remove from state immediately (don't rely only on WebSocket)
      set((state) => ({
        trucks: state.trucks.filter((truck) => truck._id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Error deleting truck:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  setTrucks: (trucks) => set({ trucks }),
}));
