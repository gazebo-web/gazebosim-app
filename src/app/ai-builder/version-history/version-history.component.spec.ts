import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";

import { AiBuilderService } from "../ai-builder.service";
import { VersionHistoryComponent } from "./version-history.component";

describe("VersionHistoryComponent", () => {
  let fixture: ComponentFixture<VersionHistoryComponent>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VersionHistoryComponent],
      imports: [HttpClientTestingModule],
      providers: [AiBuilderService],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(VersionHistoryComponent);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it("fetches versions when projectId is set", () => {
    fixture.componentInstance.projectId = "proj-1";
    fixture.componentInstance.ngOnChanges({
      projectId: {
        previousValue: "",
        currentValue: "proj-1",
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    const req = http.expectOne((r) =>
      r.url.endsWith("/projects/proj-1/versions"),
    );
    req.flush([
      {
        version: 2,
        commit_hash: "cafe",
        commit_message: "second",
        author: "nate",
        created_at: "",
      },
      {
        version: 1,
        commit_hash: "beef",
        commit_message: "first",
        author: "nate",
        created_at: "",
      },
    ]);
    expect(fixture.componentInstance.versions.length).toBe(2);
  });

  it("emits restore event", () => {
    let emitted: any = null;
    fixture.componentInstance.restore.subscribe((v) => (emitted = v));
    const version = {
      version: 1,
      commit_hash: "beef",
      commit_message: "m",
      author: "nate",
      created_at: "",
    };
    fixture.componentInstance.restoreVersion(version);
    expect(emitted).toEqual(version);
  });
});
