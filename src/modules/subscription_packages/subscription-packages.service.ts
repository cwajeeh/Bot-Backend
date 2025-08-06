import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPackagesEntity } from './subscription-packages.entity';

@Injectable()
export class SubscriptionPackagesService {
  constructor(
    @InjectRepository(SubscriptionPackagesEntity)
    private subscriptionPackagesRepository: Repository<SubscriptionPackagesEntity>,
  ) {}

  findAll(): Promise<SubscriptionPackagesEntity[]> {
    return this.subscriptionPackagesRepository.find({
      order: {
        id: 'ASC', // 'DESC' for descending order
      },
    });
  }

  async findOneByPriceId(
    price_id: string,
  ): Promise<SubscriptionPackagesEntity | null> {
    return await this.subscriptionPackagesRepository
      .createQueryBuilder('subscription')
      .where(
        'subscription.stripe_price_id = :price_id OR subscription.stripe_annual_price_id = :price_id',
        { price_id },
      )
      .getOne();
  }
}
