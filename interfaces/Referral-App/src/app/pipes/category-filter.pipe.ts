import { Pipe, PipeTransform } from '@angular/core';
import { Category } from 'src/app/models/category.model';
import { Offer } from 'src/app/models/offer.model';
import { SubCategory } from 'src/app/models/sub-category.model';

@Pipe({
  name: 'categoryFilter',
})
export class CategoryFilterPipe implements PipeTransform {
  transform(items: Array<SubCategory | Offer>, category: Category): any {
    if (!items || !category) {
      return items;
    }
    return items.filter((item) => item.categoryID === category.categoryID);
  }
}
