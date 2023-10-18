import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../../../shared/shared.module';
import { RemoveTeamMemberPopupContentComponent } from './remove-team-member-popup-content.component';

describe('ProgramTeamPopupComponent', () => {
  let component: RemoveTeamMemberPopupContentComponent;
  let fixture: ComponentFixture<RemoveTeamMemberPopupContentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RemoveTeamMemberPopupContentComponent,
        HttpClientTestingModule,
        CommonModule,
        IonicModule,
        SharedModule,
        TranslateModule.forRoot(),
        FormsModule,
      ],
    });
    fixture = TestBed.createComponent(RemoveTeamMemberPopupContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
