import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatChipsModule,
  MatChipInputEvent,
  MatIconModule,
  MatInputModule,
  MatTableModule
} from '@angular/material';

import { MetadataComponent } from './metadata.component';

describe('MetadataComponent', () => {
  let fixture: ComponentFixture<MetadataComponent>;
  let component: MetadataComponent;

  // Mock HTML element.
  const htmlElement = {
    value: 'new-datum'
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
        MatIconModule,
        MatInputModule,
        MatTableModule,
        ReactiveFormsModule
        ],
      declarations: [
        MetadataComponent
        ]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetadataComponent);
    component = fixture.debugElement.componentInstance;
    spyOn(component.onModify, 'emit');

    // Restore the values of the mock data.
    htmlElement.value = 'new-datum';
    inputEvent.input = htmlElement;
    inputEvent.value = htmlElement.value;
    focusEvent.target = htmlElement;
  });
});
