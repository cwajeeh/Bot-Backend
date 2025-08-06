import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersSubscriptionsEntity } from './users_subscriptions.entity';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { EmailService } from '../shared/email.service';
import { SubscriptionPackagesService } from '../subscription_packages/subscription-packages.service';
import { UsersService } from '../users/users.service';
import { UsersEntity } from '../users/users.entity';
import { BotsService } from '../bots/bots.service';
@Injectable()
export class UsersSubscriptionsService {
  constructor(
    @InjectRepository(UsersSubscriptionsEntity)
    private usersSubscriptionsRepository: Repository<UsersSubscriptionsEntity>,
    private UsersService: UsersService,
    private subscriptionPackagesService: SubscriptionPackagesService,
    private emailService: EmailService,
    private botsService: BotsService,
  ) {}

  async create(request: {
    subscription_id: string;
    customer: string;
    amount_total: string;
    currency: string;
    expires_at: string;
    invoice: string;
    mode: string;
    customer_email: string;
    price_id: string;
    payment_status: string;
    status: string;
    subscription: string;
  }): Promise<UsersSubscriptionsEntity> {
    // adding msg credit info - start
    const subscription_package =
      await this.subscriptionPackagesService.findOneByPriceId(
        request?.price_id,
      );

    const { id }: UsersSubscriptionsEntity =
      await this.UsersService.findOneByEmail(request.customer_email);
    const existingSubscriptions = await this.usersSubscriptionsRepository.find({
      where: { user_id: id },
    });
    // Set all existing subscriptions to current = false
    for (const subscription of existingSubscriptions) {
      subscription.current = false;
    }

    // Save the updated subscriptions back to the repository
    await this.usersSubscriptionsRepository.save(existingSubscriptions);
    let to_add_msg_credits = 0;
    //as we are fetching subscription package either on monthly or annual price id so
    if (subscription_package.stripe_price_id === request?.price_id) {
      to_add_msg_credits = subscription_package.features_metadata['credits'];
    } else if (
      subscription_package.stripe_annual_price_id === request?.price_id
    ) {
      to_add_msg_credits =
        subscription_package.features_metadata['credits'] * 12;
    }

    // - adding msg credit info - end
    const user: UsersSubscriptionsEntity =
      this.usersSubscriptionsRepository.create({
        ...request,
        remaining_msg_credits: to_add_msg_credits,
        total_msg_credits: to_add_msg_credits,
        user_id: id,
      });

    await this.usersSubscriptionsRepository.save(user);
    return user;
  }

  async update(
    customerSubscription: number,
    updateData: Partial<UsersSubscriptionsEntity>,
  ): Promise<UsersSubscriptionsEntity> {
    const existingSubscription =
      await this.usersSubscriptionsRepository.findOne({
        where: { id: customerSubscription },
        relations: ['user'],
      });

    if (!existingSubscription) {
      throw new HttpException('Subscription not found.', HttpStatus.NOT_FOUND);
    }

    // Change the status of the existing subscription to "previous"
    existingSubscription.current = false;
    await this.usersSubscriptionsRepository.save(existingSubscription);

    const subscription_package =
      await this.subscriptionPackagesService.findOneByPriceId(
        updateData?.price_id,
      );

    let to_add_msg_credits = 0;

    if (subscription_package.stripe_price_id === updateData?.price_id) {
      to_add_msg_credits = subscription_package.features_metadata['credits'];
    } else if (
      subscription_package.stripe_annual_price_id === updateData?.price_id
    ) {
      to_add_msg_credits =
        subscription_package.features_metadata['credits'] * 12;
    }

    const newSubscriptionData = {
      ...updateData,
      remaining_msg_credits: to_add_msg_credits,
      total_msg_credits: to_add_msg_credits,
      user_id: existingSubscription.user_id,
    };

    //create new wtity in Db
    const newSubscription =
      this.usersSubscriptionsRepository.create(newSubscriptionData);
    await this.usersSubscriptionsRepository.save(newSubscription);

    // Send appropriate email based on the price comparison
    if (Number(existingSubscription.amount_total) > Number(newSubscription.amount_total)) {
      await this.botsService.deleteExtraBots(
        existingSubscription?.user_id,
        subscription_package?.features_metadata,
      );
      this.emailService.sendEmail(
        existingSubscription.customer_email,
        'Your Plan Has Been Downgraded',
        'plan_downgrade',
        {
          name: existingSubscription.user.first_name,
          plan: subscription_package.name,
        },
      );
    } else if (
      Number(existingSubscription.amount_total) < Number(newSubscription.amount_total)
    ) {
      this.emailService.sendEmail(
        existingSubscription.customer_email,
        'Your Plan Upgrade Was Successful!',
        'plan_upgrade',
        {
          name: existingSubscription.user.first_name,
          plan: subscription_package.name,
          domain: process.env.FRONTEND_URL,
        },
      );
    }

    return newSubscription;
  }

