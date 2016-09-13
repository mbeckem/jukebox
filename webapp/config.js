import { trimLeft, trimRight } from "./utils.js";

/* globals GLOBAL_CONFIG */
const config = GLOBAL_CONFIG;

export function url(path) {
    return trimRight(config.base_url, "/") + "/" + trimLeft(path, "/");
}

export default config;
