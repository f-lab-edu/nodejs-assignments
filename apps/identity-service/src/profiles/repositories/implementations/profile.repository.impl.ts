import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import {
  IProfileRepository,
  CreateProfileData,
  UpdateProfileData,
} from '../interfaces/profile.repository.interface';
import { Profile } from '../../entities/profile.entity';
import { User } from '../../../users/entities/user.entity';

@Injectable()
export class ProfileRepositoryImpl implements IProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Profile | null> {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
    });

    return profile ? new Profile(profile) : null;
  }

  async findByUserId(userId: string): Promise<Profile[]> {
    const profiles = await this.prisma.profile.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return profiles.map(profile => new Profile(profile));
  }

  async findByUserIdWithUser(userId: string): Promise<Profile[]> {
    const profiles = await this.prisma.profile.findMany({
      where: { userId },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return profiles.map(profile => {
      const user = profile.user ? new User(profile.user) : undefined;
      return new Profile({
        ...profile,
        user,
      });
    });
  }

  async create(data: CreateProfileData): Promise<Profile> {
    const profile = await this.prisma.profile.create({
      data,
    });

    return new Profile(profile);
  }

  async update(id: string, data: UpdateProfileData): Promise<Profile> {
    const profile = await this.prisma.profile.update({
      where: { id },
      data,
    });

    return new Profile(profile);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.profile.delete({
      where: { id },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.profile.count({
      where: { userId },
    });
  }

  async existsByUserIdAndName(userId: string, name: string): Promise<boolean> {
    const profile = await this.prisma.profile.findFirst({
      where: {
        userId,
        name,
      },
      select: { id: true },
    });

    return !!profile;
  }
}