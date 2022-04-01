import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { FuelResource, FuelResourceService } from '../../../fuel-resource';
import { ModelService } from '../../model.service';
import { WorldService } from '../../../world/world.service';

declare let GZ3D: any;
declare let THREE: any;

@Component({
  selector: 'gz-thumbnail-generator',
  templateUrl: 'thumbnail-generator.component.html',
  styleUrls: ['thumbnail-generator.component.scss']
})

/**
 * Thumbnail Generator Component is in charge of rendering a model or world and generating
 * the thumbnails.
 */
export class ThumbnailGeneratorComponent implements OnInit, OnDestroy {

  /**
   * Fuel resource to generate thumbnails.
   */
  @Input() public resource: FuelResource;

  /**
   * Size of the thumbnails.
   * Aspect ratio should be 16:9.
   */
  public size = new THREE.Vector2(960, 540);

  /**
   * State of the thumbnail generation. Used to reflect changes on the UI.
   */
  public state: 'ready' | 'generating' = 'ready';

  /**
   * The THREE Object that represents the Fuel resource.
   */
  public resourceObj: any;

  /**
   * GZ3D scene.
   */
  public scene: any;

  /**
   * GZ3D renderer container.
   */
  public sceneElement: HTMLElement;

  /**
   * SDF file URL
   */
  private sdfUrl: string = '';

  /**
   * ID of the Request Animation Frame method. Required to cancel the animation.
   */
  private cancelAnimation: number;

  /**
   * @param modelService Service used to get the model files.
   * @param snackBar Snackbar used to display notifications
   * @param worldService Service used to get the world files.
   */
  constructor(
    public modelService: ModelService,
    public snackBar: MatSnackBar,
    public worldService: WorldService) {
  }

  /**
   * OnInit Lifecycle hook.
   *
   * The resource obtained from the input could have no files.
   * In the case, get them from the Server.
   */
  public ngOnInit(): void {
    // Get the resource files.
    // TODO(german) It would be nice to have an active model or world in a store, in order to avoid
    // multiple requests to the server.
    if (this.resource.files && this.resource.files.length === 0) {
      this.getFiles();
    }
  }

  /**
   * OnDestroy Lifecycle hook.
   *
   * Stops the animation cycle and cleans up the scene.
   */
  public ngOnDestroy(): void {
    if (this.cancelAnimation) {
      cancelAnimationFrame(this.cancelAnimation);
    }

    if (this.scene) {
      this.scene.emitter.removeAllListeners('load_finished');
      this.scene.cleanup();
    }
  }

