import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PullRequestComponent } from './pull-request.component';

describe('PullRequestComponent', () => {
  let component: PullRequestComponent;
  let fixture: ComponentFixture<PullRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PullRequestComponent ]
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
