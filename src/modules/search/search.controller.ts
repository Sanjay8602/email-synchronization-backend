import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SearchService, SearchFilters } from './search.service';
import { Types } from 'mongoose';

@Controller('search')
@UseGuards(AuthGuard('jwt'))
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('emails')
  async searchEmails(
    @Request() req,
    @Query('q') query: string,
    @Query('accountId') accountId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('sender') sender?: string,
    @Query('domain') domain?: string,
    @Query('espType') espType?: string,
    @Query('folder') folder?: string,
    @Query('isRead') isRead?: string,
    @Query('isFlagged') isFlagged?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: SearchFilters = {
      accountId: accountId ? new Types.ObjectId(accountId) : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      sender,
      domain,
      espType,
      folder,
      isRead: isRead ? isRead === 'true' : undefined,
      isFlagged: isFlagged ? isFlagged === 'true' : undefined,
    };

    return this.searchService.searchEmails(
      req.user._id,
      query || '',
      filters,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('suggestions')
  async getSuggestions(
    @Request() req,
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.getSearchSuggestions(
      req.user._id,
      query || '',
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('filters')
  async getAdvancedFilters(@Request() req) {
    return this.searchService.getAdvancedSearchFilters(req.user._id);
  }

  @Get('analytics')
  async getSearchAnalytics(
    @Request() req,
    @Query('accountId') accountId?: string,
    @Query('timeRange') timeRange?: string,
  ) {
    return this.searchService.getSearchAnalytics(
      req.user._id,
      accountId,
      timeRange || '30d',
    );
  }
}
