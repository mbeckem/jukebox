export const NOTIFICATION_ADD = "NOTIFICATION_ADD";
export const NOTIFICATION_REMOVE = "NOTIFICATION_REMOVE";

export function addNotification(notification) {
    return {
        type: NOTIFICATION_ADD,
        notification
    };
}

export function removeNotification(notificationId) {
    return {
        type: NOTIFICATION_REMOVE,
        notificationId
    };
}

export function showNotification(notification, timeout = 10000) {
    return (dispatch) => {
        dispatch(addNotification(notification));

        setTimeout(() => {
            dispatch(removeNotification(notification.id));
        }, timeout);
    };
}
