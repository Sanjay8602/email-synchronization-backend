import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EmailAccountDocument = EmailAccount & Document;

export enum AuthMethod {
  PLAIN = 'PLAIN',
  LOGIN = 'LOGIN',
  OAUTH2 = 'OAUTH2',
}

@Schema({ timestamps: true })
export class EmailAccount {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  imapHost: string;

  @Prop({ required: true })
  imapPort: number;

  @Prop({ default: true })
  useSSL: boolean;

  @Prop({ required: true, enum: AuthMethod })
  authMethod: AuthMethod;

  @Prop({ required: true })
  username: string;

  @Prop()
  password?: string;

  @Prop()
  oauth2Token?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isConnected: boolean;

  @Prop()
  lastSync?: Date;

  @Prop({ default: 0 })
  totalEmails: number;

  @Prop({ default: 0 })
  syncedEmails: number;

  @Prop()
  lastError?: string;
}

export const EmailAccountSchema = SchemaFactory.createForClass(EmailAccount);
