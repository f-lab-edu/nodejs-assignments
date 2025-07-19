import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { IUserRepository } from '../repositories/interfaces/user.repository.interface';
import { CreateUserInput } from '../dto/create-user.input';
import { UpdateUserInput } from '../dto/update-user.input';

@Injectable()
export class UserService {
  private readonly saltRounds = 12;

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) { }

  async create(input: CreateUserInput): Promise<User> {
    const isEmailExists = await this.userRepository.existsByEmail(input.email);
    if (isEmailExists) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const hashedPassword = await this.hashPassword(input.password);

    return this.userRepository.create({
      email: input.email,
      password: hashedPassword,
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  async findByIdWithProfiles(id: string): Promise<User> {
    const user = await this.userRepository.findByIdWithProfiles(id);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async update(input: UpdateUserInput): Promise<User> {
    await this.findById(input.id); // 존재 여부 확인

    const updateData = {
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    };

    return this.userRepository.update(input.id, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.userRepository.delete(id);
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }
}