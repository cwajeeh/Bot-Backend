import { IsEmail, IsInt, IsString, Min, Max } from 'class-validator';

export class SendCreditsNotificationDto {
  @IsInt()
  @Min(25)
  @Max(100)
  percentage: number;

  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  plan: string;
}
