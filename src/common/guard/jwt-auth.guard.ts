import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from '../../application/auth/auth.service';
import { BusinessException } from '../exception/business-exception';
import { COMMON_ERRORS } from '../constants/error';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader)
      throw new BusinessException(
        COMMON_ERRORS.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
      );

    const token = authHeader.split(' ')[1];

    await this.authService.validateToken(token);

    return true;
  }
}
