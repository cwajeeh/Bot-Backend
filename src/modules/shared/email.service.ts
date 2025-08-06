import { Injectable } from '@nestjs/common';
import { config as dotenvConfig } from 'dotenv';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
const hbs = require('nodemailer-express-handlebars');

dotenvConfig({ path: '.env' });

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: "aslaschat.ai",
      port: 465,
      auth: {
        user: `${process.env.GMAIL_USER}`,
        pass: `${process.env.GMAIL_PASSWORD}`,
      },
    });

    this.transporter.use('compile', hbs({
      viewEngine: {
        extName: '.hbs',
        partialsDir: path.resolve('./src/mail/templates'),
        defaultLayout: false,
      },
      viewPath: path.resolve('./src/mail/templates'),
      extName: '.hbs',
    }));
  }

  async sendEmail(to: string, subject: string, template: string, context: object) {
    const mailOptions = {
      from: `${process.env.GMAIL_USER}`,
      to,
      subject,
      template,
      context
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      throw error;
    }
  }
}
