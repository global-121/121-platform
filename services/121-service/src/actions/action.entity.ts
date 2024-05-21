import { Base121AuditedEntity } from '@121-service/src/base-audited.entity';
import { ExportType } from '@121-service/src/metrics/dto/export-details.dto';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { UserEntity } from '@121-service/src/user/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity('action')
export class ActionEntity extends Base121AuditedEntity {
  @Column()
  public actionType: ActionType;

  @ManyToOne((_type) => UserEntity, (user) => user.actions)
  public user: UserEntity;

  @ManyToOne((_type) => ProgramEntity, (program) => program.actions)
  public program: ProgramEntity;
}

export enum AdditionalActionType {
  importPeopleAffected = 'import-people-affected',
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
