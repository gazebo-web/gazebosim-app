import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { AuthPipe } from '../../auth/auth.pipe';
import { FuelResource } from '../fuel-resource';
import { FuelResourceListComponent } from './fuel-resource-list.component';
import { ItemCardComponent } from '../../item-card/item-card.component';

describe('FuelResourceListComponent', () => {
  let fixture: ComponentFixture<FuelResourceListComponent>;
  let component: FuelResourceListComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MatCardModule,
        MatIconModule,
        RouterTestingModule,
      ],
      declarations: [
        AuthPipe,
        FuelResourceListComponent,
        ItemCardComponent,
      ]
    });

    fixture = TestBed.createComponent(FuelResourceListComponent);
    component = fixture.debugElement.componentInstance;
    spyOn(component.onLoadMore, 'emit');
    spyOn(component.ref, 'detectChanges');
  });

  it(`should stop loading after resources are set`, () => {
    // Mock data. Use Models, as FuelResource is abstract and can't be instantiated.
    const resources: FuelResource[] = [];
    component.loading = true;
    component.resources = resources;
    expect(component.loading).toBe(false);
    expect(component.ref.detectChanges).toHaveBeenCalled();
    expect(component.resources.length).toBe(0);
  });

  it(`should load resource on a scroll callback`, () => {
    spyOn(component, 'loadMoreResources');
    component.onScroll();
    expect(component.loadMoreResources).toHaveBeenCalled();
  });

  it(`should load resources if it's not loading and there are resources to load`, () => {
    // Test loading.
    component.loading = false;
    component.finished = false;
    component.loadMoreResources();
    expect(component.loading).toBe(true);
    expect(component.onLoadMore.emit).toHaveBeenCalled();
    expect(component.ref.detectChanges).toHaveBeenCalled();
  });

  it(`should NOT load resources if loading, or there aren't any left`, () => {
    // Test loading.
    component.loading = true;
    component.finished = false;
    component.loadMoreResources();
    expect(component.onLoadMore.emit).not.toHaveBeenCalled();

    // Test finished.
    component.loading = false;
    component.finished = true;
    component.loadMoreResources();
    expect(component.onLoadMore.emit).not.toHaveBeenCalled();
  });

  it(`should ensure the scrollbar appears after a change in the view`, () => {
    const loadResourcesSpy = spyOn(component, 'loadMoreResources');
    spyOn(component, 'getWindowHeight').and.returnValue(10);

    // Mock the Infinite Scroll component.
    component.listElement = {
      nativeElement: {
        offsetHeight: 0,
      }
    };

    // Shouldn't load if the scroll element's height is 0. This can happen while the DOM is
    // loading.
    component.ngAfterViewChecked();
    expect(loadResourcesSpy).not.toHaveBeenCalled();
    loadResourcesSpy.calls.reset();

    // Shouldn't load if the scroll element's height is larger than the window.
    component.listElement.nativeElement.offsetHeight = 20;
    component.ngAfterViewChecked();
    expect(component.loadMoreResources).not.toHaveBeenCalled();
    loadResourcesSpy.calls.reset();

    // Should load if the scroll element's height is smaller than the window.
    component.listElement.nativeElement.offsetHeight = 5;
    component.ngAfterViewChecked();
    expect(component.loadMoreResources).toHaveBeenCalled();
  });
});
