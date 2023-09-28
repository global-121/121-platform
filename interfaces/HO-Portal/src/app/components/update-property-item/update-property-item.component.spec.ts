import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { UpdatePropertyItemComponent } from './update-property-item.component';

describe('UpdatePropertyItemComponent', () => {
  let component: UpdatePropertyItemComponent;
  let fixture: ComponentFixture<UpdatePropertyItemComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [UpdatePropertyItemComponent],
      imports: [
        FormsModule,
        IonicModule,
        TranslateModule.forRoot(),
        SharedModule,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdatePropertyItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
