import { listDirectory } from "../api.js";

export const FETCH_FOLDER = "FETCH_FOLDER";

export function fetchFolder(path) {
    return (dispatch, getState) => {
        const { folder } = getState();

        if (path === folder.path && folder.state === "loading") {
            return Promise.resolve("in progress");
        }

        dispatch({type: FETCH_FOLDER, state: "loading", path});

        return listDirectory(path)
            .then(items => {
                dispatch({type: FETCH_FOLDER, state: "done", path, items});
            })
            .catch(error => {
                console.error(`Failed to load path ${path}`, error);
                dispatch({type: FETCH_FOLDER, state: "error", path, error: error.message});
            });
    };
}
