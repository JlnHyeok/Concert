import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserService } from 'src/domain/user/services/user.service';
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
    return await this.userService.chargePoint(userId, point);
  }

  @Get('point/:userId')
  @ApiResponse({ status: 201, type: CheckPointResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async checkPoint(
    @Param() params: CheckPointRequestDto,
  ): Promise<CheckPointResponseDto> {
    const { userId } = params;
    return await this.userService.getPoint(userId);
  }
}
