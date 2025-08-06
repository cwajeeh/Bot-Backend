import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class GetUsersDto {
  @IsOptional()
  @IsString()
  search_text?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'full_name',
    'first_name',
    'last_name',
    'subscription_name',
    'subscription_type',
    'email',
  ])
  search_col?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  offset?: number;

  // New properties for sorting
  @IsOptional()
  @IsString()
  @IsIn([
    '',
    'full_name',
    'first_name',
    'last_name',
    'subscription_name',
    'subscription_type',
    'email',
    'created_at', // Assuming you might want to sort by creation date
  ])
  sortBy?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}
