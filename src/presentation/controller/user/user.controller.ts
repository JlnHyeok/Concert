import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  BadRequestException,
  Delete,
} from '@nestjs/common';
import {
  ChargePointRequestDto,
  CheckPointRequestDto,
  CreateUserRequestDto,
} from '../../dto/request/user.request.dto';
import {
  ChargePointResponseDto,
  CheckPointResponseDto,
  CreateUserResponseDto,
} from '../../dto/response/user.response.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserFacade } from '../../../application/facades/user/user.facade';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userFacade: UserFacade) {}

  @Post('create')
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async createUser(
    @Body() body: CreateUserRequestDto,
  ): Promise<CreateUserResponseDto> {
    const { userId, name } = body;
    return await this.userFacade.createUser(userId, name);
  }

  @Post('charge')
  @ApiResponse({ status: 201, type: ChargePointResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async chargePoint(
    @Body() body: ChargePointRequestDto,
  ): Promise<ChargePointResponseDto> {
    const { userId, point } = body;

    return await this.userFacade.chargePoint(userId, point);
  }

  @Get('point/:userId')
  @ApiResponse({ status: 200, type: CheckPointResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async checkPoint(
    @Param() param: CheckPointRequestDto,
  ): Promise<CheckPointResponseDto> {
    return await this.userFacade.checkPoint(param.userId);
  }

  @Delete('delete/:userId')
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async deleteUser(@Param() param: CheckPointRequestDto): Promise<void> {
    await this.userFacade.deleteUser(param.userId);
  }
}
