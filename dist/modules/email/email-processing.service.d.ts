import { Model } from 'mongoose';
import { Email } from '../../database/schemas/email.schema';
export declare class EmailProcessingService {
    private emailModel;
    private readonly logger;
    constructor(emailModel: Model<Email>);
    private readonly espPatterns;
    processEmail(email: Email): Promise<Partial<Email>>;
    private extractSendingDomain;
    private detectESP;
    private checkOpenRelay;
    private checkTLSConfiguration;
    getEmailAnalytics(accountId: string, filters?: {
        dateFrom?: Date;
        dateTo?: Date;
        espType?: string;
        domain?: string;
    }): Promise<{
        totalEmails: number;
        uniqueSenders: number;
        uniqueDomains: number;
        espBreakdown: {
            [key: string]: number;
        };
        domainBreakdown: {
            [key: string]: number;
        };
        averageTimeDelta: number;
        openRelayCount: number;
        tlsValidCount: number;
        timeSeries: {
            date: string;
            count: number;
        }[];
    }>;
}
