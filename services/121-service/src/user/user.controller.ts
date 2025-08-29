import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { THROTTLING_LIMIT_HIGH } from '@121-service/src/config';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { CookieNames } from '@121-service/src/shared/enum/cookie.enums';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import {
  CreateProjectAssignmentDto,
  DeleteProjectAssignmentDto,
  UpdateProjectAssignmentDto,
} from '@121-service/src/user/dto/assign-aw-to-project.dto';
import { changePasswordWithoutCurrentPasswordDto } from '@121-service/src/user/dto/change-password-without-current-password.dto';
import { CreateUsersDto } from '@121-service/src/user/dto/create-user.dto';
import { CreateUserRoleDto } from '@121-service/src/user/dto/create-user-role.dto';
import { FindUserReponseDto } from '@121-service/src/user/dto/find-user-response.dto';
import { GetUserReponseDto } from '@121-service/src/user/dto/get-user-response.dto';
import { LoginUserDto } from '@121-service/src/user/dto/login-user.dto';
import {
  UpdateUserDto,
  UpdateUserPasswordDto,
} from '@121-service/src/user/dto/update-user.dto';
import { UpdateUserRoleDto } from '@121-service/src/user/dto/update-user-role.dto';
import {
  AssignmentResponseDTO,
  UserRoleResponseDTO,
} from '@121-service/src/user/dto/userrole-response.dto';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { throwIfSelfUpdate } from '@121-service/src/user/helpers/throw-if-self-update';
import { UserEntity } from '@121-service/src/user/user.entity';
import { UserRO } from '@121-service/src/user/user.interface';
import { UserService } from '@121-service/src/user/user.service';

@UseGuards(AuthenticatedUserGuard)
@Controller()
export class UserController {
  private readonly userService: UserService;
  public constructor(userService: UserService) {
    this.userService = userService;
  }

