import { Injectable, HttpService } from '@nestjs/common';
import { AfricasTalkingValidationDto } from './dto/africas-talking-validation.dto';

@Injectable()
export class FspService {
  public constructor(private readonly httpService: HttpService) {}

  public async africasTalkingValidation(
    africasTalkingValidationData: AfricasTalkingValidationDto,
  ): Promise<any> {
    console.log(africasTalkingValidationData);
    return {
      status: 'Validated', // or "Failed"
    };
  }
}
