import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, UserSchema } from './schemas/user.schema';
import { EmailAccount, EmailAccountSchema } from './schemas/email-account.schema';
import { Email, EmailSchema } from './schemas/email.schema';
import { SyncStatus, SyncStatusSchema } from './schemas/sync-status.schema';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: EmailAccount.name, schema: EmailAccountSchema },
      { name: Email.name, schema: EmailSchema },
      { name: SyncStatus.name, schema: SyncStatusSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
