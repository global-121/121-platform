import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogueTurnComponent } from './dialogue-turn.component';

describe('DialogueTurnComponent', () => {
  let component: DialogueTurnComponent;
  let fixture: ComponentFixture<DialogueTurnComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DialogueTurnComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogueTurnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
