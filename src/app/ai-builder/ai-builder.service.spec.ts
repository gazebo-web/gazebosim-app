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

  it("createProject POSTs to fuel-server /projects", () => {
    service.createProject({ name: "x" }).subscribe();
    const req = http.expectOne((r) => r.url.endsWith("/1.0/projects"));
    expect(req.request.method).toBe("POST");
    req.flush({
      name: "x",
      owner: "a",
      gazebo_version: "Harmonic",
      sdf_version: "1.9",
      ros2_distro: "Jazzy",
      created_at: "",
      updated_at: "",
    });
  });

  it("listProjects GETs fuel-server /projects", () => {
    service.listProjects().subscribe((list) => {
      expect(list.length).toBe(1);
      // hydrateProject copies `name` into legacy `id` alias.
      expect(list[0].id).toBe(list[0].name);
    });
    const req = http.expectOne((r) => r.url.endsWith("/1.0/projects"));
    expect(req.request.method).toBe("GET");
    req.flush([
      {
        name: "x",
        owner: "a",
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

  it("addLLMKey POSTs to /llm-keys", () => {
    service
      .addLLMKey("alice", {
        provider: "anthropic",
        api_key: "sk-ant-abcd",
      })
      .subscribe();
    const req = http.expectOne((r) =>
      r.url.endsWith("/1.0/ai-builder/users/alice/llm-keys"),
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body.api_key).toBe("sk-ant-abcd");
    req.flush({
      user_id: "alice",
      provider: "anthropic",
      api_key_masked: "…abcd",
    });
  });

  it("listLLMKeys GETs /llm-keys", () => {
    service.listLLMKeys("alice").subscribe((keys) => {
      expect(keys.length).toBe(1);
    });
    const req = http.expectOne((r) =>
      r.url.endsWith("/1.0/ai-builder/users/alice/llm-keys"),
    );
    expect(req.request.method).toBe("GET");
    req.flush([
      {
        user_id: "alice",
        provider: "openai",
        api_key_masked: "…1234",
      },
    ]);
  });

  it("deleteLLMKey DELETEs the provider path", () => {
    service.deleteLLMKey("alice", "anthropic").subscribe();
    const req = http.expectOne((r) =>
      r.url.endsWith("/1.0/ai-builder/users/alice/llm-keys/anthropic"),
    );
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });

  it("writeProjectFile PUTs content and base_rev to /projects/p/files/path", () => {
    service
      .writeProjectFile("p1", "models/cart/model.sdf", "<sdf/>", {
        baseRev: "abc",
      })
      .subscribe((r) => expect(r.rev).toBe("def"));
    const req = http.expectOne((r) =>
      r.url.endsWith("/1.0/projects/p1/files/models/cart/model.sdf"),
    );
    expect(req.request.method).toBe("PUT");
    expect(req.request.body.content).toBe("<sdf/>");
    expect(req.request.body.base_rev).toBe("abc");
    req.flush({ version: 4, rev: "def" });
  });

  it("checkpoint POSTs the label to /projects/p/checkpoint", () => {
    service.checkpoint("p1", "Wall placed").subscribe((r) => {
      expect(r.squashed).toBe(3);
    });
    const req = http.expectOne((r) =>
      r.url.endsWith("/1.0/projects/p1/checkpoint"),
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body.message).toBe("Wall placed");
    req.flush({ version: 5, rev: "ghi", squashed: 3 });
  });

  it("validateSDF POSTs to fuel-server /sdf/validate", () => {
    service.validateSDF("<sdf/>").subscribe((r) => expect(r.valid).toBe(false));
    const req = http.expectOne((r) => r.url.endsWith("/1.0/sdf/validate"));
    expect(req.request.method).toBe("POST");
    expect(req.request.body.sdf).toBe("<sdf/>");
    req.flush({ valid: false, errors: [{ message: "x", line: 1 }] });
  });

  it("listVersions GETs fuel-server /projects/p/versions", () => {
    service.listVersions("p1").subscribe((v) => expect(v.length).toBe(1));
    const req = http.expectOne((r) =>
      r.url.endsWith("/1.0/projects/p1/versions"),
    );
    expect(req.request.method).toBe("GET");
    req.flush([
      {
        version: 1,
        commit_hash: "abc",
        commit_message: "init",
        author: "nate",
        created_at: "",
      },
    ]);
  });

  it("getProjectFile reads /projects/p/tip/files/world.sdf as text", () => {
    service.getProjectFile("p1", "tip", "world.sdf").subscribe((sdf) => {
      expect(sdf).toBe('<sdf version="1.9"/>');
    });
    const req = http.expectOne((r) =>
      r.url.endsWith("/1.0/projects/p1/tip/files/world.sdf"),
    );
    expect(req.request.method).toBe("GET");
    req.flush('<sdf version="1.9"/>');
  });
});
