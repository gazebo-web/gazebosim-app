import { Directive, HostListener, HostBinding, EventEmitter, Output, Input } from '@angular/core';

/**
 * Directive to handle drag-and-drop
 */
@Directive({
  selector: '[gzDnd]'
})

export class DndDirective {

  /**
   * Array of files pending to be loaded
   */
  private pendingFiles: any = [];

  /**
   * Whether this directive should be taking effect or not.
   */
  @Input() private disabled: boolean = false;

  /**
   * Array of extensions which can be dropped
   */
  @Input() private allowedExtensions: string[] = [];

  /**
   * Emits an event when new valid files were dropped.
   */
  @Output() private newValidFilesEmitter: EventEmitter<File[]> = new EventEmitter();

  /**
   * Emits an event when new invalid files were dropped.
   */
  @Output() private newInvalidFilesEmitter: EventEmitter<File[]> = new EventEmitter();

  /**
   * Local variable bound to the background style of the host.
   */
  @HostBinding('style.background') private background = 'transparent';

  /**
   * Listen to dragover events on the host.
   *
   * @param event Dragover event
   */
  @HostListener('dragover', ['$event']) public onDragOver(event): void {

    if (this.disabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // Highlight background
    this.background = '#999';
  }

  /**
   * Listen to dragleave events on the host.
   *
   * @param event Dragleave event
   */
  @HostListener('dragleave', ['$event']) public onDragLeave(event): void {

    if (this.disabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // Restore background
    this.background = 'transparent';
  }

  /**
   * Listen to drop events on the host.
   *
   * @param event Drop event
   */
  @HostListener('drop', ['$event']) public onDrop(event): void {

    if (this.disabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // Restore background
    this.background = 'transparent';

    // Traverse entry
    this.pendingFiles = [];
    for (const item of event.dataTransfer.items) {
      const entry = item.webkitGetAsEntry();
      this.pendingFiles.push(this.traverseEntry(entry));
    }

    // Once all files are traversed, emit events
    const that = this;
    this.waitForFiles()
      .then((results) => {

        // Concatenate results into valid and invalid
        let validFiles = [];
        let invalidFiles = [];
        for (const result of results) {

          if (!result || result.length !== 2) {
            continue;
          }

          validFiles = validFiles.concat(result[0]);
          invalidFiles = invalidFiles.concat(result[1]);
        }

        if (validFiles.length > 0) {
          that.newValidFilesEmitter.emit(validFiles);
        }
        if (invalidFiles.length > 0) {
          that.newInvalidFilesEmitter.emit(invalidFiles);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * Used to traverse a dropped entry
   *
   * @param entry A filesystem entry
   */
  private traverseEntry(entry: any): Promise<any> {

    if (entry.isFile) {

      // Copy fullPath
      let fullPath = entry.fullPath;
      if (fullPath.substring(0, 1) === '/') {
        fullPath = fullPath.substring(1);
      }

      return new Promise((resolve, reject) => {

        entry.file((file) => {

          // Chrome loses path information, so we need to propagate it ourselves
          file.fullPath = fullPath;

          const ext = file.name.toLowerCase().split('.').slice(1).join('.');
          if (this.allowedExtensions.lastIndexOf(ext) !== -1) {
            resolve([[file], []]);
          } else {
            resolve([[], [file]]);
          }
        });
      });
    } else {
      return new Promise((resolve, reject) => {

        const dirReader = entry.createReader();
        dirReader.readEntries((entries) => {
          for (const e of entries) {
            this.pendingFiles.push(this.traverseEntry(e));
          }
          resolve([]);
        });
      });
    }
  }

  /**
   * Returns a promise once all pending files have been traversed.
   *
   * @param resolvedPromises Promises already resolved
   */
  private waitForFiles(resolvedPromises: any = []): Promise<any> {

    const allPromises = Promise.all((resolvedPromises || []).concat(this.pendingFiles))
      .then((results) => {
         return this.pendingFiles.length
             ? this.waitForFiles(results)
             : results;
       });

    this.pendingFiles = [];

    return allPromises;
  }
}
