import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SignInResponseDTO } from './dto/signIn-response.dto';
import { RegisterResponseDTO } from './dto/register-response.dto';
import { RegisterDTO } from './dto/register.dto';
import { UpdateProfileDTO } from './dto/update-profile.dto';
import {
  forgotPasswordDTO,
  forgotPasswordResp,
  ResetPasswordDTO,
  VerifyUserDTO,
} from './dto/user.dto';
import { SignInDTO } from './dto/signIn.dto';
import { EmailService } from '../shared/email.service';
import { CommonService } from '../shared/common.service';
import { SubscriptionPackagesService } from '../subscription_packages/subscription-packages.service';
import { ROLES_ENUM } from '../roles/roles.enum';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private commonService: CommonService,
    private subscriptionPackagesService: SubscriptionPackagesService,
  ) {}

  async getProfile(emailPayload: string): Promise<object> {
    const user = await this.usersService.findOneByEmail(emailPayload);

    if (!user) {
      throw new UnauthorizedException();
    }

    let subscription = null;
    const { id, email, first_name, last_name, role, user_subscriptions } = user;
    if (user_subscriptions[0]?.id) {
      subscription = await this.subscriptionPackagesService.findOneByPriceId(
        user_subscriptions[0]?.price_id,
      );
    }

    return {
      user: {
        id,
        email,
        first_name,
        last_name,
        role,
        users_subscription_price_id: user_subscriptions[0]?.price_id,
        users_subscription_id: user_subscriptions[0]?.id,
        subscription,
        created_at:user_subscriptions[0]?.created_at,
        total_remaining_msg_credits:user.total_remaining_msg_credits,
        total_msg_credits:user.total_msg_credits
      },
      access_token: await this.jwtService.signAsync({
        id,
        email,
        role,
        subscription,
      }),
    };
  }

  async signIn(request: SignInDTO): Promise<SignInResponseDTO> {
    const user = await this.usersService.signIn(request);
    let subscription = null;
    if (!user) {
      throw new UnauthorizedException();
    }

    const { id, email, first_name, last_name, role, user_subscriptions } = user;

    if (role.name === ROLES_ENUM.ADMIN) {
      throw new UnauthorizedException(
        'User with this role is not allowed to login here',
      );
    }

    if (user_subscriptions[0]?.id) {
      subscription = await this.subscriptionPackagesService.findOneByPriceId(
        user_subscriptions[0]?.price_id,
      );
    }
    return {
      user: { id, email, first_name, last_name, role, subscription },
      access_token: await this.jwtService.signAsync({
        id,
        email,
        role,
        subscription,
      }),
    };
  }

  async register(request: RegisterDTO): Promise<RegisterResponseDTO> {
    // generate OTP
    const randomDigitCode = this.commonService.randomDigits(6);
    request.verify_user_token = randomDigitCode;
    // save user
    console.log('here')
    const user = await this.usersService.create(request);

    if (!user) {
      throw new InternalServerErrorException();
    }

    // send register Email to user
    this.emailService.sendEmail(
      user.email,
      'User Registration',
      'user_registered',
      {
        first_name: user.first_name,
        email: user.email,
        code: randomDigitCode,
        domain: process.env.FRONTEND_URL,
      },
    );

    return {
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    };
  }

  async forgotPassword(
    request: forgotPasswordDTO,
  ): Promise<forgotPasswordResp> {
    await this.usersService.forGotPassword(request);
    return {
      message: 'Forgot Password email sent to your account',
    };
  }

  async resetPassword(request: ResetPasswordDTO): Promise<forgotPasswordResp> {
    await this.usersService.resetPassword(request);
    return {
      message: 'Password has been reset successfully!',
    };
  }

  async verifyUser(request: VerifyUserDTO): Promise<object> {
    await this.usersService.verifyUser(request);

    return {
      message: 'User has been verified successfully!',
    };
  }

  async updateProfile(
    email: string,
    request: UpdateProfileDTO,
  ): Promise<object> {
    const { current_password: temp_pass, password } = request; //request is being mutated inside updateProfile function -> losing password
    await this.usersService.updateProfile(email, request);

    const { user, access_token } = await this.signIn({
      email,
      password: password || temp_pass,
    });
    return {
      message: 'User has been updated!',
      user,
      access_token,
    };
  }

  async deleteProfile(email: string): Promise<object> {
    await this.usersService.deleteProfile(email);

    return {
      message: 'User has been delete!',
    };
  }
}
