import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SovrinService } from './sovrin.service';

describe('SovrinService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [
      HttpClientTestingModule,
    ],
    providers: [
    ],
  }));

  it('should create', () => {
    const service: SovrinService = TestBed.get(SovrinService);
    expect(service).toBeTruthy();
  });
});
