import { Model } from 'mongoose';
import { EmailDocument } from '../../database/schemas/email.schema';
import { SyncStatusDocument } from '../../database/schemas/sync-status.schema';
export declare class DataRetentionService {
    private emailModel;
    private syncStatusModel;
    private readonly logger;
    constructor(emailModel: Model<EmailDocument>, syncStatusModel: Model<SyncStatusDocument>);
    cleanupOldData(): Promise<void>;
    private cleanupOldSyncStatuses;
    private cleanupOldEmails;
    getDatabaseStats(): Promise<any>;
}
