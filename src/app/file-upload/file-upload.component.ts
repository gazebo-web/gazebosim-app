import { Component,
         Input,
         Output,
         EventEmitter,
         ChangeDetectorRef,
         NgZone,
         OnInit
       } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

declare let Detector: any;

@Component({
  selector: 'ign-file-upload',
  templateUrl: 'file-upload.component.html',
  styleUrls: ['file-upload.component.scss']
})

/**
 * Component to allow upload of files and folders with buttons and drag and drop.
 */
export class FileUploadComponent implements OnInit {

  /**
   * The list of valid files held by the component.
   */
  public fileList: File[] = [];

  /**
   * The list of invalid files that were uploaded.
   */
  public invalidFileList: File[];

  /**
   * Experimental feature: GzWeb.
   */
  public hasGzWeb: boolean;

  /**
   * Type of resource being uploaded, such as 'model' or 'world'
   */
  @Input() public resourceType: string = 'model';

  /**
   * The allowed extensions of files to be uploaded.
   */
  @Input() public allowedExtensions: string[] = [];

  /**
   * Whether the files are being uploaded or not. Depends on the parent component.
   */
  @Input() public uploading: boolean = false;

  /**
   * Text to be displayed in the middle of the drag-and-drop area.
   */
  @Input() public message: string = '<h3>Select or drag and drop files to upload!</h3>';

  /**
   * Event emitted whenever files are uploaded.
   */
  @Output() public files = new EventEmitter<File[]>();

  /**
   * @param ref Change detector ref to trigger repaint
   * @param snackBar Snackbar to display notifications
   * @param zone Angular zone to run outside events inside it
   */
  constructor(
    private ref: ChangeDetectorRef,
    public snackBar: MatSnackBar,
    private zone: NgZone) {
  }

  /**
   * OnInit Lifecycle hook.
   */
  public ngOnInit(): void {

    // Check if the browser supports WebGL.
    const hasWebGL = (typeof Detector === 'function' || Detector.webgl);
    if (!hasWebGL) {
      Detector.addGetWebGLMessage();
    }

    // Enable GzWeb as an experimental feature.
    const enabledFeature = (localStorage.getItem('experimental_gzweb') === 'true');
    this.hasGzWeb = hasWebGL && enabledFeature && (this.resourceType === 'model');
  }

  /**
   * Callback when new files are added via the input buttons.
   *
   * @param event Event containing the uploaded files.
   */
  public onFileInput(event: Event): void {
    const validFiles = [];
    const invalidFiles = [];

    const files: File[] = Array.from(event.target['files']);
    for (const file of files) {
      // Set the fullPath. Required for consistency between Chrome and Firefox browsers.
      if (file['webkitRelativePath'] === '') {
        file['fullPath'] = file['name'];
      } else {
        file['fullPath'] = file['webkitRelativePath'];
      }

      if (this.isValidFile(file)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      this.onValidFiles(validFiles);
    }

    if (invalidFiles.length > 0) {
      this.onInvalidFiles(invalidFiles);
    }

    this.ref.detectChanges();
  }

  /**
   * Callback when valid files are added by the user. It emits an event with
   * all the current files.
   *
   * @param files The new files added
   */
  public onValidFiles(files: File[]): void {
    this.fileList = this.fileList.concat(files).slice();
    this.files.emit(this.fileList);
    this.ref.detectChanges();
  }

  /**
   * Callback when invalid files are added by the user.
   *
   * @param files List of invalid files
   */
  public onInvalidFiles(files: File[]): void {
    // TODO: handle more nicely, maybe display them on a list in red
    // This event executes outside the NgZone. We need to run this inside the
    // NgZone to make the change detection work, otherwise the snackbar
    // won't be positioned correctly.
    this.zone.run(() => {
      this.snackBar.open(
        `One or more files have an unsupported type, and will not be included.\
         The allowed file types are: ${this.allowedExtensions.join(', ')}.`,
        'Got it');
    });
  }

  /**
   * Checks if the file is valid. The file extension should be whitelisted.
   *
   * @param file The file to check.
   * @returns A boolean whether the file is valid or not.
   */
  public isValidFile(file: File): boolean {
    const ext = file.name.toLowerCase().split('.').slice(1).join('.');
    return this.allowedExtensions.indexOf(ext) !== -1;
  }

  /**
   * Remove file from list. It emits an event with all the current files.
   *
   * @param file File to be removed.
   */
  public removeFile(file: File): void {
    const id = this.fileList.indexOf(file);
    if (id > -1) {
      this.fileList.splice(id, 1);
      this.fileList = this.fileList.slice();
      this.files.emit(this.fileList);
      this.ref.detectChanges();
    }
  }
}
