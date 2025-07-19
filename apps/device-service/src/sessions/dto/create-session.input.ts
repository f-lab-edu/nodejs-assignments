import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsDate } from 'class-validator';

@InputType()
export class CreateSessionInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  deviceId: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  token: string;

  @Field()
  @IsNotEmpty()
  @IsDate()
  expiresAt: Date;
}