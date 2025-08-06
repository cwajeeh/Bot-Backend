import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AddBotDTO, SourceItemDTO, UpdateBotDTO } from './dto/bots.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CommonService } from '../shared/common.service';
import { MlService } from '../shared/ml.service';
import { BotsEntity } from './bots.entity';
import { BotSources } from './bot-sources.entity';
import { Repository } from 'typeorm';
import { GetPublicBotDetailParams, botWebHookPayload } from './dto/bots.dto';
import { UsersService } from '../users/users.service';
import { EmailService } from '../shared/email.service';
import { SUBSCRIPTION_FEATURES_METADATA } from 'src/common/constants/subscription_features.constants';
import { SubscriptionPackagesService } from '../subscription_packages/subscription-packages.service';
import { UpdateBotStatusDTO } from './dto/bots.dto';
import { features } from 'process';
@Injectable()
export class BotsService {
  constructor(
    private commonService: CommonService,
    private mlService: MlService,
    @InjectRepository(BotsEntity)
    private botsRepository: Repository<BotsEntity>,
    @InjectRepository(BotSources)
    private botSourcesRepository: Repository<BotSources>,
    private subscriptionPackagesService: SubscriptionPackagesService,
    private emailService: EmailService,
  ) {}

  async addBot(
    request: AddBotDTO,
    user,
    usersService: UsersService,
  ): Promise<any> {
    const { id } = user;
    const botCount = await this.botsRepository.count({
      where: { created_by: id, is_deleted: false },
    });

    const userCurrSub = await usersService.findUserWithSubscription(id);
    const allowedbots =
      SUBSCRIPTION_FEATURES_METADATA[userCurrSub.name]['chatbot'];

    if (botCount >= allowedbots) {
      throw new ForbiddenException(
        'You have reached the maximum number of bots allowed by your current plan. Please upgrade your plan to create more bots',
      );
    }

    request.created_by = id;
    const randomDisplayId = this.commonService.randomString(16);
    request.display_id = randomDisplayId;
    const bot: BotsEntity = this.botsRepository.create({
      ...request,
    });

    const botDetail = await this.botsRepository.save(bot);
    const { sources } = request;
    if (sources) {
      const botSourcesData = sources.map((source) => ({
        bot_id: botDetail.id,
        source_type: source.source_type,
        source_data: source.source_data,
      }));

      await this.addBotSources(botSourcesData);
      this.mlService.generateEmbeddings(botDetail.id);
    }
    return botDetail;
  }

  async updateBot(botId, payload: UpdateBotDTO, user): Promise<any> {
    const { id } = user;
    const botIdNumber = parseInt(botId, 10);
    const botToUpdate: any = await this.botsRepository.findOne({
      where: { id: botIdNumber, created_by: id },
      relations:['user']
    });

    if (!botToUpdate) {
      throw new NotFoundException('Bot not found');
    }

    const onlySourcesUpdated =
      Object.keys(payload).length === 2 && payload.hasOwnProperty('sources');

    if (onlySourcesUpdated) {
      const existingSources = await this.botSourcesRepository.find({
        where: { bot_id: botIdNumber },
      });

      const areSourcesEqual = await this.compareSourceData(
        payload.sources,
        existingSources,
      );

      if (areSourcesEqual) {
        throw new BadRequestException(
          'No changes detected in the sources data. Bot will not be updated.',
        );
      }
    }

    let isUpdated = false;
    for (const key in payload) {
      if (payload.hasOwnProperty(key)) {
        // Check if the new value is different from the current value
        if (payload[key] !== botToUpdate[key]) {
          botToUpdate[key] = payload[key];
          isUpdated = true;
  
          // Check which property was updated and send corresponding email
          if(botToUpdate?.notifications?.hasOwnProperty('email_phone') === "true"){
          switch (key) {
            case 'model':
              this.emailService.sendEmail(
                botToUpdate.user.email,
                'GPT Model Updated for Your Chatbot',
                'model_updated',
                {
                  chatBotId: botToUpdate.display_id,
                  oldGptModel: botToUpdate.gpt_model, // Assuming you have the old model
                  newGptModel: payload.model,
                  name: botToUpdate.user.first_name,
                  domain: process.env.FRONTEND_URL,
                },
              );
              break;
  
            case 'bot_name':
              this.emailService.sendEmail(
                botToUpdate.user.email,
                'Chatbot Name Changed Successfully',
                'name_changed',
                {
                  chatBotId: botToUpdate.display_id,
                  changedName: payload.bot_name,
                  name: botToUpdate.user.first_name,
                  domain: process.env.FRONTEND_URL,
                },
              );
              break;
  
            case 'security':
              this.emailService.sendEmail(
                botToUpdate.user.email,
                'Chatbot security Updated',
                'security_updated',
                {
                  name: botToUpdate.user.first_name,
                  domain: process.env.FRONTEND_URL,
                },
              );
              break;
  
            case 'interface':
              this.emailService.sendEmail(
                botToUpdate.user.email,
                'Chat Interface Updated Successfully',
                'interface_updated',
                {
                  name: botToUpdate.user.first_name,
                  domain: process.env.FRONTEND_URL,
                },
              );
              break;
          }
        }
        }
      }
    }

    if (botToUpdate.sources) {
      await this.updateBotSources(botToUpdate.sources, botIdNumber);
    }

    botToUpdate['status'] = 'pending';
    this.mlService.generateEmbeddings(botId);

    return await this.botsRepository.save(botToUpdate);
  }

