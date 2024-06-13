import {
  FinancialServiceProviderConfigurationEnum,
  FinancialServiceProviderName,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import {
  IntersolveBlockWalletDto,
  IntersolveBlockWalletResponseDto,
  UnblockReasonEnum,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-block.dto';
import { IntersolveCreateWalletResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-wallet-response.dto';
import { IntersolveCreateWalletDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-wallet.dto';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisaCustomerEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-customer.entity';
import { IntersolveVisaParentWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-parent-wallet.entity';
import {
  IntersolveVisaWalletEntity,
  IntersolveVisaWalletStatus,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-wallet.entity';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { Injectable } from '@nestjs/common';
import { Issuer, TokenSet } from 'openid-client';
import { DataSource, QueryRunner } from 'typeorm';
import { v4 as uuid } from 'uuid';

const intersolveVisaApiUrl = process.env.MOCK_INTERSOLVE
  ? `${process.env.MOCK_SERVICE_URL}api/fsp/intersolve-visa`
  : process.env.INTERSOLVE_VISA_API_URL;

interface VisaCustomerWithReferenceId extends IntersolveVisaCustomerEntity {
  referenceId: string;
}

@Injectable()
export class MigrateVisaService {
  constructor(
    private readonly httpService: CustomHttpService,
    private readonly dataSource: DataSource,
  ) {}
  name = 'VisaMigrateChildParentWallet1717505534921';
  public tokenSet: TokenSet;

  public async migrateData(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    // await this.DELETE_THIS_FUNCTION_FOR_TESTING_ONLY_CLEAR_DATA(queryRunner);
    const programIds =
      await this.selectProgramIdsForInstanceWithVisa(queryRunner);
    for (const programId of programIds) {
      await this.migrateProgramData(queryRunner, programId);
    }
  }

  private async DELETE_THIS_FUNCTION_FOR_TESTING_ONLY_CLEAR_DATA(
    q: QueryRunner,
  ): Promise<void> {
    // truncate
    await q.query(
      `TRUNCATE TABLE "121-service"."intersolve_visa_parent_wallet" CASCADE`,
    );
    await q.query(
      `TRUNCATE TABLE "121-service"."intersolve_visa_child_wallet" CASCADE`,
    );
  }

  private async migrateProgramData(
    queryRunner: QueryRunner,
    programId: number,
  ): Promise<void> {
    console.time(`Migrating program ${programId}`);
    const brandCode = await this.getBrandcodeForProgram(queryRunner, programId);
    const visaCustomers = await this.selectVisaCustomers(
      programId,
      queryRunner,
    );
    for (const visaCustomer of visaCustomers) {
      await this.migrateCustomerAndWalletData(
        visaCustomer,
        brandCode,
        queryRunner,
      );
    }
    console.timeEnd(`Migrating program ${programId}`);
  }

  private async migrateCustomerAndWalletData(
    visaCustomer: VisaCustomerWithReferenceId,
    brandCode: string,
    queryRunner: QueryRunner,
  ): Promise<void> {
    const originalWalletsOfCustomer = await this.selectOriginalWallets(
      visaCustomer,
      queryRunner,
    );

    if (originalWalletsOfCustomer.length > 0) {
      // create parent wallet
      const newestOriginalWallet = originalWalletsOfCustomer[0];
      const parentWallet = await this.createParentWallet(
        visaCustomer,
        newestOriginalWallet,
        brandCode,
        queryRunner,
      );

      // migrate & link child wallets
      await this.migrateAndLinkChildWallets(
        originalWalletsOfCustomer,
        parentWallet,
        queryRunner,
      );
    }
  }

  private async createParentWallet(
    visaCustomer: VisaCustomerWithReferenceId,
    newestOriginalWallet: IntersolveVisaWalletEntity,
    brandCode: string,
    queryRunner: QueryRunner,
  ): Promise<IntersolveVisaParentWalletEntity> {
    const createWalletReponse = await this.postCreateActiveWallet(
      {
        reference: uuid(),
        activate: true,
        quantities: [],
      },
      brandCode,
    );
    if (!createWalletReponse?.data?.success) {
      console.log(
        '🚀 ~ MigrateVisaService ~ createWalletReponse.data.errors:',
        createWalletReponse?.data?.errors,
      );
      throw new Error(
        `Failed to create wallet for customer ${visaCustomer.id}, referenceId ${visaCustomer.referenceId}`,
      );
    }
    const tokenCode = createWalletReponse.data?.data?.token?.code;
    const linkToCustomerReponse = await this.postLinkCustomerToWallet(
      {
        holderId: visaCustomer.holderId,
      },
      tokenCode,
    );

    if (!this.isSuccessResponseStatus(linkToCustomerReponse.status)) {
      console.log(
        '🚀 ~ MigrateVisaService ~ linkToCustomerReponse.data.errors:',
        linkToCustomerReponse?.data?.errors,
      );
      throw new Error(
        `Failed to link wallet to customer ${visaCustomer.id}, referenceId ${visaCustomer.referenceId}`,
      );
    }

    const newParentWallet = new IntersolveVisaParentWalletEntity();
    newParentWallet.intersolveVisaCustomerId = visaCustomer.id;
    newParentWallet.tokenCode = tokenCode;
    newParentWallet.balance = newestOriginalWallet.balance
      ? newestOriginalWallet.balance
      : 0; // Deals with the factor that the old balance was nullable
    newParentWallet.lastExternalUpdate = newestOriginalWallet.lastExternalUpdate
      ? newestOriginalWallet.lastExternalUpdate
      : new Date(); // TODO: Look at this again this is a work around because lastExternalUpdate is not nullable in the database
    newParentWallet.spentThisMonth = newestOriginalWallet.spentThisMonth;
    newParentWallet.isLinkedToVisaCustomer = true;
    return await queryRunner.manager.save(newParentWallet);
  }

  private async migrateAndLinkChildWallets(
    originalWallets: IntersolveVisaWalletEntity[],
    parentWallet: IntersolveVisaParentWalletEntity,
    queryRunner: QueryRunner,
  ): Promise<void> {
    for (const originalWallet of originalWallets) {
      const childWallet = new IntersolveVisaChildWalletEntity();
      childWallet.intersolveVisaParentWalletId = parentWallet.id;
      childWallet.tokenCode = originalWallet.tokenCode!; // We assume that tokencode is never null in the old data
      childWallet.isLinkedToParentWallet = false;
      childWallet.isTokenBlocked = originalWallet.tokenBlocked ? true : false; // Deals with the factor that the old isTokenBlocked was nullable
      childWallet.isDebitCardCreated = originalWallet.debitCardCreated;
      childWallet.walletStatus = originalWallet.walletStatus
        ? originalWallet.walletStatus
        : IntersolveVisaWalletStatus.Active; // Deals with the factor that the old walletStatus was nullable
      childWallet.cardStatus = originalWallet.cardStatus;
      childWallet.lastUsedDate = originalWallet.lastUsedDate;
      childWallet.lastExternalUpdate = originalWallet.lastExternalUpdate;
      const savedChildWallet = await queryRunner.manager.save(childWallet);

      await this.postToggleBlockWallet(
        originalWallet.tokenCode,
        {
          reasonCode: UnblockReasonEnum.UNBLOCK_GENERAL,
        },
        false,
      );
      const postLinkTokenResult = await this.postLinkToken(
        savedChildWallet.tokenCode,
        parentWallet.tokenCode,
      );
      if (!this.isSuccessResponseStatus(postLinkTokenResult.status)) {
        throw new Error(
          `Failed to link child wallet ${childWallet.id} to parent wallet ${parentWallet.id}`,
        );
      } else {
        savedChildWallet.isLinkedToParentWallet = true;
        await queryRunner.manager.save(savedChildWallet);
      }

      // Block wallet again if original wallet was blocked
      if (originalWallet.tokenBlocked) {
        await this.postToggleBlockWallet(
          originalWallet.tokenCode,
          {
            reasonCode: UnblockReasonEnum.UNBLOCK_GENERAL,
          },
          true,
        );
      }
    }
  }

  ////////////////////////////////////////////////////////////////////////////////
  //////////////////////////// QUERY HELPER FUNCTIONS ////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  private async getBrandcodeForProgram(
    queryRunner: QueryRunner,
    programId: number,
  ): Promise<string> {
    const brandCodeConfig = await queryRunner.query(
      `
      SELECT *
      FROM "121-service"."program_fsp_configuration" pfc
      INNER JOIN "121-service"."financial_service_provider" f ON pfc."fspId" = f."id"
      WHERE pfc."programId" = $1
      AND pfc."name" = $2
      AND f."fsp" = $3
    `,
      [
        programId,
        FinancialServiceProviderConfigurationEnum.brandCode,
        FinancialServiceProviderName.intersolveVisa,
      ],
    );

    if (!brandCodeConfig || brandCodeConfig.length === 0) {
      throw new Error(
        `No brandCode found for program ${programId}. Please update the program FSP cofinguration.`,
      );
    }
    return brandCodeConfig[0]?.value as string;
  }

  private async selectProgramIdsForInstanceWithVisa(
    queryRunner: QueryRunner,
  ): Promise<number[]> {
    // if intersolve_visa is not enabled, return empty array
    if (!process.env.INTERSOLVE_VISA_API_URL) {
      return [];
    }
    const queryResult = await queryRunner.query(
      `SELECT id FROM "121-service"."program"`,
    );
    return queryResult.map((row: { id: number }) => row.id);
  }

  private async selectVisaCustomers(
    programId: number,
    queryRunner: QueryRunner,
  ): Promise<VisaCustomerWithReferenceId[]> {
    return queryRunner.query(
      `select
        i.*,
        r."referenceId"
      from
        "121-service"."intersolve_visa_customer" i
      left join "121-service".registration r on
        r.id = i."registrationId" WHERE "programId" = ${programId}`,
    );
  }

  private async selectOriginalWallets(
    visaCustomer: VisaCustomerWithReferenceId,
    queryRunner: QueryRunner,
  ): Promise<any[]> {
    return queryRunner.query(
      `SELECT * FROM "121-service"."intersolve_visa_wallet" WHERE "intersolveVisaCustomerId" = ${visaCustomer.id} order by "created" desc`,
    );
  }

  ////////////////////////////////////////////////////////////////////////////////
  //////////////////////////// HTTPS HELPER FUNCTIONS ////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  public async getAuthenticationToken() {
    if (process.env.MOCK_INTERSOLVE) {
      return 'mocked-token';
    }
    if (this.isTokenValid(this.tokenSet)) {
      // Return cached token
      return this.tokenSet.access_token;
    }
    // If not valid, request new token
    const trustIssuer = await Issuer.discover(
      `${process.env.INTERSOLVE_VISA_OIDC_ISSUER}/.well-known/openid-configuration`,
    );
    const client = new trustIssuer.Client({
      client_id: process.env.INTERSOLVE_VISA_CLIENT_ID!,
      client_secret: process.env.INTERSOLVE_VISA_CLIENT_SECRET!,
    });
    const tokenSet = await client.grant({
      grant_type: 'client_credentials',
    });
    // Cache tokenSet
    this.tokenSet = tokenSet;
    return tokenSet.access_token;
  }

  private isTokenValid(
    tokenSet: TokenSet,
  ): tokenSet is TokenSet & Required<Pick<TokenSet, 'access_token'>> {
    if (!tokenSet || !tokenSet.expires_at) {
      return false;
    }
    // Convert expires_at to milliseconds
    const expiresAtInMs = tokenSet.expires_at * 1000;
    const timeLeftBeforeExpire = expiresAtInMs - Date.now();
    // If more than 1 minute left before expiration, the token is considered valid
    return timeLeftBeforeExpire > 60000;
  }

  public async postCreateActiveWallet(
    payload: IntersolveCreateWalletDto,
    brandCode: string,
  ): Promise<IntersolveCreateWalletResponseDto> {
    const authToken = await this.getAuthenticationToken();

    const apiPath = process.env.INTERSOLVE_VISA_PROD
      ? 'pointofsale-payments'
      : 'pointofsale';
    const url = `${intersolveVisaApiUrl}/${apiPath}/v1/brand-types/${brandCode}/issue-token?includeBalances=true`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    return await this.httpService.post<IntersolveCreateWalletResponseDto>(
      url,
      payload,
      headers,
    );
  }

  public async postLinkCustomerToWallet(
    payload: {
      holderId: string | null;
    },
    tokenCode: string | null,
  ): Promise<any> {
    const authToken = await this.getAuthenticationToken();
    const apiPath = process.env.INTERSOLVE_VISA_PROD
      ? 'wallet-payments'
      : 'wallet';
    const url = `${intersolveVisaApiUrl}/${apiPath}/v1/tokens/${tokenCode}/register-holder`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    // On success this returns a 204 No Content
    return await this.httpService.post<any>(url, payload, headers);
  }

  private isSuccessResponseStatus(status: number): boolean {
    return status >= 200 && status < 300;
  }

  public async postToggleBlockWallet(
    tokenCode: string | null,
    payload: IntersolveBlockWalletDto,
    block: boolean,
  ): Promise<IntersolveBlockWalletResponseDto> {
    const authToken = await this.getAuthenticationToken();
    const apiPath = process.env.INTERSOLVE_VISA_PROD
      ? 'pointofsale-payments'
      : 'pointofsale';
    const url = `${intersolveVisaApiUrl}/${apiPath}/v1/tokens/${tokenCode}/${
      block ? 'block' : 'unblock'
    }`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    const blockResult = await this.httpService.post<any>(url, payload, headers);
    const result: IntersolveBlockWalletResponseDto = {
      status: blockResult.status,
      statusText: blockResult.statusText,
      data: blockResult.data,
    };
    return result;
  }

  public async postLinkToken(
    childTokenCode: string | null,
    parentTokenCode: string | null,
  ): Promise<IntersolveBlockWalletResponseDto> {
    const authToken = await this.getAuthenticationToken();
    const apiPath = process.env.INTERSOLVE_VISA_PROD
      ? 'wallet-payments'
      : 'wallet';
    const url = `${intersolveVisaApiUrl}/${apiPath}/v1/tokens/${parentTokenCode}/link-token`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    const payload = {
      tokenCode: childTokenCode,
    };
    const linkResult = await this.httpService.post<any>(url, payload, headers);
    return linkResult;
  }
}
