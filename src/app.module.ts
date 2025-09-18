import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmailAccountController } from './modules/email/email-account.controller';
import { EmailAccountService } from './modules/email/email-account.service';
import { EmailSyncController } from './modules/email/email-sync.controller';
import { EmailSyncService } from './modules/email/email-sync.service';
import { EmailProcessingService } from './modules/email/email-processing.service';
import { ImapConnectionService } from './modules/imap/imap-connection.service';
import { AnalyticsController } from './modules/analytics/analytics.controller';
import { AnalyticsService } from './modules/analytics/analytics.service';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    SearchModule,
  ],
  controllers: [
    AppController,
    EmailAccountController,
    EmailSyncController,
    AnalyticsController,
  ],
  providers: [
    AppService,
    EmailAccountService,
    EmailSyncService,
    EmailProcessingService,
    ImapConnectionService,
    AnalyticsService,
  ],
})
export class AppModule {}
