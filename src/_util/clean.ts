/**
 * Unicode normalization map for common OCR, PDF
 * extraction, and copy-paste artifacts.
 *
 * Maps fullwidth digits, various dashes, dots,
 * spaces, and quotes to their ASCII equivalents.
 * Ported from python-stdnum's util.py _char_map.
 */
const CHAR_MAP: Record<string, string> = {
  // Fullwidth digits
  "\uFF10": "0",
  "\uFF11": "1",
  "\uFF12": "2",
  "\uFF13": "3",
  "\uFF14": "4",
  "\uFF15": "5",
  "\uFF16": "6",
  "\uFF17": "7",
  "\uFF18": "8",
  "\uFF19": "9",
  // Dashes and hyphens
  "\u2010": "-", // hyphen
  "\u2011": "-", // non-breaking hyphen
  "\u2012": "-", // figure dash
  "\u2013": "-", // en dash
  "\u2014": "-", // em dash
  "\u2015": "-", // horizontal bar
  "\u2212": "-", // minus sign
  "\uFE58": "-", // small em dash
  "\uFE63": "-", // small hyphen-minus
  "\uFF0D": "-", // fullwidth hyphen-minus
  // Dots and periods
  "\u2024": ".", // one dot leader
  "\uFE52": ".", // small full stop
  "\uFF0E": ".", // fullwidth full stop
  // Spaces
  "\u00A0": " ", // non-breaking space
  "\u2000": " ", // en quad
  "\u2001": " ", // em quad
  "\u2002": " ", // en space
  "\u2003": " ", // em space
  "\u2004": " ", // three-per-em space
  "\u2005": " ", // four-per-em space
  "\u2006": " ", // six-per-em space
  "\u2007": " ", // figure space
  "\u2008": " ", // punctuation space
  "\u2009": " ", // thin space
  "\u200A": " ", // hair space
  "\u200B": "", // zero-width space (remove)
  "\u202F": " ", // narrow no-break space
  "\u205F": " ", // medium mathematical space
  "\u3000": " ", // ideographic space
  "\uFEFF": "", // BOM / zero-width no-break
  // Slashes
  "\uFF0F": "/", // fullwidth solidus
  "\u2044": "/", // fraction slash
};

const CHAR_REGEX = new RegExp(
  `[${Object.keys(CHAR_MAP).join("")}]`,
  "g",
);

/**
 * Normalize Unicode artifacts to ASCII
 * equivalents and strip the given characters.
 *
 * @param value - The input string
 * @param strip - Characters to remove
 *   (e.g. " -/" to strip spaces, dashes, slashes)
 */
export const clean = (
  value: string,
  strip: string = "",
): string => {
  let result = value.replace(
    CHAR_REGEX,
    (ch) => CHAR_MAP[ch] ?? ch,
  );
  if (strip) {
    for (const ch of strip) {
      result = result.replaceAll(ch, "");
    }
  }
  return result;
};
