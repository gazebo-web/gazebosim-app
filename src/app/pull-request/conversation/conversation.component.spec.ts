import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { ConversationComponent } from './conversation.component';

describe('ConversationComponent', () => {
  let component: ConversationComponent;
  let fixture: ComponentFixture<ConversationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        HttpClientTestingModule,
        MatCardModule,
        MatListModule,
        MatSnackBarModule,
        ReactiveFormsModule,
      ],
      declarations: [ ConversationComponent ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversationComponent);
    component = fixture.componentInstance;
    component.review = {
      id: '1',
      owner: 'boaringsquare',
      creator: 'boringsquare',
      reviewers: [],
      date: '19 November 2020',
      approvals: [],
      description: 'this is a temporary review object until the apis are ready. It will then be replaced',
      branch: 'new/model',
      status: 'status',
      title: 'Create new model'
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
