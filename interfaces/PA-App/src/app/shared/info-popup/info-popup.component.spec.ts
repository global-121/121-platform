import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AngularDelegate, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { InfoPopupComponent } from './info-popup.component';

describe('InfoPopupComponent', () => {
  let component: InfoPopupComponent;
  let fixture: ComponentFixture<InfoPopupComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [InfoPopupComponent],
        imports: [TranslateModule.forRoot()],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        providers: [
          {
            provide: ModalController,
          },
          {
            provide: AngularDelegate,
          },
        ],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the provided message as the modal contents', () => {
    const customContent = 'CUSTOM-CONTENT';

    component.message = customContent;
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('ion-content').textContent,
    ).toContain(customContent);
  });

  it('should show the provided message rendered with HTML as the modal contents', () => {
    const customContent =
      'CUSTOM-CONTENT<p><strong>CUSTOM-CONTENT</strong><br>CUSTOM-CONTENT</p>';

    component.message = customContent;
    fixture.detectChanges();

    const customContentRendered = `CUSTOM-CONTENT

CUSTOM-CONTENT
CUSTOM-CONTENT`;

    expect(
      fixture.nativeElement.querySelector('ion-content').innerHTML,
    ).toContain(customContent);
    expect(
      fixture.nativeElement.querySelector('ion-content').innerText,
    ).toContain(customContentRendered);
  });

  it('should show the provided heading as the modal title', () => {
    const customHeading = 'CUSTOM-HEADING';

    component.heading = customHeading;
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('ion-title').textContent,
    ).toContain(customHeading);
  });

  it('should show a generic heading as the modal title, when no custom heading is provided', () => {
    const genericHeading = 'shared.more-info';

    component.heading = null;
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('ion-title').textContent,
    ).toContain(genericHeading);
  });
});
