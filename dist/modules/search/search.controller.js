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
exports.SearchController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const search_service_1 = require("./search.service");
const mongoose_1 = require("mongoose");
let SearchController = class SearchController {
    searchService;
    constructor(searchService) {
        this.searchService = searchService;
    }
    async searchEmails(req, query, accountId, dateFrom, dateTo, sender, domain, espType, folder, isRead, isFlagged, page, limit) {
        const filters = {
            accountId: accountId ? new mongoose_1.Types.ObjectId(accountId) : undefined,
            dateFrom: dateFrom ? new Date(dateFrom) : undefined,
            dateTo: dateTo ? new Date(dateTo) : undefined,
            sender,
            domain,
            espType,
            folder,
            isRead: isRead ? isRead === 'true' : undefined,
            isFlagged: isFlagged ? isFlagged === 'true' : undefined,
        };
        return this.searchService.searchEmails(req.user._id, query || '', filters, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
    }
    async getSuggestions(req, query, limit) {
        return this.searchService.getSearchSuggestions(req.user._id, query || '', limit ? parseInt(limit) : 10);
    }
    async getAdvancedFilters(req) {
        return this.searchService.getAdvancedSearchFilters(req.user._id);
    }
    async getSearchAnalytics(req, accountId, timeRange) {
        return this.searchService.getSearchAnalytics(req.user._id, accountId, timeRange || '30d');
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Get)('emails'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('accountId')),
    __param(3, (0, common_1.Query)('dateFrom')),
    __param(4, (0, common_1.Query)('dateTo')),
    __param(5, (0, common_1.Query)('sender')),
    __param(6, (0, common_1.Query)('domain')),
    __param(7, (0, common_1.Query)('espType')),
    __param(8, (0, common_1.Query)('folder')),
    __param(9, (0, common_1.Query)('isRead')),
    __param(10, (0, common_1.Query)('isFlagged')),
    __param(11, (0, common_1.Query)('page')),
    __param(12, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchEmails", null);
__decorate([
    (0, common_1.Get)('suggestions'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getSuggestions", null);
__decorate([
    (0, common_1.Get)('filters'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getAdvancedFilters", null);
__decorate([
    (0, common_1.Get)('analytics'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('accountId')),
    __param(2, (0, common_1.Query)('timeRange')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getSearchAnalytics", null);
exports.SearchController = SearchController = __decorate([
    (0, common_1.Controller)('search'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [search_service_1.SearchService])
], SearchController);
//# sourceMappingURL=search.controller.js.map