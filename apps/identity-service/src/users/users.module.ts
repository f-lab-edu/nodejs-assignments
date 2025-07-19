import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserResolver } from './resolvers/user.resolver';
import { UserRepositoryImpl } from './repositories/implementations/user.repository.impl';

@Module({
  providers: [
    UserService,
    UserResolver,
    {
      provide: 'IUserRepository',
      useClass: UserRepositoryImpl,
    },
  ],
  exports: [UserService],
})
export class UsersModule { }