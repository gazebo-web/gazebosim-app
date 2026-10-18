/**
 * Which top-level objects of a world changed between two versions of its
 * SDF, so the viewport can point them out as the agent builds.
 *
 * Objects are the world's direct <model> and <include> children, keyed by
 * the name gzweb gives their 3D object: a model's name attribute, an
 * include's <name>, or else the last part of its <uri>. An object counts
 * as changed when it is new or its XML differs, or when it includes one of
 * `rebuilt` (project models whose files changed while world.sdf didn't).
 */
export function changedObjects(
  prev: string,
  next: string,
  rebuilt: string[] = [],
): string[] {
  const after = worldObjects(next);
  if (!after) return [];
  const before = worldObjects(prev) || new Map<string, WorldObject>();
  const rebuiltSet = new Set(rebuilt);
  const out: string[] = [];
  after.forEach((obj, name) => {
    const old = before.get(name);
    if (
      !old ||
      old.xml !== obj.xml ||
      (obj.projectModel && rebuiltSet.has(obj.projectModel))
    ) {
      out.push(name);
    }
  });
  return out;
}

interface WorldObject {
  xml: string;
  /** The project model an <include> refers to (model://<name>), if any. */
  projectModel?: string;
}

function worldObjects(sdf: string): Map<string, WorldObject> | null {
  if (!sdf || !sdf.trim()) return null;
  const doc = new DOMParser().parseFromString(sdf, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) return null;
  const world = doc.getElementsByTagName("world")[0];
  if (!world) return null;
  const serializer = new XMLSerializer();
  const out = new Map<string, WorldObject>();
  for (const el of Array.from(world.children)) {
    if (el.tagName !== "model" && el.tagName !== "include") continue;
    const uri = childText(el, "uri");
    const name =
      el.tagName === "model"
        ? el.getAttribute("name") || ""
        : childText(el, "name") || lastSegment(uri);
    if (!name) continue;
    const projectModel = /^model:\/\/([^/]+)\/?$/.exec(uri)?.[1];
    out.set(name, { xml: serializer.serializeToString(el), projectModel });
  }
  return out;
}

function childText(el: Element, tag: string): string {
  for (const c of Array.from(el.children)) {
    if (c.tagName === tag) return (c.textContent || "").trim();
  }
  return "";
}

function lastSegment(uri: string): string {
  const parts = uri.split("/").filter((p) => p);
  return parts[parts.length - 1] || "";
}
