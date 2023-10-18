import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../../../shared/shared.module';
import { AddTeamMemberPopupContentComponent } from './add-team-member-popup-content.component';

describe('ProgramTeamPopupComponent', () => {
  let component: AddTeamMemberPopupContentComponent;
  let fixture: ComponentFixture<AddTeamMemberPopupContentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AddTeamMemberPopupContentComponent,
        HttpClientTestingModule,
        CommonModule,
        IonicModule,
        SharedModule,
        TranslateModule.forRoot(),
        FormsModule,
      ],
    });
    fixture = TestBed.createComponent(AddTeamMemberPopupContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