  async compareSourceData(
    newSources: SourceItemDTO[],
    existingSources: any[],
  ): Promise<boolean> {
    if (newSources.length !== existingSources.length) {
      return false;
    }

    for (let i = 0; i < newSources.length; i++) {
      const newSource = newSources[i];
      const existingSource = existingSources.find(
        (source) => source.source_type === newSource.source_type,
      );

      if (!existingSource) {
        return false;
      }

      const newSourceData = JSON.stringify(newSource.source_data);
      const existingSourceData = JSON.stringify(existingSource.source_data);

      if (newSourceData !== existingSourceData) {
        return false;
      }
    }

    return true;
  }

  async getBotDetail(botId, user): Promise<any> {
    const { id } = user;

    const botDetail = await this.botsRepository
      .createQueryBuilder('bot')
      .leftJoinAndSelect('bot.botSources', 'botSource')
      .leftJoinAndSelect('bot.user', 'user')
      .leftJoinAndSelect(
        'user.user_subscriptions',
        'subscription',
        'subscription.status NOT IN (:...statuses)', 
        { statuses: ['expired'] },
      )
      .where('bot.id = :botId', { botId })
      .andWhere('bot.created_by = :id', { id })
      .getOne();
    if (botDetail.user && botDetail.user.user_subscriptions.length > 0) {
      const activeSubscription = botDetail?.user.user_subscriptions.find(
        (sub) => sub.current === true,
      );

      const subscription =
        await this.subscriptionPackagesService.findOneByPriceId(
          activeSubscription.price_id,
        );
      // Check remaining message credits
      if (activeSubscription) {

        const sortedSubscriptions = botDetail.user.user_subscriptions
        .filter(subscription => 
          subscription.status !== 'expired' &&  
          subscription.expires_at !== null       
        )  
        .sort((a: any, b: any) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime());
        const nearestSubscription = sortedSubscriptions[0];

        return {
          ...botDetail,
          subscription,
          subscription_id: nearestSubscription?.id ?? activeSubscription.id,
        };
      }
    }

    return botDetail;
  }

