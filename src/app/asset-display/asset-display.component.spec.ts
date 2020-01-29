import { ComponentFactoryResolver } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { AssetDisplayComponent } from './asset-display.component';
import { PageNotFoundComponent } from '../page-not-found';

describe('AssetDisplayComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        ],
      declarations: [
        AssetDisplayComponent
        ],
      providers: [],
    });
    TestBed.compileComponents();
  });

  it('should fetch route data on ngOnInit and retrieve component to display', async(() => {
    const fixture = TestBed.createComponent(AssetDisplayComponent);
    const component = fixture.debugElement.componentInstance;
    const activatedRoute = TestBed.get(ActivatedRoute);

    // Mock data value.
    activatedRoute.data = Observable.of({
      resolvedData: 'testAsset',
      component: 'testComponent'
    });

    spyOn(component, 'loadComponent');

    component.ngOnInit();

    expect(component.resolvedData).toEqual('testAsset');
    expect(component.alternativeResolvedData).toBeUndefined();
    expect(component.newComponent).toEqual('testComponent');
  }));

  it(`should read data and component from the resolved route's data`, async(() => {
    const fixture = TestBed.createComponent(AssetDisplayComponent);
    const component = fixture.debugElement.componentInstance;
    const activatedRoute = TestBed.get(ActivatedRoute);

    // Mock data value.
    activatedRoute.data = Observable.of({
      resolvedData: {
        data: 'testData',
        component: 'testComponent'
      },
    });

    spyOn(component, 'loadComponent');

    component.ngOnInit();

    expect(component.resolvedData).toEqual('testData');
    expect(component.newComponent).toEqual('testComponent');
  }));

  it('should fetch route data on ngOnInit and display a PageNotFound component', async(() => {
    const fixture = TestBed.createComponent(AssetDisplayComponent);
    const component = fixture.debugElement.componentInstance;
    const activatedRoute = TestBed.get(ActivatedRoute);

    // Mock data value.
    activatedRoute.data = Observable.of({
      resolvedData: null,
      component: 'testComponent'
    });

    spyOn(component, 'loadComponent');

    component.ngOnInit();

    expect(component.resolvedData).toEqual(null);
    expect(component.alternativeResolvedData).toBeUndefined();
    expect(component.newComponent).toEqual(PageNotFoundComponent);
  }));

  it('should unsubscribe to route data on ngOnDestroy', async(() => {
    const fixture = TestBed.createComponent(AssetDisplayComponent);
    const component = fixture.debugElement.componentInstance;

    // Mock subscription to data.
    component.dataSubscription = new Subscription();

    spyOn(component.dataSubscription, 'unsubscribe');
    component.ngOnDestroy();

    expect(component.dataSubscription.unsubscribe).toHaveBeenCalled();
  }));

  it('should create a component into the view', async(() => {
    const fixture = TestBed.createComponent(AssetDisplayComponent);
    const component = fixture.debugElement.componentInstance;
    const factoryService = TestBed.get(ComponentFactoryResolver);

    // Spies.
    spyOn(factoryService, 'resolveComponentFactory').and.returnValue('component');
    spyOn(component.componentViewContainer, 'clear');
    spyOn(component.componentViewContainer, 'createComponent');

    component.loadComponent();

    expect(component.componentViewContainer.clear).toHaveBeenCalled();
    expect(component.componentViewContainer.createComponent).toHaveBeenCalledWith('component');
  }));
});
