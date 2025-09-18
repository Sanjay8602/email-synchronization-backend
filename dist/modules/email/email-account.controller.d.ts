import { EmailAccountService } from './email-account.service';
import { CreateEmailAccountDto, UpdateEmailAccountDto } from './dto/email-account.dto';
export declare class EmailAccountController {
    private readonly emailAccountService;
    constructor(emailAccountService: EmailAccountService);
    getEmailAccounts(req: any): Promise<import("../../database/schemas/email-account.schema").EmailAccount[]>;
    createEmailAccount(req: any, createEmailAccountDto: CreateEmailAccountDto): Promise<import("../../database/schemas/email-account.schema").EmailAccount>;
    updateEmailAccount(id: string, req: any, updateEmailAccountDto: UpdateEmailAccountDto): Promise<import("../../database/schemas/email-account.schema").EmailAccount>;
    deleteEmailAccount(id: string, req: any): Promise<void>;
    testConnection(id: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
