import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProxyService {
  private readonly identityServiceUrl: string;
  private readonly deviceServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.identityServiceUrl = this.configService.get('IDENTITY_SERVICE_URL', 'http://localhost:3001');
    this.deviceServiceUrl = this.configService.get('DEVICE_SERVICE_URL', 'http://localhost:3002');
  }

  async forwardRequest(
    serviceName: 'identity' | 'device',
    path: string,
    method: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<any> {
    const serviceUrl = serviceName === 'identity' ? this.identityServiceUrl : this.deviceServiceUrl;
    const targetUrl = `${serviceUrl}${path}`;

    try {
      const response = await fetch(targetUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new HttpException(
          `Service ${serviceName} returned ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to connect to ${serviceName} service: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  getServiceInfo() {
    return {
      services: {
        identity: {
          url: this.identityServiceUrl,
          endpoints: ['/graphql', '/api/v1/health'],
        },
        device: {
          url: this.deviceServiceUrl,
          endpoints: ['/graphql', '/api/v1/health'],
        },
      },
    };
  }
}