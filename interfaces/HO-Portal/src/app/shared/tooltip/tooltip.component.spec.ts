import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxPopperjsModule } from 'ngx-popperjs';
import { TooltipComponent } from './tooltip.component';

describe('TooltipComponent', () => {
  let component: TooltipComponent;
  let fixture: ComponentFixture<TooltipComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TooltipComponent],
      imports: [NgxPopperjsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be visible when a value is provided', () => {
    component.value = 'test';
    fixture.detectChanges();

    expect(
      fixture.debugElement.nativeElement.querySelector('ion-button'),
    ).toBeTruthy();
  });

  it('should not be visible when no value is provided', () => {
    component.value = '';
    fixture.detectChanges();

    expect(
      fixture.debugElement.nativeElement.querySelector('ion-button'),
    ).toBeFalsy();
  });

  it('should show the provided text when clicked', () => {
    jasmine.clock().install();
    const testContent = 'test content';
    component.value = testContent;
    fixture.detectChanges();

    fixture.debugElement.nativeElement
      .querySelector('.tooltip--button')
      .click();

    // Wait a second...
    jasmine.clock().tick(1000);

    const tooltipContent: HTMLElement = document.querySelector(
      '.tooltip--container',
    );

    expect(tooltipContent).toBeTruthy();
    expect(tooltipContent.innerHTML).toContain(testContent);
    expect(tooltipContent.getAttribute('aria-hidden')).toBe('false');
    jasmine.clock().uninstall();
  });
});
