import { fetchMetadata } from "../api.js";

import { addNotification, removeNotification, showNotification } from "./notifications.js";
import { File, PlaylistItem, Notification } from "../models.js";

export const PLAYLIST_ADD_ITEMS = "PLAYLIST_ADD_ITEMS";
export const PLAYLIST_REMOVE_ITEM = "PLAYLIST_REMOVE_ITEM";
export const PLAYLIST_CLEAR = "PLAYLIST_CLEAR";

export function playlistAddItems(items) {
    return {
        type: PLAYLIST_ADD_ITEMS,
        items
    };
}

export function playlistRemoveItem(itemId) {
    return {
        type: PLAYLIST_REMOVE_ITEM,
        itemId
    };
}

export function playlistClear() {
    return {
        type: PLAYLIST_CLEAR,
    };
}

export function playlistAddFiles(files) {
    return (dispatch, getState) => {
        if (files.length === 0) {
            return;
        }

        let notification;
        if (files.length > 1) {
            notification = Notification.create("progress", `Adding ${files.length} entries.`);
            dispatch(addNotification(notification));
        }

        fetchMetadata(files.map(file => File.path(file)))
            .then(data => {
                dispatch(playlistAddItems(
                    files.map((file, index) => PlaylistItem.create(file, data[index]))
                ));
            })
            .catch(error => {
                console.error("Failed to fetch metadata", error);
                dispatch(showNotification(Notification.create("error", error.message)));
            })
            .then(() => {
                if (notification) {
                    dispatch(removeNotification(notification.id));
                }
            });
    };
}
