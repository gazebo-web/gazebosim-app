import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MarkdownModule } from 'ngx-markdown';

import { DescriptionComponent } from './description.component';

describe('DescriptionComponent', () => {
  let fixture: ComponentFixture<DescriptionComponent>;
  let component: DescriptionComponent;

  beforeEach(() => {
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

    fixture = TestBed.createComponent(DescriptionComponent);
    component = fixture.debugElement.componentInstance;
    spyOn(component.onModify, 'emit');
  });

  it('should modify the description and emit an event', () => {
    expect(component.description).toBe('');
    component.setDescription('test-description');

    expect(component.description).toBe('test-description');
    expect(component.onModify.emit).toHaveBeenCalled();
  });

  it('should toggle the markdown preview', () => {
    // Markdown needs to be false at the beginning.
    expect(component.markdownPreview).toBe(false);

    component.toggleMarkdownPreview();
    expect(component.markdownPreview).toBe(true);

    component.toggleMarkdownPreview();
    expect(component.markdownPreview).toBe(false);
  });
});
