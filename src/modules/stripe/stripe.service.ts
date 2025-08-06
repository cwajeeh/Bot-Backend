import {
  HttpException,
  HttpStatus,
  Injectable,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Product, ProductList } from './dto/product-list.dto';
import { UsersService } from '../users/users.service';
import { UsersSubscriptionsService } from '../users_subscriptions/users_subscriptions.service';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  usersService: UsersService;
  usersSubscriptionsService: UsersSubscriptionsService;

  async constructEvent(
    payload: Buffer,
    sig: string,
    secret: string,
  ): Promise<Stripe.Event> {
    return Stripe.webhooks.constructEvent(payload, sig, secret);
  }

  constructor(
    private configService: ConfigService,
    @Optional() usersService?: UsersService,
    @Optional() usersSubscriptionsService?: UsersSubscriptionsService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_API_KEY, {
      apiVersion: '2023-10-16',
    });
    if (usersService) {
      this.usersService = usersService;
    }
    if (usersSubscriptionsService) {
      this.usersSubscriptionsService = usersSubscriptionsService;
    }
  }

  setUsersService(usersService: UsersService) {
    this.usersService = usersService;
  }

  setUsersSubscriptionService(
    usersSubscriptionsService: UsersSubscriptionsService,
  ) {
    this.usersSubscriptionsService = usersSubscriptionsService;
  }

  async createSubscription(customerId: string, priceId: string) {
    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
    });
  }

  /*
  Return Example:
  {
    "object": "list",
    "data": [
      {
        "id": "prod_Pd5vusGrSO29Io",
        "object": "product",
        "active": true,
        "attributes": [],
        "created": 1708898407,
        "default_price": null,
        "description": null,
        "features": [],
        "images": [],
        "livemode": false,
        "metadata": {
          "Limit": "10000"
        },
        "name": "PRO",
        "package_dimensions": null,
        "shippable": null,
        "statement_descriptor": null,
        "tax_code": null,
        "type": "service",
        "unit_label": null,
        "updated": 1709035413,
        "url": null
      }
    ],
    "has_more": false,
    "url": "/v1/products"
  }
  */
  async getProductList(): Promise<ProductList> {
    try {
      const products = await this.stripe.products.list({
        active: true,
      });

      const enrichedProducts: Product[] = await Promise.all(
        products.data.map(async (product): Promise<Product> => {
          const prices = await this.stripe.prices.list({
            product: product.id,
          });
          return { ...product, prices: prices.data } as unknown as Product; // Explicit type assertion
        }),
      );

      return {
        ...products,
        data: enrichedProducts,
      } as ProductList;
    } catch (error) {
      throw new Error(
        `Failed to retrieve products and prices: ${error.message}`,
      );
    }
  }

  async createCheckoutSession(
    request: { user: { id: number; email: string } },
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    const customerEmail = request.user.email;

    // // Check if user already has a subscription
    // if (await this.usersService.getUserSubscription(customerEmail)) {
    //   throw new HttpException(
    //     'Subscription already assigned.',
    //     HttpStatus.FORBIDDEN,
    //   );
    // }

    let customer;

    // Try to retrieve the customer by email
    const existingCustomers = await this.stripe.customers.list({
      email: customerEmail,
    });
    if (existingCustomers.data.length === 0) {
      // If no customer exists, create a new one
      customer = await this.stripe.customers.create({ email: customerEmail });
    } else {
      // Use the first matching customer
      customer = existingCustomers.data[0];
    }

    // Check if the price ID corresponds to a $0 subscription
    const price = await this.stripe.prices.retrieve(priceId);
    if (price.unit_amount === 0) {
      // Directly create the subscription without a payment method
      const subscriptionCreated = this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
      });

      const payload = {
        subscription_id: (await subscriptionCreated).id,
        customer: customer.id,
        amount_total: '0',
        currency: (await subscriptionCreated).currency,
        expires_at: null,
        invoice: (await subscriptionCreated).latest_invoice.toString(),
        mode: (await subscriptionCreated).livemode ? 'true' : 'false', // Convert boolean to string
        customer_email: customerEmail,
        price_id: (await subscriptionCreated)['plan']['id'],
        payment_status: 'paid',
        status: (await subscriptionCreated).status,
        subscription: (await subscriptionCreated).id,
      };
      const user_subscription =
        await this.usersSubscriptionsService.create(payload);
    } else {
      // For paid subscriptions, proceed to checkout session creation as before
      return this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: customerEmail,
        metadata: {
          customerId: customer.id,
          customerEmail,
          priceId,
        },
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        payment_method_collection: 'if_required',
      });
    }
  }

  async updateSubscription(
    request: { user: { id: number; email: string } },
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    const { id: customerId, email: customerEmail } = request.user;
  
    // Fetch the user's current subscription
    const customerSubscription = await this.usersService.getUserSubscription(customerEmail);
    if (!customerSubscription) {
      throw new HttpException('No Subscription Found!', HttpStatus.FORBIDDEN);
    }
  
    // Retrieve the current subscription from Stripe
    const subscription = await this.stripe.subscriptions.retrieve(customerSubscription.subscription);
  
    // If the subscription has no default payment method
    if (!subscription?.default_payment_method) {
      // Handle no payment method case
      const price = await this.stripe.prices.retrieve(priceId);
      if (price.unit_amount === 0) {
        // Update subscription directly for free plans
        const subscriptionUpdated = await this.updateSubscriptionOnStripe(
          customerSubscription.subscription,
          subscription.items.data[0].id,
          priceId
        );
  
        await this.updateUserSubscriptionInDB(subscriptionUpdated, customerEmail,customerSubscription.id);
      } else {
        // Create a Stripe Checkout session to collect payment
        const session = await this.initiateCheckoutSession(
          priceId, customerEmail, customerId, successUrl, cancelUrl, subscription.id
        );
  
        // Redirect the user to the Stripe Checkout page
        throw new HttpException({ url: session.url }, HttpStatus.TEMPORARY_REDIRECT);
      }
    } else {
      // Update the subscription for paid plans with existing payment methods
      const subscriptionUpdated = await this.updateSubscriptionOnStripe(
        customerSubscription.subscription,
        subscription.items.data[0].id,
        priceId
      );
  
      await this.updateUserSubscriptionInDB(subscriptionUpdated, customerEmail,customerSubscription.id);
    }
  }
  
  // Helper method to update subscription on Stripe
  private async updateSubscriptionOnStripe(
    subscriptionId: string,
    itemId: string,
    priceId: string,
  ) {
    return await this.stripe.subscriptions.update(subscriptionId, {
      items: [{ id: itemId, price: priceId }],
    });
  }
  
  // Helper method to create Stripe Checkout session (renamed)
  private async initiateCheckoutSession(
    priceId: string,
    customerEmail: string,
    customerId: number,
    successUrl: string,
    cancelUrl: string,
    subscriptionId: string,
  ) {
    return await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: customerEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { subscription_id: subscriptionId, customerId, customerEmail, priceId },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  }
  
  // Helper method to update user subscription details in the database
  private async updateUserSubscriptionInDB(subscription: any, customerEmail: string,prvsSubscription:number) {
    await this.usersSubscriptionsService.update(prvsSubscription, {
      subscription_id: subscription.id,
      customer: String(subscription.customer),
      amount_total: String(subscription.items.data[0].price.unit_amount),
      currency: subscription.currency,
      expires_at: String(subscription.current_period_end),
      invoice: subscription.latest_invoice.toString(),
      mode: subscription.object,
      customer_email: customerEmail,
      price_id: subscription.items.data[0].price.id,
      payment_status: 'paid',
      status: subscription.status,
      subscription: subscription.id,
    });
  }
  

  async cancelSubscription(request: { user: { id: number; email: string } }) {
    const customerEmail = request.user.email;
    const customerSubscription =
      await this.usersService.getUserSubscription(customerEmail);

    if (!customerSubscription) {
      throw new HttpException('No Subscription Found!', HttpStatus.FORBIDDEN);
    }

    const subscriptionCancelled = await this.stripe.subscriptions.cancel(
      customerSubscription.subscription,
    );

    if (subscriptionCancelled) {
      await this.usersService.cancelUserSubscription(customerEmail);
    }
  }

  public getStripeWebhookSecret(): string {
    return this.configService.get(
      'STRIPE_CONFIG.webhookConfig.stripeSecrets.account',
    );
  }

  async getPaymentsForCustomer(customerId: string) {
    // Fetch invoices for the customer
    const invoices = await this.stripe.invoices.list({
      customer: customerId,
    });

    return { invoices }; // Or return any specific data you need
  }
}
