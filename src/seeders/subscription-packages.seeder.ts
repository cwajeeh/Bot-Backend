import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { SubscriptionPackagesEntity } from '../modules/subscription_packages/subscription-packages.entity';
import { StripeService } from '../modules/stripe/stripe.service';
import { ConfigService } from '@nestjs/config';
import {
  SUBSCRIPTION_FEATURES,
  SUBSCRIPTION_FEATURES_METADATA,
} from 'src/common/constants/subscription_features.constants';

export default class SubscriptionPackagesSeeder implements Seeder {
  private stripeService: StripeService;

  constructor() {
    const configService = new ConfigService(process.env);
    this.stripeService = new StripeService(configService);
  }

  public async run(dataSource: DataSource): Promise<void> {
    await dataSource.query(
      'TRUNCATE "subscription_packages" RESTART IDENTITY CASCADE;',
    );

    const products = await this.stripeService.getProductList();

    const repository = dataSource.getRepository(SubscriptionPackagesEntity);

    let subscriptionPackages = products.data.map((product) => {
      return {
        name: product.name,
        stripe_annual_price_id: product.prices[0].id,
        stripe_price_id: product.prices[1].id,
        features: {
          ...SUBSCRIPTION_FEATURES[product.name],
        },
        features_metadata: SUBSCRIPTION_FEATURES_METADATA[product.name],
        annual_price: {
          unit_amount: product.prices[0].unit_amount,
          unit_amount_decimal: product.prices[0].unit_amount_decimal,
          recurring: product.prices[0].recurring,
        },
        price: {
          unit_amount: product.prices[1].unit_amount,
          unit_amount_decimal: product.prices[1].unit_amount_decimal,
          recurring: product.prices[1].recurring,
        },
      };
    });

    subscriptionPackages = subscriptionPackages.sort(
      (a, b) => a.price.unit_amount - b.price.unit_amount,
    );

    await repository.save(subscriptionPackages);
  }
}
