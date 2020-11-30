import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../auth/auth.service';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { Model } from '../model';
import { ModelService } from '../model.service';
import { SdfViewerComponent } from './sdfviewer.component';
import { WorldService } from '../../world/world.service';

declare var Detector: any;
declare var GZ3D: any;

// This is the equivalent of the old waitsFor/runs syntax
// which was removed from Jasmine 2
// Taken from: https://gist.github.com/abreckner/110e28897d42126a3bb9
const waitsForAndRuns = (escapeFunction, runFunction, escapeTime) => {
  // check the escapeFunction every millisecond so as soon as it is met we can escape the function
  const interval = setInterval( () => {
    if (escapeFunction()) {
      clearMe();
      runFunction();
    }
  }, 1);

  // in case we never reach the escapeFunction, we will time out
  // at the escapeTime
  const timeOut = setTimeout( () => {
    clearMe();
    runFunction();
  }, escapeTime);

  // clear the interval and the timeout
  const clearMe = () => {
    clearInterval(interval);
    clearTimeout(timeOut);
  };
};

describe('SdfViewerComponent', () => {
  let fixture: ComponentFixture<SdfViewerComponent>;
  let component: SdfViewerComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        HttpClientModule,
        MatSnackBarModule,
        RouterTestingModule,
      ],
      declarations: [
        SdfViewerComponent
      ],
      providers: [
        AuthService,
        JsonClassFactoryService,
        ModelService,
        WorldService,
      ]
    });

    fixture = TestBed.createComponent(SdfViewerComponent);
    component = fixture.componentInstance;
  });

  it('should create the SdfViewer component', () => {
    expect(component).toBeTruthy();
  });

  it('should have types available', () => {
    expect(Detector).toBeDefined();
    expect(GZ3D).toBeDefined();
    expect(GZ3D.Shaders).toBeDefined();
    expect(GZ3D.SdfParser).toBeDefined();
    expect(GZ3D.Scene).toBeDefined();
  });

  it('should initialize empty scene without a model', (done) => {
    expect(component).toBeTruthy();

    component.ngOnInit();

    waitsForAndRuns(() => {
      return component.scene.scene.children.length > 3;
    }, () => {
      // Check scene
      expect(component.sceneElement).toBeDefined();
      expect(component.resource).toBeUndefined();
      expect(component.scene).toBeDefined();
      expect(component.scene.scene.children.length).toBe(6);

      // We need to call done, otherwise Jasmine will infinitely wait for the animate
      // loop to end
      done();
    }, 1000);
  });

  it('should initialize empty scene with bad model', (done) => {
    expect(component).toBeTruthy();

    // Mock model
    const model = new Model({
      name: 'example_model',
      owner: 'example_owner',
    });

    component.resource = model;

    // Init
    component.ngOnInit();

    waitsForAndRuns(() => {
      return component.scene.scene.children.length > 3;
    }, () => {
      // Check scene
      expect(component.sceneElement).toBeDefined();
      expect(component.resource).toBeDefined();
      expect(component.scene).toBeDefined();
      expect(component.scene.scene.children.length).toBe(6);
      expect(component.scene.scene.getObjectByName('example_model')).toBeUndefined();

      // We need to call done, otherwise Jasmine will infinitely wait for the animate
      // loop to end
      done();
    }, 1000);
  });
});
