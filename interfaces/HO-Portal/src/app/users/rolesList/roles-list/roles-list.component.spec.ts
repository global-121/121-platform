import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RolesListComponent } from './roles-list.component';

describe('RolesListComponent', () => {
  let component: RolesListComponent;
  let fixture: ComponentFixture<RolesListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RolesListComponent, HttpClientTestingModule],
    });
    fixture = TestBed.createComponent(RolesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
