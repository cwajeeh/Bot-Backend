import { Module, forwardRef } from '@nestjs/common';
import { BotsService } from './bots.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { BotsController } from './bots.controller';
import { jwtConstants } from '../auth/constants';
import { SharedModule } from '../shared/shared.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotsEntity } from './bots.entity';
import { BotSources } from './bot-sources.entity';
import { UsersService } from '../users/users.service';
import { SubscriptionPackagesService } from '../subscription_packages/subscription-packages.service';
import { SubscriptionPackagesEntity } from '../subscription_packages/subscription-packages.entity';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '86400s' },
    }),
    SharedModule,
    TypeOrmModule.forFeature([
      BotsEntity,
      BotSources,
      SubscriptionPackagesEntity,
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [BotsController],
  providers: [BotsService, SubscriptionPackagesService],
  exports: [BotsService],
})
export class BotsModule {}
