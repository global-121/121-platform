import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Storage } from '@ionic/storage';
import { TranslateModule } from '@ngx-translate/core';
import { DownloadDataComponent } from './download-data.component';

const storageIonicMock: any = {
  get: () => new Promise<any>((resolve) => resolve('1')),
};

describe('DownloadDataComponent', () => {
  let component: DownloadDataComponent;
  let fixture: ComponentFixture<DownloadDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DownloadDataComponent],
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
    fixture = TestBed.createComponent(DownloadDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
