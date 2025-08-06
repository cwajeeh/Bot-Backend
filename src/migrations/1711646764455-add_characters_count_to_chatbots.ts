import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCharactersCountToChatbots1711646764455 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "bots" ADD "characters_count" integer;`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "bots" DROP COLUMN "characters_count";`
        );
    }

}
