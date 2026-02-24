import { PipeTransform, Pipe } from '@angular/core';

/**
 * Pipe used to display the runtime of a simulation in HH:mm:ss.
 */
@Pipe({
  name: 'gzDuration',
  standalone: true,
})
export class DurationPipe implements PipeTransform {

  /**
   * Transform method of the Pipe.
   * Takes the number of seconds and transforms into a string.
   *
   * @param sec The number of seconds.
   * @returns A formatted string with the time duration.
   */
  public transform(sec: number): string {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec - hours * 3600) / 60);
    const secondsLeft = sec - (minutes * 60) - (hours * 3600);
    const minutesDisplay = minutes >= 10 ? minutes : '0' + minutes;
    const secondsDisplay = secondsLeft >= 10 ? secondsLeft : '0' + secondsLeft;
    return `${hours}:${minutesDisplay}:${secondsDisplay}`;
  }
}
