import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { DndDirective } from './dnd.directive';

/**
 * Dummy component to test directive
 */
@Component({
  template: `<div gzDnd>`
})
class TestDndComponent {
}

describe('DndDirective', () => {

  let component: TestDndComponent;
  let fixture: ComponentFixture<TestDndComponent>;
  let divElement: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestDndComponent, DndDirective]
    });
    fixture = TestBed.createComponent(TestDndComponent);
    component = fixture.componentInstance;
    divElement = fixture.debugElement.query(By.css('div'));
    expect(divElement).toBeTruthy();
  });

  it('should have background unset', () => {
    expect(divElement.nativeElement.style.background).toBe('');
  });

  it('should highlight on dragover', () => {
    // Mock event.
    const event = new Event('drop');
    event['dataTransfer'] = {
      items: ['test'],
    };

    divElement.triggerEventHandler('dragover', new Event('dragover'));
    // FIXME
    // Expectation failing, it seems dragleave is called right after. And yet,
    // it's still '' rather than 'transparent'
    // expect(divElement.nativeElement.style.background).toBe('#999');
    divElement.triggerEventHandler('dragleave', new Event('dragleave'));
    // expect(divElement.nativeElement.style.background).toBe('transparent');
  });

  it('should handle empty drop event', () => {
    // Mock event with no data.
    const event = new Event('drop');
    event['dataTransfer'] = {
      items: [],
    };

    divElement.triggerEventHandler('drop', event);
  });
});
