import { SearchService } from './search.service';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    searchEmails(req: any, query: string, accountId?: string, dateFrom?: string, dateTo?: string, sender?: string, domain?: string, espType?: string, folder?: string, isRead?: string, isFlagged?: string, page?: string, limit?: string): Promise<import("./search.service").SearchResult>;
    getSuggestions(req: any, query: string, limit?: string): Promise<{
        senders: string[];
        subjects: string[];
        domains: string[];
    }>;
    getAdvancedFilters(req: any): Promise<{
        dateRanges: {
            label: string;
            value: string;
        }[];
        espTypes: string[];
        folders: string[];
    }>;
    getSearchAnalytics(req: any, accountId?: string, timeRange?: string): Promise<{
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
}
