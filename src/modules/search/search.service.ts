import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Email, EmailDocument } from '../../database/schemas/email.schema';
import { EmailAccount, EmailAccountDocument } from '../../database/schemas/email-account.schema';

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
    senders: { [key: string]: number };
    domains: { [key: string]: number };
    espTypes: { [key: string]: number };
    folders: { [key: string]: number };
  };
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectModel(Email.name) private emailModel: Model<EmailDocument>,
    @InjectModel(EmailAccount.name) private emailAccountModel: Model<EmailAccountDocument>,
  ) {}

  async searchEmails(
    userId: Types.ObjectId,
    query: string,
    filters: SearchFilters = {},
    page: number = 1,
    limit: number = 20,
  ): Promise<SearchResult> {
    try {
      const skip = (page - 1) * limit;
      
      // Get user's account IDs
      const accountIds = await this.getUserAccountIds(userId, filters.accountId);
      
      // Build MongoDB query
      const mongoQuery = this.buildSearchQuery(query, filters, accountIds);
      
      // Execute search with pagination
      const [emails, total] = await Promise.all([
        this.emailModel
          .find(mongoQuery)
          .sort({ date: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.emailModel.countDocuments(mongoQuery),
      ]);

      // Get facets for filtering
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
    } catch (error) {
      this.logger.error('Search error:', error);
      throw error;
    }
  }

  async getSearchSuggestions(userId: Types.ObjectId, query: string, limit: number = 10): Promise<{
    senders: string[];
    subjects: string[];
    domains: string[];
  }> {
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
    } catch (error) {
      this.logger.error('Error getting search suggestions:', error);
      return { senders: [], subjects: [], domains: [] };
    }
  }

  async getAdvancedSearchFilters(userId: Types.ObjectId): Promise<{
    dateRanges: { label: string; value: string }[];
    espTypes: string[];
    folders: string[];
  }> {
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
    } catch (error) {
      this.logger.error('Error getting advanced search filters:', error);
      return { dateRanges: [], espTypes: [], folders: [] };
    }
  }

  private buildSearchQuery(query: string, filters: SearchFilters, accountIds: Types.ObjectId[]): any {
    const mongoQuery: any = {
      accountId: { $in: accountIds }
    };

    // Text search
    if (query && query.trim()) {
      mongoQuery.$text = { $search: query };
    }

    // Account filter - if specific account is requested, use it instead of all user accounts
    if (filters.accountId) {
      mongoQuery.accountId = filters.accountId;
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      mongoQuery.date = {};
      if (filters.dateFrom) {
        mongoQuery.date.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        mongoQuery.date.$lte = filters.dateTo;
      }
    }

    // Sender filter
    if (filters.sender) {
      mongoQuery.fromEmail = new RegExp(filters.sender, 'i');
    }

    // Domain filter
    if (filters.domain) {
      mongoQuery.sendingDomain = new RegExp(filters.domain, 'i');
    }

    // ESP type filter
    if (filters.espType) {
      mongoQuery.espType = filters.espType;
    }

    // Folder filter
    if (filters.folder) {
      mongoQuery.folder = filters.folder;
    }

    // Attachment filter
    if (filters.hasAttachments !== undefined) {
      // This would need to be implemented based on how attachments are stored
      // For now, we'll skip this filter
    }

    // Read status filter
    if (filters.isRead !== undefined) {
      if (filters.isRead) {
        mongoQuery.flags = { $in: ['\\Seen'] };
      } else {
        mongoQuery.flags = { $nin: ['\\Seen'] };
      }
    }

    // Flagged filter
    if (filters.isFlagged !== undefined) {
      if (filters.isFlagged) {
        mongoQuery.flags = { $in: ['\\Flagged'] };
      } else {
        mongoQuery.flags = { $nin: ['\\Flagged'] };
      }
    }

    return mongoQuery;
  }

  private async getSearchFacets(filters: SearchFilters, accountIds: Types.ObjectId[]): Promise<{
    senders: { [key: string]: number };
    domains: { [key: string]: number };
    espTypes: { [key: string]: number };
    folders: { [key: string]: number };
  }> {
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
    } catch (error) {
      this.logger.error('Error getting search facets:', error);
      return {
        senders: {},
        domains: {},
        espTypes: {},
        folders: {},
      };
    }
  }

  private async getFacetCounts(field: string, baseQuery: any): Promise<{ [key: string]: number }> {
    try {
      const pipeline = [
        { $match: baseQuery },
        { $group: { _id: `$${field}`, count: { $sum: 1 } } },
        { $sort: { count: -1 as const } },
        { $limit: 20 },
      ];

      const results = await this.emailModel.aggregate(pipeline);
      
      const facets: { [key: string]: number } = {};
      for (const result of results) {
        if (result._id) {
          facets[result._id] = result.count;
        }
      }

      return facets;
    } catch (error) {
      this.logger.error(`Error getting facet counts for ${field}:`, error);
      return {};
    }
  }

  async getSearchAnalytics(userId: Types.ObjectId, accountId?: string, timeRange: string = '30d'): Promise<{
    totalSearches: number;
    popularQueries: { query: string; count: number }[];
    searchTrends: { date: string; searches: number }[];
    averageResultsPerSearch: number;
  }> {
    try {
      // This would typically be stored in a separate search analytics collection
      // For now, we'll return mock data
      return {
        totalSearches: 0,
        popularQueries: [],
        searchTrends: [],
        averageResultsPerSearch: 0,
      };
    } catch (error) {
      this.logger.error('Error getting search analytics:', error);
      return {
        totalSearches: 0,
        popularQueries: [],
        searchTrends: [],
        averageResultsPerSearch: 0,
      };
    }
  }

  private async getUserAccountIds(userId: Types.ObjectId, accountId?: Types.ObjectId): Promise<Types.ObjectId[]> {
    if (accountId) {
      // Verify account belongs to user
      const account = await this.emailAccountModel.findOne({ _id: accountId, userId });
      if (!account) {
        throw new Error('Account not found or access denied');
      }
      return [accountId];
    }

    const accounts = await this.emailAccountModel.find({ userId }).select('_id');
    return accounts.map(account => (account as any)._id);
  }
}
