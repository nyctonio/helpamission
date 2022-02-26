// js for providing a calender

var calenderProvider = {
    getCalender: function (date, callback) {
        var calender = new Date(date);
        var year = calender.getFullYear();
        var month = calender.getMonth() + 1;
        var day = calender.getDate();
        var url = "http://www.google.com/calendar/feeds/usa__en%40holiday.calendar.google.com/public/basic?alt=json-in-script&callback=calenderProvider.getCalenderCallback&start-min=" + year + "-" + month + "-" + day + "&start-max=" + year + "-" + month + "-" + day + "&max-results=100&orderby=starttime&singleevents=true&sortorder=ascending";
        var script = document.createElement('script');
        script.src = url;
        document.body.appendChild(script);
    },
    getCalenderCallback: function (data) {
        var calender = data.feed.entry;
        var calenderArray = [];
        for (var i = 0; i < calender.length; i++) {
            var calenderObj = {};
            calenderObj.title = calender[i].title.$t;
            calenderObj.content = calender[i].content.$t;
            calenderObj.startTime = calender[i].gd$when[0].startTime;
            calenderObj.endTime = calender[i].gd$when[0].endTime;
            calenderArray.push(calenderObj);
        }
        calenderProvider.getCalenderCallbackCallback(calenderArray);
    },
    getCalenderCallbackCallback: function (calenderArray) {
        console.log(calenderArray);
    }
};