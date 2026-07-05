// ui/lib/grading.ts
// Lenient comparison for free-typed CLI command answers. IOS command
// answers in the knowledge base often contain bracketed placeholders (e.g.
// "ip nat inside source list [acl] pool [name] overload"), so a strict
// character-for-character match would fail even when the learner typed a
// perfectly correct, differently-worded command. This normalizes both
// sides enough to catch exact/near-exact matches automatically, while the
// UI always still offers a manual "mark correct/incorrect" override for
// anything this misses — auto-grading is a convenience, not a verdict.

export function normalizeCommand(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,;]+$/g, "");
}

export function isCloseMatch(typed: string, correct: string): boolean {
  const a = normalizeCommand(typed);
  const b = normalizeCommand(correct);
  if (!a) return false;
  if (a === b) return true;
  // Treat bracketed placeholders as wildcards: "ip nat pool [name] ..."
  // should match "ip nat pool MYPOOL ...".
  const pattern = b
    .replace(/[.*+?^${}()|\\]/g, "\\$&")
    .replace(/\\\[[^\]]*\\\]/g, "\\S+");
  try {
    return new RegExp(`^${pattern}$`).test(a);
  } catch {
    return false;
  }
}
