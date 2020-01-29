import { async, inject } from '@angular/core/testing';

import { FileSizePipe } from './file-size.pipe';

describe('Pipe: FileSize', () => {
  let pipe: FileSizePipe;

  beforeEach(() => {
    pipe = new FileSizePipe();
  });

  it('should correctly convert to units', () => {
    expect(pipe.transform(512)).toBe('512 bytes');
    expect(pipe.transform(1024)).toBe('1.00 KB');
    expect(pipe.transform((1024 * 1024) + 100000)).toBe('1.10 MB');
    expect(pipe.transform(2.05 * 1024 * 1024 * 1024)).toBe('2.05 GB');
    expect(pipe.transform(2.06 * 1024 * 1024 * 1024 * 1024)).toBe('2.06 TB');
    expect(pipe.transform(2.07 * 1024 * 1024 * 1024 * 1024 * 1024)).toBe('2.07 PB');
    expect(pipe.transform(3 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024)).toBe('3072.00 PB');
  });

  it('should correctly handle invalid input', () => {
    expect(pipe.transform(parseFloat(''))).toBe('?');
    expect(pipe.transform(parseFloat('ab'))).toBe('?');
    expect(pipe.transform(NaN)).toBe('?');
    expect(pipe.transform(-1)).toBe('?');
  });

});
