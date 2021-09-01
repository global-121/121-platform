import { ImageCodeEntity } from './../notifications/imagecode/image-code.entity';
import { IntersolveRequestEntity } from './../fsp/intersolve-request.entity';
import { IntersolveInstructionsEntity } from './../fsp/intersolve-instructions.entity';
import { TwilioMessageEntity } from './../notifications/twilio.entity';
import { ActionEntity } from './../actions/action.entity';
import { ProgramQuestionEntity } from './../programs/program-question.entity';
import { ProgramEntity } from './../programs/program.entity';
import { InstanceEntity } from './../instance/instance.entity';
import { FinancialServiceProviderEntity } from './../fsp/financial-service-provider.entity';
import { Injectable } from '@nestjs/common';
import { Connection, createConnection, Repository } from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { ProgramAidworkerAssignmentEntity } from '../programs/program-aidworker.entity';
import { UserRole } from '../user-role.enum';
import { UserRoleEntity } from '../user/user-role.entity';
import { UserType } from '../user/user-type-enum';
import { UserEntity } from '../user/user.entity';
import { InterfaceScript } from './scripts.module';
import { FspAttributeEntity } from '../fsp/fsp-attribute.entity';
import { PersonAffectedAppDataEntity } from '../people-affected/person-affected-app-data.entity';
import { RegistrationEntity } from '../registration/registration.entity';
import {
  RegistrationStatusEnum,
  RegistrationStatusTimestampField,
} from '../registration/enum/registration-status.enum';
import { RegistrationStatusChangeEntity } from '../registration/registration-status-change.entity';
import { ProgramAnswerEntity } from '../registration/program-answer.entity';
import { ImageCodeExportVouchersEntity } from '../notifications/imagecode/image-code-export-vouchers.entity';
import { IntersolveBarcodeEntity } from '../fsp/intersolve-barcode.entity';
import { TransactionEntity } from '../programs/transactions.entity';

// docker exec -it 121-service npx ts-node src/scripts migrate-registrations-refactor

@Injectable()
export class MigrateRefactor implements InterfaceScript {
  public constructor(private connection: Connection) {}
  private oldConnection;
  private programId = 1;
  private userRepository;
  private programRepository;
  private fspRepository;
  private registrationRepository;
  private registrationStatusChangeRepository;
  private programQuestionRepository;
  private intersolveBarcodeRepository;
  private paDataStorageRepository;

  public async run(): Promise<void> {
    // await this.connection.query(`
    //   SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity
    //   WHERE pg_stat_activity.datname = 'global121' AND pid <> pg_backend_pid();
    //   `);
    // await this.connection.query(`
    //   CREATE DATABASE "global121-backup" WITH TEMPLATE global121 OWNER ${process.env.ORMCONFIG_121_SERVICE_USERNAME};
    // `);

    await this.connection.dropDatabase();
    await this.connection.synchronize(true);
    this.oldConnection = await createConnection({
      name: 'oldConnection',
      type: 'postgres',
      host: '121db',
      port: 5432,
      username: process.env.ORMCONFIG_121_SERVICE_USERNAME,
      password: process.env.ORMCONFIG_121_SERVICE_PASSWORD,
      database: 'global121-old',
      schema: '121-service',
    });
    this.userRepository = this.connection.getRepository(UserEntity);
    this.programRepository = this.connection.getRepository(ProgramEntity);
    this.fspRepository = this.connection.getRepository(
      FinancialServiceProviderEntity,
    );
    this.registrationRepository = this.connection.getRepository(
      RegistrationEntity,
    );
    this.registrationStatusChangeRepository = this.connection.getRepository(
      RegistrationStatusChangeEntity,
    );
    this.programQuestionRepository = this.connection.getRepository(
      ProgramQuestionEntity,
    );
    this.intersolveBarcodeRepository = this.connection.getRepository(
      IntersolveBarcodeEntity,
    );
    this.paDataStorageRepository = this.connection.getRepository(
      PersonAffectedAppDataEntity,
    );

    await this.migrateUsers();
    await this.migrateFsp();
    await this.migrateInstance();
    await this.migrateProgram();
    await this.migrateActions();
    await this.migrateTwilioMessages();
    await this.migrateIntersolveInstruction();
    await this.migrateIntersolveRequests();
    await this.migrateImageCode();
    await this.migrateIntersolveBarcode();
    await this.migratePaUsers();
    await this.migrateRegistrations();
    await this.migrateProgramAnswers();
    await this.migrateImageCodeExportVouchers();
    await this.migrateTransactions();
  }

