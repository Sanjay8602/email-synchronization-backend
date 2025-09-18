import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Email } from '../../database/schemas/email.schema';
import * as dns from 'dns';
import * as tls from 'tls';
import { promisify } from 'util';

const dnsResolve = promisify(dns.resolve);

@Injectable()
export class EmailProcessingService {
  private readonly logger = new Logger(EmailProcessingService.name);
  
  constructor(
    @InjectModel(Email.name) private emailModel: Model<Email>,
  ) {}
  private readonly espPatterns = new Map<RegExp, string>([
    // Gmail
    [/gmail\.com|googlemail\.com/, 'Gmail'],
    [/google\.com/, 'Google Workspace'],
    
    // Microsoft
    [/outlook\.com|hotmail\.com|live\.com/, 'Outlook'],
    [/microsoft\.com/, 'Microsoft 365'],
    
    // Yahoo
    [/yahoo\.com|yahoo\.co\.uk|yahoo\.co\.jp/, 'Yahoo Mail'],
    
    // Amazon SES
    [/amazonaws\.com/, 'Amazon SES'],
    
    // SendGrid
    [/sendgrid\.net/, 'SendGrid'],
    
    // Mailgun
    [/mailgun\.org|mailgun\.net/, 'Mailgun'],
    
    // Mandrill
    [/mandrillapp\.com/, 'Mandrill'],
    
    // Postmark
    [/postmarkapp\.com/, 'Postmark'],
    
    // Mailchimp
    [/mailchimp\.com/, 'Mailchimp'],
    
    // Constant Contact
    [/constantcontact\.com/, 'Constant Contact'],
    
    // AWeber
    [/aweber\.com/, 'AWeber'],
    
    // ConvertKit
    [/convertkit\.com/, 'ConvertKit'],
    
    // Drip
    [/drip\.com/, 'Drip'],
    
    // ActiveCampaign
    [/activecampaign\.com/, 'ActiveCampaign'],
    
    // HubSpot
    [/hubspot\.com/, 'HubSpot'],
    
    // Salesforce
    [/salesforce\.com/, 'Salesforce Marketing Cloud'],
    
    // Adobe
    [/adobe\.com/, 'Adobe Campaign'],
    
    // IBM
    [/ibm\.com/, 'IBM Watson Campaign Automation'],
    
    // Oracle
    [/oracle\.com/, 'Oracle Responsys'],
    
    // Campaign Monitor
    [/campaignmonitor\.com/, 'Campaign Monitor'],
    
    // GetResponse
    [/getresponse\.com/, 'GetResponse'],
    
    // MailerLite
    [/mailerlite\.com/, 'MailerLite'],
    
    // Benchmark
    [/benchmarkemail\.com/, 'Benchmark Email'],
    
    // VerticalResponse
    [/verticalresponse\.com/, 'VerticalResponse'],
    
    // iContact
    [/icontact\.com/, 'iContact'],
    
    // Emma
    [/myemma\.com/, 'Emma'],
    
    // Pardot
    [/pardot\.com/, 'Pardot'],
    
    // Marketo
    [/marketo\.com/, 'Marketo'],
    
    // Eloqua
    [/eloqua\.com/, 'Oracle Eloqua'],
    
    // ExactTarget
    [/exacttarget\.com/, 'ExactTarget'],
    
    // Silverpop
    [/silverpop\.com/, 'Silverpop'],
    
    // Responsys
    [/responsys\.com/, 'Responsys'],
    
    // CheetahMail
    [/cheetahmail\.com/, 'CheetahMail'],
    
    // Lyris
    [/lyris\.com/, 'Lyris'],
    
    // BlueHornet
    [/bluehornet\.com/, 'BlueHornet'],
    
    // Listrak
    [/listrak\.com/, 'Listrak'],
    
    // Bronto
    [/bronto\.com/, 'Bronto'],
    
    // Klaviyo
    [/klaviyo\.com/, 'Klaviyo'],
    
    // Omnisend
    [/omnisend\.com/, 'Omnisend'],
    
    // Sendinblue
    [/sendinblue\.com/, 'Sendinblue'],
    
    // Mailjet
    [/mailjet\.com/, 'Mailjet'],
    
    // SparkPost
    [/sparkpost\.com/, 'SparkPost'],
    
    // Postfix
    [/postfix/, 'Postfix'],
    
    // Sendmail
    [/sendmail/, 'Sendmail'],
    
    // Exim
    [/exim/, 'Exim'],
    
    // Qmail
    [/qmail/, 'Qmail'],
    
    // Courier
    [/courier/, 'Courier'],
    
    // Zimbra
    [/zimbra/, 'Zimbra'],
    
    // Exchange
    [/exchange/, 'Microsoft Exchange'],
    
    // Lotus Notes
    [/lotus/, 'Lotus Notes'],
    
    // GroupWise
    [/groupwise/, 'Novell GroupWise'],
  ]);

