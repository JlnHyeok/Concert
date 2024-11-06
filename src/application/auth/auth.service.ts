import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  async validateToken(token: string): Promise<any> {
    const secretKey = this.configService.get<string>('JWT_SECRET');
    try {
      const decoded = jwt.verify(token, secretKey);
      return decoded; // 유효한 경우 디코드된 정보 반환
    } catch (error) {
      throw new UnauthorizedException('Token is invalid');
    }
  }
}
