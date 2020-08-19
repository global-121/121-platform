import { TranslatableString } from './translatable-string.model';

export class Offer {
  offerID: number;
  offerName: TranslatableString | string;
  offerIcon: string;
  offerDescription: TranslatableString | string;
  offerLink?: string;
  offerImage: string;
  subCategoryID: number;
  categoryID: number;
}
