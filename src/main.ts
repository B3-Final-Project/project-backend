import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as AWS from 'aws-sdk';

async function bootstrap() {
  dotenv.configDotenv();
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    credentials: true,
    origin: process.env.FRONTEND_URL,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors): Error => {
        const error = new BadRequestException(errors);
        return error;
      },
    }),
  );

  AWS.config.update({
    region: process.env.AWS_REGION, // ensure this is set
    credentials: new AWS.Credentials({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }),
  });

  app.setGlobalPrefix('api');
  await app.listen(8080, '0.0.0.0');
}
bootstrap();
