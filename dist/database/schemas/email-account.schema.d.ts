import { Document, Types } from 'mongoose';
export type EmailAccountDocument = EmailAccount & Document;
export declare enum AuthMethod {
    PLAIN = "PLAIN",
    LOGIN = "LOGIN",
    OAUTH2 = "OAUTH2"
}
export declare class EmailAccount {
    userId: Types.ObjectId;
    name: string;
    email: string;
    imapHost: string;
    imapPort: number;
    useSSL: boolean;
    authMethod: AuthMethod;
    username: string;
    password?: string;
    oauth2Token?: string;
    isActive: boolean;
    isConnected: boolean;
    lastSync?: Date;
    totalEmails: number;
    syncedEmails: number;
    lastError?: string;
}
export declare const EmailAccountSchema: import("mongoose").Schema<EmailAccount, import("mongoose").Model<EmailAccount, any, any, any, Document<unknown, any, EmailAccount, any, {}> & EmailAccount & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, EmailAccount, Document<unknown, {}, import("mongoose").FlatRecord<EmailAccount>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<EmailAccount> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
