import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { ConfirmPromptComponent } from './confirm-prompt.component';

describe('ConfirmPromptComponent', () => {
  let component: ConfirmPromptComponent;
  let fixture: ComponentFixture<ConfirmPromptComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ConfirmPromptComponent,
      ],
      imports: [
        TranslateModule.forRoot(),
        IonicModule,
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
