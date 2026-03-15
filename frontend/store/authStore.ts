import { create } from 'zustand';
import { getItem } from '../services/storage';
import { login as loginService, logout as logoutService, register as registerService } from '../services/auth';

interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (data: { username: string; email: string; password: string; cycle_length: number; period_length: number; last_period_start: string }) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    clearError: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            await loginService(email, password);
            set({ isAuthenticated: true, isLoading: false });
        } catch (error: any) {
            set({ isLoading: false, error: error.response?.data?.detail || 'Login failed' });
        }
    },

    register: async (data) => {
        set({ isLoading: true, error: null });
        try {
            await registerService(data);
            set({ isLoading: false });
        } catch (error: any) {
            const data = error.response?.data;
            let message = 'Registration failed';
            if (data) {
                if (data.email) message = `Email: ${data.email[0]}`;
                else if (data.username) message = `Username: ${data.username[0]}`;
                else if (data.password) message = `Password: ${data.password[0]}`;
                else if (data.detail) message = data.detail;
                else if (data.non_field_errors) message = data.non_field_errors[0];
            }
            set({ isLoading: false, error: message });
        }
    },

    logout: async () => {
        await logoutService();
        set({ isAuthenticated: false });
    },

    checkAuth: async () => {
        const token = await getItem('access_token');
        set({ isAuthenticated: !!token });
    },

    clearError: () => set({ error: null }),
}));

export default useAuthStore;