import {
  IsInt,
  IsString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsDate,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

enum SourceType {
  File = 'file',
  Text = 'text',
  Website = 'website',
  QNA = 'qna',
}

export class SourceItemDTO {
  @ApiProperty({ enum: SourceType })
  @IsEnum(SourceType)
  source_type: SourceType;

  @ApiProperty({ type: Object, required: false })
  @IsOptional()
  source_data?: object;
}

export class AddBotDTO {
  @ApiProperty()
  @IsString()
  bot_name: string;

  @IsOptional()
  @IsNumber()
  created_by?: number;

  @IsOptional()
  @IsString()
  display_id?: string;

  @ApiProperty({ default: { visibility: 'public' } })
  @IsObject()
  security: {
    visibility: string;
  }

  @ApiProperty({ default: 'pending' })
  @IsString()
  status: string = 'pending';

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  characters_count: number;

  @ApiProperty({ type: [SourceItemDTO] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SourceItemDTO)
  sources: SourceItemDTO[];
}

export class UpdateBotDTO {
  @ApiProperty()
  @IsOptional()
  @IsString()
  bot_name?: string;

  @IsOptional()
  @IsDate()
  last_trained_at?: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  interface?: any;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  security?: any;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  leads?: any;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  notifications?: any;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  characters_count: number;

  @ApiProperty({ type: [SourceItemDTO] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SourceItemDTO)
  sources: SourceItemDTO[];
}

export class GetPublicBotDetailParams {
  @ApiProperty()
  @IsString()
  display_id: string;
}

export enum HookType {
  UPDATE_BOT_STATUS = 'UPDATE_BOT_STATUS',
}

export class botWebHookPayload {
  @ApiProperty({ enum: HookType })
  @IsEnum(HookType)
  hook_type: HookType;

  @ApiProperty()
  @IsNumber()
  bot_id: number;

  @ApiProperty()
  @IsObject()
  hook_data: { status: 'trained' };
}
export class UpdateBotStatusDTO {
  @ApiProperty()
  @IsBoolean()
  status: boolean; 
}
