import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";

import { AiBuilderService } from "./ai-builder.service";

describe("AiBuilderService", () => {
  let service: AiBuilderService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AiBuilderService],
    });
    service = TestBed.inject(AiBuilderService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it("createProject POSTs to /projects", () => {
    service.createProject({ name: "x" }).subscribe();
    const req = http.expectOne((r) =>
      r.url.endsWith("/1.0/ai-builder/projects"),
    );
    expect(req.request.method).toBe("POST");
    req.flush({
      id: "1",
      name: "x",
      owner: "a",
      description: "",
      gazebo_version: "Harmonic",
      sdf_version: "1.9",
      ros2_distro: "Jazzy",
      created_at: "",
      updated_at: "",
    });
  });

  it("listProjects GETs /projects", () => {
    service.listProjects().subscribe((list) => {
      expect(list.length).toBe(1);
    });
    const req = http.expectOne((r) =>
      r.url.endsWith("/1.0/ai-builder/projects"),
    );
    expect(req.request.method).toBe("GET");
    req.flush([
      {
        id: "1",
        name: "x",
        owner: "a",
        description: "",
        gazebo_version: "Harmonic",
        sdf_version: "1.9",
        ros2_distro: "Jazzy",
        created_at: "",
        updated_at: "",
      },
    ]);
  });

  it("getChatHistory GETs /chat/history", () => {
    service.getChatHistory("p1").subscribe();
    const req = http.expectOne((r) =>
      r.url.endsWith("/1.0/ai-builder/projects/p1/chat/history"),
    );
    expect(req.request.method).toBe("GET");
    req.flush({ id: "s1", project_id: "p1", messages: [], created_at: "" });
  });

  it("putLLMConfig PUTs user config", () => {
    service
      .putLLMConfig("alice", {
        provider: "anthropic",
        model: "m",
        api_key: "k",
      })
      .subscribe();
    const req = http.expectOne((r) =>
      r.url.endsWith("/1.0/ai-builder/users/alice/llm-config"),
    );
    expect(req.request.method).toBe("PUT");
    expect(req.request.body.api_key).toBe("k");
    req.flush({
      user_id: "alice",
      provider: "anthropic",
      model: "m",
      telemetry_opt_in: false,
    });
  });

  it("createVersion POSTs the SDF and commit message", () => {
    service.createVersion("p1", "<sdf/>", "first").subscribe();
    const req = http.expectOne((r) =>
      r.url.endsWith("/1.0/ai-builder/projects/p1/versions"),
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body.world_sdf).toBe("<sdf/>");
    expect(req.request.body.commit_message).toBe("first");
    req.flush({
      id: "v1",
      project_id: "p1",
      version: 1,
      world_sdf: "<sdf/>",
      commit_message: "first",
      created_at: "",
    });
  });
});
