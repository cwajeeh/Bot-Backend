import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsersSubscriptionsIdToUsersTable1710346983933 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD "users_subscriptions_id" integer;`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD CONSTRAINT "fk_users_subscriptions" FOREIGN KEY ("users_subscriptions_id") REFERENCES "users_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP CONSTRAINT "fk_users_subscriptions";`
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "users_subscriptions_id";`
        );
    }
}