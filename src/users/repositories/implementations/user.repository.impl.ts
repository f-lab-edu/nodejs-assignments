import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { IUserRepository, CreateUserData, UpdateUserData } from '../interfaces/user.repository.interface';
import { User } from '../../entities/user.entity';
import { Profile } from '../../../profiles/entities/profile.entity';

@Injectable()
export class UserRepositoryImpl implements IUserRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? new User(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user ? new User(user) : null;
  }

  async findByIdWithProfiles(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profiles: true,
      },
    });

    if (!user) return null;

    const profiles = user.profiles?.map(profile => new Profile(profile)) || [];

    return new User({
      ...user,
      profiles,
    });
  }

  async create(data: CreateUserData): Promise<User> {
    const user = await this.prisma.user.create({
      data,
    });

    return new User(user);
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    return new User(user);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return !!user;
  }
}