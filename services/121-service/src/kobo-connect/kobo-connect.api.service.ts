import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class KoboConnectApiService {
  private apiUrl = process.env.KOBO_CONNECT_API_URL || '-';

  public constructor(private readonly httpService: CustomHttpService) {
    if (!this.apiUrl) {
      throw new HttpException(
        'Kobo-Connect API not configured. Set the KOBO_CONNECT_API_URL environment variable',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async create121Program(
    koboToken: string,
    koboAssetId: string,
  ): Promise<CreateProgramDto | any> {
    // See: https://kobo-connect.azurewebsites.net/docs#/default/create_121_program_from_kobo_121_program_get
    return await this.httpService
      .get(`${this.apiUrl}/121-program`, [
        {
          name: 'kobotoken',
          value: koboToken,
        },
        {
          name: 'koboasset',
          value: koboAssetId,
        },
      ])
      .then((response: any) => {
        if (
          response &&
          response.status === HttpStatus.OK &&
          response.data &&
          !response.data.detail
        ) {
          return response.data;
        }

        const errors = [];

        if (response && response.data && response.data.detail) {
          errors.push(response.data.detail);
        } else {
          errors.push(response.statusText);
        }

        throw new HttpException(
          {
            message: 'Kobo-Connect API did not return a valid response',
            errors,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  }
}
