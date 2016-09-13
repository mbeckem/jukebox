import React, { PropTypes } from "react";
import shallowCompare from "react-addons-shallow-compare";
import classNames from "classnames";

import { File } from "../models.js";
import { formatDuration } from "../format.js";

import TextLink from "./text_link.jsx";

const PlaylistItem = React.createClass({
    propTypes: {
        onActivate: PropTypes.func.isRequired,
        onRemove: PropTypes.func.isRequired,

        index: PropTypes.number.isRequired,
        active: PropTypes.bool.isRequired,
        item: PropTypes.object.isRequired,
    },

    shouldComponentUpdate(nextProps, nextState) {
        return shallowCompare(this, nextProps, nextState);
    },

    onActivate() {
        this.props.onActivate(this.props.item);
    },

    onRemove(e) {
        e.preventDefault();
        this.props.onRemove(this.props.item);
    },

    render() {
        const { index, active, item } = this.props;

        const title = item.title || File.basename(item.file);
        const artist = item.artist || "";
        const duration = item.duration ? formatDuration(item.duration) : "";
        const file = item.file.name;
        const path = File.path(item.file);

        return (
            <div className={classNames("playlist-item", { active })}>
                <div className="playlist-cell playlist-column-index">{index + 1}.</div>
                <div className="playlist-cell playlist-column-title">
                    <TextLink onClick={this.onActivate} text={title} />
                </div>
                <div className="playlist-cell playlist-column-artist">{artist}</div>
                <div className="playlist-cell playlist-column-file" title={path}>{file}</div>
                <div className="playlist-cell playlist-column-duration">{duration}</div>
                <div className="playlist-cell playlist-column-controls">
                    <span
                        title="Remove from playlist"
                        onClick={this.onRemove} className="fa fa-times icon-button remove"
                    />
                </div>
            </div>
        );
    }
});

const Playlist = React.createClass({
    propTypes: {
        playlist: PropTypes.array.isRequired,
        currentItemId: PropTypes.any,
        onItemActivated: PropTypes.func.isRequired,
        onItemRemoved: PropTypes.func.isRequired,
        onClear: PropTypes.func.isRequired,
    },

    shouldComponentUpdate(nextProps, nextState) {
        return shallowCompare(this, nextProps, nextState);
    },

    renderChildren() {
        const { playlist, currentItemId, onItemActivated, onItemRemoved } = this.props;

        if (playlist.length === 0) {
            return (
                <div className="playlist-empty">
                    Your playlist is empty.
                </div>
            );
        }
        return playlist.map((item, index) => {
            return (
                <PlaylistItem key={item.id}
                    index={index} active={item.id === currentItemId} item={item}
                    onActivate={onItemActivated} onRemove={onItemRemoved}
                />
            );
        });
    },

    render() {
        const { playlist, onClear } = this.props;

        return (
            <div className="playlist">
                <div className="playlist-header">
                    <div className="playlist-cell playlist-column-index">Index</div>
                    <div className="playlist-cell playlist-column-title">Title</div>
                    <div className="playlist-cell playlist-column-artist">Artist</div>
                    <div className="playlist-cell playlist-column-file">File</div>
                    <div className="playlist-cell playlist-column-duration">Duration</div>
                    <div className="playlist-cell playlist-column-controls"></div>
                </div>
                <div className="playlist-body">
                    {this.renderChildren()}
                </div>
                <div className="playlist-footer">
                    {playlist.length} Entries (<TextLink onClick={onClear} text="clear" />)
                </div>
            </div>
        );
    }
});

export default Playlist;
