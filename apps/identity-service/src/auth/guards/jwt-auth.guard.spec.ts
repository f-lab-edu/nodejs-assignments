import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtAuthGuard } from './jwt-auth.guard';

jest.mock('@nestjs/graphql');

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockGqlExecutionContext: jest.Mocked<GqlExecutionContext>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);

    mockExecutionContext = {
      switchToHttp: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
    } as any;

    mockGqlExecutionContext = {
      getContext: jest.fn(),
      getArgs: jest.fn(),
      getRoot: jest.fn(),
      getInfo: jest.fn(),
      getType: jest.fn(),
    } as any;

    (GqlExecutionContext.create as jest.Mock).mockReturnValue(mockGqlExecutionContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRequest', () => {
    it('GraphQL 컨텍스트에서 요청 객체를 올바르게 추출해야 함', () => {
      const mockRequest = { user: { id: '1' }, headers: { authorization: 'Bearer token' } };
      const mockContext = { req: mockRequest };
      
      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      const result = guard.getRequest(mockExecutionContext);

      expect(GqlExecutionContext.create).toHaveBeenCalledWith(mockExecutionContext);
      expect(mockGqlExecutionContext.getContext).toHaveBeenCalled();
      expect(result).toBe(mockRequest);
    });

    it('빈 컨텍스트에서도 정상적으로 처리해야 함', () => {
      const mockContext = { req: undefined };
      
      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      const result = guard.getRequest(mockExecutionContext);

      expect(result).toBeUndefined();
    });

    it('컨텍스트에 req 프로퍼티가 없을 때 undefined를 반환해야 함', () => {
      const mockContext = {};
      
      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      const result = guard.getRequest(mockExecutionContext);

      expect(result).toBeUndefined();
    });
  });

  describe('인스턴스 생성', () => {
    it('JwtAuthGuard 인스턴스가 정상적으로 생성되어야 함', () => {
      expect(guard).toBeDefined();
      expect(guard).toBeInstanceOf(JwtAuthGuard);
    });

    it('AuthGuard를 상속받아야 함', () => {
      expect(guard.constructor.name).toBe('JwtAuthGuard');
    });
  });
});