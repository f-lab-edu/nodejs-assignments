import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from '../services/auth.service';
import { LoginInput } from '../dto/login.input';
import { RegisterInput } from '../dto/register.input';
import { RefreshTokenInput } from '../dto/refresh-token.input';
import { AuthResponse } from '../dto/auth-response.dto';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResponse, { description: '사용자 로그인' })
  async login(@Args('input') input: LoginInput): Promise<AuthResponse> {
    return this.authService.login(input);
  }

  @Mutation(() => AuthResponse, { description: '사용자 회원가입' })
  async register(@Args('input') input: RegisterInput): Promise<AuthResponse> {
    // 이 부분은 Phase 8에서 AuthFacade를 통해 구현
    throw new Error('Phase 8에서 AuthFacade를 통해 구현 예정');
  }

  @Mutation(() => AuthResponse, { description: 'JWT 토큰 갱신' })
  async refreshToken(@Args('input') input: RefreshTokenInput): Promise<AuthResponse> {
    return this.authService.refreshToken(input);
  }
}