import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

import { MetadataComponent } from './metadata.component';
import { Metadatum } from './metadatum';

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

  beforeEach(() => {
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

    fixture = TestBed.createComponent(MetadataComponent);
    component = fixture.debugElement.componentInstance;

    // Restore the values of the mock data.
    // htmlElement.value = 'new-datum';
    // inputEvent.input = htmlElement;
    // inputEvent.value = htmlElement.value;
    // focusEvent.target = htmlElement;
    // spyOn(component.onModify, 'emit');
  });

  it('should have at least one empty metadatum if editting', () => {
    component.edit = true;
    component.ngOnInit();
    expect(component.metadata.length).toEqual(1);
    // Should not add an empty metadata if there is at least one.
    component.ngOnInit();
    expect(component.metadata.length).toEqual(1);
  });

  it('should set the table data if not editting', () => {
    component.edit = false;
    component.ngOnInit();
    expect(component.dataSource).not.toBe(undefined);
  });

  it('should emit an event when adding metadata', () => {
    spyOn(component.onModify, 'emit');

    component.add();
    expect(component.metadata.length).toEqual(1);
    expect(component.onModify.emit).toHaveBeenCalledWith(true);
  });

  it('should remove a metadatum', () => {
    component.metadata = [
      new Metadatum(),
      new Metadatum(),
    ];
    expect(component.metadata.length).toEqual(2);

    const spy = spyOn(component.onModify, 'emit');

    component.clear(0);
    expect(spy).toHaveBeenCalledWith(true);
    expect(component.metadata.length).toEqual(1);

    // If the last one is removed, an empty metadatum should be added.
    spy.calls.reset();
    component.clear(0);
    expect(spy).toHaveBeenCalledWith(true);
    expect(component.metadata.length).toEqual(1);
  });
});
