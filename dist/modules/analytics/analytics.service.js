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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const email_schema_1 = require("../../database/schemas/email.schema");
const email_account_schema_1 = require("../../database/schemas/email-account.schema");
let AnalyticsService = class AnalyticsService {
    emailModel;
    emailAccountModel;
    constructor(emailModel, emailAccountModel) {
        this.emailModel = emailModel;
        this.emailAccountModel = emailAccountModel;
    }
    async getOverview(userId, filters) {
        const accountIds = await this.getUserAccountIds(userId, filters.accountId);
        const query = this.buildQuery(accountIds, filters);
        const [totalEmails, uniqueSenders, uniqueDomains, espBreakdown, recentEmails, averageTimeDelta, securityMetrics,] = await Promise.all([
            this.emailModel.countDocuments(query),
            this.emailModel.distinct('fromEmail', query).then(emails => emails.length),
            this.emailModel.distinct('sendingDomain', query).then(domains => domains.length),
            this.getESPBreakdown(query),
            this.emailModel.find(query).sort({ date: -1 }).limit(10).lean(),
            this.getAverageTimeDelta(query),
            this.getSecurityMetrics(query),
        ]);
        return {
            totalEmails,
            uniqueSenders,
            uniqueDomains,
            espBreakdown,
            recentEmails,
            averageTimeDelta,
            securityMetrics,
        };
    }
    async getSenders(userId, accountId, limit = 20) {
        const accountIds = await this.getUserAccountIds(userId, accountId);
        const query = this.buildQuery(accountIds);
        const pipeline = [
            { $match: query },
            { $group: { _id: '$fromEmail', count: { $sum: 1 }, lastSeen: { $max: '$date' } } },
            { $sort: { count: -1 } },
            { $limit: limit },
        ];
        return this.emailModel.aggregate(pipeline);
    }
    async getDomains(userId, accountId, limit = 20) {
        const accountIds = await this.getUserAccountIds(userId, accountId);
        const query = this.buildQuery(accountIds);
        const pipeline = [
            { $match: query },
            { $group: { _id: '$sendingDomain', count: { $sum: 1 }, lastSeen: { $max: '$date' } } },
            { $sort: { count: -1 } },
            { $limit: limit },
        ];
        return this.emailModel.aggregate(pipeline);
    }
    async getESP(userId, accountId, limit = 20) {
        const accountIds = await this.getUserAccountIds(userId, accountId);
        const query = this.buildQuery(accountIds);
        const pipeline = [
            { $match: query },
            { $group: { _id: '$espName', count: { $sum: 1 }, type: { $first: '$espType' } } },
            { $sort: { count: -1 } },
            { $limit: limit },
        ];
        return this.emailModel.aggregate(pipeline);
    }
    async getTimeSeries(userId, accountId, days = 30) {
        const accountIds = await this.getUserAccountIds(userId, accountId);
        const query = this.buildQuery(accountIds);
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
        query.date = { $gte: dateFrom };
        const pipeline = [
            { $match: query },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                        day: { $dayOfMonth: '$date' },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: {
                    '_id.year': 1,
                    '_id.month': 1,
                    '_id.day': 1,
                },
            },
        ];
        const results = await this.emailModel.aggregate(pipeline);
        return results.map(result => ({
            date: `${result._id.year}-${String(result._id.month).padStart(2, '0')}-${String(result._id.day).padStart(2, '0')}`,
            count: result.count,
        }));
    }
    async getSecurityMetrics(userId, accountId) {
        const accountIds = await this.getUserAccountIds(userId, accountId);
        const query = this.buildQuery(accountIds);
        const [totalEmails, openRelayCount, tlsValidCount, certificateExpiringCount,] = await Promise.all([
            this.emailModel.countDocuments(query),
            this.emailModel.countDocuments({ ...query, isOpenRelay: true }),
            this.emailModel.countDocuments({ ...query, hasValidTLS: true }),
            this.emailModel.countDocuments({
                ...query,
                certificateValidTo: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
            }),
        ]);
        return {
            totalEmails,
            openRelayCount,
            tlsValidCount,
            certificateExpiringCount,
            openRelayPercentage: totalEmails > 0 ? (openRelayCount / totalEmails) * 100 : 0,
            tlsValidPercentage: totalEmails > 0 ? (tlsValidCount / totalEmails) * 100 : 0,
        };
    }
    async getUserAccountIds(userId, accountId) {
        if (accountId) {
            const account = await this.emailAccountModel.findOne({ _id: accountId, userId });
            if (!account) {
                throw new Error('Account not found or access denied');
            }
            return [accountId];
        }
        const accounts = await this.emailAccountModel.find({ userId }).select('_id');
        return accounts.map(account => account._id);
    }
    buildQuery(accountIds, filters) {
        const query = { accountId: { $in: accountIds } };
        if (filters?.dateFrom || filters?.dateTo) {
            query.date = {};
            if (filters.dateFrom)
                query.date.$gte = filters.dateFrom;
            if (filters.dateTo)
                query.date.$lte = filters.dateTo;
        }
        return query;
    }
    async getESPBreakdown(query) {
        const pipeline = [
            { $match: query },
            { $group: { _id: '$espName', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ];
        const results = await this.emailModel.aggregate(pipeline);
        const espBreakdown = {};
        results.forEach(result => {
            if (result._id) {
                espBreakdown[result._id] = result.count;
            }
        });
        return espBreakdown;
    }
    async getAverageTimeDelta(query) {
        const pipeline = [
            { $match: query },
            { $group: { _id: null, avgTimeDelta: { $avg: '$timeDelta' } } },
        ];
        const result = await this.emailModel.aggregate(pipeline);
        return result.length > 0 ? result[0].avgTimeDelta : 0;
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(email_schema_1.Email.name)),
    __param(1, (0, mongoose_1.InjectModel)(email_account_schema_1.EmailAccount.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map