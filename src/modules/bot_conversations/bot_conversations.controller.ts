import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BotConversationsService } from './bot_conversations.service';
import { BotConversation } from './entities/bot_conversation.entity';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../roles/roles.guard';

@ApiTags('BotConversation')
@Controller('bot-conversations')
export class BotConversationsController {
  constructor(
    private readonly botConversationsService: BotConversationsService,
  ) {}

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Bot retrieved successfully.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
  @Get('sessions')
  getSessions(
    @Query('botId') botId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<string[]> {
    return this.botConversationsService.findSessions(
      botId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Bot retrieved successfully.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
  @Get('session')
  getConversationsBySession(
    @Query('sessionId') sessionId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<BotConversation[]> {
    return this.botConversationsService.findBySession(
      sessionId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null,
    );
  }
}
