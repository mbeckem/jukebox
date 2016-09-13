import React, { PropTypes } from "react";
import ReactDOM from "react-dom";
import shallowCompare from "react-addons-shallow-compare";
import classNames from "classnames";

import { Direction } from "../actions/player.js";
import { formatDuration } from "../format.js";
import { File, Notification } from "../models.js";
import * as storage from "../storage.js";
import * as api from "../api.js";
import { suppressEvent as suppress } from "../utils.js";

function bounds(low, high, val) {
    return Math.max(low, Math.min(high, val));
}

// // Call a function at most every N milliseconds.
// function rateLimit(func, millis) {
//     let lastCall = null;
//     let scheduledCall = null;

//     function call(args) {
//         lastCall = Date.now();
//         func(...args);
//     }

//     function limited(...args) {
//         const now = Date.now();
//         const nextCall = lastCall === null ? now : lastCall + millis;
//         if (nextCall <= now) {
//             call(args);
//         } else {
//             if (scheduledCall !== null) {
//                 clearTimeout(scheduledCall);
//             }

//             scheduledCall = setTimeout(() => call(args), nextCall - now);
//         }
//     };
//     return limited;
// }

const Progress = React.createClass({
    propTypes: {
        currentTime: PropTypes.number.isRequired,
        duration: PropTypes.number.isRequired,
        onSeekStart: PropTypes.func,
        onSeek: PropTypes.func,
        onSeekEnd: PropTypes.func,
    },

    getInitialState() {
        return { seeking: false };
    },

    stopSeek() {
        document.removeEventListener("mousemove", this.onMouseMove, false);
        document.removeEventListener("mouseup", this.onMouseUp, false);

        this.setState({ seeking: false });
    },

    shouldComponentUpdate(nextProps, nextState) {
        return shallowCompare(this, nextProps, nextState);
    },

    seekPosition(e) {
        const bar = ReactDOM.findDOMNode(this.refs.bar);
        const width = Math.max(1, bar.offsetWidth);
        const rel = bounds(0, 1, (e.clientX - bar.offsetLeft) / width);

        return rel * this.props.duration;
    },

    onMouseDown(e) {
        suppress(e);

        document.addEventListener("mousemove", this.onMouseMove, false);
        document.addEventListener("mouseup", this.onMouseUp, false);

        if (this.props.onSeekStart) {
            this.props.onSeekStart(this.seekPosition(e));
        }
        this.setState({ seeking: true });
    },

    onMouseMove(e) {
        suppress(e);

        if (this.props.onSeek) {
            this.props.onSeek(this.seekPosition(e));
        }
    },

    onMouseUp(e) {
        suppress(e);

        document.removeEventListener("mousemove", this.onMouseMove, false);
        document.removeEventListener("mouseup", this.onMouseUp, false);

        if (this.props.onSeekEnd) {
            this.props.onSeekEnd(this.seekPosition(e));
        }
        this.setState({ seeking: false });
    },

    render() {
        const { currentTime, duration } = this.props;
        const { seeking } = this.state;

        const percent = duration !== 0 ? bounds(0, 100, 100 * currentTime / duration) : 0;

        const progressStyle = {
            width: percent+"%",
        };

        return (
            <div ref="bar" className="player-progress-container" onMouseDown={this.onMouseDown}>
                <div className={classNames("player-progress", { seeking })} style={progressStyle} />
            </div>
        );
    }
});

const Volume = React.createClass({
    propTypes: {
        onVolumeSelected: PropTypes.func.isRequired,
    },

    shouldComponentUpdate(nextProps, nextState) {
        return shallowCompare(this, nextProps, nextState);
    },

    onMouseDown(e) {
        suppress(e);

        document.addEventListener("mousemove", this.onMouseMove, false);
        document.addEventListener("mouseup", this.onMouseUp, false);

        this.props.onVolumeSelected(this.calcVolume(e));
    },

    onMouseUp(e) {
        suppress(e);

        document.removeEventListener("mousemove", this.onMouseMove, false);
        document.removeEventListener("mouseup", this.onMouseUp, false);
    },

    onMouseMove(e) {
        suppress(e);

        this.props.onVolumeSelected(this.calcVolume(e));
    },

    calcVolume(e) {
        const bar = ReactDOM.findDOMNode(this.refs.bar);
        const width = Math.max(1, bar.offsetWidth);
        return bounds(0, 1, (e.clientX - bar.offsetLeft) / width);
    },

    render() {
        const { volume } = this.props;
        const percent = bounds(0, 100, volume * 100);

        const style = { width: percent + "%" };

        function suffix() {
            if (volume === 0) return "off";
            else if (volume <= 0.5) return "down";
            else return "up";
        }

        return (
            <div className="player-volume-container">
                <span className={"fa fa-fw fa-volume-"+suffix()} />
                <div ref="bar" className="player-volume-bar-container" onMouseDown={this.onMouseDown}>
                    <div className="player-volume-bar" style={style} />
                </div>
            </div>
        );
    }
});

