import api from './api';

export interface CycleEntry {
    id?: number;
    start_date: string;   // YYYY-MM-DD
    end_date?: string;    // YYYY-MM-DD
    cycle_length?: number;
    notes?: string;
}

export const getCycles = async (): Promise<CycleEntry[]> => {
    const response = await api.get('/api/cycles-entries/');
    return response.data;
};

export const createCycle = async (entry: CycleEntry): Promise<CycleEntry> => {
    const response = await api.post('/api/cycles-entries/', entry);
    return response.data;
};

export const updateCycle = async (id: number, entry: Partial<CycleEntry>): Promise<CycleEntry> => {
    const response = await api.patch(`/api/cycles-entries/${id}/`, entry);
    return response.data;
};

export const deleteCycle = async (id: number): Promise<void> => {
    await api.delete(`/api/cycles-entries/${id}/`);
};