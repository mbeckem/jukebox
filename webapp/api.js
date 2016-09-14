import { File, join, parts } from "./models.js";
import { url } from "./config.js";

export const LIST_DIRECTORY = url("/api/list-directory");
export const METADATA_BULK = url("/api/metadata-bulk");
export const DOWNLOAD = url("/files");

const defaultRequestOptions = {
    "method": "GET",
    "url": "/",
    "headers": {},
    "query": null,
    "data": null,
    "responseType": "",
};

class ApiError extends Error {
    constructor(status, type, message) {
        super(message);
        this.type = type;
        this.status = status;
        this.message = message;
    }
}

function request(options) {
    options = Object.assign({}, defaultRequestOptions, options);
    if (options.query) {
        options.url = encodeQuery(options.url, options.query);
    }

    return new Promise(function(resolve, reject) {
        var req = new XMLHttpRequest();
        req.open(options.method, options.url, true);
        req.responseType = options.responseType;

        Object.keys(options.headers || {}).forEach(function(key) {
            req.setRequestHeader(key, options.headers[key]);
        });

        req.onload = function() {
            if (req.status >= 200 && req.status < 400) {
                resolve(JSON.parse(req.response));
            } else {
                let error = JSON.parse(req.response);
                reject(new ApiError(req.status, error.type, error.message));
            }
        };

        req.onerror = function() {
            reject(new Error("Network error"));
        };

        req.send(options.data || undefined);
    });
}

// Takes an url string and a query object and
// returns a url string that contains all of the query object's properties
// as properly escaped query arguments.
export function encodeQuery(url, query) {
    return url + "?" + Object.keys(query).map(
        key => encodeURIComponent(key) + "=" + encodeURIComponent(query[key])
    ).join("&");
}

export function get(url, query) {
    return request({
        "method": "GET",
        "url": url,
        "query": query,
    });
}

export function post(url, body, contentType = "application/json") {
    return request({
        method: "POST",
        url: url,
        data: body,
        headers: {
            "Content-Type": contentType,
        },
    });
}

// List the files in the given directory.
// Returns a promise which will resolve to an array of files.
export function listDirectory(path) {
    return get(LIST_DIRECTORY, { path })
        .then(files => {
            let items = files.map(f => {
                return File.create(path, f.name, f.type, f.size);
            });
            return items;
        });
}

// Lists the files in the given directory and all subdirectories.
// Returns a promise which will resolve to a tree of nodes,
// each either representing a directory or a plain file.
export function listDirectoryRecursive(path) {
    function mapDirectoryTree(children, parentPath) {
        return children.map(f => {
            let file = File.create(parentPath, f.name, f.type, f.size);
            if (f.type === "directory") {
                return { file, items: mapDirectoryTree(f.files, File.path(file)) };
            } else {
                return { file, items: null };
            }
        });
    }

    return get(LIST_DIRECTORY, { path, recursive: 1})
        .then(files => {
            return mapDirectoryTree(files, path);
        });
}

// Fetches audio metadata for the given list of file paths.
// Returns a promise which will resolve to an array of metadata
// objects.
export function fetchMetadata(paths) {
    return post(METADATA_BULK, JSON.stringify(paths));
}

// Returns the absolute file path for the given file.
// The result string can be used to download the file.
export function fileUrl(path) {
    function escapePath(path) {
        function* escapedParts(path) {
            for (let part of parts(path)) {
                yield encodeURIComponent(part);
            }
        }

        return join(...escapedParts(path));
    }

    return join(DOWNLOAD, escapePath(path));
}