  async processEmail(email: Email): Promise<Partial<Email>> {
    try {
      const processedData: Partial<Email> = {};

      // Extract sending domain
      const sendingDomain = this.extractSendingDomain(email.fromEmail);
      processedData.sendingDomain = sendingDomain;

      // Detect ESP type
      const espInfo = await this.detectESP(email, sendingDomain);
      processedData.espType = espInfo.type;
      processedData.espName = espInfo.name;

      // Check for open relay
      const isOpenRelay = await this.checkOpenRelay(sendingDomain);
      processedData.isOpenRelay = isOpenRelay;

      // Check TLS configuration
      const tlsInfo = await this.checkTLSConfiguration(sendingDomain);
      processedData.hasValidTLS = tlsInfo.hasValidTLS;
      processedData.tlsVersion = tlsInfo.version;
      processedData.certificateIssuer = tlsInfo.issuer;
      processedData.certificateSubject = tlsInfo.subject;
      processedData.certificateValidFrom = tlsInfo.validFrom;
      processedData.certificateValidTo = tlsInfo.validTo;

      return processedData;
    } catch (error) {
      this.logger.error('Error processing email:', error);
      return {};
    }
  }

  private extractSendingDomain(email: string): string {
    const domainMatch = email.match(/@([^>]+)/);
    return domainMatch ? domainMatch[1].toLowerCase() : '';
  }

  private async detectESP(email: Email, domain: string): Promise<{ type: string; name: string }> {
    // Check from email domain
    for (const [pattern, espName] of this.espPatterns) {
      if (pattern.test(domain)) {
        return { type: 'ESP', name: espName };
      }
    }

    // Check message headers for ESP indicators
    const headers = email.content.toLowerCase();
    
    // Check for common ESP headers
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

    // Check for server software patterns
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

    // Default classification
    return { type: 'Unknown', name: 'Unknown' };
  }

  private async checkOpenRelay(domain: string): Promise<boolean> {
    try {
      // Check for common open relay indicators
      const mxRecords = await dnsResolve(domain, 'MX');
      
      if (!mxRecords || mxRecords.length === 0) {
        return false;
      }

      // Check if the domain has proper MX records
      const hasValidMX = mxRecords.some(record => 
        record.exchange && record.exchange.length > 0
      );

      if (!hasValidMX) {
        return true; // No valid MX records might indicate open relay
      }

      // Additional checks could be implemented here
      // For now, we'll assume proper MX records mean it's not an open relay
      return false;
    } catch (error) {
      this.logger.warn(`Error checking open relay for ${domain}:`, error);
      return false;
    }
  }

  private async checkTLSConfiguration(domain: string): Promise<{
    hasValidTLS: boolean;
    version?: string;
    issuer?: string;
    subject?: string;
    validFrom?: Date;
    validTo?: Date;
  }> {
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
    } catch (error) {
      this.logger.warn(`Error checking TLS for ${domain}:`, error);
      return { hasValidTLS: false };
    }
  }

  async getEmailAnalytics(accountId: string, filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    espType?: string;
    domain?: string;
  }): Promise<{
    totalEmails: number;
    uniqueSenders: number;
    uniqueDomains: number;
    espBreakdown: { [key: string]: number };
    domainBreakdown: { [key: string]: number };
    averageTimeDelta: number;
    openRelayCount: number;
    tlsValidCount: number;
    timeSeries: { date: string; count: number }[];
  }> {
    const query: any = { accountId };

    if (filters?.dateFrom || filters?.dateTo) {
      query.date = {};
      if (filters.dateFrom) query.date.$gte = filters.dateFrom;
      if (filters.dateTo) query.date.$lte = filters.dateTo;
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

    const espBreakdown: { [key: string]: number } = {};
    const domainBreakdown: { [key: string]: number } = {};

    let totalTimeDelta = 0;
    let openRelayCount = 0;
    let tlsValidCount = 0;

    for (const email of emails) {
      // ESP breakdown
      const esp = email.espName || 'Unknown';
      espBreakdown[esp] = (espBreakdown[esp] || 0) + 1;

      // Domain breakdown
      const domain = email.sendingDomain || 'Unknown';
      domainBreakdown[domain] = (domainBreakdown[domain] || 0) + 1;

      // Time delta
      totalTimeDelta += email.timeDelta || 0;

      // Security metrics
      if (email.isOpenRelay) openRelayCount++;
      if (email.hasValidTLS) tlsValidCount++;
    }

    const averageTimeDelta = emails.length > 0 ? totalTimeDelta / emails.length : 0;

    // Time series data (last 30 days)
    const timeSeries: { [key: string]: number } = {};
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
}
