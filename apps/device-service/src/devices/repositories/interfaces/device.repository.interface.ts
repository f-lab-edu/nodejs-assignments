import { Device } from '../../entities/device.entity';
import { CreateDeviceInput } from '../../dto/create-device.input';
import { UpdateDeviceInput } from '../../dto/update-device.input';

export interface IDeviceRepository {
  create(data: CreateDeviceInput): Promise<Device>;
  findById(id: string): Promise<Device | null>;
  findByDeviceId(deviceId: string): Promise<Device | null>;
  findByUserId(userId: string): Promise<Device[]>;
  update(id: string, data: UpdateDeviceInput): Promise<Device>;
  delete(id: string): Promise<boolean>;
  deleteByUserId(userId: string): Promise<number>;
  countActiveDevicesByUserId(userId: string): Promise<number>;
}