import { Model, Types } from 'mongoose';
import { Email, EmailDocument } from '../../database/schemas/email.schema';
import { EmailAccountDocument } from '../../database/schemas/email-account.schema';
export interface SearchFilters {
    accountId?: Types.ObjectId;
    dateFrom?: Date;
    dateTo?: Date;
    sender?: string;
    domain?: string;
    espType?: string;
    folder?: string;
    hasAttachments?: boolean;
    isRead?: boolean;
    isFlagged?: boolean;
}
export interface SearchResult {
    emails: Email[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    facets: {
        senders: {
            [key: string]: number;
        };
        domains: {
            [key: string]: number;
        };
        espTypes: {
            [key: string]: number;
        };
        folders: {
            [key: string]: number;
        };
    };
}
export declare class SearchService {
    private emailModel;
    private emailAccountModel;
    private readonly logger;
    constructor(emailModel: Model<EmailDocument>, emailAccountModel: Model<EmailAccountDocument>);
    searchEmails(userId: Types.ObjectId, query: string, filters?: SearchFilters, page?: number, limit?: number): Promise<SearchResult>;
    getSearchSuggestions(userId: Types.ObjectId, query: string, limit?: number): Promise<{
        senders: string[];
        subjects: string[];
        domains: string[];
    }>;
    getAdvancedSearchFilters(userId: Types.ObjectId): Promise<{
        dateRanges: {
            label: string;
            value: string;
        }[];
        espTypes: string[];
        folders: string[];
    }>;
    private buildSearchQuery;
    private getSearchFacets;
    private getFacetCounts;
    getSearchAnalytics(userId: Types.ObjectId, accountId?: string, timeRange?: string): Promise<{
        totalSearches: number;
        popularQueries: {
            query: string;
            count: number;
        }[];
        searchTrends: {
            date: string;
            searches: number;
        }[];
        averageResultsPerSearch: number;
    }>;
    private getUserAccountIds;
}
