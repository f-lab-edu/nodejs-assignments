import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DevicesModule } from './devices/devices.module';
import { SessionsModule } from './sessions/sessions.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DevicesModule,
    SessionsModule,
    HealthModule,
  ],
})
export class AppModule {}