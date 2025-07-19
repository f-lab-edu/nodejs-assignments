import { Profile } from '../../entities/profile.entity';

export interface CreateProfileData {
  userId: string;
  name: string;
  avatarUrl?: string;
  pin?: string;
  isKids?: boolean;
  language?: string;
  maturityRating?: string;
}

export interface UpdateProfileData {
  name?: string;
  avatarUrl?: string;
  pin?: string;
  isKids?: boolean;
  language?: string;
  maturityRating?: string;
}

export interface IProfileRepository {
  findById(id: string): Promise<Profile | null>;
  findByUserId(userId: string): Promise<Profile[]>;
  findByUserIdWithUser(userId: string): Promise<Profile[]>;
  create(data: CreateProfileData): Promise<Profile>;
  update(id: string, data: UpdateProfileData): Promise<Profile>;
  delete(id: string): Promise<void>;
  countByUserId(userId: string): Promise<number>;
  existsByUserIdAndName(userId: string, name: string): Promise<boolean>;
}