  public async migrateUsers(): Promise<void> {
    const userRoleRepository = this.connection.getRepository(UserRoleEntity);
    await userRoleRepository.save([
      {
        role: UserRole.Admin,
        label: 'Admin',
      },
      {
        role: UserRole.View,
        label: 'Only view data, including Personally Identifiable Information',
      },
      {
        role: UserRole.PersonalData,
        label: 'Handle Personally Identifiable Information',
      },
      {
        role: UserRole.RunProgram,
        label: 'Run Program',
      },
      {
        role: UserRole.FieldValidation,
        label: 'Do Field Validation',
      },
    ]);

    const oldUsers = await this.oldConnection.query(`SELECT
        *
      FROM
        "121-service"."user" u
      LEFT JOIN "121-service".user_roles_user_role ur_ur ON
        u.id = ur_ur."userId"
      LEFT JOIN "121-service".user_role ur ON
        ur_ur."userRoleId" = ur.id
    `);

    await this.disableAutoIncrementId(this.userRepository);
    for await (const oldUser of oldUsers) {
      let newUser = await this.userRepository.findOne(oldUser.userId);
      if (!newUser) {
        newUser = new UserEntity();
        newUser.id = oldUser.userId;
        newUser.username = oldUser.email;
        newUser.password = 'temporary password';
        newUser.userType = UserType.aidWorker;
        await this.userRepository.save(newUser);
      }
      // This is needed to ensure that the old password is not double hashed
      await this.connection
        .createQueryBuilder()
        .update(UserEntity)
        .set({ password: oldUser.password })
        .where('id = :id', { id: oldUser.userId })
        .execute();

      const assignmentRepository = this.connection.getRepository(
        ProgramAidworkerAssignmentEntity,
      );
      const userRoleRepository = this.connection.getRepository(UserRoleEntity);
      newUser.id;
      const roles = await userRoleRepository.find({
        where: {
          role: oldUser.role,
        },
      });
      await assignmentRepository.save({
        user: { id: newUser.id },
        program: { id: this.programId },
        roles: roles,
      });
    }
    await this.enableAutoIncrementId(this.userRepository);
  }

  private async migratePaUsers(): Promise<void> {
    console.log('migratePaUsers');
    const oldUsers = await this.oldConnection.query(`SELECT
        *
      FROM
        "pa-accounts"."user"
    `);
    await this.disableAutoIncrementId(this.paDataStorageRepository);
    for await (const oldUser of oldUsers) {
      const newUser = new UserEntity();
      newUser.username = oldUser.username;
      newUser.password = 'temporary password';
      newUser.userType = UserType.personAffected;
      await this.userRepository.save(newUser);

      // This is needed to ensure that the old password is not double hashed
      await this.connection
        .createQueryBuilder()
        .update(UserEntity)
        .set({ password: oldUser.password })
        .where('username = :username', { username: oldUser.username })
        .execute();

      const user = await this.userRepository.findOne({
        where: { username: newUser.username },
      });
      await this.migratePaDataStorage(user);
    }
    await this.enableAutoIncrementId(this.paDataStorageRepository);
  }

