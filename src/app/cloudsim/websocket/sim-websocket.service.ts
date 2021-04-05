import { Injectable } from '@angular/core';
import { Root, Type, parse } from 'protobufjs';
import { BehaviorSubject, Subject } from 'rxjs';
import { Topic } from './topic';

// Note: Required for Angular 5. Newer versions don't require the declaration.
declare const TextDecoder: any;

@Injectable()

/**
 * The Websocket service is in charge of managing the websocket connection to a simulation.
 *
 * The component that uses it needs to connect and subscribe to a Topic.
 */
export class WebsocketService {

  /**
   * Status connection behavior subject.
   * Components can subscribe to it to get connection status updates.
   * Uses a Behavior Subject because it has an initial state and stores a value.
   */
  public status$ = new BehaviorSubject<string>('Disconnected');

  /**
   * Scene Information behavior subject.
   * Components can subscribe to it to get the scene information once it is obtained.
   */
  public sceneInfo$ = new BehaviorSubject<object>(null);

  /**
   * The Websocket object.
   */
  private ws: WebSocket;

  /**
   * The root namespace should be obtained from the Websocket upon connection.
   */
  private root: Root;

  /**
   * List of available topics.
   *
   * Array of objects containing {topic, msg_type}.
   */
  private availableTopics: object[] = [];

  /**
   * Map of the subscribed topics.
   * - Key: The topic name.
   * - Value: The Topic object, which includes the callback.
   *
   * New subscriptions should be added to this map, in order to correctly derive the messages
   * received.
   */
  private topicMap = new Map<string, Topic>();

  /**
   * The world that is being used in the Simulation.
   */
  private world: string;

  /**
   * Connects to a websocket.
   *
   * @param url The url to connect to.
   * @param key Optional. A key to authorize access to the websocket messages.
   */
  public connect(url: string, key?: string): void {
    // First, disconnect from previous connections.
    // This way we make sure that we only support one websocket connection.
    this.disconnect();

    // Create the Websocket interface.
    this.ws = new WebSocket(url);

    // Set the handlers of the websocket events.
    this.ws.onopen = () => this.onOpen(key);
    this.ws.onclose = () => this.onClose();
    this.ws.onmessage = (msgEvent) => this.onMessage(msgEvent);
    this.ws.onerror = (errorEvent) => this.onError(errorEvent);
  }

  /**
   * Disconnects from a websocket.
   * Note: The cleanup should be done in the onclose event of the Websocket.
   */
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
  }

  /**
   * Subscribe to a topic.
   *
   * @param topic The topic to subscribe to.
   */
  public subscribe(topic: Topic): void {
    this.topicMap.set(topic.name, topic);

    this.ws.send(this.buildMsg(['sub', topic.name, '', '']));
  }

  /**
   * Return the list of available topics.
   *
   * @returns The list of topics that can be subscribed to.
   */
  public getAvailableTopics(): object[] {
    return this.availableTopics;
  }

  /**
   * Return the list of subscribed topics.
   *
   * @returns The list of topics that we are currently subscribed to.
   */
  public getSubscribedTopics(): string[] {
    return Array.from(this.topicMap.keys());
  }

  /**
   * Return the world.
   *
   * @returns The name of the world the websocket is connected to.
   */
  public getWorld(): string {
    return this.world;
  }

  /**
   * Handler for the open event of a Websocket.
   *
   * @param key Optional. A key to authorize access to the websocket messages.
   */
  private onOpen(key?: string): void {
    // An authorization key could be required to request the message definitions.
    if (key) {
      this.ws.send(this.buildMsg(['auth', '', '', key]));
    } else {
      this.ws.send(this.buildMsg(['protos', '', '', '']));
    }
  }

  /**
   * Handler for the close event of a Websocket.
   *
   * Cleanup the connections.
   */
  private onClose(): void {
    this.topicMap.clear();
    this.availableTopics = [];
    this.root = null;
    this.status$.next('Disconnected');
    this.sceneInfo$.next(null);
  }

  /**
   * Handler for the message event of a Websocket.
   *
   * Parses message responses from Ignition and sends to the corresponding topic.
   */
  private onMessage(event: MessageEvent): void {
    // If there is no Root, then handle authentication and the message definitions.
    const fileReader = new FileReader();
    if (!this.root) {
      fileReader.onloadend = () => {
        const content = fileReader.result as string;

        // Handle the response.
        switch (content) {
          case 'authorized':
            // Get the message definitions.
            this.ws.send(this.buildMsg(['protos', '', '', '']));
            break;
          case 'invalid':
            // TODO(germanmas) Throw a proper Unauthorized error.
            console.error('Invalid key');
            break;
          default:
            // Parse the message definitions.
            this.root = parse(fileReader.result as string, {keepCase: true}).root;

            // Request topics.
            this.ws.send(this.buildMsg(['topics-types', '', '', '']));

            // Request world information.
            this.ws.send(this.buildMsg(['worlds', '', '', '']));

            // Now we can update the connection status.
            this.status$.next('Connected');
            break;
        }
      };

      fileReader.readAsText(event.data);
      return;
    }

    fileReader.onloadend = () => {
      // Return if at any point, the websocket connection is lost.
      if (this.status$.getValue() === 'Disconnected') {
        return;
      }

      // Decode as UTF-8 to get the header.
      const str = new TextDecoder('utf-8').decode(fileReader.result as BufferSource);
      const frameParts = str.split(',');
      const msgType = this.root.lookup(frameParts[2]) as Type;
      const buffer = new Uint8Array(fileReader.result as ArrayBuffer);

      // Decode the Message. The "+3" in the slice accounts for the commas in the frame.
      const msg = msgType.decode(buffer.slice(
        frameParts[0].length + frameParts[1].length + frameParts[2].length + 3
      ));

      // Handle actions and messages.
      switch (frameParts[1]) {
        case 'topics-types':
          for (const pub of msg['publisher']) {
            this.availableTopics.push(pub);
          }
          break;
        case 'topics':
          this.availableTopics = msg['data'];
          break;
        case 'worlds':
          // The world name needs to be used to get the scene information.
          this.world = msg['data'][0];
          this.ws.send(this.buildMsg(['scene', this.world, '', '']));
          break;
        case 'scene':
          // Emit the scene information. Contains all the models used.
          this.sceneInfo$.next(msg);

          // Once we received the Scene Information, we can start working.
          // We emit the Ready status to reflect this.
          this.status$.next('Ready');
          break;
        default:
          // Message from a subscribed topic. Get the topic and execute its callback.
          this.topicMap.get(frameParts[1]).cb(msg);
          break;
      }
    };

    // Read the blob data as an array buffer.
    fileReader.readAsArrayBuffer(event.data);
    return;
  }

  /**
   * Handler for the error event of a Websocket.
   */
  private onError(event: Event): void {
    this.status$.next('Error');
    this.disconnect();
    console.error(event);
  }

  /**
   * Helper function to build a message.
   * The message is a comma-separated string consisting in four parts:
   * 1. Operation
   * 2. Topic name
   * 3. Message type
   * 4. Payload
   */
  private buildMsg(parts: string[]): string {
    return parts.join(',');
  }
}
