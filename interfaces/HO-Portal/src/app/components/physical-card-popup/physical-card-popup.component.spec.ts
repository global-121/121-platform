import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhysicalCardPopupComponent } from './physical-card-popup.component';

describe('PhysicalCardPopupComponent', () => {
  let component: PhysicalCardPopupComponent;
  let fixture: ComponentFixture<PhysicalCardPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhysicalCardPopupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PhysicalCardPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