  async deleteBotById(botId, user): Promise<string> {
    const { id } = user;
    const bot: BotsEntity = await this.botsRepository.findOne({
      where: {
        id: botId,
        created_by: id,
      },
    });
    if (!bot) {
      throw new HttpException(
        'Bot with this id not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (bot.is_deleted) {
      throw new HttpException('Bot is already deleted', HttpStatus.CONFLICT);
    }
    bot.is_deleted = true;
    await this.botsRepository.save(bot);
    if(bot?.notifications?.hasOwnProperty('email_phone')){
    this.emailService.sendEmail(
      bot.user.email,
      `Chatbot Deleted ${bot.display_id}`,
      'chatbot_deleted',
      {
        chatBotId:bot.display_id,
        name: bot.user.first_name,
        domain: process.env.FRONTEND_URL,
      },
    );
  }
    return 'Bot deleted!';
  }

  async getPublicBotDetail(params: GetPublicBotDetailParams): Promise<any> {
    const { display_id } = params;

    const bot = await this.botsRepository
      .createQueryBuilder('bot')
      .select([
        'bot.id',
        'bot.status',
        'bot.interface',
        'bot.security',
        'bot.created_by',
      ])
      .leftJoinAndSelect('bot.user', 'user')
      .leftJoinAndSelect('user.user_subscriptions', 'user_subscriptions')
      .where('bot.display_id = :display_id', { display_id })
      .getOne();

    if (!bot) {
      throw new NotFoundException('Bot not found');
    }
    if (bot.user && bot.user?.user_subscriptions.length > 0) {
      const activeSubscription = bot.user?.user_subscriptions.find(
        (sub) => sub.current === true,
      );

      const subscription =
        await this.subscriptionPackagesService.findOneByPriceId(
          activeSubscription.price_id,
        );
      // Check remaining message credits
      if (activeSubscription) {

        const sortedSubscriptions = bot.user.user_subscriptions
        .filter(subscription => 
          subscription.status !== 'expired' &&  
          subscription.expires_at !== null       
        )  
        .sort((a: any, b: any) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime());
        const nearestSubscription = sortedSubscriptions[0];

        return {
          ...bot,
          subscription,
          subscription_id: nearestSubscription?.id ?? activeSubscription.id,
        };
      }
    }
    return bot;
  }

  async manageBotHooks(data: botWebHookPayload): Promise<any> {
    const { bot_id, hook_data } = data;
    const botToUpdate: any = await this.botsRepository.findOne({
      where: { id: bot_id },
      select: ['id'],
    });

    if (!botToUpdate) {
      throw new NotFoundException('Bot not found');
    }

    if ('status' in hook_data) {
      botToUpdate.status = hook_data.status;
    }
    try {
      const updatedBot = await this.botsRepository.save(botToUpdate);
      return updatedBot;
    } catch (error) {
      console.error('Error updating bot:', error);
      throw error;
    }
  }

  async getBotListing(user): Promise<any> {
    const { id } = user;
    return await this.botsRepository.find({
      where: { created_by: id, is_deleted: false },
      relations: ['botSources'],
    });
  }

  async addBotSources(request: any): Promise<any> {
    const botSourcesArray = request.map((req) =>
      this.botSourcesRepository.create(req),
    );
    return await this.botSourcesRepository.save(botSourcesArray);
  }

  async updateBotSources(data: any, botId: number): Promise<any> {
    const promises = data.map(async (req) => {
      const existingSource = await this.botSourcesRepository.findOne({
        where: { bot_id: botId, source_type: req.source_type },
      });

      if (existingSource) {
        // Update existing source
        existingSource.source_data = req.source_data;
        return await this.botSourcesRepository.save(existingSource);
      } else {
        // Create new source
        req.bot_id = botId;
        const newSource = this.botSourcesRepository.create(req);
        return await this.botSourcesRepository.save(newSource);
      }
    });

    return Promise.all(promises);
  }

  /**
   * Deletes all bots associated with a given user ID.
   *
   * @param userId The ID of the user whose bots should be deleted.
   * @returns Promise<void>
   */
  async deleteAssociatedBots(userId: number): Promise<void> {
    try {
      // Find all bots created by the user
      const bots = await this.botsRepository.find({
        where: { created_by: userId },
      });

      // If there are bots, proceed to delete them
      if (bots.length > 0) {
        const botIds = bots.map((bot) => bot.id);
        // Delete all found bots
        await this.botsRepository.delete(botIds);
      }
    } catch (error) {
      console.error('Error deleting associated bots:', error);
      throw new InternalServerErrorException('Error deleting associated bots');
    }
  }

  /**
   * Deletes  bots in free Plan after 7 days inactivity.
   *
   * @param userId The ID of the user whose bots should be deleted.
   * @returns Promise<void>
   */
  async getBotsWithInactivityOf7Days() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const bots = await this.botsRepository
      .createQueryBuilder('bot')
      .leftJoinAndSelect('bot.user', 'user')
      .leftJoinAndSelect('user.user_subscriptions', 'subscription')
      .where('subscription.status != :expiredStatus', { expiredStatus: 'expired' })
      .andWhere('subscription.total_msg_credits = :total_msg_credits', {
        total_msg_credits: 25,
      })
      .andWhere('subscription.expires_at > :currentDate', {
        currentDate: new Date(), // Current date to check if expires_at is not passed
      })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('1')
          .from('bot_conversation', 'conversation')
          .where('conversation.bot_id = bot.id')
          .andWhere('conversation.created_at >= :seven_days_ago')
          .getQuery();

        return `NOT EXISTS (${subQuery})`;
      })
      .setParameter(
        'seven_days_ago',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      )
      .getMany();

    // If there are bots, proceed to delete them
    if (bots.length > 0) {
      const botIds = bots.map((bot) => bot.id);
      // Delete all found bots
      await this.botsRepository.delete(botIds);
    }
    return bots;
  }

  /**
   * Deletes all bots associated with a given user ID.
   *
   * @param userId The ID of the user whose bots should be deleted.
   * @returns Promise<void>
   */
  async changeBotStatus(
    bot_id: number,
    request: UpdateBotStatusDTO,
  ): Promise<any> {
    try {
      const { status } = request;
      const bot = await this.botsRepository.findOne({
        where: { id: bot_id },
      });

      if (bot) {
        bot.is_enabled = status;
        return await this.botsRepository.save(bot);
      }
    } catch (error) {
      console.error('Error Changing bot Status:', error);
      throw new InternalServerErrorException('Error Changing bot Status');
    }
  }

    /**
   * Deletes Extra bots in Plan Downgrade associated with a given user ID.
   *
   * @param userId The ID of the user whose bots should be deleted.
   * @returns Promise<void>
   */
    async deleteExtraBots(userId: number, features_metadata: any): Promise<void> {
      try {
        // Find all bots created by the user, sorted by created_at in ascending order
        const bots = await this.botsRepository.find({
          where: { created_by: userId },
          order: {
            created_at: 'ASC',
          }
        });
    
        const allowedBots = features_metadata?.chatbot;
        if (bots.length > allowedBots) {
          const extraBotsCount = bots.length - allowedBots;
    
          const botsToMarkAsDeleted = bots.slice(0, extraBotsCount);
    
          if (botsToMarkAsDeleted.length > 0) {
            for (const bot of botsToMarkAsDeleted) {
              bot.is_deleted = true;
              await this.botsRepository.save(bot);  // Save the updated bot
            }
          }
        }
      } catch (error) {
        console.error('Error deleting associated bots:', error);
        throw new InternalServerErrorException('Error deleting associated bots');
      }
    }
    
}
