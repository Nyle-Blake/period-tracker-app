import api from './api';
import { getItem, setItem, deleteItem } from './storage';

interface RegisterData {
    username: string;
    email: string;
    password: string;
    cycle_length: number;
    period_length: number;
    last_period_start: string;
}

export const register = async (data: RegisterData) => {
    const response = await api.post('/api/auth/register/', data);
    return response.data;
};

export const login = async (email: string, password: string) => {
    const response = await api.post('/api/auth/login/', {
        email,
        password,
    });

    // store both tokens securely on the device
    await setItem('access_token', response.data.access);
    await setItem('refresh_token', response.data.refresh);

    return response.data;
};

export const logout = async () => {
    await deleteItem('access_token');
    await deleteItem('refresh_token');
};

export const isLoggedIn = async () => {
    const token = await getItem('access_token');
    return !!token;
};