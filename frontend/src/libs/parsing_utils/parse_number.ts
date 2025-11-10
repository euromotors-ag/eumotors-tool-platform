import { Result } from "../result/index.mjs";
import { FormatMap, parse } from "./parsing";
import { createFloatFormat, createIntegerFormat } from "./number_format";

export function parseNumber( s : string | undefined, patternString: string ) : Result<number, string | undefined> {
    if( !s ) return Result.err( undefined );

    let matches;
    try{
        matches = parse<number>( s, patternString, FORMAT_MAP )
    } catch (e) {
        console.error(e);
        return Result.err(s)
    };

    if( matches.length !== 1 ) throw new Error(`Invalid pattern string "${patternString}": has to contain exactly one number.`)
    

    return Result.ok( matches[0][1] );
}

const FORMAT_MAP : FormatMap<number>= {
    "%d()"      : createIntegerFormat(""),      // "1234567"
    "%d( )"     : createIntegerFormat(" "),     // "1 234 567" 
    "%d(,)"     : createIntegerFormat(","),     // "1,234,567"
    "%d(.)"     : createIntegerFormat("."),     // "1.234.567"
    "%f(,)"     : createFloatFormat("", ","),   // "1234,56"
    "%f( ,)"    : createFloatFormat(" ", ","),  // "1 234,56"
    "%f(.,)"    : createFloatFormat(".", ","),  // "1.234,56"
    "%f(.)"     : createFloatFormat("", "."),   // "1234.56"
    "%f( .)"    : createFloatFormat(" ", "."),  // "1 234.56"
    "%f(,.)"    : createFloatFormat(",", "."),  // "1,234.56"
}