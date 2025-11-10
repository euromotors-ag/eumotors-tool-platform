import { Format } from "./parsing";

type NumberFormat = Format<number>

export function createIntegerFormat( thousandsSeparator : string ) : NumberFormat {
    return {
        regexString: createIntegerPattern(thousandsSeparator),
        parser: createIntegerParser(thousandsSeparator)
    };
}

export function createFloatFormat( thousandsSeparator : string, decimalSeparator : string ) : NumberFormat {
    return {
        regexString: createFloatPattern(thousandsSeparator, decimalSeparator),
        parser: createFloatParser(thousandsSeparator, decimalSeparator)
    };
}

/**
 * Creates a pattern that matches integers with thousands separators.
 * @param thousandsSeparator The character used to separate thousands (e.g. " " or "_" or "" or "," or ".")
 * @example
 * const pattern = createIntegerPattern(" ");
 * "1 234" // matches
 * "1 234 567" // matches
 * 
 * const pattern2 = createIntegerPattern(","); 
 * "1,234" // matches
 * "1,234,567" // matches
 * 
 * const pattern3 = createIntegerPattern(".");
 * "1.234" // matches
 * "1.234.567" // matches
 * 
 * const pattern4 = createIntegerPattern("");
 * "1234" // matches
 * "1234567" // matches
 */
export function createIntegerPattern( thousandsSeparator : string ) : string {
    return `\\d{1,3}(?:${thousandsSeparator.replace(/ /g, '\\s').replace(/[.,]/g, '\\$&')}\\d{3})*`;
}

/**
 * Creates a function that parses integers with thousands separators.
 * @param thousandsSeparator The character used to separate thousands (e.g. " " or "_" or "" or "," or ".")
 * @returns A function that takes a string match and returns the parsed integer
 * @example
 * const parser = createIntegerParser(",");
 * parser("1,234") // returns 1234
 * parser("1,234,567") // returns 1234567
 * 
 * const parser2 = createIntegerParser(".");
 * parser2("1.234") // returns 1234
 * parser2("1.234.567") // returns 1234567
 */
export function createIntegerParser( thousandsSeparator : string ) : (_: string) => number {
    // "1.234.567" -> 1234567
    return (match: string) => {
        // Remove thousands separators and parse as integer
        return parseInt(match.replace(new RegExp(thousandsSeparator.replace(/ /g, '\\s').replace(/[.,]/g, '\\$&'), 'g'), ''));
    }
}

/**
 * Creates a pattern that matches floats with thousands separators and decimal separator.
 * Requires decimalSeparator and thousandsSeparator to be different.
 * @param decimalSeparator The character used as decimal separator ("." or ",")
 * @param thousandsSeparator The character used to separate thousands (e.g. " " or "_")
 * @example
 * const pattern = createFloatPattern(",", ".");
 * "1234" // matches
 * "1234.56" // matches
 * "1,234.56" // matches
 * "1,234,567.89" // matches
 * 
 * const pattern2 = createFloatPattern(".", ","); 
 * "1234" // matches
 * "1234,56" // matches
 * "1.234,56" // matches
 * "1.234.567,89" // matches
 */
export function createFloatPattern( thousandsSeparator : string, decimalSeparator : string ) : string {
    const escapedDecimalSeparator = decimalSeparator.replace(/[.,]/g, '\\$&');
    return `(?:${createIntegerPattern(thousandsSeparator)}|\\d+)(?:${escapedDecimalSeparator}\\d+)?`;
}

/**
 * Creates a function that parses floats with thousands separators and decimal separator.
 * Requires decimalSeparator and thousandsSeparator to be different.
 * @param thousandsSeparator The character used to separate thousands (e.g. " " or "_" or "," or ".")
 * @param decimalSeparator The character used as decimal separator ("." or ",")
 * @returns A function that takes a string match and returns the parsed float
 * @example
 * const parser = createFloatParser(",", ".");
 * parser("1234") // returns 1234
 * parser("1234.56") // returns 1234.56
 * parser("1,234.56") // returns 1234.56
 * parser("1,234,567.89") // returns 1234567.89
 * 
 * const parser2 = createFloatParser(".", ",");
 * parser2("1234") // returns 1234
 * parser2("1234,56") // returns 1234.56
 * parser2("1.234,56") // returns 1234.56
 * parser2("1.234.567,89") // returns 1234567.89
 */
export function createFloatParser( thousandsSeparator : string, decimalSeparator : string ) : (_: string) => number {
    return (match: string) => {
        // Remove thousands separators
        const withoutThousands = match.replace(new RegExp(thousandsSeparator.replace(/[.,]/g, '\\$&'), 'g'), '');
        // Replace decimal separator with '.' for parseFloat
        const normalized = decimalSeparator === '.' ? withoutThousands : withoutThousands.replace(decimalSeparator, '.');
        return parseFloat(normalized);
    }
}