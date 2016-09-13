import { connect } from "react-redux";
import { createSelector } from "reselect";

import Notifications from "../components/notifications.jsx";

function stateToProps() {
    const getProps = createSelector(
        state => state.notifications,
        notifications => {
            return { notifications };
        }
    );

    return state => getProps(state);
}

export default connect(stateToProps)(Notifications);
