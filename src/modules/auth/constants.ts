import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: '.env' });

export const jwtConstants = {
  secret: `${process.env.JWT_SECRET}`,
  adminSecret: `${process.env.JWT_ADMIN_SECRET}`,
};
