import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
  Request,
  UseGuards,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiConflictResponse,
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { BotsService } from './bots.service';
import {
  AddBotDTO,
  UpdateBotDTO,
  GetPublicBotDetailParams,
  botWebHookPayload,
  UpdateBotStatusDTO
} from './dto/bots.dto';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from '../users/users.service';
import { Cron,CronExpression } from '@nestjs/schedule';
@ApiTags('ChatBots')
@Controller('bots')
export class BotsController {
  constructor(
    private botsService: BotsService,
    private usersService: UsersService,
  ) {}

  @Get('public/:display_id')
  getPublicBotDetail(@Param() params: GetPublicBotDetailParams) {
    return this.botsService.getPublicBotDetail(params);
  }

  @Post('webhook')
  manageBotHooks(@Body() botWebHooks: botWebHookPayload) {
    return this.botsService.manageBotHooks(botWebHooks);
  }

  @Throttle({ long: { limit: 1, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Post('/')
  @ApiUnauthorizedResponse({
    description: 'Not Authorized to access this endpoint.',
  })
  addBot(@Body() addBotDto: AddBotDTO, @Request() req) {
    const user = req.user;
    return this.botsService.addBot(addBotDto, user, this.usersService);
  }

  // get bot detail
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Get(':botId')
  @ApiOkResponse({ description: 'Bot retrieved successfully.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
  getBotDetail(@Param('botId') botId: string, @Request() req) {
    const user = req.user;
    return this.botsService.getBotDetail(botId, user);
  }

  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Delete(':botId')
  @ApiOkResponse({ description: 'Bot retrieved successfully.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
  deleteBotById(@Param('botId') botId: string, @Request() req) {
    const user = req.user;
    return this.botsService.deleteBotById(botId, user);
  }

  // update bot
  @Throttle({ long: { limit: 1, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Patch(':botId')
  @ApiOkResponse({ description: 'Bot updated successfully.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
  updateBot(
    @Param('botId') botId: string,
    @Body() updateBotDto: UpdateBotDTO,
    @Request() req,
  ) {
    const user = req.user;
    return this.botsService.updateBot(botId, updateBotDto, user);
  }

  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Get('/')
  getBotListing(@Request() req) {
    const user = req.user;
    return this.botsService.getBotListing(user);
  }

  @UseGuards(AuthGuard) 
  @Patch('change-status/:bot_id')
  changeBotStatus(
    @Param('bot_id') bot_id: number,
    @Body() updateBotStatusDto: UpdateBotStatusDTO,
  ) {
    return this.botsService.changeBotStatus(bot_id,updateBotStatusDto);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleInactivityCheck() {
    console.log('Running daily bot inactivity check...');
    const inactiveBots = await this.botsService.getBotsWithInactivityOf7Days();

    if (inactiveBots.length > 0) {
      console.log(`Found ${inactiveBots} inactive bots.`);
    } else {
      console.log('No inactive bots found.');
    }
  }
}
