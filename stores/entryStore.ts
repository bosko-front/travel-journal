import { create } from 'zustand';
import { Entry } from '@/types';
import {createEntryTx, deleteEntry, listEntries} from '@/db/ index'

type State = {
    entries: Entry[];
    loading: boolean;
    error?: string;
};

type Actions = {
    refresh: (q?: string) => Promise<void>;
    addEntry: (payload: Omit<Entry,'id'|'created_at'|'updated_at'>, photos: string[]) => Promise<number>;
    clearError: () => void;
    deleteEntry: (id:number) => Promise<void>;
};

export const useEntryStore = create<State & Actions>((set, get) => ({
    entries: [],
    loading: false,
    error: undefined,

    refresh: async (q) => {
        set({ loading: true, error: undefined });
        try {
            const rows = await listEntries(q);
            set({ entries: rows as Entry[] });
        } catch (e:any) {
            set({ error: e.message ?? 'Failed to load' });
        } finally {
            set({ loading: false });
        }
    },

    addEntry: async (payload, photos) => {
        try {
            const id = await createEntryTx(payload, photos);
            await get().refresh();
            return id;
        } catch (e:any) {
            set({ error: e.message ?? 'Failed to save' });
            throw e;
        }
    },
    deleteEntry: async (id: number) => {
        await deleteEntry(id);
        await get().refresh();
    },

    clearError: () => set({ error: undefined }),
}));
