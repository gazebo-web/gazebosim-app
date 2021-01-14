import { ComponentFactory, ComponentFactoryResolver, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Subscription, of } from 'rxjs';

import { AssetDisplayComponent } from './asset-display.component';
import { PageNotFoundComponent } from '../page-not-found';

describe('AssetDisplayComponent', () => {
  let fixture: ComponentFixture<AssetDisplayComponent>;
  let component: AssetDisplayComponent;
  let activatedRoute: ActivatedRoute;

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

    // Create fixture and component before each test.
    fixture = TestBed.createComponent(AssetDisplayComponent);
    component = fixture.debugElement.componentInstance;
    activatedRoute = TestBed.inject(ActivatedRoute);
  });

  it('should fetch route data on ngOnInit and retrieve component to display', () => {
    // Mock data value.
    const newComponent = {} as Type<any>;
    activatedRoute.data = of({
      resolvedData: 'testAsset',
      component: newComponent
    });

    spyOn(component, 'loadComponent');

    component.ngOnInit();

    expect(component.resolvedData).toEqual('testAsset');
    expect(component.newComponent).toEqual(newComponent);
    expect(component.loadComponent).toHaveBeenCalled();
  });

  it(`should read data and component from the resolved route's data`, () => {
    // Mock data value.
    const newComponent = {} as Type<any>;
    activatedRoute.data = of({
      resolvedData: {
        data: 'testAsset',
        component: newComponent
      }
    });

    spyOn(component, 'loadComponent');

    component.ngOnInit();

    // expect(component.resolvedData).toEqual('testData');
    // expect(component.newComponent).toEqual('testComponent');
    expect(component.resolvedData).toEqual('testAsset');
    expect(component.newComponent).toEqual(newComponent);
    expect(component.loadComponent).toHaveBeenCalled();
  });

  it('should fetch route data on ngOnInit and display a PageNotFound component', () => {
    // Mock data value.
    activatedRoute.data = of({
      resolvedData: null,
    });

    spyOn(component, 'loadComponent');

    component.ngOnInit();

    expect(component.resolvedData).toEqual(null);
    expect(component.newComponent).toEqual(PageNotFoundComponent);
  });

  it('should unsubscribe to route data on ngOnDestroy', () => {
    // Undefined subscription.
    component.ngOnDestroy();

    // Mock subscription to data.
    component.dataSubscription = new Subscription();

    spyOn(component.dataSubscription, 'unsubscribe');
    component.ngOnDestroy();

    expect(component.dataSubscription.unsubscribe).toHaveBeenCalled();
  });

  it('should create a component into the view', () => {
    const factoryService = TestBed.inject(ComponentFactoryResolver);
    const newComponent = {} as ComponentFactory<any>;

    // Spies.
    spyOn(factoryService, 'resolveComponentFactory').and.returnValue(newComponent);
    spyOn(component.componentViewContainer, 'clear');
    spyOn(component.componentViewContainer, 'createComponent');

    component.loadComponent();

    expect(component.componentViewContainer.clear).toHaveBeenCalled();
    expect(component.componentViewContainer.createComponent).toHaveBeenCalledWith(newComponent);
  });
});
