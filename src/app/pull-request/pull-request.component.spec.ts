import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { AngularEditorModule } from '@kolkov/angular-editor';

import { PullRequestComponent } from './pull-request.component';
import { PullRequestService } from './pull-request.service';
import { AuthService } from '../auth/auth.service';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { ConversationComponent } from './conversation/conversation.component';

describe('PullRequestComponent', () => {
  let component: PullRequestComponent;
  let fixture: ComponentFixture<PullRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MatSelectModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        RouterTestingModule,
        MatTabsModule,
        MatIconModule,
        MatToolbarModule,
        MatListModule,
        MatCardModule,
        AngularEditorModule
      ],
      declarations: [ PullRequestComponent, ConversationComponent ],
      providers: [
        PullRequestService,
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
                ['user', 'test-model'],
                ['type', 'test-owner'],
                ['name', 'test-owner'],
                ['id', 'test-owner']
              ])
            }
          }
        },
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PullRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
