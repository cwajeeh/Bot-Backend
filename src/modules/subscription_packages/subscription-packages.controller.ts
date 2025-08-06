import { Controller, Get, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { SubscriptionPackagesService } from './subscription-packages.service';
import { ApiTags, ApiBearerAuth, } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { ROLES_ENUM } from '../roles/roles.enum';

@ApiTags('Subscription Packages')
@Controller('subscription-packages')
export class SubscriptionPackagesController {
  constructor(private readonly subscriptionPackagesService: SubscriptionPackagesService) {}

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ROLES_ENUM.ADMIN, ROLES_ENUM.USER)
  @HttpCode(HttpStatus.OK)
  @Get('')
  async createCheckoutSession() {
    return this.subscriptionPackagesService.findAll();
  }

}