import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import messageTemplatePilotEth from '@121-service/src/seed-data/message-template/message-template-pilot-zoa-eth.json';
import organizationPilotEth from '@121-service/src/seed-data/organization/organization-pilot-eth.json';
import programPilotEth from '@121-service/src/seed-data/program/program-pilot-zoa-eth.json';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { PermissionEntity } from '@121-service/src/user/permissions.entity';
import { UserRoleEntity } from '@121-service/src/user/user-role.entity';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SeedProgramEth implements InterfaceScript {
  public constructor(
    private readonly seedHelper: SeedHelper,
    private dataSource: DataSource,
  ) {}

  public async run(isApiTests = false): Promise<void> {
    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(
      programPilotEth,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATE *****
    await this.seedHelper.addMessageTemplates(messageTemplatePilotEth, program);

    // ***** CREATE DEFAULT USERS *****
    await this.seedHelper.addDefaultUsers(program);

    // ***** CREATE ORGANIZATION *****
    await this.seedHelper.addOrganization(organizationPilotEth);

    // ***** CREATE USERS WITH CUSTOM ROLES *****
    await this.createCustomRoles();
    await this.addUserPerCustomRole(program);
  }

  private async createCustomRoles(): Promise<void> {
    const customRoles = [
      {
        role: 'administrator-zoa',
        label: 'Administrator (ZOA)',
        permissions: [
          // Listing all permission here to show which are not assigned (commented):
          PermissionEnum.ProgramUPDATE,
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentCREATE,
          // PermissionEnum.PaymentFspInstructionREAD, // N.A. to ZOA
          PermissionEnum.PaymentTransactionREAD,
          // PermissionEnum.PaymentVoucherREAD, // N.A. to ZOA
          // PermissionEnum.PaymentVoucherInstructionUPDATE, // N.A. to ZOA
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationCREATE,
          PermissionEnum.RegistrationDELETE,
          PermissionEnum.RegistrationAttributeUPDATE,
          PermissionEnum.RegistrationFspUPDATE, // Maybe N.A. to ZOA as only 1 FSP??
          PermissionEnum.RegistrationNotificationREAD,
          PermissionEnum.RegistrationNotificationCREATE,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.RegistrationPersonalForValidationREAD,
          PermissionEnum.RegistrationPersonalEXPORT,
          PermissionEnum.RegistrationPersonalUPDATE,
          PermissionEnum.RegistrationStatusIncludedUPDATE,
          PermissionEnum.RegistrationImportTemplateREAD,
          PermissionEnum.ActionREAD,
          PermissionEnum.ActionCREATE,
          PermissionEnum.AidWorkerProgramUPDATE,
        ],
      },
      {
        role: 'project-management',
        label: 'Project Management',
        permissions: [
          // Listing all permissions here to show which are not assigned (commented):
          PermissionEnum.ProgramUPDATE,
          PermissionEnum.ProgramQuestionUPDATE,
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationCREATE,
          PermissionEnum.RegistrationDELETE,
          PermissionEnum.RegistrationAttributeUPDATE,
          PermissionEnum.RegistrationFspUPDATE,
          PermissionEnum.RegistrationNotificationREAD,
          PermissionEnum.RegistrationNotificationCREATE,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.RegistrationPersonalForValidationREAD,
          PermissionEnum.RegistrationPersonalEXPORT,
          PermissionEnum.RegistrationPersonalUPDATE,
          PermissionEnum.RegistrationStatusIncludedUPDATE,
          PermissionEnum.RegistrationImportTemplateREAD,
          PermissionEnum.ActionREAD,
          PermissionEnum.ActionCREATE,
          // PermissionEnum.AidWorkerDELETE, Moved to admin
          // PermissionEnum.AidWorkerProgramUPDATE,
          PermissionEnum.AidWorkerProgramREAD,
        ],
      },
      {
        role: 'programme-management',
        label: 'Programme Management',
        permissions: [
          // Listing all permissions here to show which are not assigned (commented):
          PermissionEnum.ProgramUPDATE,
          // PermissionEnum.ProgramAllREAD, // REMOVED 2022-10-12
          PermissionEnum.ProgramQuestionUPDATE,
          PermissionEnum.ProgramMetricsREAD,
          // PermissionEnum.FspAttributeUPDATE,  Moved to admin
          PermissionEnum.PaymentREAD,
          // PermissionEnum.PaymentCREATE, // not doing payments
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationCREATE,
          PermissionEnum.RegistrationDELETE,
          PermissionEnum.RegistrationAttributeUPDATE,
          PermissionEnum.RegistrationFspUPDATE,
          PermissionEnum.RegistrationNotificationREAD,
          PermissionEnum.RegistrationNotificationCREATE,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.RegistrationPersonalForValidationREAD,
          PermissionEnum.RegistrationPersonalEXPORT,
          PermissionEnum.RegistrationPersonalUPDATE,
          // PermissionEnum.RegistrationStatusIncludedUPDATE,
          // PermissionEnum.RegistrationStatusInvitedUPDATE,
          PermissionEnum.RegistrationImportTemplateREAD,
          PermissionEnum.ActionREAD,
          PermissionEnum.ActionCREATE,
          // PermissionEnum.AidWorkerProgramUPDATE,
          PermissionEnum.AidWorkerProgramREAD,
        ],
      },
      {
        role: 'operation-management',
        label: 'Operation management',
        permissions: [
          // Listing all permissions here to show which are not assigned (commented):
          PermissionEnum.ProgramUPDATE,
          // PermissionEnum.ProgramAllREAD, // REMOVED 2022-10-12
          PermissionEnum.ProgramQuestionUPDATE,
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentCREATE,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.RegistrationREAD,
          // PermissionEnum.RegistrationCREATE, // No importing
          PermissionEnum.RegistrationDELETE,
          // PermissionEnum.RegistrationAttributeUPDATE, // No editing from PA popup
          PermissionEnum.RegistrationFspUPDATE,
          PermissionEnum.RegistrationNotificationREAD,
          // PermissionEnum.RegistrationNotificationCREATE, // No sending messages
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.RegistrationPersonalEXPORT,
          // PermissionEnum.RegistrationPersonalUPDATE,
          // PermissionEnum.RegistrationStatusIncludedUPDATE,
          // PermissionEnum.RegistrationStatusInvitedUPDATE,
          PermissionEnum.RegistrationImportTemplateREAD,
          PermissionEnum.ActionREAD,
          PermissionEnum.ActionCREATE,
          // PermissionEnum.AidWorkerCREATE, // No aidworker management
          // PermissionEnum.AidWorkerDELETE,
          // PermissionEnum.AidWorkerProgramUPDATE,
        ],
      },
      {
        role: 'programme-quality',
        label: 'Programme Quality',
        permissions: [
          // Listing all permissions of 'administratorZOA' role here to show which are not assigned (commented):
          PermissionEnum.ProgramUPDATE,
          PermissionEnum.ProgramQuestionUPDATE,
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentCREATE,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.RegistrationREAD,
          // PermissionEnum.RegistrationCREATE, // No importing
          PermissionEnum.RegistrationDELETE,
          PermissionEnum.RegistrationAttributeUPDATE, // No editing from PA popup // But can edit from AW
          PermissionEnum.RegistrationFspUPDATE,
          PermissionEnum.RegistrationNotificationREAD,
          // PermissionEnum.RegistrationNotificationCREATE, // No sending messages
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.RegistrationPersonalForValidationREAD,
          PermissionEnum.RegistrationPersonalEXPORT,
          PermissionEnum.RegistrationPersonalUPDATE,
          // PermissionEnum.RegistrationStatusIncludedUPDATE,
          // PermissionEnum.RegistrationStatusInvitedUPDATE,
          PermissionEnum.RegistrationImportTemplateREAD,
          PermissionEnum.ActionREAD,
          PermissionEnum.ActionCREATE,
          // PermissionEnum.AidWorkerCREATE, // No aidworker management
          // PermissionEnum.AidWorkerDELETE,
          // PermissionEnum.AidWorkerProgramUPDATE,
        ],
      },
      {
        role: 'project-officer',
        label: 'Project Officer',
        permissions: [
          // Assuming this is equal to Default View Role
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentVoucherREAD,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.ActionREAD,
        ],
      },
    ];

    const userRoleRepository = this.dataSource.getRepository(UserRoleEntity);
    const permissionRepository =
      this.dataSource.getRepository(PermissionEntity);
    const userRoleEntities: UserRoleEntity[] = [];
    for (const customRole of customRoles) {
      const customRoleEntity = new UserRoleEntity();
      customRoleEntity.role = customRole.role;
      customRoleEntity.label = customRole.label;

      const permissionEntities: PermissionEntity[] = [];
      for (const permission of customRole.permissions) {
        permissionEntities.push(
          await permissionRepository.findOneByOrFail({ name: permission }),
        );
      }
      customRoleEntity.permissions = permissionEntities;

      userRoleEntities.push(await userRoleRepository.save(customRoleEntity));
    }
  }

  private async addUserPerCustomRole(program: ProgramEntity): Promise<void> {
    const users = [
      {
        type: 'eth-administrationZoaUser',
        username: 'administrator-zoa-user@example.org',
        roles: ['administrator-zoa'],
      },
      {
        type: 'eth-projectManagementUser',
        username: 'project-management-user@example.org',
        roles: ['project-management'],
      },
      {
        type: 'eth-programmeManagementUser',
        username: 'programme-management-user@example.org',
        roles: ['programme-management'],
      },
      {
        type: 'eth-operationManagementUser',
        username: 'operation-management-user@example.org',
        roles: ['manager-of-operations'],
      },
      {
        type: 'eth-programQualiyUser',
        username: 'programme-quality-user@example.org',
        roles: ['manager-of-programme-quality'],
      },
      {
        type: 'eth-projectOfficerUser',
        username: 'project-officer-user@example.org',
        roles: ['project-officer'],
      },
    ];

    for (const user of users) {
      const savedUser = await this.seedHelper.getOrSaveUser({
        type: user.type,
        username: user.username,
        password: process.env.USERCONFIG_121_SERVICE_PASSWORD_PROGRAM_ADMIN,
      });

      if (savedUser) {
        await this.seedHelper.assignAidworker(
          savedUser.id,
          program.id,
          user.roles,
        );
      }
    }
  }
}
