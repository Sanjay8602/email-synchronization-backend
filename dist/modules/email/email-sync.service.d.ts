import { Model } from 'mongoose';
import { ImapConnectionService } from '../imap/imap-connection.service';
import { EmailAccountDocument } from '../../database/schemas/email-account.schema';
import { EmailDocument } from '../../database/schemas/email.schema';
import { SyncStatus, SyncStatusDocument } from '../../database/schemas/sync-status.schema';
import { EmailProcessingService } from './email-processing.service';
export interface FolderInfo {
    name: string;
    delimiter: string;
    attributes: string[];
    totalMessages?: number;
    children?: FolderInfo[];
}
export declare class EmailSyncService {
    private emailAccountModel;
    private emailModel;
    private syncStatusModel;
    private readonly imapConnectionService;
    private readonly emailProcessingService;
    private readonly logger;
    private readonly syncStatuses;
    constructor(emailAccountModel: Model<EmailAccountDocument>, emailModel: Model<EmailDocument>, syncStatusModel: Model<SyncStatusDocument>, imapConnectionService: ImapConnectionService, emailProcessingService: EmailProcessingService);
    startSync(accountId: string): Promise<void>;
    pauseSync(accountId: string): Promise<void>;
    resumeSync(accountId: string): Promise<void>;
    getSyncStatus(accountId: string): Promise<SyncStatus | null>;
    testImapConnection(accountId: string): Promise<any>;
    testEmailCount(accountId: string): Promise<any>;
    testSaveEmail(accountId: string): Promise<any>;
    private getFolderHierarchy;
    private getFolderMessageCounts;
    private tryAlternativeFetch;
    private processBoxes;
    private syncFolder;
    private getExistingEmails;
    private buildSearchCriteria;
    private fetchEmails;
    private processEmailMessage;
    private parseFlags;
    private parseEmailContent;
    private saveEmails;
    private getFolderInfo;
    private updateSyncStatus;
}
