import { Injectable } from '@nestjs/common';
import fs from 'fs';
import chunk from 'lodash/chunk';
import path from 'path';
import { DataSource, DeepPartial, Equal, In } from 'typeorm';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisaCustomerEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-customer.entity';
import { IntersolveVisaParentWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-parent-wallet.entity';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-token-status.enum';
import { IntersolveVoucherEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/entities/intersolve-voucher.entity';
import { ImageCodeExportVouchersEntity } from '@121-service/src/payments/imagecode/entities/image-code-export-vouchers.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import {
  RegistrationDataFactory,
  RegistrationFactoryOptions,
} from '@121-service/src/scripts/factories/registration-data-factory';
import {
  PaymentFactoryOptions,
  TransactionDataFactory,
} from '@121-service/src/scripts/factories/transaction-data-factory';
import {
  TwilioMessageDataFactory,
  TwilioMessageFactoryOptions,
} from '@121-service/src/scripts/factories/twilio-message-data-factory';

export interface MockDataGenerationOptions {
  readonly registrationOptions: RegistrationFactoryOptions;
  readonly messageOptions: TwilioMessageFactoryOptions;
  readonly paymentOptions: PaymentFactoryOptions;
}

const readSqlFile = (filepath: string): string => {
  return fs
    .readFileSync(path.join(__dirname, filepath))
    .toString()
    .replace(/\r?\n|\r/g, ' ');
};

/**
 * Service that orchestrates type-safe mock data generation using factories.
 * Replaces the raw SQL approach with ORM-based operations.
 */
@Injectable()
export class MockDataFactoryService {
  private readonly registrationFactory: RegistrationDataFactory;
  private readonly messageFactory: TwilioMessageDataFactory;
  private readonly transactionFactory: TransactionDataFactory;

  constructor(private readonly dataSource: DataSource) {
    this.registrationFactory = new RegistrationDataFactory(dataSource);
    this.messageFactory = new TwilioMessageDataFactory(dataSource);
    this.transactionFactory = new TransactionDataFactory(dataSource);
  }

  /**
   * Multiply registrations and related payment data (replaces multiplyRegistrationsAndRelatedPaymentData)
   */
  public async multiplyRegistrationsAndRelatedPaymentData(
    powerNr: number,
    options: MockDataGenerationOptions,
  ): Promise<void> {
    console.log(
      `**MULTIPLYING REGISTRATIONS AND RELATED DATA: ${powerNr} times**`,
    );

    await this.dataSource.transaction(async (manager) => {
      // Set the data source for all factories to use the transaction manager
      this.setTransactionManager(manager);

      try {
        // 1. Multiply registrations
        await this.multiplyRegistrations(powerNr, options.registrationOptions);

        // 2. Create transactions for each program (following original logic)
        for (const programId of options.paymentOptions.programIds) {
          // Create transactions for all registrations of this program
          await this.transactionFactory.createTransactionsOnePerRegistrationForProgram(
            programId,
            { userId: options.paymentOptions.defaultUserId || 1 },
          );
        }

        // 3. Create messages for all registrations
        const registrationRepository =
          manager.getRepository('RegistrationEntity');
        const registrations = await registrationRepository.find();
        await this.messageFactory.generateMessagesForRegistrations(
          registrations as any[],
          options.messageOptions,
        );

        // 4. Handle FSP-specific data (vouchers, wallets, etc.)
        await this.createFspSpecificData(powerNr);
      } finally {
        // Reset the data source
        this.resetDataSource();
      }
    });

    console.log('**COMPLETED MULTIPLYING REGISTRATIONS AND RELATED DATA**');
  }

  /**
   * Multiply registrations (replaces multiplyRegistrations)
   */
  public async multiplyRegistrations(
    powerNr: number,
    _options: RegistrationFactoryOptions,
  ): Promise<void> {
    console.log(`**MULTIPLYING REGISTRATIONS: ${powerNr} times**`);

    // Duplicate registrations and their attribute data together to maintain relationships
    for (let i = 1; i <= powerNr; i++) {
      console.log(`Creating registration duplication ${i} of ${powerNr}`);

      await this.registrationFactory.duplicateExistingRegistrations();
    }

    // Make phone numbers unique
    await this.registrationFactory.makePhoneNumbersUnique();

    console.log('**COMPLETED MULTIPLYING REGISTRATIONS**');
  }

  /**
   * Multiply transactions for specific programs (replaces multiplyTransactions)
   */
  public async multiplyTransactions(
    nrPayments: number,
    programIds: number[],
  ): Promise<void> {
    console.log(
      `**MULTIPLYING TRANSACTIONS: Extending to ${nrPayments} for programs ${programIds.join(', ')}**`,
    );

    await this.dataSource.transaction(async (manager) => {
      this.setTransactionManager(manager);

      try {
        for (const programId of programIds) {
          await this.multiplyTransactionsPerProgram(nrPayments, programId);
        }

        // Update payment counts
        await this.transactionFactory.updatePaymentCounts();

        // Update last transaction events
        await this.transactionFactory.updateLastTransactionEvents();
      } finally {
        this.resetDataSource();
      }
    });

    console.log('**COMPLETED MULTIPLYING TRANSACTIONS**');
  }

  /**
   * Multiply transactions for a specific program (replaces multiplyTransactionsPerProgram)
   */
  public async multiplyTransactionsPerProgram(
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

      // Create transactions for all registrations in this program
      await this.transactionFactory.createTransactionsForPayment(
        payment.id,
        programId,
      );

      await this.transactionFactory.replicateTransactionEvents(programId);

      // Create FSP-specific data for this payment
      await this.createFspSpecificDataForPayment(payment.id, programId);
    }
  }

  /**
   * Multiply messages (replaces multiplyMessages)
   */
  public async multiplyMessages(
    powerNr: number,
    options: TwilioMessageFactoryOptions,
  ): Promise<void> {
    console.log(`**MULTIPLYING MESSAGES: ${powerNr} times**`);

    for (let i = 1; i <= powerNr; i++) {
      console.log(`Creating message duplication ${i} of ${powerNr}`);

      // Duplicate existing messages
      await this.messageFactory.duplicateExistingMessages(options);
    }

    // Update latest messages
    await this.messageFactory.updateLatestMessages();

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

  /**
   * Introduce duplicates for duplicate check attributes (replaces introduceDuplicates)
   */
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

  /**
   * Create FSP-specific data (vouchers, wallets, etc.)
   */
  private async createFspSpecificData(powerNr: number): Promise<void> {
    console.log('Creating FSP-specific data (vouchers, wallets, etc.)');

    // --- TYPE-SAFE LOGIC FOR VISA CUSTOMERS, PARENT WALLETS, CHILD WALLETS ---
    await this.createMockVisaCustomersAndWallets();

    for (let i = 1; i <= powerNr; i++) {
      console.log(
        `**CREATING MOCK DATA match AH vouchers registrations: duplication ${i} of ${powerNr}**`,
      );
      await this.duplicateIntersolveVouchersInBatches();
    }

    // --- TYPE-SAFE LOGIC FOR IMAGECODE EXPORT VOUCHERS ---
    console.log(
      `**CREATING MOCK DATA match imagecode export vouchers to registrations: (type-safe)**`,
    );
    await this.createMockImagecodeExportVouchers();
  }

  /**
   * Type-safe creation of mock Visa customers, parent wallets, and child wallets
   */
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
      existingCustomers.map((c) => c.registrationId),
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
    let savedCustomers: IntersolveVisaCustomerEntity[] = [...existingCustomers];
    for (const batch of chunk(customers, batchSize)) {
      const saved = await customerRepo.save(batch);
      savedCustomers = savedCustomers.concat(saved);
    }

    // Get all existing parent wallets and their customer IDs
    const existingParentWallets = await parentWalletRepo.find();
    const existingParentWalletCustomerIds = new Set(
      existingParentWallets.map((w) => w.intersolveVisaCustomerId),
    );

    const parentWallets: DeepPartial<IntersolveVisaParentWalletEntity>[] = [];
    for (const customer of savedCustomers) {
      if (!customer.id) {
        continue;
      }
      if (!existingParentWalletCustomerIds.has(customer.id)) {
        parentWallets.push({
          intersolveVisaCustomerId: customer.id,
          tokenCode: `PARENT-${customer.id}`,
          isLinkedToVisaCustomer: true,
        });
      }
    }
    // Batch insert parent wallets
    let savedParentWallets: IntersolveVisaParentWalletEntity[] = [
      ...existingParentWallets,
    ];
    for (const batch of chunk(parentWallets, batchSize)) {
      const saved = await parentWalletRepo.save(batch);
      savedParentWallets = savedParentWallets.concat(saved);
    }

    // Get all existing child wallets and their parent wallet IDs
    const existingChildWallets = await childWalletRepo.find();
    const existingChildWalletParentIds = new Set(
      existingChildWallets.map((w) => w.intersolveVisaParentWalletId),
    );

    const childWallets: DeepPartial<IntersolveVisaChildWalletEntity>[] = [];
    for (const parentWallet of savedParentWallets) {
      if (!parentWallet.id) {
        continue;
      }
      if (!existingChildWalletParentIds.has(parentWallet.id)) {
        childWallets.push({
          intersolveVisaParentWalletId: parentWallet.id,
          tokenCode: `CHILD-${parentWallet.id}`,
          walletStatus: IntersolveVisaTokenStatus.Active,
          cardStatus: null,
          isLinkedToParentWallet: true,
          isTokenBlocked: false,
          isDebitCardCreated: false,
        });
      }
    }
    // Batch insert child wallets
    for (const batch of chunk(childWallets, batchSize)) {
      await childWalletRepo.save(batch);
    }
  }

  /**
   * Type-safe creation of mock imagecode export vouchers
   */
  private async createMockImagecodeExportVouchers(): Promise<void> {
    const registrationRepo = this.dataSource.getRepository(RegistrationEntity);
    const voucherRepo = this.dataSource.getRepository(IntersolveVoucherEntity);
    const imagecodeExportVoucherRepo = this.dataSource.getRepository(
      ImageCodeExportVouchersEntity,
    );

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
    });
    const vouchers = await voucherRepo.find();

    if (voucherRegistrations.length === 0 || vouchers.length === 0) {
      console.warn(
        'No registrations or vouchers found for imagecode export voucher creation',
      );
      return;
    }

    const minCount = Math.min(voucherRegistrations.length, vouchers.length);
    const exportVouchers: DeepPartial<ImageCodeExportVouchersEntity>[] = [];
    for (let i = 0; i < minCount; i++) {
      if (i === 0) {
        continue; // Skip the first record to avoid duplicate
      }
      exportVouchers.push({
        registration: voucherRegistrations[i],
        voucher: vouchers[i],
      });
    }
    const batchSize = 2500;
    for (const batch of chunk(exportVouchers, batchSize)) {
      await imagecodeExportVoucherRepo.save(batch);
    }
  }

  /**
   * Type-safe duplication of Intersolve vouchers in batches
   */
  private async duplicateIntersolveVouchersInBatches(): Promise<void> {
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
      await voucherRepo.save(batch);
    }
  }

  /**
   * Create FSP-specific data for a specific payment
   */
  private async createFspSpecificDataForPayment(
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
    // Find the first payment for this program
    const firstPayment = await paymentRepo.findOne({
      where: { programId: Equal(programId) },
      order: { id: 'ASC' },
    });
    if (!firstPayment) {
      console.warn(`No payment found for program ${programId}`);
      return;
    }
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
    // Get registrations for this program, in the same order as vouchers were created
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
    const batchSize = 2500;
    const savedVouchers: (IntersolveVoucherEntity & {
      __registrationId?: number;
    })[] = [];
    for (const batch of chunk(duplicatedVouchers, batchSize)) {
      const saved = await voucherRepo.save(batch);
      // Re-attach __registrationId for mapping
      for (let i = 0; i < saved.length; i++) {
        (saved[i] as any).__registrationId = (batch[i] as any).__registrationId;
      }
      savedVouchers.push(...saved);
    }

    const whatsappRegistrationIds = new Set(
      voucherRegistrations.map((r) => r.id),
    );
    // 1-to-1 mapping: for each new voucher, if its registrationId is in the whatsapp set, create an export voucher
    const newExportVouchers: DeepPartial<ImageCodeExportVouchersEntity>[] = [];
    for (const voucher of savedVouchers) {
      const regId = (voucher as any).__registrationId;
      if (regId && whatsappRegistrationIds.has(regId)) {
        newExportVouchers.push({
          registrationId: regId,
          voucher,
        });
      }
    }
    // Prevent duplicates: check for existing export vouchers for these voucher/registration pairs
    const existingExportVouchers = await imagecodeExportVoucherRepo.find({
      where: {},
    });
    const existingPairs = new Set(
      existingExportVouchers.map(
        (ev) =>
          `${ev.registrationId}-${
            ev.voucher && (ev.voucher as IntersolveVoucherEntity).id
          }`,
      ),
    );
    const exportVouchersToCreate = newExportVouchers.filter(
      (ev) =>
        ev.registrationId &&
        ev.voucher &&
        !existingPairs.has(
          `${ev.registrationId}-${(ev.voucher as IntersolveVoucherEntity).id}`,
        ),
    );
    for (const batch of chunk(exportVouchersToCreate, batchSize)) {
      await imagecodeExportVoucherRepo.save(batch);
    }

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
  }

  /**
   * Set transaction manager for all factories
   */
  private setTransactionManager(_manager: any): void {
    // This would set the transaction manager for all factories
    // For now, we'll keep the simple implementation
  }

  /**
   * Reset data source for all factories
   */
  private resetDataSource(): void {
    // This would reset the data source for all factories
    // For now, we'll keep the simple implementation
  }
}
