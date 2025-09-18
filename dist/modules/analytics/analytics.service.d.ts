import { Model, Types } from 'mongoose';
import { EmailDocument } from '../../database/schemas/email.schema';
import { EmailAccountDocument } from '../../database/schemas/email-account.schema';
export interface AnalyticsFilters {
    accountId?: Types.ObjectId;
    dateFrom?: Date;
    dateTo?: Date;
}
export declare class AnalyticsService {
    private emailModel;
    private emailAccountModel;
    constructor(emailModel: Model<EmailDocument>, emailAccountModel: Model<EmailAccountDocument>);
    getOverview(userId: Types.ObjectId, filters: AnalyticsFilters): Promise<{
        totalEmails: number;
        uniqueSenders: number;
        uniqueDomains: number;
        espBreakdown: {
            [key: string]: number;
        };
        recentEmails: (import("mongoose").FlattenMaps<EmailDocument> & Required<{
            _id: import("mongoose").FlattenMaps<unknown>;
        }> & {
            __v: number;
        })[];
        averageTimeDelta: number;
        securityMetrics: {
            totalEmails: number;
            openRelayCount: number;
            tlsValidCount: number;
            certificateExpiringCount: number;
            openRelayPercentage: number;
            tlsValidPercentage: number;
        };
    }>;
    getSenders(userId: Types.ObjectId, accountId?: Types.ObjectId, limit?: number): Promise<any[]>;
    getDomains(userId: Types.ObjectId, accountId?: Types.ObjectId, limit?: number): Promise<any[]>;
    getESP(userId: Types.ObjectId, accountId?: Types.ObjectId, limit?: number): Promise<any[]>;
    getTimeSeries(userId: Types.ObjectId, accountId?: Types.ObjectId, days?: number): Promise<{
        date: string;
        count: any;
    }[]>;
    getSecurityMetrics(userId: Types.ObjectId, accountId?: Types.ObjectId): Promise<{
        totalEmails: number;
        openRelayCount: number;
        tlsValidCount: number;
        certificateExpiringCount: number;
        openRelayPercentage: number;
        tlsValidPercentage: number;
    }>;
    private getUserAccountIds;
    private buildQuery;
    private getESPBreakdown;
    private getAverageTimeDelta;
}
