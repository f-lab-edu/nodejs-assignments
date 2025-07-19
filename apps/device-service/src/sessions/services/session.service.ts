import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ISessionRepository } from '../repositories/interfaces/session.repository.interface';
import { Session } from '../entities/session.entity';
import { CreateSessionInput } from '../dto/create-session.input';
import { DeviceService } from '../../devices/services/device.service';

@Injectable()
export class SessionService {
  private readonly MAX_CONCURRENT_SESSIONS = 3;

  constructor(
    @Inject('ISessionRepository')
    private readonly sessionRepository: ISessionRepository,
    private readonly deviceService: DeviceService,
  ) {}

  async createSession(input: CreateSessionInput): Promise<Session> {
    // 디바이스 존재 확인
    await this.deviceService.getDevice(input.deviceId);

    // 동시 세션 제한 확인
    const activeSessions = await this.sessionRepository.findByDeviceId(input.deviceId);
    const activeCount = activeSessions.filter(s => s.isActive && s.expiresAt > new Date()).length;

    if (activeCount >= this.MAX_CONCURRENT_SESSIONS) {
      throw new BadRequestException(
        `디바이스당 최대 ${this.MAX_CONCURRENT_SESSIONS}개의 동시 세션만 허용됩니다.`,
      );
    }

    return this.sessionRepository.create(input);
  }

  async getSession(id: string): Promise<Session> {
    const session = await this.sessionRepository.findById(id);
    if (!session) {
      throw new NotFoundException('세션을 찾을 수 없습니다.');
    }
    return session;
  }

  async getSessionByToken(token: string): Promise<Session> {
    const session = await this.sessionRepository.findByToken(token);
    if (!session) {
      throw new NotFoundException('세션을 찾을 수 없습니다.');
    }
    return session;
  }

  async getDeviceSessions(deviceId: string): Promise<Session[]> {
    return this.sessionRepository.findByDeviceId(deviceId);
  }

  async validateSession(token: string): Promise<{ valid: boolean; session?: Session }> {
    const session = await this.sessionRepository.findByToken(token);
    
    if (!session) {
      return { valid: false };
    }

    if (!session.isActive || session.expiresAt < new Date()) {
      return { valid: false };
    }

    // 세션 활성 시간 업데이트
    await this.sessionRepository.updateLastActive(session.id);

    return { valid: true, session };
  }

  async deactivateSession(id: string): Promise<Session> {
    const session = await this.sessionRepository.findById(id);
    if (!session) {
      throw new NotFoundException('세션을 찾을 수 없습니다.');
    }

    return this.sessionRepository.deactivate(id);
  }

  async deactivateDeviceSessions(deviceId: string): Promise<number> {
    return this.sessionRepository.deactivateByDeviceId(deviceId);
  }

  async cleanupExpiredSessions(): Promise<number> {
    return this.sessionRepository.deleteExpiredSessions();
  }
}