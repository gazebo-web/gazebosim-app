import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { Simulation } from '../simulation';
import { SimulationService } from '../simulation.service';
import { Topic } from '../websocket/topic';
import { WebsocketService } from '../websocket/sim-websocket.service';

declare let GZ3D: any;

@Component({
  selector: 'ign-simulation',
  templateUrl: 'simulation.component.html',
  styleUrls: ['simulation.component.scss']
})

/**
 * Simulation Component contains the details of a simulation and its visualization.
 */
export class SimulationComponent implements OnInit, OnDestroy {

  /**
   * The simulation this component represents.
   */
  public simulation: Simulation;

  /**
   * The real time of the simulation, obtained from the Websocket.
   */
  public realTime: number;

  /**
   * The simulation time obtained from the Websocket.
   */
  public simTime: number;

  /**
   * The simulation real time factor, obtained from the Websocket.
   */
  public realTimeFactor: number;

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
   * Scene of the visualization.
   */
  private scene: any;

  /**
   * The container of the GZ3D scene.
   */
  private sceneElement: HTMLElement;

  /**
   * Gz3D SDF parser used to build the models for the scene.
   */
  private sdfParser: any;

  /**
   * ID of the Request Animation Frame method. Required to cancel the animation.
   */
  private cancelAnimation: number;

  /**
   * List of 3d models.
   */
  private models: any[] = [];

  /**
   * True if the camera is following a model
   */
  private following: boolean = false;

  /**
   * Reference to the <div> that can be toggled fullscreen.
   */
  @ViewChild('fullScreen') private divRef;

  /**
   * @param activatedRoute The current Activated Route to get the associated data.
   * @param simulationService The service used to get the Simulation's websocket data.
   * @param ws The Websocket Service used to get data from a Simulation.
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    public snackBar: MatSnackBar,
    private simulationService: SimulationService,
    private ws: WebsocketService) {
  }

  /**
   * OnInit lifecycle hook.
   */
  public ngOnInit(): void {

    // Get the simulation from the Activated Route's resolved data.
    if (this.activatedRoute.snapshot.data['resolvedData'] !== undefined) {
      this.simulation = this.activatedRoute.snapshot.data['resolvedData'];
    }

    // Connect the Websocket only if the simulation is running.
    if (this.simulation.isRunning()) {
      this.simulationService.getSimulationWebsocket(this.simulation.groupId).subscribe(
        (wsInfo) => {
          const url = `wss://${wsInfo['websocket_address']}`;
          const key = wsInfo['authorization_token'];

          this.connect(url, key);
        },
        (error) => {
          this.snackBar.open(error.message, 'Got it');
        }
      );
    }
  }

  /**
   * OnDestroy lifecycle hook.
   *
   * Makes sure the websocket connection is close and unsubscribe to the observables used.
   */
  public ngOnDestroy(): void {
    this.disconnect();

    if (this.cancelAnimation) {
      cancelAnimationFrame(this.cancelAnimation);
    }
  }

  /**
   * Connect to the Websocket of the Simulation.
   *
   * @param url The websocket URL.
   * @param key The authorization key to send.
   */
  public connect(url: string, key: string) {
    // Avoid multiple connections.
    this.disconnect();

    this.ws.connect(url, key);

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

        // Subscribe to the World Stats, to get Clock data.
        const statsTopic: Topic = {
          name: `/world/${this.ws.getWorld()}/stats`,
          cb: (msg) => {
            this.realTime = msg['real_time']['sec'];
            this.simTime = msg['sim_time']['sec'];
            this.realTimeFactor = msg['real_time_factor'];
          }
        };
        this.ws.subscribe(statsTopic);
      }
    });

    // Scene information.
    this.sceneInfoSubscription = this.ws.sceneInfo$.subscribe((sceneInfo) => {
      if (!sceneInfo) {
        return;
      }

      this.startVisualization();

      sceneInfo['model'].forEach((model) => {
        const modelObj = this.sdfParser.spawnFromObj({ model });
        model['gz3dName'] = modelObj.name;
        this.models.push(model);
        this.scene.add(modelObj);
      });
    });
  }

  /**
   * Disconnect from the Websocket of the Simulation.
   */
  public disconnect() {
    this.ws.disconnect();
    this.connectionStatus = 'Disconnected';
    this.unsubscribe();
  }

  /**
   * Setup the visualization scene.
   */
  public setupVisualization() {
    this.scene = new GZ3D.Scene(new GZ3D.Shaders());
    this.sdfParser = new GZ3D.SdfParser(this.scene);
    this.sdfParser.usingFilesUrls = true;

    this.sceneElement = window.document.getElementById('scene');
    this.sceneElement.appendChild(this.scene.renderer.domElement);

    this.resize();
  }

  /**
   * Start the visualization.
   */
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
   * Make the 3D viewport fullscreen
   */
  private openFullscreen() {
    const elem = this.divRef.nativeElement;

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    }
  }

  /**
   * Reset the camera view
   */
  private resetView() {
    this.scene.resetView();
  }

  /**
   * Change the width and height of the visualization upon a resize event.
   */
  private resize() {
    this.scene.setSize(this.sceneElement.clientWidth, this.sceneElement.clientHeight);
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

  /**
   * Select the given model
   */
  private select(model) {
    this.scene.emitter.emit('select_entity', model['gz3dName']);
  }

  /**
   * Instruct the camera to move to the given model.
   */
  private moveTo(model) {
    this.scene.emitter.emit('move_to_entity', model['gz3dName']);
  }

  /**
   * Instruct the camera to follow the given model.
   */
  private follow(model) {
    if (model !== undefined && model !== null) {
        this.following = true;
        this.scene.emitter.emit('follow_entity', model['gz3dName']);
    } else {
      this.following = false;
      this.scene.emitter.emit('follow_entity', null);
    }
  }
}
