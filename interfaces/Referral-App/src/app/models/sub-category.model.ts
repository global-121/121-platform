import { TranslatableString } from './translatable-string.model';

export class SubCategory {
  subCategoryID: number;
  subCategoryName: TranslatableString | string;
  subCategoryIcon: string;
  subCategoryDescription?: TranslatableString | string;
  categoryID: number;
}
