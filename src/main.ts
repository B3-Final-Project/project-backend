import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

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

  app.setGlobalPrefix('api');
  await app.listen(8080, '0.0.0.0');
}
bootstrap();