  private async migratePaDataStorage(user: UserEntity): Promise<void> {
    console.log('migratePaDataStorage for user: ' + user.id);

    const query = `SELECT 
    *
  FROM
    "pa-accounts"."data-storage" ds
  LEFT JOIN "pa-accounts".user u ON ds."userId" = u.id
  WHERE username = '${user.username}'
`;
    const oldStorage = await this.oldConnection.query(query);

    for await (const oldRecord of oldStorage) {
      const newRecord = new PersonAffectedAppDataEntity();
      newRecord.id = oldRecord.id;
      newRecord.type = oldRecord.type;
      newRecord.data = oldRecord.data;
      newRecord.user = user;
      await this.paDataStorageRepository.save(newRecord);
    }
  }

  private async migrateFsp(): Promise<void> {
    console.log('migrateFsp: ');
    const fspAttrRepository = this.connection.getRepository(FspAttributeEntity);
    await this.disableAutoIncrementId(this.fspRepository);
    await this.disableAutoIncrementId(fspAttrRepository);

    const oldFsps = await this.oldConnection
      .query(`SELECT *, fa.id as attrid , f.id as fspid FROM "121-service".fsp f
    LEFT JOIN "121-service".fsp_attribute fa
    ON	f.id = fa."fspId"`);
    for await (const oldFsp of oldFsps) {
      const newFsp = await this.fspRepository.save({
        id: oldFsp.fspid,
        fsp: oldFsp.fsp,
        fspDisplayName: oldFsp.fspDisplayName,
        program: [{ id: this.programId }],
      });
      if (oldFsp.attrid) {
        await fspAttrRepository.save({
          id: oldFsp.attrid,
          name: oldFsp.name,
          label: oldFsp.label,
          placeholder: oldFsp.placeholder,
          options: oldFsp.options,
          export: oldFsp.export,
          answerType: oldFsp.answerType,
          fsp: newFsp,
        });
      }
    }
    await this.enableAutoIncrementId(this.fspRepository);
    await this.enableAutoIncrementId(fspAttrRepository);
  }

  private async migrateRegistrations(): Promise<void> {
    console.log('migrateRegistrations: ');
    await this.disableAutoIncrementId(this.registrationRepository);

    const oldConnections = await this.oldConnection.query(
      `SELECT c.*,u.username 
      FROM "121-service".connection c
      LEFT JOIN "pa-accounts".user u
      ON c."referenceId" = u."referenceId"
      `,
    );
    const program = await this.programRepository.findOne(this.programId);
    for await (const oldConnection of oldConnections) {
      const newRegistration = new RegistrationEntity();
      newRegistration.id = oldConnection.id;
      newRegistration.registrationStatus = this.getPaStatus(
        oldConnection,
        this.programId,
      );
      newRegistration.qrIdentifier = oldConnection.qrIdentifier;
      newRegistration.referenceId = oldConnection.referenceId;
      newRegistration.customData = oldConnection.customData;
      newRegistration.phoneNumber = oldConnection.phoneNumber;
      newRegistration.preferredLanguage = oldConnection.preferredLanguage;
      newRegistration.inclusionScore = oldConnection.inclusionScore;
      newRegistration.namePartnerOrganization =
        oldConnection.namePartnerOrganization;
      newRegistration.paymentAmountMultiplier =
        oldConnection.paymentAmountMultiplier;
      newRegistration.note = oldConnection.note;
      newRegistration.noteUpdated = oldConnection.noteUpdated;
      newRegistration.program = program;
      newRegistration.user = await this.userRepository.findOne({
        where: { username: oldConnection.username },
      });
      newRegistration.fsp = await this.fspRepository.findOne(
        oldConnection.fspId,
      );

      const registration = await this.registrationRepository.save(
        newRegistration,
      );

      for await (let status of Object.values(RegistrationStatusEnum)) {
        const dateColumn = this.getDateColumPerStatus(status);
        if (!!oldConnection[dateColumn]) {
          await this.migrateRegistrationStatusChanges(
            registration,
            status,
            oldConnection[dateColumn],
          );
        }
      }
    }
    await this.enableAutoIncrementId(this.registrationRepository);
  }

