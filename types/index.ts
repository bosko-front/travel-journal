export type Entry = {
    id: number;
    title: string;
    note?: string | null;
    date_iso: string;     // "YYYY-MM-DD"
    lat?: number | null;
    lng?: number | null;
    created_at: string;
    updated_at: string;
};

export type Photo = {
    id: number;
    entry_id: number;
    uri: string;          // file://
    created_at: string;
};
