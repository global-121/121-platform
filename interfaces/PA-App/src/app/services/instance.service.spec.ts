import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { InstanceService } from './instance.service';

describe('InstanceService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TranslateModule.forRoot()],
    }),
  );

  it('should be created', () => {
    const service: InstanceService = TestBed.get(InstanceService);
    expect(service).toBeTruthy();
  });
});
