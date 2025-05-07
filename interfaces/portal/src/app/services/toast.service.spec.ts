import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { MessageService } from 'primeng/api';

import { ToastService } from '~/services/toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
      providers: [MessageService],
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
