import { Component,
         Input,
         OnChanges,
         OnInit,
         OnDestroy,
         SimpleChanges,
       } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { FuelResource } from '../../fuel-resource';
import { Model } from '../model';
import { ModelService } from './../model.service';
import { WorldService } from './../../world/world.service';

import {
  Box3,
  Cache,
  Vector3,
} from 'three';
declare let GZ3D: any;

@Component({
  selector: 'ign-sdfviewer',
  templateUrl: 'sdfviewer.component.html',
  styleUrls: ['sdfviewer.component.scss']
})

/**
 * Sdf Viewer Component uses GZ3D library to show a model or world in a 3D scene.
 */
export class SdfViewerComponent implements OnInit, OnChanges, OnDestroy {

  /**
   * Model or world to display.
   */
  @Input() public resource: FuelResource;

  /**
   * Number of the current version of the model being displayed.
   */
  @Input() public currentVersion: number;

  /**
   * The list of valid files held by the component.
   */
  @Input() public fileList: File[] = [];

  /**
   * GZ3D renderer container.
   */
  public sceneElement: HTMLElement;

  /**
   * GZ3D scene.
   */
  public scene: any;

  /**
   * Model 3D object
   */
  public obj: any;

  /**
   * SDF file URL
   */
  private sdfUrl: string = '';

  /**
   * GZ3D SDF parser.
   */
  private sdfParser: any;

  /**
   * Ogre Material script parser.
   */
  private ogre2json: any;

  /**
   * ID of the Request Animation Frame method. Required to cancel the animation.
   */
  private cancelAnimation: number;

  /**
   * Scaling basis value, which is used to resize models to fit within the
   * camera's view.
   */
  private scalingBasis: number = 1.0;

  /**
   * Flag to track whether object has already been moved to fit the camera.
   * This only happens after the object has been fully loaded and has a
   * valid bounding box.
   */
  private objPositioned: boolean = false;

  /**
   * @param modelService Service used to get Model information from the Server.
   * @param snackBar Used to display notifications to the user.
   * @param worldService Service used to get World information from the Server.
   */
  constructor(
    private modelService: ModelService,
    private snackBar: MatSnackBar,
    private worldService: WorldService) {
  }

  /**
   * OnInit Lifecycle hook.
   */
  public ngOnInit(): void {
    this.initializeGZ3DScene();
  }

  /**
   * OnDestroy Lifecycle hook.
   *
   * Stops the animation cycle.
   */
  public ngOnDestroy(): void {
    if (this.cancelAnimation) {
      cancelAnimationFrame(this.cancelAnimation);
    }

    if (this.scene) {
      this.scene.cleanup();
    }
  }

  /**
   * OnChanges Lifecycle hook.
   */
  public ngOnChanges(changes: SimpleChanges): void {

    if (!this.scene || !changes.fileList) {
      return;
    }

    // Remove previous object, if any
    this.scene.remove(this.obj);

    // Reset state
    Cache.clear();
    this.obj = undefined;
    this.objPositioned = false;
    this.resetCameraPose();
    this.sdfParser.meshes = [];
    this.sdfParser.mtls = [];
    this.sdfParser.materials = [];
    this.scene.meshes = [];

    // Not using URLs, using plain files
    this.sdfParser.usingFilesUrls = false;

    // Check if there is a folder prefix
    let prefix = '';
    for (const file of changes.fileList.currentValue) {

      // See if there's a prefix
      if (file.fullPath.endsWith('.sdf') && file.fullPath.indexOf('/') > 1) {
        prefix = file.fullPath.substring(0, file.fullPath.indexOf('/') + 1);
      }
    }

    // Load files
    const pendingFiles = [];
    for (const file of changes.fileList.currentValue) {

      // Remove prefix
      if (file.fullPath.indexOf(prefix) === 0) {
        file.fullPath = file.fullPath.substring(prefix.length);
      }

      // Skip unhandled files
      if (file.fullPath.indexOf('/thumbnails/') >= 0 ||
          file.name.endsWith('.config')) {
        continue;
      }

      pendingFiles.push(this.fileAsText(file));
    }

    // After all resources have been processed
    const that = this;
    Cache.enabled = true;
    Promise.all(pendingFiles)
      .then((results) => {

        // Go through all loaded files
        let sdfFile;
        for (const result of results) {

          if (result === '0') {
            that.onFileLoadFail();
          }

          const fileName = result[0];
          const fileContent = result[1];

          // Keep the last occurence of .sdf file, ignore all others
          if (fileName.toLowerCase().endsWith('.sdf')) {
            sdfFile = fileContent;
          } else if (fileName.toLowerCase().endsWith('.dae') || fileName.endsWith('.obj')) {
            that.sdfParser.meshes[fileName] = fileContent;
          } else if (fileName.toLowerCase().endsWith('.mtl')) {
            that.sdfParser.mtls[fileName] = fileContent;
          } else if (fileName.toLowerCase().endsWith('.png') ||
                     fileName.toLowerCase().endsWith('.jpg') ||
                     fileName.toLowerCase().endsWith('.jpeg')) {
                     Cache.add(fileName, fileContent);
          } else {
            console.error('Unhandled file type [', fileName, ']');
          }
        }

        if (!sdfFile) {
          return;
        }

        that.obj = that.scene.createFromSdf(sdfFile);
        if (that.obj) {
          that.scene.add(that.obj);
        } else {
          console.error('Failed to load model', sdfFile);
        }
      })
    .catch((error) => {
      this.onFileLoadFail(error);
    });
  }

