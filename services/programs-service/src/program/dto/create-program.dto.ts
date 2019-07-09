import { CreateCriteriumDto } from './../../criterium/dto/create-criterium.dto';
import { ApiModelProperty } from '@nestjs/swagger';

export class CreateProgramDto {
  @ApiModelProperty()
  public readonly location: string;
  @ApiModelProperty()
  public readonly title: string;
  @ApiModelProperty()
  public readonly startDate: Date;
  @ApiModelProperty()
  public readonly endDate: Date;
  @ApiModelProperty()
  public readonly currency: string;
  @ApiModelProperty()
  public readonly distributionFrequency: string;
  @ApiModelProperty()
  public readonly distributionChannel: string;
  @ApiModelProperty()
  public readonly notifiyPaArea: boolean;
  @ApiModelProperty()
  public readonly notificationType: string;
  @ApiModelProperty()
  public readonly cashDistributionSites: JSON;
  @ApiModelProperty()
  public readonly financialServiceProviders: JSON;
  @ApiModelProperty()
  public readonly inclusionCalculationType: string;
  @ApiModelProperty()
  public readonly customCriteria: CreateCriteriumDto[];
  @ApiModelProperty()
  public readonly minimumScore: number;
  @ApiModelProperty()
  public readonly description: string;
  @ApiModelProperty({ example: 1 })
  public readonly countryId: number;
}
