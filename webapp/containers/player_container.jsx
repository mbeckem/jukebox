import { connect } from "react-redux";
import { createSelector } from "reselect";

import { changeCurrentItem, advancePlayer } from "../actions/player.js";
import { showNotification } from "../actions/notifications.js";

import Player from "../components/player.jsx";

function stateToProps() {
    const getProps = createSelector(
        state => state.player.currentItemId,
        state => state.playlist,
        (itemId, playlist) => {
            const currentItem = itemId ? playlist.find(item => item.id === itemId) : null;

            return {
                currentItem
            };
        }
    );

    return state => {
        return getProps(state);
    };
}

export default connect(stateToProps, {
    changeCurrentItem, advancePlayer, showNotification
})(Player);
