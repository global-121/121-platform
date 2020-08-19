import { TranslatableString } from './translatable-string.model';

export class Category {
  categoryID: number;
  categoryName: TranslatableString | string;
  categoryIcon: string;
  categoryDescription?: TranslatableString | string;
}
