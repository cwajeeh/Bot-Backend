import { Module } from '@nestjs/common';
import { UsersSubscriptionsService } from '../users_subscriptions/users_subscriptions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersSubscriptionsEntity } from './users_subscriptions.entity';
import { SubscriptionPackagesModule } from '../subscription_packages/subscription-packages.module';
import { SharedModule } from '../shared/shared.module';
import { UsersSubscriptionsController } from './users_subscriptions.controller';
import { UsersModule } from '../users/users.module';
import { BotsModule } from '../bots/bots.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([UsersSubscriptionsEntity]),
    SubscriptionPackagesModule,
    SharedModule,
    UsersModule,
    BotsModule
  ],
  controllers:[UsersSubscriptionsController],
  providers: [UsersSubscriptionsService],
  exports: [UsersSubscriptionsService],
})
export class UsersSubscriptionsModule {}
