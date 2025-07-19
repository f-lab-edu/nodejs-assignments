import { Injectable, Inject, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Profile } from '../entities/profile.entity';
import { IProfileRepository } from '../repositories/interfaces/profile.repository.interface';
import { CreateProfileInput } from '../dto/create-profile.input';
import { UpdateProfileInput } from '../dto/update-profile.input';

@Injectable()
export class ProfileService {
  private readonly saltRounds = 12;
  private readonly maxProfilesPerUser = parseInt(
    process.env.MAX_PROFILES_PER_USER || '5',
  );

  constructor(
    @Inject('IProfileRepository')
    private readonly profileRepository: IProfileRepository,
  ) { }

  async create(userId: string, input: CreateProfileInput): Promise<Profile> {
    // 최대 프로필 수 검증
    const profileCount = await this.profileRepository.countByUserId(userId);
    if (profileCount >= this.maxProfilesPerUser) {
      throw new BadRequestException(
        `최대 ${this.maxProfilesPerUser}개의 프로필만 생성할 수 있습니다.`,
      );
    }

    // 중복 이름 검증
    const isDuplicateName = await this.profileRepository.existsByUserIdAndName(
      userId,
      input.name,
    );
    if (isDuplicateName) {
      throw new ConflictException('이미 사용 중인 프로필 이름입니다.');
    }

    // PIN 해싱 (제공된 경우)
    const hashedPin = input.pin
      ? await this.hashPin(input.pin)
      : undefined;

    return this.profileRepository.create({
      userId,
      name: input.name,
      avatarUrl: input.avatarUrl,
      pin: hashedPin,
      isKids: input.isKids,
      language: input.language,
      maturityRating: input.maturityRating,
    });
  }

  async findById(id: string): Promise<Profile> {
    const profile = await this.profileRepository.findById(id);
    if (!profile) {
      throw new NotFoundException('프로필을 찾을 수 없습니다.');
    }
    return profile;
  }

  async findByUserId(userId: string): Promise<Profile[]> {
    return this.profileRepository.findByUserId(userId);
  }

  async update(input: UpdateProfileInput): Promise<Profile> {
    const profile = await this.findById(input.id);

    // 중복 이름 검증 (이름 변경 시)
    if (input.name && input.name !== profile.name) {
      const isDuplicateName = await this.profileRepository.existsByUserIdAndName(
        profile.userId,
        input.name,
      );
      if (isDuplicateName) {
        throw new ConflictException('이미 사용 중인 프로필 이름입니다.');
      }
    }

    // PIN 해싱 (제공된 경우)
    const hashedPin = input.pin
      ? await this.hashPin(input.pin)
      : undefined;

    const updateData = {
      ...(input.name && { name: input.name }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
      ...(hashedPin !== undefined && { pin: hashedPin }),
      ...(input.isKids !== undefined && { isKids: input.isKids }),
      ...(input.language && { language: input.language }),
      ...(input.maturityRating && { maturityRating: input.maturityRating }),
    };

    return this.profileRepository.update(input.id, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id); // 존재 여부 확인
    await this.profileRepository.delete(id);
  }

  async createDefault(userId: string): Promise<Profile> {
    return this.profileRepository.create({
      userId,
      name: '기본 프로필',
      isKids: false,
      language: 'ko',
      maturityRating: 'ALL',
    });
  }

  async validatePin(profileId: string, pin: string): Promise<boolean> {
    const profile = await this.findById(profileId);

    if (!profile.pin) {
      return true; // PIN이 설정되지 않은 경우
    }

    return bcrypt.compare(pin, profile.pin);
  }

  private async hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, this.saltRounds);
  }
}