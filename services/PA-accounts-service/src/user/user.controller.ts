import { ReferenceIdDto } from './dto/reference-id.dto';
import {
  Get,
  Post,
  Body,
  Controller,
  UsePipes,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserRO } from './user.interface';
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { User } from './user.decorator';
import { ValidationPipe } from '../shared/pipes/validation.pipe';

import { ApiUseTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DeleteUserDto } from './dto/delete-user.dts';
import { RolesGuard } from '../roles.guard';

@ApiBearerAuth()
@ApiUseTags('user')
@Controller()
export class UserController {
  private readonly userService: UserService;
  public constructor(userService: UserService) {
    this.userService = userService;
  }

  @ApiOperation({ title: 'Sign-up new user' })
  @UsePipes(new ValidationPipe())
  @Post('user')
  public async create(@Body() userData: CreateUserDto): Promise<UserRO> {
    return this.userService.create(userData);
  }

  @ApiOperation({ title: 'Log in existing user' })
  @UsePipes(new ValidationPipe())
  @Post('user/login')
  public async login(@Body() loginUserDto: LoginUserDto): Promise<UserRO> {
    const _user = await this.userService.findOne(loginUserDto);
    if (!_user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const token = await this.userService.generateJWT(_user);
    const { username } = _user;
    const user = {
      username,
      token,
    };

    return { user };
  }

  @UseGuards(RolesGuard)
  @ApiOperation({ title: 'Set the referenceId of logged in user' })
  @Post('user/set-reference-id')
  public async setReferenceId(
    @User('id') userId: number,
    @Body() referenceIdDto: ReferenceIdDto,
  ): Promise<void> {
    return this.userService.setReferenceId(userId, referenceIdDto);
  }

  @UseGuards(RolesGuard)
  @ApiOperation({ title: 'Change password of logged in user' })
  @Post('user/change-password')
  public async update(
    @User('id') userId: number,
    @Body() userData: UpdateUserDto,
  ): Promise<UserRO> {
    return this.userService.update(userId, userData);
  }

  @UseGuards(RolesGuard)
  @ApiOperation({ title: 'Get current user' })
  @Get('user')
  public async findMe(@User('username') username: string): Promise<UserRO> {
    return await this.userService.findByUsername(username);
  }

  @UseGuards(RolesGuard)
  @ApiOperation({ title: 'Delete current user and storage' })
  @Post('user/delete')
  public async deleteAccount(
    @User('id') userId: number,
    @Body() passwordData: DeleteUserDto,
  ): Promise<void> {
    return await this.userService.deleteAccount(userId, passwordData);
  }

  @ApiOperation({
    title: 'Get wallet + Delete user and storage (used from 121-service)',
  })
  @Post('user/get-wallet-and-delete')
  public async getWalletAndDeleteAccount(@Body()
  payload: {
    referenceId: string;
    apiKey: string;
  }): Promise<any> {
    if (payload.apiKey !== process.env.PA_API_KEY) {
      throw new HttpException('Not authorized.', HttpStatus.UNAUTHORIZED);
    }

    return await this.userService.getWalletAndDeleteAccount(
      payload.referenceId,
    );
  }
}
