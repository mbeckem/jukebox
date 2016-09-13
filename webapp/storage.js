// TODO: Compat layer when no localstorage?

const storage = window.localStorage;

export function set(key, value) {
    storage.setItem(key, value);
}

export function get(key) {
    return storage.getItem(key);
}

export function clear() {
    storage.clear();
}
