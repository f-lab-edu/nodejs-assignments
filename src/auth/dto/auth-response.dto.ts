import { ObjectType, Field } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class AuthResponse {
  @Field(() => User)
  user: User;

  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field()
  expiresIn: number;

  constructor(partial: Partial<AuthResponse>) {
    Object.assign(this, partial);
  }
}