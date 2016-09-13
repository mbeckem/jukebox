let next = 1;

export default function id() {
    return ""+ (next++);
}

export function generator(prefix) {
    let next = 1;

    function id() { return next++; }

    if (prefix) {
        return () => `${prefix}-${id()}`;
    } else {
        return () => `${id()}`;
    }
}
