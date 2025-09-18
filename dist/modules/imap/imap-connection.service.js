"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ImapConnectionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImapConnectionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const imap_1 = __importDefault(require("imap"));
const email_account_schema_1 = require("../../database/schemas/email-account.schema");
const app_config_1 = require("../../config/app.config");
let ImapConnectionService = ImapConnectionService_1 = class ImapConnectionService {
    configService;
    logger = new common_1.Logger(ImapConnectionService_1.name);
    connections = new Map();
    maxPoolSize;
    timeout;
    reconnectAttempts;
    reconnectDelay;
    constructor(configService) {
        this.configService = configService;
        this.maxPoolSize = this.configService.get('IMAP_POOL_SIZE', app_config_1.appConfig.imap.poolSize);
        this.timeout = this.configService.get('IMAP_TIMEOUT', app_config_1.appConfig.imap.timeout);
        this.reconnectAttempts = this.configService.get('IMAP_RECONNECT_ATTEMPTS', app_config_1.appConfig.imap.reconnectAttempts);
        this.reconnectDelay = this.configService.get('IMAP_RECONNECT_DELAY', app_config_1.appConfig.imap.reconnectDelay);
    }
    async createConnection(account) {
        const connectionId = account._id.toString();
        const existingConnection = this.connections.get(connectionId);
        if (existingConnection && existingConnection.isConnected) {
            existingConnection.lastUsed = new Date();
            return existingConnection;
        }
        if (this.connections.size >= this.maxPoolSize) {
            await this.cleanupOldConnections();
        }
        const imapConfig = this.buildImapConfig(account);
        const connection = new imap_1.default(imapConfig);
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                connection.end();
                reject(new Error(`IMAP connection timeout for account ${account.email}`));
            }, this.timeout);
            connection.once('ready', () => {
                clearTimeout(timeoutId);
                this.logger.log(`Connected to IMAP server for account: ${account.email}`);
                const imapConnection = {
                    connection,
                    accountId: connectionId,
                    isConnected: true,
                    lastUsed: new Date(),
                    reconnectAttempts: 0,
                };
                this.connections.set(connectionId, imapConnection);
                resolve(imapConnection);
            });
            connection.once('error', (err) => {
                clearTimeout(timeoutId);
                this.logger.error(`IMAP connection error for account ${account.email}:`, err);
                reject(err);
            });
            connection.once('end', () => {
                this.logger.log(`IMAP connection ended for account: ${account.email}`);
                const conn = this.connections.get(connectionId);
                if (conn) {
                    conn.isConnected = false;
                }
            });
            connection.connect();
        });
    }
    async getConnection(accountId) {
        const connection = this.connections.get(accountId);
        if (!connection) {
            return null;
        }
        if (!connection.isConnected) {
            this.connections.delete(accountId);
            return null;
        }
        connection.lastUsed = new Date();
        return connection;
    }
    async closeConnection(accountId) {
        const connection = this.connections.get(accountId);
        if (connection) {
            connection.connection.end();
            this.connections.delete(accountId);
            this.logger.log(`Closed IMAP connection for account: ${accountId}`);
        }
    }
    async reconnect(account) {
        const connectionId = account._id.toString();
        const existingConnection = this.connections.get(connectionId);
        if (existingConnection) {
            existingConnection.connection.end();
            this.connections.delete(connectionId);
        }
        await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
        return this.createConnection(account);
    }
    buildImapConfig(account) {
        const config = {
            host: account.imapHost,
            port: account.imapPort,
            tls: account.useSSL,
            tlsOptions: {
                rejectUnauthorized: false,
                checkServerIdentity: () => undefined,
            },
            connTimeout: this.timeout,
            authTimeout: this.timeout,
            keepalive: {
                interval: this.configService.get('IMAP_KEEPALIVE_INTERVAL', app_config_1.appConfig.imap.keepaliveInterval),
                idleInterval: this.configService.get('IMAP_KEEPALIVE_IDLE_INTERVAL', app_config_1.appConfig.imap.keepaliveIdleInterval),
                forceNoop: true,
            },
            debug: (info) => {
                if (info.type === 'error') {
                    this.logger.error('IMAP Debug Error:', info);
                }
            },
        };
        switch (account.authMethod) {
            case email_account_schema_1.AuthMethod.PLAIN:
                config.user = account.username;
                config.password = account.password || '';
                break;
            case email_account_schema_1.AuthMethod.LOGIN:
                config.user = account.username;
                config.password = account.password || '';
                break;
            case email_account_schema_1.AuthMethod.OAUTH2:
                config.user = account.username;
                config.xoauth2 = {
                    accessToken: account.oauth2Token,
                };
                break;
            default:
                throw new Error(`Unsupported authentication method: ${account.authMethod}`);
        }
        return config;
    }
    async cleanupOldConnections() {
        const now = new Date();
        const connectionsToClose = [];
        for (const [accountId, connection] of this.connections) {
            const timeSinceLastUse = now.getTime() - connection.lastUsed.getTime();
            const maxIdleTime = this.configService.get('IMAP_MAX_IDLE_TIME', app_config_1.appConfig.imap.maxIdleTime);
            if (timeSinceLastUse > maxIdleTime || !connection.isConnected) {
                connectionsToClose.push(accountId);
            }
        }
        for (const accountId of connectionsToClose) {
            await this.closeConnection(accountId);
        }
        this.logger.log(`Cleaned up ${connectionsToClose.length} old connections`);
    }
    async onModuleDestroy() {
        this.logger.log('Closing all IMAP connections...');
        const closePromises = Array.from(this.connections.keys()).map(accountId => this.closeConnection(accountId));
        await Promise.all(closePromises);
        this.logger.log('All IMAP connections closed');
    }
    getConnectionStats() {
        return {
            totalConnections: this.connections.size,
            activeConnections: Array.from(this.connections.values()).filter(c => c.isConnected).length,
            maxPoolSize: this.maxPoolSize,
        };
    }
};
exports.ImapConnectionService = ImapConnectionService;
exports.ImapConnectionService = ImapConnectionService = ImapConnectionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ImapConnectionService);
//# sourceMappingURL=imap-connection.service.js.map