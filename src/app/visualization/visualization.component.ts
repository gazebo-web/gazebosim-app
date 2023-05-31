import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { SceneManager } from 'gzweb';

@Component({
  selector: 'gz-visualization',
  templateUrl: 'visualization.component.html',
  styleUrls: ['visualization.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FlexLayoutModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    ReactiveFormsModule,
  ],
})

/**
 * Visualization component support visualization of simulation instances.
 *
 */
export class VisualizationComponent implements OnDestroy {
  /**
   * Connection status from the Websocket.
   */
  public connectionStatus: string = 'disconnected';

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
   * True if the camera is following a model
   */
  public following: boolean = false;

  /**
   * GZ scene manager.
   */
  public sceneMgr: SceneManager;

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
     public snackBar: MatSnackBar) {
  }

  /**
   * On Destroy lifecycle hook used to make sure the websocket connection is terminated.
   */
  public ngOnDestroy(): void {
    this.sceneMgr.disconnect();
  }

  /**
   * Connect to the Websocket of the Simulation.
   */
  public connect(): void {
    this.sceneMgr = new SceneManager({
      websocketUrl: this.wsUrl,
      websocketKey: this.authKey,
    });
    this.connectionStatus = 'connected';
  }

  /**
   * Disconnect from the Websocket of the Simulation.
   */
  public disconnect(): void {
    this.sceneMgr.disconnect();
    this.connectionStatus = 'disconnected';
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
    if (this.sceneMgr) {
      this.sceneMgr.resize();
    }
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
   * Take a snapshot of the scene.
   */
  public snapshot(): void {
    if (this.sceneMgr) {
      this.sceneMgr.snapshot();
    }
  }

  /**
   * Listen to the Escape key to stop following.
   */
  @HostListener('window:keydown', ['$event'])
  private keyEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.code === 'Escape') {
      this.sceneMgr.follow('follow_entity', null);
    }
  }
}
