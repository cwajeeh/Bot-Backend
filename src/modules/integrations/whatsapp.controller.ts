import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CreateWhatsAppWebhookDTO } from './dto/create-whatsapp-webhook.dto';
import { WhatsappService } from './whatsapp.service';
import {
  CreateWhatsappWebhookResponseDTO,
  DeleteWhatsappWebhookResponseDTO,
  GetWhatsappWebhookResponseDTO,
} from './dto/create-whatsapp-webhook-response.dto';

@ApiTags('WhatsApp')
@Controller('integrations/whatsapp')
export class WhatsappController {
  constructor(private readonly whatsAppService: WhatsappService) {}

  @ApiProperty()
  @Post('create-webhook')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Webhook Generated.',
    type: CreateWhatsappWebhookResponseDTO,
  })
  @ApiConflictResponse({
    description: 'A webhook for this chatbot ID already exists.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
  async createWebhook(@Body() createDto: CreateWhatsAppWebhookDTO) {
    return this.whatsAppService.createWebhook(createDto);
  }

  @ApiProperty()
  @Get('webhook/:chatbot_id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Webhook Generated.',
    type: GetWhatsappWebhookResponseDTO,
  })
  @ApiNotFoundResponse({
    description: 'A webhook for this chatbot ID not exists.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
  async getWebhookDetail(@Param('chatbot_id') chatbot_id: string) {
    return await this.whatsAppService.getWhatsAppIntegrationData(chatbot_id);
  }

  @Get(':chatbot_id')
  @HttpCode(HttpStatus.OK)
  async verifyWebhook(
    @Param('chatbot_id') chatbot_id: string,
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    // Implement verification logic here, e.g., check the token matches the stored one
    const webhook_relevant_data =
      await this.whatsAppService.getWhatsAppConfig(chatbot_id);
    if (
      mode === 'subscribe' &&
      token === webhook_relevant_data.verification_token
    ) {
      return challenge;
    } else {
      throw new UnauthorizedException('Verification failed');
    }
  }

  @HttpCode(200)
  @Post(':chatbot_id')
  async receiveMessageFromWhatsApp(
    @Param('chatbot_id') chatbot_id: string,
    @Body() body: any,
  ) {
    return await this.whatsAppService.handleIncomingMessage(chatbot_id, body);
  }

  @ApiProperty()
  @HttpCode(HttpStatus.ACCEPTED)
  @Delete('webhook/:chatbot_id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Webhook Deleted.',
    type: DeleteWhatsappWebhookResponseDTO,
  })
  @ApiConflictResponse({
    description: 'A webhook for this chatbot ID not exists.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
  async DeleteWebhookDetail(@Param('chatbot_id') chatbot_id: string) {
    return await this.whatsAppService.deleteWhatsAppIntegrationData(chatbot_id);
  }
}
