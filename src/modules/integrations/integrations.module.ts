import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppIntegration } from './whatsapp-integrations.entity';
import { BotsEntity } from '../bots/bots.entity';
import { SharedModule } from '../shared/shared.module';
@Module({
  imports: [TypeOrmModule.forFeature([WhatsAppIntegration, BotsEntity]),SharedModule],
  providers: [WhatsappService],
  controllers: [WhatsappController],
})
export class IntegrationsModule {}
