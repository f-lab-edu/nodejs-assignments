import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

@InputType()
export class CreateDeviceInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  userId: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  deviceId: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  deviceName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsIn(['mobile', 'desktop', 'tv', 'tablet', 'other'])
  deviceType?: string;
}