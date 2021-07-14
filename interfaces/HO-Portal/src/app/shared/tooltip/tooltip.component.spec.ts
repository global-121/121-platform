import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TooltipComponent } from './tooltip.component';

describe('TooltipComponent', () => {
  let component: TooltipComponent;
  let fixture: ComponentFixture<TooltipComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TooltipComponent],
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
    spyOn(window, 'alert');

    const testContent = 'test content';
    component.value = testContent;
    fixture.detectChanges();

    fixture.debugElement.nativeElement.querySelector('ion-button').click();

    expect(window.alert).toHaveBeenCalledWith(testContent);
  });
});
