import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FileUploadComponent } from './file-upload.component';
import {
  MatButtonModule,
  MatIconModule,
  MatInputModule,
  MatSnackBarModule,
} from '@angular/material';
import { DndDirective } from '../dnd/dnd.directive';
import { SdfViewerComponent } from '../model/sdfviewer/sdfviewer.component';

describe('FileUploadComponent', () => {
  let fixture: ComponentFixture<FileUploadComponent>;
  let component: FileUploadComponent;

  // Mock file values.
  const testFile1: any = {
    name: 'file1.ok',
    fullPath: 'file1.ok',
    webkitRelativePath: 'path/to/file1.ok'
  };

  const testFile2: any = {
    name: 'file2.ok.other',
    fullPath: 'file2.ok.other',
    webkitRelativePath: 'path/to/file2.ok.other'
  };

  const testFile3: any = {
    name: 'file3.valid',
    fullPath: 'file3.valid',
    webkitRelativePath: 'path/to/file3.valid'
  };

  const testInvalidFile: any = {
    name: 'file.invalid',
    fullPath: 'file.invalid',
    webkitRelativePath: 'path/to/file.invalid'
  };

  // Mock event.
  const target = new EventTarget();
  const event = { target } as Event;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatSnackBarModule,
        ],
      declarations: [
        DndDirective,
        FileUploadComponent,
        SdfViewerComponent
        ]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.debugElement.componentInstance;

    // Set the allowed extensions.
    component.allowedExtensions = ['ok', 'ok.other', 'valid'];
  });

  it('should determine if a file is valid or invalid', async(() => {
    let result = component.isValidFile(testFile1);
    expect(result).toBe(true);

    result = component.isValidFile(testInvalidFile);
    expect(result).toBe(false);
  }));

  it('should receive valid files from an event', async(() => {
    // Mock event with valid files.
    target['files'] = [ testFile1, testFile2 ];

    spyOn(component, 'onValidFiles');
    component.onFileInput(event);

    // The array that should be passed to the onValidFiles method.
    const fileArray = [{
      name: 'file1.ok',
      fullPath: 'path/to/file1.ok',
      webkitRelativePath: 'path/to/file1.ok'
     }, {
      name: 'file2.ok.other',
      fullPath: 'path/to/file2.ok.other',
      webkitRelativePath: 'path/to/file2.ok.other'
    }];

    expect(component.onValidFiles).toHaveBeenCalledWith(fileArray);
  }));

  it('should NOT emit an event when no valid files are uploaded', async(() => {
    // Mock event without valid files.
    target['files'] = [ testInvalidFile ];

    spyOn(component, 'onValidFiles');
    spyOn(component, 'onInvalidFiles');
    spyOn(component.files, 'emit');
    component.onFileInput(event);

    expect(component.onInvalidFiles).toHaveBeenCalled();
    expect(component.onValidFiles).not.toHaveBeenCalled();
    expect(component.files.emit).not.toHaveBeenCalled();
  }));

  it('should filter invalid files from the file input event', async(() => {
    // Mock event with files.
    target['files'] = [ testFile1, testFile2, testInvalidFile ];

    spyOn(component, 'onValidFiles');
    spyOn(component, 'onInvalidFiles');
    component.onFileInput(event);

    // The array that should be passed to the onInvalidFiles method.
    const fileArray = [{
      name: 'file.invalid',
      fullPath: 'path/to/file.invalid',
      webkitRelativePath: 'path/to/file.invalid'
    }];

    expect(component.onInvalidFiles).toHaveBeenCalledWith(fileArray);
  }));

  it('should append the valid files received and emit an event with the file list', async(() => {
    const fileList: File[] = [testFile1, testFile2];
    component.fileList.push(testFile3);

    spyOn(component.files, 'emit');

    component.onValidFiles(fileList);

    expect(component.fileList.length).toBe(3);
    expect(component.fileList[0].name).toBe('file3.valid');
    expect(component.fileList[1].name).toBe('file1.ok');
    expect(component.fileList[2].name).toBe('file2.ok.other');
    expect(component.files.emit).toHaveBeenCalledWith(component.fileList);
  }));

  it('should notify the user when invalid files are upload', async(() => {
    const snackBar = component.snackBar;

    // Mock event with a valid file.
    target['files'] = [ testFile1 ];

    component.onFileInput(event);
    expect(snackBar._openedSnackBarRef).toBeNull();

    // Mock event with an invalid file.
    target['files'] = [ testInvalidFile ];

    component.onFileInput(event);
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  }));

  it('should remove a file from the files array', async(() => {
    component.fileList = [testFile1, testFile2];
    spyOn(component.files, 'emit');

    // Remove an nonexistent file.
    component.removeFile(testFile3);
    expect(component.fileList.length).toBe(2);
    expect(component.files.emit).not.toHaveBeenCalled();

    // Remove the first file.
    component.removeFile(testFile1);
    expect(component.fileList.length).toBe(1);
    expect(component.fileList[0]).toBe(testFile2);
    expect(component.files.emit).toHaveBeenCalledWith(component.fileList);
  }));
});
