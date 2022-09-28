import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { FilePickerPromptComponent } from './file-picker-prompt.component';

describe('FilePickerPromptComponent', () => {
  let component: FilePickerPromptComponent;
  let fixture: ComponentFixture<FilePickerPromptComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [FilePickerPromptComponent],
        imports: [TranslateModule.forRoot(), IonicModule, FormsModule],
        providers: [provideMagicalMock(ProgramsServiceApiService)],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(FilePickerPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
