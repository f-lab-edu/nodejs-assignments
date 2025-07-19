import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Profile } from '../../profiles/entities/profile.entity';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  // password는 GraphQL 스키마에 노출하지 않음
  password: string;

  @Field()
  isActive: boolean;

  @Field(() => [Profile], { nullable: true })
  profiles?: Profile[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }

  static create(data: {
    id: string;
    email: string;
    password: string;
    isActive?: boolean;
  }): User {
    return new User({
      ...data,
      isActive: data.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  isAccountActive(): boolean {
    return this.isActive;
  }

  deactivate(): User {
    return new User({
      ...this,
      isActive: false,
      updatedAt: new Date(),
    });
  }
}