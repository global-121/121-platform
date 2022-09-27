import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';

import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

import fspBelcash from '../../seed-data/fsp/fsp-belcash.json';

import programPilotEth from '../../seed-data/program/program-pilot-eth.json';
import instancePilotEth from '../../seed-data/instance/instance-pilot-eth.json';
import { PermissionEnum } from '../user/permission.enum';
import { UserRoleEntity } from '../user/user-role.entity';
import { PermissionEntity } from '../user/permissions.entity';
import { ProgramEntity } from '../programs/program.entity';

@Injectable()
export class SeedProgramEth implements InterfaceScript {
  public constructor(private connection: Connection) {}

  private readonly seedHelper = new SeedHelper(this.connection);

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    await this.seedHelper.addFsp(fspBelcash);

    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programPilotEth);

    // ***** CREATE DEFAULT USERS *****
    this.seedHelper.addDefaultUsers(program, true);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instancePilotEth);

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
          PermissionEnum.InstanceUPDATE,
          // PermissionEnum.ProgramCREATE, // Admin-only
          PermissionEnum.ProgramUPDATE,
          PermissionEnum.ProgramAllREAD,
          PermissionEnum.ProgramPhaseUPDATE,
          // PermissionEnum.ProgramQuestionUPDATE, // Admin-only
          PermissionEnum.ProgramMetricsREAD,
          // PermissionEnum.FspUPDATE,
          // PermissionEnum.FspAttributeUPDATE, // Admin-only
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
          PermissionEnum.RegistrationReferenceIdSEARCH,
          PermissionEnum.RegistrationFspREAD,
          PermissionEnum.RegistrationFspUPDATE, // Maybe N.A. to ZOA as only 1 FSP??
          PermissionEnum.RegistrationNotificationREAD,
          PermissionEnum.RegistrationNotificationCREATE,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.RegistrationPersonalForValidationREAD,
          PermissionEnum.RegistrationPersonalEXPORT,
          PermissionEnum.RegistrationPersonalSEARCH,
          PermissionEnum.RegistrationPersonalUPDATE,
          PermissionEnum.RegistrationStatusSelectedForValidationUPDATE,
          PermissionEnum.RegistrationStatusNoLongerEligibleUPDATE,
          PermissionEnum.RegistrationStatusIncludedUPDATE,
          PermissionEnum.RegistrationStatusRejectedUPDATE,
          PermissionEnum.RegistrationStatusInclusionEndedUPDATE,
          PermissionEnum.RegistrationStatusInvitedUPDATE,
          PermissionEnum.RegistrationImportTemplateREAD,
          PermissionEnum.ActionREAD,
          PermissionEnum.ActionCREATE,
          PermissionEnum.AidWorkerCREATE,
          PermissionEnum.AidWorkerDELETE,
          PermissionEnum.AidWorkerProgramUPDATE,
          // PermissionEnum.RoleCREATE, // Admin-only
        ],
      },
      {
        role: 'project-management',
        label: 'Project Management',
        permissions: [
          // Listing all permissions here to show which are not assigned (commented):
          PermissionEnum.InstanceUPDATE,
          PermissionEnum.ProgramUPDATE,
          PermissionEnum.ProgramAllREAD,
          PermissionEnum.ProgramPhaseUPDATE,
          PermissionEnum.ProgramQuestionUPDATE,
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.FspUPDATE,
          PermissionEnum.FspAttributeUPDATE,
          PermissionEnum.PaymentREAD,
          // PermissionEnum.PaymentCREATE, // not doing payments
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationCREATE,
          PermissionEnum.RegistrationDELETE,
          PermissionEnum.RegistrationAttributeUPDATE,
          PermissionEnum.RegistrationReferenceIdSEARCH,
          PermissionEnum.RegistrationFspREAD,
          PermissionEnum.RegistrationFspUPDATE,
          PermissionEnum.RegistrationNotificationREAD,
          PermissionEnum.RegistrationNotificationCREATE,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.RegistrationPersonalForValidationREAD,
          PermissionEnum.RegistrationPersonalEXPORT,
          PermissionEnum.RegistrationPersonalSEARCH,
          PermissionEnum.RegistrationPersonalUPDATE,
          PermissionEnum.RegistrationStatusSelectedForValidationUPDATE,
          PermissionEnum.RegistrationStatusNoLongerEligibleUPDATE,
          PermissionEnum.RegistrationStatusIncludedUPDATE,
          PermissionEnum.RegistrationStatusRejectedUPDATE,
          PermissionEnum.RegistrationStatusInclusionEndedUPDATE,
          PermissionEnum.RegistrationStatusInvitedUPDATE,
          PermissionEnum.RegistrationImportTemplateREAD,
          PermissionEnum.ActionREAD,
          PermissionEnum.ActionCREATE,
          PermissionEnum.AidWorkerCREATE,
          PermissionEnum.AidWorkerDELETE,
          PermissionEnum.AidWorkerProgramUPDATE,
        ],
      },
      {
        role: 'programme-management',
        label: 'Programme Management',
        permissions: [
          // Listing all permissions here to show which are not assigned (commented):
          PermissionEnum.InstanceUPDATE,
          PermissionEnum.ProgramUPDATE,
          PermissionEnum.ProgramAllREAD,
          PermissionEnum.ProgramPhaseUPDATE, // 'Open registration' is allowed, so all phase updates allowed
          PermissionEnum.ProgramQuestionUPDATE,
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.FspUPDATE,
          PermissionEnum.FspAttributeUPDATE,
          PermissionEnum.PaymentREAD,
          // PermissionEnum.PaymentCREATE, // not doing payments
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationCREATE,
          PermissionEnum.RegistrationDELETE,
          PermissionEnum.RegistrationAttributeUPDATE,
          PermissionEnum.RegistrationReferenceIdSEARCH,
          PermissionEnum.RegistrationFspREAD,
          PermissionEnum.RegistrationFspUPDATE,
          PermissionEnum.RegistrationNotificationREAD,
          PermissionEnum.RegistrationNotificationCREATE,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.RegistrationPersonalForValidationREAD,
          PermissionEnum.RegistrationPersonalEXPORT,
          PermissionEnum.RegistrationPersonalSEARCH,
          PermissionEnum.RegistrationPersonalUPDATE,
          // PermissionEnum.RegistrationStatusSelectedForValidationUPDATE, // assuming all PA status updates not allowed
          // PermissionEnum.RegistrationStatusNoLongerEligibleUPDATE,
          // PermissionEnum.RegistrationStatusIncludedUPDATE,
          // PermissionEnum.RegistrationStatusRejectedUPDATE,
          // PermissionEnum.RegistrationStatusInclusionEndedUPDATE,
          // PermissionEnum.RegistrationStatusInvitedUPDATE,
          PermissionEnum.RegistrationImportTemplateREAD,
          PermissionEnum.ActionREAD,
          PermissionEnum.ActionCREATE,
          PermissionEnum.AidWorkerCREATE,
          PermissionEnum.AidWorkerDELETE,
          PermissionEnum.AidWorkerProgramUPDATE,
        ],
      },
      {
        role: 'operation-management',
        label: 'Operation management',
        permissions: [
          // Listing all permissions here to show which are not assigned (commented):
          PermissionEnum.InstanceUPDATE,
          PermissionEnum.ProgramUPDATE,
          PermissionEnum.ProgramAllREAD,
          // PermissionEnum.ProgramPhaseUPDATE, // 'Open registration' not allowed, so no phase updates allowed
          PermissionEnum.ProgramQuestionUPDATE,
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.FspUPDATE,
          PermissionEnum.FspAttributeUPDATE,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentCREATE,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.RegistrationREAD,
          // PermissionEnum.RegistrationCREATE, // No importing
          PermissionEnum.RegistrationDELETE,
          // PermissionEnum.RegistrationAttributeUPDATE, // No editing from PA popup
          // PermissionEnum.RegistrationReferenceIdSEARCH, // Needed for AW-app
          PermissionEnum.RegistrationFspREAD,
          PermissionEnum.RegistrationFspUPDATE,
          PermissionEnum.RegistrationNotificationREAD,
          // PermissionEnum.RegistrationNotificationCREATE, // No sending messages
          PermissionEnum.RegistrationPersonalREAD,
          // PermissionEnum.RegistrationPersonalForValidationREAD, // Needed for AW-app
          PermissionEnum.RegistrationPersonalEXPORT,
          PermissionEnum.RegistrationPersonalSEARCH,
          // PermissionEnum.RegistrationPersonalUPDATE,
          // PermissionEnum.RegistrationStatusSelectedForValidationUPDATE, // assuming all PA status updates not allowed
          // PermissionEnum.RegistrationStatusNoLongerEligibleUPDATE,
          // PermissionEnum.RegistrationStatusIncludedUPDATE,
          // PermissionEnum.RegistrationStatusRejectedUPDATE,
          // PermissionEnum.RegistrationStatusInclusionEndedUPDATE,
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
          PermissionEnum.InstanceUPDATE,
          PermissionEnum.ProgramUPDATE,
          // PermissionEnum.ProgramPhaseUPDATE, // 'Open registration' not allowed, so no phase updates allowed
          PermissionEnum.ProgramQuestionUPDATE,
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.FspUPDATE,
          PermissionEnum.FspAttributeUPDATE,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentCREATE,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.RegistrationREAD,
          // PermissionEnum.RegistrationCREATE, // No importing
          PermissionEnum.RegistrationDELETE,
          PermissionEnum.RegistrationAttributeUPDATE, // No editing from PA popup // But can edit from AW
          PermissionEnum.RegistrationReferenceIdSEARCH,
          PermissionEnum.RegistrationFspREAD,
          PermissionEnum.RegistrationFspUPDATE,
          PermissionEnum.RegistrationNotificationREAD,
          // PermissionEnum.RegistrationNotificationCREATE, // No sending messages
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.RegistrationPersonalForValidationREAD,
          PermissionEnum.RegistrationPersonalEXPORT,
          PermissionEnum.RegistrationPersonalSEARCH,
          PermissionEnum.RegistrationPersonalUPDATE,
          // PermissionEnum.RegistrationStatusSelectedForValidationUPDATE, // assuming all PA status updates not allowed
          // PermissionEnum.RegistrationStatusNoLongerEligibleUPDATE,
          // PermissionEnum.RegistrationStatusIncludedUPDATE,
          // PermissionEnum.RegistrationStatusRejectedUPDATE,
          // PermissionEnum.RegistrationStatusInclusionEndedUPDATE,
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
          PermissionEnum.ProgramAllREAD,
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

    const userRoleRepository = this.connection.getRepository(UserRoleEntity);
    const permissionRepository = this.connection.getRepository(
      PermissionEntity,
    );
    const userRoleEntities = [];
    for (const customRole of customRoles) {
      const customRoleEntity = new UserRoleEntity();
      customRoleEntity.role = customRole.role;
      customRoleEntity.label = customRole.label;

      const permissionEntities = [];
      for (const permission of customRole.permissions) {
        permissionEntities.push(
          await permissionRepository.findOne({ name: permission }),
        );
      }
      customRoleEntity.permissions = permissionEntities;

      userRoleEntities.push(await userRoleRepository.save(customRoleEntity));
    }
  }

  private async addUserPerCustomRole(program: ProgramEntity): Promise<void> {
    const administrationZoaUser = await this.seedHelper.getOrSaveUser({
      username: 'administrator-zoa-user@example.org',
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_FULL_ACCESS,
    });
    await this.seedHelper.assignAidworker(
      administrationZoaUser.id,
      program.id,
      ['administrator-zoa'],
    );
    const projectManagementUser = await this.seedHelper.getOrSaveUser({
      username: 'project-management-user@example.org',
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_FULL_ACCESS,
    });
    await this.seedHelper.assignAidworker(
      projectManagementUser.id,
      program.id,
      ['project-management'],
    );
    const programmeManagementUser = await this.seedHelper.getOrSaveUser({
      username: 'programme-management-user@example.org',
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_FULL_ACCESS,
    });
    await this.seedHelper.assignAidworker(
      programmeManagementUser.id,
      program.id,
      ['programme-management'],
    );
    const operationManagementUser = await this.seedHelper.getOrSaveUser({
      username: 'operation-management-user@example.org',
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_FULL_ACCESS,
    });
    await this.seedHelper.assignAidworker(
      operationManagementUser.id,
      program.id,
      ['manager-of-operations'],
    );
    const programQualiyUser = await this.seedHelper.getOrSaveUser({
      username: 'programme-quality-user@example.org',
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_FULL_ACCESS,
    });
    await this.seedHelper.assignAidworker(programQualiyUser.id, program.id, [
      'manager-of-programme-quality',
    ]);
    const projectOfficerUser = await this.seedHelper.getOrSaveUser({
      username: 'project-officer-user@example.org',
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_FULL_ACCESS,
    });
    await this.seedHelper.assignAidworker(projectOfficerUser.id, program.id, [
      'project-officer',
    ]);
  }
}

export default SeedProgramEth;
