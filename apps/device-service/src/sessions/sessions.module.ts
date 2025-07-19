import { Module } from '@nestjs/common';
import { SessionService } from './services/session.service';
import { SessionResolver } from './resolvers/session.resolver';
import { SessionRepositoryModule } from './repositories/session.repository.module';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [SessionRepositoryModule, DevicesModule],
  providers: [SessionService, SessionResolver],
  exports: [SessionService],
})
export class SessionsModule {}