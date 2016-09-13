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

export function listDirectory(path) {
    return get(LIST_DIRECTORY, { path })
        .then(files => {
            let items = files.map(f => {
                return File.create(path, f.name, f.type, f.size);
            });
            return items;
        });
}

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

export function listDirectoryRecursive(path) {
    return get(LIST_DIRECTORY, { path, recursive: 1})
        .then(files => {
            return mapDirectoryTree(files, path);
        });
}

export function fetchMetadata(paths) {
    return post(METADATA_BULK, JSON.stringify(paths));
}

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
