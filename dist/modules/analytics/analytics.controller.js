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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const analytics_service_1 = require("./analytics.service");
const mongoose_1 = require("mongoose");
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getOverview(req, accountId, dateFrom, dateTo) {
        const filters = {
            accountId: accountId ? new mongoose_1.Types.ObjectId(accountId) : undefined,
            dateFrom: dateFrom ? new Date(dateFrom) : undefined,
            dateTo: dateTo ? new Date(dateTo) : undefined,
        };
        return this.analyticsService.getOverview(req.user._id, filters);
    }
    async getSenders(req, accountId, limit) {
        return this.analyticsService.getSenders(req.user._id, accountId ? new mongoose_1.Types.ObjectId(accountId) : undefined, limit ? parseInt(limit) : 20);
    }
    async getDomains(req, accountId, limit) {
        return this.analyticsService.getDomains(req.user._id, accountId ? new mongoose_1.Types.ObjectId(accountId) : undefined, limit ? parseInt(limit) : 20);
    }
    async getESP(req, accountId, limit) {
        return this.analyticsService.getESP(req.user._id, accountId ? new mongoose_1.Types.ObjectId(accountId) : undefined, limit ? parseInt(limit) : 20);
    }
    async getTimeSeries(req, accountId, days) {
        return this.analyticsService.getTimeSeries(req.user._id, accountId ? new mongoose_1.Types.ObjectId(accountId) : undefined, days ? parseInt(days) : 30);
    }
    async getSecurityMetrics(req, accountId) {
        return this.analyticsService.getSecurityMetrics(req.user._id, accountId ? new mongoose_1.Types.ObjectId(accountId) : undefined);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('accountId')),
    __param(2, (0, common_1.Query)('dateFrom')),
    __param(3, (0, common_1.Query)('dateTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('senders'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('accountId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getSenders", null);
__decorate([
    (0, common_1.Get)('domains'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('accountId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDomains", null);
__decorate([
    (0, common_1.Get)('esp'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('accountId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getESP", null);
__decorate([
    (0, common_1.Get)('time-series'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('accountId')),
    __param(2, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTimeSeries", null);
__decorate([
    (0, common_1.Get)('security'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getSecurityMetrics", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('analytics'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map