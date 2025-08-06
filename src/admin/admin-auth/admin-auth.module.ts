import { Module } from '@nestjs/common';
import { AdminAuthController } from './admin-auth.controller';
import { UsersModule } from 'src/modules/users/users.module';
import { AdminAuthService } from './admin-auth.service';

@Module({
  imports: [UsersModule],
  controllers: [AdminAuthController],
  providers: [AdminAuthService],
})
export class AdminAuthModule {}
