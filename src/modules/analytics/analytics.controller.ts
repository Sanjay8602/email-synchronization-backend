import { 
  Controller, 
  Get, 
  Query, 
  UseGuards, 
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';
import { Types } from 'mongoose';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview(
    @Request() req,
    @Query('accountId') accountId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const filters = {
      accountId: accountId ? new Types.ObjectId(accountId) : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    };

    return this.analyticsService.getOverview(req.user._id, filters);
  }

  @Get('senders')
  async getSenders(
    @Request() req,
    @Query('accountId') accountId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getSenders(
      req.user._id,
      accountId ? new Types.ObjectId(accountId) : undefined,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('domains')
  async getDomains(
    @Request() req,
    @Query('accountId') accountId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getDomains(
      req.user._id,
      accountId ? new Types.ObjectId(accountId) : undefined,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('esp')
  async getESP(
    @Request() req,
    @Query('accountId') accountId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getESP(
      req.user._id,
      accountId ? new Types.ObjectId(accountId) : undefined,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('time-series')
  async getTimeSeries(
    @Request() req,
    @Query('accountId') accountId?: string,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getTimeSeries(
      req.user._id,
      accountId ? new Types.ObjectId(accountId) : undefined,
      days ? parseInt(days) : 30,
    );
  }

  @Get('security')
  async getSecurityMetrics(
    @Request() req,
    @Query('accountId') accountId?: string,
  ) {
    return this.analyticsService.getSecurityMetrics(
      req.user._id,
      accountId ? new Types.ObjectId(accountId) : undefined,
    );
  }
}
