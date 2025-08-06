import { Controller, Post, Req, Res, HttpStatus } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { UsersSubscriptionsService } from '../users_subscriptions/users_subscriptions.service';
import { UsersService } from '../users/users.service';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('stripe-webhooks')
export class StripeWebhookController {
  constructor(
    private readonly subscriptionService: StripeService,
    private readonly usersSubscriptionsService: UsersSubscriptionsService,
    private readonly usersService: UsersService
  ) {}

  @SkipThrottle()
  @Post()
  async handleWebhook(@Req() request: any, @Res() response: any) {
    const signature = request.headers['stripe-signature'] as string;
    if (!signature) {
      throw new Error('Stripe signature is missing');
    }
    try {
      const event = await this.subscriptionService.constructEvent(
        request.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
      const eventType = event.type as string;
      const eventData = event as unknown as {
        data: {
          object: {
            id: string,
            customer: string,
            amount_total: string,
            currency: string,
            expires_at: string,
            mode: string,
            invoice: string,
            payment_status: string,
            customer_details: {name: string, email: string},
            metadata: {customerEmail: string, priceId: string, customerId: string},
            status: string,
            subscription: string
          }
        }
      };
      switch (eventType) {
        case 'checkout.session.completed':
          if (eventData.data.object.payment_status === 'paid') {
            const payload = {
              subscription_id: eventData.data.object.id,
              customer: eventData.data.object.customer,
              amount_total: eventData.data.object.amount_total,
              currency: eventData.data.object.currency,
              expires_at: eventData.data.object.expires_at,
              invoice: eventData.data.object.invoice,
              mode: eventData.data.object.mode,
              customer_email: eventData.data.object.customer_details.email,
              price_id: eventData.data.object.metadata.priceId,
              payment_status: eventData.data.object.payment_status,
              status: eventData.data.object.status,
              subscription: eventData.data.object.subscription
            }
            const user_subscription = await this.usersSubscriptionsService.create(payload);
            await this.usersSubscriptionsService.assignUserSubscriptionId(eventData.data.object.metadata.customerEmail, user_subscription)
          }
          break;
      }

      response.status(HttpStatus.OK).send({ received: true });
    } catch (err) {
      response
        .status(HttpStatus.BAD_REQUEST)
        .send(`Webhook Error: ${err.message}`);
    }
  }

  private extractSignatureHeader(res: any): string {
    const signature = res.headers['stripe-signature'] as string;
    if (!signature) {
      throw new Error('Stripe signature is missing');
    }
    return signature;
  }
}