  @AuthenticatedUser()
  @ApiTags('roles')
  @ApiOperation({ summary: 'Get all user roles' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a list of roles and their permissions',
    type: [UserRoleResponseDTO],
  })
  @Get('roles')
  public async getUserRoles(): Promise<UserRoleResponseDTO[]> {
    return await this.userService.getUserRoles();
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiTags('roles')
  @ApiOperation({ summary: 'Create new user role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the created role',
    type: UserRoleResponseDTO,
  })
  @Post('roles')
  public async addUserRole(
    @Body() userRoleData: CreateUserRoleDto,
  ): Promise<UserRoleResponseDTO> {
    return await this.userService.addUserRole(userRoleData);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiTags('roles')
  @ApiOperation({ summary: 'Update existing user role' })
  @ApiParam({ name: 'userRoleId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the updated user role',
    type: UserRoleResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Role already exists',
  })
  @Put('roles/:userRoleId')
  public async updateUserRole(
    @Param() params,
    @Body() userRoleData: UpdateUserRoleDto,
  ): Promise<UserRoleResponseDTO> {
    return await this.userService.updateUserRole(
      params.userRoleId,
      userRoleData,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiTags('roles')
  @ApiOperation({ summary: 'Delete existing user role' })
  @ApiParam({ name: 'userRoleId', required: true, type: 'integer' })
  // TODO: REFACTOR: rename to /users/roles/
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the deleted role',
    type: UserRoleResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No role found',
  })
  @Delete('roles/:userRoleId')
  public async deleteUserRole(
    @Param('userRoleId', ParseIntPipe)
    userRoleId: number,
  ): Promise<UserRoleResponseDTO> {
    return await this.userService.deleteUserRole(userRoleId);
  }

  @AuthenticatedUser({ isOrganizationAdmin: true })
  @ApiTags('users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all users',
    type: [UserEntity],
  })
  @Get('users')
  public async getUsers() {
    return await this.userService.getUsers();
  }

  // TODO: define response type, this cannot use an interface though
  @AuthenticatedUser({ isOrganizationAdmin: true })
  @ApiTags('users')
  @ApiOperation({ summary: '[EXTERNALLY USED] Sign-up new user' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Successfully created new user(s)',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('users')
  public async createUsers(@Body() userData: CreateUsersDto): Promise<void> {
    return this.userService.createUsers(userData);
  }

  @Throttle(THROTTLING_LIMIT_HIGH)
  @ApiTags('users')
  @ApiOperation({ summary: '[EXTERNALLY USED] Log in existing user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Logged in successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Wrong username and/or password',
  })
  @Post('users/login')
  public async login(
    @Body() loginUserDto: LoginUserDto,
    @Res() res,
  ): Promise<UserRO> {
    try {
      const loginResponse = await this.userService.login(loginUserDto);

      res.cookie(
        loginResponse.cookieSettings.tokenKey,
        loginResponse.cookieSettings.tokenValue,
        {
          sameSite: loginResponse.cookieSettings.sameSite,
          secure: loginResponse.cookieSettings.secure,
          expires: loginResponse.cookieSettings.expires,
          httpOnly: loginResponse.cookieSettings.httpOnly,
        },
      );
      return res.send({
        username: loginResponse.userRo.user.username,
        permissions: loginResponse.userRo.user.permissions,
        [CookieNames.general]: loginResponse.token,
        expires: loginResponse.cookieSettings.expires,
        isAdmin: loginResponse.userRo.user.isAdmin,
        isEntraUser: loginResponse.userRo.user.isEntraUser,
        isOrganizationAdmin: loginResponse.userRo.user.isOrganizationAdmin,
      });
    } catch (error) {
      throw error;
    }
  }

  @AuthenticatedUser()
  @ApiTags('users')
  @ApiOperation({ summary: 'Log out existing user' })
  @Post('users/logout')
  public async logout(@Res() res): Promise<UserRO> {
    try {
      const key = this.userService.getInterfaceKeyByHeader();
      const { sameSite, secure, httpOnly } =
        this.userService.getCookieSecuritySettings();

      res.cookie(key, '', {
        sameSite,
        secure,
        httpOnly,
        expires: new Date(Date.now() - 1),
      });
      return res.send();
    } catch (error) {
      throw error;
    }
  }

  @Throttle(THROTTLING_LIMIT_HIGH)
  @AuthenticatedUser()
  @ApiTags('users')
  @ApiOperation({ summary: 'Change password of logged in user' })
  // TODO: Change this in to a PATCH request
  @Post('users/password')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Changed password of user',
    type: UpdateUserDto,
  })
  public async update(
    @Body() userPasswordData: UpdateUserPasswordDto,
  ): Promise<any> {
    return this.userService.updatePassword(userPasswordData);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiTags('users')
  @ApiOperation({ summary: 'Delete user by userId' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted',
    type: UserEntity,
  })
  @ApiParam({ name: 'userId', required: true, type: 'integer' })
  @Delete('users/:userId')
  public async delete(
    @Param('userId', ParseIntPipe)
    userId: number,
  ): Promise<UserEntity> {
    return await this.userService.delete(userId);
  }

  @AuthenticatedUser()
  @ApiTags('users')
  @ApiOperation({ summary: 'Get current user' })
  @Get('users/current')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User returned',
  })
  public async findMe(@Req() req): Promise<UserRO> {
    if (!req.user || !req.user.username) {
      const errors = `No user detectable from cookie or no cookie present'`;
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }

    return await this.userService.getUserRoByUsernameOrThrow(
      req.user.username,
      req.user.exp,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.AidWorkerProjectUPDATE] })
  @ApiTags('users')
  @ApiOperation({
    summary:
      'Search, across all projects, for users who are already part of a project or who can be added to a project, based on their username or a substring of their username.' +
      'Is **NOT** limited to the provided `projectId`;' +
      "The `projectId` used to check for the requesting user's permissions only.",
  })
  @ApiQuery({ name: 'username', required: true, type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a list of users that match the search criteria.',
    type: [FindUserReponseDto],
  })
  @Get('projects/:projectId/users/search')
  public async getUsersByName(
    @Param('projectId', ParseIntPipe)
    _projectId: number,

    @Query('username') username: string,
  ): Promise<FindUserReponseDto[]> {
    return await this.userService.findUsersByName(username);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiTags('users/assignments')
  @ApiOperation({ summary: 'Get roles for given user project assignment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns project assignment including roles and scope',
    type: AssignmentResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No roles found for user',
  })
  @Get('projects/:projectId/users/:userId')
  public async getAidworkerProjectAssignment(
    @Param('projectId', ParseIntPipe)
    projectId: number,

    @Param('userId', ParseIntPipe)
    userId: number,
  ): Promise<AssignmentResponseDTO> {
    return await this.userService.getAidworkerProjectAssignment(
      projectId,
      userId,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.AidWorkerProjectUPDATE] })
  @ApiTags('users/assignments')
  @ApiOperation({
    summary: 'Create or OVERWRITE project assignment including roles and scope',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Returns the created or overwritten project assignment including roles and scope',
    type: AssignmentResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User, project or role(s) not found',
  })
  @Put('projects/:projectId/users/:userId')
  public async assignAidworkerToProject(
    @Param('projectId', ParseIntPipe)
    projectId: number,

    @Param('userId', ParseIntPipe)
    userIdToUpdate: number,

    @Body()
    assignAidworkerToProject: CreateProjectAssignmentDto,

    @Req() req: ScopedUserRequest,
  ): Promise<AssignmentResponseDTO> {
    throwIfSelfUpdate(req, userIdToUpdate);
    return await this.userService.assignAidworkerToProject(
      projectId,
      userIdToUpdate,
      assignAidworkerToProject,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.AidWorkerProjectUPDATE] })
  @ApiTags('users/assignments')
  @ApiOperation({
    summary:
      'Update existing project assignment with new roles (UNION of existing and new roles) and/or overwrite scope',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns project assignment with all roles and scope',
    type: AssignmentResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User, project or role(s) not found',
  })
  @Patch('projects/:projectId/users/:userId')
  public async updateAidworkerProjectAssignment(
    @Param('projectId', ParseIntPipe)
    projectId: number,
    @Param('userId', ParseIntPipe)
    userIdToUpdate: number,
    @Body() assignAidworkerToProject: UpdateProjectAssignmentDto,
    @Req() req: ScopedUserRequest,
  ): Promise<AssignmentResponseDTO> {
    throwIfSelfUpdate(req, userIdToUpdate);
    return await this.userService.updateAidworkerProjectAssignment(
      projectId,
      userIdToUpdate,
      assignAidworkerToProject,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.AidWorkerProjectUPDATE] })
  @ApiTags('users/assignments')
  @ApiOperation({
    summary:
      'Remove roles from project-assignment (pass roles to delete in body) or remove assignment (no body)',
  })
  @ApiBody({ type: DeleteProjectAssignmentDto, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Returns the project assignment with the remaining roles or nothing (if project assignment removed)',
    type: AssignmentResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User, project, role(s) or assignment not found',
  })
  @Delete('projects/:projectId/users/:userId')
  public async deleteAidworkerRolesOrAssignment(
    @Param('projectId', ParseIntPipe)
    projectId: number,

    @Param('userId', ParseIntPipe)
    userIdToUpdate: number,

    @Req() req: ScopedUserRequest,
    @Body() deleteProjectAssignment?: DeleteProjectAssignmentDto,
  ): Promise<AssignmentResponseDTO | void> {
    throwIfSelfUpdate(req, userIdToUpdate);

    return await this.userService.deleteAidworkerRolesOrAssignment({
      projectId,
      userId: userIdToUpdate,
      roleNamesToDelete: deleteProjectAssignment?.rolesToDelete,
    });
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.AidWorkerProjectREAD] })
  @ApiTags('users/assignments')
  @ApiOperation({ summary: 'Get all users by projectId' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a list of users assigned to a project',
    type: [GetUserReponseDto],
  })
  @Get('projects/:projectId/users')
  public async getUsersInProject(
    @Param('projectId', ParseIntPipe)
    projectId: number,
  ): Promise<GetUserReponseDto[]> {
    return await this.userService.getUsersInProject(projectId);
  }

  @AuthenticatedUser({ isOrganizationAdmin: true })
  @ApiTags('users')
  @ApiOperation({ summary: 'Reset user password without current password' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Password has been updated',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch('users/password')
  public async changePasswordWithoutCurrentPassword(
    @Body() changePasswordDto: changePasswordWithoutCurrentPasswordDto,
  ): Promise<void> {
    await this.userService.changePasswordWithoutCurrentPassword(
      changePasswordDto,
    );
  }

  // Make sure this endpoint is below users/password endpoint in this controller, to avoid endpoint confusion
  @AuthenticatedUser({ isAdmin: true })
  @ApiTags('users')
  @ApiOperation({
    summary:
      'Update user properties (currently isOrganizationAdmin and displayName)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Updated user',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @Patch('users/:userId')
  public async updateUser(
    @Param('userId', ParseIntPipe)
    userId: number,

    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserRO> {
    const user = await this.userService.updateUser({
      id: userId,
      isOrganizationAdmin: updateUserDto.isOrganizationAdmin,
      displayName: updateUserDto.displayName,
    });

    return this.userService.buildUserRO(user);
  }
}
