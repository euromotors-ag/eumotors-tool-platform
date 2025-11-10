import { Result } from "../result/index.mjs";
import { FormatMap, parse } from "./parsing";

export function parseDate( s : string | undefined, patternString: string ) : Result<(number|undefined)[], string | undefined> {

    if( !s ) return Result.err(undefined);

    let matches;
    try{
        matches = parse<number>( s, patternString, FORMAT_MAP )
    } catch (e) {
        console.error(e);
        return Result.err(s)
    };

    const matchesMap = new Map<string, number>( matches );

    const year = matchesMap.get( "YYYY" );
    const month = matchesMap.get( "MM" ) ?? matchesMap.get( "M" );
    const day = matchesMap.get( "DD" ) ?? matchesMap.get( "D" );

    return Result.ok( [ year, month, day ] );
}

const FORMAT_MAP : FormatMap<number> = {
    "YYYY"   : { regexString : "\\d{4}", parser : parseInt },
    // "YY"     : { regexString : "\\d{2}", parser : (s:string) => {parseInt(s) + 2000 }, // 24 -> 2024 YAGNI
    "DD"     : { regexString : "\\d{2}", parser : parseInt }, // 06, 16
    "D"      : { regexString : "\\d{1,2}", parser : parseInt }, // 6, 16
    "MM"     : { regexString : "\\d{2}", parser : parseInt }, // 06, 12
    "M"      : { regexString : "\\d{1,2}", parser : parseInt } // 6, 12
}