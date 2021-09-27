import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { UpdateFspComponent } from './update-fsp.component';

describe('UpdateFspComponent', () => {
  let component: UpdateFspComponent;
  let fixture: ComponentFixture<UpdateFspComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UpdateFspComponent],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateFspComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
