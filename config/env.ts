export enum Environment {
    DEVELOPMENT = 'development',
    PRODUCTION = 'production',
}

const ENV = process.env.NODE_ENV || Environment.DEVELOPMENT;

interface Config {
    weatherApiKey: string;
    environment: Environment;
}

const config: Config = {
    weatherApiKey: process.env.EXPO_PUBLIC_WEATHER_API_KEY!,
    environment: ENV === 'production' ? Environment.PRODUCTION : Environment.DEVELOPMENT,
};

export default config;
