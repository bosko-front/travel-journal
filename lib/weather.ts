import config from "@/config/env";

export type WeatherInfo = {
    temp: number;
    desc: string;
    icon: string;
};

export async function getWeather(lat: number, lon: number): Promise<WeatherInfo | null> {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${config.weatherApiKey}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.cod !== 200) {
            console.warn("Weather API error:", data);
            return null;
        }

        return {
            temp: Math.round(data.main.temp),
            desc: data.weather[0].description,
            icon: data.weather[0].icon, // npr "01d"
        };
    } catch (e) {
        console.warn("Weather fetch failed", e);
        return null;
    }
}
