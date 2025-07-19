import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SessionService } from './session.service';
import { ISessionRepository } from '../repositories/interfaces/session.repository.interface';
import { DeviceService } from '../../devices/services/device.service';
import { CreateSessionInput } from '../dto/create-session.input';
import { Session } from '../entities/session.entity';
import { Device } from '../../devices/entities/device.entity';

describe('SessionService', () => {
  let service: SessionService;
  let sessionRepository: jest.Mocked<ISessionRepository>;
  let deviceService: any;

  const mockDevice: Device = {
    id: 'device-1',
    userId: 'user-1',
    deviceId: 'device-id-1',
    deviceName: 'iPhone 15',
    deviceType: 'mobile',
    lastActiveAt: new Date(),
    createdAt: new Date(),
  };

  const mockSession: Session = {
    id: 'session-1',
    deviceId: 'device-1',
    token: 'token-123',
    expiresAt: new Date(Date.now() + 3600000), // 1시간 후
    isActive: true,
    createdAt: new Date(),
    device: mockDevice,
  };

  const mockSessionRepository = (): jest.Mocked<ISessionRepository> => ({
    create: jest.fn(),
    findById: jest.fn(),
    findByToken: jest.fn(),
    findByDeviceId: jest.fn(),
    updateLastActive: jest.fn(),
    deactivate: jest.fn(),
    deactivateByDeviceId: jest.fn(),
    deleteExpiredSessions: jest.fn(),
  });

  const mockDeviceService = () => ({
    registerDevice: jest.fn(),
    getDevice: jest.fn(),
    getDeviceByDeviceId: jest.fn(),
    getUserDevices: jest.fn(),
    updateDevice: jest.fn(),
    removeDevice: jest.fn(),
    removeAllUserDevices: jest.fn(),
    getActiveDeviceCount: jest.fn(),
    validateDeviceOwnership: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: 'ISessionRepository',
          useValue: mockSessionRepository(),
        },
        {
          provide: DeviceService,
          useValue: mockDeviceService(),
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    sessionRepository = module.get('ISessionRepository');
    deviceService = module.get(DeviceService);
  });

  describe('createSession', () => {
    const createInput: CreateSessionInput = {
      deviceId: 'device-1',
      token: 'token-123',
      expiresAt: new Date(Date.now() + 3600000),
    };

    it('새 세션을 성공적으로 생성해야 함', async () => {
      deviceService.getDevice.mockResolvedValue(mockDevice);
      sessionRepository.findByDeviceId.mockResolvedValue([]);
      sessionRepository.create.mockResolvedValue(mockSession);

      const result = await service.createSession(createInput);

      expect(result).toEqual(mockSession);
      expect(deviceService.getDevice).toHaveBeenCalledWith(createInput.deviceId);
      expect(sessionRepository.create).toHaveBeenCalledWith(createInput);
    });

    it('디바이스를 찾을 수 없을 때 에러를 전파해야 함', async () => {
      deviceService.getDevice.mockRejectedValue(new NotFoundException());

      await expect(service.createSession(createInput)).rejects.toThrow(NotFoundException);
    });

    it('동시 세션 제한 초과 시 BadRequestException을 던져야 함', async () => {
      const activeSessions = Array(3).fill(mockSession);
      deviceService.getDevice.mockResolvedValue(mockDevice);
      sessionRepository.findByDeviceId.mockResolvedValue(activeSessions);

      await expect(service.createSession(createInput)).rejects.toThrow(
        new BadRequestException('디바이스당 최대 3개의 동시 세션만 허용됩니다.'),
      );
    });

    it('만료된 세션은 동시 세션 수 계산에서 제외해야 함', async () => {
      const expiredSession = { ...mockSession, expiresAt: new Date(Date.now() - 3600000) };
      const sessions = [mockSession, mockSession, expiredSession];
      
      deviceService.getDevice.mockResolvedValue(mockDevice);
      sessionRepository.findByDeviceId.mockResolvedValue(sessions);
      sessionRepository.create.mockResolvedValue(mockSession);

      const result = await service.createSession(createInput);

      expect(result).toEqual(mockSession);
      expect(sessionRepository.create).toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    it('ID로 세션을 조회해야 함', async () => {
      sessionRepository.findById.mockResolvedValue(mockSession);

      const result = await service.getSession('session-1');

      expect(result).toEqual(mockSession);
      expect(sessionRepository.findById).toHaveBeenCalledWith('session-1');
    });

    it('세션을 찾을 수 없을 때 NotFoundException을 던져야 함', async () => {
      sessionRepository.findById.mockResolvedValue(null);

      await expect(service.getSession('non-existent')).rejects.toThrow(
        new NotFoundException('세션을 찾을 수 없습니다.'),
      );
    });
  });

  describe('getSessionByToken', () => {
    it('토큰으로 세션을 조회해야 함', async () => {
      sessionRepository.findByToken.mockResolvedValue(mockSession);

      const result = await service.getSessionByToken('token-123');

      expect(result).toEqual(mockSession);
      expect(sessionRepository.findByToken).toHaveBeenCalledWith('token-123');
    });

    it('세션을 찾을 수 없을 때 NotFoundException을 던져야 함', async () => {
      sessionRepository.findByToken.mockResolvedValue(null);

      await expect(service.getSessionByToken('invalid-token')).rejects.toThrow(
        new NotFoundException('세션을 찾을 수 없습니다.'),
      );
    });
  });

  describe('validateSession', () => {
    it('유효한 세션에 대해 true와 세션을 반환해야 함', async () => {
      sessionRepository.findByToken.mockResolvedValue(mockSession);
      sessionRepository.updateLastActive.mockResolvedValue(mockSession);

      const result = await service.validateSession('token-123');

      expect(result).toEqual({ valid: true, session: mockSession });
      expect(sessionRepository.updateLastActive).toHaveBeenCalledWith(mockSession.id);
    });

    it('세션이 없을 때 false를 반환해야 함', async () => {
      sessionRepository.findByToken.mockResolvedValue(null);

      const result = await service.validateSession('invalid-token');

      expect(result).toEqual({ valid: false });
    });

    it('비활성 세션에 대해 false를 반환해야 함', async () => {
      const inactiveSession = { ...mockSession, isActive: false };
      sessionRepository.findByToken.mockResolvedValue(inactiveSession);

      const result = await service.validateSession('token-123');

      expect(result).toEqual({ valid: false });
    });

    it('만료된 세션에 대해 false를 반환해야 함', async () => {
      const expiredSession = { ...mockSession, expiresAt: new Date(Date.now() - 3600000) };
      sessionRepository.findByToken.mockResolvedValue(expiredSession);

      const result = await service.validateSession('token-123');

      expect(result).toEqual({ valid: false });
    });
  });

  describe('deactivateSession', () => {
    it('세션을 비활성화해야 함', async () => {
      const deactivatedSession = { ...mockSession, isActive: false };
      sessionRepository.findById.mockResolvedValue(mockSession);
      sessionRepository.deactivate.mockResolvedValue(deactivatedSession);

      const result = await service.deactivateSession('session-1');

      expect(result).toEqual(deactivatedSession);
      expect(sessionRepository.deactivate).toHaveBeenCalledWith('session-1');
    });

    it('세션을 찾을 수 없을 때 NotFoundException을 던져야 함', async () => {
      sessionRepository.findById.mockResolvedValue(null);

      await expect(service.deactivateSession('non-existent')).rejects.toThrow(
        new NotFoundException('세션을 찾을 수 없습니다.'),
      );
    });
  });

  describe('deactivateDeviceSessions', () => {
    it('디바이스의 모든 세션을 비활성화해야 함', async () => {
      sessionRepository.deactivateByDeviceId.mockResolvedValue(3);

      const result = await service.deactivateDeviceSessions('device-1');

      expect(result).toBe(3);
      expect(sessionRepository.deactivateByDeviceId).toHaveBeenCalledWith('device-1');
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('만료된 세션들을 정리해야 함', async () => {
      sessionRepository.deleteExpiredSessions.mockResolvedValue(5);

      const result = await service.cleanupExpiredSessions();

      expect(result).toBe(5);
      expect(sessionRepository.deleteExpiredSessions).toHaveBeenCalled();
    });
  });
});