/**
 * Rewrites project references in an SDF document to signed file URLs, so
 * gzweb can load project models and meshes without an Authorization header
 * (fuel-server `GET /projects/{name}/file-url`, plan §4.5).
 *
 * `fileBase` is the absolute signed base, e.g.
 * `http://localhost:8000/1.0/project-files/<token>`. Under it, a project
 * model is laid out like a Fuel model (`/models/<name>/tip/files/...`), so
 * gzweb includes `model://<name>` exactly as it includes a Fuel model, and
 * any other project file is at `/files/<path>`.
 *
 * - `model://crate` → `<base>/models/crate`
 * - `model://crate/meshes/a.glb` → `<base>/models/crate/tip/files/meshes/a.glb`
 * - a relative path is resolved against the directory of `sdfPath`:
 *   a model folder (`models/crate`) → `<base>/models/crate`,
 *   anything else → `<base>/files/<path>`
 * - http(s) URIs (Fuel) and anything else are left alone.
 */

const TEXTURE_MAPS = [
  "albedo_map",
  "normal_map",
  "roughness_map",
  "metalness_map",
  "ambient_occlusion_map",
  "emissive_map",
  "light_map",
  "environment_map",
  "specular_map",
  "glossiness_map",
];

const REF_ELEMENT = new RegExp(
  `<(uri|${TEXTURE_MAPS.join("|")})>(\\s*)([^<]*?)(\\s*)</\\1>`,
  "g",
);

export function resolveProjectUris(
  sdf: string,
  fileBase: string,
  sdfPath = "world.sdf",
): string {
  if (!fileBase) return sdf;
  const base = fileBase.replace(/\/+$/, "");
  const dir = sdfPath.includes("/")
    ? sdfPath.slice(0, sdfPath.lastIndexOf("/"))
    : "";
  return sdf.replace(REF_ELEMENT, (whole, tag, pre, value, post) => {
    const url = resolveOne(value, base, dir);
    return url === undefined ? whole : `<${tag}>${pre}${url}${post}</${tag}>`;
  });
}

function resolveOne(
  value: string,
  base: string,
  dir: string,
): string | undefined {
  if (value.startsWith("model://")) {
    const rest = value.slice("model://".length).replace(/\/+$/, "");
    const slash = rest.indexOf("/");
    if (slash < 0) return `${base}/models/${encodePath(rest)}`;
    return `${base}/models/${encodePath(rest.slice(0, slash))}/tip/files/${encodePath(
      rest.slice(slash + 1),
    )}`;
  }
  if (!value || value.includes("://") || value.startsWith("/")) {
    return undefined;
  }
  const path = joinPath(dir, value);
  if (path === undefined) return undefined;
  const model = /^models\/([^/]+)$/.exec(path);
  if (model) return `${base}/models/${encodePath(model[1])}`;
  return `${base}/files/${encodePath(path)}`;
}

/** Joins and normalizes a relative path; undefined if it escapes the root. */
function joinPath(dir: string, rel: string): string | undefined {
  const out: string[] = [];
  for (const part of [...dir.split("/"), ...rel.split("/")]) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      if (out.length === 0) return undefined;
      out.pop();
    } else {
      out.push(part);
    }
  }
  return out.join("/");
}

function encodePath(p: string): string {
  return p
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
}
