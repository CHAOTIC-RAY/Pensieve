import * as chrono from 'chrono-node';

function parseDateRange(query) {
    const parsedDates = chrono.parse(query);
    if (parsedDates.length > 0) {
        const result = parsedDates[0];
        let startDate = result.start.date();
        let endDate = result.end ? result.end.date() : null;
        
        if (!endDate) {
           const isRelativePast = result.text.toLowerCase().includes('last') || result.text.toLowerCase().includes('past');
           if (isRelativePast) {
               endDate = new Date();
               if (startDate > endDate) {
                   let temp = startDate;
                   startDate = endDate;
                   endDate = temp;
               }
           } else {
               endDate = new Date(startDate);
               endDate.setHours(23, 59, 59, 999);
               startDate.setHours(0, 0, 0, 0);
           }
        }
        
        return { 
           start: startDate, 
           end: endDate, 
           textQuery: query.replace(result.text, '').trim() 
        };
    }
    return null;
}

console.log(parseDateRange("Between Jan 1 to Jan 5 docs"));
console.log(parseDateRange("last 7 days docs"));
console.log(parseDateRange("July 5th docs"));
console.log(parseDateRange("this month notes"));
