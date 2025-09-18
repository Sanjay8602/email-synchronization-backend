import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ImapConnectionService } from '../imap/imap-connection.service';
import { EmailAccount, EmailAccountDocument } from '../../database/schemas/email-account.schema';
import { Email, EmailDocument, EmailFlag } from '../../database/schemas/email.schema';
import { SyncStatus, SyncStatusDocument, SyncStatusType } from '../../database/schemas/sync-status.schema';
import { EmailProcessingService } from './email-processing.service';
import * as Imap from 'imap';

export interface FolderInfo {
  name: string;
  delimiter: string;
  attributes: string[];
  totalMessages?: number;
  children?: FolderInfo[];
}

@Injectable()
export class EmailSyncService {
  private readonly logger = new Logger(EmailSyncService.name);
  private readonly syncStatuses = new Map<string, SyncStatusType>();

  constructor(
    @InjectModel(EmailAccount.name) private emailAccountModel: Model<EmailAccountDocument>,
    @InjectModel(Email.name) private emailModel: Model<EmailDocument>,
    @InjectModel(SyncStatus.name) private syncStatusModel: Model<SyncStatusDocument>,
    private readonly imapConnectionService: ImapConnectionService,
    private readonly emailProcessingService: EmailProcessingService,
  ) {}

  async startSync(accountId: string): Promise<void> {
    // Set a timeout for the entire sync process (30 minutes)
    const syncTimeout = setTimeout(() => {
      this.logger.warn(`Sync timeout reached for account: ${accountId}`);
      this.syncStatuses.set(accountId, SyncStatusType.ERROR);
      this.updateSyncStatus(accountId, {
        status: SyncStatusType.ERROR,
        errorMessage: 'Sync timeout - process took too long',
        lastActivity: new Date(),
      });
    }, 30 * 60 * 1000); // 30 minutes

    try {
      this.logger.log(`Starting sync for account: ${accountId}`);
      
      const account = await this.emailAccountModel.findById(accountId);
      if (!account) {
        throw new Error(`Email account not found: ${accountId}`);
      }

      // Get IMAP connection
      const connection = await this.imapConnectionService.createConnection(account);
      
      // Get folder hierarchy and count total messages
      const folders = await this.getFolderHierarchy(connection.connection as any);
      let totalMessages = 0;
      
      // Count total messages across all folders
      for (const folder of folders) {
        try {
          const folderInfo = await this.getFolderInfo(connection.connection as any, folder.name);
          totalMessages += folderInfo.totalMessages;
        } catch (error) {
          this.logger.warn(`Could not get message count for folder ${folder.name}:`, error);
        }
      }

      // Update sync status with total count and clear any previous errors
      await this.updateSyncStatus(accountId, {
        status: SyncStatusType.RUNNING,
        totalEmails: totalMessages,
        processedEmails: 0,
        startedAt: new Date(),
        lastActivity: new Date(),
        errorMessage: null, // Clear any previous error messages
        completedAt: null,
      });
      this.syncStatuses.set(accountId, SyncStatusType.RUNNING);
      
      this.logger.log(`Sync status updated: ${totalMessages} total emails, 0 processed`);

      let processedMessages = 0;
      
      // Sync each folder
      for (const folder of folders) {
        if (this.syncStatuses.get(accountId) === SyncStatusType.PAUSED) {
          this.logger.log(`Sync paused for account: ${accountId}`);
          break;
        }

        try {
          this.logger.log(`Starting sync for folder: ${folder.name}`);
          const folderProcessed = await this.syncFolder(account, connection.connection as any, folder);
          processedMessages += folderProcessed;
          
          this.logger.log(`Folder ${folder.name} completed: ${folderProcessed} emails processed. Total: ${processedMessages}/${totalMessages}`);
          
          // Update progress after each folder
          await this.updateSyncStatus(accountId, {
            status: SyncStatusType.RUNNING,
            totalEmails: totalMessages,
            processedEmails: processedMessages,
            currentFolder: folder.name,
            lastActivity: new Date(),
          });
          this.logger.log(`Progress updated: ${processedMessages}/${totalMessages} emails (${Math.round((processedMessages/totalMessages)*100)}%)`);
        } catch (folderError) {
          this.logger.error(`Error syncing folder ${folder.name}:`, folderError);
          // Continue with next folder instead of stopping the entire sync
          await this.updateSyncStatus(accountId, {
            status: SyncStatusType.RUNNING,
            totalEmails: totalMessages,
            processedEmails: processedMessages,
            currentFolder: folder.name,
            errorMessage: `Error in folder ${folder.name}: ${folderError.message}`,
            lastActivity: new Date(),
          });
        }
      }

      // Update account last sync time
      await this.emailAccountModel.findByIdAndUpdate(accountId, {
        lastSync: new Date(),
        isConnected: true,
        totalEmails: totalMessages,
        syncedEmails: processedMessages,
      });

      // Clear the timeout since sync completed successfully
      clearTimeout(syncTimeout);
      
      await this.updateSyncStatus(accountId, {
        status: SyncStatusType.COMPLETED,
        totalEmails: totalMessages,
        processedEmails: processedMessages,
        completedAt: new Date(),
        lastActivity: new Date(),
        errorMessage: null,
      });
      this.syncStatuses.set(accountId, SyncStatusType.COMPLETED);
      
      this.logger.log(`Sync completed for account: ${accountId} - Processed ${processedMessages}/${totalMessages} emails`);
    } catch (error) {
      // Clear the timeout on error
      clearTimeout(syncTimeout);
      
      this.logger.error(`Sync error for account ${accountId}:`, error);
      await this.updateSyncStatus(accountId, {
        status: SyncStatusType.ERROR,
        errorMessage: error.message,
        lastActivity: new Date(),
      });
      this.syncStatuses.set(accountId, SyncStatusType.ERROR);
      throw error;
    }
  }