const Player = React.createClass({
    propTypes: {
        currentItem: PropTypes.object,
        advancePlayer: PropTypes.func.isRequired,
        changeCurrentItem: PropTypes.func.isRequired,
        showNotification: PropTypes.func.isRequired,
    },

    getInitialState() {
        const oldVolume = Number.parseFloat(storage.get("volume"));

        return {
            currentTime: 0,
            duration: null,
            volume: oldVolume || 0.5,
            playing: false,
            seeking: false,
        };
    },

    componentWillReceiveProps(nextProps) {
        if (nextProps.currentItem !== this.props.currentItem) {
            this.setState({
                currentTime: 0,
                duration: null,
                playing: false,
                seeking: false,
            });
            this.refs.seekBar.stopSeek();
        }
    },

    componentDidMount() {
        const audio = ReactDOM.findDOMNode(this.refs.audio);
        audio.volume = this.state.volume;

        const listen = (ev, handler) => {
            audio.addEventListener(ev, handler, false);
        };

        listen("loadstart", this.onLoadStart);
        listen("error", this.onError);
        listen("loadedmetadata", this.onLoadedMetadata);
        listen("pause", this.onPause);
        listen("play", this.onPlay);
        listen("timeupdate", this.onTimeUpdate);
        listen("volumechange", this.onVolumeChange);
        listen("durationchange", this.onDurationChange);
        listen("ended", this.onEnded);

        if (this.props.currentItem) {
            audio.play();
        }
    },

    componentWillUnmount() {
        const audio = ReactDOM.findDOMNode(this.refs.audio);
        const unlisten = (ev, handler) => {
            audio.removeEventListener(ev, handler, false);
        };

        unlisten("loadstart", this.onLoadStart);
        unlisten("error", this.onError);
        unlisten("loadedmetadata", this.onLoadedMetadata);
        unlisten("pause", this.onPause);
        unlisten("play", this.onPlay);
        unlisten("timeupdate", this.onTimeUpdate);
        unlisten("volumechange", this.onVolumeChange);
        unlisten("durationchange", this.onDurationChange);
        unlisten("ended", this.onEnded);
    },

    componentDidUpdate(prevProps) {
        const lastId = prevProps.currentItem ? prevProps.currentItem.id : null;
        const id = this.props.currentItem ? this.props.currentItem.id : null;
        if (lastId === id) {
            return;
        }

        const audio = ReactDOM.findDOMNode(this.refs.audio);
        audio.pause();
        audio.load();
        if (this.props.currentItem) {
            audio.play();
        }
    },

    onLoadStart() {

    },

    onSourceError() {
        this.playbackFailed("the source file could not be loaded");
    },

    onError() {
        const audio = ReactDOM.findDOMNode(this.refs.audio);
        const {
            code,
            MEDIA_ERR_ABORTED,
            MEDIA_ERR_NETWORK,
            MEDIA_ERR_DECODE,
            MEDIA_ERR_SRC_NOT_SUPPORTED,
        } = audio.error;

        function getError() {
            switch (code) {
            case MEDIA_ERR_ABORTED:
                return "playback was aborted by user";
            case MEDIA_ERR_NETWORK:
                return "a network error occurred while loading the file";
            case MEDIA_ERR_DECODE:
                return "the file was corrupt";
            case MEDIA_ERR_SRC_NOT_SUPPORTED:
                return "the file format could not be played";
            default:
                return "unknown error";
            }
        }
        this.playbackFailed(getError());
    },

    playbackFailed(errorMessage) {
        console.assert(this.props.currentItem !== null, "No current item");

        const basename = File.basename(this.props.currentItem.file);
        const message = `Failed to play ${basename}: ${errorMessage}.`;
        this.props.showNotification(Notification.create("error", message));
        this.props.advancePlayer(Direction.NEXT, false);
    },

    onLoadedMetadata() {
        const audio = ReactDOM.findDOMNode(this.refs.audio);

        this.setState({
            duration: audio.duration,
        });
    },

    onPlay() {
        this.setState({
            playing: true,
        });
    },

    onPause() {
        this.setState({
            playing: false,
        });
    },

    onTimeUpdate() {
        const audio = ReactDOM.findDOMNode(this.refs.audio);

        if (this.state.seeking) {
            // Ignore updates since the mouse dragging updates the view now.
            return;
        }
        if (!this.props.currentItem) {
            // Firefox will send timeupdate events when stopping,
            // i.e. the audio element is at position "0" of a non-existing
            // track.
            return;
        }

        this.setState({
            currentTime: audio.currentTime
        });
    },

    onDurationChange() {
        const audio = ReactDOM.findDOMNode(this.refs.audio);

        this.setState({
            duration: audio.duration,
        });
    },

    onVolumeChange() {
        const audio = ReactDOM.findDOMNode(this.refs.audio);

        storage.set("volume", audio.volume.toString());
        this.setState({
            volume: audio.volume,
        });
    },

    onEnded() {
        this.props.advancePlayer(Direction.NEXT, false);
    },

    onSeekStart(position) {
        if (this.props.currentItem) {
            this.setState({
                seeking: true,
                currentTime: position,
            });
        }
    },

    onSeek(position) {
        this.setState({
            currentTime: position
        });
    },

    onSeekEnd(position) {
        this.setState({
            seeking: false
        }, () => {
            const audio = ReactDOM.findDOMNode(this.refs.audio);
            audio.currentTime = position;
        });
    },

    onVolumeSelected(volume) {
        const audio = ReactDOM.findDOMNode(this.refs.audio);
        audio.volume = volume;
    },

    onPreviousClick() {
        this.props.advancePlayer(Direction.PREVIOUS, false);
    },

    onNextClick() {
        this.props.advancePlayer(Direction.NEXT, false);
    },

    onStopClick() {
        this.props.changeCurrentItem(null);
    },

    onPlayPauseClick() {
        const audio = ReactDOM.findDOMNode(this.refs.audio);

        if (!this.props.currentItem) {
            this.props.advancePlayer(Direction.NEXT, false);
            return;
        }

        if (this.state.playing) {
            audio.pause();
        } else {
            audio.play();
        }
    },

    renderTitle() {
        const { currentItem } = this.props;
        const { playing } = this.state;

        let title;
        if (!currentItem) {
            title = (<span>Stopped</span>);
        } else {
            title = [];
            title.push(currentItem.title || File.basename(currentItem.file));
            if (!playing) {
                title.push(" (Paused)");
            }
        }

        return (
            <div className="player-title">
                {title}
            </div>
        );
    },

    renderControlBar() {
        const { currentItem } = this.props;
        const { currentTime, duration, playing, volume } = this.state;

        const timeString = currentItem && currentTime !== null ? formatDuration(Math.floor(currentTime)) : "--:--";
        const durationString = currentItem && duration !== null ? formatDuration(Math.floor(duration)) : "--:--";

        return (
            <div className="player-control-bar">
                <div className="player-control-buttons">
                    <div className="player-control-button" onClick={this.onPreviousClick}>
                        <span className="fa fa-fast-backward" />
                    </div>
                    <div className="player-control-button" onClick={this.onPlayPauseClick}>
                        <span className={"fa " + (playing ? "fa-pause" : "fa-play")} />
                    </div>
                    <div className="player-control-button" onClick={this.onStopClick}>
                        <span className="fa fa-stop" />
                    </div>
                    <div className="player-control-button" onClick={this.onNextClick}>
                        <span className="fa fa-fast-forward" />
                    </div>
                </div>
                <Progress ref="seekBar"
                    currentTime={currentTime || 0} duration={duration || 0}
                    onSeekStart={this.onSeekStart} onSeek={this.onSeek} onSeekEnd={this.onSeekEnd}
                 />
                <div className="player-position">{timeString} | {durationString}</div>
                <Volume volume={volume} onVolumeSelected={this.onVolumeSelected} />
            </div>
        );
    },

    render() {
        const { currentItem } = this.props;

        const sourceItem = () => {
            if (!currentItem) {
                return null;
            }

            const itemUrl = api.fileUrl(File.path(currentItem.file));
            return (<source ref="source" src={itemUrl} onError={this.onSourceError} />);
        };

        return (
            <div className="player">
                <audio ref="audio" preload="auto" controls>
                    {sourceItem()}
                </audio>
                {this.renderTitle()}
                {this.renderControlBar()}
            </div>
        );
    }
});

export default Player;
