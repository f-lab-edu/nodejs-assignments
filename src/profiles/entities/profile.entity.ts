import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class Profile {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  // pin은 GraphQL 스키마에 노출하지 않음
  pin?: string;

  @Field()
  isKids: boolean;

  @Field()
  language: string;

  @Field()
  maturityRating: string;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  constructor(partial: Partial<Profile>) {
    Object.assign(this, partial);
  }

  static create(data: {
    id: string;
    userId: string;
    name: string;
    avatarUrl?: string;
    pin?: string;
    isKids?: boolean;
    language?: string;
    maturityRating?: string;
  }): Profile {
    return new Profile({
      ...data,
      isKids: data.isKids ?? false,
      language: data.language ?? 'ko',
      maturityRating: data.maturityRating ?? 'ALL',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  isAdultProfile(): boolean {
    return !this.isKids;
  }

  canWatchContent(contentRating: string): boolean {
    const ratings = ['ALL', '7+', '13+', '16+', '18+'];
    const profileRatingIndex = ratings.indexOf(this.maturityRating);
    const contentRatingIndex = ratings.indexOf(contentRating);

    return profileRatingIndex >= contentRatingIndex;
  }

  hasPin(): boolean {
    return !!this.pin;
  }
}