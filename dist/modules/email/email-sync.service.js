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
var EmailSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailSyncService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const imap_connection_service_1 = require("../imap/imap-connection.service");
const email_account_schema_1 = require("../../database/schemas/email-account.schema");
const email_schema_1 = require("../../database/schemas/email.schema");
const sync_status_schema_1 = require("../../database/schemas/sync-status.schema");
const email_processing_service_1 = require("./email-processing.service");
let EmailSyncService = EmailSyncService_1 = class EmailSyncService {
    emailAccountModel;
    emailModel;
    syncStatusModel;
    imapConnectionService;
    emailProcessingService;
    logger = new common_1.Logger(EmailSyncService_1.name);
    syncStatuses = new Map();
    constructor(emailAccountModel, emailModel, syncStatusModel, imapConnectionService, emailProcessingService) {
        this.emailAccountModel = emailAccountModel;
        this.emailModel = emailModel;
        this.syncStatusModel = syncStatusModel;
        this.imapConnectionService = imapConnectionService;
        this.emailProcessingService = emailProcessingService;
    }
    async startSync(accountId) {
        const syncTimeout = setTimeout(() => {
            this.logger.warn(`Sync timeout reached for account: ${accountId}`);
            this.syncStatuses.set(accountId, sync_status_schema_1.SyncStatusType.ERROR);
            this.updateSyncStatus(accountId, {
                status: sync_status_schema_1.SyncStatusType.ERROR,
                errorMessage: 'Sync timeout - process took too long',
                lastActivity: new Date(),
            });
        }, 30 * 60 * 1000);
        try {
            this.logger.log(`Starting sync for account: ${accountId}`);
            const account = await this.emailAccountModel.findById(accountId);
            if (!account) {
                throw new Error(`Email account not found: ${accountId}`);
            }
            const connection = await this.imapConnectionService.createConnection(account);
            const folders = await this.getFolderHierarchy(connection.connection);
            let totalMessages = 0;
            for (const folder of folders) {
                try {
                    const folderInfo = await this.getFolderInfo(connection.connection, folder.name);
                    totalMessages += folderInfo.totalMessages;
                }
                catch (error) {
                    this.logger.warn(`Could not get message count for folder ${folder.name}:`, error);
                }
            }
            await this.updateSyncStatus(accountId, {
                status: sync_status_schema_1.SyncStatusType.RUNNING,
                totalEmails: totalMessages,
                processedEmails: 0,
                startedAt: new Date(),
                lastActivity: new Date(),
                errorMessage: null,
                completedAt: null,
            });
            this.syncStatuses.set(accountId, sync_status_schema_1.SyncStatusType.RUNNING);
            this.logger.log(`Sync status updated: ${totalMessages} total emails, 0 processed`);
            let processedMessages = 0;
            for (const folder of folders) {
                if (this.syncStatuses.get(accountId) === sync_status_schema_1.SyncStatusType.PAUSED) {
                    this.logger.log(`Sync paused for account: ${accountId}`);
                    break;
                }
                try {
                    this.logger.log(`Starting sync for folder: ${folder.name}`);
                    const folderProcessed = await this.syncFolder(account, connection.connection, folder);
                    processedMessages += folderProcessed;
                    this.logger.log(`Folder ${folder.name} completed: ${folderProcessed} emails processed. Total: ${processedMessages}/${totalMessages}`);
                    await this.updateSyncStatus(accountId, {
                        status: sync_status_schema_1.SyncStatusType.RUNNING,
                        totalEmails: totalMessages,
                        processedEmails: processedMessages,
                        currentFolder: folder.name,
                        lastActivity: new Date(),
                    });
                    this.logger.log(`Progress updated: ${processedMessages}/${totalMessages} emails (${Math.round((processedMessages / totalMessages) * 100)}%)`);
                }
                catch (folderError) {
                    this.logger.error(`Error syncing folder ${folder.name}:`, folderError);
                    await this.updateSyncStatus(accountId, {
                        status: sync_status_schema_1.SyncStatusType.RUNNING,
                        totalEmails: totalMessages,
                        processedEmails: processedMessages,
                        currentFolder: folder.name,
                        errorMessage: `Error in folder ${folder.name}: ${folderError.message}`,
                        lastActivity: new Date(),
                    });
                }
            }
            await this.emailAccountModel.findByIdAndUpdate(accountId, {
                lastSync: new Date(),
                isConnected: true,
                totalEmails: totalMessages,
                syncedEmails: processedMessages,
            });
            clearTimeout(syncTimeout);
            await this.updateSyncStatus(accountId, {
                status: sync_status_schema_1.SyncStatusType.COMPLETED,
                totalEmails: totalMessages,
                processedEmails: processedMessages,
                completedAt: new Date(),
                lastActivity: new Date(),
                errorMessage: null,
            });
            this.syncStatuses.set(accountId, sync_status_schema_1.SyncStatusType.COMPLETED);
            this.logger.log(`Sync completed for account: ${accountId} - Processed ${processedMessages}/${totalMessages} emails`);
        }
        catch (error) {
            clearTimeout(syncTimeout);
            this.logger.error(`Sync error for account ${accountId}:`, error);
            await this.updateSyncStatus(accountId, {
                status: sync_status_schema_1.SyncStatusType.ERROR,
                errorMessage: error.message,
                lastActivity: new Date(),
            });
            this.syncStatuses.set(accountId, sync_status_schema_1.SyncStatusType.ERROR);
            throw error;
        }
    }
    async pauseSync(accountId) {
        try {
            this.logger.log(`Pausing sync for account: ${accountId}`);
            const account = await this.emailAccountModel.findById(accountId);
            if (!account) {
                throw new Error(`Email account not found: ${accountId}`);
            }
            this.syncStatuses.set(accountId, sync_status_schema_1.SyncStatusType.PAUSED);
            await this.updateSyncStatus(accountId, {
                status: sync_status_schema_1.SyncStatusType.PAUSED,
                lastActivity: new Date(),
            });
            this.logger.log(`Sync paused successfully for account: ${accountId}`);
        }
        catch (error) {
            this.logger.error(`Failed to pause sync for account ${accountId}:`, error);
            throw error;
        }
    }
    async resumeSync(accountId) {
        this.logger.log(`Resuming sync for account: ${accountId}`);
        const currentStatus = this.syncStatuses.get(accountId);
        if (currentStatus === sync_status_schema_1.SyncStatusType.RUNNING) {
            this.logger.log(`Sync is already running for account: ${accountId}`);
            return;
        }
        await this.updateSyncStatus(accountId, {
            status: sync_status_schema_1.SyncStatusType.RUNNING,
            lastActivity: new Date(),
        });
        this.syncStatuses.set(accountId, sync_status_schema_1.SyncStatusType.RUNNING);
        await this.startSync(accountId);
    }
    async getSyncStatus(accountId) {
        const status = await this.syncStatusModel.findOne({ accountId }).sort({ updatedAt: -1 });
        this.logger.log(`Getting sync status for account ${accountId}:`, status);
        return status;
    }
    async testImapConnection(accountId) {
        try {
            this.logger.log(`Testing IMAP connection for account: ${accountId}`);
            const account = await this.emailAccountModel.findById(accountId);
            if (!account) {
                throw new Error(`Email account not found: ${accountId}`);
            }
            const connection = await this.imapConnectionService.createConnection(account);
            const folders = await this.getFolderHierarchy(connection.connection);
            return {
                success: true,
                foldersCount: folders.length,
                folders: folders.map(f => ({ name: f.name, totalMessages: f.totalMessages })),
                connectionInfo: {
                    host: account.imapHost,
                    port: account.imapPort,
                    useSSL: account.useSSL
                }
            };
        }
        catch (error) {
            this.logger.error(`IMAP connection test failed for account ${accountId}:`, error);
            throw error;
        }
    }
    async testEmailCount(accountId) {
        try {
            this.logger.log(`Testing email count for account: ${accountId}`);
            const account = await this.emailAccountModel.findById(accountId);
            if (!account) {
                throw new Error(`Email account not found: ${accountId}`);
            }
            const totalEmails = await this.emailModel.countDocuments({ accountId: account._id });
            const recentEmails = await this.emailModel.find({ accountId: account._id })
                .sort({ date: -1 })
                .limit(5)
                .select('subject fromEmail date')
                .lean();
            return {
                success: true,
                totalEmailsInDatabase: totalEmails,
                recentEmails: recentEmails,
                accountInfo: {
                    name: account.name,
                    email: account.email,
                    imapHost: account.imapHost
                }
            };
        }
        catch (error) {
            this.logger.error(`Email count test failed for account ${accountId}:`, error);
            throw error;
        }
    }
    async testSaveEmail(accountId) {
        try {
            this.logger.log(`Testing email save for account: ${accountId}`);
            const account = await this.emailAccountModel.findById(accountId);
            if (!account) {
                throw new Error(`Email account not found: ${accountId}`);
            }
            const testEmail = {
                accountId: account._id,
                messageId: `test-${Date.now()}`,
                subject: 'Test Email',
                from: 'test@example.com',
                fromName: 'Test Sender',
                fromEmail: 'test@example.com',
                to: ['recipient@example.com'],
                date: new Date(),
                receivedDate: new Date(),
                timeDelta: 0,
                content: 'This is a test email content',
                searchableContent: 'test email content',
                folder: 'INBOX',
                uid: Math.floor(Math.random() * 1000000),
                size: 1000,
                flags: []
            };
            await this.saveEmails([testEmail]);
            const totalEmails = await this.emailModel.countDocuments({ accountId: account._id });
            return {
                success: true,
                message: 'Test email saved successfully',
                totalEmailsInDatabase: totalEmails,
                testEmail: testEmail
            };
        }
        catch (error) {
            this.logger.error(`Test email save failed for account ${accountId}:`, error);
            throw error;
        }
    }
    async getFolderHierarchy(connection) {
        return new Promise((resolve, reject) => {
            connection.getBoxes((err, boxes) => {
                if (err) {
                    reject(err);
                    return;
                }
                const folders = [];
                this.processBoxes(boxes, folders);
                this.getFolderMessageCounts(connection, folders)
                    .then(() => resolve(folders))
                    .catch(reject);
            });
        });
    }
    async getFolderMessageCounts(connection, folders) {
        for (const folder of folders) {
            try {
                const folderInfo = await this.getFolderInfo(connection, folder.name);
                folder.totalMessages = folderInfo.totalMessages;
            }
            catch (error) {
                this.logger.warn(`Could not get message count for folder ${folder.name}:`, error);
                folder.totalMessages = 0;
            }
        }
    }
    async tryAlternativeFetch(connection, folder, account) {
        return new Promise((resolve, reject) => {
            this.logger.log(`Trying alternative fetch approach for folder ${folder}`);
            connection.openBox(folder, true, (err, box) => {
                if (err) {
                    this.logger.warn(`Failed to open folder ${folder} for alternative fetch:`, err);
                    resolve(0);
                    return;
                }
                const totalMessages = box.messages.total;
                if (totalMessages === 0) {
                    this.logger.log(`No messages in folder ${folder}`);
                    resolve(0);
                    return;
                }
                const batchSize = 50;
                const emails = [];
                let processedCount = 0;
                let currentBatch = 1;
                const processBatch = async () => {
                    const start = (currentBatch - 1) * batchSize + 1;
                    const end = Math.min(currentBatch * batchSize, totalMessages);
                    if (start > totalMessages) {
                        if (emails.length > 0) {
                            await this.saveEmails(emails);
                            this.logger.log(`Saved final batch of ${emails.length} emails from folder ${folder}`);
                        }
                        this.logger.log(`Alternative fetch completed for folder ${folder}: ${processedCount} emails processed`);
                        resolve(processedCount);
                        return;
                    }
                    const range = `${start}:${end}`;
                    this.logger.log(`Processing batch ${currentBatch} for folder ${folder}: ${range}`);
                    const fetch = connection.fetch(range, {
                        bodies: '',
                        struct: true,
                        markSeen: false,
                    });
                    let batchProcessed = 0;
                    fetch.on('message', (msg, seqno) => {
                        this.processEmailMessage(account, folder, msg, seqno)
                            .then(async (emailData) => {
                            if (emailData) {
                                emails.push(emailData);
                                this.logger.log(`Processed email ${seqno} in folder ${folder}: ${emailData.subject || 'No subject'}`);
                                try {
                                    this.logger.log(`Saving email ${seqno} immediately (alternative fetch)`);
                                    await this.saveEmails([emailData]);
                                    this.logger.log(`Successfully saved email ${seqno} (alternative fetch)`);
                                }
                                catch (saveError) {
                                    this.logger.error(`Failed to save email ${seqno} (alternative fetch):`, saveError);
                                }
                                if (emails.length >= 5) {
                                    const emailsToSave = emails.splice(0, 5);
                                    this.logger.log(`Saving batch of ${emailsToSave.length} emails from folder ${folder}`);
                                    await this.saveEmails(emailsToSave);
                                    this.logger.log(`Successfully saved batch of ${emailsToSave.length} emails from folder ${folder}`);
                                }
                            }
                            batchProcessed++;
                            processedCount++;
                            try {
                                await this.updateSyncStatus(account._id.toString(), { $inc: { processedEmails: 1 }, $set: { lastActivity: new Date() } }, { upsert: false, new: true });
                            }
                            catch (updateError) {
                                this.logger.warn(`Failed to update processedEmails count:`, updateError);
                            }
                            if (batchProcessed === (end - start + 1)) {
                                currentBatch++;
                                setTimeout(processBatch, 100);
                            }
                        })
                            .catch(async (err) => {
                            this.logger.error(`Error processing email ${seqno}:`, err);
                            batchProcessed++;
                            processedCount++;
                            try {
                                await this.updateSyncStatus(account._id.toString(), { $inc: { processedEmails: 1 }, $set: { lastActivity: new Date() } }, { upsert: false, new: true });
                            }
                            catch (updateError) {
                                this.logger.warn(`Failed to update processedEmails count:`, updateError);
                            }
                            if (batchProcessed === (end - start + 1)) {
                                currentBatch++;
                                setTimeout(processBatch, 100);
                            }
                        });
                    });
                    fetch.once('error', (err) => {
                        this.logger.warn(`Batch fetch error for folder ${folder}:`, err);
                        currentBatch++;
                        setTimeout(processBatch, 100);
                    });
                };
                processBatch();
            });
        });
    }
    processBoxes(boxes, folders, parentPath = '') {
        for (const [name, box] of Object.entries(boxes)) {
            const folderPath = parentPath ? `${parentPath}${box.delimiter}${name}` : name;
            const folderInfo = {
                name: folderPath,
                delimiter: box.delimiter,
                attributes: box.attribs || [],
                totalMessages: 0,
            };
            if (box.children) {
                folderInfo.children = [];
                this.processBoxes(box.children, folderInfo.children, folderPath);
            }
            folders.push(folderInfo);
        }
    }
    async syncFolder(account, connection, folder) {
        return new Promise((resolve, reject) => {
            connection.openBox(folder.name, true, (err, box) => {
                if (err) {
                    this.logger.warn(`Failed to open folder ${folder.name}:`, err);
                    resolve(0);
                    return;
                }
                this.logger.log(`Syncing folder: ${folder.name} (${box.messages.total} messages)`);
                this.getExistingEmails(account._id.toString(), folder.name)
                    .then(existingEmails => {
                    const existingUids = new Set(existingEmails.map(email => email.uid));
                    const searchCriteria = this.buildSearchCriteria(existingUids);
                    this.fetchEmails(account, connection, folder.name, searchCriteria)
                        .then(processedCount => resolve(processedCount))
                        .catch(reject);
                })
                    .catch(reject);
            });
        });
    }
    async getExistingEmails(accountId, folder) {
        return this.emailModel.find({
            accountId,
            folder,
        }).select('uid').lean();
    }
    buildSearchCriteria(existingUids) {
        return ['ALL'];
    }
    async fetchEmails(account, connection, folder, searchCriteria) {
        return new Promise((resolve, reject) => {
            connection.openBox(folder, true, (err, box) => {
                if (err) {
                    this.logger.warn(`Failed to open folder ${folder}:`, err);
                    resolve(0);
                    return;
                }
                const searchCriteriaSeq = searchCriteria.length > 0 && searchCriteria[0] === 'ALL'
                    ? ['ALL']
                    : searchCriteria;
                connection.search(searchCriteriaSeq, (err, results) => {
                    if (err) {
                        this.logger.warn(`Search failed for folder ${folder}:`, err);
                        this.tryAlternativeFetch(connection, folder, account)
                            .then(count => resolve(count))
                            .catch(() => resolve(0));
                        return;
                    }
                    this.logger.log(`Search results for folder ${folder}: ${results ? results.length : 0} emails found`);
                    if (!results || results.length === 0) {
                        this.logger.log(`No emails to process in folder ${folder}`);
                        resolve(0);
                        return;
                    }
                    const fetch = connection.fetch(results, {
                        bodies: '',
                        struct: true,
                        markSeen: false,
                    });
                    const emails = [];
                    let processedCount = 0;
                    fetch.on('message', (msg, seqno) => {
                        this.processEmailMessage(account, folder, msg, seqno)
                            .then(async (emailData) => {
                            if (emailData) {
                                emails.push(emailData);
                                this.logger.log(`Processed email ${seqno} in folder ${folder}: ${emailData.subject || 'No subject'}`);
                                try {
                                    this.logger.log(`Saving email ${seqno} immediately`);
                                    await this.saveEmails([emailData]);
                                    this.logger.log(`Successfully saved email ${seqno}`);
                                }
                                catch (saveError) {
                                    this.logger.error(`Failed to save email ${seqno}:`, saveError);
                                }
                                if (emails.length >= 5) {
                                    const emailsToSave = emails.splice(0, 5);
                                    this.logger.log(`Saving batch of ${emailsToSave.length} emails from folder ${folder}`);
                                    await this.saveEmails(emailsToSave);
                                    this.logger.log(`Successfully saved batch of ${emailsToSave.length} emails from folder ${folder}`);
                                }
                            }
                            processedCount++;
                            try {
                                await this.updateSyncStatus(account._id.toString(), { $inc: { processedEmails: 1 }, $set: { lastActivity: new Date() } }, { upsert: false, new: true });
                            }
                            catch (updateError) {
                                this.logger.warn(`Failed to update processedEmails count:`, updateError);
                            }
                            if (processedCount === results.length) {
                                this.logger.log(`Completed processing ${emails.length} emails in folder ${folder}`);
                                if (emails.length > 0) {
                                    await this.saveEmails(emails);
                                    this.logger.log(`Saved final batch of ${emails.length} emails from folder ${folder}`);
                                }
                                resolve(processedCount);
                            }
                        })
                            .catch(async (err) => {
                            this.logger.error(`Error processing email ${seqno}:`, err);
                            processedCount++;
                            try {
                                await this.updateSyncStatus(account._id.toString(), { $inc: { processedEmails: 1 }, $set: { lastActivity: new Date() } }, { upsert: false, new: true });
                            }
                            catch (updateError) {
                                this.logger.warn(`Failed to update processedEmails count:`, updateError);
                            }
                            if (processedCount === results.length) {
                                this.logger.log(`Completed processing ${emails.length} emails in folder ${folder} (with errors)`);
                                if (emails.length > 0) {
                                    await this.saveEmails(emails);
                                    this.logger.log(`Saved final batch of ${emails.length} emails from folder ${folder} (with errors)`);
                                }
                                resolve(processedCount);
                            }
                        });
                    });
                    fetch.once('error', (err) => {
                        this.logger.warn(`Fetch error for folder ${folder}:`, err);
                        resolve(emails.length);
                    });
                    fetch.once('end', () => {
                        if (processedCount === 0) {
                            resolve(0);
                        }
                    });
                });
            });
        });
    }
    async processEmailMessage(account, folder, msg, seqno) {
        return new Promise((resolve) => {
            let emailData = {
                accountId: account._id,
                folder,
                uid: 0,
                size: 0,
                flags: [],
                to: [],
                cc: [],
                bcc: [],
            };
            let body = '';
            msg.on('body', (stream, info) => {
                stream.on('data', (chunk) => {
                    body += chunk.toString();
                });
            });
            msg.once('attributes', (attrs) => {
                emailData.uid = attrs.uid;
                emailData.size = attrs.size;
                emailData.flags = this.parseFlags(attrs.flags);
                emailData.date = attrs.date;
            });
            msg.once('end', () => {
                try {
                    const parsedEmail = this.parseEmailContent(body);
                    if (parsedEmail) {
                        Object.assign(emailData, parsedEmail);
                        if (!emailData.messageId) {
                            emailData.messageId = `generated-${Date.now()}-${seqno}`;
                        }
                        if (!emailData.subject) {
                            emailData.subject = '(No Subject)';
                        }
                        if (!emailData.from) {
                            emailData.from = emailData.fromEmail || 'unknown@example.com';
                        }
                        if (!emailData.fromName) {
                            emailData.fromName = emailData.fromEmail || 'Unknown Sender';
                        }
                        if (!emailData.fromEmail) {
                            emailData.fromEmail = 'unknown@example.com';
                        }
                        if (!emailData.to || emailData.to.length === 0) {
                            emailData.to = ['unknown@example.com'];
                        }
                        if (!emailData.date) {
                            emailData.date = new Date();
                        }
                        if (!emailData.receivedDate) {
                            emailData.receivedDate = new Date();
                        }
                        if (emailData.timeDelta === undefined) {
                            emailData.timeDelta = 0;
                        }
                        if (!emailData.content) {
                            emailData.content = '';
                        }
                        if (!emailData.searchableContent) {
                            emailData.searchableContent = `${emailData.subject} ${emailData.from} ${emailData.content}`.toLowerCase();
                        }
                        this.logger.log(`Processed email ${seqno}: ${emailData.subject} from ${emailData.fromEmail}`);
                        this.emailProcessingService.processEmail(emailData)
                            .then(processedEmail => {
                            Object.assign(emailData, processedEmail);
                            this.logger.log(`Email ${seqno} analytics processed successfully`);
                            resolve(emailData);
                        })
                            .catch(err => {
                            this.logger.error('Error processing email analytics:', err);
                            resolve(emailData);
                        });
                    }
                    else {
                        this.logger.warn(`Failed to parse email ${seqno}`);
                        resolve(null);
                    }
                }
                catch (error) {
                    this.logger.error(`Error parsing email ${seqno}:`, error);
                    resolve(null);
                }
            });
        });
    }
    parseFlags(flags) {
        const emailFlags = [];
        for (const flag of flags) {
            switch (flag) {
                case '\\Seen':
                    emailFlags.push(email_schema_1.EmailFlag.SEEN);
                    break;
                case '\\Answered':
                    emailFlags.push(email_schema_1.EmailFlag.ANSWERED);
                    break;
                case '\\Flagged':
                    emailFlags.push(email_schema_1.EmailFlag.FLAGGED);
                    break;
                case '\\Deleted':
                    emailFlags.push(email_schema_1.EmailFlag.DELETED);
                    break;
                case '\\Draft':
                    emailFlags.push(email_schema_1.EmailFlag.DRAFT);
                    break;
            }
        }
        return emailFlags;
    }
    parseEmailContent(body) {
        try {
            const lines = body.split('\n');
            const headers = {};
            let bodyStart = false;
            let content = '';
            let htmlContent = '';
            let textContent = '';
            for (const line of lines) {
                if (!bodyStart) {
                    if (line.trim() === '') {
                        bodyStart = true;
                        continue;
                    }
                    const colonIndex = line.indexOf(':');
                    if (colonIndex > 0) {
                        const key = line.substring(0, colonIndex).trim().toLowerCase();
                        const value = line.substring(colonIndex + 1).trim();
                        headers[key] = value;
                    }
                }
                else {
                    content += line + '\n';
                }
            }
            const subject = headers['subject'] || '';
            const from = headers['from'] || '';
            const to = headers['to'] || '';
            const cc = headers['cc'] || '';
            const bcc = headers['bcc'] || '';
            const date = headers['date'] ? new Date(headers['date']) : new Date();
            const messageId = headers['message-id'] || '';
            const fromMatch = from.match(/^(.*?)\s*<(.+?)>$/);
            const fromName = fromMatch ? fromMatch[1].trim().replace(/^["']|["']$/g, '') : '';
            const fromEmail = fromMatch ? fromMatch[2].trim() : from;
            const toEmails = to.split(',').map(email => email.trim());
            const ccEmails = cc ? cc.split(',').map(email => email.trim()) : [];
            const bccEmails = bcc ? bcc.split(',').map(email => email.trim()) : [];
            const contentType = headers['content-type'] || '';
            if (contentType.includes('text/html')) {
                htmlContent = content;
            }
            else if (contentType.includes('text/plain')) {
                textContent = content;
            }
            else {
                textContent = content;
            }
            const receivedDate = new Date();
            const timeDelta = receivedDate.getTime() - date.getTime();
            return {
                messageId,
                subject,
                from,
                fromName,
                fromEmail,
                to: toEmails,
                cc: ccEmails.length > 0 ? ccEmails : undefined,
                bcc: bccEmails.length > 0 ? bccEmails : undefined,
                date,
                receivedDate,
                timeDelta,
                content,
                htmlContent: htmlContent || undefined,
                textContent: textContent || undefined,
                searchableContent: `${subject} ${from} ${content}`.toLowerCase(),
            };
        }
        catch (error) {
            this.logger.error('Error parsing email content:', error);
            return null;
        }
    }
    async saveEmails(emails) {
        if (emails.length === 0) {
            this.logger.warn('No emails to save');
            return;
        }
        try {
            this.logger.log(`Starting to save ${emails.length} emails`);
            const validEmails = emails.filter(email => {
                const isValid = email.accountId &&
                    email.uid !== undefined &&
                    email.messageId &&
                    email.subject !== undefined &&
                    email.fromEmail;
                if (!isValid) {
                    this.logger.warn(`Invalid email filtered out:`, {
                        hasAccountId: !!email.accountId,
                        hasUid: email.uid !== undefined,
                        hasMessageId: !!email.messageId,
                        hasSubject: email.subject !== undefined,
                        hasFromEmail: !!email.fromEmail
                    });
                }
                return isValid;
            });
            if (validEmails.length === 0) {
                this.logger.warn('No valid emails to save after filtering');
                return;
            }
            this.logger.log(`Attempting to save ${validEmails.length} valid emails out of ${emails.length} total`);
            const bulkOps = validEmails.map(email => ({
                updateOne: {
                    filter: {
                        accountId: email.accountId,
                        uid: email.uid
                    },
                    update: { $set: email },
                    upsert: true
                }
            }));
            this.logger.log(`Executing bulkWrite with ${bulkOps.length} operations`);
            const result = await this.emailModel.bulkWrite(bulkOps, { ordered: false });
            this.logger.log(`Successfully saved ${result.upsertedCount + result.modifiedCount} emails to database (${result.upsertedCount} new, ${result.modifiedCount} updated)`);
            if (result.hasWriteErrors && result.hasWriteErrors()) {
                this.logger.warn(`Write errors encountered during bulk write operation`);
            }
        }
        catch (error) {
            this.logger.error('Error saving emails:', error);
            this.logger.error('Error details:', error.message);
            this.logger.error('Error stack:', error.stack);
            this.logger.error('Continuing sync despite save error...');
        }
    }
    async getFolderInfo(connection, folderName) {
        return new Promise((resolve, reject) => {
            connection.openBox(folderName, true, (err, box) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({ totalMessages: box.messages.total });
            });
        });
    }
    async updateSyncStatus(accountId, updateData, options) {
        const defaultOptions = { upsert: true, new: true };
        const finalOptions = { ...defaultOptions, ...options };
        this.logger.log(`Updating sync status for account ${accountId}:`, updateData);
        const result = await this.syncStatusModel.findOneAndUpdate({ accountId }, updateData, finalOptions);
        this.logger.log(`Sync status updated result:`, result);
    }
};
exports.EmailSyncService = EmailSyncService;
exports.EmailSyncService = EmailSyncService = EmailSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(email_account_schema_1.EmailAccount.name)),
    __param(1, (0, mongoose_1.InjectModel)(email_schema_1.Email.name)),
    __param(2, (0, mongoose_1.InjectModel)(sync_status_schema_1.SyncStatus.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        imap_connection_service_1.ImapConnectionService,
        email_processing_service_1.EmailProcessingService])
], EmailSyncService);
//# sourceMappingURL=email-sync.service.js.map