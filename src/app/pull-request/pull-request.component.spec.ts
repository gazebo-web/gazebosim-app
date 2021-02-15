import { ActivatedRoute } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from '../auth/auth.service';
import { ConversationComponent } from './conversation/conversation.component';
import { DescriptionComponent } from '../description';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { PullRequestComponent } from './pull-request.component';
import { PullRequestService } from './pull-request.service';

describe('PullRequestComponent', () => {
  let component: PullRequestComponent;
  let fixture: ComponentFixture<PullRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        HttpClientTestingModule,
        ReactiveFormsModule,
        RouterTestingModule,
        MatCardModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatSelectModule,
        MatTabsModule,
        MatToolbarModule,
      ],
      declarations: [ ConversationComponent, DescriptionComponent, PullRequestComponent],
      providers: [
        AuthService,
        JsonClassFactoryService,
        MatSnackBar,
        PullRequestService,
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
