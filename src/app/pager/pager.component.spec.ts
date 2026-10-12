import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatIconModule } from "@angular/material/icon";

import { PagerComponent } from "./pager.component";

describe("PagerComponent", () => {
  let fixture: ComponentFixture<PagerComponent>;
  let component: PagerComponent;

  /**
   * Set the inputs and run change detection, as a parent template would.
   */
  function setInputs(page: number, pageCount: number): void {
    fixture.componentRef.setInput("page", page);
    fixture.componentRef.setInput("pageCount", pageCount);
    fixture.detectChanges();
  }

  /**
   * Query all elements matching a selector in the rendered pager.
   */
  function queryAll(selector: string): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll(selector));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatIconModule],
      declarations: [PagerComponent],
    });

    fixture = TestBed.createComponent(PagerComponent);
    component = fixture.componentInstance;
    spyOn(component.pageChange, "emit");
  });

  it("should show one dot per page when there are few pages", () => {
    setInputs(1, 3);

    expect(component.dots).toEqual([1, 2, 3]);
    expect(queryAll(".pager-dot").length).toBe(3);
    expect(queryAll(".pager-label").length).toBe(0);
  });

  it("should show no dots when there are no pages", () => {
    setInputs(1, 0);

    expect(component.dots).toEqual([]);
  });

  it("should show a window of dots centered on the current page", () => {
    setInputs(20, 41);

    expect(component.dots).toEqual([17, 18, 19, 20, 21, 22, 23]);
    expect(queryAll(".pager-label")[0].textContent.trim()).toBe("20 / 41");
  });

  it("should clamp the window of dots to the first and last pages", () => {
    setInputs(2, 41);
    expect(component.dots).toEqual([1, 2, 3, 4, 5, 6, 7]);

    setInputs(41, 41);
    expect(component.dots).toEqual([35, 36, 37, 38, 39, 40, 41]);
  });

  it("should mark the current page dot as active", () => {
    setInputs(2, 3);

    const active = queryAll(".pager-dot.active");
    expect(active.length).toBe(1);
    expect(active[0].getAttribute("aria-current")).toBe("page");
    expect(active[0].getAttribute("aria-label")).toBe("Page 2");
  });

  it("should disable the previous and next buttons at the ends", () => {
    setInputs(1, 3);
    let [prev, next] = queryAll(".pager-btn") as HTMLButtonElement[];
    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(false);

    setInputs(3, 3);
    [prev, next] = queryAll(".pager-btn") as HTMLButtonElement[];
    expect(prev.disabled).toBe(false);
    expect(next.disabled).toBe(true);
  });

  it("should emit the requested page from the buttons and dots", () => {
    setInputs(2, 3);
    const [prev, next] = queryAll(".pager-btn");

    prev.click();
    expect(component.pageChange.emit).toHaveBeenCalledWith(1);

    next.click();
    expect(component.pageChange.emit).toHaveBeenCalledWith(3);

    queryAll(".pager-dot")[0].click();
    expect(component.pageChange.emit).toHaveBeenCalledTimes(3);
  });

  it("should not emit for the current page or out of range pages", () => {
    setInputs(2, 3);

    component.goToPage(2);
    component.goToPage(0);
    component.goToPage(4);

    expect(component.pageChange.emit).not.toHaveBeenCalled();
  });
});
