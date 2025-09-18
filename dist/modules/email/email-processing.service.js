"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EmailProcessingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailProcessingService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const email_schema_1 = require("../../database/schemas/email.schema");
const dns = __importStar(require("dns"));
const tls = __importStar(require("tls"));
const util_1 = require("util");
const dnsResolve = (0, util_1.promisify)(dns.resolve);
let EmailProcessingService = EmailProcessingService_1 = class EmailProcessingService {
    emailModel;
    logger = new common_1.Logger(EmailProcessingService_1.name);
    constructor(emailModel) {
        this.emailModel = emailModel;
    }
    espPatterns = new Map([
        [/gmail\.com|googlemail\.com/, 'Gmail'],
        [/google\.com/, 'Google Workspace'],
        [/outlook\.com|hotmail\.com|live\.com/, 'Outlook'],
        [/microsoft\.com/, 'Microsoft 365'],
        [/yahoo\.com|yahoo\.co\.uk|yahoo\.co\.jp/, 'Yahoo Mail'],
        [/amazonaws\.com/, 'Amazon SES'],
        [/sendgrid\.net/, 'SendGrid'],
        [/mailgun\.org|mailgun\.net/, 'Mailgun'],
        [/mandrillapp\.com/, 'Mandrill'],
        [/postmarkapp\.com/, 'Postmark'],
        [/mailchimp\.com/, 'Mailchimp'],
        [/constantcontact\.com/, 'Constant Contact'],
        [/aweber\.com/, 'AWeber'],
        [/convertkit\.com/, 'ConvertKit'],
        [/drip\.com/, 'Drip'],
        [/activecampaign\.com/, 'ActiveCampaign'],
        [/hubspot\.com/, 'HubSpot'],
        [/salesforce\.com/, 'Salesforce Marketing Cloud'],
        [/adobe\.com/, 'Adobe Campaign'],
        [/ibm\.com/, 'IBM Watson Campaign Automation'],
        [/oracle\.com/, 'Oracle Responsys'],
        [/campaignmonitor\.com/, 'Campaign Monitor'],
        [/getresponse\.com/, 'GetResponse'],
        [/mailerlite\.com/, 'MailerLite'],
        [/benchmarkemail\.com/, 'Benchmark Email'],
        [/verticalresponse\.com/, 'VerticalResponse'],
        [/icontact\.com/, 'iContact'],
        [/myemma\.com/, 'Emma'],
        [/pardot\.com/, 'Pardot'],
        [/marketo\.com/, 'Marketo'],
        [/eloqua\.com/, 'Oracle Eloqua'],
        [/exacttarget\.com/, 'ExactTarget'],
        [/silverpop\.com/, 'Silverpop'],
        [/responsys\.com/, 'Responsys'],
        [/cheetahmail\.com/, 'CheetahMail'],
        [/lyris\.com/, 'Lyris'],
        [/bluehornet\.com/, 'BlueHornet'],
        [/listrak\.com/, 'Listrak'],
        [/bronto\.com/, 'Bronto'],
        [/klaviyo\.com/, 'Klaviyo'],
        [/omnisend\.com/, 'Omnisend'],
        [/sendinblue\.com/, 'Sendinblue'],
        [/mailjet\.com/, 'Mailjet'],
        [/sparkpost\.com/, 'SparkPost'],
        [/postfix/, 'Postfix'],
        [/sendmail/, 'Sendmail'],
        [/exim/, 'Exim'],
        [/qmail/, 'Qmail'],
        [/courier/, 'Courier'],
        [/zimbra/, 'Zimbra'],
        [/exchange/, 'Microsoft Exchange'],
        [/lotus/, 'Lotus Notes'],
        [/groupwise/, 'Novell GroupWise'],
    ]);
    async processEmail(email) {
        try {
            const processedData = {};
            const sendingDomain = this.extractSendingDomain(email.fromEmail);
            processedData.sendingDomain = sendingDomain;
            const espInfo = await this.detectESP(email, sendingDomain);
            processedData.espType = espInfo.type;
            processedData.espName = espInfo.name;
            const isOpenRelay = await this.checkOpenRelay(sendingDomain);
            processedData.isOpenRelay = isOpenRelay;
            const tlsInfo = await this.checkTLSConfiguration(sendingDomain);
            processedData.hasValidTLS = tlsInfo.hasValidTLS;
            processedData.tlsVersion = tlsInfo.version;
            processedData.certificateIssuer = tlsInfo.issuer;
            processedData.certificateSubject = tlsInfo.subject;
            processedData.certificateValidFrom = tlsInfo.validFrom;
            processedData.certificateValidTo = tlsInfo.validTo;
            return processedData;
        }
        catch (error) {
            this.logger.error('Error processing email:', error);
            return {};
        }
    }
    extractSendingDomain(email) {
        const domainMatch = email.match(/@([^>]+)/);
        return domainMatch ? domainMatch[1].toLowerCase() : '';
    }
    async detectESP(email, domain) {
        for (const [pattern, espName] of this.espPatterns) {
            if (pattern.test(domain)) {
                return { type: 'ESP', name: espName };
            }
        }
        const headers = email.content.toLowerCase();
        const espHeaders = [
            { pattern: /x-mailer:\s*([^\r\n]+)/i, name: 'Custom Mailer' },
            { pattern: /x-sender:\s*([^\r\n]+)/i, name: 'Custom Sender' },
            { pattern: /x-originating-ip:\s*([^\r\n]+)/i, name: 'Custom IP' },
            { pattern: /x-ses-.*/i, name: 'Amazon SES' },
            { pattern: /x-sg-.*/i, name: 'SendGrid' },
            { pattern: /x-mg-.*/i, name: 'Mailgun' },
            { pattern: /x-mandrill-.*/i, name: 'Mandrill' },
            { pattern: /x-postmark-.*/i, name: 'Postmark' },
            { pattern: /x-mc-.*/i, name: 'Mailchimp' },
            { pattern: /x-campaign-.*/i, name: 'Campaign Monitor' },
            { pattern: /x-klaviyo-.*/i, name: 'Klaviyo' },
            { pattern: /x-omnisend-.*/i, name: 'Omnisend' },
            { pattern: /x-sendinblue-.*/i, name: 'Sendinblue' },
            { pattern: /x-mailjet-.*/i, name: 'Mailjet' },
            { pattern: /x-sparkpost-.*/i, name: 'SparkPost' },
        ];
        for (const header of espHeaders) {
            const match = headers.match(header.pattern);
            if (match) {
                return { type: 'ESP', name: header.name };
            }
        }
        const serverPatterns = [
            { pattern: /postfix/i, name: 'Postfix' },
            { pattern: /sendmail/i, name: 'Sendmail' },
            { pattern: /exim/i, name: 'Exim' },
            { pattern: /qmail/i, name: 'Qmail' },
            { pattern: /courier/i, name: 'Courier' },
            { pattern: /zimbra/i, name: 'Zimbra' },
            { pattern: /exchange/i, name: 'Microsoft Exchange' },
            { pattern: /lotus/i, name: 'Lotus Notes' },
            { pattern: /groupwise/i, name: 'Novell GroupWise' },
        ];
        for (const server of serverPatterns) {
            if (server.pattern.test(headers)) {
                return { type: 'Mail Server', name: server.name };
            }
        }
        return { type: 'Unknown', name: 'Unknown' };
    }
    async checkOpenRelay(domain) {
        try {
            const mxRecords = await dnsResolve(domain, 'MX');
            if (!mxRecords || mxRecords.length === 0) {
                return false;
            }
            const hasValidMX = mxRecords.some(record => record.exchange && record.exchange.length > 0);
            if (!hasValidMX) {
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.warn(`Error checking open relay for ${domain}:`, error);
            return false;
        }
    }
    async checkTLSConfiguration(domain) {
        try {
            return new Promise((resolve) => {
                const socket = tls.connect(25, domain, {
                    rejectUnauthorized: false,
                }, () => {
                    const tlsInfo = {
                        hasValidTLS: socket.authorized,
                        version: socket.getProtocol() || undefined,
                        issuer: socket.getPeerCertificate().issuer?.CN,
                        subject: socket.getPeerCertificate().subject?.CN,
                        validFrom: socket.getPeerCertificate().valid_from ?
                            new Date(socket.getPeerCertificate().valid_from) : undefined,
                        validTo: socket.getPeerCertificate().valid_to ?
                            new Date(socket.getPeerCertificate().valid_to) : undefined,
                    };
                    socket.end();
                    resolve(tlsInfo);
                });
                socket.on('error', (error) => {
                    this.logger.warn(`TLS check failed for ${domain}:`, error);
                    resolve({
                        hasValidTLS: false,
                    });
                });
                socket.setTimeout(5000, () => {
                    socket.destroy();
                    resolve({
                        hasValidTLS: false,
                    });
                });
            });
        }
        catch (error) {
            this.logger.warn(`Error checking TLS for ${domain}:`, error);
            return { hasValidTLS: false };
        }
    }
    async getEmailAnalytics(accountId, filters) {
        const query = { accountId };
        if (filters?.dateFrom || filters?.dateTo) {
            query.date = {};
            if (filters.dateFrom)
                query.date.$gte = filters.dateFrom;
            if (filters.dateTo)
                query.date.$lte = filters.dateTo;
        }
        if (filters?.espType) {
            query.espType = filters.espType;
        }
        if (filters?.domain) {
            query.sendingDomain = filters.domain;
        }
        const emails = await this.emailModel.find(query).lean();
        const uniqueSenders = new Set(emails.map(e => e.fromEmail)).size;
        const uniqueDomains = new Set(emails.map(e => e.sendingDomain)).size;
        const espBreakdown = {};
        const domainBreakdown = {};
        let totalTimeDelta = 0;
        let openRelayCount = 0;
        let tlsValidCount = 0;
        for (const email of emails) {
            const esp = email.espName || 'Unknown';
            espBreakdown[esp] = (espBreakdown[esp] || 0) + 1;
            const domain = email.sendingDomain || 'Unknown';
            domainBreakdown[domain] = (domainBreakdown[domain] || 0) + 1;
            totalTimeDelta += email.timeDelta || 0;
            if (email.isOpenRelay)
                openRelayCount++;
            if (email.hasValidTLS)
                tlsValidCount++;
        }
        const averageTimeDelta = emails.length > 0 ? totalTimeDelta / emails.length : 0;
        const timeSeries = {};
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        for (const email of emails) {
            if (email.date >= thirtyDaysAgo) {
                const dateKey = email.date.toISOString().split('T')[0];
                timeSeries[dateKey] = (timeSeries[dateKey] || 0) + 1;
            }
        }
        const timeSeriesArray = Object.entries(timeSeries)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
        return {
            totalEmails: emails.length,
            uniqueSenders,
            uniqueDomains,
            espBreakdown,
            domainBreakdown,
            averageTimeDelta,
            openRelayCount,
            tlsValidCount,
            timeSeries: timeSeriesArray,
        };
    }
};
exports.EmailProcessingService = EmailProcessingService;
exports.EmailProcessingService = EmailProcessingService = EmailProcessingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(email_schema_1.Email.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], EmailProcessingService);
//# sourceMappingURL=email-processing.service.js.map