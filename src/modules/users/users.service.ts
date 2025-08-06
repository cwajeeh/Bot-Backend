import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UsersEntity } from './users.entity';
import * as bcrypt from 'bcrypt';

import { SignInDTO } from '../auth/dto/signIn.dto';
import { RegisterDTO } from '../auth/dto/register.dto';
import {
  forgotPasswordDTO,
  ResetPasswordDTO,
  VerifyUserDTO,
} from '../auth/dto/user.dto';
import { EmailService } from '../shared/email.service';
import { CommonService } from '../shared/common.service';
import { UpdateProfileDTO } from '../auth/dto/update-profile.dto';
import { UsersSubscriptionsEntity } from '../users_subscriptions/users_subscriptions.entity';
import { BotsService } from '../bots/bots.service';
import { ROLES_ENUM } from '../roles/roles.enum';
import { SUBSCRIPTION_FEATURES_METADATA } from 'src/common/constants/subscription_features.constants';
import {
  PaginatedUsers,
  UserWithCurrentPlan,
} from './interfaces/users.interface';
import { GetUsersDto } from './dtos/get-users.dto';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersEntity)
    private usersRepository: Repository<UsersEntity>,
    private emailService: EmailService,
    private commonService: CommonService,
    private botsService: BotsService,
  ) {}

  async comparePasswords(
    userPassword: string,
    currentPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(currentPassword, userPassword);
  }

  async findOneByEmail(email: string): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['user_subscriptions'],
    });

    let total_remaining_msg_credits = 0;
    let total_msg_credits = 0;
    if (user) {
      const currentDate = new Date();

      user.user_subscriptions.forEach((sub) => {
        if (sub.status !== 'expired') {
          total_remaining_msg_credits =
            total_remaining_msg_credits + sub.remaining_msg_credits;
          total_msg_credits = total_msg_credits + sub.total_msg_credits;
        }
      });

      // Step 2: Filter the subscriptions based on their status and expiration
      const currentSubscription = user.user_subscriptions.find(
        (sub) => sub.current === true,
      );
      user.user_subscriptions = [currentSubscription];
    }
    return { ...user, total_remaining_msg_credits, total_msg_credits };
  }

  async signIn(request: SignInDTO): Promise<UsersEntity> {
    const user = await this.findOneByEmail(request.email);

    if (!user.id || user.is_deleted) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!user.is_active) {
      throw new HttpException('User not active', HttpStatus.NOT_FOUND);
    }

    const areEqual: boolean = await this.comparePasswords(
      user.password,
      request.password,
    );

    if (!areEqual) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }

  async create(request: RegisterDTO): Promise<UsersEntity> {
    const userInDb: UsersEntity = await this.findOneByEmail(request.email);

    if (userInDb?.id) {
      if (userInDb.is_deleted) {
        // The user was previously deleted, reactivate the account
        userInDb.is_deleted = false;
        userInDb.is_active = false;
        userInDb.verify_user_token = request.verify_user_token;
        // Optionally, update any other fields that are relevant upon reactivation
        // For example, if you have fields for deactivation date or reason, clear or update them here

        // Save the updated user entity
        await this.usersRepository.save(userInDb);

        // Return the reactivated user
        return userInDb;
      } else {
        // The user exists and is not deleted, throw a conflict exception
        throw new HttpException(
          'User email already exists',
          HttpStatus.CONFLICT,
        );
      }
    }

    if (userInDb?.id) {
      throw new HttpException('User email already exists', HttpStatus.CONFLICT);
    }

    const userWithEmailInDb: UsersEntity = await this.findOneByEmail(
      request.email,
    );

    if (userWithEmailInDb?.id) {
      throw new HttpException('Email already exists', HttpStatus.CONFLICT);
    }

    const user: UsersEntity = this.usersRepository.create({
      ...request,
      role: { id: 2 },
    });

    await this.usersRepository.save(user);

    return user;
  }

  async forGotPassword(request: forgotPasswordDTO): Promise<string | null> {
    const { email } = request;
    const user: UsersEntity = await this.findOneByEmail(email);

    if (!user.id) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!user.is_active) {
      throw new HttpException(
        'User account is not active.',
        HttpStatus.FORBIDDEN,
      );
    }

    const randomDigitCode = this.commonService.randomDigits(6);
    // update user reset password token
    user.password_reset_token = randomDigitCode;
    await this.usersRepository.save(user);

    return await this.emailService.sendEmail(
      email,
      'Password Reset',
      'reset_password',
      {
        email,
        first_name: user.first_name,
        code: randomDigitCode,
        domain: process.env.FRONTEND_URL,
      },
    );
  }

  async resetPassword(request: ResetPasswordDTO): Promise<object | null> {
    const { email, token, password } = request;
    const user: UsersEntity = await this.findOneByEmail(email);

    if (!user.id) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!user.is_active) {
      throw new HttpException(
        'User account is not active.',
        HttpStatus.FORBIDDEN,
      );
    }

    if (user.password_reset_token !== token) {
      throw new HttpException('Token not matched!', HttpStatus.FORBIDDEN);
    }

    const newPassword = await bcrypt.hash(password, 10);
    user.password = newPassword;
    user.password_reset_token = null;
    return await this.usersRepository.save(user);
  }

  async updateProfile(
    email: string,
    request: UpdateProfileDTO,
  ): Promise<UsersEntity | null> {
    const user: UsersEntity = await this.findOneByEmail(email);

    if (!user.id) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!user.is_active) {
      throw new HttpException(
        'User account is not active.',
        HttpStatus.FORBIDDEN,
      );
    }

    //validating password
    const isPasswordMatch = await bcrypt.compare(
      request.current_password,
      user.password,
    );
    if (!isPasswordMatch) {
      throw new HttpException(
        'Current password is wrong',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Password and confirm_password validation
    if (
      (request.password && request.password !== request.confirm_password) ||
      (!request.password && request.confirm_password)
    ) {
      throw new HttpException('Passwords do not match', HttpStatus.BAD_REQUEST);
    }

    if (
      !request?.first_name &&
      !request?.last_name &&
      !request?.password &&
      !request?.confirm_password
    ) {
      throw new HttpException(
        'Please provide at least one field',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (request.password) {
      const saltOrRounds = 10;
      const hashedPassword = await bcrypt.hash(request.password, saltOrRounds);
      request.password = hashedPassword;
      delete request.confirm_password; // confirm_password is no longer needed
      delete request.current_password;
    } else {
      // Ensure password fields are not unintentionally updated
      delete request.password;
      delete request.confirm_password;
      delete request.current_password;
    }
    Object.assign(user, request);

    return await this.usersRepository.save(user);
  }

  async assignUserSubscriptionId(
    email,
    user_subscription,
  ): Promise<object | null> {
    const user: UsersEntity = await this.findOneByEmail(email);
    if (!user.id) {
      throw new Error('User not found');
    }
    if (!user.is_active) {
      throw new Error('User is inactive');
    }
    user_subscription.user_id = user.id;
    return await this.usersRepository.save(user);
  }

  async getUserSubscription(email: string): Promise<UsersSubscriptionsEntity | null> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.user_subscriptions', 'subscription', 'subscription.current = :current', {
        current: true,
      })
      .where('user.email = :email', { email })
      .getOne();
  
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
  
    // Since the query already filtered for `current: true`, there's no need to filter again
    const activeSubscription = user.user_subscriptions?.[0] || null;
  
    return activeSubscription;
  } 

  async cancelUserSubscription(email: string): Promise<void> {
    const user: UsersEntity = await this.usersRepository.findOne({
      where: { email },
      relations: ['user_subscriptions'],
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!user.user_subscriptions.length) {
      throw new HttpException(
        'User does not have a subscription',
        HttpStatus.BAD_REQUEST,
      );
    }

    user.user_subscriptions = null;

    await this.usersRepository.save(user);
  }

  async deleteProfile(email: string): Promise<object> {
    const user: UsersEntity = await this.findOneByEmail(email);
    console.log('222');
    if (!user.id) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!user.is_active) {
      throw new HttpException('User is inactive', HttpStatus.BAD_REQUEST);
    }

    const userSubscription: UsersSubscriptionsEntity =
      await this.getUserSubscription(email);
    if (userSubscription && userSubscription.amount_total === '0') {
      await this.botsService.deleteAssociatedBots(user.id);
    }

    user.is_deleted = true;

    return await this.usersRepository.save(user);
  }

  async verifyUser(request: VerifyUserDTO): Promise<object | null> {
    const { email, token } = request;
    const user: UsersEntity = await this.findOneByEmail(email);

    if (!user.id) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (user.is_active) {
      throw new HttpException('User is already active', HttpStatus.BAD_REQUEST);
    }

    if (user.verify_user_token !== token) {
      throw new HttpException('Token does not match!', HttpStatus.FORBIDDEN);
    }

    user.is_active = true;
    user.is_deleted = false;
    user.verify_user_token = null;
    return await this.usersRepository.save(user);
  }

  async getAllUsers(getUsersDto: GetUsersDto): Promise<PaginatedUsers> {
    const { search_text, search_col, limit, offset, sortBy, sortOrder } =
      getUsersDto;

    // Start building the query
    const query = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.bots', 'bot')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect(
        'user.user_subscriptions',
        'subscription',
        'subscription.status = :status', // Filter by active subscriptions
        { status: 'active' },
      )
      .leftJoin(
        'subscription_packages',
        'subscription_package',
        'subscription.price_id = subscription_package.stripe_price_id OR subscription.price_id = subscription_package.stripe_annual_price_id',
      )
      .select([
        'user.id',
        'user.email',
        'user.is_active',
        'user.first_name',
        'user.last_name',
        'user.created_at',
        'subscription.id',
        'subscription.price_id',
        'subscription.status',
      ])
      .addSelect('COUNT(bot.id)', 'botCount') // Count bots for each user
      .addSelect(
        `
            CASE
                WHEN subscription.price_id = subscription_package.stripe_price_id THEN 'monthly'
                WHEN subscription.price_id = subscription_package.stripe_annual_price_id THEN 'annual'
                ELSE 'unknown'
            END AS subscription_type
            `,
      )
      .addSelect('subscription_package.name', 'subscription_name')
      .where('role.name != :adminRole', { adminRole: 'ADMIN' }); // Filter non-admin users

    // Apply search filters
    if (search_text && search_col) {
      switch (search_col) {
        case 'email':
        case 'first_name':
        case 'last_name':
          query.andWhere(`user.${search_col} ILIKE :search_text`, {
            search_text: `%${search_text}%`,
          });
          break;
        case 'full_name':
          query.andWhere(
            `CONCAT(user.first_name, ' ', user.last_name) ILIKE :search_text`,
            { search_text: `%${search_text}%` },
          );
          break;
        case 'subscription_type':
          query.andWhere(
            `
                    CASE
                        WHEN subscription.price_id = subscription_package.stripe_price_id THEN 'monthly'
                        WHEN subscription.price_id = subscription_package.stripe_annual_price_id THEN 'annual'
                        ELSE 'unknown'
                    END ILIKE :search_text
                    `,
            { search_text: `%${search_text}%` },
          );
          break;
        case 'subscription_name':
          query.andWhere(`subscription_package.name ILIKE :search_text`, {
            search_text: `%${search_text}%`,
          });
          break;
        default:
          throw new Error('Invalid search column');
      }
    }

    // Apply sorting
    if (sortBy) {
      query.orderBy(sortBy, sortOrder);
    }

    // Apply pagination
    if (limit) {
      query.take(limit); // Use `take()` instead of `limit()`
    }

    if (offset) {
      query.skip(offset); // Use `skip()` instead of `offset()`
    }

    // Execute the query and get the results
    const users = await query.getRawMany();

    // Use a separate query to get the total count without pagination
    const totalUsers = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.user_subscriptions', 'subscription')
      .where('subscription.status = :status', { status: 'active' })
      .andWhere('role.name != :adminRole', { adminRole: 'ADMIN' })
      .getCount();

    return { users, limit, offset, totalUsers };
  }

  async findUserWithSubscription(userId: number): Promise<UserWithCurrentPlan> {
    const userCurrPlan: UserWithCurrentPlan = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin(
        'user.user_subscriptions',
        'user_subscription',
        'user_subscription.current = :isCurrent', 
        { isCurrent: true },
      )
      .leftJoin(
        'subscription_packages',
        'subscription_package',
        'user_subscription.price_id = subscription_package.stripe_price_id OR user_subscription.price_id = subscription_package.stripe_annual_price_id',
      )
      .select('user.id', 'id')
      .addSelect('user.email', 'email')
      .addSelect(
        `
      CASE
          WHEN user_subscription.price_id = subscription_package.stripe_price_id THEN 'monthly'
          WHEN user_subscription.price_id = subscription_package.stripe_annual_price_id THEN 'annual'
          ELSE 'unknown'
      END AS subscription_type
      `,
      )
      .addSelect('user_subscription.price_id', 'price_id')
      .addSelect('subscription_package.name', 'name')
      .where('user.id = :userId', { userId })
      .getRawOne();

    if (!userCurrPlan) {
      throw new Error(
        `User with ID ${userId} not found or has no active subscription`,
      );
    }

    const allowedBots =
      SUBSCRIPTION_FEATURES_METADATA[userCurrPlan.name]?.chatbot || 0; // Safeguard in case `name` is undefined

    return { ...userCurrPlan, allowedBots };
  }

  async findAllUsersWithSubscription() {
    return await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin(
        'user.user_subscriptions',
        'user_subscription',
        'user_subscription.status != :expiredStatus', // Exclude expired subscriptions
        { expiredStatus: 'expired' },
      )
      .leftJoin(
        'subscription_packages',
        'subscription_package',
        'user_subscription.price_id = subscription_package.stripe_price_id OR user_subscription.price_id = subscription_package.stripe_annual_price_id',
      )
      .select('user.id', 'id')
      .addSelect('user.email', 'email')
      .addSelect(
        `
      CASE
          WHEN user_subscription.price_id = subscription_package.stripe_price_id THEN 'monthly'
          WHEN user_subscription.price_id = subscription_package.stripe_annual_price_id THEN 'annual'
          ELSE 'unknown'
      END AS subscription_type
      `,
      )
      .addSelect('user_subscription.price_id', 'price_id')
      .addSelect('subscription_package.name', 'name')
      .getRawMany(); // Use getRawMany() to fetch all matching users
  }
}
