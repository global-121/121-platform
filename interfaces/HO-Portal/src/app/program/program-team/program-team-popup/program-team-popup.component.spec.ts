import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ProgramTeamPopupComponent } from './program-team-popup.component';
import { SharedModule } from '../../../shared/shared.module';

describe('ProgramTeamPopupComponent', () => {
  let component: ProgramTeamPopupComponent;
  let fixture: ComponentFixture<ProgramTeamPopupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ProgramTeamPopupComponent,
        HttpClientTestingModule,
        CommonModule,
        IonicModule,
        SharedModule,
        TranslateModule.forRoot(),
        FormsModule,
      ],
    });
    fixture = TestBed.createComponent(ProgramTeamPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
