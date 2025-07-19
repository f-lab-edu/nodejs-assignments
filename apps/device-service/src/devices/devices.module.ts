import { Module } from '@nestjs/common';
import { DeviceResolver } from './resolvers/device.resolver';
import { DeviceService } from './services/device.service';
import { DeviceRepositoryModule } from './repositories/device.repository.module';

@Module({
  imports: [DeviceRepositoryModule],
  providers: [DeviceResolver, DeviceService],
  exports: [DeviceService],
})
export class DevicesModule {}