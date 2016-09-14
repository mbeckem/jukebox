import { generator } from "./id.js";

// Joins the given number of paths together.
// Note: paths are always absolute.
export function join(...paths) {
    let result = "";
    for (let i = 0, len = paths.length; i < len; ++i) {
        let path = paths[i];

        for (let p of parts(path)) {
            result += "/";
            result += p;
        }
    }
    return result === "" ? "/" : result;
}

// Split the path into "parent" and "child".
// Parent contains all path segments except for the last one,
// which is stored in child.
export function split(path) {
    let child = "";
    let parent = "";
    for (let p of parts(path)) {
        if (child) {
            parent += "/";
            parent += child;
        }
        child = p;
    }
    parent = parent === "" ? "/" : parent;
    return { parent, child };
}

// Returns the parent directory of path or "/" if path is equal to "/".
// Note: paths are always absolute.
export function parent(path) {
    return split(path).parent;
}

// Returns the filename of "path".
export function child(path) {
    return split(path).child;
}

// Yields all parts of the path, i.e.
// all non-empty names separated by "/".
export function* parts(path) {
    let n = path.length;
    let i = 0;

    while (i !== n) {
        let j = path.indexOf("/", i);
        if (j === -1) {
            j = n;
        }

        if (i !== j)
            yield path.substring(i, j);
        if (j === n)
            break;
        i = j + 1;
    }
}

// Splits the filename into basename and extension.
// Everything up the last dot is the filename.
// The extension does not include the dot.
export function splitext(name) {
    const dot = name.lastIndexOf(".");

    let basename = name;
    let extension = "";
    if (dot !== -1) {
        basename = name.substring(0, dot);
        extension = name.substring(dot + 1);
    }
    return { basename, extension };
}

export const File = {
    genId: generator("file"),

    // Creates a new file object with a unique id.
    // "type" must be either "file" or "directory".
    create(directory, name, type, size = 0) {
        return {
            id: File.genId(), directory, name, type, size
        };
    },

    // Returns the absolute path of the given file.
    path(file) {
        return join(file.directory, file.name);
    },

    // Returns the basename of the given file.
    basename(file) {
        if (file.type === "directory") {
            return file.name;
        }
        return splitext(file.name).basename;
    },

    // Returns the extension of the given file.
    extension(file) {
        if (file.type === "directory") {
            return "";
        }
        return splitext(file.name).extension;
    },
};

export const PlaylistItem = {
    genId: generator("playlistItem"),

    // Creates a new playlist item with a unique id
    // and the given properties.
    // Audio metadata such as title or artist can be set to null.
    create(file, { title, artist, album, duration}) {
        return {
            id: PlaylistItem.genId(), file,
            title, artist, album, duration
        };
    },
};

export const Notification = {
    genId: generator("notification"),

    // Creates a new notification object with the given type
    // and message.
    create(type, message) {
        return {
            id: Notification.genId(), type, message
        };
    }
};
