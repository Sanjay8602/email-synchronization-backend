import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Enable CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', appConfig.cors.origin),
    credentials: configService.get<boolean>('CORS_CREDENTIALS', appConfig.cors.credentials),
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global prefix
  const apiPrefix = configService.get<string>('API_PREFIX', appConfig.server.apiPrefix);
  app.setGlobalPrefix(apiPrefix);

  const port = configService.get<number>('PORT', appConfig.server.port);
  await app.listen(port);
  console.log(`🚀 Backend server running on port ${port}`);
  console.log(`📡 API available at http://localhost:${port}/${apiPrefix}`);
  console.log(`🌍 Environment: ${appConfig.server.nodeEnv}`);
}
bootstrap();
