import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatCardModule,
  MatChipsModule,
  MatDialogModule,
  MatIconModule,
  MatListModule,
  MatPaginatorModule,
  MatSelectModule,
  MatSnackBarModule,
  MatTableModule,
  MatTabsModule,
} from '@angular/material';
import { Observable } from 'rxjs/Observable';
import * as FileSaver from 'file-saver';

import { AuthPipe } from '../auth/auth.pipe';
import { AuthService } from '../auth/auth.service';
import { FileSizePipe } from '../file-size/file-size.pipe';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { Logfile, NewLogfileDialogComponent, LogfileService, PaginatedLogfile } from '../logfile';
import { Organization, PaginatedOrganizations } from '../organization';
import { Portal, PortalComponent, PortalService, LeaderBoardComponent } from '../portal';
import { Registration, PaginatedRegistration, RegistrationDialogComponent } from '../portal';
import { TextInputDialogComponent } from '../text-input-dialog';
import { ConfirmationDialogComponent } from '../confirmation-dialog';

describe('PortalComponent', () => {
  let fixture: ComponentFixture<PortalComponent>;
  let component: PortalComponent;
  let authService: AuthService;
  let logfileService: LogfileService;
  let portalService: PortalService;

  // Test portal.
  const testPortal: Portal = new Portal({
    name: 'testName',
    owner: 'testOwner',
  });

  // Test registration.
  const testRegistration: Registration = new Registration({
    competition: 'testCompetition',
    creator: 'testCreator',
    participant: 'testParticipant'
  });
  const testPaginatedRegistration: PaginatedRegistration = new PaginatedRegistration();
  testPaginatedRegistration.registrations = [testRegistration];

  // Test Participants.
  const testParticipants: PaginatedOrganizations = new PaginatedOrganizations();
  testParticipants.organizations = [
    new Organization({ name: 'testOrg1' }),
    new Organization({ name: 'testOrg2' }),
  ];

  // Test Logfile.
  const testLogfile: Logfile = new Logfile({
    competition: 'testCompetition',
    creator: 'testCreator',
    id: 1,
    location: 'testLocation',
  });

  // Test Logfile.
  const testPaginatedLogfile: PaginatedLogfile = new PaginatedLogfile();
  testPaginatedLogfile.nextPage = 'testUrl';
  testPaginatedLogfile.logfiles = [testLogfile];

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        HttpClientTestingModule,
        MatCardModule,
        MatChipsModule,
        MatDialogModule,
        MatIconModule,
        MatListModule,
        MatPaginatorModule,
        MatSelectModule,
        MatSnackBarModule,
        MatTableModule,
        MatTabsModule,
        ReactiveFormsModule,
        RouterTestingModule,
      ],
      declarations: [
        AuthPipe,
        ConfirmationDialogComponent,
        FileSizePipe,
        LeaderBoardComponent,
        NewLogfileDialogComponent,
        PortalComponent,
        RegistrationDialogComponent,
        TextInputDialogComponent,
        ],
      providers: [
        AuthService,
        JsonClassFactoryService,
        LogfileService,
        PortalService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                resolvedData: testPortal,
              }
            }
          }
        },
        ],
    });
    TestBed.overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [
          ConfirmationDialogComponent,
          RegistrationDialogComponent,
          TextInputDialogComponent,
        ],
      },
    });
  }));

  // Create fixture and component before each test.
  beforeEach(() => {
    fixture = TestBed.createComponent(PortalComponent);
    component = fixture.debugElement.componentInstance;
    authService = TestBed.get(AuthService);
    logfileService = TestBed.get(LogfileService);
    portalService = TestBed.get(PortalService);
  });

  it('should get the portal from the resolved data', async(() => {
    spyOn(portalService, 'getParticipants');
    spyOn(portalService, 'getRegistrationRequests');
    spyOn(logfileService, 'getList');

    expect(component.portal).toBeUndefined();
    component.ngOnInit();
    expect(component.portal).toEqual(testPortal);
    expect(portalService.getParticipants).not.toHaveBeenCalled();
    expect(portalService.getRegistrationRequests).not.toHaveBeenCalled();
    expect(logfileService.getList).not.toHaveBeenCalled();
  }));

  it('should get resources to display if authenticated during on init lifecycle hook', async(() => {
    spyOn(authService, 'isAuthenticated').and.returnValue(true);
    spyOn(portalService, 'getParticipants').and.returnValue(Observable.of({}));
    spyOn(portalService, 'getRegistrationRequests').and.returnValue(Observable.of({}));
    spyOn(logfileService, 'getList').and.returnValue(Observable.of({}));
    component.ngOnInit();
    expect(portalService.getParticipants).toHaveBeenCalled();
    expect(portalService.getRegistrationRequests).toHaveBeenCalled();
    expect(logfileService.getList).toHaveBeenCalled();
  }));

  it('should open the registration dialog', async(() => {
    spyOn(component.dialog, 'open').and.callThrough();
    component.portal = testPortal;
    const options = {
      data: {
        portal: testPortal
      }
    };
    component.registration();
    expect(component.dialog.open).toHaveBeenCalledWith(RegistrationDialogComponent, options);
  }));

  it('should send the request when the dialog emits a registration event', async(() => {
    const spySnackbar = spyOn(component.snackBar, 'open');

    // Mock the dialog reference.
    spyOn(component.dialog, 'open').and.returnValue({
      componentInstance: {
        onRegister: Observable.of(testParticipants[0]),
      },
      close: () => {
        return true;
      },
      afterClosed: () => {
        return Observable.of({});
      },
    });

    // Registered correctly.
    component.pendingRegistrations = [];
    const spyRegistration = spyOn(portalService, 'sendRegistrationRequest');
    spyRegistration.and.returnValue(Observable.of(testRegistration));

    component.registration();
    expect(spyRegistration).toHaveBeenCalledWith(testParticipants[0]);
    expect(spySnackbar).toHaveBeenCalled();
    expect(component.pendingRegistrations.length).toBe(1);

    // Problem on registration.
    component.pendingRegistrations = [];
    spyRegistration.calls.reset();
    spyRegistration.and.returnValue(Observable.throw({}));
    spySnackbar.calls.reset();

    component.registration();
    expect(component.pendingRegistrations.length).toBe(0);
    expect(spySnackbar).toHaveBeenCalled();
  }));

  it('should approve a registration request', async(() => {
    component.pendingRegistrations = [testRegistration];
    component.portal = testPortal;

    const spySnackbar = spyOn(component.snackBar, 'open');
    const spyParticipants = spyOn(portalService, 'getParticipants');
    spyParticipants.and.returnValue(Observable.of(testParticipants));
    const spyApproval = spyOn(portalService, 'modifyRegistration');
    spyApproval.and.returnValue(Observable.of(testRegistration));

    component.approveRegistration(testRegistration);

    expect(component.pendingRegistrations.length).toBe(0);
    expect(component.snackBar.open).toHaveBeenCalled();
    expect(portalService.getParticipants).toHaveBeenCalled();
    expect(spyApproval).toHaveBeenCalledWith(testRegistration.participant, true);

    // Error on modification. Don't update participants nor pending registrations.
    spySnackbar.calls.reset();
    spyParticipants.calls.reset();
    spyApproval.calls.reset();
    spyApproval.and.returnValue(Observable.throw({}));

    component.pendingRegistrations = [testRegistration];
    component.approveRegistration(testRegistration);

    expect(component.pendingRegistrations.length).toBe(1);
    expect(component.pendingRegistrations).toEqual([testRegistration]);
    expect(component.snackBar.open).toHaveBeenCalled();
    expect(portalService.getParticipants).not.toHaveBeenCalled();
  }));

  it('should reject a registration request', async(() => {
    component.pendingRegistrations = [testRegistration];
    component.portal = testPortal;
    const rejectComment: string = 'Test rejection comment';

    const spyReject = spyOn(portalService, 'modifyRegistration');
    spyReject.and.returnValue(Observable.of(testRegistration));

    const spySnackbar = spyOn(component.snackBar, 'open');
    spyOn(component.dialog, 'open').and.returnValue({
      componentInstance: {
        onSubmit: Observable.of(rejectComment),
      },
      afterClosed: () => {
        return Observable.of({});
      },
    });

    component.rejectRegistration(testRegistration);

    expect(component.dialog.open).toHaveBeenCalled();
    expect(component.pendingRegistrations.length).toBe(0);
    expect(spyReject).toHaveBeenCalledWith(testRegistration.participant, false, rejectComment);
    expect(spySnackbar).toHaveBeenCalled();

    // Error on modification.
    spySnackbar.calls.reset();
    spyReject.calls.reset();
    spyReject.and.returnValue(Observable.throw({}));

    component.pendingRegistrations = [testRegistration];
    component.rejectRegistration(testRegistration);

    expect(component.pendingRegistrations.length).toBe(1);
    expect(component.pendingRegistrations).toEqual([testRegistration]);
    expect(component.snackBar.open).toHaveBeenCalled();
  }));

  it('should upload a logfile', async(() => {
    component.pendingPaginatedLogfiles = new PaginatedLogfile();

    spyOn(component.dialog, 'open').and.returnValue({
      afterClosed: () => {
        return Observable.of(testLogfile);
      }
    });

    component.uploadLogfile();
    expect(component.pendingPaginatedLogfiles.logfiles.length).toBe(1);
  }));

  it('should not upload a logfile when the dialog closes', async(() => {
    component.pendingPaginatedLogfiles = new PaginatedLogfile();

    spyOn(component.dialog, 'open').and.returnValue({
      afterClosed: () => {
        return Observable.of(undefined);
      }
    });

    component.uploadLogfile();
    expect(component.pendingPaginatedLogfiles.logfiles.length).toBe(0);
  }));

  it('should score a logfile', async(() => {
    component.pendingPaginatedLogfiles = new PaginatedLogfile();
    component.pendingPaginatedLogfiles.logfiles = [testLogfile];
    component.donePaginatedLogfiles = new PaginatedLogfile();

    spyOn(component.dialog, 'open').and.returnValue({
      afterClosed: () => {
        return Observable.of(testLogfile);
      }
    });

    component.scoreLogfile(testLogfile);

    expect(component.pendingPaginatedLogfiles.logfiles.length).toBe(0);
    expect(component.donePaginatedLogfiles.logfiles.length).toBe(1);
    expect(component.donePaginatedLogfiles.logfiles[0]).toEqual(testLogfile);
  }));

  it('should score a logfile from the rejected list', async(() => {
    component.pendingPaginatedLogfiles = new PaginatedLogfile();
    component.pendingPaginatedLogfiles.logfiles = [testLogfile];
    component.rejectedPaginatedLogfiles = new PaginatedLogfile();
    component.rejectedPaginatedLogfiles.logfiles = [testLogfile];
    component.donePaginatedLogfiles = new PaginatedLogfile();

    spyOn(component.dialog, 'open').and.returnValue({
      afterClosed: () => {
        return Observable.of(testLogfile);
      }
    });

    component.scoreLogfile(testLogfile, true);

    expect(component.rejectedPaginatedLogfiles.logfiles.length).toBe(0);
    expect(component.pendingPaginatedLogfiles.logfiles.length).toBe(1);
    expect(component.donePaginatedLogfiles.logfiles.length).toBe(1);
    expect(component.donePaginatedLogfiles.logfiles[0]).toEqual(testLogfile);
  }));

  it('should not score a logfile when the dialog closes', async(() => {
    component.pendingPaginatedLogfiles = new PaginatedLogfile();
    component.pendingPaginatedLogfiles.logfiles = [testLogfile];
    component.donePaginatedLogfiles = new PaginatedLogfile();

    spyOn(component.dialog, 'open').and.returnValue({
      afterClosed: () => {
        return Observable.of(undefined);
      }
    });

    component.scoreLogfile(testLogfile);

    expect(component.pendingPaginatedLogfiles.logfiles.length).toBe(1);
    expect(component.donePaginatedLogfiles.logfiles.length).toBe(0);
  }));

  it('should reject a logfile', async(() => {
    const rejectComment: string = 'Test rejection comment';
    const rejectStatus = { status: 2, comments: rejectComment };
    component.pendingPaginatedLogfiles = new PaginatedLogfile();
    component.pendingPaginatedLogfiles.logfiles = [testLogfile];
    component.rejectedPaginatedLogfiles = new PaginatedLogfile();

    const spyModify = spyOn(logfileService, 'modify');
    const spySnackbar = spyOn(component.snackBar, 'open');
    spyModify.and.returnValue(Observable.of(testLogfile));
    spyOn(component.dialog, 'open').and.returnValue({
      componentInstance: {
        onSubmit: Observable.of(rejectComment),
      },
      afterClosed: () => {
        return Observable.of({});
      },
    });

    component.rejectLogfile(testLogfile);

    expect(spyModify).toHaveBeenCalledWith(testLogfile.id, rejectStatus);
    expect(component.rejectedPaginatedLogfiles.logfiles.length).toBe(1);
    expect(component.rejectedPaginatedLogfiles.logfiles[0]).toEqual(testLogfile);
    expect(component.pendingPaginatedLogfiles.logfiles.length).toBe(0);
    expect(component.snackBar.open).toHaveBeenCalled();

    spySnackbar.calls.reset();
    spyModify.calls.reset();
    spyModify.and.returnValue(Observable.throw({}));
    component.pendingPaginatedLogfiles.logfiles = [testLogfile];
    component.rejectedPaginatedLogfiles.logfiles = [];

    component.rejectLogfile(testLogfile);
    expect(spyModify).toHaveBeenCalledWith(testLogfile.id, rejectStatus);
    expect(component.rejectedPaginatedLogfiles.logfiles.length).toBe(0);
    expect(component.pendingPaginatedLogfiles.logfiles.length).toBe(1);
    expect(component.pendingPaginatedLogfiles.logfiles[0]).toEqual(testLogfile);
    expect(component.snackBar.open).toHaveBeenCalled();
  }));

  it('should download a logfile', async(() => {
    const spyDownload = spyOn(logfileService, 'download');
    spyDownload.and.returnValue(Observable.of(testLogfile));
    const spyFileSaver = spyOn(FileSaver, 'saveAs');
    spyOn(component.snackBar, 'open');

    component.downloadLogfile(testLogfile);

    expect(logfileService.download).toHaveBeenCalledWith(testLogfile.id);
    expect(spyFileSaver).toHaveBeenCalled();

    spyFileSaver.calls.reset();
    spyDownload.calls.reset();
    spyDownload.and.returnValue(Observable.throw({}));

    component.downloadLogfile(testLogfile);
    expect(logfileService.download).toHaveBeenCalledWith(testLogfile.id);
    expect(spyFileSaver).not.toHaveBeenCalled();
    expect(component.snackBar.open).toHaveBeenCalled();
  }));

  it('should get the title of the registration button', async(() => {
    const spyAuthenticated = spyOn(authService, 'isAuthenticated');

    // Not authenticated.
    spyAuthenticated.and.returnValue(false);
    let result = component.registrationButtonTitle();
    expect(result).toBe('Please sign in to register');

    // Pending registration.
    component.pendingRegistrations = [testRegistration];
    spyAuthenticated.and.returnValue(true);
    result = component.registrationButtonTitle();
    expect(result).toBe('There is a pending registration');

    // Can register.
    component.pendingRegistrations = [];
    result = component.registrationButtonTitle();
    expect(result).toBe('Submit a registration');
  }));
});
