import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchPopoverComponent } from './search-popover.component';

describe('SearchPopoverComponent', () => {
  let component: SearchPopoverComponent;
  let fixture: ComponentFixture<SearchPopoverComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SearchPopoverComponent],
    });
    fixture = TestBed.createComponent(SearchPopoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
