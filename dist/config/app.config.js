"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
exports.appConfig = {
    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/lucid-growth',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
        refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
    },
    imap: {
        poolSize: parseInt(process.env.IMAP_POOL_SIZE || '10'),
        timeout: parseInt(process.env.IMAP_TIMEOUT || '30000'),
        reconnectAttempts: parseInt(process.env.IMAP_RECONNECT_ATTEMPTS || '3'),
        reconnectDelay: parseInt(process.env.IMAP_RECONNECT_DELAY || '5000'),
        keepaliveInterval: parseInt(process.env.IMAP_KEEPALIVE_INTERVAL || '10000'),
        keepaliveIdleInterval: parseInt(process.env.IMAP_KEEPALIVE_IDLE_INTERVAL || '300000'),
        maxIdleTime: parseInt(process.env.IMAP_MAX_IDLE_TIME || '1800000'),
    },
    server: {
        port: parseInt(process.env.PORT || '3001'),
        nodeEnv: process.env.NODE_ENV || 'development',
        apiPrefix: process.env.API_PREFIX || 'api',
    },
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: process.env.CORS_CREDENTIALS === 'true',
    },
    rateLimit: {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60'),
        limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100'),
    },
    email: {
        batchSize: parseInt(process.env.EMAIL_BATCH_SIZE || '50'),
        processingInterval: parseInt(process.env.EMAIL_PROCESSING_INTERVAL || '5000'),
        syncInterval: parseInt(process.env.EMAIL_SYNC_INTERVAL || '300000'),
    },
    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    },
    api: {
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3001/api',
        version: process.env.API_VERSION || 'v1',
    },
    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:3000',
        loginUrl: process.env.FRONTEND_LOGIN_URL || 'http://localhost:3000/login',
    },
    emailAccount: {
        defaultImapPort: parseInt(process.env.EMAIL_ACCOUNT_DEFAULT_IMAP_PORT || '993'),
        defaultSmtpPort: parseInt(process.env.EMAIL_ACCOUNT_DEFAULT_SMTP_PORT || '587'),
        defaultUseSSL: process.env.EMAIL_ACCOUNT_DEFAULT_USE_SSL === 'true',
        defaultUseTLS: process.env.EMAIL_ACCOUNT_DEFAULT_USE_TLS === 'true',
    },
    search: {
        defaultPageSize: parseInt(process.env.SEARCH_DEFAULT_PAGE_SIZE || '20'),
        maxPageSize: parseInt(process.env.SEARCH_MAX_PAGE_SIZE || '100'),
        defaultLimit: parseInt(process.env.SEARCH_DEFAULT_LIMIT || '10'),
    },
    analytics: {
        retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '365'),
        cacheTtl: parseInt(process.env.ANALYTICS_CACHE_TTL || '300000'),
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'combined',
    },
    healthCheck: {
        timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000'),
        interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
    },
};
//# sourceMappingURL=app.config.js.map