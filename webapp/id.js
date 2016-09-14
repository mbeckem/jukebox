// Returns a new id generator.
// The id counter for the new generator starts at 1
// and is incremented for each new id.
// The prefix will be appended to each id returned
// by the generator.
export function generator(prefix) {
    let next = 1;

    function id() { return next++; }

    if (prefix) {
        return () => `${prefix}-${id()}`;
    } else {
        return () => `${id()}`;
    }
}

// The default export is an id generator without a prefix.
const gen = generator();
export default gen;
