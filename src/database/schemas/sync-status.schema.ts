import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SyncStatusDocument = SyncStatus & Document;

export enum SyncStatusType {
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

@Schema({ timestamps: true })
export class SyncStatus {
  @Prop({ required: true, type: Types.ObjectId, ref: 'EmailAccount' })
  accountId: Types.ObjectId;

  @Prop({ required: true, enum: SyncStatusType })
  status: SyncStatusType;

  @Prop({ default: 0 })
  totalEmails: number;

  @Prop({ default: 0 })
  processedEmails: number;

  @Prop({ default: 0 })
  newEmails: number;

  @Prop({ default: 0 })
  updatedEmails: number;

  @Prop()
  currentFolder?: string;

  @Prop()
  lastProcessedUid?: number;

  @Prop()
  errorMessage?: string;

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  lastActivity?: Date;
}

export const SyncStatusSchema = SchemaFactory.createForClass(SyncStatus);
