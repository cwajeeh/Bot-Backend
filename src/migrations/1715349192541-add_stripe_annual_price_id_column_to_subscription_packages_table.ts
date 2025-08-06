import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStripeAnnualPriceidColumnToSubscriptionPackagesTable1715349192541
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription_packages" ADD "stripe_annual_price_id" varchar;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription_packages" DROP COLUMN "stripe_annual_price_id";`,
    );
  }
}