  /**
   * Start the thumbnail generation process.
   */
  public beginRender(): void {
    this.state = 'generating';

    // Initialize GZ3D objects.
    const shaders = new GZ3D.Shaders();
    this.scene = new GZ3D.Scene(shaders, undefined, undefined, new THREE.Color(0xffffff));
    const sdfParser = new GZ3D.SdfParser(this.scene);
    const ogre2json = new GZ3D.Ogre2Json();
    sdfParser.enablePBR = false;

    // Thumbnails should be created once all the assets load.
    this.scene.emitter.on('load_finished', () => {
      if (this.resourceObj) {
        this.state = 'ready';

        // Post-processing: Scale and get the center of the resource.
        this.scale(this.resourceObj);
        const center = this.getCenter(this.resourceObj);

        // Get the thumbnails. Gz3D is in charge of generating and downloading the file.
        this.scene.createThumbnails(`${this.resource.name} Thumbnails`, center);
      }
    });

    // The domElement the renderer will be appended to.
    this.sceneElement = window.document.getElementById('container');
    this.sceneElement.appendChild(this.scene.renderer.domElement);
    this.scene.setSize(this.size.x, this.size.y);

    // Visual tweaks.
    // Original thumbnails have an aspect ratio of 16:9 and an horizontal FOV of 50.
    // ThreeJS works with vertical FOV, so for the given aspect ratio and an horizontal FOV of 50,
    // a vertical FOV of 36 is a good approximation.
    this.scene.camera.fov = 36;
    this.scene.camera.updateProjectionMatrix();

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
      sdfParser.setRequestHeader('Authorization', `Bearer ${token}`);
      ogre2json.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    // Set usingFilesUrls to true to indicate that we will be supplying files URLs.
    sdfParser.usingFilesUrls = true;

    // If there's a Fuel resource, push the file URLs
    const pendingMaterials = [];
    for (const file of this.resource.files) {
      let fileUrl;
      switch (this.resource.type) {
        case 'models':
          fileUrl = this.modelService.getIndividualFileUrl(
            this.resource, file);
          break;
        case 'worlds':
          fileUrl = this.worldService.getIndividualFileUrl(
            this.resource, file);
          break;
      }

      if (file.path.indexOf('/thumbnails/') >= 0) {
        // Skip thumbnails
        continue;
      } else if (file.path.indexOf('.material') > 0) {
        // Convert material file to json
        pendingMaterials.push(ogre2json.LoadFromUrl(fileUrl));
      } else if (this.resource.type === 'models' && file.path.indexOf('model.sdf') >= 0) {
        // Set SDF file
        this.sdfUrl = fileUrl;
      } else if (this.resource.type === 'worlds' && file.path.indexOf('.sdf') >= 0) {
        this.sdfUrl = fileUrl;
      } else {
        // Add URLs to the rest of resources
        sdfParser.addUrl(fileUrl);
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
        sdfParser.loadSDF(this.sdfUrl, (obj) => {
          if (!obj) {
            this.snackBar.open(`Failed load SDF.`, `Got it`, {
              duration: 2750
            });
            return;
          }

          this.resourceObj = obj;

          // Add the object to the scene
          this.scene.add(this.resourceObj);
        });
      })
      .catch((error) => {
        this.onMaterialLoadFail(error);
      });
  }

  /**
   * Normalize the resource scale for the thumbnail generation.
   * @param obj A THREE.Object3D to scale. The object is modified.
   */
  public scale(obj: any): void {
    // Get the bounding box.
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(obj);

    // Get the dimensions.
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const max = Math.max(size.x, size.y, size.z);

    // Normalize scale.
    const scaling = 1.0 / max;
    obj.scale.copy(new THREE.Vector3().addScalar(scaling));

    // Change the distance of lights.
    this.scene.scene.traverse((child) => {
      if (child instanceof THREE.Light) {
        child.distance = child.distance * scaling;
      }
    });
  }

  /**
   * Get the center of an object.
   * @param obj A THREE.Object3D to get the center of.
   * @returns A THREE.Vector3 with the coordinates of the given object's center.
   */
  public getCenter(obj: any): any {
    // Get the bounding box.
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(obj);
    return boundingBox.getCenter();
  }

  /**
   * Render the 3D scene, this function recursively calls itself in a loop.
   */
  private animate(): void {
    this.scene.render();

    this.cancelAnimation = requestAnimationFrame(() => {
      this.animate();
    });
  }

  /**
   * Get the files of the Model or World.
   */
  private getFiles(): void {
    let service: FuelResourceService;
    switch (this.resource.type) {
      case 'models':
        service = this.modelService;
        break;
      case 'worlds':
        service = this.worldService;
        break;
    }

    service.getFileTree(this.resource)
      .subscribe(
        (response) => {
          const files = response['file_tree'];
          this.resource.files = [];
          for (const file of files) {
            this.extractFile(file);
          }
          // Once we have the files, populate the thumbnails.
          const resourceUrl = service.getBaseVersionUrl(
            this.resource.owner, this.resource.name);
          this.resource.populateThumbnails(resourceUrl);
        },
        (error) => {
          this.snackBar.open(error.message, 'Got it');
        }
      );
  }

  /**
   * Extract files that contain no children from the File Tree nodes.
   *
   * @param file The current node of the File Tree.
   */
  private extractFile(file: any): void {
    // End condition. If it has no children, it's a file.
    if (!file.children) {
      // The path to display has the following format: "ModelName > Folder"
      const displayPath = `${this.resource['name']}${file.path.replace(`/${file.name}`, '')}`;
      file.displayPath = displayPath.replace(/\//g, ' > ');
      this.resource.files.push(file);
    } else {
      // If it contains children, it's a folder.
      for (const child of file.children) {
        this.extractFile(child);
      }
    }
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
}
