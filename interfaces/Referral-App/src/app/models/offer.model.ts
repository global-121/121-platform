import { TranslatableString } from './translatable-string.model';

export class Offer {
  offerID: number;
  offerName: TranslatableString | string;
  offerIcon: string;
  offerDescription: TranslatableString | string;
  offerLink?: string;
  offerImage: string;
  offerNumber?: string;
  offerEmail?: string;
  offerAddress?: string;
  offerOpeningHoursWeekdays?: string;
  offerOpeningHoursWeekends?: string;
  offerForWhom?: string;
  offerCapacity?: string;
  offerVisible: boolean;
  subCategoryID: number;
  categoryID: number;
}
