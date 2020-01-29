import { ActivatedRoute } from '@angular/router';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatIconModule, MatCardModule } from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { AuthPipe } from '../../auth/auth.pipe';
import { AuthService } from '../../auth/auth.service';
import { FuelResourceListComponent } from '../../fuel-resource';
import { ItemCardComponent } from '../../item-card/item-card.component';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { Portal, PortalListComponent, PortalService } from '../../portal';

describe('PortalListComponent', () => {
  let fixture: ComponentFixture<PortalListComponent>;
  let component: PortalListComponent;

  // Test portal.
  const testPortal = new Portal({name: 'testPortal', owner: 'testOwner'});

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        InfiniteScrollModule,
        MatCardModule,
        MatIconModule,
        RouterTestingModule,
        ],
      declarations: [
        AuthPipe,
        FuelResourceListComponent,
        ItemCardComponent,
        PortalListComponent,
        ],
      providers: [
        AuthService,
        JsonClassFactoryService,
        PortalService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                resolvedData: [testPortal],
              }
            }
          }
        },
        ],
    });
  }));

  // Create fixture and component before each test.
  beforeEach(() => {
    fixture = TestBed.createComponent(PortalListComponent);
    component = fixture.debugElement.componentInstance;
  });

  it('should load the the worlds from the resolved data', async(() => {
    expect(component.portals).toBeUndefined();
    component.ngOnInit();
    expect(component.portals).toEqual([testPortal]);
  }));
});
