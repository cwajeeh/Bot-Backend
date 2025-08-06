import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BotConversation } from './entities/bot_conversation.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BotConversationsService {
  constructor(
    @InjectRepository(BotConversation)
    private botConversationRepo: Repository<BotConversation>,
  ) {}

  async findBySession(
    sessionId: string,
    startDate?: Date | null,
    endDate?: Date | null,
  ): Promise<BotConversation[]> {
    const query = this.botConversationRepo
      .createQueryBuilder('conversation')
      .select([
        'conversation.id',
        'conversation.question',
        'conversation.answer',
      ])
      .where('conversation.session_id = :sessionId', { sessionId });

    if (startDate) {
      query.andWhere('conversation.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('conversation.created_at <= :endDate', { endDate });
    }

    return query.getMany();
  }
  async findSessions(
    botId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<string[]> {
    const query = this.botConversationRepo
      .createQueryBuilder('conversation')
      .select([
        'DISTINCT ON (conversation.session_id) conversation.session_id AS session_id',
        'conversation.id AS id',
        'conversation.agent AS agent',
        'conversation.source AS source',
        'conversation.question AS question_headline',
        'conversation.created_at AS created_at',
      ])
      .where('conversation.bot_id = :botId', { botId })
      .orderBy('conversation.session_id')
      .addOrderBy('conversation.created_at', 'ASC'); // Ensure earliest entry is selected

    if (startDate) {
      query.andWhere('conversation.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('conversation.created_at <= :endDate', { endDate });
    }

    return query.getRawMany();
  }
}
