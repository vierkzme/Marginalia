import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://criv_user:criv_secret_pass@localhost:5432/contextual_reading_vault?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_prod',
  NLP_SERVICE_URL: process.env.NLP_SERVICE_URL || 'http://localhost:8000',
  FREE_DICTIONARY_API_URL: process.env.FREE_DICTIONARY_API_URL || 'https://api.dictionaryapi.dev/api/v2/entries/en',
  AI_FALLBACK_API_KEY: process.env.AI_FALLBACK_API_KEY || '',
};
