import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatInputModule } from '@angular/material/input';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../auth/auth.service';
import { FileSizePipe } from '../../file-size/file-size.pipe';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { LogfileService, NewLogfileDialogComponent } from '../../logfile';
import { Organization } from '../../organization';
import { Logfile } from '../logfile';

describe('NewLogfileDialogComponent', () => {
  let fixture: ComponentFixture<NewLogfileDialogComponent>;
  let component: NewLogfileDialogComponent;
  let authService: AuthService;
  let logfileService: LogfileService;

  // Test Logfile.
  const testParticipants = [
    new Organization({
      name: 'testOrg1',
    }),
    new Organization({
      name: 'testOrg2',
    }),
  ];

  const testFile = new File([''], 'testFile.zip');
  testFile['fullPath'] = '';

  // Create fixture and component before each test.
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        HttpClientTestingModule,
        MatInputModule,
        MatSnackBarModule,
        ReactiveFormsModule,
        RouterTestingModule,
        ],
      declarations: [
        FileSizePipe,
        NewLogfileDialogComponent,
        ],
      providers: [
        AuthService,
        LogfileService,
        JsonClassFactoryService,
        { provide: MAT_DIALOG_DATA, useValue: {portal: { participants: testParticipants } } },
        { provide: MatDialogRef,
          useValue: {
            close: () => {
              return true;
            }
          },
        }
        ],
    });

    fixture = TestBed.createComponent(NewLogfileDialogComponent);
    component = fixture.debugElement.componentInstance;
    authService = TestBed.inject(AuthService);
    logfileService = TestBed.inject(LogfileService);
  });

  it('should obtain the list of participants from the injected dialog data', () => {
    component.ngOnInit();
    expect(component.ownerList).toEqual(testParticipants);
  });

  it('should set the logfile on a file input', () => {
    const eventTarget = new EventTarget();
    const event = { target: eventTarget } as Event;
    eventTarget['files'] = [testFile];

    component.onFileInput(event);
    expect(component.logfile).toBe(testFile);
  });

  it('should upload the logfile', () => {
    component.ownerList = testParticipants;
    component.logfile = testFile;

    const formData = new FormData();
    formData.append('owner', testParticipants[0].name);
    formData.append('private', 'true');
    formData.append('file', testFile, (testFile as any).fullPath);

    const spyUpload = spyOn(logfileService, 'upload').and.returnValue(of({} as Logfile));
    const spySnackbar = spyOn(component.snackBar, 'open');
    const spyDialog = spyOn(component.dialogRef, 'close');

    // Upload without issues.
    component.upload();
    expect(spyUpload).toHaveBeenCalledWith(formData);
    expect(spySnackbar).toHaveBeenCalled();
    expect(spyDialog).toHaveBeenCalled();
    spyUpload.calls.reset();
    spySnackbar.calls.reset();
    spyDialog.calls.reset();

    // Error on Upload. Don't close the dialog.
    spyUpload.and.returnValue(throwError({}));
    component.upload();
    expect(spyUpload).toHaveBeenCalledWith(formData);
    expect(spySnackbar).toHaveBeenCalled();
    expect(spyDialog).not.toHaveBeenCalled();
  });

  it('should close the dialog on cancel', () => {
    spyOn(component.dialogRef, 'close');
    component.cancel();
    expect(component.dialogRef.close).toHaveBeenCalled();
  });
});
