import { 
  Controller, 
  Post, 
  Get, 
  Param, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmailSyncService } from './email-sync.service';
import { EmailAccount, EmailAccountDocument } from '../../database/schemas/email-account.schema';
import { Types } from 'mongoose';

@Controller('sync')
@UseGuards(AuthGuard('jwt'))
export class EmailSyncController {
  constructor(
    private readonly emailSyncService: EmailSyncService,
    @InjectModel(EmailAccount.name) private emailAccountModel: Model<EmailAccountDocument>,
  ) {}

  @Post('start/:accountId')
  @HttpCode(HttpStatus.OK)
  async startSync(
    @Param('accountId') accountId: string,
    @Request() req,
  ) {
    try {
      // Verify account belongs to user
      await this.verifyAccountOwnership(accountId, req.user._id);
      
      // Start sync in background to avoid timeout
      this.emailSyncService.startSync(accountId).catch(error => {
        console.error(`Background sync error for account ${accountId}:`, error);
      });
      
      return { message: 'Sync started successfully' };
    } catch (error) {
      throw new Error(`Failed to start sync: ${error.message}`);
    }
  }

  @Post('pause/:accountId')
  @HttpCode(HttpStatus.OK)
  async pauseSync(
    @Param('accountId') accountId: string,
    @Request() req,
  ) {
    try {
      await this.verifyAccountOwnership(accountId, req.user._id);
      
      await this.emailSyncService.pauseSync(accountId);
      return { message: 'Sync paused successfully' };
    } catch (error) {
      throw new Error(`Failed to pause sync: ${error.message}`);
    }
  }

  @Post('resume/:accountId')
  @HttpCode(HttpStatus.OK)
  async resumeSync(
    @Param('accountId') accountId: string,
    @Request() req,
  ) {
    try {
      await this.verifyAccountOwnership(accountId, req.user._id);
      
      await this.emailSyncService.resumeSync(accountId);
      return { message: 'Sync resumed successfully' };
    } catch (error) {
      throw new Error(`Failed to resume sync: ${error.message}`);
    }
  }

  @Get('status/:accountId')
  async getSyncStatus(
    @Param('accountId') accountId: string,
    @Request() req,
  ) {
    await this.verifyAccountOwnership(accountId, req.user._id);
    
    return this.emailSyncService.getSyncStatus(accountId);
  }

  @Get('test/:accountId')
  async testSync(
    @Param('accountId') accountId: string,
    @Request() req,
  ) {
    await this.verifyAccountOwnership(accountId, req.user._id);
    
    try {
      // Test IMAP connection as well
      const connectionResult = await this.emailSyncService.testImapConnection(accountId);
      return { 
        message: 'Sync service is working', 
        accountId,
        connectionTest: connectionResult,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        message: 'Sync service is working but IMAP connection failed', 
        accountId,
        connectionError: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('quick-test/:accountId')
  async quickTest(
    @Param('accountId') accountId: string,
    @Request() req,
  ) {
    await this.verifyAccountOwnership(accountId, req.user._id);
    
    return { 
      message: 'Quick test successful - sync service is ready', 
      accountId,
      timestamp: new Date().toISOString(),
      status: 'ready'
    };
  }

  @Get('test-connection/:accountId')
  async testConnection(
    @Param('accountId') accountId: string,
    @Request() req,
  ) {
    await this.verifyAccountOwnership(accountId, req.user._id);
    
    try {
      const result = await this.emailSyncService.testImapConnection(accountId);
      return { 
        message: 'IMAP connection test successful', 
        accountId,
        result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        message: 'IMAP connection test failed', 
        accountId,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('test-emails/:accountId')
  async testEmails(
    @Param('accountId') accountId: string,
    @Request() req,
  ) {
    await this.verifyAccountOwnership(accountId, req.user._id);
    
    try {
      const result = await this.emailSyncService.testEmailCount(accountId);
      return { 
        message: 'Email count test successful', 
        accountId,
        result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        message: 'Email count test failed', 
        accountId,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('test-save/:accountId')
  async testSaveEmail(
    @Param('accountId') accountId: string,
    @Request() req,
  ) {
    await this.verifyAccountOwnership(accountId, req.user._id);
    
    try {
      const result = await this.emailSyncService.testSaveEmail(accountId);
      return { 
        message: 'Test email save successful', 
        accountId,
        result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        message: 'Test email save failed', 
        accountId,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async verifyAccountOwnership(accountId: string, userId: Types.ObjectId): Promise<void> {
    // Verify that the account exists and belongs to the user
    const account = await this.emailAccountModel.findOne({ 
      _id: new Types.ObjectId(accountId), 
      userId: userId 
    });
    
    if (!account) {
      throw new Error('Email account not found or access denied');
    }
  }
}
