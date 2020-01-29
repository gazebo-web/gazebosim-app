import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatChipsModule,
  MatChipInputEvent,
  MatIconModule,
  MatInputModule
} from '@angular/material';
import { MarkdownModule } from 'ngx-markdown';

import { DescriptionComponent } from './description.component';

describe('DescriptionComponent', () => {
  let fixture: ComponentFixture<DescriptionComponent>;
  let component: DescriptionComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MarkdownModule,
        MatIconModule,
        MatInputModule,
        ReactiveFormsModule
        ],
      declarations: [
        DescriptionComponent
        ]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DescriptionComponent);
    component = fixture.debugElement.componentInstance;
    spyOn(component.onModify, 'emit');
  });

  it('should modify the description and emit an event', async(() => {
    expect(component.description).toBe('');
    component.setDescription('test-description');

    expect(component.description).toBe('test-description');
    expect(component.onModify.emit).toHaveBeenCalled();
  }));

  it('should toggle the markdown preview', async(() => {
    // Markdown needs to be false at the beginning.
    expect(component.markdownPreview).toBe(false);

    component.toggleMarkdownPreview();
    expect(component.markdownPreview).toBe(true);

    component.toggleMarkdownPreview();
    expect(component.markdownPreview).toBe(false);
  }));
});
