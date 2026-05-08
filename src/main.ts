import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser'; 

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown props
      forbidNonWhitelisted: true, // throws error on unknown props
      transform: true, // transforms payloads to DTO instances
      errorHttpStatusCode: 400, // set error code for validation errors
    }),
  );
    app.use(bodyParser.json());

  // Parse URL-encoded data (like express.urlencoded)
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser())

  const port = process.env.PORT ?? 8000;
  await app.listen(port);
  console.log(`Application is running on PORT ${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
