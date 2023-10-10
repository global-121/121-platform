import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { SuccessPopupComponent } from './success-popup.component';

describe('SuccessPopupComponent', () => {
  let component: SuccessPopupComponent;
  let fixture: ComponentFixture<SuccessPopupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        SuccessPopupComponent,
        TranslateModule.forRoot(),
        CommonModule,
        IonicModule,
        SharedModule,
        FormsModule,
      ],
    });
    fixture = TestBed.createComponent(SuccessPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
