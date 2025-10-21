import { Injectable } from '@nestjs/common';
import fs from 'fs';
import chunk from 'lodash/chunk';
import path from 'path';
import { DataSource, DeepPartial, Equal, In, Repository } from 'typeorm';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisaCustomerEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-customer.entity';
import { IntersolveVisaParentWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-parent-wallet.entity';
import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-card-status.enum';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-token-status.enum';
import { IntersolveVoucherEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/entities/intersolve-voucher.entity';
import { ImageCodeExportVouchersEntity } from '@121-service/src/payments/imagecode/entities/image-code-export-vouchers.entity';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { MessageSeedFactory } from '@121-service/src/scripts/factories/message-seed-factory';
import { RegistrationSeedFactory } from '@121-service/src/scripts/factories/registration-seed-factory';
import { TransactionSeedFactory } from '@121-service/src/scripts/factories/transaction-seed-factory';

const readSqlFile = (filepath: string): string => {
  return fs
    .readFileSync(path.join(__dirname, filepath))
    .toString()
    .replace(/\r?\n|\r/g, ' ');
};

@Injectable()
export class MockSeedFactoryService {
  private readonly registrationFactory: RegistrationSeedFactory;
  private readonly messageFactory: MessageSeedFactory;
  private readonly transactionFactory: TransactionSeedFactory;
  private readonly programRepository: Repository<ProgramEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.registrationFactory = new RegistrationSeedFactory(dataSource);
    this.messageFactory = new MessageSeedFactory(dataSource);
    this.transactionFactory = new TransactionSeedFactory(dataSource);
    this.programRepository = dataSource.getRepository(ProgramEntity);
  }

  public async multiplyRegistrations(powerNr: number): Promise<void> {
    console.log(`**MULTIPLYING REGISTRATIONS: ${powerNr} times**`);

    const programs = await this.programRepository.find();
    for (const program of programs) {
      for (let i = 1; i <= powerNr; i++) {
        console.log(`Creating registration duplication ${i} of ${powerNr}`);

        await this.registrationFactory.duplicateExistingRegistrationsForProgram(
          program.id,
        );
      }
    }

    await this.registrationFactory.makePhoneNumbersUnique();

    console.log('**COMPLETED MULTIPLYING REGISTRATIONS**');
  }

  public async extendRelatedDataToAllRegistrations(
    powerNr: number,
    programIds: number[],
  ): Promise<void> {
    console.log(`**EXTENDING RELATED DATA TO ALL REGISTRATIONS**`);

    for (const programId of programIds) {
      // 1. Extend transactions for all registrations in each program
      await this.transactionFactory.extendTransactionsFirstPaymentToAllRegistrations(
        programId,
      );

      // 2. Create messages for all registrations
      await this.messageFactory.extendMessagesToAllRegistrations(programId);
    }

    // 3. Handle FSP-specific data (vouchers, wallets, etc.)
    await this.createFspSpecificData(powerNr);

    console.log('**COMPLETED EXTENDING RELATED DATA TO ALL REGISTRATIONS**');
  }

  public async extendPaymentsAndRelatedData(
    nrPayments: number,
    programIds: number[],
  ): Promise<void> {
    console.log(
      `**MULTIPLYING TRANSACTIONS: Extending to ${nrPayments} for programs ${programIds.join(', ')}**`,
    );

    for (const programId of programIds) {
      await this.extendPaymentsAndRelatedDataPerProgram(nrPayments, programId);
    }

    console.log('**COMPLETED MULTIPLYING TRANSACTIONS**');
  }

  public async extendPaymentsAndRelatedDataPerProgram(
    nrPayments: number,
    programId: number,
  ): Promise<void> {
    console.log(
      `**MULTIPLYING TRANSACTIONS for program ${programId}: ${nrPayments} payments**`,
    );

    // Since there's already 1 transaction, create nrPayments - 1 additional payments
    const nr = nrPayments - 1;

    for (let i = 1; i <= nr; i++) {
      console.log(
        `Creating payment ${i + 1} of ${nrPayments} for program ${programId}`,
      );

      // Create a new payment
      const payment =
        await this.transactionFactory.createPaymentForProgram(programId);

      // Extend transactions for the new payment
      await this.transactionFactory.extendTransactionsForPayment(
        programId,
        payment.id,
      );

      // Create FSP-specific data for this payment
      await this.extendFspSpecificDataForPayment(payment.id, programId);
    }
  }

  public async multiplyMessages(powerNr: number): Promise<void> {
    console.log(`**MULTIPLYING MESSAGES: ${powerNr} times**`);

    for (let i = 1; i <= powerNr; i++) {
      console.log(`Creating message duplication ${i} of ${powerNr}`);

      // Duplicate existing messages
      await this.messageFactory.duplicateExistingMessages();
    }

    console.log('**COMPLETED MULTIPLYING MESSAGES**');
  }

  /**
   * Update sequence numbers (replaces updateSequenceNumbers)
   */
  public async updateSequenceNumbers(): Promise<void> {
    console.log('**UPDATING SEQUENCE NUMBERS**');

    const tables = await this.dataSource.query(`
      SELECT c.table_name
      FROM information_schema.columns c
      JOIN information_schema.tables t
      ON t.table_name = c.table_name
      AND t.table_schema = c.table_schema
      WHERE c.table_schema = '121-service'
      AND c.column_name = 'id'
      AND t.table_type = 'BASE TABLE'
    `);

    for (const table of tables) {
      const tableName = table.table_name;
      if (!['custom_migration', 'typeorm_metadata'].includes(tableName)) {
        let sequenceName = `${tableName}_id_seq`;

        // Handle special case for abbreviated sequence name
        if (tableName === 'program_fsp_configuration_property') {
          sequenceName = 'program_financial_service_pro_id_seq';
        }

        const maxIdQuery = `SELECT MAX(id) FROM "121-service"."${tableName}"`;
        const maxIdResult = await this.dataSource.query(maxIdQuery);
        const maxId = maxIdResult[0].max;

        if (maxId && maxId > 0) {
          const nextId = maxId + 1;
          const updateSequenceQuery = `SELECT setval('121-service.${sequenceName}', ${nextId})`;
          await this.dataSource.query(updateSequenceQuery);
        }
      }
    }

    console.log('**COMPLETED UPDATING SEQUENCE NUMBERS**');
  }

  public async introduceDuplicates(): Promise<void> {
    console.log('**INTRODUCING DUPLICATES**');

    const attributesWithDuplicateCheck = await this.dataSource.manager
      .getRepository(ProgramRegistrationAttributeEntity)
      .createQueryBuilder('program_registration_attribute')
      .select('id')
      .where('"duplicateCheck" = true')
      .getRawMany();

    for (const attribute of attributesWithDuplicateCheck) {
      const queryIntroduceDuplicates = readSqlFile(
        '../../../src/scripts/sql/mock-introduce-duplicates.sql',
      );
      // TODO: Could not get proper parameter to work here so resorted to string replace
      const qWithParam = queryIntroduceDuplicates.replace(
        '$1',
        `${attribute.id}`,
      );
      await this.dataSource.query(qWithParam);
    }

    console.log('**COMPLETED INTRODUCING DUPLICATES**');
  }

  private async createFspSpecificData(powerNr: number): Promise<void> {
    console.log(
      `**CREATING MOCK DATA match Visa customer and wallet data to registrations**`,
    );
    await this.createMockVisaCustomersAndWallets();

    for (let i = 1; i <= powerNr; i++) {
      console.log(
        `**CREATING MOCK DATA match AH vouchers to registrations: duplication ${i} of ${powerNr}**`,
      );
      await this.duplicateIntersolveVouchersForFirstPayment();
    }

    console.log(
      `**CREATING MOCK DATA match imagecode export vouchers to registrations**`,
    );
    await this.createImagecodeExportVouchersForFirstPayment();
  }

  private async createMockVisaCustomersAndWallets(): Promise<void> {
    const registrationRepo = this.dataSource.getRepository(RegistrationEntity);
    const customerRepo = this.dataSource.getRepository(
      IntersolveVisaCustomerEntity,
    );
    const parentWalletRepo = this.dataSource.getRepository(
      IntersolveVisaParentWalletEntity,
    );
    const childWalletRepo = this.dataSource.getRepository(
      IntersolveVisaChildWalletEntity,
    );

    const registrations = await registrationRepo.find({
      relations: { programFspConfiguration: true },
    });
    if (registrations.length === 0) {
      console.warn('No registrations found for Visa customer creation');
      return;
    }

    // Only process registrations for visa registrations
    const visaRegistrations = registrations.filter(
      (r) => r.programFspConfiguration.fspName === Fsps.intersolveVisa,
    );
    if (visaRegistrations.length === 0) {
      console.warn('No Visa registrations found for Visa customer creation');
      return;
    }

    // Get all existing customers and their registrationIds
    const existingCustomers = await customerRepo.find();
    const existingRegistrationIds = new Set(
      existingCustomers.map((c: any) => c.registrationId),
    );

    const customers: DeepPartial<IntersolveVisaCustomerEntity>[] = [];
    for (const registration of visaRegistrations) {
      if (!existingRegistrationIds.has(registration.id)) {
        customers.push({
          registrationId: registration.id,
          holderId: `CUST-${registration.id}`,
        });
      }
    }
    // Batch insert customers
    const batchSize = 2500;
    let savedCustomerIds: number[] = [...existingCustomers.map((c: any) => c.id)];
    for (const batch of chunk(customers, batchSize)) {
      const insertResult = await customerRepo.insert(batch as any[]);
      savedCustomerIds = savedCustomerIds.concat(
        insertResult.identifiers.map((idObj: any) => idObj.id),
      );
    }

    // Get all existing parent wallets and their customer IDs
    const existingParentWallets = await parentWalletRepo.find();
    const existingParentWalletCustomerIds = new Set(
      existingParentWallets.map((w: any) => w.intersolveVisaCustomerId),
    );

    const parentWallets: DeepPartial<IntersolveVisaParentWalletEntity>[] = [];
    for (const customerId of savedCustomerIds) {
      if (!customerId) {
        continue;
      }
      if (!existingParentWalletCustomerIds.has(customerId)) {
        parentWallets.push({
          intersolveVisaCustomerId: customerId,
          tokenCode: `PARENT-${customerId}`,
          isLinkedToVisaCustomer: true,
          lastExternalUpdate: new Date(),
        });
      }
    }
    // Batch insert parent wallets
    let savedParentWalletIds: number[] = [
      ...existingParentWallets.map((w: any) => w.id),
    ];
    for (const batch of chunk(parentWallets, batchSize)) {
      const saved = await parentWalletRepo.insert(batch as any[]);
      savedParentWalletIds = savedParentWalletIds.concat(
        saved.identifiers.map((idObj: any) => idObj.id),
      );
    }

    // Get all existing child wallets and their parent wallet IDs
    const existingChildWallets = await childWalletRepo.find();
    const existingChildWalletParentIds = new Set(
      existingChildWallets.map((w: any) => w.intersolveVisaParentWalletId),
    );

    const childWallets: DeepPartial<IntersolveVisaChildWalletEntity>[] = [];
    for (const parentWalletId of savedParentWalletIds) {
      if (!parentWalletId) {
        continue;
      }
      if (!existingChildWalletParentIds.has(parentWalletId)) {
        childWallets.push({
          intersolveVisaParentWalletId: parentWalletId,
          tokenCode: `CHILD-${parentWalletId}`,
          walletStatus: IntersolveVisaTokenStatus.Inactive,
          cardStatus: IntersolveVisaCardStatus.CardOk,
          isLinkedToParentWallet: true,
          isTokenBlocked: false,
          isDebitCardCreated: true,
          lastExternalUpdate: new Date(),
        });
      }
    }
    // Batch insert child wallets
    for (const batch of chunk(childWallets, batchSize)) {
      await childWalletRepo.insert(batch as any);
    }
  }

  private async createImagecodeExportVouchersForFirstPayment(): Promise<void> {
    const registrationRepo = this.dataSource.getRepository(RegistrationEntity);
    const voucherRepo = this.dataSource.getRepository(IntersolveVoucherEntity);
    const imagecodeExportVoucherRepo = this.dataSource.getRepository(
      ImageCodeExportVouchersEntity,
    );

    // Fetch registrations for relevant FSPs, ordered by id
    const voucherRegistrations = await registrationRepo.find({
      relations: { programFspConfiguration: true },
      where: {
        programFspConfiguration: {
          fspName: In([
            Fsps.intersolveVoucherPaper,
            Fsps.intersolveVoucherWhatsapp,
          ]),
        },
      },
      order: { id: 'ASC' },
    });
    // Fetch vouchers, ordered by id
    const vouchers = await voucherRepo.find({ order: { id: 'ASC' } });

    if (voucherRegistrations.length === 0 || vouchers.length === 0) {
      console.warn(
        'No registrations or vouchers found for imagecode export voucher creation',
      );
      return;
    }

    // Map registrationId to voucherId explicitly, skipping the first record if needed
    const minCount = Math.min(voucherRegistrations.length, vouchers.length);
    const exportVouchers: DeepPartial<ImageCodeExportVouchersEntity>[] = [];
    for (let i = 1; i < minCount; i++) {
      // start at 1 to not insert the first record again
      exportVouchers.push({
        registrationId: voucherRegistrations[i].id,
        voucher: vouchers[i],
      });
    }
    const batchSize = 2500;
    for (const batch of chunk(exportVouchers, batchSize)) {
      await imagecodeExportVoucherRepo.insert(batch as any[]);
    }
  }

  private async duplicateIntersolveVouchersForFirstPayment(): Promise<void> {
    const voucherRepo = this.dataSource.getRepository(IntersolveVoucherEntity);
    const vouchers = await voucherRepo.find();
    if (vouchers.length === 0) {
      console.warn('No vouchers found for duplication');
      return;
    }
    const duplicatedVouchers: (DeepPartial<IntersolveVoucherEntity> & {
      __registrationId?: number;
    })[] = [];
    for (const voucher of vouchers) {
      const newVoucher = { ...voucher };
      // Ensure typeorm writes a new record instead of trying to update the existing one
      delete (newVoucher as { id?: unknown }).id;
      duplicatedVouchers.push(newVoucher);
    }
    const batchSize = 2500;
    for (const batch of chunk(duplicatedVouchers, batchSize)) {
      await voucherRepo.insert(batch as any[]);
    }
  }

  private async extendFspSpecificDataForPayment(
    paymentId: number,
    programId: number,
  ): Promise<void> {
    // Duplicate all vouchers for the first payment in this program, assign to this payment
    const voucherRepo = this.dataSource.getRepository(IntersolveVoucherEntity);
    const paymentRepo = this.dataSource.getRepository('payment');
    const registrationRepo = this.dataSource.getRepository(RegistrationEntity);
    const imagecodeExportVoucherRepo = this.dataSource.getRepository(
      ImageCodeExportVouchersEntity,
    );

    // Get all Intersolve-voucher registrations for this program
    const voucherRegistrations = await registrationRepo.find({
      where: {
        programId: Equal(programId),
        programFspConfiguration: {
          fspName: In([
            Fsps.intersolveVoucherPaper,
            Fsps.intersolveVoucherWhatsapp,
          ]),
        },
      },
      order: { id: 'ASC' },
      relations: { programFspConfiguration: true },
    });
    // Only create export vouchers for registrations with FSP Intersolve-voucher-whatsapp
    if (voucherRegistrations.length === 0) {
      console.warn('No registrations found for Intersolve-voucher FSP');
      return;
    }

    // Find the first payment for this program
    const firstPayment = await paymentRepo.findOneOrFail({
      where: { programId: Equal(programId) },
      order: { id: 'ASC' },
    });

    // Get all vouchers for the first payment
    // We need to get the registrationId for each voucher. This is not a property on the entity, so we must get it from the logic that created the vouchers.
    // Assume that the vouchers were created in the same order as the registrations for the program/FSP.
    const vouchers = await voucherRepo.find({
      where: { paymentId: Equal(firstPayment.id) },
      order: { id: 'ASC' },
    });
    if (vouchers.length === 0) {
      console.warn(
        `No vouchers found for first payment in program ${programId}`,
      );
      return;
    }

    // Map each voucher to its registrationId by index
    const voucherToRegistrationId = new Map<number, number>();
    for (let i = 0; i < vouchers.length; i++) {
      if (voucherRegistrations[i]) {
        voucherToRegistrationId.set(vouchers[i].id, voucherRegistrations[i].id);
      }
    }

    // Duplicate vouchers for the new payment, track registrationId
    const duplicatedVouchers: (DeepPartial<IntersolveVoucherEntity> & {
      __registrationId?: number;
    })[] = [];
    for (const voucher of vouchers) {
      const newVoucher = { ...voucher };
      delete (newVoucher as { id?: unknown }).id;
      newVoucher.paymentId = paymentId;
      // Track registrationId for mapping
      (newVoucher as any).__registrationId = voucherToRegistrationId.get(
        voucher.id,
      );
      duplicatedVouchers.push(newVoucher);
    }

    // Insert duplicated vouchers in batches, using insert (returns ids only)
    const insertedVoucherIds: number[] = [];
    const batchSize = 2500;
    for (const batch of chunk(duplicatedVouchers, batchSize)) {
      const insertResult = await voucherRepo.insert(batch as any[]);
      if (insertResult && Array.isArray(insertResult.identifiers)) {
        insertedVoucherIds.push(
          ...insertResult.identifiers.map((idObj: any) => idObj.id),
        );
      }
    }

    const voucherRegistrationIds = new Set(
      voucherRegistrations.map((r: any) => r.id),
    );

    // Map inserted IDs to registrationIds for export voucher creation
    const newExportVouchers: DeepPartial<ImageCodeExportVouchersEntity>[] = [];
    for (let i = 0; i < insertedVoucherIds.length; i++) {
      const regId = (duplicatedVouchers[i] as any).__registrationId;
      if (regId && voucherRegistrationIds.has(regId)) {
        newExportVouchers.push({
          registrationId: regId,
          voucher: { id: insertedVoucherIds[i] },
        });
      }
    }

    for (const batch of chunk(newExportVouchers, batchSize)) {
      await imagecodeExportVoucherRepo.insert(batch as any[]);
    }
  }

  public async updateDerivedData(): Promise<void> {
    console.log('**UPDATING DERIVED DATA**');
    await this.transactionFactory.updatePaymentCounts();
    await this.transactionFactory.updateLatestTransactions();
    await this.messageFactory.updateLatestMessages();

    // TODO: migrate to typed approach
    console.log(`**Updating voucher attributes**`);
    const queryUpdateVoucherAttributes = readSqlFile(
      '../../../src/scripts/sql/mock-intersolve-voucher-attributes.sql',
    );
    await this.dataSource.query(queryUpdateVoucherAttributes);
    console.log(`**Done updating voucher attributes**`);

    const queryUnusedVouchers = readSqlFile(
      '../../../src/scripts/sql/mock-unused-vouchers.sql',
    );
    console.log(`**CREATING MOCK DATA unused vouchers**`);
    await this.dataSource.query(queryUnusedVouchers);

    console.log('**COMPLETED UPDATING DERIVED DATA**');
  }
}
