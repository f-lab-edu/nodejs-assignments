import { Field, ObjectType, ID } from '@nestjs/graphql';
import { Device } from '../../devices/entities/device.entity';

@ObjectType()
export class Session {
  @Field(() => ID)
  id: string;

  @Field()
  deviceId: string;

  @Field()
  token: string;

  @Field()
  expiresAt: Date;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field(() => Device, { nullable: true })
  device?: Device;
}