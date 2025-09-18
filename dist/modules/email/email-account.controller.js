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
exports.EmailAccountController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const email_account_service_1 = require("./email-account.service");
const email_account_dto_1 = require("./dto/email-account.dto");
const mongoose_1 = require("mongoose");
let EmailAccountController = class EmailAccountController {
    emailAccountService;
    constructor(emailAccountService) {
        this.emailAccountService = emailAccountService;
    }
    async getEmailAccounts(req) {
        return this.emailAccountService.getEmailAccounts(req.user._id);
    }
    async createEmailAccount(req, createEmailAccountDto) {
        return this.emailAccountService.createEmailAccount(req.user._id, createEmailAccountDto);
    }
    async updateEmailAccount(id, req, updateEmailAccountDto) {
        return this.emailAccountService.updateEmailAccount(new mongoose_1.Types.ObjectId(id), req.user._id, updateEmailAccountDto);
    }
    async deleteEmailAccount(id, req) {
        return this.emailAccountService.deleteEmailAccount(new mongoose_1.Types.ObjectId(id), req.user._id);
    }
    async testConnection(id, req) {
        return this.emailAccountService.testConnection(new mongoose_1.Types.ObjectId(id), req.user._id);
    }
};
exports.EmailAccountController = EmailAccountController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailAccountController.prototype, "getEmailAccounts", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, email_account_dto_1.CreateEmailAccountDto]),
    __metadata("design:returntype", Promise)
], EmailAccountController.prototype, "createEmailAccount", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, email_account_dto_1.UpdateEmailAccountDto]),
    __metadata("design:returntype", Promise)
], EmailAccountController.prototype, "updateEmailAccount", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailAccountController.prototype, "deleteEmailAccount", null);
__decorate([
    (0, common_1.Post)(':id/test-connection'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailAccountController.prototype, "testConnection", null);
exports.EmailAccountController = EmailAccountController = __decorate([
    (0, common_1.Controller)('email-accounts'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [email_account_service_1.EmailAccountService])
], EmailAccountController);
//# sourceMappingURL=email-account.controller.js.map