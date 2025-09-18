import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getOverview(req: any, accountId?: string, dateFrom?: string, dateTo?: string): Promise<{
        totalEmails: number;
        uniqueSenders: number;
        uniqueDomains: number;
        espBreakdown: {
            [key: string]: number;
        };
        recentEmails: (import("mongoose").FlattenMaps<import("../../database/schemas/email.schema").EmailDocument> & Required<{
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
    getSenders(req: any, accountId?: string, limit?: string): Promise<any[]>;
    getDomains(req: any, accountId?: string, limit?: string): Promise<any[]>;
    getESP(req: any, accountId?: string, limit?: string): Promise<any[]>;
    getTimeSeries(req: any, accountId?: string, days?: string): Promise<{
        date: string;
        count: any;
    }[]>;
    getSecurityMetrics(req: any, accountId?: string): Promise<{
        totalEmails: number;
        openRelayCount: number;
        tlsValidCount: number;
        certificateExpiringCount: number;
        openRelayPercentage: number;
        tlsValidPercentage: number;
    }>;
}
