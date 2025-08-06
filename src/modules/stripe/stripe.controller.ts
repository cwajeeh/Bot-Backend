import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CreateCheckoutSessionDTO } from './dto/create-checkout-session.dto';
import {
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { ROLES_ENUM } from '../roles/roles.enum';
import { UsersService } from '../users/users.service';
import { UpdateSubscriptionDTO } from './dto/update-subscription.dto';

@ApiTags('Stripe')
@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly usersService: UsersService,
  ) {}

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ROLES_ENUM.ADMIN, ROLES_ENUM.USER)
  @HttpCode(HttpStatus.OK)
  @Post('create-checkout-session')
  @ApiOkResponse({ description: 'Checkout session created successfully.' })
  @ApiBadRequestResponse({ description: 'Bad Request.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async createCheckoutSession(
    @Request() req,
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDTO,
  ) {
    const session = await this.stripeService.createCheckoutSession(
      req,
      createCheckoutSessionDto.priceId,
      createCheckoutSessionDto.successUrl,
      createCheckoutSessionDto.cancelUrl,
    );
    if (session?.url) {
      return { url: session.url };
    } else {
      return { url: '/' };
    }
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ROLES_ENUM.ADMIN, ROLES_ENUM.USER)
  @HttpCode(HttpStatus.OK)
  @Post('update-subscription')
  @ApiOkResponse({ description: 'Subscription updated successfully.' })
  @ApiBadRequestResponse({ description: 'Bad Request.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async updateSubscription(
    @Request() req,
    @Body() updateSubscriptionDto: UpdateSubscriptionDTO,
  ) {
    await this.stripeService.updateSubscription(
      req,
      updateSubscriptionDto.priceId,
      updateSubscriptionDto.successUrl,
      updateSubscriptionDto.cancelUrl,
    );
    return { message: 'Subscription updated successfully.' };
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ROLES_ENUM.ADMIN, ROLES_ENUM.USER)
  @HttpCode(HttpStatus.OK)
  @Post('cancel-subscription')
  @ApiOkResponse({ description: 'Subscription updated successfully.' })
  @ApiBadRequestResponse({ description: 'Bad Request.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  async cancelSubscription(@Request() req) {
    await this.stripeService.cancelSubscription(req);
    return { message: 'Subscription cancelled successfully.' };
  }
}
