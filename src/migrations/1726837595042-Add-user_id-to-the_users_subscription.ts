import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserIdToTheUsersSubscription1726837595042 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users_subscriptions" ADD "user_id" integer;`
        );
        await queryRunner.query(
            `ALTER TABLE "users_subscriptions" ADD CONSTRAINT "fk_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users_subscriptions" DROP CONSTRAINT "fk_users";`
        );
        await queryRunner.query(
            `ALTER TABLE "users_subscriptions" DROP COLUMN "user_id";`
        );
    }

}
