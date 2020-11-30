import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatInputModule } from '@angular/material/input';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../auth/auth.service';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { Logfile, LogfileService, LogfileScoreDialogComponent } from '../../logfile';

describe('LogfileScoreDialogComponent', () => {
  let fixture: ComponentFixture<LogfileScoreDialogComponent>;
  let component: LogfileScoreDialogComponent;
  let authService: AuthService;
  let logfileService: LogfileService;

  // Test Logfile.
  const testLogfile = new Logfile({
    id: 1,
    name: 'testName',
    owner: 'testOwner',
  });

  // Create fixture and component before each test.
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        HttpClientTestingModule,
        MatInputModule,
        MatSnackBarModule,
        ReactiveFormsModule,
        RouterTestingModule,
        ],
      declarations: [
        LogfileScoreDialogComponent,
        ],
      providers: [
        AuthService,
        LogfileService,
        JsonClassFactoryService,
        { provide: MAT_DIALOG_DATA, useValue: {logfile: testLogfile} },
        { provide: MatDialogRef,
          useValue: {
            close: () => {
              return true;
            }
          },
        }
        ],
    });

    fixture = TestBed.createComponent(LogfileScoreDialogComponent);
    component = fixture.debugElement.componentInstance;
    authService = TestBed.inject(AuthService);
    logfileService = TestBed.inject(LogfileService);
  });


  it('should get the logfile from the injected dialog data', () => {
    component.ngOnInit();
    expect(component.logfile).toBe(testLogfile);
  });

  it('should close the dialog on cancel', () => {
    spyOn(component.dialogRef, 'close');
    component.cancel();
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  it('should not score if there is an error in the form', () => {
    const spyScore = spyOn(logfileService, 'modify');
    spyScore.and.returnValue(of(testLogfile));
    const spyDialog = spyOn(component.dialogRef, 'close');
    const spySnackbar = spyOn(component.snackBar, 'open');
    component.logfile = testLogfile;

    component.scoreForm.setErrors({ required: true });
    component.score();
    expect(spyScore).not.toHaveBeenCalled();
    expect(spyDialog).not.toHaveBeenCalled();
    expect(spySnackbar).not.toHaveBeenCalled();
  });

  it('should score the dialog', () => {
    const spyScore = spyOn(logfileService, 'modify');
    spyScore.and.returnValue(of(testLogfile));
    const spyDialog = spyOn(component.dialogRef, 'close');
    const spySnackbar = spyOn(component.snackBar, 'open');
    component.logfile = testLogfile;

    component.scoreForm.setValue(1.23);
    const data = {
      status: 1,
      score: 1.23
    };

    component.score();
    expect(spyScore).toHaveBeenCalledWith(1, data);
    expect(spyDialog).toHaveBeenCalled();
    expect(spySnackbar).toHaveBeenCalled();
    spyDialog.calls.reset();
    spySnackbar.calls.reset();

    // Error from the score.
    spyScore.and.returnValue(throwError({}));
    component.score();
    expect(spySnackbar).toHaveBeenCalled();
    expect(spyDialog).not.toHaveBeenCalled();
  });

  it('should get an error string for the score input', () => {
    // Required score.
    component.scoreForm.setErrors({ required: true });
    expect(component.scoreForm.hasError('required')).toBe(true);
    let errorString = component.getError();
    expect(errorString).toEqual('A score is required.');

    // No errors.
    component.scoreForm.reset();
    component.scoreForm.setValue(1.23);
    errorString = component.getError();
    expect(errorString).toEqual('');
  });
});
