import 'dotenv/config';
import *  as joi from 'joi';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
  HOST: string;
}

const envSchemaValidator = joi
  .object({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string().required(),
    HOST: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envSchemaValidator.validate(process.env);

if (error) {
  throw new Error(`Config(.env) has error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  database_url: envVars.DATABASE_URL,
  host: envVars.HOST,
};
