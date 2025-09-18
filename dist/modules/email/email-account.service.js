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
exports.EmailAccountService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const email_account_schema_1 = require("../../database/schemas/email-account.schema");
const imap_connection_service_1 = require("../imap/imap-connection.service");
let EmailAccountService = class EmailAccountService {
    emailAccountModel;
    imapConnectionService;
    constructor(emailAccountModel, imapConnectionService) {
        this.emailAccountModel = emailAccountModel;
        this.imapConnectionService = imapConnectionService;
    }
    async getEmailAccounts(userId) {
        return this.emailAccountModel.find({ userId }).sort({ createdAt: -1 });
    }
    async createEmailAccount(userId, createEmailAccountDto) {
        this.validateAuthMethod(createEmailAccountDto);
        const emailAccount = new this.emailAccountModel({
            ...createEmailAccountDto,
            userId,
        });
        return emailAccount.save();
    }
    async updateEmailAccount(id, userId, updateEmailAccountDto) {
        const emailAccount = await this.emailAccountModel.findOne({ _id: id, userId });
        if (!emailAccount) {
            throw new common_1.NotFoundException('Email account not found');
        }
        if (updateEmailAccountDto.authMethod) {
            this.validateAuthMethod({ ...emailAccount.toObject(), ...updateEmailAccountDto });
        }
        Object.assign(emailAccount, updateEmailAccountDto);
        return emailAccount.save();
    }
    async deleteEmailAccount(id, userId) {
        const emailAccount = await this.emailAccountModel.findOne({ _id: id, userId });
        if (!emailAccount) {
            throw new common_1.NotFoundException('Email account not found');
        }
        await this.imapConnectionService.closeConnection(id.toString());
        await this.emailAccountModel.findByIdAndDelete(id);
    }
    async testConnection(id, userId) {
        const emailAccount = await this.emailAccountModel.findOne({ _id: id, userId });
        if (!emailAccount) {
            throw new common_1.NotFoundException('Email account not found');
        }
        try {
            const connection = await this.imapConnectionService.createConnection(emailAccount);
            await this.emailAccountModel.findByIdAndUpdate(id, {
                isConnected: true,
                lastError: null,
            });
            return {
                success: true,
                message: 'Connection successful',
            };
        }
        catch (error) {
            await this.emailAccountModel.findByIdAndUpdate(id, {
                isConnected: false,
                lastError: error.message,
            });
            return {
                success: false,
                message: error.message,
            };
        }
    }
    validateAuthMethod(account) {
        switch (account.authMethod) {
            case email_account_schema_1.AuthMethod.PLAIN:
            case email_account_schema_1.AuthMethod.LOGIN:
                if (!account.password) {
                    throw new common_1.BadRequestException('Password is required for PLAIN/LOGIN authentication');
                }
                break;
            case email_account_schema_1.AuthMethod.OAUTH2:
                if (!account.oauth2Token) {
                    throw new common_1.BadRequestException('OAuth2 token is required for OAuth2 authentication');
                }
                break;
            default:
                throw new common_1.BadRequestException('Invalid authentication method');
        }
    }
};
exports.EmailAccountService = EmailAccountService;
exports.EmailAccountService = EmailAccountService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(email_account_schema_1.EmailAccount.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        imap_connection_service_1.ImapConnectionService])
], EmailAccountService);
//# sourceMappingURL=email-account.service.js.map