import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminState {
  sidebarOpen: boolean;
  currentPage: string;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      currentPage: 'dashboard',

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
      
      setCurrentPage: (page: string) => set({ currentPage: page }),
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        currentPage: state.currentPage,
      }),
    }
  )
);
