import { User } from '../../entities/user.entity';

export interface CreateUserData {
  email: string;
  password: string;
}

export interface UpdateUserData {
  isActive?: boolean;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByIdWithProfiles(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  delete(id: string): Promise<void>;
  existsByEmail(email: string): Promise<boolean>;
}