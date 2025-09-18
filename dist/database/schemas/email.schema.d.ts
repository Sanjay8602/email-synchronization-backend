import { Document, Types } from 'mongoose';
export type EmailDocument = Email & Document;
export declare enum EmailFlag {
    SEEN = "\\Seen",
    ANSWERED = "\\Answered",
    FLAGGED = "\\Flagged",
    DELETED = "\\Deleted",
    DRAFT = "\\Draft"
}
export declare class Email {
    accountId: Types.ObjectId;
    messageId: string;
    subject: string;
    from: string;
    fromName: string;
    fromEmail: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    date: Date;
    receivedDate: Date;
    timeDelta: number;
    content: string;
    htmlContent?: string;
    textContent?: string;
    flags: EmailFlag[];
    folder: string;
    uid: number;
    size: number;
    sendingDomain?: string;
    espType?: string;
    espName?: string;
    isOpenRelay: boolean;
    hasValidTLS: boolean;
    tlsVersion?: string;
    certificateIssuer?: string;
    certificateSubject?: string;
    certificateValidFrom?: Date;
    certificateValidTo?: Date;
    searchableContent: string;
}
export declare const EmailSchema: import("mongoose").Schema<Email, import("mongoose").Model<Email, any, any, any, Document<unknown, any, Email, any, {}> & Email & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Email, Document<unknown, {}, import("mongoose").FlatRecord<Email>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Email> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
