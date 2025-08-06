import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRemainingMsgCreditsAndTotalMsgCreditsColumnToUserSubscriptionTable1718920750600
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(`ALTER TABLE public.users_subscriptions
      ADD COLUMN remaining_msg_credits INT NULL,
            ADD COLUMN total_msg_credits INT NULL;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(`ALTER TABLE public.users_subscriptions
                DROP COLUMN remaining_msg_credits INT NULL,
                DROP COLUMN total_msg_credits INT NULL;`);
  }
}
