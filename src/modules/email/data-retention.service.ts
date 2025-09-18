import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Email, EmailDocument } from '../../database/schemas/email.schema';
import { SyncStatus, SyncStatusDocument } from '../../database/schemas/sync-status.schema';

@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);

  constructor(
    @InjectModel(Email.name) private emailModel: Model<EmailDocument>,
    @InjectModel(SyncStatus.name) private syncStatusModel: Model<SyncStatusDocument>,
  ) {}

  async cleanupOldData(): Promise<void> {
    try {
      this.logger.log('Starting data retention cleanup...');

      // Clean up old sync status records (keep last 5 per account)
      await this.cleanupOldSyncStatuses();

      // Clean up emails older than 2 years (optional)
      // await this.cleanupOldEmails();

      this.logger.log('Data retention cleanup completed');
    } catch (error) {
      this.logger.error('Error during data retention cleanup:', error);
      throw error;
    }
  }

  private async cleanupOldSyncStatuses(): Promise<void> {
    const accounts = await this.syncStatusModel.distinct('accountId');
    
    for (const accountId of accounts) {
      const oldRecords = await this.syncStatusModel
        .find({ accountId })
        .sort({ updatedAt: -1 })
        .skip(5)
        .select('_id')
        .lean();

      if (oldRecords.length > 0) {
        const result = await this.syncStatusModel.deleteMany({
          _id: { $in: oldRecords.map(r => r._id) }
        });
        
        this.logger.log(`Cleaned up ${result.deletedCount} old sync status records for account ${accountId}`);
      }
    }
  }

  private async cleanupOldEmails(): Promise<void> {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const result = await this.emailModel.deleteMany({
      date: { $lt: twoYearsAgo }
    });

    this.logger.log(`Cleaned up ${result.deletedCount} emails older than 2 years`);
  }

  async getDatabaseStats(): Promise<any> {
    const emailCount = await this.emailModel.countDocuments();
    const syncStatusCount = await this.syncStatusModel.countDocuments();
    
    // Get approximate collection sizes using aggregate
    const emailStats = await this.emailModel.collection.aggregate([
      { $collStats: { storageStats: {} } }
    ]).toArray();
    
    const syncStatusStats = await this.syncStatusModel.collection.aggregate([
      { $collStats: { storageStats: {} } }
    ]).toArray();

    const emailSize = emailStats[0]?.storageStats?.size || 0;
    const syncStatusSize = syncStatusStats[0]?.storageStats?.size || 0;

    return {
      emails: {
        count: emailCount,
        sizeMB: (emailSize / 1024 / 1024).toFixed(2)
      },
      syncStatuses: {
        count: syncStatusCount,
        sizeMB: (syncStatusSize / 1024 / 1024).toFixed(2)
      },
      totalSizeMB: ((emailSize + syncStatusSize) / 1024 / 1024).toFixed(2)
    };
  }
}
