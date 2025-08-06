import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPriceToSubscriptionPackagesTable1709651949540 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('subscription_packages', new TableColumn({
            name: 'price',
            type: 'json',
            isNullable: true
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("subscription_packages");

        if (table) {
            await queryRunner.dropColumn("subscription_packages", "price");
        }
    }

}
