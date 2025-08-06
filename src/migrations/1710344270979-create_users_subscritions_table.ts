import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUsersSubscritionTable1710344270979 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'users_subscriptions',
            columns: [
                {
                    name: 'id',
                    type: 'int4',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'increment',
                },
                {
                    name: 'subscription_id',
                    type: 'varchar',
                    isNullable: true,
                },
                {
                    name: 'customer',
                    type: 'varchar',
                    isNullable: true,
                },
                {
                    name: 'amount_total',
                    type: 'varchar',
                    isNullable: true,
                },
                {
                    name: 'currency',
                    type: 'varchar',
                    isNullable: true,
                },
                {
                    name: 'expires_at',
                    type: 'varchar',
                    isNullable: true,
                },
                {
                    name: 'invoice',
                    type: 'varchar',
                    isNullable: true,
                },
                {
                    name: 'mode',
                    type: 'varchar',
                    isNullable: true,
                },
                {
                    name: 'customer_email',
                    type: 'varchar',
                    isNullable: true,
                },
                {
                    name: 'price_id',
                    type: 'varchar',
                    isNullable: true,
                },
                {
                    name: 'payment_status',
                    type: 'varchar',
                    isNullable: true,
                },
                {
                    name: 'status',
                    type: 'varchar',
                    isNullable: true,
                },
                {
                    name: 'subscription',
                    type: 'varchar',
                    isNullable: true,
                },
                {
                  name: 'created_at',
                  type: 'timestamptz',
                  isNullable: false,
                  default: 'now()',
                },
                {
                  name: 'updated_at',
                  type: 'timestamptz',
                  isNullable: false,
                  default: 'now()',
                },
            ],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query(`DROP TABLE users_subscriptions`);
    }

}
