import api from './api';

export interface UserProfile {
    id: number;
    email: string;
    username: string;
    cycle_length: number | null;
    period_length: number | null;
}

export interface UpdateProfilePayload {
    username?: string;
    cycle_length?: number | null;
    period_length?: number | null;
}

export const getProfile = async (): Promise<UserProfile> => {
    const res = await api.get('/api/me/');
    return res.data;
};

export const updateProfile = async (data: UpdateProfilePayload): Promise<UserProfile> => {
    const res = await api.patch('/api/me/', data);
    return res.data;
};
