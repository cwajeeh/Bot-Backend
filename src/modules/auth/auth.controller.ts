import {
  Body,
  Controller,
  Get,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiConflictResponse,
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { AuthService } from './auth.service';
import { SignInDTO } from './dto/signIn.dto';
import { RegisterDTO } from './dto/register.dto';
import {
  forgotPasswordDTO,
  ResetPasswordDTO,
  VerifyUserDTO,
} from './dto/user.dto';
import { SignInResponseDTO } from './dto/signIn-response.dto';
import { RegisterResponseDTO } from './dto/register-response.dto';
import { Roles } from '../roles/roles.decorator';
import { ROLES_ENUM } from '../roles/roles.enum';
import { UpdateProfileDTO } from './dto/update-profile.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ long: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOkResponse({ description: 'User authorized.', type: SignInResponseDTO })
  @ApiNotFoundResponse({ description: 'User not found.' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  signIn(@Body() signInDto: SignInDTO) {
    return this.authService.signIn(signInDto);
  }

  @Throttle({ long: { limit: 1, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('register')
  @ApiOkResponse({ description: 'User registered.', type: RegisterResponseDTO })
  @ApiConflictResponse({ description: 'User Already Exists.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error.' })
  register(@Body() registerDto: RegisterDTO) {
    return this.authService.register(registerDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Get('profile')
  @Roles(ROLES_ENUM.ADMIN, ROLES_ENUM.USER)
  @ApiUnauthorizedResponse({
    description: 'Not Authorized to access this endpoint.',
  })
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.email);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Patch('update-profile')
  @Roles(ROLES_ENUM.ADMIN, ROLES_ENUM.USER)
  @ApiUnauthorizedResponse({
    description: 'Not Authorized to access this endpoint.',
  })
  updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDTO) {
    return this.authService.updateProfile(req.user.email, updateProfileDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Delete('delete-profile')
  @Roles(ROLES_ENUM.ADMIN, ROLES_ENUM.USER)
  @ApiUnauthorizedResponse({
    description: 'Not Authorized to access this endpoint.',
  })
  deleteProfile(@Request() req) {
    return this.authService.deleteProfile(req.user.email);
  }

  @Throttle({ long: { limit: 1, ttl: 60000 } })
  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: forgotPasswordDTO) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  resetPassword(@Body() resetPasswordDTO: ResetPasswordDTO) {
    return this.authService.resetPassword(resetPasswordDTO);
  }

  @Post('verify')
  verifyUser(@Body() verifyUserDTO: VerifyUserDTO) {
    return this.authService.verifyUser(verifyUserDTO);
  }
}
