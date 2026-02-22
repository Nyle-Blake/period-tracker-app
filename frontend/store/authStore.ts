import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { login, logout, register } from '../services/auth';

interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            await login(email, password);
            set({ isAuthenticated: true, isLoading: false });
        } catch (error: any) {
            set({ isLoading: false, error: error.response?.data?.detail || 'Login failed' });
        }
    },

    register: async (username, email, password) => {
        set({ isLoading: true, error: null });
        try {
            await register(username, email, password);
            set({ isLoading: false });
        } catch (error: any) {
            set({ isLoading: false, error: error.response?.data?.detail || 'Registration failed' });
        }
    },

    logout: async () => {
        await logout();
        set({ isAuthenticated: false });
    },

    checkAuth: async () => {
        const token = await SecureStore.getItemAsync('access_token');
        set({ isAuthenticated: !!token });
    },
}));

export default useAuthStore;