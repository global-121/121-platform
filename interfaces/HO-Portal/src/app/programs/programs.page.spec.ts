import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, async } from '@angular/core/testing';

import { ProgramsPage } from './programs.page';

describe('ProgramsPage', () => {
  let component: ProgramsPage;
  let fixture: ComponentFixture<ProgramsPage>;
  let programsPage: HTMLElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProgramsPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .compileComponents();
  }));

  beforeEach(async () => {
    fixture = await TestBed.createComponent(ProgramsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a list of 12 elements', () => {
    programsPage = fixture.nativeElement;
    const items = programsPage.querySelectorAll('ion-item');
    expect(items.length).toEqual(12);
  });

});
