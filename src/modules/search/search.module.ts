import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Email, EmailSchema } from '../../database/schemas/email.schema';
import { EmailAccount, EmailAccountSchema } from '../../database/schemas/email-account.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Email.name, schema: EmailSchema },
      { name: EmailAccount.name, schema: EmailAccountSchema },
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}

