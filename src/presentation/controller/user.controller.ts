import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from '../../domain/user/services/user.service';
import {
  ChargePointRequestDto,
  CheckPointRequestDto,
} from '../dto/request/user.request.dto';
import {
  ChargePointResponseDto,
  CheckPointResponseDto,
} from '../dto/response/user.response.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('charge')
  @ApiResponse({ status: 201, type: ChargePointResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async chargePoint(
    @Body() body: ChargePointRequestDto,
  ): Promise<ChargePointResponseDto> {
    const { userId, point } = body;

    if (point <= 0) {
      throw new BadRequestException('Point value must be greater than 0');
    }

    return await this.userService.chargePoint(userId, point);
  }

  @Get('point/:userId')
  @ApiResponse({ status: 200, type: CheckPointResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async checkPoint(
    @Param('userId') userId: number,
  ): Promise<CheckPointResponseDto> {
    if (isNaN(userId) || userId <= 0) {
      throw new BadRequestException('Invalid user ID');
    }

    return await this.userService.getPoint(userId);
  }
}
