import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { User } from '../../users/entities/user.entity';
import { JwtPayload, JwtRefreshPayload } from '../interfaces/jwt-payload.interface';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = User.create({
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword',
    isActive: true,
  });

  const mockJwtSecret = 'test-jwt-secret';
  const mockRefreshSecret = 'test-refresh-secret';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    // ConfigService 기본 설정
    configService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        JWT_SECRET: mockJwtSecret,
        JWT_REFRESH_SECRET: mockRefreshSecret,
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return config[key] || defaultValue;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('deviceId 없이 액세스 토큰을 생성해야 함', () => {
      const mockToken = 'access-token-123';
      jwtService.sign.mockReturnValue(mockToken);

      const result = service.generateAccessToken(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          email: mockUser.email,
        }),
        {
          secret: mockJwtSecret,
          expiresIn: '15m',
        }
      );
      expect(result).toBe(mockToken);
    });

    it('deviceId와 함께 액세스 토큰을 생성해야 함', () => {
      const mockToken = 'access-token-with-device';
      const deviceId = 'device-123';
      jwtService.sign.mockReturnValue(mockToken);

      const result = service.generateAccessToken(mockUser, deviceId);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          email: mockUser.email,
          deviceId: deviceId,
        }),
        {
          secret: mockJwtSecret,
          expiresIn: '15m',
        }
      );
      expect(result).toBe(mockToken);
    });

    it('올바른 expiresIn 옵션을 설정해야 함', () => {
      jwtService.sign.mockReturnValue('token');

      service.generateAccessToken(mockUser);

      const options = jwtService.sign.mock.calls[0][1];
      expect(options.expiresIn).toBe('15m');
    });
  });

  describe('generateRefreshToken', () => {
    it('리프레시 토큰을 생성해야 함', () => {
      const mockToken = 'refresh-token-123';
      jwtService.sign.mockReturnValue(mockToken);

      const result = service.generateRefreshToken(mockUser.id);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          tokenId: expect.any(String),
        }),
        {
          secret: mockRefreshSecret,
          expiresIn: '7d',
        }
      );
      expect(result).toBe(mockToken);
    });

    it('고유한 tokenId를 생성해야 함', () => {
      jwtService.sign.mockReturnValue('token');

      service.generateRefreshToken(mockUser.id);
      const firstCall = jwtService.sign.mock.calls[0][0] as JwtRefreshPayload;

      service.generateRefreshToken(mockUser.id);
      const secondCall = jwtService.sign.mock.calls[1][0] as JwtRefreshPayload;

      expect(firstCall.tokenId).not.toBe(secondCall.tokenId);
    });

    it('올바른 expiresIn 옵션을 설정해야 함', () => {
      jwtService.sign.mockReturnValue('token');

      service.generateRefreshToken(mockUser.id);

      const options = jwtService.sign.mock.calls[0][1];
      expect(options.expiresIn).toBe('7d');
    });
  });

  describe('generateTokens', () => {
    it('액세스 토큰과 리프레시 토큰을 모두 생성해야 함', () => {
      const mockAccessToken = 'access-token';
      const mockRefreshToken = 'refresh-token';

      jwtService.sign
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      const result = service.generateTokens(mockUser);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        expiresIn: 900, // 15분
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('deviceId와 함께 토큰들을 생성해야 함', () => {
      const deviceId = 'device-123';
      jwtService.sign.mockReturnValue('token');

      service.generateTokens(mockUser, deviceId);

      const accessTokenPayload = jwtService.sign.mock.calls[0][0] as JwtPayload;
      expect(accessTokenPayload.deviceId).toBe(deviceId);
    });
  });

  describe('verifyAccessToken', () => {
    it('유효한 액세스 토큰을 검증해야 함', () => {
      const mockToken = 'valid-access-token';
      const mockPayload: JwtPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        iat: 1234567890,
        exp: 1234567890 + 900,
      };

      jwtService.verify.mockReturnValue(mockPayload);

      const result = service.verifyAccessToken(mockToken);

      expect(jwtService.verify).toHaveBeenCalledWith(mockToken, {
        secret: mockJwtSecret,
      });
      expect(result).toBe(mockPayload);
    });

    it('토큰 검증 실패 시 에러를 전파해야 함', () => {
      const mockToken = 'invalid-token';
      const mockError = new Error('Token verification failed');

      jwtService.verify.mockImplementation(() => {
        throw mockError;
      });

      expect(() => service.verifyAccessToken(mockToken)).toThrow(mockError);
    });
  });

  describe('verifyRefreshToken', () => {
    it('유효한 리프레시 토큰을 검증해야 함', () => {
      const mockToken = 'valid-refresh-token';
      const mockPayload: JwtRefreshPayload = {
        sub: mockUser.id,
        tokenId: 'token-id-123',
        iat: 1234567890,
        exp: 1234567890 + 604800,
      };

      jwtService.verify.mockReturnValue(mockPayload);

      const result = service.verifyRefreshToken(mockToken);

      expect(jwtService.verify).toHaveBeenCalledWith(mockToken, {
        secret: mockRefreshSecret,
      });
      expect(result).toBe(mockPayload);
    });
  });

  describe('parseTimeToSeconds', () => {
    it('초 단위 시간을 올바르게 파싱해야 함', () => {
      configService.get.mockReturnValue('30s');

      const result = service['parseTimeToSeconds']('30s');

      expect(result).toBe(30);
    });

    it('분 단위 시간을 올바르게 파싱해야 함', () => {
      configService.get.mockReturnValue('15m');

      const result = service['parseTimeToSeconds']('15m');

      expect(result).toBe(900); // 15 * 60
    });

    it('시간 단위 시간을 올바르게 파싱해야 함', () => {
      configService.get.mockReturnValue('2h');

      const result = service['parseTimeToSeconds']('2h');

      expect(result).toBe(7200); // 2 * 60 * 60
    });

    it('일 단위 시간을 올바르게 파싱해야 함', () => {
      configService.get.mockReturnValue('7d');

      const result = service['parseTimeToSeconds']('7d');

      expect(result).toBe(604800); // 7 * 24 * 60 * 60
    });

    it('잘못된 단위일 때 기본값을 반환해야 함', () => {
      configService.get.mockReturnValue('10x');

      const result = service['parseTimeToSeconds']('10x');

      expect(result).toBe(900); // 기본값 15분
    });
  });

  describe('generateTokenId', () => {
    it('고유한 토큰 ID를 생성해야 함', () => {
      const id1 = service['generateTokenId']();
      const id2 = service['generateTokenId']();

      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
      expect(id2.length).toBeGreaterThan(0);
    });
  });

  describe('인스턴스 생성', () => {
    it('TokenService 인스턴스가 정상적으로 생성되어야 함', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(TokenService);
    });
  });
});