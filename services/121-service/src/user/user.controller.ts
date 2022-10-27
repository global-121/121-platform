import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Admin } from '../guards/admin.decorator';
import { AdminAuthGuard } from '../guards/admin.guard';
import { Permissions } from '../guards/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { CookieNames } from '../shared/enum/cookie.enums';
import { LoginUserDto, UpdateUserDto } from './dto';
import { AssignAidworkerToProgramDto } from './dto/assign-aw-to-program.dto';
import { CreateUserAidWorkerDto } from './dto/create-user-aid-worker.dto';
import { CreateUserPersonAffectedDto } from './dto/create-user-person-affected.dto';
import { CreateUserRoleDto, UpdateUserRoleDto } from './dto/user-role.dto';
import { PermissionEnum } from './permission.enum';
import { UserRoleEntity } from './user-role.entity';
import { User } from './user.decorator';
import { UserEntity } from './user.entity';
import { UserRO } from './user.interface';
import { tokenExpirationDays, UserService } from './user.service';

@UseGuards(PermissionsGuard, AdminAuthGuard)
@ApiTags('user')
@Controller()
export class UserController {
  private readonly userService: UserService;
  public constructor(userService: UserService) {
    this.userService = userService;
  }

  @Admin()
  @ApiOperation({ summary: 'Get all user roles' })
  @Get('roles')
  public async getUserRoles(): Promise<UserRoleEntity[]> {
    return await this.userService.getUserRoles();
  }

  @Admin()
  @ApiOperation({ summary: 'Create new user role' })
  @Post('roles')
  public async addUserRole(
    @Body() userRoleData: CreateUserRoleDto,
  ): Promise<UserRoleEntity> {
    return await this.userService.addUserRole(userRoleData);
  }

  @Admin()
  @ApiOperation({ summary: 'Update existing user role' })
  @ApiParam({ name: 'userRoleId', required: true, type: 'integer' })
  @Put('roles/:userRoleId')
  public async updateUserRole(
    @Param() params,
    @Body() userRoleData: UpdateUserRoleDto,
  ): Promise<UserRoleEntity> {
    return await this.userService.updateUserRole(
      params.userRoleId,
      userRoleData,
    );
  }

  @Admin()
  @ApiOperation({ summary: 'Delete existing user role' })
  @ApiParam({ name: 'userRoleId', required: true, type: 'integer' })
  @Delete('roles/:userRoleId')
  public async deleteUserRole(@Param() params): Promise<UserRoleEntity> {
    return await this.userService.deleteUserRole(params.userRoleId);
  }

  @ApiOperation({ summary: 'Sign-up new Aid Worker user' })
  @Post('user/aidworker')
  public async createAw(
    @Body() userData: CreateUserAidWorkerDto,
  ): Promise<UserRO> {
    return this.userService.createAidWorker(userData);
  }

  @ApiOperation({ summary: 'Sign-up new Person Affected user' })
  @Post('user/person-affected')
  public async createPA(
    @Body() userData: CreateUserPersonAffectedDto,
    @Res() res,
    @Req() req,
  ): Promise<UserRO> {
    let sameSite;
    let secure;
    if (process.env.NODE_ENV === 'production') {
      sameSite = 'None';
      secure = 'Lax';
    } else {
      const origin = req.get('origin');
      const serviceWorkerDebug = origin?.includes('8088');
      sameSite = serviceWorkerDebug ? 'None' : 'Lax';
      secure = serviceWorkerDebug;
    }

    try {
      const user = await this.userService.createPersonAffected(userData);
      const exp = new Date(Date.now() + tokenExpirationDays * 24 * 3600000);
      res.cookie(CookieNames.paApp, user.user.token, {
        sameSite: sameSite,
        secure: secure,
        expires: exp,
        httpOnly: true,
      });
      return res.send({
        username: user.user.username,
        permissions: user.user.permissions,
        expires: exp,
      });
    } catch (error) {
      throw error;
    }
  }

  @ApiOperation({ summary: 'Log in existing user' })
  @Post('user/login')
  public async login(
    @Body() loginUserDto: LoginUserDto,
    @Res() res,
    @Req() req,
  ): Promise<UserRO> {
    try {
      const loginResponse = await this.userService.login(loginUserDto);
      const origin = req.get('origin');
      const serviceWorkerDebug = origin?.includes('8088');

      res.cookie(
        loginResponse.cookieSettings.tokenKey,
        loginResponse.cookieSettings.tokenValue,
        {
          sameSite: serviceWorkerDebug
            ? 'None'
            : loginResponse.cookieSettings.sameSite,
          secure: serviceWorkerDebug
            ? true
            : loginResponse.cookieSettings.secure,
          expires: loginResponse.cookieSettings.expires,
          httpOnly: loginResponse.cookieSettings.httpOnly,
        },
      );
      return res.send({
        username: loginResponse.userRo.user.username,
        permissions: loginResponse.userRo.user.permissions,
        expires: loginResponse.cookieSettings.expires,
      });
    } catch (error) {
      throw error;
    }
  }

  @ApiOperation({ summary: 'Log out existing user' })
  @Post('user/logout')
  public async logout(@Res() res): Promise<UserRO> {
    try {
      const key = this.userService.getInterfaceKeyByHeader();
      res.cookie(key, '', {
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(Date.now() - 1),
        httpOnly: true,
      });
      return res.send();
    } catch (error) {
      throw error;
    }
  }

  @ApiOperation({ summary: 'Change password of logged in user' })
  @Post('user/change-password')
  public async update(
    @User('id') userId: number,
    @Body() userData: UpdateUserDto,
  ): Promise<any> {
    return this.userService.update(userId, userData);
  }

  @Admin()
  @ApiOperation({ summary: 'Delete user by userId' })
  @Post('user/delete/:userId')
  @ApiParam({ name: 'userId', required: true, type: 'integer' })
  public async delete(@Param() params): Promise<UserEntity> {
    return await this.userService.delete(Number(params.userId));
  }

  @ApiOperation({ summary: 'User deletes itself' })
  @Post('user/delete')
  public async deleteCurrentUser(
    @User('id') deleterId: number,
  ): Promise<UserEntity> {
    return await this.userService.delete(deleterId);
  }

  @ApiOperation({ summary: 'Get current user' })
  @Get('user')
  public async findMe(@User('username') username: string): Promise<UserRO> {
    return await this.userService.findByUsername(username);
  }

  @Permissions(PermissionEnum.AidWorkerProgramUPDATE)
  @ApiOperation({ summary: 'Assign Aidworker to program' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'userId', required: true, type: 'integer' })
  @Post('programs/:programId/users/:userId/assignments')
  public async assignFieldValidationAidworkerToProgram(
    @Param() params,
    @Body() assignAidworkerToProgram: AssignAidworkerToProgramDto,
  ): Promise<UserRoleEntity[]> {
    return await this.userService.assigAidworkerToProgram(
      Number(params.programId),
      Number(params.userId),
      assignAidworkerToProgram,
    );
  }

  @Permissions(PermissionEnum.AidWorkerProgramUPDATE)
  @ApiOperation({ summary: 'Assign Aidworker to program' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'userId', required: true, type: 'integer' })
  @Delete('programs/:programId/users/:userId/assignments')
  public async deleteAidWorkerAssignment(@Param() params): Promise<void> {
    return await this.userService.deleteAssignment(
      Number(params.programId),
      Number(params.userId),
    );
  }
}
