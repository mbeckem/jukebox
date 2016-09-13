import { connect } from "react-redux";
import { createSelector } from "reselect";

import {
    playlistRemoveItem,
    playlistClear
} from "../actions/playlist.js";

import {
    changeCurrentItem
} from "../actions/player.js";

import Playlist from "../components/playlist.jsx";

function stateToProps() {
    const getProps = createSelector(
        state => state.player.currentItemId,
        state => state.playlist,
        (currentItemId, playlist) => {
            return {
                playlist,
                currentItemId,
            };
        }
    );

    return state => getProps(state);
}

function dispatchToProps(dispatch) {
    return {
        onItemActivated(item) {
            dispatch(changeCurrentItem(item.id));
        },
        onItemRemoved(item) {
            dispatch(playlistRemoveItem(item.id));
        },
        onClear() {
            dispatch(playlistClear());
        }
    };
}

export default connect(stateToProps, dispatchToProps)(Playlist);
