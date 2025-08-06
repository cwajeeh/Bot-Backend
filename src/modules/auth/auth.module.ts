import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';
import { SharedModule } from '../shared/shared.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPackagesEntity } from '../subscription_packages/subscription-packages.entity';
import { SubscriptionPackagesModule } from '../subscription_packages/subscription-packages.module';
import { SubscriptionPackagesService } from '../subscription_packages/subscription-packages.service';
@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '86400s' },
    }),
    SharedModule,
    TypeOrmModule.forFeature([SubscriptionPackagesEntity]), 
    SubscriptionPackagesModule
  ],
  providers: [AuthService, SubscriptionPackagesService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
