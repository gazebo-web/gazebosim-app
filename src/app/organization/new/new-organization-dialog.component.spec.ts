import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../auth/auth.service';
import {
  Organization,
  NewOrganizationDialogComponent,
  OrganizationService
} from '../../organization';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { ErrMsg } from '../../server/err-msg';

describe('NewOrganizationDialogComponent', () => {
  let fixture: ComponentFixture<NewOrganizationDialogComponent>;
  let component: NewOrganizationDialogComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        BrowserAnimationsModule,
        FormsModule,
        HttpClientModule,
        MatInputModule,
        MatRadioModule,
        MatSnackBarModule,
        MatStepperModule,
        ReactiveFormsModule,
        RouterTestingModule,
        ],
      declarations: [
        NewOrganizationDialogComponent,
        ],
      providers: [
        AuthService,
        JsonClassFactoryService,
        OrganizationService,
        { provide: MatDialogRef, useValue: {} }
        ],
    });

    // Create fixture and component before each test.
    fixture = TestBed.createComponent(NewOrganizationDialogComponent);
    component = fixture.debugElement.componentInstance;
  });

  it('should build the new organization form', () => {
    component.ngOnInit();

    expect(component.newOrganizationForm.contains('name')).toBe(true);
    // Billing email and invitation list to be added soon.
    // expect(component.newOrganizationForm.contains('email')).toBe(true);
    // expect(component.newOrganizationForm.contains('invitationList')).toBe(true);
    expect(component.newOrganizationForm.contains('plan')).toBe(true);

    expect(component.newOrganizationForm.controls['name'].value).toBe('');
    // Billing email and invitation list to be added soon.
    // expect(component.newOrganizationForm.controls['email'].value).toBe('');
    // expect(component.newOrganizationForm.controls['invitationList'].value).toBe('');
    expect(component.newOrganizationForm.controls['plan'].value).toBe(component.planOptions[0]);
  });

  it('should return the correct error for the organization name', () => {
    // Empty name error.
    component.organizationName.setValue('');
    let error = component.getNameError();
    expect(error).toBe('An organization name is required');

    // Duplicated name error. It must be manually set the error in the form.
    component.organizationName.reset();
    component.organizationName.setValue('Test organization');
    component.organizationName.setErrors({ duplicated: true });
    error = component.getNameError();
    expect(error).toBe('This organization already exists. Please use a different name');

    // No error.
    component.organizationName.reset();
    component.organizationName.setValue('Test organization');
    error = component.getNameError();
    expect(error).toBe('');
  });

  // Billing email to be added soon.
  // it('should return the correct error for the organization email', () => {
  //   // Empty email error.
  //   component.organizationEmail.setValue('');
  //   let error = component.getEmailError();
  //   expect(error).toBe('An email is required');

  //   // Invalid email error.
  //   component.organizationEmail.reset();
  //   component.organizationEmail.setValue('test invalid email');
  //   error = component.getEmailError();
  //   expect(error).toBe('Please enter a valid email address');

  //   // No error.
  //   component.organizationEmail.reset();
  //   component.organizationEmail.setValue('test@email.com');
  //   error = component.getEmailError();
  //   expect(error).toBe('');
  // });

  it('should NOT submit a new organization with an empty name', () => {
    const service = TestBed.inject(OrganizationService);
    const snackBar = component.snackBar;
    const organization = new Organization({});

    spyOn(service, 'createOrganization').and.returnValue(of(organization));

    component.ngOnInit();
    component.organizationName.setValue('');
    component.onSubmit();

    expect(snackBar._openedSnackBarRef).toBeTruthy();
    expect(service.createOrganization).not.toHaveBeenCalled();
  });

  // Billing email to be added soon.
  // it('should NOT submit a new organization with an invalid email', () => {
  //   const service = TestBed.get(OrganizationService);
  //   const snackBar = component.snackBar;

  //   spyOn(service, 'createOrganization').and.returnValue(Observable.of({}));

  //   component.ngOnInit();
  //   component.organizationEmail.setValue('');
  //   component.onSubmit();

  //   expect(snackBar._openedSnackBarRef).toBeTruthy();
  //   expect(service.createOrganization).not.toHaveBeenCalled();
  // });

  it('should submit a new organization with a valid form', () => {
    const service = TestBed.inject(OrganizationService);
    const authService = TestBed.inject(AuthService);

    // First test with an empty profile.
    let mockProfile = {};
    authService.userProfile = mockProfile;

    const formData = {
      name: 'Valid Organization',
      // Billing email and invitation list to be added soon.
      // email: 'valid@mail.com',
      email: undefined,
      // invitationList: '',
      plan: component.planOptions[0],
    };

    const mockOrganization = new Organization({
      name: 'Valid Organization',
    });

    spyOn(localStorage, 'setItem');
    spyOn(service, 'createOrganization').and.returnValue(of(mockOrganization));

    component.ngOnInit();
    component.organizationName.setValue(formData.name);
    // Billing email to be added soon.
    // component.organizationEmail.setValue(formData.email);
    component.onSubmit();

    expect(localStorage.setItem).toHaveBeenCalled();
    expect(mockProfile['orgs'].length).toBe(1);
    expect(mockProfile['orgs'][0]).toBe('Valid Organization');
    expect(mockProfile['orgRoles']['Valid Organization']).toBe('owner');
    expect(service.createOrganization).toHaveBeenCalledWith(formData);

    // Now test with a profile that has information.
    mockProfile = {
      orgs: ['testOrg'],
      orgRoles: {
        testOrg: 'admin',
      }
    };
    authService.userProfile = mockProfile;

    component.onSubmit();

    expect(mockProfile['orgs'].length).toBe(2);
    expect(mockProfile['orgs'][0]).toBe('testOrg');
    expect(mockProfile['orgs'][1]).toBe('Valid Organization');
    expect(mockProfile['orgRoles']['testOrg']).toBe('admin');
    expect(mockProfile['orgRoles']['Valid Organization']).toBe('owner');
  });

  it('should return an error if the submitted organization already exists', () => {
    const service = TestBed.inject(OrganizationService);
    const authService = TestBed.inject(AuthService);

    const mockProfile = {};
    authService.userProfile = mockProfile;

    const formData = {
      name: 'Valid Organization',
      // Billing email and invitation list to be added soon.
      // email: 'valid@mail.com',
      email: undefined,
      // invitationList: '',
      plan: component.planOptions[0],
    };

    spyOn(localStorage, 'setItem');
    spyOn(service, 'createOrganization').and.returnValue(
      throwError({ code: ErrMsg.ErrorResourceExists }));

    component.ngOnInit();
    component.organizationName.setValue(formData.name);
    // Billing email to be added soon.
    // component.organizationEmail.setValue(formData.email);
    component.onSubmit();

    expect(component.organizationName.getError('duplicated')).toBe(true);
  });
});
