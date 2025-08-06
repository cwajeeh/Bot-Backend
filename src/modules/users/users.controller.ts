import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  BadRequestException,
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
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { UsersService } from './users.service';
import { S3Service } from '../shared/s3.service';
import { UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
// import { RegisterDTO } from './dto/register.dto';
// import { forgotPasswordDTO } from './dto/user.dto';
// import { SignInResponseDTO } from './dto/signIn-response.dto';
// import { RegisterResponseDTO } from './dto/register-response.dto';
// import { Roles } from '../roles/roles.decorator';
// import { ROLES_ENUM } from '../roles/roles.enum';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private userService: UsersService,
    private s3Service: S3Service,
  ) {}

  // currently this is putting in controller, will update later
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Post('/uploads')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 5 }]))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'List of files to upload',
    type: 'multipart/form-data',
    required: true,
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  async uploadMultipleFiles(@Request() req, @UploadedFiles() files) {
    const user = req.user;

    const allowedFormats = ['txt',];

    // Filter out files that are not PDF or TXT
    const filteredFiles = files.files.filter((file) => {
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
      return allowedFormats.includes(fileExtension);
    });

    // Check if any files were removed
    if (filteredFiles.length !== files.files.length) {
      throw new BadRequestException('TXT files are allowed');
    }

    const uploaded = await this.s3Service.uploadMultipleFiles(
      files.files,
      user.id,
    );
    return uploaded;
  }

  // currently this is putting in controller, will update later
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Post('/upload-images')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 5 }]))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'List of files to upload',
    type: 'multipart/form-data',
    required: true,
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  async uploadMultipleImages(@Request() req, @UploadedFiles() files) {
    const user = req.user;

    const allowedFormats = ['png', 'jpg', 'jpeg'];

    // Filter out files that are not PDF or TXT
    const filteredFiles = files.files.filter((file) => {
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
      return allowedFormats.includes(fileExtension);
    });

    // Check if any files were removed
    if (filteredFiles.length !== files.files.length) {
      throw new BadRequestException('Only PNG, JPG and JPEG files are allowed');
    }

    const uploaded = await this.s3Service.uploadMultipleImages(
      files.files,
      user.id,
    );
    return uploaded;
  }
}
