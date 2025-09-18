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
var SearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const email_schema_1 = require("../../database/schemas/email.schema");
const email_account_schema_1 = require("../../database/schemas/email-account.schema");
let SearchService = SearchService_1 = class SearchService {
    emailModel;
    emailAccountModel;
    logger = new common_1.Logger(SearchService_1.name);
    constructor(emailModel, emailAccountModel) {
        this.emailModel = emailModel;
        this.emailAccountModel = emailAccountModel;
    }
    async searchEmails(userId, query, filters = {}, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            const accountIds = await this.getUserAccountIds(userId, filters.accountId);
            const mongoQuery = this.buildSearchQuery(query, filters, accountIds);
            const [emails, total] = await Promise.all([
                this.emailModel
                    .find(mongoQuery)
                    .sort({ date: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                this.emailModel.countDocuments(mongoQuery),
            ]);
            const facets = await this.getSearchFacets(filters, accountIds);
            const totalPages = Math.ceil(total / limit);
            return {
                emails,
                total,
                page,
                limit,
                totalPages,
                facets,
            };
        }
        catch (error) {
            this.logger.error('Search error:', error);
            throw error;
        }
    }
    async getSearchSuggestions(userId, query, limit = 10) {
        try {
            const searchRegex = new RegExp(query, 'i');
            const accountIds = await this.getUserAccountIds(userId);
            const baseQuery = { accountId: { $in: accountIds } };
            const [senders, subjects, domains] = await Promise.all([
                this.emailModel
                    .distinct('fromEmail', {
                    ...baseQuery,
                    fromEmail: searchRegex,
                })
                    .limit(limit),
                this.emailModel
                    .distinct('subject', {
                    ...baseQuery,
                    subject: searchRegex,
                })
                    .limit(limit),
                this.emailModel
                    .distinct('sendingDomain', {
                    ...baseQuery,
                    sendingDomain: searchRegex,
                })
                    .limit(limit),
            ]);
            return {
                senders: senders.filter(Boolean),
                subjects: subjects.filter(Boolean),
                domains: domains.filter(Boolean),
            };
        }
        catch (error) {
            this.logger.error('Error getting search suggestions:', error);
            return { senders: [], subjects: [], domains: [] };
        }
    }
    async getAdvancedSearchFilters(userId) {
        try {
            const accountIds = await this.getUserAccountIds(userId);
            const baseQuery = { accountId: { $in: accountIds } };
            const [espTypes, folders] = await Promise.all([
                this.emailModel.distinct('espType', baseQuery),
                this.emailModel.distinct('folder', baseQuery),
            ]);
            const dateRanges = [
                { label: 'Last 24 hours', value: '24h' },
                { label: 'Last 7 days', value: '7d' },
                { label: 'Last 30 days', value: '30d' },
                { label: 'Last 90 days', value: '90d' },
                { label: 'Last year', value: '1y' },
            ];
            return {
                dateRanges,
                espTypes: espTypes.filter(Boolean),
                folders: folders.filter(Boolean),
            };
        }
        catch (error) {
            this.logger.error('Error getting advanced search filters:', error);
            return { dateRanges: [], espTypes: [], folders: [] };
        }
    }
    buildSearchQuery(query, filters, accountIds) {
        const mongoQuery = {
            accountId: { $in: accountIds }
        };
        if (query && query.trim()) {
            mongoQuery.$text = { $search: query };
        }
        if (filters.accountId) {
            mongoQuery.accountId = filters.accountId;
        }
        if (filters.dateFrom || filters.dateTo) {
            mongoQuery.date = {};
            if (filters.dateFrom) {
                mongoQuery.date.$gte = filters.dateFrom;
            }
            if (filters.dateTo) {
                mongoQuery.date.$lte = filters.dateTo;
            }
        }
        if (filters.sender) {
            mongoQuery.fromEmail = new RegExp(filters.sender, 'i');
        }
        if (filters.domain) {
            mongoQuery.sendingDomain = new RegExp(filters.domain, 'i');
        }
        if (filters.espType) {
            mongoQuery.espType = filters.espType;
        }
        if (filters.folder) {
            mongoQuery.folder = filters.folder;
        }
        if (filters.hasAttachments !== undefined) {
        }
        if (filters.isRead !== undefined) {
            if (filters.isRead) {
                mongoQuery.flags = { $in: ['\\Seen'] };
            }
            else {
                mongoQuery.flags = { $nin: ['\\Seen'] };
            }
        }
        if (filters.isFlagged !== undefined) {
            if (filters.isFlagged) {
                mongoQuery.flags = { $in: ['\\Flagged'] };
            }
            else {
                mongoQuery.flags = { $nin: ['\\Flagged'] };
            }
        }
        return mongoQuery;
    }
    async getSearchFacets(filters, accountIds) {
        try {
            const baseQuery = this.buildSearchQuery('', filters, accountIds);
            const [senders, domains, espTypes, folders] = await Promise.all([
                this.getFacetCounts('fromEmail', baseQuery),
                this.getFacetCounts('sendingDomain', baseQuery),
                this.getFacetCounts('espType', baseQuery),
                this.getFacetCounts('folder', baseQuery),
            ]);
            return {
                senders,
                domains,
                espTypes,
                folders,
            };
        }
        catch (error) {
            this.logger.error('Error getting search facets:', error);
            return {
                senders: {},
                domains: {},
                espTypes: {},
                folders: {},
            };
        }
    }
    async getFacetCounts(field, baseQuery) {
        try {
            const pipeline = [
                { $match: baseQuery },
                { $group: { _id: `$${field}`, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 20 },
            ];
            const results = await this.emailModel.aggregate(pipeline);
            const facets = {};
            for (const result of results) {
                if (result._id) {
                    facets[result._id] = result.count;
                }
            }
            return facets;
        }
        catch (error) {
            this.logger.error(`Error getting facet counts for ${field}:`, error);
            return {};
        }
    }
    async getSearchAnalytics(userId, accountId, timeRange = '30d') {
        try {
            return {
                totalSearches: 0,
                popularQueries: [],
                searchTrends: [],
                averageResultsPerSearch: 0,
            };
        }
        catch (error) {
            this.logger.error('Error getting search analytics:', error);
            return {
                totalSearches: 0,
                popularQueries: [],
                searchTrends: [],
                averageResultsPerSearch: 0,
            };
        }
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
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = SearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(email_schema_1.Email.name)),
    __param(1, (0, mongoose_1.InjectModel)(email_account_schema_1.EmailAccount.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], SearchService);
//# sourceMappingURL=search.service.js.map