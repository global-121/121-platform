import { Component, Input } from '@angular/core';
import { Category } from 'src/app/models/category.model';

@Component({
  selector: 'category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
})
export class CategoryComponent {
  @Input()
  category: Category;

  @Input()
  showDescription = false;

  constructor() {}
}
