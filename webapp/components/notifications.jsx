import React, { PropTypes } from "react";

const headers = {
    "error": "Error.",
    "warning": "Warning.",
};

// Renders a list of notifications.
const Notifications = React.createClass({
    propTypes: {
        notifications: PropTypes.array.isRequired,
    },

    render() {
        const { notifications } = this.props;

        const items = notifications.map(n => {
            let head = (n.type in headers) ? (
                <span className="header">{headers[n.type]}</span>
            ) : null;

            return (
                <div key={n.id} className={`notification ${n.type}`}>
                    {head} <span>{n.message}</span>
                </div>
            );
        });

        return (
            <div className="notifications">
                {items}
            </div>
        );
    }
});

export default Notifications;
