import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType()
export class Device {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  deviceId: string;

  @Field()
  deviceName: string;

  @Field({ nullable: true })
  deviceType?: string;

  @Field()
  lastActiveAt: Date;

  @Field()
  createdAt: Date;
}