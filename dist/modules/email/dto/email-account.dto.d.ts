import { AuthMethod } from '../../../database/schemas/email-account.schema';
export declare class CreateEmailAccountDto {
    name: string;
    email: string;
    imapHost: string;
    imapPort: number;
    useSSL?: boolean;
    authMethod: AuthMethod;
    username: string;
    password?: string;
    oauth2Token?: string;
}
export declare class UpdateEmailAccountDto {
    name?: string;
    imapHost?: string;
    imapPort?: number;
    useSSL?: boolean;
    authMethod?: AuthMethod;
    username?: string;
    password?: string;
    oauth2Token?: string;
    isActive?: boolean;
}
