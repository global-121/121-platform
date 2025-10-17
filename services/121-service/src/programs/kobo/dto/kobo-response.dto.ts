import { ApiProperty } from '@nestjs/swagger';

export class KoboResponseDto {
  @ApiProperty({
    example: 'aRNFGgGhzCcK7kEJAW8tEs',
    description: 'Kobo asset ID',
  })
  assetId: string;

  @ApiProperty({
    example: 'https://kobo.humanitarianresponse.info',
    description: 'Base URL of the Kobo server',
  })
  url: string;

  @ApiProperty({
    example: 'vWpnMN2XnD9SuAVCQqHPxj',
    description: 'Version identifier of the Kobo form',
  })
  versionId: string;

  @ApiProperty({
    example: '2023-05-12T14:30:00.000Z',
    description: 'Date when the Kobo form was deployed',
    type: Date,
  })
  dateDeployed: Date;
}
