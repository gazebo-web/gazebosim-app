import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatChipsModule,
  MatChipInputEvent,
  MatIconModule,
  MatInputModule
} from '@angular/material';

import { TagsComponent } from './tags.component';

describe('TagsComponent', () => {
  let fixture: ComponentFixture<TagsComponent>;
  let component: TagsComponent;

  // Mock HTML element.
  const htmlElement = {
    value: 'new-tag'
  } as HTMLInputElement;

  // Mock Input Event.
  const inputEvent = {
    input: htmlElement,
    value: htmlElement.value
  } as MatChipInputEvent;

  // Mock Focus event.
  const focusEvent: any = {
    target: htmlElement,
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MatChipsModule,
        MatIconModule,
        MatInputModule,
        ReactiveFormsModule
        ],
      declarations: [
        TagsComponent
        ]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TagsComponent);
    component = fixture.debugElement.componentInstance;
    spyOn(component.onModify, 'emit');

    // Restore the values of the mock data.
    htmlElement.value = 'new-tag';
    inputEvent.input = htmlElement;
    inputEvent.value = htmlElement.value;
    focusEvent.target = htmlElement;
  });

  it('should NOT add a tag to the list if not on edit mode', async(() => {
    // Disable edit mode and try to add Tag.
    component.edit = false;
    component.addTagChip(inputEvent);

    // Tag should not be added.
    expect(component.tags[0]).toBe(undefined);
    expect(component.tags.length).toEqual(0);

    // Check modification event.
    expect(component.onModify.emit).not.toHaveBeenCalled();
  }));

  it('should add a tag to the list on edit mode', async(() => {
    // Edit mode: Add chip.
    component.edit = true;
    component.addTagChip(inputEvent);

    // Check if chip was added and the input cleared afterwards.
    expect(component.tags[0]).toBe('new-tag');
    expect(component.tags.length).toEqual(1);
    expect(htmlElement.value).toBe('');

    // Check modification event.
    expect(component.onModify.emit).toHaveBeenCalledWith(true);
  }));

  it('should NOT add a chip to the list if input is empty', async(() => {
    // Edit mode: Add chip.
    component.edit = true;
    inputEvent.value = '';
    component.addTagChip(inputEvent);

    // Check there are no chips
    expect(component.tags[0]).toBe(undefined);
    expect(component.tags.length).toEqual(0);

    // Check modification event.
    expect(component.onModify.emit).not.toHaveBeenCalled();
  }));

  it('should NOT close a chip on a blur event if not on edit mode', async(() => {
    // Disable edit mode and trigger blur.
    component.edit = false;
    component.closeTagOnBlur(focusEvent);

    // Check chip was added and element cleared.
    expect(component.tags[0]).toBe(undefined);
    expect(component.tags.length).toEqual(0);

    // Check modification event.
    expect(component.onModify.emit).not.toHaveBeenCalled();
  }));

  it('should close a chip on a blur event on edit mode', async(() => {
    // Edit mode and trigger blur.
    component.edit = true;
    component.closeTagOnBlur(focusEvent);

    // Check chip was added and element cleared afterwards.
    expect(component.tags[0]).toBe('new-tag');
    expect(component.tags.length).toEqual(1);
    expect(htmlElement.value).toBe('');

    // Check modification event.
    expect(component.onModify.emit).toHaveBeenCalledWith(true);
  }));

  it('should remove a tag on edit mode', async(() => {
    // Manually add tags.
    component.edit = true;
    component.tags = ['tag_1', 'tag_2', 'tag_3'];
    expect(component.tags.length).toBe(3);

    // Nothing breaks when removing inexistent tags.
    component.removeTag(-1);
    expect(component.tags.length).toBe(3);

    component.removeTag(100);
    expect(component.tags.length).toBe(3);

    // Removes tag_2.
    component.removeTag(1);

    // Check remaining tags.
    expect(component.tags.length).toBe(2);
    expect(component.tags[0]).toBe('tag_1');
    expect(component.tags[1]).toBe('tag_3');
    expect(component.tags).not.toContain('tag_2');

    // Check modification event.
    expect(component.onModify.emit).toHaveBeenCalledWith(true);
  }));

  it('should NOT remove a tag if not on edit mode', async(() => {
    // Disable edit mode and manually add tags.
    component.edit = false;
    component.tags = ['tag_1', 'tag_2', 'tag_3'];
    expect(component.tags.length).toBe(3);

    // Try to remove tag and verify it wasn't removed.
    component.removeTag(-1);
    expect(component.tags.length).toBe(3);

    component.removeTag(0);
    expect(component.tags.length).toBe(3);

    component.removeTag(2);
    expect(component.tags.length).toBe(3);

    component.removeTag(100);
    expect(component.tags.length).toBe(3);

    // Check all tags.
    expect(component.tags[0]).toBe('tag_1');
    expect(component.tags[1]).toBe('tag_2');
    expect(component.tags[2]).toBe('tag_3');

    // Check modification event.
    expect(component.onModify.emit).not.toHaveBeenCalled();
  }));
});
