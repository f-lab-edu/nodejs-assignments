import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

@InputType()
export class UpdateUserInput {
  @Field(() => ID)
  @IsString()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean({ message: '활성 상태는 boolean 값이어야 합니다.' })
  isActive?: boolean;
}