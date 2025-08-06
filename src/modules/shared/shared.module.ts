import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { S3Service } from './s3.service';
import { CommonService } from './common.service';
import { MlService } from './ml.service';

@Module({
  providers: [EmailService, S3Service, CommonService, MlService],
  exports: [EmailService, S3Service, CommonService, MlService],
})
export class SharedModule {}
