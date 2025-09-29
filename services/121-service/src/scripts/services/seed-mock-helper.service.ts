import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus } from '@nestjs/common';
import fs from 'fs';
import path from 'path';

import { AppDataSource } from '@121-service/src/appdatasource';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';

const readSqlFile = (filepath: string): string => {
  return fs
    .readFileSync(path.join(__dirname, filepath))
    .toString()
    .replace(/\r?\n|\r/g, ' ');
};
export class SeedMockHelperService {
  private httpService = new CustomHttpService(new HttpService());
  private axiosCallsService = new AxiosCallsService();
  private dataSource = AppDataSource;

  public async validateParametersForDataDuplication({
    powerNrRegistrationsString,
    nrPaymentsString,
    powerNrMessagesString,
  }: {
    powerNrRegistrationsString?: string;
    nrPaymentsString?: string;
    powerNrMessagesString?: string;
  }): Promise<{
    powerNrRegistrations: number;
    nrPayments: number;
    powerNrMessages: number;
  }> {
    const powerNrRegistrations = Number(powerNrRegistrationsString) || 2;
    const nrPayments = Number(nrPaymentsString) || 2;
    const powerNrMessages = Number(powerNrMessagesString) || 1;

    const min = 1;
    const maxPowerNrRegistrations = 17;
    const maxPowerNrMessages = 6;
    const maxNrPayments = 30;

    if (
      isNaN(powerNrRegistrations) ||
      powerNrRegistrations < min ||
      powerNrRegistrations > maxPowerNrRegistrations
    ) {
      throw new HttpException(
        `mockPowerNumberRegistrations must be a number between ${min} and ${maxPowerNrRegistrations}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (isNaN(nrPayments) || nrPayments < min || nrPayments > maxNrPayments) {
      throw new HttpException(
        `nrPayments must be a number between ${min} and ${maxNrPayments}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      isNaN(powerNrMessages) ||
      powerNrMessages < min ||
      powerNrMessages > maxPowerNrMessages
    ) {
      throw new HttpException(
        `squareNumberBulkMessage must be a number between ${min} and ${maxPowerNrMessages}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return { powerNrRegistrations, nrPayments, powerNrMessages };
  }

  public async multiplyRegistrations(powerNr: number): Promise<void> {
    const queryRegistrations = readSqlFile(
      '../../../src/scripts/sql/mock-registrations.sql',
    );
    for (let i = 1; i <= powerNr; i++) {
      console.log(
        `**CREATING MOCK DATA registrations: duplication ${i} of ${powerNr} **`,
      );
      await this.dataSource.query(queryRegistrations);
    }
    const queryRegistrationData = readSqlFile(
      '../../../src/scripts/sql/mock-registration-data.sql',
    );
    for (let i = 1; i <= powerNr; i++) {
      console.log(
        `**CREATING MOCK DATA registration data: duplication ${i} of ${powerNr} **`,
      );
      await this.dataSource.query(queryRegistrationData);
    }

    const queryPhoneUnique = readSqlFile(
      '../../../src/scripts/sql/mock-make-phone-unique.sql',
    );
    console.log(`**CREATING MOCK DATA making phoneNr unique**`);
    await this.dataSource.query(queryPhoneUnique);
  }

  public async multiplyRegistrationsAndRelatedPaymentData(
    powerNr: number,
  ): Promise<void> {
    await this.multiplyRegistrations(powerNr);
    const queryTransactionsOnePerRegistration = readSqlFile(
      '../../../src/scripts/sql/mock-transactions-one-per-registration.sql',
    );
    for (let i = 1; i <= powerNr; i++) {
      console.log(
        `**CREATING MOCK DATA match transactions to registrations: duplication ${i} of ${powerNr}**`,
      );
      await this.dataSource.query(queryTransactionsOnePerRegistration);
    }

    const queryMessagesOnePerRegistration = readSqlFile(
      '../../../src/scripts/sql/mock-messages-one-per-registration.sql',
    );
    for (let i = 1; i <= powerNr; i++) {
      console.log(
        `**CREATING MOCK DATA match messages to registrations: duplication ${i} of ${powerNr}**`,
      );
      await this.dataSource.query(queryMessagesOnePerRegistration);
    }

    const queryAllVisaCustomers = readSqlFile(
      '../../../src/scripts/sql/mock-visa-customers.sql',
    );
    console.log(`**CREATING MOCK DATA match Visa customers to registrations**`);
    await this.dataSource.query(queryAllVisaCustomers);

    const queryAllVisaParentWallets = readSqlFile(
      '../../../src/scripts/sql/mock-visa-parent-wallets.sql',
    );
    console.log(
      `**CREATING MOCK DATA match Visa parent wallets to registrations**`,
    );
    await this.dataSource.query(queryAllVisaParentWallets);

    const queryAllVisaChildWallets = readSqlFile(
      '../../../src/scripts/sql/mock-visa-child-wallets.sql',
    );
    console.log(
      `**CREATING MOCK DATA match Visa child wallets to registrations**`,
    );
    await this.dataSource.query(queryAllVisaChildWallets);

    const queryDuplicateVouchers = readSqlFile(
      '../../../src/scripts/sql/mock-intersolve-voucher.sql',
    );
    for (let i = 1; i <= powerNr; i++) {
      console.log(
        `**CREATING MOCK DATA match AH vouchers registrations: duplication ${i} of ${powerNr}**`,
      );
      await this.dataSource.query(queryDuplicateVouchers);
    }

    const queryDuplicateImageCodeExportVoucher = readSqlFile(
      '../../../src/scripts/sql/mock-imagecode-export-vouchers.sql',
    );
    for (let i = 1; i <= powerNr; i++) {
      console.log(
        `**CREATING MOCK DATA match imagecode export vouchers to registrations: duplication ${i} of ${powerNr}**`,
      );
      await this.dataSource.query(queryDuplicateImageCodeExportVoucher);
    }

    console.log(`**Updating voucher attributes**`);
    const queryUpdateVoucherAttributes = readSqlFile(
      '../../../src/scripts/sql/mock-intersolve-voucher-attributes.sql',
    );
    await this.dataSource.query(queryUpdateVoucherAttributes);
    console.log(`**Done updating voucher attributes**`);
  }

  public async multiplyTransactions(
    nr: number,
    programIds: number[],
  ): Promise<void> {
    for (const programId of programIds) {
      await this.multiplyTransactionsPerProgram(nr, programId);
    }

    console.log(`**Updating payment count**`);
    const queryUpdatePaymentCount = readSqlFile(
      '../../../src/scripts/sql/mock-update-payment-count.sql',
    );
    await this.dataSource.query(queryUpdatePaymentCount);

    console.log(`**Updating latest transactions. This can take a minute..** `);
    await this.dataSource.query(
      `truncate table "121-service"."latest_transaction"`,
    );
    const queryUpdateLatestTransaction = readSqlFile(
      '../../../src/scripts/sql/mock-latest-transactions.sql',
    );
    await this.dataSource.query(queryUpdateLatestTransaction);
    console.log(`**Done updating latest transactions**`);

    const queryUnusedVouchers = readSqlFile(
      '../../../src/scripts/sql/mock-unused-vouchers.sql',
    );
    console.log(`**CREATING MOCK DATA unused vouchers**`);
    await this.dataSource.query(queryUnusedVouchers);
  }

  public async multiplyTransactionsPerProgram(
    powerNr: number,
    programId: number,
  ): Promise<void> {
    // Since there already is 1 transaction
    const nr = powerNr - 1;
    const getMaxPaymentIdQuery = readSqlFile(
      '../../../src/scripts/sql/mock-get-max-payment-id.sql',
    );

    const createPaymentQuery = readSqlFile(
      '../../../src/scripts/sql/mock-create-payment.sql',
    );
    const queryTransactions = readSqlFile(
      '../../../src/scripts/sql/mock-payment-transactions.sql',
    );
    const queryVoucherPerPayment = readSqlFile(
      '../../../src/scripts/sql/mock-intersolve-voucher-per-payment.sql',
    );
    const queryImageCodeExportVoucherPerPayment = readSqlFile(
      '../../../src/scripts/sql/mock-imagecode-export-vouchers-per-payment.sql',
    );

    for (let i = 1; i <= nr; i++) {
      const maxPaymentId = await this.dataSource.query(getMaxPaymentIdQuery);
      const newPaymentId = maxPaymentId[0].id + 1;

      await this.dataSource.query(createPaymentQuery, [
        newPaymentId,
        programId,
      ]);

      console.log(
        `**CREATING MOCK DATA programId ${programId} transactions payment ${i + 1} of ${
          nr + 1
        } payments**`,
      );
      await this.dataSource.query(queryTransactions, [newPaymentId, programId]);
      console.log(
        `**CREATING MOCK DATA programId ${programId} vouchers payment ${i + 1} of ${
          nr + 1
        } payments**`,
      );
      await this.dataSource.query(queryVoucherPerPayment, [
        newPaymentId,
        programId,
      ]);
      console.log(
        `**CREATING MOCK DATA programId ${programId} imagecode payment ${i + 1} of ${
          nr + 1
        } payments**`,
      );
      await this.dataSource.query(queryImageCodeExportVoucherPerPayment);
    }
  }

  public async multiplyMessages(powerNr: number): Promise<void> {
    const queryNrMessageBulk = readSqlFile(
      '../../../src/scripts/sql/mock-messages.sql',
    );
    for (let i = 1; i <= powerNr; i++) {
      console.log(
        `**CREATING MOCK DATA messages: duplication ${i} of ${powerNr}**`,
      );
      await this.dataSource.query(queryNrMessageBulk);
    }

    console.log(`**Updating latest messages. This can take a minute..** `);
    await this.dataSource.query(
      `truncate table "121-service"."latest_message"`,
    );
    const queryUpdateLatestMessage = readSqlFile(
      '../../../src/scripts/sql/mock-latest-message.sql',
    );
    await this.dataSource.query(queryUpdateLatestMessage);
    console.log(`**Done updating latest message**`);
  }

  public async updateSequenceNumbers(): Promise<void> {
    console.log('**Updating sequence numbers.**');
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
        // this sequences is created with an abbreviated name automatically, so this exception is needed here
        if (tableName === 'program_fsp_configuration_property') {
          sequenceName = 'program_financial_service_pro_id_seq';
        }

        const maxIdQuery = `SELECT MAX(id) FROM "121-service"."${tableName}"`;

        const maxIdResult = await this.dataSource.query(maxIdQuery);
        const maxId = maxIdResult[0].max;
        if (maxId && maxId > 0) {
          const nextId = maxId + 1;
          const updateSequenceQuery = `SELECT setval('121-service.${sequenceName}', ${nextId}) from "121-service"."${tableName}"`;
          await this.dataSource.query(updateSequenceQuery);
        }
      }
    }
    console.log('**Done updating sequence numbers.**');
  }

  public async introduceDuplicates(): Promise<void> {
    console.log('**Introducing duplicates **');
    const selectProgramRegistrationAttributesWithDuplicateCheck =
      await this.dataSource.manager
        .getRepository(ProgramRegistrationAttributeEntity)
        .createQueryBuilder('program_registration_attribute')
        .select('id')
        .where('"duplicateCheck" = true')
        .getRawMany();

    for (const {
      id,
    } of selectProgramRegistrationAttributesWithDuplicateCheck) {
      const queryIntroduceDuplicates = readSqlFile(
        '../../../src/scripts/sql/mock-introduce-duplicates.sql',
      );
      // TODO: Could not get proper parameter to work here so resorted to string replace
      const qWithParam = queryIntroduceDuplicates.replace('$1', id);
      await this.dataSource.query(qWithParam);
    }
    console.log('**Done introducing duplicates**');
  }

  public async importRegistrations(
    programId: number,
    registrations: object[],
    accessToken: string,
  ): Promise<any> {
    const url = `${this.axiosCallsService.getBaseUrl()}/programs/${programId}/registrations`;
    const body = registrations;
    const headers = this.axiosCallsService.accessTokenToHeaders(accessToken);

    return await this.httpService.post(url, body, headers);
  }

  public async awaitChangePaStatus(
    programId: number,
    referenceIds: string[],
    status: RegistrationStatusEnum,
    accessToken: string,
    filter: Record<string, string> = {},
  ): Promise<any> {
    let queryParams = '';
    if (referenceIds) {
      queryParams += `filter.referenceId=$in:${referenceIds.join(',')}&`;
    }
    if (filter) {
      for (const [key, value] of Object.entries(filter)) {
        queryParams += `${key}=${value}&`;
      }
    }

    const url = `${this.axiosCallsService.getBaseUrl()}/programs/${programId}/registrations/status?${queryParams.slice(
      0,
      -1,
    )}`;
    const headers = this.axiosCallsService.accessTokenToHeaders(accessToken);
    const body = {
      status,
      message: null,
    };

    const result = await this.httpService.patch(url, body, headers);
    await this.waitForStatusChangeToComplete(
      programId,
      referenceIds.length,
      status,
      8000,
      accessToken,
    );

    return result;
  }

  public async waitForStatusChangeToComplete(
    programId: number,
    amountOfRegistrations: number,
    status: string,
    maxWaitTimeMs: number,
    accessToken: string,
  ): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitTimeMs) {
      // Get payment transactions
      const paginatedRegistrations = await this.getRegistrations(
        programId,
        ['status'],
        accessToken,
        1,
        undefined,
        {
          'filter.status': `$in:${status}`,
        },
      );
      // If not all transactions are successful, wait for a short interval before checking again
      if (
        paginatedRegistrations &&
        paginatedRegistrations.data &&
        paginatedRegistrations.data.data.length >= amountOfRegistrations
      ) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  public async getRegistrations(
    programId: number,
    attributes: string[],
    accessToken: string,
    page?: number,
    limit?: number,
    filter: Record<string, string> = {},
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    attributes.forEach((attr) => queryParams.append('select', attr));
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());
    Object.keys(filter).forEach((key) => queryParams.append(key, filter[key]));

    const url = `${this.axiosCallsService.getBaseUrl()}/programs/${programId}/registrations?${queryParams}`;
    const headers = this.axiosCallsService.accessTokenToHeaders(accessToken);

    return await this.httpService.get(url, headers);
  }

  public async doPayment(
    programId: number,
    amount: number,
    referenceIds: string[],
    accessToken: string,
    filter: Record<string, string> = {},
  ): Promise<any> {
    let queryParams = '';
    if (filter) {
      for (const [key, value] of Object.entries(filter)) {
        queryParams += `${key}=${value}&`;
      }
    }

    if (referenceIds && referenceIds.length > 0) {
      queryParams += `filter.referenceId=$in:${referenceIds.join(',')}&`;
    }

    const url = `${this.axiosCallsService.getBaseUrl()}/programs/${programId}/payments?${queryParams.slice(
      0,
      -1,
    )}`;
    const headers = this.axiosCallsService.accessTokenToHeaders(accessToken);
    const body = {
      amount,
    };

    return await this.httpService.post(url, body, headers);
  }
}
