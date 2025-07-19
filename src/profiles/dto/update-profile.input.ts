import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, MinLength, MaxLength, IsIn } from 'class-validator';

@InputType()
export class UpdateProfileInput {
  @Field(() => ID)
  @IsString()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: '프로필 이름은 문자열이어야 합니다.' })
  @MinLength(1, { message: '프로필 이름은 최소 1자 이상이어야 합니다.' })
  @MaxLength(50, { message: '프로필 이름은 최대 50자까지 가능합니다.' })
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: '아바타 URL은 문자열이어야 합니다.' })
  avatarUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'PIN은 문자열이어야 합니다.' })
  @MinLength(4, { message: 'PIN은 최소 4자 이상이어야 합니다.' })
  @MaxLength(6, { message: 'PIN은 최대 6자까지 가능합니다.' })
  pin?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean({ message: '키즈 여부는 boolean 값이어야 합니다.' })
  isKids?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: '언어는 문자열이어야 합니다.' })
  @IsIn(['ko', 'en', 'ja', 'zh'], { message: '지원하지 않는 언어입니다.' })
  language?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: '시청 등급은 문자열이어야 합니다.' })
  @IsIn(['ALL', '7+', '13+', '16+', '18+'], { message: '올바르지 않은 시청 등급입니다.' })
  maturityRating?: string;
}