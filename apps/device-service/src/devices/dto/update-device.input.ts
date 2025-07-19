import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

@InputType()
export class UpdateDeviceInput {
  @Field(() => ID)
  @IsNotEmpty()
  @IsString()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsIn(['mobile', 'desktop', 'tv', 'tablet', 'other'])
  deviceType?: string;
}