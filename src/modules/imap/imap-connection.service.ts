import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Imap from 'imap';
import { EmailAccount, AuthMethod } from '../../database/schemas/email-account.schema';
import { appConfig } from '../../config/app.config';

export interface ImapConnection {
  connection: Imap;
  accountId: string;
  isConnected: boolean;
  lastUsed: Date;
  reconnectAttempts: number;
}

@Injectable()
export class ImapConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(ImapConnectionService.name);
  private readonly connections = new Map<string, ImapConnection>();
  private readonly maxPoolSize: number;
  private readonly timeout: number;
  private readonly reconnectAttempts: number;
  private readonly reconnectDelay: number;

  constructor(private readonly configService: ConfigService) {
    this.maxPoolSize = this.configService.get<number>('IMAP_POOL_SIZE', appConfig.imap.poolSize);
    this.timeout = this.configService.get<number>('IMAP_TIMEOUT', appConfig.imap.timeout);
    this.reconnectAttempts = this.configService.get<number>('IMAP_RECONNECT_ATTEMPTS', appConfig.imap.reconnectAttempts);
    this.reconnectDelay = this.configService.get<number>('IMAP_RECONNECT_DELAY', appConfig.imap.reconnectDelay);
  }

  async createConnection(account: EmailAccount): Promise<ImapConnection> {
    const connectionId = (account as any)._id.toString();
    
    // Check if connection already exists and is healthy
    const existingConnection = this.connections.get(connectionId);
    if (existingConnection && existingConnection.isConnected) {
      existingConnection.lastUsed = new Date();
      return existingConnection;
    }

    // Check pool size
    if (this.connections.size >= this.maxPoolSize) {
      await this.cleanupOldConnections();
    }

    const imapConfig = this.buildImapConfig(account);
    const connection = new (Imap as any)(imapConfig);

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        connection.end();
        reject(new Error(`IMAP connection timeout for account ${account.email}`));
      }, this.timeout);

      connection.once('ready', () => {
        clearTimeout(timeoutId);
        this.logger.log(`Connected to IMAP server for account: ${account.email}`);
        
        const imapConnection: ImapConnection = {
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

  async getConnection(accountId: string): Promise<ImapConnection | null> {
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

  async closeConnection(accountId: string): Promise<void> {
    const connection = this.connections.get(accountId);
    if (connection) {
      connection.connection.end();
      this.connections.delete(accountId);
      this.logger.log(`Closed IMAP connection for account: ${accountId}`);
    }
  }

  async reconnect(account: EmailAccount): Promise<ImapConnection> {
    const connectionId = (account as any)._id.toString();
    const existingConnection = this.connections.get(connectionId);
    
    if (existingConnection) {
      existingConnection.connection.end();
      this.connections.delete(connectionId);
    }

    // Wait before reconnecting
    await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
    
    return this.createConnection(account);
  }

  private buildImapConfig(account: EmailAccount): any {
    const config: any = {
      host: account.imapHost,
      port: account.imapPort,
      tls: account.useSSL,
      tlsOptions: {
        rejectUnauthorized: false, // Allow self-signed certificates for testing
        checkServerIdentity: () => undefined, // Skip hostname verification
      },
      connTimeout: this.timeout,
      authTimeout: this.timeout,
      keepalive: {
        interval: this.configService.get<number>('IMAP_KEEPALIVE_INTERVAL', appConfig.imap.keepaliveInterval),
        idleInterval: this.configService.get<number>('IMAP_KEEPALIVE_IDLE_INTERVAL', appConfig.imap.keepaliveIdleInterval),
        forceNoop: true,
      },
      // Add debug logging for troubleshooting
      debug: (info) => {
        if (info.type === 'error') {
          this.logger.error('IMAP Debug Error:', info);
        }
      },
    };

    // Configure authentication based on method
    switch (account.authMethod) {
      case AuthMethod.PLAIN:
        config.user = account.username;
        config.password = account.password || '';
        break;
      case AuthMethod.LOGIN:
        config.user = account.username;
        config.password = account.password || '';
        // config.authMethod = 'LOGIN';
        break;
      case AuthMethod.OAUTH2:
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

  private async cleanupOldConnections(): Promise<void> {
    const now = new Date();
    const connectionsToClose: string[] = [];

    for (const [accountId, connection] of this.connections) {
      const timeSinceLastUse = now.getTime() - connection.lastUsed.getTime();
      const maxIdleTime = this.configService.get<number>('IMAP_MAX_IDLE_TIME', appConfig.imap.maxIdleTime);

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
    
    const closePromises = Array.from(this.connections.keys()).map(accountId => 
      this.closeConnection(accountId)
    );

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
}
