import { Injectable, Inject, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { IDeviceRepository } from '../repositories/interfaces/device.repository.interface';
import { Device } from '../entities/device.entity';
import { CreateDeviceInput } from '../dto/create-device.input';
import { UpdateDeviceInput } from '../dto/update-device.input';

@Injectable()
export class DeviceService {
  private readonly MAX_DEVICES_PER_USER = 5;

  constructor(
    @Inject('IDeviceRepository')
    private readonly deviceRepository: IDeviceRepository,
  ) {}

  async registerDevice(input: CreateDeviceInput): Promise<Device> {
    // 중복 디바이스 ID 체크
    const existing = await this.deviceRepository.findByDeviceId(input.deviceId);
    if (existing) {
      throw new ConflictException('이미 등록된 디바이스입니다.');
    }

    // 사용자별 디바이스 제한 체크
    const userDevices = await this.deviceRepository.findByUserId(input.userId);
    if (userDevices.length >= this.MAX_DEVICES_PER_USER) {
      throw new BadRequestException(
        `사용자당 최대 ${this.MAX_DEVICES_PER_USER}개의 디바이스만 등록할 수 있습니다.`,
      );
    }

    return this.deviceRepository.create(input);
  }

  async getDevice(id: string): Promise<Device> {
    const device = await this.deviceRepository.findById(id);
    if (!device) {
      throw new NotFoundException('디바이스를 찾을 수 없습니다.');
    }
    return device;
  }

  async getDeviceByDeviceId(deviceId: string): Promise<Device> {
    const device = await this.deviceRepository.findByDeviceId(deviceId);
    if (!device) {
      throw new NotFoundException('디바이스를 찾을 수 없습니다.');
    }
    return device;
  }

  async getUserDevices(userId: string): Promise<Device[]> {
    return this.deviceRepository.findByUserId(userId);
  }

  async updateDevice(input: UpdateDeviceInput): Promise<Device> {
    const device = await this.deviceRepository.findById(input.id);
    if (!device) {
      throw new NotFoundException('디바이스를 찾을 수 없습니다.');
    }

    return this.deviceRepository.update(input.id, input);
  }

  async removeDevice(id: string): Promise<boolean> {
    const device = await this.deviceRepository.findById(id);
    if (!device) {
      throw new NotFoundException('디바이스를 찾을 수 없습니다.');
    }

    return this.deviceRepository.delete(id);
  }

  async removeAllUserDevices(userId: string): Promise<number> {
    return this.deviceRepository.deleteByUserId(userId);
  }

  async getActiveDeviceCount(userId: string): Promise<number> {
    return this.deviceRepository.countActiveDevicesByUserId(userId);
  }

  async validateDeviceOwnership(deviceId: string, userId: string): Promise<boolean> {
    const device = await this.deviceRepository.findByDeviceId(deviceId);
    return device?.userId === userId;
  }
}