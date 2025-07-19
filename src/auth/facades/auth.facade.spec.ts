import { Test, TestingModule } from '@nestjs/testing';
import { AuthFacade } from './auth.facade';
import { AuthService } from '../services/auth.service';
import { UserService } from '../../users/services/user.service';
import { ProfileService } from '../../profiles/services/profile.service';
import { User } from '../../users/entities/user.entity';
import { Profile } from '../../profiles/entities/profile.entity';
import { RegisterInput } from '../dto/register.input';
import { AuthResponse } from '../dto/auth-response.dto';

describe('AuthFacade', () => {
  let facade: AuthFacade;
  let authService: jest.Mocked<AuthService>;
  let userService: jest.Mocked<UserService>;
  let profileService: jest.Mocked<ProfileService>;

  const mockUser = User.create({
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword',
    isActive: true,
  });

  const mockProfile = Profile.create({
    id: 'profile-123',
    userId: 'user-123',
    name: '기본 프로필',
    isKids: false,
    language: 'ko',
    maturityRating: 'ALL',
  });

  const mockAuthResponse = new AuthResponse({
    user: mockUser,
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-123',
    expiresIn: 900,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthFacade,
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: ProfileService,
          useValue: {
            create: jest.fn(),
            createDefault: jest.fn(),
          },
        },
      ],
    }).compile();

    facade = module.get<AuthFacade>(AuthFacade);
    authService = module.get(AuthService);
    userService = module.get(UserService);
    profileService = module.get(ProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerInput: RegisterInput = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('사용자 등록과 기본 프로필 생성에 성공해야 함', async () => {
      userService.create.mockResolvedValue(mockUser);
      profileService.createDefault.mockResolvedValue(mockProfile);
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await facade.register(registerInput);

      expect(userService.create).toHaveBeenCalledWith({
        email: registerInput.email,
        password: registerInput.password,
      });
      expect(profileService.createDefault).toHaveBeenCalledWith(mockUser.id);
      expect(authService.login).toHaveBeenCalledWith({
        email: mockUser.email,
        password: registerInput.password,
      });
      expect(result).toBe(mockAuthResponse);
    });

    it('사용자 생성이 실패하면 프로필을 생성하지 않고 에러를 전파해야 함', async () => {
      const createUserError = new Error('사용자 생성 실패');
      userService.create.mockRejectedValue(createUserError);

      await expect(facade.register(registerInput)).rejects.toThrow(createUserError);

      expect(userService.create).toHaveBeenCalledWith({
        email: registerInput.email,
        password: registerInput.password,
      });
      expect(profileService.createDefault).not.toHaveBeenCalled();
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('프로필 생성이 실패하면 로그인하지 않고 에러를 전파해야 함', async () => {
      const createProfileError = new Error('프로필 생성 실패');
      userService.create.mockResolvedValue(mockUser);
      profileService.createDefault.mockRejectedValue(createProfileError);

      await expect(facade.register(registerInput)).rejects.toThrow(createProfileError);

      expect(userService.create).toHaveBeenCalled();
      expect(profileService.createDefault).toHaveBeenCalledWith(mockUser.id);
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('로그인이 실패하면 에러를 전파해야 함', async () => {
      const loginError = new Error('로그인 실패');
      userService.create.mockResolvedValue(mockUser);
      profileService.createDefault.mockResolvedValue(undefined);
      authService.login.mockRejectedValue(loginError);

      await expect(facade.register(registerInput)).rejects.toThrow(loginError);

      expect(userService.create).toHaveBeenCalled();
      expect(profileService.createDefault).toHaveBeenCalled();
      expect(authService.login).toHaveBeenCalledWith({
        email: mockUser.email,
        password: registerInput.password,
      });
    });

    it('올바른 순서로 메서드들이 호출되어야 함', async () => {
      const callOrder: string[] = [];

      userService.create.mockImplementation(async () => {
        callOrder.push('userService.create');
        return mockUser;
      });

      profileService.createDefault.mockImplementation(async () => {
        callOrder.push('profileService.createDefault');
        return mockProfile;
      });

      authService.login.mockImplementation(async () => {
        callOrder.push('authService.login');
        return mockAuthResponse;
      });

      await facade.register(registerInput);

      expect(callOrder).toEqual([
        'userService.create',
        'profileService.createDefault',
        'authService.login'
      ]);
    });
  });

  describe('registerWithProfile', () => {
    const registerInput: RegisterInput = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('커스텀 프로필 이름과 함께 사용자 등록에 성공해야 함', async () => {
      const profileName = '내 프로필';
      userService.create.mockResolvedValue(mockUser);
      profileService.create.mockResolvedValue(mockProfile);
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await facade.registerWithProfile(registerInput, profileName);

      expect(userService.create).toHaveBeenCalledWith({
        email: registerInput.email,
        password: registerInput.password,
      });
      expect(profileService.create).toHaveBeenCalledWith(mockUser.id, {
        name: profileName,
      });
      expect(profileService.createDefault).not.toHaveBeenCalled();
      expect(authService.login).toHaveBeenCalledWith({
        email: mockUser.email,
        password: registerInput.password,
      });
      expect(result).toBe(mockAuthResponse);
    });

    it('프로필 이름 없이 사용자 등록 시 기본 프로필을 생성해야 함', async () => {
      userService.create.mockResolvedValue(mockUser);
      profileService.createDefault.mockResolvedValue(mockProfile);
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await facade.registerWithProfile(registerInput);

      expect(userService.create).toHaveBeenCalledWith({
        email: registerInput.email,
        password: registerInput.password,
      });
      expect(profileService.createDefault).toHaveBeenCalledWith(mockUser.id);
      expect(profileService.create).not.toHaveBeenCalled();
      expect(authService.login).toHaveBeenCalledWith({
        email: mockUser.email,
        password: registerInput.password,
      });
      expect(result).toBe(mockAuthResponse);
    });

    it('빈 문자열 프로필 이름일 때 기본 프로필을 생성해야 함', async () => {
      userService.create.mockResolvedValue(mockUser);
      profileService.createDefault.mockResolvedValue(mockProfile);
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await facade.registerWithProfile(registerInput, '');

      expect(profileService.createDefault).toHaveBeenCalledWith(mockUser.id);
      expect(profileService.create).not.toHaveBeenCalled();
      expect(result).toBe(mockAuthResponse);
    });

    it('사용자 생성이 실패하면 프로필을 생성하지 않고 에러를 전파해야 함', async () => {
      const createUserError = new Error('사용자 생성 실패');
      userService.create.mockRejectedValue(createUserError);

      await expect(facade.registerWithProfile(registerInput, '프로필')).rejects.toThrow(createUserError);

      expect(userService.create).toHaveBeenCalled();
      expect(profileService.create).not.toHaveBeenCalled();
      expect(profileService.createDefault).not.toHaveBeenCalled();
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('커스텀 프로필 생성이 실패하면 로그인하지 않고 에러를 전파해야 함', async () => {
      const createProfileError = new Error('커스텀 프로필 생성 실패');
      userService.create.mockResolvedValue(mockUser);
      profileService.create.mockRejectedValue(createProfileError);

      await expect(facade.registerWithProfile(registerInput, '프로필')).rejects.toThrow(createProfileError);

      expect(userService.create).toHaveBeenCalled();
      expect(profileService.create).toHaveBeenCalledWith(mockUser.id, { name: '프로필' });
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('올바른 순서로 메서드들이 호출되어야 함 (커스텀 프로필)', async () => {
      const callOrder: string[] = [];
      const profileName = '내 프로필';

      userService.create.mockImplementation(async () => {
        callOrder.push('userService.create');
        return mockUser;
      });

      profileService.create.mockImplementation(async () => {
        callOrder.push('profileService.create');
        return mockProfile;
      });

      authService.login.mockImplementation(async () => {
        callOrder.push('authService.login');
        return mockAuthResponse;
      });

      await facade.registerWithProfile(registerInput, profileName);

      expect(callOrder).toEqual([
        'userService.create',
        'profileService.create',
        'authService.login'
      ]);
    });

    it('올바른 순서로 메서드들이 호출되어야 함 (기본 프로필)', async () => {
      const callOrder: string[] = [];

      userService.create.mockImplementation(async () => {
        callOrder.push('userService.create');
        return mockUser;
      });

      profileService.createDefault.mockImplementation(async () => {
        callOrder.push('profileService.createDefault');
        return mockProfile;
      });

      authService.login.mockImplementation(async () => {
        callOrder.push('authService.login');
        return mockAuthResponse;
      });

      await facade.registerWithProfile(registerInput);

      expect(callOrder).toEqual([
        'userService.create',
        'profileService.createDefault',
        'authService.login'
      ]);
    });
  });

  describe('인스턴스 생성', () => {
    it('AuthFacade 인스턴스가 정상적으로 생성되어야 함', () => {
      expect(facade).toBeDefined();
      expect(facade).toBeInstanceOf(AuthFacade);
    });
  });
});