import { CustomerIndividualIntersolveApiDto } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/dtos/intersolve-api/customer-individual-intersolve-api.dto';
import { ErrorsInResponseIntersolveApi } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/dtos/intersolve-api/partials/error-in-response-intersolve-api';

export interface GetCustomerIndividualIntersolveApiDto {
  data: {
    success: boolean;
    errors?: ErrorsInResponseIntersolveApi[];
    data: CustomerIndividualIntersolveApiDto;
  };
  status: number;
  statusText: string;
}
