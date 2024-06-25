import { ContactInformation } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/create-customer-request.dto';
import { ErrorsInResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/error-in-response.dto';

export class CreateCustomerResponseDto {
  public data: {
    success: boolean;
    errors: ErrorsInResponseDto[];
    code: string;
    correlationId: string;
    data: {
      id: string;
      externalReference: string;
      blocked: boolean;
      unblockable: boolean;
      createdAt: string;
      type?: string;
      organization?: CreateCustomerResponseOrganizationDto;
      individual?: CreateCustomerResponseIndividualDto;
      contactInfo?: ContactInformation;
    };
  };
  public status: number;
  public statusText: string;
}

class CreateCustomerResponseOrganizationDto {
  public name: string;
  public registrationNumber: string;
  public vatNumber: string;
  public registrationCountry: string;
  public activityDescription: string;
  public website: string;
  public extensions: CreateCustomerResponseExtensionDto[];
}

class CreateCustomerResponseIndividualDto {
  public firstName: string;
  public lastName: string;
  public middleName: string;
  public initials: string;
}

export class CreateCustomerResponseExtensionDto {
  public type: string;
  public value: string | null;
}

export class IntersolveLinkWalletCustomerResponseDto {
  public data: {
    success?: boolean;
    errors?: ErrorsInResponseDto[];
    code?: string;
  };
  public status: number;
  public statusText: string;
}
