import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { provideMagicalMock } from '../../../mocks/helpers';
import { ProgramsServiceApiService } from '../../../services/programs-service-api.service';
import { TranslatableStringService } from '../../../services/translatable-string.service';
import { ProgramTeamTableComponent } from './program-team-table.component';

describe('ProgramTeamTableComponent', () => {
  let component: ProgramTeamTableComponent;
  let fixture: ComponentFixture<ProgramTeamTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ProgramTeamTableComponent,
        CommonModule,
        IonicModule,
        SharedModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideMagicalMock(TranslatableStringService),
        provideMagicalMock(ProgramsServiceApiService),
      ],
    });

    fixture = TestBed.createComponent(ProgramTeamTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
