import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { BotsModule } from './modules/bots/bots.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeModule } from './modules/stripe/stripe.module';
import { SubscriptionPackagesModule } from './modules/subscription_packages/subscription-packages.module';

import typeorm from './config/typeorm';
import { UsersSubscriptionsModule } from './modules/users_subscriptions/users_subscriptions.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BotConversationsModule } from './modules/bot_conversations/bot_conversations.module';
import { AdminAuthModule } from './admin/admin-auth/admin-auth.module';
import { UserManagementController } from './admin/user-management/user-management.controller';
import { UserManagementService } from './admin/user-management/user-management.service';
import { UserManagementModule } from './admin/user-management/user-management.module';
import { ScheduleModule } from '@nestjs/schedule';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeorm],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        configService.get('typeorm'),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    RolesModule,
    BotsModule,
    StripeModule,
    SubscriptionPackagesModule,
    UsersSubscriptionsModule,
    IntegrationsModule,
    ThrottlerModule.forRoot([
      {
        name: 'long',
        ttl: 60000,
        limit: 30000,
      },
    ]),
    BotConversationsModule,
    AdminAuthModule,
    UserManagementModule,
  ],
  controllers: [AppController, UserManagementController],
  providers: [AppService, UserManagementService],
})
export class AppModule {}
