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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DataRetentionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataRetentionService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const email_schema_1 = require("../../database/schemas/email.schema");
const sync_status_schema_1 = require("../../database/schemas/sync-status.schema");
let DataRetentionService = DataRetentionService_1 = class DataRetentionService {
    emailModel;
    syncStatusModel;
    logger = new common_1.Logger(DataRetentionService_1.name);
    constructor(emailModel, syncStatusModel) {
        this.emailModel = emailModel;
        this.syncStatusModel = syncStatusModel;
    }
    async cleanupOldData() {
        try {
            this.logger.log('Starting data retention cleanup...');
            await this.cleanupOldSyncStatuses();
            this.logger.log('Data retention cleanup completed');
        }
        catch (error) {
            this.logger.error('Error during data retention cleanup:', error);
            throw error;
        }
    }
    async cleanupOldSyncStatuses() {
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
    async cleanupOldEmails() {
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        const result = await this.emailModel.deleteMany({
            date: { $lt: twoYearsAgo }
        });
        this.logger.log(`Cleaned up ${result.deletedCount} emails older than 2 years`);
    }
    async getDatabaseStats() {
        const emailCount = await this.emailModel.countDocuments();
        const syncStatusCount = await this.syncStatusModel.countDocuments();
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
};
exports.DataRetentionService = DataRetentionService;
exports.DataRetentionService = DataRetentionService = DataRetentionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(email_schema_1.Email.name)),
    __param(1, (0, mongoose_1.InjectModel)(sync_status_schema_1.SyncStatus.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], DataRetentionService);
//# sourceMappingURL=data-retention.service.js.map