import { resolveProjectUris } from "./project-uris";

describe("resolveProjectUris", () => {
  const base = "http://localhost:8000/1.0/project-files/TOKEN";

  it("maps model:// includes and files to the signed base", () => {
    const sdf = `<include><uri>model://crate</uri></include>
<mesh><uri> model://crate/meshes/crate.glb </uri></mesh>
<albedo_map>model://crate/materials/textures/wood.png</albedo_map>`;
    expect(resolveProjectUris(sdf, base))
      .toBe(`<include><uri>${base}/models/crate</uri></include>
<mesh><uri> ${base}/models/crate/tip/files/meshes/crate.glb </uri></mesh>
<albedo_map>${base}/models/crate/tip/files/materials/textures/wood.png</albedo_map>`);
  });

  it("resolves relative paths against the file's directory", () => {
    expect(
      resolveProjectUris("<uri>models/crate</uri>", base, "world.sdf"),
    ).toBe(`<uri>${base}/models/crate</uri>`);
    expect(
      resolveProjectUris(
        "<uri>meshes/crate.glb</uri>",
        base,
        "models/crate/model.sdf",
      ),
    ).toBe(`<uri>${base}/files/models/crate/meshes/crate.glb</uri>`);
    expect(
      resolveProjectUris("<uri>../cart</uri>", base, "models/crate/model.sdf"),
    ).toBe(`<uri>${base}/models/cart</uri>`);
  });

  it("leaves Fuel URIs, absolute paths and escapes alone", () => {
    const sdf = `<uri>https://fuel.gazebosim.org/1.0/OpenRobotics/models/Euro pallet</uri>
<uri>/home/me/x.dae</uri><uri>file:///x.dae</uri><uri>../../x.dae</uri>`;
    expect(resolveProjectUris(sdf, base)).toBe(sdf);
  });

  it("encodes names and is a no-op without a base", () => {
    expect(resolveProjectUris("<uri>model://my crate</uri>", base)).toBe(
      `<uri>${base}/models/my%20crate</uri>`,
    );
    expect(resolveProjectUris("<uri>model://crate</uri>", "")).toBe(
      "<uri>model://crate</uri>",
    );
  });
});
