import { InputType, Field } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class RefreshTokenInput {
  @Field()
  @IsString({ message: '리프레시 토큰은 문자열이어야 합니다.' })
  refreshToken: string;
}