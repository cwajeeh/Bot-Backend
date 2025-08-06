import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateSubscriptionPackagesTable1709035681878 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'subscription_packages',
            columns: [
                {
                    name: 'id',
                    type: 'int',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'increment',
                },
                {
                    name: 'name',
                    type: 'varchar',
                    isNullable: false,
                },
                {
                    name: 'stripe_price_id',
                    type: 'varchar',
                    isNullable: false,
                },
                {
                    name: 'features',
                    type: 'json',
                    isNullable: true,
                },
                {
                    name: 'features_metadata',
                    type: 'json',
                    isNullable: true,
                },
            ],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('subscription_packages');
    }
}