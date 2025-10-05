export type Entry = {
    id: number;
    title: string;
    note?: string | null;
    date_iso: string;     // "YYYY-MM-DD"
    lat?: number | null;
    lng?: number | null;
    place_name?: string | null;
    locality?: string | null;
    country_code?: string | null;
    weather_temp?: number | null;  // °C
    weather_desc?: string | null;  // npr. "clear sky"
    weather_icon?: string | null;  // npr. "01d"
    created_at: string;
    updated_at: string;
};

export type Photo = {
    id: number;
    entry_id: number;
    uri: string;          // file://
    created_at: string;
};