  async pauseSync(accountId: string): Promise<void> {
    try {
      this.logger.log(`Pausing sync for account: ${accountId}`);
      
      // Check if account exists
      const account = await this.emailAccountModel.findById(accountId);
      if (!account) {
        throw new Error(`Email account not found: ${accountId}`);
      }
      
      this.syncStatuses.set(accountId, SyncStatusType.PAUSED);
      await this.updateSyncStatus(accountId, {
        status: SyncStatusType.PAUSED,
        lastActivity: new Date(),
      });
      
      this.logger.log(`Sync paused successfully for account: ${accountId}`);
    } catch (error) {
      this.logger.error(`Failed to pause sync for account ${accountId}:`, error);
      throw error;
    }
  }

  async resumeSync(accountId: string): Promise<void> {
    this.logger.log(`Resuming sync for account: ${accountId}`);
    
    // Check if sync is already running
    const currentStatus = this.syncStatuses.get(accountId);
    if (currentStatus === SyncStatusType.RUNNING) {
      this.logger.log(`Sync is already running for account: ${accountId}`);
      return;
    }
    
    // Update status to running before starting
    await this.updateSyncStatus(accountId, {
      status: SyncStatusType.RUNNING,
      lastActivity: new Date(),
    });
    this.syncStatuses.set(accountId, SyncStatusType.RUNNING);
    
    // Start the sync process
    await this.startSync(accountId);
  }

  async getSyncStatus(accountId: string): Promise<SyncStatus | null> {
    const status = await this.syncStatusModel.findOne({ accountId }).sort({ updatedAt: -1 });
    this.logger.log(`Getting sync status for account ${accountId}:`, status);
    return status;
  }

