import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddRoleIdColumnToUsersTable1706115320140 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('users', new TableColumn({
            name: 'role_id',
            type: 'int4',
            isNullable: true
        }));

        await queryRunner.createForeignKey("users", new TableForeignKey({
            columnNames: ["role_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "roles",
            onDelete: "CASCADE"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("users");

        if (table) {
            const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("role_id") !== -1);
            if (foreignKey) {
                await queryRunner.dropForeignKey("users", foreignKey);
            }
            await queryRunner.dropColumn("users", "role_id");
        }
    }

}
