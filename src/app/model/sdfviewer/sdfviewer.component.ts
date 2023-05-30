import { Component, Input, OnInit, OnDestroy } from '@angular/core';

import { FuelResource } from '../../fuel-resource';
import { ModelService } from './../model.service';
import { WorldService } from './../../world/world.service';

import { AssetViewer, AssetViewerConfig } from 'gzweb';

@Component({
  selector: 'gz-sdfviewer',
  templateUrl: 'sdfviewer.component.html',
  styleUrls: ['sdfviewer.component.scss']
})

/**
 * Sdf Viewer Component uses Gzweb library to show a model or world in a 3D scene.
 */
export class SdfViewerComponent implements OnInit, OnDestroy {

  /**
   * Model or world to display.
   */
  @Input() public resource: FuelResource;

  /**
   * Number of the current version of the resource being displayed.
   */
  @Input() public currentVersion: number;

  /**
   * Gzweb's Asset Viewer reference.
   */
  public assetViewer: AssetViewer | undefined;

  /**
   * Array of URLs of the resource files.
   */
  private fileUrls: string[];

  /**
   * @param modelService Service used to get Model information from the Server.
   * @param worldService Service used to get World information from the Server.
   */
  constructor(
    private modelService: ModelService,
    private worldService: WorldService) {
  }

  /**
   * OnInit Lifecycle hook.
   */
  public ngOnInit(): void {
    const service = this.resource.type === 'models' ? this.modelService : this.worldService;

    // Get from Fuel all the URLs associated with the resource.
    this.fileUrls = this.resource.files.map((file) => {
      return service.getIndividualFileUrl(this.resource, file, this.currentVersion);
    });

    this.initializeAssetViewer();
  }

  /**
   * OnDestroy Lifecycle hook.
   *
   * Stops the animation cycle and cleans up the scene.
   */
  public ngOnDestroy(): void {
    if (this.assetViewer) {
      this.assetViewer.destroy();
    }
  }

  /**
   * Initialize Gzweb scene and adds the resource to it.
   */
  public initializeAssetViewer(): void {
    const config: AssetViewerConfig = {
      elementId: 'container',
    }

    if (this.resource.private) {
      config.token = localStorage.getItem('token');
    }

    // Models are scaled and can also use PBR Materials. On worlds, PBR materials are disabled for performance.
    if (this.resource.type === 'models') {
      config.scaleModel = true;
      config.enablePBR = true;
    }
    // Both models and worlds include special lightning.
    config.addModelLighting = true;

    this.assetViewer = new AssetViewer(config);

    this.assetViewer.renderFromFiles(this.fileUrls);
  }

  /**
   * Reset the camera to its starting pose.
   */
  public resetCameraPose(): void {
    if (this.assetViewer) {
      this.assetViewer.resetView();
    }
  }

  /**
   * Resize the 3D scene to adapt to its container size.
   */
  public resize(): void {
    if (this.assetViewer) {
      this.assetViewer.resize();
    }
  }
}
