import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmailAccount, EmailAccountDocument, AuthMethod } from '../../database/schemas/email-account.schema';
import { CreateEmailAccountDto, UpdateEmailAccountDto } from './dto/email-account.dto';
import { ImapConnectionService } from '../imap/imap-connection.service';

@Injectable()
export class EmailAccountService {
  constructor(
    @InjectModel(EmailAccount.name) private emailAccountModel: Model<EmailAccountDocument>,
    private readonly imapConnectionService: ImapConnectionService,
  ) {}

  async getEmailAccounts(userId: Types.ObjectId): Promise<EmailAccount[]> {
    return this.emailAccountModel.find({ userId }).sort({ createdAt: -1 });
  }

  async createEmailAccount(
    userId: Types.ObjectId,
    createEmailAccountDto: CreateEmailAccountDto,
  ): Promise<EmailAccount> {
    // Validate authentication method requirements
    this.validateAuthMethod(createEmailAccountDto);

    const emailAccount = new this.emailAccountModel({
      ...createEmailAccountDto,
      userId,
    });

    return emailAccount.save();
  }

  async updateEmailAccount(
    id: Types.ObjectId,
    userId: Types.ObjectId,
    updateEmailAccountDto: UpdateEmailAccountDto,
  ): Promise<EmailAccount> {
    const emailAccount = await this.emailAccountModel.findOne({ _id: id, userId });
    
    if (!emailAccount) {
      throw new NotFoundException('Email account not found');
    }

    // Validate authentication method requirements if changing auth method
    if (updateEmailAccountDto.authMethod) {
      this.validateAuthMethod({ ...emailAccount.toObject(), ...updateEmailAccountDto });
    }

    Object.assign(emailAccount, updateEmailAccountDto);
    return emailAccount.save();
  }

  async deleteEmailAccount(id: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
    const emailAccount = await this.emailAccountModel.findOne({ _id: id, userId });
    
    if (!emailAccount) {
      throw new NotFoundException('Email account not found');
    }

    // Close IMAP connection if exists
    await this.imapConnectionService.closeConnection(id.toString());

    await this.emailAccountModel.findByIdAndDelete(id);
  }

  async testConnection(id: Types.ObjectId, userId: Types.ObjectId): Promise<{ success: boolean; message: string }> {
    const emailAccount = await this.emailAccountModel.findOne({ _id: id, userId });
    
    if (!emailAccount) {
      throw new NotFoundException('Email account not found');
    }

    try {
      const connection = await this.imapConnectionService.createConnection(emailAccount);
      
      // Update connection status
      await this.emailAccountModel.findByIdAndUpdate(id, {
        isConnected: true,
        lastError: null,
      });

      return {
        success: true,
        message: 'Connection successful',
      };
    } catch (error) {
      // Update error status
      await this.emailAccountModel.findByIdAndUpdate(id, {
        isConnected: false,
        lastError: error.message,
      });

      return {
        success: false,
        message: error.message,
      };
    }
  }

  private validateAuthMethod(account: Partial<EmailAccount>): void {
    switch (account.authMethod) {
      case AuthMethod.PLAIN:
      case AuthMethod.LOGIN:
        if (!account.password) {
          throw new BadRequestException('Password is required for PLAIN/LOGIN authentication');
        }
        break;
      case AuthMethod.OAUTH2:
        if (!account.oauth2Token) {
          throw new BadRequestException('OAuth2 token is required for OAuth2 authentication');
        }
        break;
      default:
        throw new BadRequestException('Invalid authentication method');
    }
  }
}
