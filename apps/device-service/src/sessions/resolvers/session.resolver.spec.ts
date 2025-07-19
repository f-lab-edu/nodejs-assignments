import { Test, TestingModule } from '@nestjs/testing';
import { SessionResolver } from './session.resolver';
import { SessionService } from '../services/session.service';
import { CreateSessionInput } from '../dto/create-session.input';
import { Session } from '../entities/session.entity';
import { Device } from '../../devices/entities/device.entity';

describe('SessionResolver', () => {
  let resolver: SessionResolver;
  let sessionService: any;

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
    expiresAt: new Date(Date.now() + 3600000),
    isActive: true,
    createdAt: new Date(),
    device: mockDevice,
  };

  const mockSessionService = () => ({
    createSession: jest.fn(),
    getSession: jest.fn(),
    getSessionByToken: jest.fn(),
    getDeviceSessions: jest.fn(),
    validateSession: jest.fn(),
    deactivateSession: jest.fn(),
    deactivateDeviceSessions: jest.fn(),
    cleanupExpiredSessions: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionResolver,
        {
          provide: SessionService,
          useValue: mockSessionService(),
        },
      ],
    }).compile();

    resolver = module.get<SessionResolver>(SessionResolver);
    sessionService = module.get<SessionService>(SessionService);
  });

  describe('createSession', () => {
    const createInput: CreateSessionInput = {
      deviceId: 'device-1',
      token: 'token-123',
      expiresAt: new Date(Date.now() + 3600000),
    };

    it('새 세션을 생성해야 함', async () => {
      sessionService.createSession.mockResolvedValue(mockSession);

      const result = await resolver.createSession(createInput);

      expect(result).toEqual(mockSession);
      expect(sessionService.createSession).toHaveBeenCalledWith(createInput);
    });

    it('서비스에서 에러가 발생하면 에러를 전파해야 함', async () => {
      const error = new Error('Service error');
      sessionService.createSession.mockRejectedValue(error);

      await expect(resolver.createSession(createInput)).rejects.toThrow(error);
    });
  });

  describe('session', () => {
    it('ID로 세션을 조회해야 함', async () => {
      sessionService.getSession.mockResolvedValue(mockSession);

      const result = await resolver.session('session-1');

      expect(result).toEqual(mockSession);
      expect(sessionService.getSession).toHaveBeenCalledWith('session-1');
    });

    it('서비스에서 에러가 발생하면 에러를 전파해야 함', async () => {
      const error = new Error('Session not found');
      sessionService.getSession.mockRejectedValue(error);

      await expect(resolver.session('non-existent')).rejects.toThrow(error);
    });
  });

  describe('sessionByToken', () => {
    it('토큰으로 세션을 조회해야 함', async () => {
      sessionService.getSessionByToken.mockResolvedValue(mockSession);

      const result = await resolver.sessionByToken('token-123');

      expect(result).toEqual(mockSession);
      expect(sessionService.getSessionByToken).toHaveBeenCalledWith('token-123');
    });

    it('서비스에서 에러가 발생하면 에러를 전파해야 함', async () => {
      const error = new Error('Token not found');
      sessionService.getSessionByToken.mockRejectedValue(error);

      await expect(resolver.sessionByToken('invalid-token')).rejects.toThrow(error);
    });
  });

  describe('deviceSessions', () => {
    it('디바이스의 모든 세션을 조회해야 함', async () => {
      const sessions = [mockSession, { ...mockSession, id: 'session-2' }];
      sessionService.getDeviceSessions.mockResolvedValue(sessions);

      const result = await resolver.deviceSessions('device-1');

      expect(result).toEqual(sessions);
      expect(sessionService.getDeviceSessions).toHaveBeenCalledWith('device-1');
    });

    it('빈 배열을 반환할 수 있어야 함', async () => {
      sessionService.getDeviceSessions.mockResolvedValue([]);

      const result = await resolver.deviceSessions('device-with-no-sessions');

      expect(result).toEqual([]);
      expect(sessionService.getDeviceSessions).toHaveBeenCalledWith('device-with-no-sessions');
    });
  });

  describe('validateSession', () => {
    it('유효한 세션에 대해 true를 반환해야 함', async () => {
      sessionService.validateSession.mockResolvedValue({ valid: true, session: mockSession });

      const result = await resolver.validateSession('token-123');

      expect(result).toBe(true);
      expect(sessionService.validateSession).toHaveBeenCalledWith('token-123');
    });

    it('유효하지 않은 세션에 대해 false를 반환해야 함', async () => {
      sessionService.validateSession.mockResolvedValue({ valid: false });

      const result = await resolver.validateSession('invalid-token');

      expect(result).toBe(false);
      expect(sessionService.validateSession).toHaveBeenCalledWith('invalid-token');
    });

    it('서비스에서 에러가 발생하면 에러를 전파해야 함', async () => {
      const error = new Error('Validation error');
      sessionService.validateSession.mockRejectedValue(error);

      await expect(resolver.validateSession('token-123')).rejects.toThrow(error);
    });
  });

  describe('deactivateSession', () => {
    it('세션을 비활성화해야 함', async () => {
      const deactivatedSession = { ...mockSession, isActive: false };
      sessionService.deactivateSession.mockResolvedValue(deactivatedSession);

      const result = await resolver.deactivateSession('session-1');

      expect(result).toEqual(deactivatedSession);
      expect(sessionService.deactivateSession).toHaveBeenCalledWith('session-1');
    });

    it('서비스에서 에러가 발생하면 에러를 전파해야 함', async () => {
      const error = new Error('Session not found');
      sessionService.deactivateSession.mockRejectedValue(error);

      await expect(resolver.deactivateSession('non-existent')).rejects.toThrow(error);
    });
  });

  describe('deactivateDeviceSessions', () => {
    it('디바이스의 모든 세션을 비활성화해야 함', async () => {
      sessionService.deactivateDeviceSessions.mockResolvedValue(3);

      const result = await resolver.deactivateDeviceSessions('device-1');

      expect(result).toBe(3);
      expect(sessionService.deactivateDeviceSessions).toHaveBeenCalledWith('device-1');
    });

    it('비활성화된 세션이 없으면 0을 반환해야 함', async () => {
      sessionService.deactivateDeviceSessions.mockResolvedValue(0);

      const result = await resolver.deactivateDeviceSessions('device-no-sessions');

      expect(result).toBe(0);
      expect(sessionService.deactivateDeviceSessions).toHaveBeenCalledWith('device-no-sessions');
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('만료된 세션들을 정리해야 함', async () => {
      sessionService.cleanupExpiredSessions.mockResolvedValue(5);

      const result = await resolver.cleanupExpiredSessions();

      expect(result).toBe(5);
      expect(sessionService.cleanupExpiredSessions).toHaveBeenCalled();
    });

    it('정리할 만료된 세션이 없으면 0을 반환해야 함', async () => {
      sessionService.cleanupExpiredSessions.mockResolvedValue(0);

      const result = await resolver.cleanupExpiredSessions();

      expect(result).toBe(0);
      expect(sessionService.cleanupExpiredSessions).toHaveBeenCalled();
    });

    it('서비스에서 에러가 발생하면 에러를 전파해야 함', async () => {
      const error = new Error('Cleanup error');
      sessionService.cleanupExpiredSessions.mockRejectedValue(error);

      await expect(resolver.cleanupExpiredSessions()).rejects.toThrow(error);
    });
  });
});