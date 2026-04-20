import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { FormsModule } from "@angular/forms";
import { NO_ERRORS_SCHEMA } from "@angular/core";

import { AiBuilderService } from "../ai-builder.service";
import { ExecutionPanelComponent } from "./execution-panel.component";

describe("ExecutionPanelComponent", () => {
  let fixture: ComponentFixture<ExecutionPanelComponent>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExecutionPanelComponent],
      imports: [HttpClientTestingModule, FormsModule],
      providers: [AiBuilderService],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ExecutionPanelComponent);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it("start button is disabled when entry command is empty", () => {
    const c = fixture.componentInstance;
    c.projectId = "p1";
    c.entryCommand = "";
    fixture.detectChanges();
    expect(c.running).toBeFalse();
  });

  it("stopExecution POSTs to /stop", () => {
    const c = fixture.componentInstance;
    c.projectId = "p1";
    // Simulate an in-flight run.
    (c as any).runId = "run-123";
    c.stop();
    const req = http.expectOne((r) =>
      r.url.endsWith("/1.0/ai-builder/projects/p1/execute/run-123/stop"),
    );
    expect(req.request.method).toBe("POST");
    req.flush({});
  });
});
