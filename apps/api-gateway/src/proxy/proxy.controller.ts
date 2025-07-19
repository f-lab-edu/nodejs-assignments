import { Controller, All, Req, Res, Param } from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';

@Controller()
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('identity/*')
  async forwardToIdentityService(
    @Req() req: Request,
    @Res() res: Response,
    @Param() params: any,
  ) {
    const path = req.url.replace('/api/identity', '');
    
    try {
      const result = await this.proxyService.forwardRequest(
        'identity',
        path,
        req.method,
        req.body,
        req.headers as Record<string, string>
      );
      
      res.json(result);
    } catch (error) {
      res.status(error.status || 500).json({
        error: error.message,
        service: 'identity',
      });
    }
  }

  @All('device/*')
  async forwardToDeviceService(
    @Req() req: Request,
    @Res() res: Response,
    @Param() params: any,
  ) {
    const path = req.url.replace('/api/device', '');
    
    try {
      const result = await this.proxyService.forwardRequest(
        'device',
        path,
        req.method,
        req.body,
        req.headers as Record<string, string>
      );
      
      res.json(result);
    } catch (error) {
      res.status(error.status || 500).json({
        error: error.message,
        service: 'device',
      });
    }
  }

  @All('services')
  getServiceInfo() {
    return this.proxyService.getServiceInfo();
  }
}