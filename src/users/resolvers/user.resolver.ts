import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UserService } from '../services/user.service';
import { CreateUserInput } from '../dto/create-user.input';
import { UpdateUserInput } from '../dto/update-user.input';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) { }

  @Query(() => User, { name: 'me', description: '현재 로그인한 사용자 정보 조회' })
  // @UseGuards(JwtAuthGuard) // TODO
  async getCurrentUser(@CurrentUser() user: User): Promise<User> {
    return this.userService.findByIdWithProfiles(user.id);
  }

  @Query(() => User, { name: 'user', description: '사용자 정보 조회' })
  // @UseGuards(JwtAuthGuard) // TODO  
  async getUser(@Args('id', { type: () => ID }) id: string): Promise<User> {
    return this.userService.findById(id);
  }

  @Mutation(() => User, { description: '사용자 생성' })
  async createUser(@Args('input') input: CreateUserInput): Promise<User> {
    return this.userService.create(input);
  }

  @Mutation(() => User, { description: '사용자 정보 수정' })
  // @UseGuards(JwtAuthGuard) // TODO
  async updateUser(@Args('input') input: UpdateUserInput): Promise<User> {
    return this.userService.update(input);
  }

  @Mutation(() => Boolean, { description: '사용자 삭제' })
  // @UseGuards(JwtAuthGuard) // TODO
  async deleteUser(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    await this.userService.delete(id);
    return true;
  }
}