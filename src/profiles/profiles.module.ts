import { Module } from '@nestjs/common';
import { ProfileService } from './services/profile.service';
import { ProfileResolver } from './resolvers/profile.resolver';

@Module({
  providers: [
    ProfileService,
    ProfileResolver
  ],
  exports: [ProfileService],
})
export class ProfilesModule {}