import { Model } from 'mongoose';
import { EmailSyncService } from './email-sync.service';
import { EmailAccountDocument } from '../../database/schemas/email-account.schema';
export declare class EmailSyncController {
    private readonly emailSyncService;
    private emailAccountModel;
    constructor(emailSyncService: EmailSyncService, emailAccountModel: Model<EmailAccountDocument>);
    startSync(accountId: string, req: any): Promise<{
        message: string;
    }>;
    pauseSync(accountId: string, req: any): Promise<{
        message: string;
    }>;
    resumeSync(accountId: string, req: any): Promise<{
        message: string;
    }>;
    getSyncStatus(accountId: string, req: any): Promise<import("../../database/schemas/sync-status.schema").SyncStatus | null>;
    testSync(accountId: string, req: any): Promise<{
        message: string;
        accountId: string;
        connectionTest: any;
        timestamp: string;
        connectionError?: undefined;
    } | {
        message: string;
        accountId: string;
        connectionError: any;
        timestamp: string;
        connectionTest?: undefined;
    }>;
    quickTest(accountId: string, req: any): Promise<{
        message: string;
        accountId: string;
        timestamp: string;
        status: string;
    }>;
    testConnection(accountId: string, req: any): Promise<{
        message: string;
        accountId: string;
        result: any;
        timestamp: string;
        error?: undefined;
    } | {
        message: string;
        accountId: string;
        error: any;
        timestamp: string;
        result?: undefined;
    }>;
    testEmails(accountId: string, req: any): Promise<{
        message: string;
        accountId: string;
        result: any;
        timestamp: string;
        error?: undefined;
    } | {
        message: string;
        accountId: string;
        error: any;
        timestamp: string;
        result?: undefined;
    }>;
    testSaveEmail(accountId: string, req: any): Promise<{
        message: string;
        accountId: string;
        result: any;
        timestamp: string;
        error?: undefined;
    } | {
        message: string;
        accountId: string;
        error: any;
        timestamp: string;
        result?: undefined;
    }>;
    private verifyAccountOwnership;
}
