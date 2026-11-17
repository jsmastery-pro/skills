// The prose rules the portability check applies, kept in one place so the tests
// exercise exactly what the checker runs.

// Mask every exempt region with spaces (never delete, so byte offsets still map
// to line numbers), then any hyphenated word left standing is prose.
export const MASK = (s) => ' '.repeat(s.length);

export function proseOnly(text) {
  return text
    .replace(/```[\s\S]*?```/g, MASK)      // fenced code blocks
    .replace(/`[^`\n]+`/g, MASK)           // inline code spans
    .replace(/<!--[\s\S]*?-->/g, MASK)     // html comments (contract markers)
    .replace(/\]\([^)]*\)/g, MASK)         // markdown link targets
    .replace(/https?:\/\/\S+/g, MASK)      // bare urls
    // Frontmatter keys are defined by the Agent Skills spec (`allowed-tools`), so
    // only the description value is prose. Mask the keys, keep the description.
    .replace(/^---\n[\s\S]*?\n---/m, (fm) =>
      fm.split('\n').map((l) => (/^description:/.test(l) ? l : MASK(l))).join('\n')
    );
}

// Named things the skills MATCH ON: values they write into artifacts, phase names,
// and section headings. Renaming one is a migration across skills, not a copy edit,
// so these keep their hyphens everywhere, backticked or not.
//   in-progress, gap-fill, whole-repo  values and phase names other skills read
//   Follow-up                          a spec section heading
//   pre-flight                         the named phase every skill runs before it acts
export const PARSED_LITERALS = new Set([
  'in-progress', 'gap-fill', 'whole-repo', 'Follow-up', 'follow-up', 'pre-flight', 'Pre-flight',
]);

export const isExemptTerm = (w) => /^[A-Z0-9-]+$/.test(w) || PARSED_LITERALS.has(w);
