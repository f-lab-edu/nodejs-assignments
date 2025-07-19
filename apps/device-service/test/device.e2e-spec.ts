import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/database/prisma.service';

// Mock PrismaService for testing
const mockPrismaService = {
  device: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  session: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

describe('Device Service GraphQL (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await app.close();
  });

  beforeEach(async () => {
    await cleanupDatabase();
  });

  async function cleanupDatabase() {
    // Reset mocks
    jest.clearAllMocks();
  }

  describe('Device mutations', () => {
    const registerDeviceMutation = `
      mutation RegisterDevice($input: CreateDeviceInput!) {
        registerDevice(input: $input) {
          id
          userId
          deviceId
          deviceName
          deviceType
        }
      }
    `;

    it('새 디바이스를 등록해야 함', () => {
      const mockDevice = {
        id: 'device-1',
        userId: 'user-123',
        deviceId: 'device-unique-id',
        deviceName: 'MacBook Pro',
        deviceType: 'desktop',
        lastActiveAt: new Date(),
        createdAt: new Date(),
      };

      mockPrismaService.device.findUnique.mockResolvedValue(null); // 중복 체크
      mockPrismaService.device.findMany.mockResolvedValue([]); // 사용자 디바이스 수 체크
      mockPrismaService.device.create.mockResolvedValue(mockDevice);

      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: registerDeviceMutation,
          variables: {
            input: {
              userId: 'user-123',
              deviceId: 'device-unique-id',
              deviceName: 'MacBook Pro',
              deviceType: 'desktop',
            },
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.registerDevice).toMatchObject({
            userId: 'user-123',
            deviceId: 'device-unique-id',
            deviceName: 'MacBook Pro',
            deviceType: 'desktop',
          });
          expect(res.body.data.registerDevice.id).toBeDefined();
        });
    });

    it('중복된 디바이스 ID로 등록 시 에러를 반환해야 함', async () => {
      // 첫 번째 디바이스 등록
      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: registerDeviceMutation,
          variables: {
            input: {
              userId: 'user-123',
              deviceId: 'duplicate-device-id',
              deviceName: 'iPhone',
              deviceType: 'mobile',
            },
          },
        });

      // 같은 디바이스 ID로 재등록 시도
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: registerDeviceMutation,
          variables: {
            input: {
              userId: 'user-456',
              deviceId: 'duplicate-device-id',
              deviceName: 'Android',
              deviceType: 'mobile',
            },
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors[0].message).toContain('이미 등록된 디바이스입니다');
        });
    });

    it('디바이스 정보를 수정해야 함', async () => {
      // 디바이스 등록
      const registerRes = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: registerDeviceMutation,
          variables: {
            input: {
              userId: 'user-123',
              deviceId: 'device-to-update',
              deviceName: 'Old Name',
              deviceType: 'mobile',
            },
          },
        });

      const deviceId = registerRes.body.data.registerDevice.id;

      // 디바이스 업데이트
      const updateMutation = `
        mutation UpdateDevice($input: UpdateDeviceInput!) {
          updateDevice(input: $input) {
            id
            deviceName
            deviceType
          }
        }
      `;

      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateMutation,
          variables: {
            input: {
              id: deviceId,
              deviceName: 'New Name',
              deviceType: 'tablet',
            },
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.updateDevice).toMatchObject({
            id: deviceId,
            deviceName: 'New Name',
            deviceType: 'tablet',
          });
        });
    });
  });

  describe('Device queries', () => {
    let registeredDeviceId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation RegisterDevice($input: CreateDeviceInput!) {
              registerDevice(input: $input) {
                id
              }
            }
          `,
          variables: {
            input: {
              userId: 'user-test',
              deviceId: 'device-test-id',
              deviceName: 'Test Device',
              deviceType: 'mobile',
            },
          },
        });

      registeredDeviceId = res.body.data.registerDevice.id;
    });

    it('ID로 디바이스를 조회해야 함', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query GetDevice($id: ID!) {
              device(id: $id) {
                id
                userId
                deviceName
              }
            }
          `,
          variables: {
            id: registeredDeviceId,
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.device).toMatchObject({
            id: registeredDeviceId,
            userId: 'user-test',
            deviceName: 'Test Device',
          });
        });
    });

    it('사용자의 모든 디바이스를 조회해야 함', async () => {
      // 추가 디바이스 등록
      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation RegisterDevice($input: CreateDeviceInput!) {
              registerDevice(input: $input) {
                id
              }
            }
          `,
          variables: {
            input: {
              userId: 'user-test',
              deviceId: 'device-test-id-2',
              deviceName: 'Test Device 2',
              deviceType: 'desktop',
            },
          },
        });

      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query GetUserDevices($userId: String!) {
              userDevices(userId: $userId) {
                deviceName
                deviceType
              }
            }
          `,
          variables: {
            userId: 'user-test',
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.userDevices).toHaveLength(2);
          expect(res.body.data.userDevices).toContainEqual({
            deviceName: 'Test Device',
            deviceType: 'mobile',
          });
          expect(res.body.data.userDevices).toContainEqual({
            deviceName: 'Test Device 2',
            deviceType: 'desktop',
          });
        });
    });
  });

  describe('Session management', () => {
    let deviceId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation RegisterDevice($input: CreateDeviceInput!) {
              registerDevice(input: $input) {
                id
              }
            }
          `,
          variables: {
            input: {
              userId: 'session-user',
              deviceId: 'session-device',
              deviceName: 'Session Test Device',
              deviceType: 'mobile',
            },
          },
        });

      deviceId = res.body.data.registerDevice.id;
    });

    it('새 세션을 생성해야 함', () => {
      const expiresAt = new Date(Date.now() + 3600000).toISOString();

      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation CreateSession($input: CreateSessionInput!) {
              createSession(input: $input) {
                id
                deviceId
                token
                isActive
              }
            }
          `,
          variables: {
            input: {
              deviceId: deviceId,
              token: 'session-token-123',
              expiresAt: expiresAt,
            },
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createSession).toMatchObject({
            deviceId: deviceId,
            token: 'session-token-123',
            isActive: true,
          });
          expect(res.body.data.createSession.id).toBeDefined();
        });
    });

    it('세션 유효성을 검증해야 함', async () => {
      const expiresAt = new Date(Date.now() + 3600000).toISOString();

      // 세션 생성
      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation CreateSession($input: CreateSessionInput!) {
              createSession(input: $input) {
                token
              }
            }
          `,
          variables: {
            input: {
              deviceId: deviceId,
              token: 'valid-token',
              expiresAt: expiresAt,
            },
          },
        });

      // 세션 검증
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query ValidateSession($token: String!) {
              validateSession(token: $token)
            }
          `,
          variables: {
            token: 'valid-token',
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.validateSession).toBe(true);
        });
    });
  });
});