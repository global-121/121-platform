import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Storage } from '@ionic/storage';
import { TranslateModule } from '@ngx-translate/core';
import { UploadDataComponent } from './upload-data.component';

const mockValidationData = [{ referenceId: '', programId: 1, attributes: [] }];
const storageIonicMock: any = {
  get: () => new Promise<any>((resolve) => resolve(mockValidationData)),
};

describe('UploadDataComponent', () => {
  let component: UploadDataComponent;
  let fixture: ComponentFixture<UploadDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UploadDataComponent],
      imports: [TranslateModule.forRoot(), HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: Storage,
          useValue: storageIonicMock,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
