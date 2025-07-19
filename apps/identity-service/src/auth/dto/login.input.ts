import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @Field()
  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(128, { message: '비밀번호는 최대 128자까지 가능합니다.' })
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: '디바이스 ID는 문자열이어야 합니다.' })
  deviceId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: '디바이스 이름은 문자열이어야 합니다.' })
  deviceName?: string;
}