import api from './api';

export interface PeriodEntry {
    id?: number;
    start_date: string;   // YYYY-MM-DD
    end_date?: string;    // YYYY-MM-DD
    notes?: string;
    period_days?: number;
}

export const getPeriods = async (): Promise<PeriodEntry[]> => {
    const response = await api.get('/api/period-entries/');
    return response.data;
};

export const createPeriod = async (entry: Partial<PeriodEntry>): Promise<PeriodEntry> => {
    const response = await api.post('/api/period-entries/', entry);
    return response.data;
};

export const updatePeriod = async (id: number, entry: Partial<PeriodEntry>): Promise<PeriodEntry> => {
    const response = await api.patch(`/api/period-entries/${id}/`, entry);
    return response.data;
};

export const deletePeriod = async (id: number): Promise<void> => {
    await api.delete(`/api/period-entries/${id}/`);
};
