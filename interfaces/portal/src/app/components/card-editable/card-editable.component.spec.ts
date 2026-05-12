import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageService } from 'primeng/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';

@Component({
  selector: 'app-test-host',
  standalone: true,
  imports: [CardEditableComponent],
  template: `
    <app-card-editable
      header="Basic information"
      i18n-header="@@card-title-program-settings-basic-information"
      editPencilTitle="Edit basic information"
      i18n-editPencilTitle
      [canEdit]="canEdit()"
      [(isEditing)]="isEditing"
    >
    </app-card-editable>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestHostComponent {
  readonly canEdit = signal(true);
  readonly isEditing = signal(false);
}

describe('CardEditableComponent', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardEditableComponent, TestHostComponent],
      providers: [MessageService],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should add outline classes to the card when isEditing is true', () => {
    component.isEditing.set(true);
    fixture.detectChanges();

    const cardElement = (fixture.nativeElement as HTMLElement).querySelector(
      'p-card',
    );
    expect(cardElement?.classList).toContain('outline-purple');
    expect(cardElement?.classList).toContain('outline-2');
  });

  it('should NOT add outline classes to the card when isEditing is false', () => {
    fixture.detectChanges();

    const cardElement = (fixture.nativeElement as HTMLElement).querySelector(
      'p-card',
    );
    expect(cardElement?.classList).not.toContain('outline-purple');
    expect(cardElement?.classList).not.toContain('outline-2');
  });
});
