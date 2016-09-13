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

    create(directory, name, type, size = 0) {
        return {
            id: File.genId(), directory, name, type, size
        };
    },

    path(file) {
        return join(file.directory, file.name);
    },

    basename(file) {
        if (file.type === "directory") {
            return file.name;
        }
        return splitext(file.name).basename;
    },

    extension(file) {
        if (file.type === "directory") {
            return "";
        }
        return splitext(file.name).extension;
    },
};

export const PlaylistItem = {
    genId: generator("playlistItem"),

    create(file, { title, artist, album, duration}) {
        return {
            id: PlaylistItem.genId(), file,
            title, artist, album, duration
        };
    },
};

export const Notification = {
    genId: generator("notification"),

    create(type, message) {
        return {
            id: Notification.genId(), type, message
        };
    }
};
