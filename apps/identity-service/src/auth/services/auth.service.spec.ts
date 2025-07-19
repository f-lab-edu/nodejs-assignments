import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../../users/services/user.service';
import { TokenService } from './token.service';
import { User } from '../../users/entities/user.entity';
import { LoginInput } from '../dto/login.input';
import { RefreshTokenInput } from '../dto/refresh-token.input';
import { AuthResponse } from '../dto/auth-response.dto';
import { JwtRefreshPayload } from '../interfaces/jwt-payload.interface';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let tokenService: jest.Mocked<TokenService>;

  const mockUser = User.create({
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword',
    isActive: true,
  });

  const mockTokens = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-123',
    expiresIn: 900,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            validatePassword: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            generateTokens: jest.fn(),
            verifyRefreshToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    tokenService = module.get(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginInput: LoginInput = {
      email: 'test@example.com',
      password: 'password123',
      deviceId: 'device-123',
    };

    it('유효한 자격 증명으로 로그인에 성공해야 함', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      userService.validatePassword.mockResolvedValue(true);
      tokenService.generateTokens.mockReturnValue(mockTokens);

      const result = await service.login(loginInput);

      expect(userService.findByEmail).toHaveBeenCalledWith(loginInput.email);
      expect(userService.validatePassword).toHaveBeenCalledWith(
        loginInput.password,
        mockUser.password
      );
      expect(tokenService.generateTokens).toHaveBeenCalledWith(mockUser, loginInput.deviceId);
      expect(result).toBeInstanceOf(AuthResponse);
      expect(result.user).toBe(mockUser);
      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
    });

    it('존재하지 않는 이메일로 로그인 시 UnauthorizedException을 던져야 함', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginInput)).rejects.toThrow(
        new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.')
      );

      expect(userService.validatePassword).not.toHaveBeenCalled();
      expect(tokenService.generateTokens).not.toHaveBeenCalled();
    });

    it('잘못된 비밀번호로 로그인 시 UnauthorizedException을 던져야 함', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      userService.validatePassword.mockResolvedValue(false);

      await expect(service.login(loginInput)).rejects.toThrow(
        new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.')
      );

      expect(tokenService.generateTokens).not.toHaveBeenCalled();
    });

    it('비활성화된 계정으로 로그인 시 UnauthorizedException을 던져야 함', async () => {
      const inactiveUser = User.create({
        id: 'user-456',
        email: 'inactive@example.com',
        password: 'hashedPassword',
        isActive: false,
      });

      userService.findByEmail.mockResolvedValue(inactiveUser);
      userService.validatePassword.mockResolvedValue(true);

      await expect(service.login(loginInput)).rejects.toThrow(
        new UnauthorizedException('비활성화된 계정입니다.')
      );

      expect(tokenService.generateTokens).not.toHaveBeenCalled();
    });

    it('deviceId 없이 로그인해야 함', async () => {
      const loginWithoutDevice = { ...loginInput, deviceId: undefined };

      userService.findByEmail.mockResolvedValue(mockUser);
      userService.validatePassword.mockResolvedValue(true);
      tokenService.generateTokens.mockReturnValue(mockTokens);

      await service.login(loginWithoutDevice);

      expect(tokenService.generateTokens).toHaveBeenCalledWith(mockUser, undefined);
    });
  });

  describe('refreshToken', () => {
    const refreshInput: RefreshTokenInput = {
      refreshToken: 'valid-refresh-token',
    };

    const mockRefreshPayload: JwtRefreshPayload = {
      sub: mockUser.id,
      tokenId: 'token-id-123',
      iat: 1234567890,
      exp: 1234567890 + 604800,
    };

    it('유효한 리프레시 토큰으로 토큰 갱신에 성공해야 함', async () => {
      tokenService.verifyRefreshToken.mockReturnValue(mockRefreshPayload);
      userService.findById.mockResolvedValue(mockUser);
      tokenService.generateTokens.mockReturnValue(mockTokens);

      const result = await service.refreshToken(refreshInput);

      expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(refreshInput.refreshToken);
      expect(userService.findById).toHaveBeenCalledWith(mockRefreshPayload.sub);
      expect(tokenService.generateTokens).toHaveBeenCalledWith(mockUser);
      expect(result).toBeInstanceOf(AuthResponse);
      expect(result.user).toBe(mockUser);
    });

    it('유효하지 않은 리프레시 토큰으로 토큰 갱신 시 UnauthorizedException을 던져야 함', async () => {
      tokenService.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshInput)).rejects.toThrow(
        new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.')
      );

      expect(userService.findById).not.toHaveBeenCalled();
      expect(tokenService.generateTokens).not.toHaveBeenCalled();
    });

    it('비활성화된 사용자의 토큰 갱신 시 UnauthorizedException을 던져야 함', async () => {
      const inactiveUser = User.create({
        id: 'user-456',
        email: 'inactive@example.com',
        password: 'hashedPassword',
        isActive: false,
      });

      tokenService.verifyRefreshToken.mockReturnValue(mockRefreshPayload);
      userService.findById.mockResolvedValue(inactiveUser);

      await expect(service.refreshToken(refreshInput)).rejects.toThrow(
        new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.')
      );

      expect(tokenService.generateTokens).not.toHaveBeenCalled();
    });

    it('존재하지 않는 사용자의 토큰 갱신 시 UnauthorizedException을 던져야 함', async () => {
      tokenService.verifyRefreshToken.mockReturnValue(mockRefreshPayload);
      userService.findById.mockResolvedValue(null);

      await expect(service.refreshToken(refreshInput)).rejects.toThrow(
        new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.')
      );
    });
  });

  describe('validateUser', () => {
    it('유효한 이메일과 비밀번호로 사용자 검증에 성공해야 함', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      userService.validatePassword.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toBe(mockUser);
      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(userService.validatePassword).toHaveBeenCalledWith('password123', mockUser.password);
    });

    it('존재하지 않는 이메일로 사용자 검증 시 UnauthorizedException을 던져야 함', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(service.validateUser('nonexistent@example.com', 'password123')).rejects.toThrow(
        new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.')
      );
    });

    it('잘못된 비밀번호로 사용자 검증 시 UnauthorizedException을 던져야 함', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      userService.validatePassword.mockResolvedValue(false);

      await expect(service.validateUser('test@example.com', 'wrongpassword')).rejects.toThrow(
        new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.')
      );
    });
  });

  describe('validateTokenPayload', () => {
    it('유효한 토큰 페이로드로 사용자 검증에 성공해야 함', async () => {
      const payload = { sub: mockUser.id, email: mockUser.email };
      userService.findById.mockResolvedValue(mockUser);

      const result = await service.validateTokenPayload(payload);

      expect(result).toBe(mockUser);
      expect(userService.findById).toHaveBeenCalledWith(payload.sub);
    });

    it('sub가 없는 페이로드로 검증 시 UnauthorizedException을 던져야 함', async () => {
      const payload = { email: mockUser.email };

      await expect(service.validateTokenPayload(payload)).rejects.toThrow(
        new UnauthorizedException('유효하지 않은 토큰입니다.')
      );

      expect(userService.findById).not.toHaveBeenCalled();
    });

    it('존재하지 않는 사용자 ID로 검증 시 UnauthorizedException을 던져야 함', async () => {
      const payload = { sub: 'nonexistent-user-id' };
      userService.findById.mockResolvedValue(null);

      await expect(service.validateTokenPayload(payload)).rejects.toThrow(
        new UnauthorizedException('유효하지 않은 사용자입니다.')
      );
    });

    it('비활성화된 사용자로 검증 시 UnauthorizedException을 던져야 함', async () => {
      const inactiveUser = User.create({
        id: 'user-456',
        email: 'inactive@example.com',
        password: 'hashedPassword',
        isActive: false,
      });

      const payload = { sub: inactiveUser.id };
      userService.findById.mockResolvedValue(inactiveUser);

      await expect(service.validateTokenPayload(payload)).rejects.toThrow(
        new UnauthorizedException('유효하지 않은 사용자입니다.')
      );
    });
  });

  describe('인스턴스 생성', () => {
    it('AuthService 인스턴스가 정상적으로 생성되어야 함', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(AuthService);
    });
  });
});