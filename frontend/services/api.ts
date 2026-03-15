import axios from 'axios';
import { getItem, setItem } from './storage';

/*
This sets up two interceptors — one that automatically attaches your
JWT token to every request so you don't have to do it manually in every service file,
and one that automatically refreshes the token if it expires and retries the original request.
Every other service file will just import this api instance and use it.
*/

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: BASE_URL,
});

// attach the JWT token to every request automatically
api.interceptors.request.use(async (config) => {
    const token = await getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// if token is expired, try to refresh it automatically
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            const refresh = await getItem('refresh_token');
            if (refresh) {
                const res = await axios.post(`${BASE_URL}/api/auth/refresh/`, {
                    refresh,
                });
                await setItem('access_token', res.data.access);
                error.config.headers.Authorization = `Bearer ${res.data.access}`;
                return axios(error.config);
            }
        }

        return Promise.reject(error);
    }
);

export default api;