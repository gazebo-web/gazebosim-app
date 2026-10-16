/**
 * Lightweight client-side SDF validator. Mirrors the structural checks
 * the fuel-server's sdf/validate.go performs, but runs in the browser
 * so the editor can paint red marks per keystroke without a server
 * roundtrip. The fuel-server validator remains authoritative on save —
 * this is just for editor feedback.
 *
 * Returned errors carry a 1-indexed `line`. Where a structural error
 * isn't tied to a specific token (e.g. "must contain a world") the
 * error points at line 1 so it still surfaces in the gutter.
 */
export interface SDFError {
  line: number;
  message: string;
}

const VALID_TOP_LEVEL = ["world", "model", "actor", "light"] as const;

export function validateSDF(text: string): SDFError[] {
  if (!text.trim()) return [];
  const errors: SDFError[] = [];

  // DOMParser surfaces XML well-formedness errors via a <parsererror>
  // element in the resulting document. Browsers diverge on the textual
  // format, but all of them include "line N" somewhere in the message.
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const parserErr = doc.querySelector("parsererror");
  if (parserErr) {
    const msg = (parserErr.textContent || "XML parse error").trim();
    const line = extractLineFromParserError(msg);
    // Keep the message short — the gutter tooltip / count badge don't
    // have room for the full sourcetext block Chrome includes.
    const firstLine =
      msg.split("\n").find((l) => l.trim()) || "XML parse error";
    errors.push({ line, message: firstLine });
    return errors;
  }

  const root = doc.documentElement;
  if (!root || root.nodeName !== "sdf") {
    errors.push({
      line: lineOfFirstTag(text, /<\s*[a-zA-Z]/),
      message: `root element must be <sdf>, got <${root?.nodeName ?? "none"}>`,
    });
    return errors;
  }

  if (!root.hasAttribute("version")) {
    errors.push({
      line: lineOfFirstTag(text, /<\s*sdf\b/),
      message: "<sdf> must have a version attribute",
    });
  }

  const topChildren = Array.from(root.children);
  if (topChildren.length === 0) {
    errors.push({
      line: lineOfFirstTag(text, /<\s*sdf\b/),
      message:
        "<sdf> must contain at least one of: " + VALID_TOP_LEVEL.join(", "),
    });
  } else {
    const ok = topChildren.some((c) =>
      VALID_TOP_LEVEL.includes(c.nodeName as (typeof VALID_TOP_LEVEL)[number]),
    );
    if (!ok) {
      errors.push({
        line: lineOfFirstTag(text, /<\s*sdf\b/),
        message:
          "<sdf> must contain at least one of: " + VALID_TOP_LEVEL.join(", "),
      });
    }
  }

  // Joint sanity: each <joint> needs a <parent> and a <child>. The
  // server validator checks this with a simple substring scan; we do
  // the same per-element so we can attach a precise line number.
  const joints = doc.getElementsByTagName("joint");
  for (let i = 0; i < joints.length; i++) {
    const j = joints[i];
    const tag = `<joint${j.getAttribute("name") ? ` name="${j.getAttribute("name")}"` : ""}`;
    const line = lineOfFirstTag(text, new RegExp(escapeRegex(tag)));
    if (!j.querySelector(":scope > parent")) {
      errors.push({ line, message: "<joint> missing <parent>" });
    }
    if (!j.querySelector(":scope > child")) {
      errors.push({ line, message: "<joint> missing <child>" });
    }
  }

  return errors;
}

function extractLineFromParserError(msg: string): number {
  const m = msg.match(/line[:\s]+(\d+)/i);
  return m ? parseInt(m[1], 10) : 1;
}

function lineOfFirstTag(text: string, re: RegExp): number {
  const m = re.exec(text);
  if (!m) return 1;
  return text.slice(0, m.index).split("\n").length;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
