import { trimLeft, trimRight } from "./utils.js";

/* globals GLOBAL_CONFIG */
export const config = GLOBAL_CONFIG;

// Takes a url path and prepends the applications
// base url.
// i.e. if the application is hosted at "/jukebox",
// the call url("/api/list-dirctory") results in
// "/jukebox/api/list-directory".
// The applications base url can be accessed via config.base_url
// and might include the url scheme or host name.
export function url(path) {
    return trimRight(config.base_url, "/") + "/" + trimLeft(path, "/");
}


export default config;