  async assignUserSubscriptionId(
    email,
    user_subscription,
  ): Promise<object | null> {
    const user: UsersEntity = await this.UsersService.findOneByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    if (!user.is_active) {
      throw new Error('User is inactive');
    }
    user_subscription.user_id = user.id;
    return await this.usersSubscriptionsRepository.save(user);
  }
  // Find subscriptions expired
  async findExpiredSubscriptions(): Promise<UsersSubscriptionsEntity[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredSubscriptions = await this.usersSubscriptionsRepository
      .createQueryBuilder('subscription')
      .where('subscription.expires_at >= :today', { today })
      .andWhere('subscription.status != :status',{status:'expired'})
      .leftJoinAndSelect('subscription.user', 'user')
      .getMany();

    if (expiredSubscriptions.length > 0) {
      await this.usersSubscriptionsRepository
        .createQueryBuilder()
        .update(UsersSubscriptionsEntity)
        .set({ status: 'expired', current: false })
        .whereInIds(expiredSubscriptions.map((sub) => sub.id))
        .execute();
    }

    return expiredSubscriptions;
  }

  async findExpiringSubscriptionsSoon(
    days: number,
  ): Promise<UsersSubscriptionsEntity[]> {
    const today = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(today.getDate() - days); 

    return this.usersSubscriptionsRepository
      .createQueryBuilder('subscription')
      .where(
        'subscription.expires_at > :today AND subscription.expires_at >= :expiryDate',
        {
          today,
          expiryDate,
        }
      )
      .andWhere('subscription.status != :status',{status:'expired'})
      .leftJoinAndSelect('subscription.user', 'user')
      .getMany();
  }

  async getHighestFeaturePackage(user_id: number) {
    const subscriptions = await this.usersSubscriptionsRepository.find({
      where: { user_id },
    });
    // Filter out expired subscriptions
    const activeSubscriptions = subscriptions.filter(
      (subscription) => subscription.status !== 'expired',
    );

    // Fetch all subscription packages
    const subscriptionPackages =
      await this.subscriptionPackagesService.findAll();

    // Filter subscription packages based on active subscriptions
    const filteredPackages = subscriptionPackages.filter(
      (subscriptionPackage) => {
        return activeSubscriptions.some(
          (subscription) =>
            subscription.price_id === subscriptionPackage.stripe_price_id ||
            subscription.price_id ===
              subscriptionPackage.stripe_annual_price_id,
        );
      },
    );

    // Find the package with the highest number of chatbots features
    const highestFeaturePackage = filteredPackages.reduce((prev, current) => {
      return prev.features_metadata.hasOwnProperty('chatbots') >
        current.features_metadata.hasOwnProperty('chatbots')
        ? prev
        : current;
    }, filteredPackages[0]);

    return highestFeaturePackage;
  }

  async sendCreditsNotificationEmail(
    percentage: number,
    email: string,
    firstName: string,
    plan: string,
  ) {
    let subject = '';
    let template = '';
  
    switch (percentage) {
      case 100:
        subject = 'All Your Message Credits Have Been Used';
        template = 'all_credits_used';
        break;
      case 50:
        subject = 'Your Message Credits Will End Soon (50% Used)';
        template = 'credits_end_soon';
        break;
      case 25:
        subject = 'Your Message Credits Will End Soon (75% Used)';
        template = 'credits_end_soon';
        break;
      default:
        return; // No email sent if the percentage is not matched
    }
  
    await this.emailService.sendEmail(email, subject, template, {
      name: firstName,
      plan,
      domain: process.env.FRONTEND_URL,
    });
  }
  
}
