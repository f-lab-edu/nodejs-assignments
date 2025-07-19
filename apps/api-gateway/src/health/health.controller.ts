import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      services: {
        identityService: this.configService.get('IDENTITY_SERVICE_URL', 'http://localhost:3001/graphql'),
        deviceService: this.configService.get('DEVICE_SERVICE_URL', 'http://localhost:3002/graphql'),
      },
    };
  }

  @Get('services')
  async checkServices() {
    // 실제 구현에서는 각 서비스의 health endpoint를 호출
    return {
      identityService: {
        status: 'unknown',
        url: this.configService.get('IDENTITY_SERVICE_URL', 'http://localhost:3001/graphql'),
      },
      deviceService: {
        status: 'unknown', 
        url: this.configService.get('DEVICE_SERVICE_URL', 'http://localhost:3002/graphql'),
      },
    };
  }
}