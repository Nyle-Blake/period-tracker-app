import api from './api';

export interface Symptom {
    id: number;
    name: string;
    category: string;
    icon: string;
}

export interface SymptomEntry {
    id: number;
    symptom: number;
    symptom_name: string;
    date: string;
    severity: number | null;
}

export const getSymptoms = async (): Promise<Symptom[]> => {
    const res = await api.get('/api/symptoms/');
    return res.data;
};

export const getSymptomEntries = async (): Promise<SymptomEntry[]> => {
    const res = await api.get('/api/symptom-entries/');
    return res.data;
};

export const createSymptomEntry = async (data: { symptom: number; date: string; severity: number | null }): Promise<SymptomEntry> => {
    const res = await api.post('/api/symptom-entries/', data);
    return res.data;
};

export const deleteSymptomEntry = async (id: number): Promise<void> => {
    await api.delete(`/api/symptom-entries/${id}/`);
};
