import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { IDeviceRepository } from '../interfaces/device.repository.interface';
import { Device } from '../../entities/device.entity';
import { CreateDeviceInput } from '../../dto/create-device.input';
import { UpdateDeviceInput } from '../../dto/update-device.input';

@Injectable()
export class DeviceRepository implements IDeviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDeviceInput): Promise<Device> {
    return this.prisma.device.create({
      data: {
        userId: data.userId,
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        deviceType: data.deviceType,
      },
    });
  }

  async findById(id: string): Promise<Device | null> {
    return this.prisma.device.findUnique({
      where: { id },
    });
  }

  async findByDeviceId(deviceId: string): Promise<Device | null> {
    return this.prisma.device.findUnique({
      where: { deviceId },
    });
  }

  async findByUserId(userId: string): Promise<Device[]> {
    return this.prisma.device.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async update(id: string, data: UpdateDeviceInput): Promise<Device> {
    const updateData = Object.entries(data)
      .filter(([key, value]) => key !== 'id' && value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    return this.prisma.device.update({
      where: { id },
      data: {
        ...updateData,
        lastActiveAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.device.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.prisma.device.deleteMany({
      where: { userId },
    });
    return result.count;
  }

  async countActiveDevicesByUserId(userId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.prisma.device.count({
      where: {
        userId,
        lastActiveAt: {
          gte: thirtyDaysAgo,
        },
      },
    });
  }
}