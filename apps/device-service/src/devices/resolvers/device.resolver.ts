import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Device } from '../entities/device.entity';
import { DeviceService } from '../services/device.service';
import { CreateDeviceInput } from '../dto/create-device.input';
import { UpdateDeviceInput } from '../dto/update-device.input';

@Resolver(() => Device)
export class DeviceResolver {
  constructor(private readonly deviceService: DeviceService) {}

  @Mutation(() => Device, { description: '새 디바이스 등록' })
  async registerDevice(
    @Args('input') input: CreateDeviceInput,
  ): Promise<Device> {
    return this.deviceService.registerDevice(input);
  }

  @Query(() => Device, { description: '디바이스 ID로 조회' })
  async device(@Args('id', { type: () => ID }) id: string): Promise<Device> {
    return this.deviceService.getDevice(id);
  }

  @Query(() => Device, { description: '디바이스 고유 ID로 조회' })
  async deviceByDeviceId(
    @Args('deviceId') deviceId: string,
  ): Promise<Device> {
    return this.deviceService.getDeviceByDeviceId(deviceId);
  }

  @Query(() => [Device], { description: '사용자의 모든 디바이스 조회' })
  async userDevices(@Args('userId') userId: string): Promise<Device[]> {
    return this.deviceService.getUserDevices(userId);
  }

  @Mutation(() => Device, { description: '디바이스 정보 수정' })
  async updateDevice(
    @Args('input') input: UpdateDeviceInput,
  ): Promise<Device> {
    return this.deviceService.updateDevice(input);
  }

  @Mutation(() => Boolean, { description: '디바이스 제거' })
  async removeDevice(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.deviceService.removeDevice(id);
  }

  @Mutation(() => Number, { description: '사용자의 모든 디바이스 제거' })
  async removeAllUserDevices(
    @Args('userId') userId: string,
  ): Promise<number> {
    return this.deviceService.removeAllUserDevices(userId);
  }

  @Query(() => Number, { description: '활성 디바이스 수 조회' })
  async activeDeviceCount(@Args('userId') userId: string): Promise<number> {
    return this.deviceService.getActiveDeviceCount(userId);
  }
}