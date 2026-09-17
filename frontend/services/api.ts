import axios from 'axios';
import { getItem, setItem, deleteItem } from './storage';

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

// signed out because the refresh token itself is missing/expired — the root
// layout listens for this to redirect to the login screen
type SignedOutListener = () => void;
let signedOutListener: SignedOutListener | null = null;
export function onSignedOut(listener: SignedOutListener) {
    signedOutListener = listener;
}

async function signOut() {
    await deleteItem('access_token');
    await deleteItem('refresh_token');
    signedOutListener?.();
}

// dedupe concurrent 401s into a single refresh call
let refreshPromise: Promise<string> | null = null;
async function refreshAccessToken(): Promise<string> {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            const refresh = await getItem('refresh_token');
            if (!refresh) {
                throw new Error('No refresh token');
            }
            const res = await axios.post(`${BASE_URL}/api/auth/refresh/`, { refresh });
            await setItem('access_token', res.data.access);
            return res.data.access as string;
        })().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}

// attach the JWT token to every request automatically
api.interceptors.request.use(async (config) => {
    const token = await getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// if token is expired, try to refresh it automatically; if the refresh
// token is also expired/invalid, sign the user out so they're sent to login
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            try {
                const access = await refreshAccessToken();
                error.config.headers.Authorization = `Bearer ${access}`;
                return axios(error.config);
            } catch {
                await signOut();
            }
        }

        return Promise.reject(error);
    }
);

export default api;