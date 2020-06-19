import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { WebsocketService } from '../../../cloudsim/websocket/sim-websocket.service';
import { Topic } from '../../../cloudsim/websocket/topic';

declare let GZ3D: any;
declare let THREE: any;

@Component({
  selector: 'ign-sim-visualizer',
  templateUrl: 'sim-visualizer-tester.component.html',
  styleUrls: ['sim-visualizer-tester.component.scss']
})

/**
 * Admin-related Component to test the Simulation Visualizer.
 */
export class SimVisualizerComponent implements OnDestroy {

  /**
   * Subscription for status updates.
   */
  public statusSubscription: Subscription;

  /**
   * Scene Information updates.
   */
  public sceneInfoSubscription: Subscription;

  /**
   * Connection status from the Websocket.
   */
  public connectionStatus: string = 'Disconnected';

  /**
   * Scene information obtained from the Websocket.
   */
  public sceneInfo: object;

  /**
   * List of available topics.
   */
  public availableTopics: string[] = [];

  /**
   * The Websocket URL to connect to.
   * A simulation should expose a URL to connect to. For testing purposes, we can provide one here.
   */
  public wsUrl: string = 'ws://localhost:9002';

  /**
   * The Authorization Key to use.
   */
  public authKey: string = 'auth_key';

  /**
   * Gz3D Scene.
   */
  private scene: any;

  /**
   * Gz3D SDF parser.
   */
  private sdfParser: any;

  /**
   * ID of the Request Animation Frame method. Required to cancel the animation.
   */
  private cancelAnimation: number;

  /**
   * @param ws The Websocket Service used to get data from a Simulation.
   */
  constructor(private ws: WebsocketService) {
  }

  /**
   * On Destroy lifecycle hook used to make sure the websocket connection is terminated.
   */
  public ngOnDestroy() {
    this.disconnect();

    if (this.cancelAnimation) {
      cancelAnimationFrame(this.cancelAnimation);
    }
  }

  /**
   * Connect to the Websocket of the Simulation.
   */
  public connect() {
    // Avoid multiple connections.
    this.disconnect();

    this.ws.connect(this.wsUrl, this.authKey);

    // Websocket Connection status.
    this.statusSubscription = this.ws.status$.subscribe((response) => {
      this.connectionStatus = response;

      // We can start setting up the visualization after we are Connected.
      // We still don't have scene and world information at this step.
      if (response === 'Connected') {
        this.setupVisualization();
      }

      // Once the status is Ready, we have the world and scene information available.
      if (response === 'Ready') {
        // Subscribe to the pose topic and modify the models' poses.
        const poseTopic: Topic = {
          name: `/world/${this.ws.getWorld()}/dynamic_pose/info`,
          cb: (msg) => {
            msg['pose'].forEach((pose) => {
              // Objects created by Gz3D have an unique name, which is the name plus the id.
              const entity = this.scene.getByName(`${pose['name']}${pose['id']}`);

              if (entity) {
                this.scene.setPose(entity, pose.position, pose.orientation);
              }
            });
          }
        };

        this.ws.subscribe(poseTopic);
      }
    });

    // Scene information.
    this.sceneInfoSubscription = this.ws.sceneInfo$.subscribe((sceneInfo) => {
      if (!sceneInfo) {
        return;
      }

      this.sceneInfo = sceneInfo;
      this.startVisualization();

      sceneInfo['model'].forEach((model) => {
        const modelObj = this.sdfParser.spawnFromObj({ model });
        this.scene.add(modelObj);
      });
    });
  }

  /**
   * Disconnect from the Websocket of the Simulation.
   */
  public disconnect() {
    this.ws.disconnect();
    this.availableTopics = [];
    this.sceneInfo = null;
    this.connectionStatus = 'Disconnected';
    this.unsubscribe();

    // Remove the canvas. Helpful to disconnect and connect several times.
    const container = window.document.getElementById('scene');
    if (container.childElementCount > 0) {
      container.removeChild(this.scene.renderer.domElement);
    }
  }

  /**
   * Subscribe to a topic.
   *
   * This is for Admins to easily debug topics. The response is logged in the console.
   *
   * @param topic The name of the topic to subscribe.
   */
  public subscribe(topicName: string) {
    const topic: Topic = {
      name: topicName,
      cb: (msg) => this.genericCallback(msg)
    };
    this.ws.subscribe(topic);
  }

  /**
   * Get the available topics from the Websocket Service.
   *
   * This is for Admins to easily debug topics.
   */
  public getAvailableTopics() {
    this.availableTopics = this.ws.getAvailableTopics();
  }

  /**
   * Setup the visualization scene.
   */
  public setupVisualization() {
    this.scene = new GZ3D.Scene(new GZ3D.Shaders());
    this.sdfParser = new GZ3D.SdfParser(this.scene);
    this.sdfParser.usingFilesUrls = true;

    const sceneContainer = window.document.getElementById('scene');
    sceneContainer.appendChild(this.scene.renderer.domElement);

    this.scene.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
  }

  public startVisualization() {
    // Render loop.
    const animate = () => {
      this.scene.render();
      this.cancelAnimation = requestAnimationFrame(() => {
        animate();
      });
    };

    animate();
  }

  /**
   * The topic callback function will be called by the Websocket Service.
   * Each topic we subscribe to should provide it's own callback function.
   *
   * @param msg The message we get from the websocket.
   */
  private genericCallback(msg: any) {
    console.log(msg);
  }

  /**
   * Unsubscribe from observables.
   */
  private unsubscribe() {
    if (this.sceneInfoSubscription) {
      this.sceneInfoSubscription.unsubscribe();
    }

    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }
}
