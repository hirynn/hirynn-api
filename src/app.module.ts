import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import jwtConfig, { validateJwtConfig } from './config/jwt.config'; 
import databaseConfig from './config/database.config';
import linkedinConfig from './config/linkedin.config';
import { ThrottlerModule } from '@nestjs/throttler';
import emailConfig from './config/email.config';
import { TeacherModule } from './modules/teacher/teacher.module';
import { SchoolModule } from './modules/school/school.module';
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds in milliseconds
        limit: 10,
      }
    ]),
    // Load .env variables and custom JWT config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig, databaseConfig, linkedinConfig, emailConfig],
      validate: validateJwtConfig,
    }),

    PrismaModule,
    AuthModule,
    TeacherModule,
    SchoolModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}