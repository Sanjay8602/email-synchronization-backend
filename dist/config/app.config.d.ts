export declare const appConfig: {
    readonly database: {
        readonly uri: string;
    };
    readonly jwt: {
        readonly secret: string;
        readonly expiresIn: string;
        readonly accessTokenExpiresIn: string;
        readonly refreshTokenExpiresIn: string;
    };
    readonly imap: {
        readonly poolSize: number;
        readonly timeout: number;
        readonly reconnectAttempts: number;
        readonly reconnectDelay: number;
        readonly keepaliveInterval: number;
        readonly keepaliveIdleInterval: number;
        readonly maxIdleTime: number;
    };
    readonly server: {
        readonly port: number;
        readonly nodeEnv: string;
        readonly apiPrefix: string;
    };
    readonly cors: {
        readonly origin: string;
        readonly credentials: boolean;
    };
    readonly rateLimit: {
        readonly ttl: number;
        readonly limit: number;
    };
    readonly email: {
        readonly batchSize: number;
        readonly processingInterval: number;
        readonly syncInterval: number;
    };
    readonly security: {
        readonly bcryptRounds: number;
    };
    readonly api: {
        readonly baseUrl: string;
        readonly version: string;
    };
    readonly frontend: {
        readonly url: string;
        readonly loginUrl: string;
    };
    readonly emailAccount: {
        readonly defaultImapPort: number;
        readonly defaultSmtpPort: number;
        readonly defaultUseSSL: boolean;
        readonly defaultUseTLS: boolean;
    };
    readonly search: {
        readonly defaultPageSize: number;
        readonly maxPageSize: number;
        readonly defaultLimit: number;
    };
    readonly analytics: {
        readonly retentionDays: number;
        readonly cacheTtl: number;
    };
    readonly logging: {
        readonly level: string;
        readonly format: string;
    };
    readonly healthCheck: {
        readonly timeout: number;
        readonly interval: number;
    };
};
export type AppConfig = typeof appConfig;
