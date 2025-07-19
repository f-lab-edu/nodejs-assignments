import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from '../services/auth.service';
import { AuthFacade } from '../facades/auth.facade';
import { LoginInput } from '../dto/login.input';
import { RegisterInput } from '../dto/register.input';
import { RegisterWithProfileInput } from '../dto/register-with-profile.input';
import { RefreshTokenInput } from '../dto/refresh-token.input';
import { AuthResponse } from '../dto/auth-response.dto';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly authFacade: AuthFacade,
  ) {}

  @Mutation(() => AuthResponse, { description: '사용자 로그인' })
  async login(@Args('input') input: LoginInput): Promise<AuthResponse> {
    return this.authService.login(input);
  }

  @Mutation(() => AuthResponse, { description: '사용자 회원가입 및 기본 프로필 생성' })
  async register(@Args('input') input: RegisterInput): Promise<AuthResponse> {
    return this.authFacade.register(input);
  }

  @Mutation(() => AuthResponse, { description: '사용자 회원가입 및 커스텀 프로필 생성' })
  async registerWithProfile(@Args('input') input: RegisterWithProfileInput): Promise<AuthResponse> {
    return this.authFacade.registerWithProfile(input, input.profileName);
  }

  @Mutation(() => AuthResponse, { description: 'JWT 토큰 갱신' })
  async refreshToken(@Args('input') input: RefreshTokenInput): Promise<AuthResponse> {
    return this.authService.refreshToken(input);
  }
}