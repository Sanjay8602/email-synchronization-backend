import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EmailAccountService } from './email-account.service';
import { CreateEmailAccountDto, UpdateEmailAccountDto } from './dto/email-account.dto';
import { Types } from 'mongoose';

@Controller('email-accounts')
@UseGuards(AuthGuard('jwt'))
export class EmailAccountController {
  constructor(private readonly emailAccountService: EmailAccountService) {}

  @Get()
  async getEmailAccounts(@Request() req) {
    return this.emailAccountService.getEmailAccounts(req.user._id);
  }

  @Post()
  async createEmailAccount(
    @Request() req,
    @Body(ValidationPipe) createEmailAccountDto: CreateEmailAccountDto,
  ) {
    return this.emailAccountService.createEmailAccount(req.user._id, createEmailAccountDto);
  }

  @Put(':id')
  async updateEmailAccount(
    @Param('id') id: string,
    @Request() req,
    @Body(ValidationPipe) updateEmailAccountDto: UpdateEmailAccountDto,
  ) {
    return this.emailAccountService.updateEmailAccount(new Types.ObjectId(id), req.user._id, updateEmailAccountDto);
  }

  @Delete(':id')
  async deleteEmailAccount(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.emailAccountService.deleteEmailAccount(new Types.ObjectId(id), req.user._id);
  }

  @Post(':id/test-connection')
  async testConnection(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.emailAccountService.testConnection(new Types.ObjectId(id), req.user._id);
  }
}
