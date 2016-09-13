// Formats the given duration (in seconds) as a duration string.
export function formatDuration(duration) {
    let hours = (duration / 3600) | 0;
    duration -= hours * 3600;

    let minutes = (duration / 60) | 0;
    duration -= minutes * 60;

    let seconds = duration | 0;

    let result = "";
    if (hours > 0) {
        result += hours;
        result += ":";
        if (minutes < 10) {
            result += "0";
        }
    }

    result += minutes;
    result += ":";
    if (seconds < 10) {
        result += "0";
    }
    result += seconds;
    return result;
}
