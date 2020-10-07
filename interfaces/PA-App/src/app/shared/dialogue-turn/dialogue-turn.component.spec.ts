import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { InstanceService } from 'src/app/services/instance.service';
import { DialogueTurnComponent } from './dialogue-turn.component';

describe('DialogueTurnComponent', () => {
  let component: DialogueTurnComponent;
  let fixture: ComponentFixture<DialogueTurnComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DialogueTurnComponent],
      providers: [
        {
          provide: InstanceService,
        },
      ],
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
