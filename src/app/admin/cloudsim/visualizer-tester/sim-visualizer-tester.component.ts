import { Component, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { MatSelectionListChange } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { ImageTopic } from '../../../cloudsim/websocket/imageTopic';
import { PointCloudTopic } from '../../../cloudsim/websocket/pointCloudTopic';
import { Topic } from '../../../cloudsim/websocket/topic';
import { WebsocketService } from '../../../cloudsim/websocket/sim-websocket.service';

declare let GZ3D: any;
declare let THREE: any;

@Component({
  selector: 'gz-sim-visualizer',
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
  public availableTopics: object[] = [];

  /**
   * List of subscribed topics. Used to toggle the button state of the template.
   *
   * This is for Admins to easily debug topics.
   */
  public subscribedTopics: string[] = [];

  /**
   * The Websocket URL to connect to.
   * A simulation should expose a URL to connect to. For testing purposes, we can provide one here.
   */
  public wsUrl: string = 'ws://localhost:9002';

  /**
   * The Authorization Key to use.
   */
  public authKey: string = '';

  /**
   * List of 3d models.
   */
  public models: any[] = [];

  /**
   * List of Sensors.
   */
  public sensorList: string[] = [];

  /**
   * True if the camera is following a model
   */
  public following: boolean = false;

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
   * A sun directional light for global illumination
   */
  private sunLight: object;

  /**
   * The container of the GZ3D scene.
   */
  private sceneElement: HTMLElement;

  /**
   * True if fullscreen is enabled.
   */
  private fullscreen: boolean = false;

  /**
   * Reference to the <div> that can be toggled fullscreen.
   */
  @ViewChild('fullScreen') private divRef;

  /**
   * @param snackbar Snackbar used to show notifications.
   * @param ws The Websocket Service used to get data from a Simulation.
   */
   constructor(
     public snackBar: MatSnackBar,
     public ws: WebsocketService) {
  }

  /**
   * On Destroy lifecycle hook used to make sure the websocket connection is terminated.
   */
  public ngOnDestroy(): void {
    this.disconnect();

    if (this.cancelAnimation) {
      cancelAnimationFrame(this.cancelAnimation);
    }

    if (this.scene) {
      this.scene.cleanup();
    }
  }

  /**
   * Connect to the Websocket of the Simulation.
   */
  public connect(): void {
    // Avoid multiple connections.
    this.disconnect();

    this.ws.connect(this.wsUrl, this.authKey);

    // Websocket Connection status.
    this.statusSubscription = this.ws.status$.subscribe((response) => {

      if (response === 'Error') {
        this.snackBar.open('Connection failed. Please contact an administrator.', 'Got it');
      }

      this.connectionStatus = response;

      // We can start setting up the visualization after we are Connected.
      // We still don't have scene and world information at this step.
      if (response === 'Connected') {
        this.setupVisualization();
      }

      // Once the status is Ready, we have the world and scene information available.
      if (response === 'Ready') {
        // Get the list of topics.
        this.getAvailableTopics();

        // Subscribe to the pose topic and modify the models' poses.
        const poseTopic: Topic = {
          name: `/world/${this.ws.getWorld()}/dynamic_pose/info`,
          cb: (msg) => {
            msg['pose'].forEach((pose) => {
              // Objects created by Gz3D have an unique name, which is the name plus the id.
              const entity = this.scene.getByProperty('uniqueName', `${pose['name']}${pose['id']}`);

              if (entity) {
                this.scene.setPose(entity, pose.position, pose.orientation);
              }
            });
          }
        };

        this.ws.subscribe(poseTopic);

        // create a sun light
        this.sunLight = this.scene.createLight(3,
          new THREE.Color(0.8, 0.8, 0.8), 0.9,
          {position: {x: 0, y: 0, z: 10},
           orientation: {x: 0, y: 0, z: 0, w: 1}},
          null, true, 'sun', {x: 0.5, y: 0.1, z: -0.9});

        this.scene.add(this.sunLight);
        this.scene.ambient.color = new THREE.Color(0x666666);

        // Subscribe to the 'scene/info' topic which sends scene changes.
        const sceneTopic: Topic = {
          name: `/world/${this.ws.getWorld()}/scene/info`,
          cb: (sceneInfo) => {
            if (!sceneInfo) {
              return;
            }

            // Process each model in the scene.
            sceneInfo['model'].forEach((model) => {

              // Check to see if the model already exists in the scene. This
              // could happen when a simulation level is loaded multiple times.
              let foundIndex = -1;
              for (let i = 0; i < this.models.length; ++i) {
                // Simulation enforces unique names between models. The ID
                // of a model may change. This occurs when levels are loaded,
                // unloaded, and then reloaded.
                if (this.models[i]['name'] === model['name']) {
                  foundIndex = i;
                  break;
                }
              }

              // If the model was not found, then add the new model. Otherwise
              // update the models ID and gz3dName.
              if (foundIndex < 0) {
                const entity = this.scene.getByName();
                const modelObj = this.sdfParser.spawnFromObj({ model }, { enableLights: false });
                model['gz3dName'] = modelObj.name;
                this.models.push(model);
                this.scene.add(modelObj);
              }
            });
          }
        };

        this.ws.subscribe(sceneTopic);

        // Record topics that publish sensor data, to display in the entity list.
        this.availableTopics.forEach(pub => {
          if (pub['msg_type'] === 'ignition.msgs.PointCloudPacked' ||
              pub['msg_type'] === 'ignition.msgs.Image' ||
              pub['msg_type'] === 'gazebo.msgs.PointCloudPacked' ||
              pub['msg_type'] === 'gazebo.msgs.Image') {

            this.sensorList.push(pub['topic']);
          }
        });
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
        const modelObj = this.sdfParser.spawnFromObj({ model }, { enableLights: false });

        model['gz3dName'] = modelObj.name;
        this.models.push(model);
        this.scene.add(modelObj);
      });

      sceneInfo['light'].forEach((light) => {
        const lightObj = this.sdfParser.spawnLight(light);
        this.scene.add(lightObj);
      });

      // Set the ambient color, if present
      if (sceneInfo['ambient'] !== undefined &&
          sceneInfo['ambient'] !== null) {
        this.scene.ambient.color = new THREE.Color(
          sceneInfo['ambient']['r'],
          sceneInfo['ambient']['g'],
          sceneInfo['ambient']['b']);
      }
    });
  }

  /**
   * Disconnect from the Websocket of the Simulation.
   */
  public disconnect(): void {
    this.ws.disconnect();
    this.availableTopics = [];
    this.models = [];
    this.sensorList = [];
    this.sceneInfo = null;
    this.connectionStatus = 'Disconnected';
    this.unsubscribe();

    // Remove the canvas. Helpful to disconnect and connect several times.
    this.sceneElement = window.document.getElementById('scene');
    if (this.sceneElement && this.sceneElement.childElementCount > 0) {
      this.sceneElement.removeChild(this.scene.renderer.domElement);
    }
  }

  /**
   * Subscribe to a topic.
   *
   * This is for Admins to easily debug topics. The response is logged in the console.
   *
   * @param topic The name of the topic to subscribe.
   */
  public toggleSubscription(topicName: string): void {
    const topics = this.ws.getSubscribedTopics();
    if (topics.has(topicName)) {
      this.subscribedTopics = this.subscribedTopics.filter((name) => name !== topicName);
      this.ws.unsubscribe(topicName);
    } else {
      const topic: Topic = {
        name: topicName,
        cb: (msg) => this.genericCallback(msg)
      };
      this.subscribedTopics.push(topicName);
      this.ws.subscribe(topic);
    }
  }

  /**
   * Get the available topics from the Websocket Service.
   *
   * This is for Admins to easily debug topics.
   */
  public getAvailableTopics(): void {
    this.availableTopics = this.ws.getAvailableTopics();
  }

  /**
   * Setup the visualization scene.
   */
  public setupVisualization(): void {
    this.scene = new GZ3D.Scene(new GZ3D.Shaders());
    this.sdfParser = new GZ3D.SdfParser(this.scene);
    this.sdfParser.usingFilesUrls = true;

    this.sceneElement = window.document.getElementById('scene');
    this.sceneElement.appendChild(this.scene.renderer.domElement);

    this.scene.setSize(this.sceneElement.clientWidth, this.sceneElement.clientHeight);
  }

  /**
   * Start the visualization.
   */
  public startVisualization(): void {
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
   * Select the given model
   */
  public select(model): void {
    this.scene.emitter.emit('select_entity',  model['gz3dName']);
  }

  /**
   * Instruct the camera to move to the given model.
   */
  public moveTo(model): void {
    this.scene.emitter.emit('move_to_entity', model['gz3dName']);
  }

  /**
   * Instruct the camera to follow the given model.
   */
  public follow(model): void {
    if (model !== undefined && model !== null) {
        this.following = true;
        this.scene.emitter.emit('follow_entity', model['gz3dName']);
    } else {
      this.following = false;
      this.scene.emitter.emit('follow_entity', null);
    }
  }

  /**
   * Make the 3D viewport fullscreen
   */
  public toggleFullscreen(): void {
    const elem = this.divRef.nativeElement;

    if (!this.fullscreen) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }
    } else {
      const docWithBrowsersExitFunctions = document as Document & {
        mozCancelFullScreen(): Promise<void>;
        webkitExitFullscreen(): Promise<void>;
        msExitFullscreen(): Promise<void>;
      };

      if (docWithBrowsersExitFunctions.exitFullscreen) {
        docWithBrowsersExitFunctions.exitFullscreen();
      } else if (docWithBrowsersExitFunctions.msExitFullscreen) {
        docWithBrowsersExitFunctions.msExitFullscreen();
      } else if (docWithBrowsersExitFunctions.mozCancelFullScreen) {
        docWithBrowsersExitFunctions.mozCancelFullScreen();
      } else if (docWithBrowsersExitFunctions.webkitExitFullscreen) {
        docWithBrowsersExitFunctions.webkitExitFullscreen();
      }
    }
    this.fullscreen = !this.fullscreen;
  }

  /**
   * Change the width and height of the visualization upon a resize event.
   */
  public resize(): void {
    if (this.scene) {
      this.scene.setSize(this.sceneElement.clientWidth, this.sceneElement.clientHeight);
    }
  }

  /**
   * Reset the camera view
   */
  public resetView(): void {
    this.scene.resetView();
  }

  /**
   * Toggle lights
   */
  public toggleLights(): void {
    // Return if the light has not been created yet.
    if (this.sunLight === null || this.sunLight === undefined) {
      return;
    }

    this.sunLight['visible'] = !this.sunLight['visible'];

    // Toggle ambient light
    if (this.sunLight['visible']) {
      this.scene.ambient.color = new THREE.Color(0x666666);
    } else {
      this.scene.ambient.color = new THREE.Color(0x191919);
    }

    for (const model of this.models) {
      this.scene.toggleLights(model['gz3dName']);
    }
  }

  /**
   * Subscribe/Unsubscribe to a Sensor topic.
   *
   * @param event The event coming from a change on the selection list.
   */
  public handleSensorSubscription(event: MatSelectionListChange): void {
    // We don't provide a way to select multiple options at once, so there is only one element.
    const option = event.options[0];
    const topics = this.ws.getSubscribedTopics();
    const topicStr = option.value;

    // Subscribe.
    if (option.selected && !topics.has(topicStr)) {
      const publisher = this.availableTopics.filter(pub => pub['topic'] === topicStr)[0];

      // Verify type.
      if (publisher['msg_type'] === 'ignition.msgs.PointCloudPacked' ||
          publisher['msg_type'] === 'gazebo.msgs.PointCloudPacked') {
        const topic = new PointCloudTopic(topicStr, this.scene);
        this.ws.subscribe(topic);
        this.ws.throttle(topic, 1);
      }
      else if (publisher['msg_type'] === 'ignition.msgs.Image' ||
               publisher['msg_type'] === 'gazebo.msgs.Image') {
        // create new image element and append it to image streams container
        const imageContainer =
            window.document.getElementById('image-streams');
        const topic = new ImageTopic(topicStr, imageContainer);
        this.ws.subscribe(topic);
      }
    }

    // Unsubscribe.
    if (!option.selected && topics.has(topicStr)) {
      this.ws.unsubscribe(topicStr);
    }
  }

  /**
   * Take a snapshot of the scene.
   */
  public snapshot(): void {
    this.scene.saveScreenshot(this.ws.getWorld());
  }

  /**
   * Listen to the Escape key to stop following.
   */
  @HostListener('window:keydown', ['$event'])
  private keyEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.code === 'Escape') {
      this.following = false;
      this.scene.emitter.emit('follow_entity', null);
    }
  }

  /**
   * The topic callback function will be called by the Websocket Service.
   * Each topic we subscribe to should provide it's own callback function.
   *
   * @param msg The message we get from the websocket.
   */
  private genericCallback(msg: any): void {
    console.log(msg);
  }

  /**
   * Unsubscribe from observables.
   */
  private unsubscribe(): void {
    if (this.sceneInfoSubscription) {
      this.sceneInfoSubscription.unsubscribe();
    }

    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }
}
