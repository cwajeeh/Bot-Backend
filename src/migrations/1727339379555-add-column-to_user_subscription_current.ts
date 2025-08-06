import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnToUserSubscriptionCurrent1727339379555 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users_subscriptions 
            ADD COLUMN current BOOLEAN NOT NULL DEFAULT true
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users_subscriptions 
            DROP COLUMN current
        `);
    }

}
