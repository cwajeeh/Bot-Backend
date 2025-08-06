// s3.service.ts
import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as multer from 'multer';
import { Request } from 'express';
import * as fs from 'fs';

@Injectable()
export class S3Service {
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    key: string,
  ): Promise<AWS.S3.ManagedUpload.SendData> {
    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: key,
      Body: file.buffer,
    };
    return this.s3.upload(params).promise();
  }

  async uploadMultipleFiles(files: Array<Express.Multer.File>, userId: number) {
    const timestamp = Date.now();
    
    const uploads = await Promise.all(
      files.map(async (file) => {
        const key = `${userId}/${timestamp}-${file.originalname}`;
        const filePath = `uploads/${timestamp}-${file.originalname}`;
        fs.writeFileSync(filePath, file.buffer);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const characterCount = fileContent.replace(/\s+/g, '').length;
        const result = await this.uploadFile(file, key);
        fs.unlinkSync(filePath);
        return { ...result, characterCount };
      }),
    );
    
    return uploads;
}

  async uploadMultipleImages(files: Array<Express.Multer.File>, userId: number) {
    const timestamp = Date.now();
    return Promise.all(
      files.map(async (file) => {
        const key = `${userId}/${timestamp}-${file.originalname}`;
        return await this.uploadFile(file, key);
      })
    );
  }
}
