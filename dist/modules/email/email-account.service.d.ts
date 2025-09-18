import { Model, Types } from 'mongoose';
import { EmailAccount, EmailAccountDocument } from '../../database/schemas/email-account.schema';
import { CreateEmailAccountDto, UpdateEmailAccountDto } from './dto/email-account.dto';
import { ImapConnectionService } from '../imap/imap-connection.service';
export declare class EmailAccountService {
    private emailAccountModel;
    private readonly imapConnectionService;
    constructor(emailAccountModel: Model<EmailAccountDocument>, imapConnectionService: ImapConnectionService);
    getEmailAccounts(userId: Types.ObjectId): Promise<EmailAccount[]>;
    createEmailAccount(userId: Types.ObjectId, createEmailAccountDto: CreateEmailAccountDto): Promise<EmailAccount>;
    updateEmailAccount(id: Types.ObjectId, userId: Types.ObjectId, updateEmailAccountDto: UpdateEmailAccountDto): Promise<EmailAccount>;
    deleteEmailAccount(id: Types.ObjectId, userId: Types.ObjectId): Promise<void>;
    testConnection(id: Types.ObjectId, userId: Types.ObjectId): Promise<{
        success: boolean;
        message: string;
    }>;
    private validateAuthMethod;
}
