import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Email, EmailDocument } from '../../database/schemas/email.schema';
import { EmailAccount, EmailAccountDocument } from '../../database/schemas/email-account.schema';

export interface AnalyticsFilters {
  accountId?: Types.ObjectId;
  dateFrom?: Date;
  dateTo?: Date;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Email.name) private emailModel: Model<EmailDocument>,
    @InjectModel(EmailAccount.name) private emailAccountModel: Model<EmailAccountDocument>,
  ) {}

  async getOverview(userId: Types.ObjectId, filters: AnalyticsFilters) {
    const accountIds = await this.getUserAccountIds(userId, filters.accountId);
    const query = this.buildQuery(accountIds, filters);

    const [
      totalEmails,
      uniqueSenders,
      uniqueDomains,
      espBreakdown,
      recentEmails,
      averageTimeDelta,
      securityMetrics,
    ] = await Promise.all([
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

  async getSenders(userId: Types.ObjectId, accountId?: Types.ObjectId, limit: number = 20) {
    const accountIds = await this.getUserAccountIds(userId, accountId);
    const query = this.buildQuery(accountIds);

    const pipeline = [
      { $match: query },
      { $group: { _id: '$fromEmail', count: { $sum: 1 }, lastSeen: { $max: '$date' } } },
      { $sort: { count: -1 as const } },
      { $limit: limit },
    ];

    return this.emailModel.aggregate(pipeline);
  }

  async getDomains(userId: Types.ObjectId, accountId?: Types.ObjectId, limit: number = 20) {
    const accountIds = await this.getUserAccountIds(userId, accountId);
    const query = this.buildQuery(accountIds);

    const pipeline = [
      { $match: query },
      { $group: { _id: '$sendingDomain', count: { $sum: 1 }, lastSeen: { $max: '$date' } } },
      { $sort: { count: -1 as const } },
      { $limit: limit },
    ];

    return this.emailModel.aggregate(pipeline);
  }

  async getESP(userId: Types.ObjectId, accountId?: Types.ObjectId, limit: number = 20) {
    const accountIds = await this.getUserAccountIds(userId, accountId);
    const query = this.buildQuery(accountIds);

    const pipeline = [
      { $match: query },
      { $group: { _id: '$espName', count: { $sum: 1 }, type: { $first: '$espType' } } },
      { $sort: { count: -1 as const } },
      { $limit: limit },
    ];

    return this.emailModel.aggregate(pipeline);
  }

  async getTimeSeries(userId: Types.ObjectId, accountId?: Types.ObjectId, days: number = 30) {
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
          '_id.year': 1 as const,
          '_id.month': 1 as const,
          '_id.day': 1 as const,
        },
      },
    ];

    const results = await this.emailModel.aggregate(pipeline);
    
    return results.map(result => ({
      date: `${result._id.year}-${String(result._id.month).padStart(2, '0')}-${String(result._id.day).padStart(2, '0')}`,
      count: result.count,
    }));
  }

  async getSecurityMetrics(userId: Types.ObjectId, accountId?: Types.ObjectId) {
    const accountIds = await this.getUserAccountIds(userId, accountId);
    const query = this.buildQuery(accountIds);

    const [
      totalEmails,
      openRelayCount,
      tlsValidCount,
      certificateExpiringCount,
    ] = await Promise.all([
      this.emailModel.countDocuments(query),
      this.emailModel.countDocuments({ ...query, isOpenRelay: true }),
      this.emailModel.countDocuments({ ...query, hasValidTLS: true }),
      this.emailModel.countDocuments({
        ...query,
        certificateValidTo: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, // 30 days from now
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

  private buildQuery(accountIds: Types.ObjectId[], filters?: AnalyticsFilters): any {
    const query: any = { accountId: { $in: accountIds } };

    if (filters?.dateFrom || filters?.dateTo) {
      query.date = {};
      if (filters.dateFrom) query.date.$gte = filters.dateFrom;
      if (filters.dateTo) query.date.$lte = filters.dateTo;
    }

    return query;
  }

  private async getESPBreakdown(query: any) {
    const pipeline = [
      { $match: query },
      { $group: { _id: '$espName', count: { $sum: 1 } } },
      { $sort: { count: -1 as const } },
    ];

    const results = await this.emailModel.aggregate(pipeline);
    
    // Convert array of {_id, count} objects to a plain object
    const espBreakdown: { [key: string]: number } = {};
    results.forEach(result => {
      if (result._id) {
        espBreakdown[result._id] = result.count;
      }
    });
    
    return espBreakdown;
  }

  private async getAverageTimeDelta(query: any): Promise<number> {
    const pipeline = [
      { $match: query },
      { $group: { _id: null, avgTimeDelta: { $avg: '$timeDelta' } } },
    ];

    const result = await this.emailModel.aggregate(pipeline);
    return result.length > 0 ? result[0].avgTimeDelta : 0;
  }
}
