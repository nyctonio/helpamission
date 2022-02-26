const calenderprovider = ({ month }) => {
    let daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const d = new Date();
    const year = d.getFullYear();;
    let firstDay = new Date(year, month, 1).getDay();
    function getDaysInMonth(month, year) {
        if ((month == 1) && (year % 4 == 0) && ((year % 100 != 0) || (year % 400 == 0))) {
            return 29;
        } else {
            return daysInMonth[month];
        }
    }

    let start = 1, end = getDaysInMonth(month, year);
    const calender = [];
    for (let i = 0; i < 6; i++) {
        let temp = [];
        for (let j = 0; j < 7; j++) {
            if (i == 0 && j < firstDay) {
                temp.push(0);
            } else {
                if (start <= end) {
                    temp.push(start);
                    start++;
                } else {
                    temp.push(0);
                }
            }
        }
        calender.push(temp);
    }
    if (calender[5][0] == 0) {
        calender.pop();
    }
    return calender;
}