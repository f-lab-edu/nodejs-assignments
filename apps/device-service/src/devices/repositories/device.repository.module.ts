import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { DeviceRepository } from './implementations/device.repository.impl';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: 'IDeviceRepository',
      useClass: DeviceRepository,
    },
  ],
  exports: ['IDeviceRepository'],
})
export class DeviceRepositoryModule {}