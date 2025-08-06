import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import { UsersModule } from 'src/modules/users/users.module';
import { UserManagementController } from './user-management.controller';
import { UserManagementService } from './user-management.service';
import { StripeService } from 'src/modules/stripe/stripe.service';
import { StripeModule } from 'src/modules/stripe/stripe.module';

@Module({
  imports: [UsersModule, StripeModule],
  controllers: [UserManagementController],
  providers: [UserManagementService],
})
export class UserManagementModule {}
