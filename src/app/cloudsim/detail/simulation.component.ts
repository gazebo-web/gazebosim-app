import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { DurationPipe } from './duration.pipe';
import { PageTitleComponent } from '../../page-title/page-title.component';
import { SceneManager } from 'gzweb';
import { Simulation } from '../simulation';
import { SimulationService } from '../simulation.service';

@Component({
  selector: 'gz-simulation',
  templateUrl: 'simulation.component.html',
  styleUrls: ['simulation.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    DurationPipe,
    FlexLayoutModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSelectModule,
    PageTitleComponent,
    RouterModule,
  ],
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
   * List of 3d models.
   */
  public models: any[] = [];

  /**
   * List of Sensors.
   */
  public sensorList: string[] = [];

  /**
   * List of available topics.
   */
  public availableTopics: object[] = [];

  /**
   * True if the camera is following a model
   */
  public following: boolean = false;

  /**
   * Scene of the visualization.
   */
  private sceneMgr: SceneManager;

  /**
   * True if fullscreen is enabled.
   */
  private fullscreen: boolean = false;

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
    private simulationService: SimulationService) {
  }

  /**
   * OnInit lifecycle hook.
   */
  public ngOnInit(): void {
  }

  /**
   * OnDestroy lifecycle hook.
   *
   * Makes sure the websocket connection is close and unsubscribe to the observables used.
   */
  public ngOnDestroy(): void {
  }

  /**
   * Connect to the Websocket of the Simulation.
   *
   * @param url The websocket URL.
   * @param key The authorization key to send.
   */
  public connect(url: string, key: string): void {
    this.sceneMgr = new SceneManager({
      websocketUrl: url,
      websocketKey: key,
    });
  }

  /**
   * Disconnect from the Websocket of the Simulation.
   */
  public disconnect(): void {
    this.sceneMgr.disconnect();
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
   * Reset the camera view
   */
  public resetView(): void {
    if (this.sceneMgr) {
      this.sceneMgr.resetView();
    }
  }

  /**
   * Change the width and height of the visualization upon a resize event.
   */
  public resize(): void {
    if (this.sceneMgr) {
      this.sceneMgr.resize();
    }
  }

  /**
   * Select the given model
   */
  public select(model): void {
    this.sceneMgr.select(model['gz3dName']);
  }

  /**
   * Instruct the camera to move to the given model.
   */
  public moveTo(model): void {
    this.sceneMgr.moveTo(model['gz3dName']);
  }

  /**
   * Instruct the camera to follow the given model.
   */
  public follow(model): void {
    if (model !== undefined && model !== null) {
        this.following = true;
        this.sceneMgr.follow(model['gz3dName']);
    } else {
      this.following = false;
      this.sceneMgr.follow(null);
    }
  }

  /**
   * Toggle lights
   */
  public toggleLights(): void {
  }

  /**
   * Take a snapshot of the scene.
   */
  public snapshot(): void {
  }

  /**
   * Subscribe/Unsubscribe to a Sensor topic.
   *
   * @param event The event coming from a change on the selection list.
   */
  public handleSensorSubscription(event: MatSelectionListChange): void {
  }

  /**
   * Listen to the Escape key to stop following.
   */
  @HostListener('window:keydown', ['$event'])
  private keyEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.code === 'Escape') {
      this.sceneMgr.follow(null);
    }
  }

  /**
   * Unsubscribe from observables.
   */
  private unsubscribe(): void {
  }
}
