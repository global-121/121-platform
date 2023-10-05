import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { DEBUG } from '../config';
import { Admin } from '../guards/admin.decorator';
import { AdminAuthGuard } from '../guards/admin.guard';
import { Permissions } from '../guards/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { CookieNames } from '../shared/enum/cookie.enums';
import { LoginUserDto, UpdateUserDto } from './dto';
import { AssignAidworkerToProgramDto } from './dto/assign-aw-to-program.dto';
import { CreateUserAidWorkerDto } from './dto/create-user-aid-worker.dto';
import { CreateUserPersonAffectedDto } from './dto/create-user-person-affected.dto';
import { FindUserReponseDto } from './dto/find-user-response.dto';
import { GetUserReponseDto } from './dto/get-user-response.dto';
import { CreateUserRoleDto, UpdateUserRoleDto } from './dto/user-role.dto';
import { PermissionEnum } from './permission.enum';
import { UserRoleEntity } from './user-role.entity';
import { User } from './user.decorator';
import { UserEntity } from './user.entity';
import { UserRO } from './user.interface';
import { tokenExpirationDays, UserService } from './user.service';

@UseGuards(PermissionsGuard, AdminAuthGuard)
@ApiTags('users')
@Controller()
export class UserController {
  private readonly userService: UserService;
  public constructor(userService: UserService) {
    this.userService = userService;
  }

  @Admin()
  @ApiOperation({ summary: 'Get all user roles' })
  // TODO: REFACTOR: rename to /users/roles/
  @Get('roles')
  public async getUserRoles(): Promise<UserRoleEntity[]> {
    return await this.userService.getUserRoles();
  }

  @Admin()
  @ApiOperation({ summary: 'Create new user role' })
  // TODO: REFACTOR: rename to /users/roles
  @Post('roles')
  public async addUserRole(
    @Body() userRoleData: CreateUserRoleDto,
  ): Promise<UserRoleEntity> {
    return await this.userService.addUserRole(userRoleData);
  }

  @Admin()
  @ApiOperation({ summary: 'Update existing user role' })
  @ApiParam({ name: 'userRoleId', required: true, type: 'integer' })
  // TODO: REFACTOR: rename to /users/roles/
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
  // TODO: REFACTOR: rename to /users/roles/
  @Delete('roles/:userRoleId')
  public async deleteUserRole(@Param() params): Promise<UserRoleEntity> {
    return await this.userService.deleteUserRole(params.userRoleId);
  }

  @ApiOperation({ summary: 'Sign-up new Aid Worker user' })
  // TODO: REFACTOR: rename to /users
  @Post('user/aidworker')
  public async createAw(
    @Body() userData: CreateUserAidWorkerDto,
  ): Promise<UserRO> {
    return this.userService.createAidWorker(userData);
  }

  @ApiOperation({ summary: 'Sign-up new Person Affected user' })
  // TODO: REFACTOR: rename to /users/person-affected
  @Post('user/person-affected')
  public async createPA(
    @Body() userData: CreateUserPersonAffectedDto,
    @Res() res,
    @Req() req,
  ): Promise<UserRO> {
    let sameSite = 'None';
    let secure = true;

    if (DEBUG) {
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

  @Throttle(
    +process.env.HIGH_THROTTLING_LIMIT || 30,
    +process.env.HIGH_THROTTLING_TTL || 60,
  )
  @ApiOperation({ summary: 'Log in existing user' })
  // TODO: REFACTOR: rename to /users/login
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
        access_token_general: loginResponse.token,
        expires: loginResponse.cookieSettings.expires,
        isAdmin: loginResponse.userRo.user.isAdmin,
      });
    } catch (error) {
      throw error;
    }
  }

  @ApiOperation({ summary: 'Log out existing user' })
  // TODO: REFACTOR: rename to /users/logout
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
  // TODO: REFACTOR: rename to /users/password
  @Post('user/change-password')
  @ApiResponse({ status: 201, description: 'Changed password of user' })
  @ApiResponse({
    status: 401,
    description: 'No user detectable from cookie or no cookie present',
  })
  public async update(
    @User('id') userId: number,
    @Body() userData: UpdateUserDto,
  ): Promise<any> {
    if (!userId) {
      const errors = `No user detectable from cookie or no cookie present'`;
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    return this.userService.update(userData);
  }

  @Admin()
  @ApiOperation({ summary: 'Delete user by userId' })
  // TODO: REFACTOR: rename to /users/:userid
  @Post('user/delete/:userId')
  @ApiParam({ name: 'userId', required: true, type: 'integer' })
  public async delete(@Param() params): Promise<UserEntity> {
    return await this.userService.delete(Number(params.userId));
  }

  @ApiOperation({ summary: 'User deletes itself' })
  // TODO: REFACTOR: rename to /users/
  @Post('user/delete')
  @ApiResponse({ status: 201, description: 'User deleted' })
  @ApiResponse({
    status: 401,
    description: 'No user detectable from cookie or no cookie present',
  })
  public async deleteCurrentUser(
    @User('id') deleterId: number,
  ): Promise<UserEntity> {
    if (!deleterId) {
      const errors = `No user detectable from cookie or no cookie present'`;
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    return await this.userService.delete(deleterId);
  }

  @ApiOperation({ summary: 'Get current user' })
  // TODO: REFACTOR: rename to /users
  @Get('user')
  @ApiResponse({ status: 200, description: 'User returned' })
  @ApiResponse({
    status: 401,
    description: 'No user detectable from cookie or no cookie present',
  })
  public async findMe(@User('username') username: string): Promise<UserRO> {
    if (!username) {
      const errors = `No user detectable from cookie or no cookie present'`;
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
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
  @ApiOperation({ summary: 'Remove aidworker from program' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'userId', required: true, type: 'integer' })
  @Delete('programs/:programId/users/:userId/assignments')
  public async deleteAidWorkerAssignment(@Param() params): Promise<void> {
    return await this.userService.deleteAssignment(
      Number(params.programId),
      Number(params.userId),
    );
  }

  @Admin()
  @ApiOperation({ summary: 'Get all users' })
  @Get('users')
  public async getUsers(@User('id') userId: number): Promise<UserEntity[]> {
    if (!userId) {
      const errors = `No user detectable from cookie or no cookie present'`;
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }

    return await this.userService.getUsers();
  }

  @Permissions(PermissionEnum.AidWorkerProgramREAD)
  @ApiOperation({ summary: 'Get all users by programId' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of users assigned to a program',
    type: [GetUserReponseDto],
  })
  @Get('programs/:programId/users')
  public async getUsersInProgram(
    @Param() params,
  ): Promise<GetUserReponseDto[]> {
    return await this.userService.getUsersInProgram(Number(params.programId));
  }

  // This endpoint searches users accross all programs, which is needed to add a user to a program
  // We did not create an extra permission for this as it is always used in combination with adding new users to a program
  // ProgramId is therefore not needed in the service
  @Permissions(PermissionEnum.AidWorkerProgramUPDATE)
  @ApiOperation({
    summary:
      'Search for users who are already part of a program or who can be added to a program, based on their username or a substring of their username.',
  })
  @ApiParam({ name: 'username', required: true, type: 'string' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of users that match the search criteria.',
    type: [FindUserReponseDto],
  })
  @Get('programs/:programId/users/:username')
  public async getUsersByName(@Param() params): Promise<FindUserReponseDto[]> {
    return await this.userService.findUsersByName(params.username);
  }
}
