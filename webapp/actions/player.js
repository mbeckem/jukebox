export const CHANGE_CURRENT_ITEM = "CHANGE_CURRENT_ITEM";

// Set the player's current item.
export function changeCurrentItem(itemId) {
    return {
        type: CHANGE_CURRENT_ITEM,
        itemId,
    };
}

export const Direction = {
    NEXT: "DIRECTION_NEXT",
    PREVIOUS: "DIRECTION_PREVIOUS",
    RANDOM: "DIRECTION_RANDOM",
};

// Advance the player in the given direction,
// taking the current playlist into account.
export function advancePlayer(direction, wrap) {
    return (dispatch, getState) => {
        const { player, playlist } = getState();

        if (playlist.length === 0) {
            dispatch(changeCurrentItem(null));
            return;
        }

        const currentId = player.currentItemId;
        const currentIndex = currentId ? playlist.findIndex(item => {
            return item.id === currentId;
        }) : -1;

        let nextIndex;
        switch (direction) {
        case Direction.NEXT:
            nextIndex = currentIndex + 1;
            if (wrap && nextIndex >= playlist.length) {
                nextIndex = 0;
            }
            break;
        case Direction.PREVIOUS:
            nextIndex = currentIndex - 1;
            if (wrap && nextIndex < 0) {
                nextIndex = playlist.length - 1;
            }
            break;
        case Direction.RANDOM:
            nextIndex = Math.floor(Math.random() * playlist.length);
            break;
        }

        const nextId = nextIndex >= 0 && nextIndex < playlist.length
                        ? playlist[nextIndex].id
                        : null;
        dispatch(changeCurrentItem(nextId));
    };
}
