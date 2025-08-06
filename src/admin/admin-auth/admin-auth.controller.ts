import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminAuthService } from './admin-auth.service';
import { SignInDTO } from './dto/signIn.dto';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import { RolesGuard } from 'src/modules/roles/roles.guard';
import { Roles } from 'src/modules/roles/roles.decorator';
import { UpdateProfileDTO } from './dto/update-profile.dto';
import { ROLES_ENUM } from 'src/modules/roles/roles.enum';
import { RequestWithUserDto } from '../common/dto/request-with-user.dto';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private adminAuthService: AdminAuthService) {}

  @Throttle({ long: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: SignInDTO) {
    return this.adminAuthService.signIn(signInDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Throttle({ long: { limit: 5, ttl: 60000 } })
  @Patch('update-profile')
  @Roles(ROLES_ENUM.ADMIN)
  updateProfile(
    @Request() req: RequestWithUserDto,
    @Body() updateProfileDto: UpdateProfileDTO,
  ) {
    return this.adminAuthService.updateProfile(
      req.user.email,
      updateProfileDto,
    );
  }
}
