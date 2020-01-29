import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
  MatDialogRef,
  MatListModule,
  MatOptionModule,
  MatSelectModule,
  MAT_DIALOG_DATA,
} from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from '../../auth/auth.service';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { Portal, RegistrationDialogComponent } from '../../portal';

describe('RegistrationDialogComponent', () => {
  let fixture: ComponentFixture<RegistrationDialogComponent>;
  let component: RegistrationDialogComponent;
  let authService: AuthService;

  // Test User profile.
  const profile = {
    orgs: ['memberOrg', 'adminOrg'],
    orgRoles: {
      memberOrg: 'member',
      adminOrg: 'admin'
    },
  };

  // Test portal.
  const portal = new Portal({});

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        HttpClientTestingModule,
        MatListModule,
        MatOptionModule,
        MatSelectModule,
        ReactiveFormsModule,
        RouterTestingModule,
        ],
      declarations: [
        RegistrationDialogComponent,
        ],
      providers: [
        AuthService,
        JsonClassFactoryService,
        { provide: MAT_DIALOG_DATA, useValue: {portal} },
        { provide: MatDialogRef,
          useValue: {
            close: () => {
              return true;
            }
          },
        }
        ],
    });
  }));

  // Create fixture and component before each test.
  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrationDialogComponent);
    component = fixture.debugElement.componentInstance;
    authService = TestBed.get(AuthService);
    authService.userProfile = profile;
  });

  it('should get the organizations the user has write access to', async(() => {
    spyOn(authService, 'isAuthenticated').and.returnValue(true);
    component.ngOnInit();
    expect(component.organizationList.length).toBe(1);
    expect(component.organizationList[0]).toEqual('adminOrg');
    expect(component.portal).toEqual(portal);
  }));

  it('should emit the selected organization to register', async(() => {
    const eventSpy = spyOn(component.onRegister, 'emit');

    component.orgToRegister.setValue(null);
    component.register();
    expect(eventSpy).not.toHaveBeenCalled();
    eventSpy.calls.reset();

    component.orgToRegister.setValue('testOrg');
    component.register();
    expect(eventSpy).toHaveBeenCalled();
  }));

  it('should get the form error as a string', async(() => {
    let error: string;
    // No organization.
    component.orgToRegister.setErrors({ required: true });
    error = component.getError();
    expect(error).toEqual('An organization is required to register');
    // No error.
    component.orgToRegister.reset();
    component.orgToRegister.setValue('testOrg');
    error = component.getError();
    expect(error).toEqual('');
  }));
});
