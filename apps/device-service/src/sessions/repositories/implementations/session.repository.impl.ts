import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { ISessionRepository } from '../interfaces/session.repository.interface';
import { Session } from '../../entities/session.entity';
import { CreateSessionInput } from '../../dto/create-session.input';

@Injectable()
export class SessionRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSessionInput): Promise<Session> {
    return this.prisma.session.create({
      data: {
        deviceId: data.deviceId,
        token: data.token,
        expiresAt: data.expiresAt,
      },
      include: {
        device: true,
      },
    });
  }

  async findById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({
      where: { id },
      include: {
        device: true,
      },
    });
  }

  async findByToken(token: string): Promise<Session | null> {
    return this.prisma.session.findUnique({
      where: { token },
      include: {
        device: true,
      },
    });
  }

  async findByDeviceId(deviceId: string): Promise<Session[]> {
    return this.prisma.session.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
      include: {
        device: true,
      },
    });
  }

  async updateLastActive(id: string): Promise<Session> {
    return this.prisma.session.update({
      where: { id },
      data: {
        device: {
          update: {
            lastActiveAt: new Date(),
          },
        },
      },
      include: {
        device: true,
      },
    });
  }

  async deactivate(id: string): Promise<Session> {
    return this.prisma.session.update({
      where: { id },
      data: {
        isActive: false,
      },
      include: {
        device: true,
      },
    });
  }

  async deactivateByDeviceId(deviceId: string): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: {
        deviceId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
    return result.count;
  }

  async deleteExpiredSessions(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }
}