  private async migrateRegistrationStatusChanges(
    registration: RegistrationEntity,
    status: RegistrationStatusEnum,
    timestamp: Date,
  ): Promise<void> {
    const registrationStatusChange = new RegistrationStatusChangeEntity();
    registrationStatusChange.registration = registration;
    registrationStatusChange.registrationStatus = status;
    registrationStatusChange.created = timestamp;
    await this.registrationStatusChangeRepository.save(
      registrationStatusChange,
    );
  }

  public getDateColumPerStatus(filterStatus: RegistrationStatusEnum): any {
    switch (filterStatus) {
      case RegistrationStatusEnum.imported:
        return RegistrationStatusTimestampField.importedDate;
      case RegistrationStatusEnum.invited:
        return RegistrationStatusTimestampField.invitedDate;
      case RegistrationStatusEnum.noLongerEligible:
        return RegistrationStatusTimestampField.noLongerEligibleDate;
      case RegistrationStatusEnum.startedRegistration:
        return 'accountCreatedDate'; //RegistrationStatusTimestampField.startedRegistrationDate;
      case RegistrationStatusEnum.registered:
        return 'appliedDate'; //RegistrationStatusTimestampField.registeredDate;
      case RegistrationStatusEnum.selectedForValidation:
        return RegistrationStatusTimestampField.selectedForValidationDate;
      case RegistrationStatusEnum.validated:
        return RegistrationStatusTimestampField.validationDate;
      case RegistrationStatusEnum.included:
        return RegistrationStatusTimestampField.inclusionDate;
      case RegistrationStatusEnum.inclusionEnded:
        return RegistrationStatusTimestampField.inclusionEndDate;
      case RegistrationStatusEnum.rejected:
        return RegistrationStatusTimestampField.rejectionDate;
    }
  }

  private getPaStatus(
    connection: any,
    programId: number,
  ): RegistrationStatusEnum {
    let paStatus: RegistrationStatusEnum;
    if (connection.programsIncluded.includes(programId)) {
      paStatus = RegistrationStatusEnum.included;
    } else if (connection.inclusionEndDate) {
      paStatus = RegistrationStatusEnum.inclusionEnded;
    } else if (connection.programsRejected.includes(programId)) {
      paStatus = RegistrationStatusEnum.rejected;
    } else if (connection.appliedDate && connection.noLongerEligibleDate) {
      paStatus = RegistrationStatusEnum.registeredWhileNoLongerEligible;
    } else if (connection.validationDate) {
      paStatus = RegistrationStatusEnum.validated;
    } else if (connection.selectedForValidationDate) {
      paStatus = RegistrationStatusEnum.selectedForValidation;
    } else if (connection.appliedDate) {
      paStatus = RegistrationStatusEnum.registered;
    } else if (connection.accountCreatedDate) {
      paStatus = RegistrationStatusEnum.startedRegistration;
    } else if (connection.noLongerEligibleDate) {
      paStatus = RegistrationStatusEnum.noLongerEligible;
    } else if (connection.invitedDate) {
      paStatus = RegistrationStatusEnum.invited;
    } else if (connection.importedDate) {
      paStatus = RegistrationStatusEnum.imported;
    } else if (connection.created) {
      paStatus = RegistrationStatusEnum.startedRegistration;
    }
    return paStatus;
  }

  public async migrateProgramAnswers(): Promise<void> {
    console.log('migrateProgramAnswers');
    const programAnswerRepository = this.connection.getRepository(
      ProgramAnswerEntity,
    );
    await this.disableAutoIncrementId(programAnswerRepository);
    const oldValidationData = await this.oldConnection.query(`SELECT
        *
      FROM
        "121-service"."validation_data_attributes" v;
      `);
    for (const oldRecord of oldValidationData) {
      const newRecord = new ProgramAnswerEntity();
      newRecord.id = oldRecord.id;
      newRecord.programAnswer = oldRecord.answer;
      newRecord.programQuestion = await this.programQuestionRepository.findOne({
        where: { name: oldRecord.attribute },
      });
      newRecord.registration = await this.registrationRepository.findOne({
        where: { referenceId: oldRecord.referenceId },
      });
      console.log('newRecord: ', newRecord);
      await programAnswerRepository.save(newRecord);
    }
    await this.enableAutoIncrementId(programAnswerRepository);
  }

