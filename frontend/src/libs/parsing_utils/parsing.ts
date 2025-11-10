export type Format<T> = {
  regexString: string;
  parser: (_: string) => T; // must always work, assuming the string matches the regex
};
export type FormatMap<T> = Record<string, Format<T>>;

export function parse<T>(
  s: string,
  patternString: string,
  formatMap: FormatMap<T>
): [string, T][] {
  const pattern = patternStringToPattern(patternString, formatMap);
  const formatKeys = getFormatKeysFromPattern(pattern);
  const matches = matchStringToPattern(s, pattern, formatMap); // fails if doesn't match
  return matches.map((s, i) => {
    const formatKey = formatKeys[i];
    return [formatKey, formatMap[formatKey].parser(s)]; // fails if any match fails to parse
  });
}

function getFormatKeysFromPattern<T>(pattern: Pattern<T>): string[] {
  return pattern
    .filter((el) => el.type === "format")
    .map((el) => (el as { formatKey: string }).formatKey);
}

type Pattern<T> = PatternElement<T>[];
type PatternElement<T> =
  | { type: "string"; string: string }
  | { type: "format"; formatKey: string };

function matchStringToPattern<T>(
  s: string,
  pattern: Pattern<T>,
  formatMap: FormatMap<T>
): string[] {
  const regex = patternToRegex(pattern, formatMap);
  const match = s.trim().match(regex);
  if (!match) throw new Error();

  const result = match.slice(1);
  return result;
}

function patternStringToPattern<T>(
  patternString: string,
  formatMap: FormatMap<T>
): Pattern<T> {
  function* patternElementGenerator(): Generator<PatternElement<T>> {
    const formatKeyRegex = createFormatKeyRegex(formatMap);

    let last_idx = 0;
    for (const [idx, string, formatKey] of regexMatches(
      patternString,
      formatKeyRegex
    )) {
      yield { type: "string", string };
      yield { type: "format", formatKey: formatKey };
      last_idx = idx;
    }
    yield { type: "string", string: patternString.slice(last_idx) };
  }

  return [...patternElementGenerator()];
}

/**
 * Converts a Pattern object into a RegExp that can match strings following that pattern
 * @param pattern The Pattern object to convert
 * @returns A RegExp that matches strings conforming to the pattern
 * @example
 * numberFormmat = { regexString: "\d+", parser: _ }
 * patternToRegex([
 *   {type: "string", string: "hello "},
 *   {type: "format", format: numberFormat}
 * ]) // Returns /^hello \d+$/
 */
function patternToRegex<T>(
  pattern: Pattern<T>,
  formatMap: FormatMap<T>
): RegExp {
  const regexStrings = pattern.map((el) =>
    el.type == "string"
      ? stringToRegexString(el.string)
      : "(" + formatMap[el.formatKey].regexString + ")"
  );
  return new RegExp(`^${regexStrings.join("")}$`);
}

/**
 * Creates a RegExp that matches format shorthands in a pattern string
 * @param formatMap Map of format shorthands to their Format objects
 * @returns A RegExp that captures text before and the shorthand itself
 * @example
 * createShortHandRegex({
 *   "%d": numberFormat,
 *   "%s": stringFormat
 * }) // Returns /(.*?)(%d|%s)/g
 */
function createFormatKeyRegex<T>(formatMap: FormatMap<T>): RegExp {
  const formatKeys = Object.keys(formatMap);
  return new RegExp(
    `(.*?)(${formatKeys.map(stringToRegexString).join("|")})`,
    "g"
  );
}

/**
 * Generator that yields matches from a regex along with their positions
 * @param s String to search in
 * @param regex RegExp to match against (must have global flag)
 * @yields Tuples of [lastIndex, ...captureGroups]
 * @example
 * for(let [idx, before, match] of regexMatches("test 123", /(\w+)\s+(\d+)/g)) {
 *   // console.log(idx, before, match);
 * }
 */
function* regexMatches(
  s: string,
  regex: RegExp
): Generator<[number, ...string[]]> {
  let match;
  while ((match = regex.exec(s)) !== null)
    yield [regex.lastIndex, ...match.slice(1)];
}

/**
 * Escapes special regex characters in a string to create a safe pattern that matches the literal string.
 * @param s The string to escape
 * @returns A string with special regex characters escaped
 * @example
 * escapeRegExp("hello.world") // returns "hello\.world"
 * escapeRegExp("$40.00") // returns "\$40\.00"
 * escapeRegExp("[test]") // returns "\[test\]"
 */
function stringToRegexString(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s");
}
