import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
    persist(
        (set) => ({
            // Sidebar State
            isSidebarCollapsed: false,
            toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
            
            // Focus/Zen Mode
            isFocusMode: false,
            toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),

            // Theme State (Default system or light)
            theme: 'light',
            setTheme: (theme) => set({ theme }),

            // smart Favorites (Persisted)
            favorites: [
                { id: 'fav-1', type: 'project', label: 'Projeto Alpha', path: '/projects/1' },
                { id: 'fav-2', type: 'dashboard', label: 'Dashboard Principal', path: '/' }
            ],
            addFavorite: (item) => set((state) => ({ favorites: [...state.favorites, item] })),
            removeFavorite: (id) => set((state) => ({ favorites: state.favorites.filter(f => f.id !== id) })),
            reorderFavorites: (newFavorites) => set({ favorites: newFavorites }),
        }),
        {
            name: 'pmo-hub-storage', // unique name
            partialize: (state) => ({ 
                isSidebarCollapsed: state.isSidebarCollapsed,
                theme: state.theme,
                favorites: state.favorites 
            }),
        }
    )
);
