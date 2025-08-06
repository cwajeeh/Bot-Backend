import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WhatsAppIntegration } from './whatsapp-integrations.entity';
import { Repository } from 'typeorm';
import { CreateWhatsAppWebhookDTO } from './dto/create-whatsapp-webhook.dto';
import { EmailService } from '../shared/email.service';
import * as WebSocket from 'ws';
import axios from 'axios';
import {
  DeleteWhatsappWebhookResponseDTO,
  GetWhatsappWebhookResponseDTO,
} from './dto/create-whatsapp-webhook-response.dto';
import { BotsEntity } from '../bots/bots.entity';

@Injectable()
export class WhatsappService {
  constructor(
    @InjectRepository(WhatsAppIntegration)
    private whatsAppIntegrationRepository: Repository<WhatsAppIntegration>,
    private emailService: EmailService,
    @InjectRepository(BotsEntity)
    private botRepository: Repository<BotsEntity>,
  ) {}
  async createWebhook(dto: CreateWhatsAppWebhookDTO): Promise<any> {
    // Check if a webhook with the given chatbot_id already exists
    const existingWebhook = await this.whatsAppIntegrationRepository.findOne({
      where: { chatbot_id: dto.chatbot_id },
    });

    if (existingWebhook) {
      // If it exists, throw a ConflictException (HTTP 409)
      throw new ConflictException(
        'A webhook for this chatbot ID already exists.',
      );
    }

    // Logic to save the WhatsApp integration details to the database
    const webhook_url_data = this.whatsAppIntegrationRepository.create(dto);
    await this.whatsAppIntegrationRepository.save(webhook_url_data);
    const bot: BotsEntity = await this.botRepository.findOne({
      where: {
        display_id: dto.chatbot_id,
      },
    });
    // Send email notification to the user
    if (bot?.notifications?.hasOwnProperty('email_phone')) {
      this.emailService.sendEmail(
        bot.user.email,
        'WhatsApp Integrated',
        'whatsapp_integrated',
        {
          name: bot.user.first_name,
          domain: process.env.FRONTEND_URL,
        },
      );
    }
    // Return the webhook URL
    return {
      webhookUrl: `${process.env.SERVER_URL || 'http://localhost:3000'}/integrations/whatsapp/${webhook_url_data.chatbot_id}`,
    };
  }

  async getWhatsAppConfig(chatbot_id: string): Promise<WhatsAppIntegration> {
    return await this.whatsAppIntegrationRepository.findOne({
      where: { chatbot_id },
    });
  }

  async getWhatsAppIntegrationData(
    chatbot_id: string,
  ): Promise<GetWhatsappWebhookResponseDTO> {
    const whatsapp_config = await this.whatsAppIntegrationRepository.findOne({
      where: { chatbot_id },
    });
    if (!whatsapp_config) {
      throw new NotFoundException('A webhook for this chatbot ID not exists.');
    }
    const webhook_url = `${process.env.SERVER_URL}/integrations/whatsapp/${chatbot_id}`;
    return { ...whatsapp_config, webhook_url };
  }

  async deleteWhatsAppIntegrationData(
    chatbot_id: string,
  ): Promise<DeleteWhatsappWebhookResponseDTO> {
    const whatsapp_config = await this.whatsAppIntegrationRepository.findOne({
      where: { chatbot_id },
    });
    if (!whatsapp_config) {
      throw new ConflictException('A webhook for this chatbot ID not exists.');
    }

    await this.whatsAppIntegrationRepository.delete({ chatbot_id });
    return { message: 'Whatspp Integration Deleted' };
  }

  async sendMessage(
    chatbot_id: string,
    recipient_number: string,
    message: string,
  ) {
    const config = await this.getWhatsAppConfig(chatbot_id);
    const url = `https://graph.facebook.com/v13.0/${config.phone_number_id}/messages`;
    const headers = { Authorization: `Bearer ${config.access_token}` };
    const body = {
      messaging_product: 'whatsapp',
      to: recipient_number,
      type: 'text',
      text: { body: message },
    };

    return axios.post(url, body, { headers });
  }

  async handleIncomingMessage(
    chatbot_id: string,
    message_payload: any,
  ): Promise<string> {
    // Extract message and sender details from messagePayload
    const messages = message_payload?.entry?.[0]?.changes?.[0]?.value?.messages;
    if (messages && messages.length > 0) {
      const message_data = messages[0]; // Taking the first message for simplicity
      const recipient_number = message_data.from; // Extract sender's number
      const text = message_data.text?.body; // Assuming text message for simplicity

      // Send the message to the ML server via WebSocket and wait for a response
      if (text) {
        const ml_response = await this.queryMLServer(
          chatbot_id,
          text,
          recipient_number,
        );
        if (ml_response) {
          try {
            // Process the received message and respond
            await this.sendMessage(chatbot_id, recipient_number, ml_response);
          } catch (err) {
            console.log(err.message);
          }
        }
      }
      return 'Event Received';
    }
  }

  private async queryMLServer(
    chatbot_id: string,
    message: string,
    recipient_number: string,
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const bot = await this.botRepository.findOne({
        where: { id: +chatbot_id },
        relations: {
          user: {
            user_subscriptions: true,
          },
        },
      });

      const ws = new WebSocket(process.env.ML_WEBSOCKET);

      const currentDate = new Date();
      const activeSubscription = bot?.user.user_subscriptions.find(
        (sub) => sub.current === true,
      );

      ws.on('open', () => {
        ws.send(
          JSON.stringify({
            bot_id: chatbot_id,
            ques: message,
            sub_id: activeSubscription.id,
            agent: 'whatsapp',
            source: recipient_number,
          }),
        );
      });

      ws.on('message', (event) => {
        const data = JSON.parse(event.toString());
        ws.close();
        if (data.status === 'success') {
          resolve(
            data.response === 'Invalid bot_id'
              ? 'Chatbot is currently being trained.'
              : data.response,
          );
        } else {
          reject('ML server returned an error.');
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });
    });
  }
}
