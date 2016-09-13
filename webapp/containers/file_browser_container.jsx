import { connect } from "react-redux";
import { createSelector } from "reselect";

import { listDirectoryRecursive } from "../api.js";
import { fetchFolder } from "../actions/folder.js";
import { showNotification } from "../actions/notifications.js";
import { playlistAddFiles } from "../actions/playlist.js";
import { File, Notification } from "../models.js";

import FileBrowser from "../components/file_browser.jsx";

const compareOptions = {
    numeric: true,
};

// Order: Directories < normal files.
// Files within the same category are sorted
// lexicographically (case ignored).
function compareFiles(f1, f2) {
    if (f1.type !== f2.type) {
        return f1.type === "directory" ? -1 : 1;
    }
    let x = File.basename(f1).toLocaleLowerCase();
    let y = File.basename(f2).toLocaleLowerCase();
    return x.localeCompare(y, undefined, compareOptions);
}

function stateToProps() {
    const getProps = createSelector(
        state => state.folder,
        (folder) => {
            const items = folder.items.slice().sort(compareFiles);
            return Object.assign({}, folder, { items });
        }
    );
    return state => getProps(state);
}

function flattenTree(items) {
    let result = [];

    function recurse(items) {
        let sorted = items.slice().sort((a, b) => {
            return compareFiles(a.file, b.file);
        });

        for (let { items: childItems, file } of sorted) {
            if (childItems) {
                recurse(childItems);
            } else {
                result.push(file);
            }
        }
    }

    recurse(items);
    return result;
}

function dispatchToProps(dispatch) {
    return {
        onFetchFolder(path) {
            dispatch(fetchFolder(path));
        },

        onAdd(file) {
            if (file.type === "directory") {
                listDirectoryRecursive(File.path(file))
                    .then(items => {
                        dispatch(playlistAddFiles(flattenTree(items)));
                    })
                    .catch(error => {
                        console.error(error);
                        dispatch(showNotification(Notification.create("error", error.message)));
                    });
            } else {
                dispatch(playlistAddFiles([file]));
            }
        },
    };
}

export default connect(stateToProps, dispatchToProps)(FileBrowser);
