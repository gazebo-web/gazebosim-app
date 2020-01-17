import { Pipe, PipeTransform } from '@angular/core';

/*
 * Convert bytes into largest possible unit.
 * Takes an precision argument that defaults to 2.
 * Usage:
 *   bytes | fileSize:precision
 * Example:
 *   {{ 1024 |  fileSize}}
 *   formats to: 1 KB
 *
 * Based on gist:
 * https://gist.github.com/JonCatmull/ecdf9441aaa37336d9ae2c7f9cb7289a
*/
@Pipe({name: 'ignFileSize'})
export class FileSizePipe implements PipeTransform {

  /**
   * List of allowed units.
   */
  private units = [
    'bytes',
    'KB',
    'MB',
    'GB',
    'TB',
    'PB'
  ];

  /**
   * Implementation of the PipeTransform interface.
   * Transforms a number of bytes into the largest posible unit.
   *
   * @param bytes The bytes to transform.
   * @param precision The number of decimal places of the result.
   * @returns The bytes in the largest posible unit.
   */
  public transform(bytes: number = 0, precision: number = 2 ): string {
    if (isNaN(parseFloat(String(bytes))) || !isFinite(bytes) || bytes < 0) {
      return '?';
    }

    let unit = 0;
    const maxUnitIndex = this.units.length - 1;

    while (bytes >= 1024 && unit < maxUnitIndex) {
      bytes /= 1024;
      unit++;
    }
    if (unit === 0) {
      precision = 0;
    }

    return bytes.toFixed(+precision) + ' ' + this.units[unit];
  }
}
