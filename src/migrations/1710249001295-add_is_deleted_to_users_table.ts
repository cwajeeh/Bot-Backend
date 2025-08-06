import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddIsDeletedToUsersTable1710249001295 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('users', new TableColumn({
            name: 'is_deleted',
            type: 'boolean',
            isNullable: true
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("users");

        if (table) {
            await queryRunner.dropColumn("users", "is_deleted");
        }
    }

}
