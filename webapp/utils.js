// Iterates over the keys of all objects in "sources"
// and assigns them to "target", in the order they are passed.
// Keys with undefined values will not be assigned to the target.
export function assignDefined(target, ...sources) {
    for (let source of sources) {
        for (let key in source) {
            if (source.hasOwnProperty(key)) {
                let val = source[key];
                if (val !== undefined) {
                    target[key] = val;
                }
            }
        }
    }
    return target;
}

// Suppresses the default action of the given DOM-Event
// and stops its Propagation.
// This function can be called normally or can be registered
// as a DOM-Event handler.
export function suppressEvent(e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
}

// Trims all occurrences of "char" at the beginning of "str".
export function trimLeft(str, char) {
    let n = str.length;
    let i = 0;
    while (i < n && str[i] === char) {
        ++i;
    }
    return str.substring(i);
}

// Trims all occurrences of "char" at the end of "str".
export function trimRight(str, char) {
    let i = str.length;
    while (i > 0 && str[i - 1] === char) {
        --i;
    }
    return str.substring(0, i);
}


// Call a function at most every N milliseconds.
function rateLimit(func, millis) {
    let lastCall = null;
    let scheduledCall = null;

    function call(args) {
        lastCall = Date.now();
        func(...args);
    }

    function limited(...args) {
        const now = Date.now();
        const nextCall = lastCall === null ? now : lastCall + millis;
        if (nextCall <= now) {
            call(args);
        } else {
            if (scheduledCall !== null) {
                clearTimeout(scheduledCall);
            }

            scheduledCall = setTimeout(() => call(args), nextCall - now);
        }
    };
    return limited;
}
