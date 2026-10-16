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

  it("saveProjectWorld POSTs an MCP tools/call to fuel-server /mcp with squash_autosaves=true by default", () => {
    service.saveProjectWorld("p1", "<sdf/>", "first").subscribe();
    const req = http.expectOne((r) => r.url.endsWith("/1.0/mcp"));
    expect(req.request.method).toBe("POST");
    expect(req.request.body.method).toBe("tools/call");
    expect(req.request.body.params.name).toBe("project_save_world_sdf");
    expect(req.request.body.params.arguments.name).toBe("p1");
    expect(req.request.body.params.arguments.sdf).toBe("<sdf/>");
    expect(req.request.body.params.arguments.commit_message).toBe("first");
    expect(req.request.body.params.arguments.squash_autosaves).toBe(true);
    req.flush({
      jsonrpc: "2.0",
      id: 1,
      result: {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              version: 2,
              commit_message: "first",
              squashed: true,
            }),
          },
        ],
      },
    });
  });

  it("saveProjectWorld can disable squashing for non-manual callers", () => {
    service
      .saveProjectWorld("p1", "<sdf/>", "auto-save", { squashAutoSaves: false })
      .subscribe();
    const req = http.expectOne((r) => r.url.endsWith("/1.0/mcp"));
    expect(req.request.body.params.arguments.squash_autosaves).toBe(false);
    req.flush({
      jsonrpc: "2.0",
      id: 1,
      result: {
        content: [{ type: "text", text: JSON.stringify({ version: 3 }) }],
      },
    });
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
