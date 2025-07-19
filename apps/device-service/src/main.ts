import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS 설정
  app.enableCors();
  
  // 글로벌 프리픽스 설정
  app.setGlobalPrefix('api/v1');
  
  const port = process.env.PORT || 3002;
  await app.listen(port);
  
  console.log(`🚀 Device Service is running on: http://localhost:${port}`);
}

bootstrap();