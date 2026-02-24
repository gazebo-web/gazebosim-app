import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PageEvent } from '@angular/material/paginator';

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
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {}
            }
          }
        }
      ]
    });

    fixture = TestBed.createComponent(FuelResourceListComponent);
    component = fixture.debugElement.componentInstance;
  });

  it(`should stop loading after resources are set`, () => {
    const resources: FuelResource[] = [];
    component.loading = true;
    component.resources = resources;
    expect(component.loading).toBe(false);
    expect(component.resources.length).toBe(0);
  });

  it(`should emit pageChange on pageEvent`, () => {
    spyOn(component.pageChange, 'emit');
    const event: PageEvent = { pageIndex: 1, pageSize: 20, length: 100 };
    component.pageEvent(event);
    expect(component.pageChange.emit).toHaveBeenCalledWith(event);
  });

  it(`should emit onRemoveItem on remove`, () => {
    spyOn(component.onRemoveItem, 'emit');
    const mockEvent = { resource: 'test' };
    component.remove(mockEvent);
    expect(component.onRemoveItem.emit).toHaveBeenCalledWith(mockEvent);
  });

  it(`should initialize pagination from query params`, () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot.queryParams as any) = { page: '3', per_page: '50' };

    component.ngOnInit();

    expect(component.pageIndex).toBe(2);
    expect(component.pageSize).toBe('50' as any);
  });

  it(`should use default pagination when no query params`, () => {
    component.ngOnInit();

    expect(component.pageIndex).toBe(0);
    expect(component.pageSize).toBe(20);
  });
});
