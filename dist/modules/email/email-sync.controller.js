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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailSyncController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const email_sync_service_1 = require("./email-sync.service");
const email_account_schema_1 = require("../../database/schemas/email-account.schema");
const mongoose_3 = require("mongoose");
let EmailSyncController = class EmailSyncController {
    emailSyncService;
    emailAccountModel;
    constructor(emailSyncService, emailAccountModel) {
        this.emailSyncService = emailSyncService;
        this.emailAccountModel = emailAccountModel;
    }
    async startSync(accountId, req) {
        try {
            await this.verifyAccountOwnership(accountId, req.user._id);
            this.emailSyncService.startSync(accountId).catch(error => {
                console.error(`Background sync error for account ${accountId}:`, error);
            });
            return { message: 'Sync started successfully' };
        }
        catch (error) {
            throw new Error(`Failed to start sync: ${error.message}`);
        }
    }
    async pauseSync(accountId, req) {
        try {
            await this.verifyAccountOwnership(accountId, req.user._id);
            await this.emailSyncService.pauseSync(accountId);
            return { message: 'Sync paused successfully' };
        }
        catch (error) {
            throw new Error(`Failed to pause sync: ${error.message}`);
        }
    }
    async resumeSync(accountId, req) {
        try {
            await this.verifyAccountOwnership(accountId, req.user._id);
            await this.emailSyncService.resumeSync(accountId);
            return { message: 'Sync resumed successfully' };
        }
        catch (error) {
            throw new Error(`Failed to resume sync: ${error.message}`);
        }
    }
    async getSyncStatus(accountId, req) {
        await this.verifyAccountOwnership(accountId, req.user._id);
        return this.emailSyncService.getSyncStatus(accountId);
    }
    async testSync(accountId, req) {
        await this.verifyAccountOwnership(accountId, req.user._id);
        try {
            const connectionResult = await this.emailSyncService.testImapConnection(accountId);
            return {
                message: 'Sync service is working',
                accountId,
                connectionTest: connectionResult,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                message: 'Sync service is working but IMAP connection failed',
                accountId,
                connectionError: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    async quickTest(accountId, req) {
        await this.verifyAccountOwnership(accountId, req.user._id);
        return {
            message: 'Quick test successful - sync service is ready',
            accountId,
            timestamp: new Date().toISOString(),
            status: 'ready'
        };
    }
    async testConnection(accountId, req) {
        await this.verifyAccountOwnership(accountId, req.user._id);
        try {
            const result = await this.emailSyncService.testImapConnection(accountId);
            return {
                message: 'IMAP connection test successful',
                accountId,
                result,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                message: 'IMAP connection test failed',
                accountId,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    async testEmails(accountId, req) {
        await this.verifyAccountOwnership(accountId, req.user._id);
        try {
            const result = await this.emailSyncService.testEmailCount(accountId);
            return {
                message: 'Email count test successful',
                accountId,
                result,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                message: 'Email count test failed',
                accountId,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    async testSaveEmail(accountId, req) {
        await this.verifyAccountOwnership(accountId, req.user._id);
        try {
            const result = await this.emailSyncService.testSaveEmail(accountId);
            return {
                message: 'Test email save successful',
                accountId,
                result,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                message: 'Test email save failed',
                accountId,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    async verifyAccountOwnership(accountId, userId) {
        const account = await this.emailAccountModel.findOne({
            _id: new mongoose_3.Types.ObjectId(accountId),
            userId: userId
        });
        if (!account) {
            throw new Error('Email account not found or access denied');
        }
    }
};
exports.EmailSyncController = EmailSyncController;
__decorate([
    (0, common_1.Post)('start/:accountId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailSyncController.prototype, "startSync", null);
__decorate([
    (0, common_1.Post)('pause/:accountId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailSyncController.prototype, "pauseSync", null);
__decorate([
    (0, common_1.Post)('resume/:accountId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailSyncController.prototype, "resumeSync", null);
__decorate([
    (0, common_1.Get)('status/:accountId'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailSyncController.prototype, "getSyncStatus", null);
__decorate([
    (0, common_1.Get)('test/:accountId'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailSyncController.prototype, "testSync", null);
__decorate([
    (0, common_1.Get)('quick-test/:accountId'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailSyncController.prototype, "quickTest", null);
__decorate([
    (0, common_1.Get)('test-connection/:accountId'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailSyncController.prototype, "testConnection", null);
__decorate([
    (0, common_1.Get)('test-emails/:accountId'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailSyncController.prototype, "testEmails", null);
__decorate([
    (0, common_1.Post)('test-save/:accountId'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailSyncController.prototype, "testSaveEmail", null);
exports.EmailSyncController = EmailSyncController = __decorate([
    (0, common_1.Controller)('sync'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(1, (0, mongoose_1.InjectModel)(email_account_schema_1.EmailAccount.name)),
    __metadata("design:paramtypes", [email_sync_service_1.EmailSyncService,
        mongoose_2.Model])
], EmailSyncController);
//# sourceMappingURL=email-sync.controller.js.map