import { combineReducers } from "redux";

import {
    FETCH_FOLDER
} from "./actions/folder.js";

import {
    PLAYLIST_ADD_ITEMS,
    PLAYLIST_REMOVE_ITEM,
    PLAYLIST_CLEAR
} from "./actions/playlist.js";

import {
    CHANGE_CURRENT_ITEM
} from "./actions/player.js";

import {
    NOTIFICATION_ADD,
    NOTIFICATION_REMOVE,
} from "./actions/notifications.js";

function folder(state = {
    path: "",
    state: "done",
    error: "",
    items: [],
}, action) {
    switch (action.type) {
    case FETCH_FOLDER: {
        const { path, error, items } = action;

        switch (action.state) {
        case "loading":
            return Object.assign({}, state, {
                path, state: "loading", error: "", items: [],
            });
        case "done":
            return Object.assign({}, state, {
                path, state: "done", error: "", items,
            });
        case "error":
            return Object.assign({}, state, {
                path, state: "error", error, items: []
            });
        default:
            return state;
        }
    }
    default:
        return state;
    }
}

function playlist(state = [], action) {
    switch (action.type) {
    case PLAYLIST_ADD_ITEMS:
        return state.concat(action.items);
    case PLAYLIST_REMOVE_ITEM:
        return state.filter(item => item.id !== action.itemId);
    case PLAYLIST_CLEAR:
        return [];
    default:
        return state;
    }
}

function player(state = {
    currentItemId: null,
}, action) {
    switch (action.type) {
    case CHANGE_CURRENT_ITEM:
        return Object.assign({}, state, {
            currentItemId: action.itemId
        });
    default:
        return state;
    }
}

function notifications(state = [], action) {
    switch (action.type) {
    case NOTIFICATION_ADD:
        return state.concat(action.notification);
    case NOTIFICATION_REMOVE:
        return state.filter(notification => notification.id !== action.notificationId);
    default:
        return state;
    }
}

const app = combineReducers({
    folder, playlist, player, notifications
});

export default app;
