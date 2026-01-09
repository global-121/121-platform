import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { CreateUserRoleDto } from '@121-service/src/user/dto/create-user-role.dto';
import { UpdateUserRoleDto } from '@121-service/src/user/dto/update-user-role.dto';
import { UserRoleResponseDTO } from '@121-service/src/user/dto/userrole-response.dto';
import { UserService } from '@121-service/src/user/user.service';

@ApiTags('roles')
@UseGuards(AuthenticatedUserGuard)
@Controller()
export class RolesController {
  private readonly userService: UserService;
  public constructor(userService: UserService) {
    this.userService = userService;
  }

  @AuthenticatedUser()
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
}
