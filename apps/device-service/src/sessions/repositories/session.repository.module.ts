import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { SessionRepository } from './implementations/session.repository.impl';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: 'ISessionRepository',
      useClass: SessionRepository,
    },
  ],
  exports: ['ISessionRepository'],
})
export class SessionRepositoryModule {}