import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatCardModule } from '@angular/material/card';
import { RouterTestingModule } from '@angular/router/testing';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { PageTitleComponent } from '../../page-title';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { ReviewComponent } from './review-model.component';
import { ModelService } from '../model.service';
import { AuthService } from '../../auth/auth.service';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';

describe('ReviewComponent', () => {
  let component: ReviewComponent;
  let fixture: ComponentFixture<ReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MatCardModule,
        RouterTestingModule,
        MatToolbarModule,
        AngularEditorModule,
        MatIconModule,
        MatSelectModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
      ],
      declarations: [ 
        ReviewComponent,
        PageTitleComponent,
      ],
      providers: [
        ModelService,
        AuthService,
        JsonClassFactoryService,
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
