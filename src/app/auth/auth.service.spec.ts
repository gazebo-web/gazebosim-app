import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { RouterTestingModule } from "@angular/router/testing";

import { AuthService } from "./auth.service";

describe("AuthService", () => {
  // Mock the local storage with the given session data.
  function createService(storage: { [key: string]: string }): AuthService {
    spyOn(localStorage, "getItem").and.callFake((key) =>
      key in storage ? storage[key] : null,
    );
    spyOn(localStorage, "setItem");
    // Don't contact Auth0 to renew expired tokens.
    spyOn(AuthService.prototype as any, "renewToken");
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AuthService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    return TestBed.inject(AuthService);
  }

  // Session data of a logged in user with the given profile.
  function session(profile: any): { [key: string]: string } {
    return {
      token: "test-token",
      expires_at: JSON.stringify(Date.now() + 60000),
      profile: JSON.stringify(profile),
    };
  }

  it("should not consider a logged out user a member", () => {
    const authService = createService({});
    expect(authService.isMember("testOrg")).toBe(false);
  });

  it("should not consider a user with an expired token a member", () => {
    const storage = session({
      username: "testUser",
      orgRoles: { testOrg: "owner" },
    });
    storage.expires_at = JSON.stringify(Date.now() - 60000);
    const authService = createService(storage);
    expect(authService.isMember("testOrg")).toBe(false);
  });

  it("should consider a user with any role in the organization a member", () => {
    const authService = createService(
      session({
        username: "testUser",
        orgRoles: { ownedOrg: "owner", adminOrg: "admin", memberOrg: "member" },
      }),
    );
    expect(authService.isMember("ownedOrg")).toBe(true);
    expect(authService.isMember("adminOrg")).toBe(true);
    expect(authService.isMember("memberOrg")).toBe(true);
    expect(authService.isMember("otherOrg")).toBe(false);
  });

  it("should not consider a user without organizations a member", () => {
    const authService = createService(session({ username: "testUser" }));
    expect(authService.isMember("testOrg")).toBe(false);
  });

  it("should not consider a user without a username a member", () => {
    const authService = createService(
      session({ orgRoles: { testOrg: "owner" } }),
    );
    expect(authService.isMember("testOrg")).toBe(false);
  });

  it("should consider a system admin a member of any organization", () => {
    const authService = createService(
      session({ username: "testUser", sysAdmin: true }),
    );
    expect(authService.isMember("testOrg")).toBe(true);
  });

  it("should set the fetched profile before publishing it", () => {
    // A renewed token whose profile doesn't have the username yet.
    const authService = createService(
      session({ name: "Test User", orgRoles: {} }),
    );
    const httpMock = TestBed.inject(HttpTestingController);
    const membership = [];
    authService.userProfile$.subscribe(() =>
      membership.push(authService.isMember("testOrg")),
    );

    httpMock
      .expectOne((req) => req.url.endsWith("/login"))
      .flush({
        username: "testUser",
        orgs: ["testOrg"],
        orgRoles: { testOrg: "member" },
      });

    expect(membership[membership.length - 1]).toBe(true);
  });
});
