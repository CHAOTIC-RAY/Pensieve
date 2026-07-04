import * as chrono from 'chrono-node';
console.log(JSON.stringify(chrono.parse("Between Jan 1 to Jan 5"), null, 2));
console.log(JSON.stringify(chrono.parse("last 7 days"), null, 2));
console.log(JSON.stringify(chrono.parse("July 5th"), null, 2));
