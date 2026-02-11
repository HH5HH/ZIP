#!/usr/bin/env python3
"""Extract GET paths and path params from Zendesk OpenAPI YAML (no PyYAML)."""
import re
import json

def main():
    with open("/Users/minnick/Documents/PASS/ZIP/ZD/oas-full.yaml", "r") as f:
        lines = f.readlines()

    results = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # Path key: exactly 2 spaces then / (e.g. "  /api/v2/users/me:")
        if re.match(r"^  /[^\s:]+:\s*$", line):
            path = line.strip().rstrip(":").strip()
            if not path.startswith("/"):
                i += 1
                continue
            # Path params from the path string
            params = re.findall(r"\{([^}]+)\}", path)
            # Clean param names (in case of weird chars)
            params = [p.strip() for p in params if p]
            summary = ""
            j = i + 1
            in_get = False
            while j < len(lines):
                next_line = lines[j]
                # Next path or top-level key (same or less indent) -> stop
                if next_line.startswith("  /") and not next_line.startswith("    "):
                    break
                if next_line.strip() and not next_line.startswith(" ") and not next_line.startswith("#"):
                    break
                if re.match(r"^    get:\s*$", next_line):
                    in_get = True
                    j += 1
                    continue
                if in_get and re.match(r"^      summary:\s*", next_line):
                    summary = next_line.split("summary:", 1)[1].strip()
                    if summary == "|":
                        summary = ""
                        j += 1
                        while j < len(lines) and lines[j].startswith("        "):
                            summary += " " + lines[j].strip()
                            j += 1
                        summary = summary.strip()[:60]
                    else:
                        summary = summary[:60]
                    break
                if in_get and (next_line.startswith("    ") and not next_line.startswith("      ")):
                    break
                j += 1
            if in_get:
                if not summary:
                    summary = path.split("/")[-1] or "GET"
                    if summary.endswith(".json"):
                        summary = path.split("/")[-2] or "GET"
                results.append({
                    "path": path,
                    "params": params,
                    "summary": summary.replace('"', "'").strip() or path,
                })
        i += 1

    # Output as JS array for content.js
    print("// Generated from Zendesk oas.yaml - GET endpoints only")
    print("const ZD_GET_PATHS = [")
    for r in results:
        summary_esc = json.dumps(r["summary"])
        params_js = json.dumps(r["params"])
        path_js = json.dumps(r["path"])
        print(f"  {{ path: {path_js}, params: {params_js}, summary: {summary_esc} }},")
    print("];")
    print(f"// Total: {len(results)} GET endpoints")

if __name__ == "__main__":
    main()
