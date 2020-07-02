import { TestBed, async } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { SdfViewerComponent } from './sdfviewer.component';
import { Model } from '../model';
import { ModelService } from '../model.service';
import { AuthService } from '../../auth/auth.service';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';

import {
  MatSnackBarModule,
} from '@angular/material';

// Make TS happy
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
      ]
    });
  });

  it('should create the SdfViewer component', async(() => {
    const fixture = TestBed.createComponent(SdfViewerComponent);
    const comp = fixture.debugElement.componentInstance;
    expect(comp).toBeTruthy();
  }));

  it('should have types available', async(() => {
    expect(Detector).toBeDefined();
    expect(GZ3D).toBeDefined();
    expect(GZ3D.Shaders).toBeDefined();
    expect(GZ3D.SdfParser).toBeDefined();
    expect(GZ3D.Scene).toBeDefined();
  }));

  it('should initialize empty scene without a model', (done) => {
    const fixture = TestBed.createComponent(SdfViewerComponent);
    const comp = fixture.debugElement.componentInstance;
    expect(comp).toBeTruthy();

    comp.ngOnInit();

    waitsForAndRuns(() => {
      return comp.scene.scene.children.length > 3;
    }, () => {
      // Check scene
      expect(comp.sceneElement).toBeDefined();
      expect(comp.model).toBeUndefined();
      expect(comp.scene).toBeDefined();
      expect(comp.scene.scene.children.length).toBe(3);
      expect(comp.scene.scene.getObjectByName('sun')).toBeDefined();

      // We need to call done, otherwise Jasmine will infinitely wait for the animate
      // loop to end
      done();
    }, 1000);
  });

  it('should initialize empty scene with bad model', (done) => {
    const fixture = TestBed.createComponent(SdfViewerComponent);
    const comp = fixture.debugElement.componentInstance;
    expect(comp).toBeTruthy();

    // Mock model
    const model = new Model({
      name: 'example_model',
      owner: 'example_owner',
    });

    comp.model = model;

    // Init
    comp.ngOnInit();

    waitsForAndRuns(() => {
      return comp.scene.scene.children.length > 3;
    }, () => {
      // Check scene
      expect(comp.sceneElement).toBeDefined();
      expect(comp.model).toBeDefined();
      expect(comp.scene).toBeDefined();
      expect(comp.scene.scene.children.length).toBe(3);
      expect(comp.scene.scene.getObjectByName('example_model')).toBeUndefined();

      // We need to call done, otherwise Jasmine will infinitely wait for the animate
      // loop to end
      done();
    }, 1000);
  });

  it('should initialize scene with model', (done) => {
    const fixture = TestBed.createComponent(SdfViewerComponent);
    const comp = fixture.debugElement.componentInstance;
    expect(comp).toBeTruthy();

    // Mock model
    const model = new Model({
      name: 'example_name',
      owner: 'example_owner',
    });
    model.files = [
      {
        path: '/model.config'
      },
      {
        path: '/model.sdf'
      },
    ];
    comp.model = model;

    // Change the API server
    const modelService = TestBed.get(ModelService);
    modelService.baseUrl = 'http://localhost:9876/base/src/assets/test';

    // Init
    comp.ngOnInit();

    waitsForAndRuns(() => {
      return comp.scene.scene.children.length > 3;
    }, () => {
      // Check scene
      expect(comp.sceneElement).toBeDefined();
      expect(comp.model).toBeDefined();
      expect(comp.scene).toBeDefined();
      expect(comp.scene.scene.children.length).toBe(4);
      expect(comp.scene.scene.getObjectByName('example_model')).toBeDefined();

      // We need to call done, otherwise Jasmine will infinitely wait for the animate
      // loop to end
      done();
    }, 1000);
   });
});
