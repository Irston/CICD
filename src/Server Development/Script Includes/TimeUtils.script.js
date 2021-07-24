var TimeUtils = Class.create();
TimeUtils.prototype = {
    initialize: function() {},

    type: 'TimeUtils',
};

TimeUtils.getGlideTimeValueByDisplayValue = function( /* h:mm:ss */ hour) {
    if (!hour || hour.split(':').length != 3) {
        hour = '00:00:00';
    }

    var gt = new GlideTime();
    gt.setDisplayValue(hour);
    return gt.getValue();
};

TimeUtils.isReleaseWindowNow = function( /* array */ releaseWindows) {
    var gdt = new GlideDateTime();
    var currDayOfWeek = gdt.getDayOfWeek();
    var currTimeSystem = (gdt.getLocalTime() + '').split(' ')[1];
    return releaseWindows.some(function(relWindow) {
        return isCurrentWindowNow(relWindow, currDayOfWeek, currTimeSystem);
    });
};

TimeUtils.calculateNextNearestReleaseWindowInSeconds = function(
    /* array */
    releaseWindows
) {
    var secondsToClosestWindow = Infinity;
    var oneDayInSeconds = 86400;

    var gdt = new GlideDateTime();
    var currDayOfWeek = +gdt.getDayOfWeek();
    var currTimeSystem = (gdt.getLocalTime() + '').split(' ')[1];

    var currTimeSeconds = convertHourStringInSeconds(currTimeSystem);

    releaseWindows.forEach(function(window) {
        var secondsToWindow = 0;
        var currDay = currDayOfWeek;
        var startTimeSeconds = convertHourStringInSeconds(window.startTime);
        // If it starts today but after time now
        if (+window.startDay == currDay && startTimeSeconds > currTimeSeconds) {
            secondsToWindow = startTimeSeconds - currTimeSeconds;
        } else {
            var endTimeSeconds = convertHourStringInSeconds(window.endTime);
            // add the seconds left from today + seconds from 00:00:00 to EndTime
            secondsToWindow =
                oneDayInSeconds - currTimeSeconds + startTimeSeconds;
            // setting the currDayOfWeek to the next one because we already added the seconds left from today
            currDay = currDay + 1 > 7 ? 1 : currDay + 1;
            // add 86400 seconds for every day
            while (currDay != +window.startDay) {
                secondsToWindow += oneDayInSeconds;
                currDay = currDay + 1 > 7 ? 1 : currDay + 1;
            }
        }

        if (secondsToWindow < secondsToClosestWindow) {
            secondsToClosestWindow = secondsToWindow;
        }
    });

    return secondsToClosestWindow;
};

function isCurrentWindowNow(relWindow, currWeekDay, currentHour) {
    var startTimeSeconds = convertHourStringInSeconds(relWindow.startTime);
    var endTimeSeconds = convertHourStringInSeconds(relWindow.endTime);
    var currTimeSeconds = convertHourStringInSeconds(currentHour);
    // ex: both from 4 to 4
    if (+relWindow.startDay == +relWindow.endDay) {
        // ex: from 4 10:00:00 to 4 9:50:00
        if (endTimeSeconds < startTimeSeconds) {
            return currWeekDay == +relWindow.startDay ?
                currTimeSeconds <= endTimeSeconds ||
                currTimeSeconds >= startTimeSeconds :
                true;
        }
        // ex: from 4 10:00:00 to 4 11:00:00
        return currWeekDay == +relWindow.startDay ?
            startTimeSeconds <= currTimeSeconds &&
            currTimeSeconds <= endTimeSeconds :
            false;
    }

    // ex: from 4 10:00:00 to 1 10:00:00
    if (+relWindow.startDay > +relWindow.endDay) {
        if (currWeekDay == +relWindow.startDay) {
            return currTimeSeconds >= startTimeSeconds;
        }

        if (currWeekDay == +relWindow.endDay) {
            return currTimeSeconds <= endTimeSeconds;
        }

        return (
            currWeekDay > +relWindow.startDay || currWeekDay < +relWindow.endDay
        );
    }

    // ex: from 3 10:00:00 to 5 10:00:00
    if (currWeekDay == +relWindow.startDay) {
        return currTimeSeconds >= startTimeSeconds;
    }

    if (currWeekDay == +relWindow.endDay) {
        return currTimeSeconds <= endTimeSeconds;
    }

    return currWeekDay > +relWindow.startDay && currWeekDay < +relWindow.endDay;
}

function convertHourStringToObject( /* hh:MM:ss */ hour) {
    var ENUM_TIME = Object.freeze({
        0: 'hours',
        1: 'minutes',
        2: 'seconds',
    });

    return hour.split(':').reduce(function(acc, curr, index) {
        acc[ENUM_TIME[index]] = +curr;
        return acc;
    }, {});
}

function convertHourStringInSeconds( /* hh:mm:ss */ hour) {
    var ENUM_SECONDS = {
        0: 3600,
        1: 60,
        2: 1,
    };

    return hour.split(':').reduce(function(acc, curr, index) {
        return acc + +curr * ENUM_SECONDS[index];
    }, 0);
}
