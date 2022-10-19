import { ActivatedRoute } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { RouterTestingModule } from '@angular/router/testing';

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

  // Create fixture and component before each test.
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
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

    fixture = TestBed.createComponent(PortalListComponent);
    component = fixture.debugElement.componentInstance;
  });


  it('should load the the worlds from the resolved data', () => {
    expect(component.portals).toBeUndefined();
    component.ngOnInit();
    expect(component.portals).toEqual([testPortal]);
  });
});
