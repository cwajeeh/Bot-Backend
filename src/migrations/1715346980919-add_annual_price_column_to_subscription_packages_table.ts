import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnnualPriceColumnToSubscriptionPackagesTable1715346980919
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription_packages" ADD "annual_price" jsonb;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription_packages" DROP COLUMN "annual_price";`,
    );
  }
}
