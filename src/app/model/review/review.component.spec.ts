import { ActivatedRoute } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from '../../auth/auth.service';
import { DescriptionComponent } from '../../description';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { OrganizationService } from '../../organization/organization.service';
import { PageTitleComponent } from '../../page-title';
import { ReviewComponent } from './review.component';

describe('ReviewComponent', () => {
  let component: ReviewComponent;
  let fixture: ComponentFixture<ReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        HttpClientTestingModule,
        MatCardModule,
        MatIconModule,
        MatInputModule,
        MatToolbarModule,
        MatSelectModule,
        ReactiveFormsModule,
        RouterTestingModule,
      ],
      declarations: [
        DescriptionComponent,
        PageTitleComponent,
        ReviewComponent,
      ],
      providers: [
        AuthService,
        JsonClassFactoryService,
        MatSnackBar,
        OrganizationService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                resolvedData: [],
              },
              paramMap: new Map([
                ['modelname', 'test-model'],
                ['owner', 'test-owner']
              ])
            }
          }
        },
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