  /**
   * Initialize GZ3D scene and adds the model to it.
   */
  public initializeGZ3DScene(): void {

    // Initialize GZ3D objects.
    const shaders = new GZ3D.Shaders();
    this.scene = new GZ3D.Scene(shaders);
    this.sdfParser = new GZ3D.SdfParser(this.scene);
    this.ogre2json = new GZ3D.Ogre2Json();
    // Override the entity selection. This prevents showing the model's bounding box.
    this.scene.selectEntity = () => {
      return;
    };

    // The domElement the renderer will be appended to.
    this.sceneElement = window.document.getElementById('container');
    this.sceneElement.appendChild(this.scene.renderer.domElement);
    this.resize();

    // Hide sun visual
    const sunHelper = this.scene.scene.getObjectByName('sun_lightHelper');
    if (sunHelper) {
      sunHelper.visible = false;
    }

    // Delete ground plane
    const ground = this.scene.scene.getObjectByName('ground_plane');
    if (ground) {
      this.scene.remove(ground);
    }

    // Start at strategic camera pose
    this.resetCameraPose();

    // Add model lighting.
    this.scene.addModelLighting();

    // Start rendering.
    this.animate();

    // No Fuel resource to start with
    if (!this.resource) {
      return;
    }

    // If the resource is private, pass the Authorization header to gz3d.
    if (this.resource.private) {
      const token = localStorage.getItem('token');

      this.scene.setRequestHeader('Authorization', `Bearer ${token}`);
      this.sdfParser.fuelServer.setRequestHeader('Authorization', `Bearer ${token}`);
      this.ogre2json.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    // Set usingFilesUrls to true to indicate that we will be supplying files URLs.
    this.sdfParser.usingFilesUrls = true;

    // Disable PBR materials for worlds.
    if (this.resource.type === 'worlds') {
      this.sdfParser.enablePBR = false;
    }

    // If there's a Fuel resource, push the file URLs
    const pendingMaterials = [];
    for (const file of this.resource.files) {

      let fileUrl;
      switch (this.resource.type) {
        case 'models':
          fileUrl =  this.modelService.getIndividualFileUrl(
            this.resource, file, this.currentVersion);
          break;
        case 'worlds':
          fileUrl =  this.worldService.getIndividualFileUrl(
            this.resource, file, this.currentVersion);
          break;
      }

      if (file.path.indexOf('/thumbnails/') >= 0) {
        // Skip thumbnails
        continue;
      } else if (file.path.indexOf('.material') > 0) {

        // Convert material file to json
        pendingMaterials.push(this.ogre2json.LoadFromUrl(fileUrl));
      } else if (file.path.endsWith('.sdf')) {
        // Set SDF file
        this.sdfUrl = fileUrl;
      } else {
        // Add URLs to the rest of resources
        this.sdfParser.addUrl(fileUrl);
      }
    }

    Promise.all(pendingMaterials)
      .then((results) => {
        // Check if any materials failed to be parsed.
        // ogre2json returns true if the material script was correctly parsed.
        for (const success of results) {
          if (success !== true) {
            this.onMaterialLoadFail();
            break;
          }
        }

        // In any case, we load the model with the resources available
        this.sdfParser.loadSDF(this.sdfUrl, (obj) => {
          if (!obj) {
            this.snackBar.open(`Failed load SDF.`, `Got it`, {
              duration: 2750
            });
            return;
          }

          this.obj = obj;

          // Add the object to the scene
          this.scene.add(this.obj);
        });
      })
      .catch((error) => {
        this.onMaterialLoadFail(error);
      });
  }

  /**
   * Reset camera pose
   */
  public resetCameraPose(): void {
    const cam = this.scene.camera;

    cam.position.x = this.scalingBasis * 1.1;
    cam.position.y = -this.scalingBasis * 1.4;
    cam.position.z =  this.scalingBasis * 0.6;
    cam.rotation.x = 67 * Math.PI / 180;
    cam.rotation.y = 33 * Math.PI / 180;
    cam.rotation.z = 12 * Math.PI / 180;
  }

  /**
   * Resize the 3D scene based on the DOM element's size
   */
  public resize(): void {
    this.scene.setSize(this.sceneElement.clientWidth,
                       this.sceneElement.clientHeight);
  }

  /**
   * Render the 3D scene, this function recursively calls itself in a loop.
   */
  private animate(): void {

    // Reposition object
    if (this.resource && this.resource.type === 'models' &&
        this.obj && !this.objPositioned) {

      // Get object's bounding box
      const bb = this.scene.getObjectBoundingBox(this.obj);

      // Check if bb is already valid
      if (!bb.isEmpty()) {

        // Obj's bounding box
        const size = new Vector3();
        bb.getSize(size);

        const center = new Vector3();
        bb.getCenter(center);

        const max = Math.max(size.x, size.y, size.z);

        // Choose a scaling basis value based on the bounding box.
        if (max >= 10000) {
          this.scalingBasis = 1000;
        } else if (max >= 1000) {
          this.scalingBasis = 100;
        } else if (max >= 100) {
          this.scalingBasis = 10;
        }

        // Normalize scale
        const scaling = this.scalingBasis / max;

        this.obj.scale.x = scaling;
        this.obj.scale.y = scaling;
        this.obj.scale.z = scaling;

        // Translate obj so it is centered at the origin
        center.multiplyScalar(-scaling);
        this.obj.position.x = center.x;
        this.obj.position.y = center.y;
        this.obj.position.z = center.z;

        this.objPositioned = true;
        this.resetCameraPose();
      }
    }

    this.scene.render();
    this.cancelAnimation = requestAnimationFrame(() => {
      this.animate();
    });
  }

  /**
   * Opens the snackbar indicating there was an issue loading a material.
   * @param error Optional error string.
   */
  private onMaterialLoadFail(error?: string): void {

    let msg = `Failed to parse material script.`;

    if (error) {
      msg += ` Error: ${error}`;
    }

    this.snackBar.open(msg, `Got it`, {
      duration: 2750
    });
  }

  /**
   * Opens the snackbar indicating there was an issue loading a file.
   * @param error Optional error string.
   */
  private onFileLoadFail(error?: string): void {

    let msg = `Failed to load file.`;

    if (error) {
      msg += ` Error: ${error}`;
    }

    this.snackBar.open(msg, `Got it`, {
      duration: 2750
    });
  }

  /**
   * Load a file as text
   * @param _file File to open
   */
  private fileAsText(_file: any): Promise<any> {

    const fileReader = new FileReader();

    return new Promise((resolve, reject) => {
      fileReader.onerror = () => {
        fileReader.abort();
        reject('Problem parsing input file.');
      };

      fileReader.onload = () => {

        // Textures are loaded as images
        if (_file.fullPath.endsWith('.png') ||
            _file.fullPath.endsWith('.jpg') ||
            _file.fullPath.endsWith('.jpeg')) {

          const image = document.createElementNS('http://www.w3.org/1999/xhtml',
              'img') as HTMLImageElement;
          image.src = fileReader.result as string;

          resolve([_file.fullPath, image]);
        } else {
          // Text files are loaded as is
          resolve([_file.name, fileReader.result]);
        }
      };

      if (_file.fullPath.endsWith('.png') ||
          _file.fullPath.endsWith('.jpg') ||
          _file.fullPath.endsWith('.jpeg')) {
        fileReader.readAsDataURL(_file);
      } else {
        fileReader.readAsText(_file);
      }
    });
  }
}
