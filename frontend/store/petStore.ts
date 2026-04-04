import { create } from 'zustand';

interface PetState {
    pet: string | null;
    setPet: (pet: string | null) => void;
}

const usePetStore = create<PetState>((set) => ({
    pet: null,
    setPet: (pet) => set({ pet }),
}));

export default usePetStore;
