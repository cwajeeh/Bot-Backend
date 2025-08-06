import { Module } from '@nestjs/common';
import { BotConversationsService } from './bot_conversations.service';
import { BotConversationsController } from './bot_conversations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotConversation } from './entities/bot_conversation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BotConversation])],
  controllers: [BotConversationsController],
  providers: [BotConversationsService],
})
export class BotConversationsModule {}
