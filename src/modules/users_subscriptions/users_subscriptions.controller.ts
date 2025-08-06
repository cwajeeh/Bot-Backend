import { Controller, Injectable, Get, Post, UseGuards,Request,Body } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersSubscriptionsService } from './users_subscriptions.service';
import { EmailService } from '../shared/email.service';
import { SubscriptionPackagesService } from '../subscription_packages/subscription-packages.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { SendCreditsNotificationDto } from './user_subscriptions.dto';
@ApiTags('User Subscription Packages')
@Injectable()
@Controller('user_subscriptions')
export class UsersSubscriptionsController {
  constructor(
    private readonly subscriptionService: UsersSubscriptionsService,
    private readonly SubscriptionPackagesService: SubscriptionPackagesService,
    private readonly emailService: EmailService,
  ) {}

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @Get('highest_feature_package/')
  async getHighestFeaturePackage(@Request() req,) {
    const user = req.user;
    return await this.subscriptionService.getHighestFeaturePackage(user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @Post('send-credits-notification')
  async sendCreditsNotification(
    @Body() sendCreditsNotificationDto: SendCreditsNotificationDto,
  ) {
    const { percentage, email, firstName, plan } = sendCreditsNotificationDto;
    await this.subscriptionService.sendCreditsNotificationEmail(percentage, email, firstName, plan);
  }
  // Cron Job to notify about both expiring and expired subscriptions
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async notifySubscriptionStatus() {
    // Notify for expired subscriptions
    const expiredSubscriptions =
      await this.subscriptionService.findExpiredSubscriptions();
    for (const subscription of expiredSubscriptions) {
      const userSubscription =
        await this.SubscriptionPackagesService.findOneByPriceId(
          subscription.price_id,
        );
      const user = subscription.user;
      this.emailService.sendEmail(
        user.email,
        'Your Subscription Plan Has Ended',
        'plan_ended',
        {
          name: user.first_name,
          plan: userSubscription.name,
          domain: process.env.FRONTEND_URL,
        },
      );
    }

    // Notify for subscriptions expiring soon (e.g., in 3 days)
    const expiringSoonSubscriptions =
      await this.subscriptionService.findExpiringSubscriptionsSoon(3);

    for (const subscription of expiringSoonSubscriptions) {
      const userSubscription =
        await this.SubscriptionPackagesService.findOneByPriceId(
          subscription.price_id,
        );
      const user = subscription.user;
      this.emailService.sendEmail(
        user.email,
        'Your Subscription Plan Will End Soon',
        'plan_end_soon',
        {
          name: user.first_name,
          plan: userSubscription.name,
          domain: process.env.FRONTEND_URL,
        },
      );
    }
  }
}
