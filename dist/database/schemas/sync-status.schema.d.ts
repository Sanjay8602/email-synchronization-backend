import { Document, Types } from 'mongoose';
export type SyncStatusDocument = SyncStatus & Document;
export declare enum SyncStatusType {
    RUNNING = "RUNNING",
    PAUSED = "PAUSED",
    COMPLETED = "COMPLETED",
    ERROR = "ERROR"
}
export declare class SyncStatus {
    accountId: Types.ObjectId;
    status: SyncStatusType;
    totalEmails: number;
    processedEmails: number;
    newEmails: number;
    updatedEmails: number;
    currentFolder?: string;
    lastProcessedUid?: number;
    errorMessage?: string;
    startedAt?: Date;
    completedAt?: Date;
    lastActivity?: Date;
}
export declare const SyncStatusSchema: import("mongoose").Schema<SyncStatus, import("mongoose").Model<SyncStatus, any, any, any, Document<unknown, any, SyncStatus, any, {}> & SyncStatus & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, SyncStatus, Document<unknown, {}, import("mongoose").FlatRecord<SyncStatus>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<SyncStatus> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