  public async migrateInstance(): Promise<void> {
    console.log('migrateInstance');
    const repo = this.connection.getRepository(InstanceEntity);
    await this.disableAutoIncrementId(repo);
    const oldInstances = await this.oldConnection.query(`SELECT
        *
      FROM
        "121-service"."instance" i;
      `);
    for await (const i of oldInstances) {
      await repo.save(i);
    }
    await this.enableAutoIncrementId(repo);
  }

  public async migrateProgram(): Promise<void> {
    console.log('migratePrograms: ');
    await this.disableAutoIncrementId(this.programRepository);
    const oldProgram = (
      await this.oldConnection.query(`SELECT
        *
      FROM
        "121-service"."program" i;
      `)
    )[0];
    const newProgram = await this.programRepository.save(oldProgram);
    const crits = await this.oldConnection.query(`SELECT
        *
      FROM
        "121-service"."custom_criterium" c;
      `);
    for await (let c of crits) {
      c.name = c.criterium;
      c.questionType = c.criteriumType;
      c.program = newProgram;
      await this.programQuestionRepository.save(c);
    }
    await this.enableAutoIncrementId(this.programRepository);
  }

  private async migrateActions(): Promise<void> {
    console.log('migrateActions: ');
    const repo = this.connection.getRepository(ActionEntity);
    await this.disableAutoIncrementId(repo);
    const oldActions = await this.oldConnection.query(`SELECT
        *
      FROM
        "121-service"."action" a;
      `);
    for await (let a of oldActions) {
      a.created = a.timestamp;
      a.user = { id: a.userId };
      a.program = { id: this.programId };
      await repo.save(a);
    }
    await this.enableAutoIncrementId(repo);
  }

  private async migrateTwilioMessages(): Promise<void> {
    console.log('migrateTwilioMessages: ');
    const repo = this.connection.getRepository(TwilioMessageEntity);
    await this.disableAutoIncrementId(repo);
    const ms = await this.oldConnection.query(`SELECT
        *
      FROM
        "121-service"."twilio-message" a;
      `);
    for await (let m of ms) {
      m.created = m.dateCreated;
      await repo.save(m);
    }
    await this.enableAutoIncrementId(repo);
  }

  private async migrateIntersolveInstruction(): Promise<void> {
    console.log('migrateIntersolveInstruction: ');
    const repo = this.connection.getRepository(IntersolveInstructionsEntity);
    await this.disableAutoIncrementId(repo);
    const i = await this.oldConnection.query(`SELECT
        *
      FROM
        "121-service"."intersolve_instruction" a;
      `);
    await repo.save(i);
    await this.enableAutoIncrementId(repo);
  }

  private async migrateIntersolveRequests(): Promise<void> {
    console.log('migrateIntersolveRequests: ');
    const repo = this.connection.getRepository(IntersolveRequestEntity);
    await this.disableAutoIncrementId(repo);
    const i = await this.oldConnection.query(`SELECT
        *
      FROM
        "121-service"."intersolve_request" a;
      `);
    await repo.save(i);
    await this.enableAutoIncrementId(repo);
  }

  private async migrateImageCode(): Promise<void> {
    console.log('migrateImageCode: ');
    const repo = this.connection.getRepository(ImageCodeEntity);
    await this.disableAutoIncrementId(repo);
    const i = await this.oldConnection.query(`SELECT
        *
      FROM
        "121-service"."imagecode" a;
      `);
    await repo.save(i);
    await this.enableAutoIncrementId(repo);
  }

