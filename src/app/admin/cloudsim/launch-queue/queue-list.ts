import { QueueElement } from './queue-element';

/**
 * Represents the list of elements from the queue.
 */
export class QueueList {
  /**
   * The actual data from the queue.
   */
  public data: QueueElement[];

  /**
   * The total count of elements from the queue.
   * X-Total-Count header value.
   */
  public totalCount: number;

  /**
   * Initializes a QueueList
   * @param elements the elements from the queue
   */
  constructor(elements?: string[]) {
    this.data = [];
    this.totalCount = 0;

    if (!elements) {
      return;
    }

    let el: string;
    for (el of elements) {
      this.data.push({
        groupId: el,
      });
    }
  }
}
