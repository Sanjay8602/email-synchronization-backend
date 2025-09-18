import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EmailDocument = Email & Document;

export enum EmailFlag {
  SEEN = '\\Seen',
  ANSWERED = '\\Answered',
  FLAGGED = '\\Flagged',
  DELETED = '\\Deleted',
  DRAFT = '\\Draft',
}

@Schema({ timestamps: true })
export class Email {
  @Prop({ required: true, type: Types.ObjectId, ref: 'EmailAccount' })
  accountId: Types.ObjectId;

  @Prop({ required: true })
  messageId: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  from: string;

  @Prop({ required: true })
  fromName: string;

  @Prop({ required: true })
  fromEmail: string;

  @Prop({ required: true })
  to: string[];

  @Prop()
  cc?: string[];

  @Prop()
  bcc?: string[];

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  receivedDate: Date;

  @Prop({ required: true })
  timeDelta: number; // in milliseconds

  @Prop({ required: true })
  content: string;

  @Prop()
  htmlContent?: string;

  @Prop()
  textContent?: string;

  @Prop({ type: [String], enum: EmailFlag, default: [] })
  flags: EmailFlag[];

  @Prop({ required: true })
  folder: string;

  @Prop({ required: true })
  uid: number;

  @Prop({ required: true })
  size: number;

  // Analytics fields
  @Prop()
  sendingDomain?: string;

  @Prop()
  espType?: string;

  @Prop()
  espName?: string;

  @Prop({ default: false })
  isOpenRelay: boolean;

  @Prop({ default: false })
  hasValidTLS: boolean;

  @Prop()
  tlsVersion?: string;

  @Prop()
  certificateIssuer?: string;

  @Prop()
  certificateSubject?: string;

  @Prop()
  certificateValidFrom?: Date;

  @Prop()
  certificateValidTo?: Date;

  // Search indexing
  @Prop({ type: String, index: 'text' })
  searchableContent: string;
}

export const EmailSchema = SchemaFactory.createForClass(Email);

// Create compound indexes for better performance
EmailSchema.index({ accountId: 1, uid: 1 }, { unique: true });
EmailSchema.index({ accountId: 1, folder: 1 });
EmailSchema.index({ fromEmail: 1 });
EmailSchema.index({ sendingDomain: 1 });
EmailSchema.index({ espType: 1 });
EmailSchema.index({ date: -1 });
EmailSchema.index({ receivedDate: -1 });
