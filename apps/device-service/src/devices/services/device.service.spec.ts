import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { DeviceService } from './device.service';
import { IDeviceRepository } from '../repositories/interfaces/device.repository.interface';
import { CreateDeviceInput } from '../dto/create-device.input';
import { UpdateDeviceInput } from '../dto/update-device.input';
import { Device } from '../entities/device.entity';

describe('DeviceService', () => {
  let service: DeviceService;
  let deviceRepository: jest.Mocked<IDeviceRepository>;

  const mockDevice: Device = {
    id: 'device-1',
    userId: 'user-1',
    deviceId: 'device-id-1',
    deviceName: 'iPhone 15',
    deviceType: 'mobile',
    lastActiveAt: new Date(),
    createdAt: new Date(),
  };

  const mockDeviceRepository = (): jest.Mocked<IDeviceRepository> => ({
    create: jest.fn(),
    findById: jest.fn(),
    findByDeviceId: jest.fn(),
    findByUserId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteByUserId: jest.fn(),
    countActiveDevicesByUserId: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceService,
        {
          provide: 'IDeviceRepository',
          useValue: mockDeviceRepository(),
        },
      ],
    }).compile();

    service = module.get<DeviceService>(DeviceService);
    deviceRepository = module.get('IDeviceRepository');
  });

  describe('registerDevice', () => {
    const createInput: CreateDeviceInput = {
      userId: 'user-1',
      deviceId: 'device-id-1',
      deviceName: 'iPhone 15',
      deviceType: 'mobile',
    };

    it('새 디바이스를 성공적으로 등록해야 함', async () => {
      deviceRepository.findByDeviceId.mockResolvedValue(null);
      deviceRepository.findByUserId.mockResolvedValue([]);
      deviceRepository.create.mockResolvedValue(mockDevice);

      const result = await service.registerDevice(createInput);

      expect(result).toEqual(mockDevice);
      expect(deviceRepository.findByDeviceId).toHaveBeenCalledWith(createInput.deviceId);
      expect(deviceRepository.findByUserId).toHaveBeenCalledWith(createInput.userId);
      expect(deviceRepository.create).toHaveBeenCalledWith(createInput);
    });

    it('중복된 디바이스 ID로 등록 시 ConflictException을 던져야 함', async () => {
      deviceRepository.findByDeviceId.mockResolvedValue(mockDevice);

      await expect(service.registerDevice(createInput)).rejects.toThrow(
        new ConflictException('이미 등록된 디바이스입니다.'),
      );
    });

    it('사용자 디바이스 제한 초과 시 BadRequestException을 던져야 함', async () => {
      const existingDevices = Array(5).fill(mockDevice);
      deviceRepository.findByDeviceId.mockResolvedValue(null);
      deviceRepository.findByUserId.mockResolvedValue(existingDevices);

      await expect(service.registerDevice(createInput)).rejects.toThrow(
        new BadRequestException('사용자당 최대 5개의 디바이스만 등록할 수 있습니다.'),
      );
    });
  });

  describe('getDevice', () => {
    it('ID로 디바이스를 조회해야 함', async () => {
      deviceRepository.findById.mockResolvedValue(mockDevice);

      const result = await service.getDevice('device-1');

      expect(result).toEqual(mockDevice);
      expect(deviceRepository.findById).toHaveBeenCalledWith('device-1');
    });

    it('디바이스를 찾을 수 없을 때 NotFoundException을 던져야 함', async () => {
      deviceRepository.findById.mockResolvedValue(null);

      await expect(service.getDevice('non-existent')).rejects.toThrow(
        new NotFoundException('디바이스를 찾을 수 없습니다.'),
      );
    });
  });

  describe('getDeviceByDeviceId', () => {
    it('디바이스 ID로 디바이스를 조회해야 함', async () => {
      deviceRepository.findByDeviceId.mockResolvedValue(mockDevice);

      const result = await service.getDeviceByDeviceId('device-id-1');

      expect(result).toEqual(mockDevice);
      expect(deviceRepository.findByDeviceId).toHaveBeenCalledWith('device-id-1');
    });

    it('디바이스를 찾을 수 없을 때 NotFoundException을 던져야 함', async () => {
      deviceRepository.findByDeviceId.mockResolvedValue(null);

      await expect(service.getDeviceByDeviceId('non-existent')).rejects.toThrow(
        new NotFoundException('디바이스를 찾을 수 없습니다.'),
      );
    });
  });

  describe('getUserDevices', () => {
    it('사용자의 모든 디바이스를 반환해야 함', async () => {
      const devices = [mockDevice, { ...mockDevice, id: 'device-2' }];
      deviceRepository.findByUserId.mockResolvedValue(devices);

      const result = await service.getUserDevices('user-1');

      expect(result).toEqual(devices);
      expect(deviceRepository.findByUserId).toHaveBeenCalledWith('user-1');
    });
  });

  describe('updateDevice', () => {
    const updateInput: UpdateDeviceInput = {
      id: 'device-1',
      deviceName: 'iPhone 15 Pro',
    };

    it('디바이스 정보를 업데이트해야 함', async () => {
      const updatedDevice = { ...mockDevice, deviceName: 'iPhone 15 Pro' };
      deviceRepository.findById.mockResolvedValue(mockDevice);
      deviceRepository.update.mockResolvedValue(updatedDevice);

      const result = await service.updateDevice(updateInput);

      expect(result).toEqual(updatedDevice);
      expect(deviceRepository.update).toHaveBeenCalledWith('device-1', updateInput);
    });

    it('디바이스를 찾을 수 없을 때 NotFoundException을 던져야 함', async () => {
      deviceRepository.findById.mockResolvedValue(null);

      await expect(service.updateDevice(updateInput)).rejects.toThrow(
        new NotFoundException('디바이스를 찾을 수 없습니다.'),
      );
    });
  });

  describe('removeDevice', () => {
    it('디바이스를 성공적으로 제거해야 함', async () => {
      deviceRepository.findById.mockResolvedValue(mockDevice);
      deviceRepository.delete.mockResolvedValue(true);

      const result = await service.removeDevice('device-1');

      expect(result).toBe(true);
      expect(deviceRepository.delete).toHaveBeenCalledWith('device-1');
    });

    it('디바이스를 찾을 수 없을 때 NotFoundException을 던져야 함', async () => {
      deviceRepository.findById.mockResolvedValue(null);

      await expect(service.removeDevice('non-existent')).rejects.toThrow(
        new NotFoundException('디바이스를 찾을 수 없습니다.'),
      );
    });
  });

  describe('removeAllUserDevices', () => {
    it('사용자의 모든 디바이스를 제거해야 함', async () => {
      deviceRepository.deleteByUserId.mockResolvedValue(3);

      const result = await service.removeAllUserDevices('user-1');

      expect(result).toBe(3);
      expect(deviceRepository.deleteByUserId).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getActiveDeviceCount', () => {
    it('활성 디바이스 수를 반환해야 함', async () => {
      deviceRepository.countActiveDevicesByUserId.mockResolvedValue(2);

      const result = await service.getActiveDeviceCount('user-1');

      expect(result).toBe(2);
      expect(deviceRepository.countActiveDevicesByUserId).toHaveBeenCalledWith('user-1');
    });
  });

  describe('validateDeviceOwnership', () => {
    it('디바이스 소유자가 맞으면 true를 반환해야 함', async () => {
      deviceRepository.findByDeviceId.mockResolvedValue(mockDevice);

      const result = await service.validateDeviceOwnership('device-id-1', 'user-1');

      expect(result).toBe(true);
    });

    it('디바이스 소유자가 아니면 false를 반환해야 함', async () => {
      deviceRepository.findByDeviceId.mockResolvedValue(mockDevice);

      const result = await service.validateDeviceOwnership('device-id-1', 'user-2');

      expect(result).toBe(false);
    });

    it('디바이스가 없으면 false를 반환해야 함', async () => {
      deviceRepository.findByDeviceId.mockResolvedValue(null);

      const result = await service.validateDeviceOwnership('non-existent', 'user-1');

      expect(result).toBe(false);
    });
  });
});