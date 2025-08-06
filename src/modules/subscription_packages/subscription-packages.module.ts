import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPackagesController } from './subscription-packages.controller';
import { SubscriptionPackagesService } from './subscription-packages.service';
import { SubscriptionPackagesEntity } from './subscription-packages.entity';

@Module({
  providers: [SubscriptionPackagesService],
  controllers: [SubscriptionPackagesController],
  imports: [TypeOrmModule.forFeature([SubscriptionPackagesEntity])],
  exports: [SubscriptionPackagesService],
})
export class SubscriptionPackagesModule {}
