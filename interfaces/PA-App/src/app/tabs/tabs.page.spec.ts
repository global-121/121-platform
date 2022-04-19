import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AngularDelegate, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { MockPaDataService } from '../mocks/padata.service.mock';
import { PaDataService } from '../services/padata.service';
import { TabsPage } from './tabs.page';

describe('TabsPage', () => {
  let component: TabsPage;
  let fixture: ComponentFixture<TabsPage>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [TabsPage],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        imports: [TranslateModule.forRoot()],
        providers: [
          {
            provide: ModalController,
          },
          {
            provide: AngularDelegate,
          },
          {
            provide: PaDataService,
            useValue: MockPaDataService,
          },
        ],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(TabsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
