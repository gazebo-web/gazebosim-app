import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
  MatInputModule,
  MatDialogRef,
  MatSnackBarModule,
  MAT_DIALOG_DATA,
} from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable } from 'rxjs/Observable';

import { AuthService } from '../../auth/auth.service';
import { FileSizePipe } from '../../file-size/file-size.pipe';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { LogfileService, NewLogfileDialogComponent } from '../../logfile';
import { Organization } from '../../organization';

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

  beforeEach(async(() => {
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
  }));

  // Create fixture and component before each test.
  beforeEach(() => {
    fixture = TestBed.createComponent(NewLogfileDialogComponent);
    component = fixture.debugElement.componentInstance;
    authService = TestBed.get(AuthService);
    logfileService = TestBed.get(LogfileService);
  });

  it('should obtain the list of participants from the injected dialog data', async(() => {
    component.ngOnInit();
    expect(component.ownerList).toEqual(testParticipants);
  }));

  it('should set the logfile on a file input', async(() => {
    const eventTarget = new EventTarget();
    const event = { target: eventTarget } as Event;
    eventTarget['files'] = [testFile];

    component.onFileInput(event);
    expect(component.logfile).toBe(testFile);
  }));

  it('should upload the logfile', async(() => {
    component.ownerList = testParticipants;
    component.logfile = testFile;

    const formData = new FormData();
    formData.append('owner', testParticipants[0].name);
    formData.append('private', 'true');
    formData.append('file', testFile, (testFile as any).fullPath);

    const spyUpload = spyOn(logfileService, 'upload').and.returnValue(Observable.of({}));
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
    spyUpload.and.returnValue(Observable.throw({}));
    component.upload();
    expect(spyUpload).toHaveBeenCalledWith(formData);
    expect(spySnackbar).toHaveBeenCalled();
    expect(spyDialog).not.toHaveBeenCalled();
  }));

  it('should close the dialog on cancel', async(() => {
    spyOn(component.dialogRef, 'close');
    component.cancel();
    expect(component.dialogRef.close).toHaveBeenCalled();
  }));
});
