import { Session } from '../../entities/session.entity';
import { CreateSessionInput } from '../../dto/create-session.input';

export interface ISessionRepository {
  create(data: CreateSessionInput): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  findByToken(token: string): Promise<Session | null>;
  findByDeviceId(deviceId: string): Promise<Session[]>;
  updateLastActive(id: string): Promise<Session>;
  deactivate(id: string): Promise<Session>;
  deactivateByDeviceId(deviceId: string): Promise<number>;
  deleteExpiredSessions(): Promise<number>;
}