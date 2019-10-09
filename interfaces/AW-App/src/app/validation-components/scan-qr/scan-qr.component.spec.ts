import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanQrComponent } from './scan-qr.component';
import { TranslateModule } from '@ngx-translate/core';

describe('ScanQrComponent', () => {
  let component: ScanQrComponent;
  let fixture: ComponentFixture<ScanQrComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ScanQrComponent],
      imports: [
        TranslateModule.forRoot()
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScanQrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
