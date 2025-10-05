
export enum Environment {
    DEVELOPMENT = 'development',
    PRODUCTION = 'production',
}

// Default to development environment
const ENV = process.env.NODE_ENV || Environment.DEVELOPMENT;

interface Config {
    weatherApiKey: string;
    environment: Environment;

}

const developmentConfig: Config = {
    weatherApiKey:'cc67fa63053633250f6e2801464593c3',
    environment: Environment.DEVELOPMENT,
};

const productionConfig: Config = {
    weatherApiKey:'cc67fa63053633250f6e2801464593c3',

    environment: Environment.PRODUCTION
};


const config: Config = ENV === Environment.PRODUCTION ? productionConfig : developmentConfig;

export default config;