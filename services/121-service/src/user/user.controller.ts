import { PermissionsGuard } from './../permissions.guard';
import { PermissionEnum } from './permission.enum';
import { UserEntity } from './user.entity';
import { CreateUserPersonAffectedDto } from './dto/create-user-person-affected.dto';
import { CreateUserAidWorkerDto } from './dto/create-user-aid-worker.dto';
import {
  Get,
  Post,
  Body,
  Param,
  Controller,
  UseGuards,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserRO } from './user.interface';
import { LoginUserDto, UpdateUserDto } from './dto';
import { User } from './user.decorator';

import {
  ApiUseTags,
  ApiBearerAuth,
  ApiOperation,
  ApiImplicitParam,
} from '@nestjs/swagger';
import { AssignAidworkerToProgramDto } from './dto/assign-aw-to-program.dto';
import { UserRoleEntity } from './user-role.entity';
import { Permissions } from '../permissions.decorator';
import { CreateUserRoleDto } from './dto/create-user-role.dto';

@UseGuards(PermissionsGuard)
@ApiUseTags('user')
@Controller()
export class UserController {
  private readonly userService: UserService;
  public constructor(userService: UserService) {
    this.userService = userService;
  }

  @Permissions(PermissionEnum.RoleCREATE)
  @ApiOperation({ title: 'Create new user role' })
  @Post('user/role')
  public async addUserRole(
    @Body() userRoleData: CreateUserRoleDto,
  ): Promise<UserRoleEntity> {
    return await this.userService.addUserRole(userRoleData);
  }

  @Permissions(PermissionEnum.AidWorkerCREATE)
  @ApiOperation({ title: 'Sign-up new Aid Worker user' })
  @Post('user/aidworker')
  public async createAw(
    @Body() userData: CreateUserAidWorkerDto,
  ): Promise<UserRO> {
    return this.userService.createAidWorker(userData);
  }

  @ApiOperation({ title: 'Sign-up new Person Affected user' })
  @Post('user/person-affected')
  public async createPA(
    @Body() userData: CreateUserPersonAffectedDto,
  ): Promise<UserRO> {
    return this.userService.createPersonAffected(userData);
  }

  @ApiOperation({ title: 'Log in existing user' })
  @Post('user/login')
  public async login(
    @Body() loginUserDto: LoginUserDto,
    @Res() res,
  ): Promise<UserRO> {
    try {
      const user = await this.userService.login(loginUserDto);

      res.cookie('access_token', user.user.token, {
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(Date.now() + 60 * 24 * 3600000),
        httpOnly: true,
      });
      return res.send({
        username: user.user.username,
        permissions: user.user.permissions,
      });
    } catch (error) {
      throw error;
    }
  }

  @ApiOperation({ title: 'Log out existing user' })
  @Post('user/logout')
  public async logout(@Res() res): Promise<UserRO> {
    try {
      res.cookie('access_token', '', {
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(Date.now() - 60 * 24 * 3600000),
        httpOnly: true,
      });
      return res.send();
    } catch (error) {
      throw error;
    }
  }

  @ApiOperation({ title: 'Change password of logged in user' })
  @Post('user/change-password')
  public async update(
    @User('id') userId: number,
    @Body() userData: UpdateUserDto,
  ): Promise<any> {
    return this.userService.update(userId, userData);
  }

  @Permissions(PermissionEnum.AidWorkerDELETE)
  @ApiOperation({ title: 'Delete user by userId' })
  @Post('user/delete/:userId')
  @ApiImplicitParam({ name: 'userId', required: true, type: 'integer' })
  public async delete(@Param() params): Promise<UserEntity> {
    return await this.userService.delete(Number(params.userId));
  }

  @ApiOperation({ title: 'User deletes itself' })
  @Post('user/delete')
  public async deleteCurrentUser(
    @User('id') deleterId: number,
  ): Promise<UserEntity> {
    return await this.userService.delete(deleterId);
  }

  @ApiOperation({ title: 'Get current user' })
  @Get('user')
  public async findMe(@User('username') username: string): Promise<UserRO> {
    return await this.userService.findByUsername(username);
  }

  @Permissions(PermissionEnum.AidWorkerProgramUPDATE)
  @ApiOperation({ title: 'Assign Aidworker to program' })
  @Post('user/assign-to-program')
  public async assignFieldValidationAidworkerToProgram(
    @Body() assignAidworkerToProgram: AssignAidworkerToProgramDto,
  ): Promise<UserRoleEntity[]> {
    return await this.userService.assigAidworkerToProgram(
      assignAidworkerToProgram,
    );
  }
}
