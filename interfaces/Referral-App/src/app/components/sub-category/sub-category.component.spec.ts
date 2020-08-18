import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import mockSubCategory from 'src/app/mocks/sub-category.mock';
import { SubCategoryComponent } from './sub-category.component';

describe('SubCategoryComponent', () => {
  let component: SubCategoryComponent;
  let fixture: ComponentFixture<SubCategoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SubCategoryComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubCategoryComponent);
    component = fixture.componentInstance;
    component.subCategory = mockSubCategory;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
