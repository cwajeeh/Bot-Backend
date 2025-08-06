import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { UsersSubscriptionsService } from '../users_subscriptions/users_subscriptions.service';
import { UsersSubscriptionsModule } from '../users_subscriptions/users_subscriptions.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersSubscriptionsEntity } from '../users_subscriptions/users_subscriptions.entity';
import { UsersEntity } from '../users/users.entity';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { SharedModule } from '../shared/shared.module';
import { BotsModule } from '../bots/bots.module';
import { SubscriptionPackagesService } from '../subscription_packages/subscription-packages.service';
import { SubscriptionPackagesModule } from '../subscription_packages/subscription-packages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsersSubscriptionsEntity, UsersEntity]),
    UsersModule,
    UsersSubscriptionsModule,
    SharedModule,
    BotsModule,
    SubscriptionPackagesModule,
  ],
  controllers: [StripeController, StripeWebhookController],
  providers: [StripeService, UsersSubscriptionsService, UsersService],
  exports: [StripeService],
})
export class StripeModule {}