  private async migrateIntersolveBarcode(): Promise<void> {
    console.log('migrateIntersolveBarcode: ');
    await this.disableAutoIncrementId(this.intersolveBarcodeRepository);
    const i = await this.oldConnection.query(`SELECT
        *
      FROM
        "121-service"."intersolve_barcode" a;
      `);
    await this.intersolveBarcodeRepository.save(i);
    await this.enableAutoIncrementId(this.intersolveBarcodeRepository);
  }

  private async migrateImageCodeExportVouchers(): Promise<void> {
    console.log('migrateImageCodeExportVouchers: ');
    const imageCodeExportVouchersRepository = this.connection.getRepository(
      ImageCodeExportVouchersEntity,
    );
    await this.disableAutoIncrementId(imageCodeExportVouchersRepository);
    const oldRecords = await this.oldConnection.query(`SELECT
        *
      FROM
        "121-service"."imagecode_export_vouchers" a;
      `);
    for await (let oldRecord of oldRecords) {
      const newRecord = new ImageCodeExportVouchersEntity();
      newRecord.id = oldRecord.id;
      newRecord.image = oldRecord.image;
      newRecord.registration = await this.registrationRepository.findOne(
        oldRecord.connectionId,
      );
      newRecord.barcode = await this.intersolveBarcodeRepository.findOne(
        oldRecord.barcodeId,
      );

      await imageCodeExportVouchersRepository
        .createQueryBuilder()
        .insert()
        .values(newRecord)
        .execute();
    }
    await this.enableAutoIncrementId(imageCodeExportVouchersRepository);
  }

  private async migrateTransactions(): Promise<void> {
    console.log('migrateTransactions: ');
    const transactionRepository = this.connection.getRepository(
      TransactionEntity,
    );
    await this.disableAutoIncrementId(transactionRepository);
    const program = await this.programRepository.findOne(this.programId);
    const oldRecords = await this.oldConnection.query(`SELECT
        *
      FROM
        "121-service"."transaction";
      `);
    for await (let oldRecord of oldRecords) {
      const newRecord: TransactionEntity = oldRecord;
      newRecord.registration = await this.registrationRepository.findOne(
        oldRecord.connectionId,
      );
      newRecord.program = program;
      newRecord.financialServiceProvider = await this.fspRepository.findOne(
        oldRecord.financialServiceProviderId,
      );
      await transactionRepository.save(newRecord);
    }
    await this.enableAutoIncrementId(transactionRepository);
  }

  private async disableAutoIncrementId(repo: Repository<any>): Promise<void> {
    repo.metadata.columns = repo.metadata.columns.map<ColumnMetadata>(c => {
      if (c.propertyName === 'id') {
        c.isGenerated = false;
        c.generationStrategy = undefined;
      }
      return c;
    });
    await repo.query(
      `ALTER TABLE "121-service"."${repo.metadata.tableName}" ALTER COLUMN id DROP DEFAULT;`,
    );
  }

  private async enableAutoIncrementId(repo: Repository<any>): Promise<void> {
    repo.metadata.columns = repo.metadata.columns.map<ColumnMetadata>(c => {
      if (c.propertyName === 'id') {
        c.isGenerated = false;
        c.generationStrategy = undefined;
      }
      return c;
    });

    const maxId = await repo.findOne({
      order: { id: 'DESC' },
    });
    console.log('enableAutoIncrementId: ', repo.metadata.tableName);
    try {
      await repo.query(
        `CREATE SEQUENCE "121-service".${repo.metadata.tableName}_id_seq;`,
      );
    } catch {
      console.log(`SEQUENCE ${repo.metadata.tableName} already exists`);
    }

    await repo.query(`
      ALTER TABLE "121-service"."${repo.metadata.tableName}" ALTER COLUMN id SET DEFAULT nextval('"121-service".${repo.metadata.tableName}_id_seq');`);
    await repo.query(`
    SELECT setval('"121-service".${repo.metadata.tableName}_id_seq', ${maxId.id}, true);`);
  }
}

export default MigrateRefactor;
