import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Session } from '../entities/session.entity';
import { SessionService } from '../services/session.service';
import { CreateSessionInput } from '../dto/create-session.input';

@Resolver(() => Session)
export class SessionResolver {
  constructor(private readonly sessionService: SessionService) {}

  @Mutation(() => Session, { description: '새 세션 생성' })
  async createSession(
    @Args('input') input: CreateSessionInput,
  ): Promise<Session> {
    return this.sessionService.createSession(input);
  }

  @Query(() => Session, { description: '세션 ID로 조회' })
  async session(@Args('id', { type: () => ID }) id: string): Promise<Session> {
    return this.sessionService.getSession(id);
  }

  @Query(() => Session, { description: '토큰으로 세션 조회' })
  async sessionByToken(@Args('token') token: string): Promise<Session> {
    return this.sessionService.getSessionByToken(token);
  }

  @Query(() => [Session], { description: '디바이스의 모든 세션 조회' })
  async deviceSessions(@Args('deviceId') deviceId: string): Promise<Session[]> {
    return this.sessionService.getDeviceSessions(deviceId);
  }

  @Query(() => Boolean, { description: '세션 유효성 검증' })
  async validateSession(@Args('token') token: string): Promise<boolean> {
    const result = await this.sessionService.validateSession(token);
    return result.valid;
  }

  @Mutation(() => Session, { description: '세션 비활성화' })
  async deactivateSession(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Session> {
    return this.sessionService.deactivateSession(id);
  }

  @Mutation(() => Number, { description: '디바이스의 모든 세션 비활성화' })
  async deactivateDeviceSessions(
    @Args('deviceId') deviceId: string,
  ): Promise<number> {
    return this.sessionService.deactivateDeviceSessions(deviceId);
  }

  @Mutation(() => Number, { description: '만료된 세션 정리' })
  async cleanupExpiredSessions(): Promise<number> {
    return this.sessionService.cleanupExpiredSessions();
  }
}