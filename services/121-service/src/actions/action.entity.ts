import { Column, Entity, ManyToOne, Relation } from 'typeorm';

import { Base121AuditedEntity } from '@121-service/src/base-audited.entity';
import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { UserEntity } from '@121-service/src/user/user.entity';

@Entity('action')
export class ActionEntity extends Base121AuditedEntity {
  @Column({ type: 'character varying' })
  public actionType: ActionType;

  @ManyToOne((_type) => UserEntity, (user) => user.actions, {
    onDelete: 'NO ACTION', // Do not delete on deleting users, instead see catch in userService.delete()
  })
  public user: Relation<UserEntity>;

  @ManyToOne((_type) => ProjectEntity, (project) => project.actions, {
    onDelete: 'CASCADE',
  })
  public project: Relation<ProjectEntity>;
}

export enum AdditionalActionType {
  importRegistrations = 'import-registrations',
  paymentFinished = 'payment-finished',
  paymentStarted = 'payment-started',
  exportFspInstructions = 'export-fsp-instructions',
  importFspReconciliation = 'import-fsp-reconciliation',
}
export type ActionType = ExportType | AdditionalActionType;

// Add both enum together to one array so it can be used as validator in the dto
const ExportActionArray = Object.values(ExportType).map((item) => String(item));
const AdditionalActionArray = Object.values(AdditionalActionType).map((item) =>
  String(item),
);
export const ActionArray = ExportActionArray.concat(AdditionalActionArray);
