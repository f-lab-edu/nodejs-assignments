import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Profile } from '../entities/profile.entity';
import { ProfileService } from '../services/profile.service';
import { CreateProfileInput } from '../dto/create-profile.input';
import { UpdateProfileInput } from '../dto/update-profile.input';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Resolver(() => Profile)
export class ProfileResolver {
  constructor(private readonly profileService: ProfileService) { }

  @Query(() => [Profile], { name: 'profiles', description: '현재 사용자의 프로필 목록 조회' })
  @UseGuards(JwtAuthGuard)
  async getProfiles(@CurrentUser() user: User): Promise<Profile[]> {
    return this.profileService.findByUserId(user.id);
  }

  @Query(() => Profile, { name: 'profile', description: '프로필 상세 정보 조회' })
  @UseGuards(JwtAuthGuard)
  async getProfile(@Args('id', { type: () => ID }) id: string): Promise<Profile> {
    return this.profileService.findById(id);
  }

  @Mutation(() => Profile, { description: '프로필 생성' })
  @UseGuards(JwtAuthGuard)
  async createProfile(
    @CurrentUser() user: User,
    @Args('input') input: CreateProfileInput,
  ): Promise<Profile> {
    return this.profileService.create(user.id, input);
  }

  @Mutation(() => Profile, { description: '프로필 정보 수정' })
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Args('input') input: UpdateProfileInput): Promise<Profile> {
    return this.profileService.update(input);
  }

  @Mutation(() => Boolean, { description: '프로필 삭제' })
  @UseGuards(JwtAuthGuard)
  async deleteProfile(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    await this.profileService.delete(id);
    return true;
  }

  @Mutation(() => Boolean, { description: '프로필 PIN 검증' })
  @UseGuards(JwtAuthGuard)
  async validateProfilePin(
    @Args('profileId', { type: () => ID }) profileId: string,
    @Args('pin') pin: string,
  ): Promise<boolean> {
    return this.profileService.validatePin(profileId, pin);
  }
}