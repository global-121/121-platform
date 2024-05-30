import { IsNotEmpty } from 'class-validator';

export class IntersolveVisaDoTransferOrIssueCardReturnDto {
  @IsNotEmpty()
  cardCreated: boolean;

  // TODO: TBD which other data needs to be returned
}
