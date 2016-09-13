import React from "react";

import FileBrowser from "./file_browser_container.jsx";
import Player from "./player_container.jsx";
import Playlist from "./playlist_container.jsx";
import Notifications from "./notifications_container.jsx";

const Application = React.createClass({
    render() {
        return (
            <div className="application">
                <Notifications />
                <div className="panes">
                    <div className="navigation-pane">
                        Navigation
                    </div>
                    <div className="files-pane">
                        <FileBrowser />
                    </div>
                    <div className="player-pane">
                        <Playlist />
                        <Player />
                    </div>
                </div>
            </div>
        );
    }
});

export default Application;
