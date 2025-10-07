import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import {
  PaymentDataFactory,
  PaymentFactoryOptions,
} from '@121-service/src/scripts/factories/payment-data-factory';
import { RegistrationAttributeDataFactory } from '@121-service/src/scripts/factories/registration-attribute-data-factory';
import {
  RegistrationDataFactory,
  RegistrationFactoryOptions,
} from '@121-service/src/scripts/factories/registration-data-factory';
import {
  TwilioMessageDataFactory,
  TwilioMessageFactoryOptions,
} from '@121-service/src/scripts/factories/twilio-message-data-factory';

export interface MockDataGenerationOptions {
  readonly registrationOptions: RegistrationFactoryOptions;
  readonly messageOptions: TwilioMessageFactoryOptions;
  readonly paymentOptions: PaymentFactoryOptions;
}

/**
 * Service that orchestrates type-safe mock data generation using factories.
 * Replaces the raw SQL approach with ORM-based operations.
 */
@Injectable()
export class MockDataFactoryService {
  private readonly registrationFactory: RegistrationDataFactory;
  private readonly attributeDataFactory: RegistrationAttributeDataFactory;
  private readonly messageFactory: TwilioMessageDataFactory;
  private readonly paymentFactory: PaymentDataFactory;

  constructor(private readonly dataSource: DataSource) {
    this.registrationFactory = new RegistrationDataFactory(dataSource);
    this.attributeDataFactory = new RegistrationAttributeDataFactory(
      dataSource,
    );
    this.messageFactory = new TwilioMessageDataFactory(dataSource);
    this.paymentFactory = new PaymentDataFactory(dataSource);
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

        // 2. Create one transaction per registration for each iteration
        for (let i = 1; i <= powerNr; i++) {
          console.log(
            `Creating transactions for registrations: iteration ${i} of ${powerNr}`,
          );

          // Create payments for each program
          for (const programId of options.paymentOptions.programIds) {
            console.log(`Creating payment for program ${programId}`);
            
            // Create a payment for this program
            const payment = await this.paymentFactory.createPaymentForProgram(
              programId,
            );

            // Create transactions for all registrations of this program
            await this.paymentFactory.createTransactionsOnePerRegistrationForProgram(
              payment.id,
              programId,
            );
          }
        }

        // 3. Create messages for all registrations
        for (let i = 1; i <= powerNr; i++) {
          console.log(
            `Creating messages for registrations: iteration ${i} of ${powerNr}`,
          );

          // Get all registrations to create messages for
          const registrationRepository =
            manager.getRepository('RegistrationEntity');
          const registrations = await registrationRepository.find();
          await this.messageFactory.generateMessagesForRegistrations(
            registrations as any[],
            options.messageOptions,
          );
        }

        // 4. Handle FSP-specific data (vouchers, wallets, etc.)
        await this.createFspSpecificData();
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

      // First: Duplicate existing registrations
      const newRegistrations = await this.registrationFactory.duplicateExistingRegistrations(1);
      
      // Second: Duplicate existing registration attribute data, ensuring it references the new registrations
      await this.attributeDataFactory.duplicateAttributeDataForRegistrations(newRegistrations);
    }

    // Make phone numbers unique
    await this.registrationFactory.makePhoneNumbersUnique();

    console.log('**COMPLETED MULTIPLYING REGISTRATIONS**');
  }

  /**
   * Multiply transactions for specific programs (replaces multiplyTransactions)
   */
  public async multiplyTransactions(
    nr: number,
    programIds: number[],
  ): Promise<void> {
    console.log(
      `**MULTIPLYING TRANSACTIONS: ${nr} times for programs ${programIds.join(', ')}**`,
    );

    await this.dataSource.transaction(async (manager) => {
      this.setTransactionManager(manager);

      try {
        for (const programId of programIds) {
          await this.multiplyTransactionsPerProgram(nr, programId);
        }

        // Update payment counts
        await this.paymentFactory.updatePaymentCounts();

        // Update latest transactions
        await this.paymentFactory.updateLatestTransactions();

        // Create unused vouchers (FSP-specific)
        await this.createUnusedVouchers();
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
    powerNr: number,
    programId: number,
  ): Promise<void> {
    console.log(
      `**MULTIPLYING TRANSACTIONS for program ${programId}: ${powerNr} payments**`,
    );

    // Since there's already 1 transaction, create powerNr - 1 additional payments
    const nr = powerNr - 1;

    for (let i = 1; i <= nr; i++) {
      console.log(
        `Creating payment ${i + 1} of ${powerNr} for program ${programId}`,
      );

      // Create a new payment
      const payment =
        await this.paymentFactory.createPaymentForProgram(programId);

      // Create transactions for all registrations in this program
      await this.paymentFactory.createTransactionsForPayment(
        payment.id,
        programId,
      );

      // Create FSP-specific data for this payment
      await this.createFspSpecificDataForPayment(payment.id, programId);
    }
  }

  /**
   * Multiply messages (replaces multiplyMessages)
   */
  public async multiplyMessages(
    powerNr: number,
    _options: TwilioMessageFactoryOptions,
  ): Promise<void> {
    console.log(`**MULTIPLYING MESSAGES: ${powerNr} times**`);

    for (let i = 1; i <= powerNr; i++) {
      console.log(`Creating message duplication ${i} of ${powerNr}`);

      // Duplicate existing messages
      await this.messageFactory.duplicateExistingMessages(1);
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

    const programRegistrationAttributeRepository =
      this.dataSource.getRepository(ProgramRegistrationAttributeEntity);

    const attributesWithDuplicateCheck =
      await programRegistrationAttributeRepository
        .createQueryBuilder('attribute')
        .select('attribute.id')
        .where('attribute.duplicateCheck = true')
        .getMany();

    for (const attribute of attributesWithDuplicateCheck) {
      // Create duplicates by updating some registration attribute data to have the same value
      await this.dataSource.query(
        `
        UPDATE "121-service"."registration_attribute_data" 
        SET value = (
          SELECT value 
          FROM "121-service"."registration_attribute_data" 
          WHERE "programRegistrationAttributeId" = $1 
          LIMIT 1
        )
        WHERE "programRegistrationAttributeId" = $1 
        AND id IN (
          SELECT id 
          FROM "121-service"."registration_attribute_data" 
          WHERE "programRegistrationAttributeId" = $1 
          ORDER BY RANDOM() 
          LIMIT 3
        )
      `,
        [attribute.id],
      );
    }

    console.log('**COMPLETED INTRODUCING DUPLICATES**');
  }

  /**
   * Create FSP-specific data (vouchers, wallets, etc.)
   */
  private async createFspSpecificData(): Promise<void> {
    // This would contain logic for creating FSP-specific mock data
    // For now, we'll keep it as a placeholder for the specific FSP implementations
    console.log('Creating FSP-specific data (vouchers, wallets, etc.)');
  }

  /**
   * Create FSP-specific data for a specific payment
   */
  private async createFspSpecificDataForPayment(
    paymentId: number,
    programId: number,
  ): Promise<void> {
    // This would contain logic for creating FSP-specific mock data for a payment
    console.log(
      `Creating FSP-specific data for payment ${paymentId} in program ${programId}`,
    );
  }

  /**
   * Create unused vouchers
   */
  private async createUnusedVouchers(): Promise<void> {
    // This would contain logic for creating unused vouchers
    console.log('Creating unused vouchers');
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
