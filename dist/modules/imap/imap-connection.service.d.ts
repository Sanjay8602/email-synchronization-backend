import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Imap from 'imap';
import { EmailAccount } from '../../database/schemas/email-account.schema';
export interface ImapConnection {
    connection: Imap;
    accountId: string;
    isConnected: boolean;
    lastUsed: Date;
    reconnectAttempts: number;
}
export declare class ImapConnectionService implements OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private readonly connections;
    private readonly maxPoolSize;
    private readonly timeout;
    private readonly reconnectAttempts;
    private readonly reconnectDelay;
    constructor(configService: ConfigService);
    createConnection(account: EmailAccount): Promise<ImapConnection>;
    getConnection(accountId: string): Promise<ImapConnection | null>;
    closeConnection(accountId: string): Promise<void>;
    reconnect(account: EmailAccount): Promise<ImapConnection>;
    private buildImapConfig;
    private cleanupOldConnections;
    onModuleDestroy(): Promise<void>;
    getConnectionStats(): {
        totalConnections: number;
        activeConnections: number;
        maxPoolSize: number;
    };
}