  async testImapConnection(accountId: string): Promise<any> {
    try {
      this.logger.log(`Testing IMAP connection for account: ${accountId}`);
      
      const account = await this.emailAccountModel.findById(accountId);
      if (!account) {
        throw new Error(`Email account not found: ${accountId}`);
      }

      // Get IMAP connection
      const connection = await this.imapConnectionService.createConnection(account);
      
      // Test by getting folder hierarchy
      const folders = await this.getFolderHierarchy(connection.connection as any);
      
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
    } catch (error) {
      this.logger.error(`IMAP connection test failed for account ${accountId}:`, error);
      throw error;
    }
  }

  async testEmailCount(accountId: string): Promise<any> {
    try {
      this.logger.log(`Testing email count for account: ${accountId}`);
      
      const account = await this.emailAccountModel.findById(accountId);
      if (!account) {
        throw new Error(`Email account not found: ${accountId}`);
      }

      // Count emails in database for this account
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
    } catch (error) {
      this.logger.error(`Email count test failed for account ${accountId}:`, error);
      throw error;
    }
  }

  async testSaveEmail(accountId: string): Promise<any> {
    try {
      this.logger.log(`Testing email save for account: ${accountId}`);
      
      const account = await this.emailAccountModel.findById(accountId);
      if (!account) {
        throw new Error(`Email account not found: ${accountId}`);
      }

      // Create a test email
      const testEmail: Partial<Email> = {
        accountId: account._id as Types.ObjectId,
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

      // Try to save the test email
      await this.saveEmails([testEmail]);
      
      // Count emails after saving
      const totalEmails = await this.emailModel.countDocuments({ accountId: account._id });
      
      return {
        success: true,
        message: 'Test email saved successfully',
        totalEmailsInDatabase: totalEmails,
        testEmail: testEmail
      };
    } catch (error) {
      this.logger.error(`Test email save failed for account ${accountId}:`, error);
      throw error;
    }
  }

  private async getFolderHierarchy(connection: Imap): Promise<FolderInfo[]> {
    return new Promise((resolve, reject) => {
      connection.getBoxes((err, boxes) => {
        if (err) {
          reject(err);
          return;
        }

        const folders: FolderInfo[] = [];
        this.processBoxes(boxes, folders);
        
        // Get actual message counts for each folder
        this.getFolderMessageCounts(connection, folders)
          .then(() => resolve(folders))
          .catch(reject);
      });
    });
  }

  private async getFolderMessageCounts(connection: Imap, folders: FolderInfo[]): Promise<void> {
    for (const folder of folders) {
      try {
        const folderInfo = await this.getFolderInfo(connection, folder.name);
        folder.totalMessages = folderInfo.totalMessages;
      } catch (error) {
        this.logger.warn(`Could not get message count for folder ${folder.name}:`, error);
        folder.totalMessages = 0;
      }
    }
  }

  private async tryAlternativeFetch(connection: Imap, folder: string, account: EmailAccountDocument): Promise<number> {
    return new Promise((resolve, reject) => {
      this.logger.log(`Trying alternative fetch approach for folder ${folder}`);
      
      // Get message count by opening the folder first
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

        // Fetch emails in batches to avoid overwhelming the server
        const batchSize = 50;
        const emails: Partial<Email>[] = [];
        let processedCount = 0;
        let currentBatch = 1;

        const processBatch = async () => {
          const start = (currentBatch - 1) * batchSize + 1;
          const end = Math.min(currentBatch * batchSize, totalMessages);
          
          if (start > totalMessages) {
            // All batches processed - save any remaining emails
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
              .then(async emailData => {
                if (emailData) {
                  emails.push(emailData);
                  this.logger.log(`Processed email ${seqno} in folder ${folder}: ${emailData.subject || 'No subject'}`);
                  
                  // Save each email immediately to ensure it gets saved
                  try {
                    this.logger.log(`Saving email ${seqno} immediately (alternative fetch)`);
                    await this.saveEmails([emailData]);
                    this.logger.log(`Successfully saved email ${seqno} (alternative fetch)`);
                  } catch (saveError) {
                    this.logger.error(`Failed to save email ${seqno} (alternative fetch):`, saveError);
                  }
                  
                  // Also keep batch saving for efficiency
                  if (emails.length >= 5) {
                    const emailsToSave = emails.splice(0, 5);
                    this.logger.log(`Saving batch of ${emailsToSave.length} emails from folder ${folder}`);
                    await this.saveEmails(emailsToSave);
                    this.logger.log(`Successfully saved batch of ${emailsToSave.length} emails from folder ${folder}`);
                  }
                }
                batchProcessed++;
                processedCount++;

                // Update processedEmails count in database for each email
                try {
                  await this.updateSyncStatus(
                    (account as any)._id.toString(),
                    { $inc: { processedEmails: 1 }, $set: { lastActivity: new Date() } },
                    { upsert: false, new: true }
                  );
                } catch (updateError) {
                  this.logger.warn(`Failed to update processedEmails count:`, updateError);
                }

                if (batchProcessed === (end - start + 1)) {
                  // Batch completed, process next batch
                  currentBatch++;
                  setTimeout(processBatch, 100); // Small delay between batches
                }
              })
              .catch(async err => {
                this.logger.error(`Error processing email ${seqno}:`, err);
                batchProcessed++;
                processedCount++;

                // Still increment processedEmails even if there was an error
                try {
                  await this.updateSyncStatus(
                    (account as any)._id.toString(),
                    { $inc: { processedEmails: 1 }, $set: { lastActivity: new Date() } },
                    { upsert: false, new: true }
                  );
                } catch (updateError) {
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
            // Continue with next batch
            currentBatch++;
            setTimeout(processBatch, 100);
          });
        };

        processBatch();
      });
    });
  }

  private processBoxes(boxes: any, folders: FolderInfo[], parentPath = ''): void {
    for (const [name, box] of Object.entries(boxes)) {
      const folderPath = parentPath ? `${parentPath}${(box as any).delimiter}${name}` : name;
      
      const folderInfo: FolderInfo = {
        name: folderPath,
        delimiter: (box as any).delimiter,
        attributes: (box as any).attribs || [],
        totalMessages: 0, // Will be updated by getFolderMessageCounts
      };

      if ((box as any).children) {
        folderInfo.children = [];
        this.processBoxes((box as any).children, folderInfo.children, folderPath);
      }

      folders.push(folderInfo);
    }
  }

  private async syncFolder(
    account: EmailAccountDocument,
    connection: Imap,
    folder: FolderInfo,
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      connection.openBox(folder.name, true, (err, box) => {
        if (err) {
          this.logger.warn(`Failed to open folder ${folder.name}:`, err);
          resolve(0);
          return;
        }

        this.logger.log(`Syncing folder: ${folder.name} (${box.messages.total} messages)`);

        // Get existing emails in this folder
        this.getExistingEmails((account as any)._id.toString(), folder.name)
          .then(existingEmails => {
            const existingUids = new Set(existingEmails.map(email => email.uid));
            
            // Fetch new emails
            const searchCriteria = this.buildSearchCriteria(existingUids);
            this.fetchEmails(account, connection, folder.name, searchCriteria)
              .then(processedCount => resolve(processedCount))
              .catch(reject);
          })
          .catch(reject);
      });
    });
  }

  private async getExistingEmails(accountId: string, folder: string): Promise<Email[]> {
    return this.emailModel.find({
      accountId,
      folder,
    }).select('uid').lean();
  }

  private buildSearchCriteria(existingUids: Set<number>): any[] {
    // Use sequence numbers instead of UIDs to avoid "UID FETCH not allowed now" error
    // This is more reliable across different IMAP servers
    return ['ALL'];
  }

  private async fetchEmails(
    account: EmailAccountDocument,
    connection: Imap,
    folder: string,
    searchCriteria: any[],
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      // First, ensure we're in the correct folder
      connection.openBox(folder, true, (err, box) => {
        if (err) {
          this.logger.warn(`Failed to open folder ${folder}:`, err);
          resolve(0);
          return;
        }

        // Use sequence numbers instead of UIDs for more reliable fetching
        const searchCriteriaSeq = searchCriteria.length > 0 && searchCriteria[0] === 'ALL' 
          ? ['ALL'] 
          : searchCriteria;

        connection.search(searchCriteriaSeq, (err, results) => {
          if (err) {
            this.logger.warn(`Search failed for folder ${folder}:`, err);
            // Try alternative approach with sequence numbers
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

          // Use sequence numbers for fetching instead of UIDs
          const fetch = connection.fetch(results, {
            bodies: '',
            struct: true,
            markSeen: false,
          });

          const emails: Partial<Email>[] = [];
          let processedCount = 0;

          fetch.on('message', (msg, seqno) => {
            this.processEmailMessage(account, folder, msg, seqno)
              .then(async emailData => {
                if (emailData) {
                  emails.push(emailData);
                  this.logger.log(`Processed email ${seqno} in folder ${folder}: ${emailData.subject || 'No subject'}`);
                  
                  // Save each email immediately to ensure it gets saved
                  try {
                    this.logger.log(`Saving email ${seqno} immediately`);
                    await this.saveEmails([emailData]);
                    this.logger.log(`Successfully saved email ${seqno}`);
                  } catch (saveError) {
                    this.logger.error(`Failed to save email ${seqno}:`, saveError);
                  }
                  
                  // Also keep batch saving for efficiency
                  if (emails.length >= 5) {
                    const emailsToSave = emails.splice(0, 5);
                    this.logger.log(`Saving batch of ${emailsToSave.length} emails from folder ${folder}`);
                    await this.saveEmails(emailsToSave);
                    this.logger.log(`Successfully saved batch of ${emailsToSave.length} emails from folder ${folder}`);
                  }
                }
                processedCount++;

                // Update processedEmails count in database for each email
                try {
                  await this.updateSyncStatus(
                    (account as any)._id.toString(),
                    { $inc: { processedEmails: 1 }, $set: { lastActivity: new Date() } },
                    { upsert: false, new: true }
                  );
                } catch (updateError) {
                  this.logger.warn(`Failed to update processedEmails count:`, updateError);
                }

                if (processedCount === results.length) {
                  this.logger.log(`Completed processing ${emails.length} emails in folder ${folder}`);
                  // Save any remaining emails
                  if (emails.length > 0) {
                    await this.saveEmails(emails);
                    this.logger.log(`Saved final batch of ${emails.length} emails from folder ${folder}`);
                  }
                  resolve(processedCount);
                }
              })
              .catch(async err => {
                this.logger.error(`Error processing email ${seqno}:`, err);
                processedCount++;

                // Still increment processedEmails even if there was an error with this specific email
                try {
                  await this.updateSyncStatus(
                    (account as any)._id.toString(),
                    { $inc: { processedEmails: 1 }, $set: { lastActivity: new Date() } },
                    { upsert: false, new: true }
                  );
                } catch (updateError) {
                  this.logger.warn(`Failed to update processedEmails count:`, updateError);
                }

                if (processedCount === results.length) {
                  this.logger.log(`Completed processing ${emails.length} emails in folder ${folder} (with errors)`);
                  // Save any remaining emails
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

  private async processEmailMessage(
    account: EmailAccountDocument,
    folder: string,
    msg: Imap.ImapMessage,
    seqno: number,
  ): Promise<Partial<Email> | null> {
    return new Promise((resolve) => {
      let emailData: Partial<Email> = {
        accountId: (account as any)._id,
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
          // Parse email headers and content
          const parsedEmail = this.parseEmailContent(body);
          
          if (parsedEmail) {
            Object.assign(emailData, parsedEmail);
            
            // Ensure required fields are present
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
            
            // Process email for analytics
            this.emailProcessingService.processEmail(emailData as Email)
              .then(processedEmail => {
                Object.assign(emailData, processedEmail);
                this.logger.log(`Email ${seqno} analytics processed successfully`);
                resolve(emailData);
              })
              .catch(err => {
                this.logger.error('Error processing email analytics:', err);
                resolve(emailData);
              });
          } else {
            this.logger.warn(`Failed to parse email ${seqno}`);
            resolve(null);
          }
        } catch (error) {
          this.logger.error(`Error parsing email ${seqno}:`, error);
          resolve(null);
        }
      });
    });
  }

  private parseFlags(flags: string[]): EmailFlag[] {
    const emailFlags: EmailFlag[] = [];
    
    for (const flag of flags) {
      switch (flag) {
        case '\\Seen':
          emailFlags.push(EmailFlag.SEEN);
          break;
        case '\\Answered':
          emailFlags.push(EmailFlag.ANSWERED);
          break;
        case '\\Flagged':
          emailFlags.push(EmailFlag.FLAGGED);
          break;
        case '\\Deleted':
          emailFlags.push(EmailFlag.DELETED);
          break;
        case '\\Draft':
          emailFlags.push(EmailFlag.DRAFT);
          break;
      }
    }

    return emailFlags;
  }

  private parseEmailContent(body: string): Partial<Email> | null {
    try {
      // Simple email parsing - in production, use a proper email parser like mailparser
      const lines = body.split('\n');
      const headers: { [key: string]: string } = {};
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
        } else {
          content += line + '\n';
        }
      }

      // Extract basic email information
      const subject = headers['subject'] || '';
      const from = headers['from'] || '';
      const to = headers['to'] || '';
      const cc = headers['cc'] || '';
      const bcc = headers['bcc'] || '';
      const date = headers['date'] ? new Date(headers['date']) : new Date();
      const messageId = headers['message-id'] || '';

      // Parse from field
      const fromMatch = from.match(/^(.*?)\s*<(.+?)>$/);
      const fromName = fromMatch ? fromMatch[1].trim().replace(/^["']|["']$/g, '') : '';
      const fromEmail = fromMatch ? fromMatch[2].trim() : from;

      // Parse to field
      const toEmails = to.split(',').map(email => email.trim());
      const ccEmails = cc ? cc.split(',').map(email => email.trim()) : [];
      const bccEmails = bcc ? bcc.split(',').map(email => email.trim()) : [];

      // Determine content type
      const contentType = headers['content-type'] || '';
      if (contentType.includes('text/html')) {
        htmlContent = content;
      } else if (contentType.includes('text/plain')) {
        textContent = content;
      } else {
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
    } catch (error) {
      this.logger.error('Error parsing email content:', error);
      return null;
    }
  }

  private async saveEmails(emails: Partial<Email>[]): Promise<void> {
    if (emails.length === 0) {
      this.logger.warn('No emails to save');
      return;
    }

    try {
      this.logger.log(`Starting to save ${emails.length} emails`);
      
      // Filter out invalid emails
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

      // Use bulkWrite with upsert to handle duplicates
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
    } catch (error) {
      this.logger.error('Error saving emails:', error);
      this.logger.error('Error details:', error.message);
      this.logger.error('Error stack:', error.stack);
      // Don't throw error, just log it to prevent sync from stopping
      this.logger.error('Continuing sync despite save error...');
    }
  }

  private async getFolderInfo(connection: Imap, folderName: string): Promise<{ totalMessages: number }> {
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

  private async updateSyncStatus(
    accountId: string,
    updateData: any,
    options?: { upsert?: boolean; new?: boolean }
  ): Promise<void> {
    const defaultOptions = { upsert: true, new: true };
    const finalOptions = { ...defaultOptions, ...options };

    this.logger.log(`Updating sync status for account ${accountId}:`, updateData);
    
    const result = await this.syncStatusModel.findOneAndUpdate(
      { accountId },
      updateData,
      finalOptions,
    );
    
    this.logger.log(`Sync status updated result:`, result);
  }
}
