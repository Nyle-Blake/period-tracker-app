import api from './api';
import * as SecureStore from 'expo-secure-store';

export const register = async (username: string, email: string, password: string) => {
    const response = await api.post('/api/auth/register/', {
        username,
        email,
        password,
    });
    return response.data;
};

export const login = async (username: string, password: string) => {
    const response = await api.post('/api/auth/login/', {
        username,
        password,
    });

    // store both tokens securely on the device
    await SecureStore.setItemAsync('access_token', response.data.access);
    await SecureStore.setItemAsync('refresh_token', response.data.refresh);

    return response.data;
};

export const logout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
};

export const isLoggedIn = async () => {
    const token = await SecureStore.getItemAsync('access_token');
    return !!token;
};