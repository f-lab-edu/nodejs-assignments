import { Module } from '@nestjs/common';
import { ProfileService } from './services/profile.service';
import { ProfileResolver } from './resolvers/profile.resolver';
import { ProfileRepositoryImpl } from './repositories/implementations/profile.repository.impl';

@Module({
  providers: [
    ProfileService,
    ProfileResolver,
    {
      provide: 'IProfileRepository',
      useClass: ProfileRepositoryImpl,
    },
  ],
  exports: [ProfileService],
})
export class ProfilesModule {}