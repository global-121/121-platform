import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { AccountPage } from './account.page';

describe('AccountPage', () => {
  let component: AccountPage;
  let fixture: ComponentFixture<AccountPage>;
  let event;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AccountPage],
      imports: [
        TranslateModule.forRoot(),
        RouterTestingModule.withRoutes([]),
        HttpClientTestingModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    event = {
      preventDefault: function () {},
      target: { elements: {
        create: { value: ""},
        confirm: { value: ""}
      }}
    }
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit: should set up variables', () => {
    expect(component.isLoggedIn).toBeDefined();
  });

  it('doLogin: should call login of authService', () => {
    expect(component.isLoggedIn).toBeDefined();
    spyOn(event, "preventDefault");
    component.doLogin(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('logout: should create toastController', () => {
    spyOn(component, "createToast");
    component.logout();
    expect(component.createToast).toHaveBeenCalled();
  });

  // async methods
  it('doChangePassword: should call changePassword if create == confirm', (done) => {
    spyOn(component, "createToast");
    let spy = spyOn(component.programsService, "changePassword").and.returnValue(Promise.resolve(true));

    component.doChangePassword(event);

    spy.calls.mostRecent().returnValue.then(() => {
        expect(component.createToast).toHaveBeenCalledWith(component.changedPassword);
        expect(component.createToast).toHaveBeenCalled();
        done();
    });
  });


  it('doChangePassword: should not call changePassword if create != confirm', () => {
    spyOn(component, "createToast");
    spyOn(component.programsService, "changePassword");
    event.target.elements.create = "none";

    component.doChangePassword(event);
    expect(component.programsService.changePassword).not.toHaveBeenCalled();
    expect(component.createToast).toHaveBeenCalled();
  });

});
