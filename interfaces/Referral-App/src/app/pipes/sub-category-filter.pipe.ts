import { Pipe, PipeTransform } from '@angular/core';
import { Offer } from 'src/app/models/offer.model';
import { SubCategory } from 'src/app/models/sub-category.model';

@Pipe({
  name: 'subCategoryFilter',
})
export class SubCategoryFilterPipe implements PipeTransform {
  transform(items: Array<Offer>, subCategory: SubCategory): any {
    if (!items || !subCategory) {
      return items;
    }
    return items.filter(
      (item) => item.subCategoryID === subCategory.subCategoryID,
    );
  }
}
