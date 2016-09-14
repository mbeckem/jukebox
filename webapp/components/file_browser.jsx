import React, { PropTypes } from "react";
import ReactDOM from "react-dom";
import shallowCompare from "react-addons-shallow-compare";

import { parent, File } from "../models.js";

import TextLink from "./text_link.jsx";

// The file browser renders the content of a directory.
const FileBrowser = React.createClass({
    propTypes: {
        onFetchFolder: PropTypes.func.isRequired,
        onAdd: PropTypes.func.isRequired,
        path: PropTypes.string,
        state: PropTypes.string.isRequired,
        error: PropTypes.string,
        items: PropTypes.array.isRequired,
    },

    // Cache scroll positions for visited directories.
    scrollCache: {},

    loadFolder(path) {
        const body = ReactDOM.findDOMNode(this.refs.body);
        if (this.props.state === "done") {
            this.scrollCache[this.props.path] = body.scrollTop;
        }
        this.props.onFetchFolder(path);
    },

    shouldComponentUpdate(nextProps, nextState) {
        return shallowCompare(this, nextProps, nextState);
    },

    componentDidUpdate(prevProps) {
        const { path, state } = this.props;
        const { path: prevPath, state: prevState} = prevProps;

        // Remember a previous scroll position when a known directory
        // is visited again.
        if ((path === prevPath && prevState === "loading" && state === "done")
            || (path !== prevPath) && state === "done")
        {
            const body = ReactDOM.findDOMNode(this.refs.body);
            const scrollTop = this.scrollCache[this.props.path];
            if (scrollTop) {
                body.scrollTop = scrollTop;
            }
        }
    },

    onAdd(file) {
        this.props.onAdd(file);
    },

    onClickFile(file) {
        if (file.type === "directory") {
            this.loadFolder(File.path(file));
        } else {
            this.onAdd(file);
        }
    },

    onClickParent() {
        this.loadFolder(parent(this.props.path));
    },

    onClickRoot() {
        this.loadFolder("/");
    },

    onClickRefresh() {
        this.loadFolder(this.props.path);
    },

    renderChildren() {
        const { items } = this.props;

        return items.map(file => {
            function iconClass(name) {
                return "fa fa-fw fa-lg " + name;
            }

            function tooltip(filetype) {
                if (filetype === "file") {
                    return "Add file to playlist";
                } else {
                    return "Add all files in this folder and its subfolders to playlist";
                }
            }

            let icon = iconClass(file.type === "directory" ? "fa-folder" : "fa-music");
            return (
                <div key={file.id} className="file-browser-item">
                    <span className={`file-browser-item-icon ${icon}`} />
                    <div className="file-browser-item-name">
                        <TextLink onClick={this.onClickFile.bind(this, file)} text={File.basename(file)}/>
                    </div>
                    <div className="file-browser-item-controls">
                        <span
                            onClick={this.onAdd.bind(this, file)} className="fa fa-plus icon-button"
                            title={tooltip(file.type)}
                        />
                    </div>
                </div>
            );
        });
    },

    render() {
        const { path, state, items } = this.props;

        const body = () => {
            switch (state) {
            case "loading":
                return null;
            case "error":
                return (
                    <div className="file-browser-status">Failed to load directory content.</div>
                );
            case "done":
                if (items.length === 0) {
                    return (
                        <div className="file-browser-status">This directory is empty.</div>
                    );
                }
                return this.renderChildren();
            }
        };

        return (
            <div className="file-browser">
                <div className="file-browser-header">
                    <div className="file-browser-button"
                        onClick={this.onClickParent}
                        title="Browse to parent">
                        <span className="fa fa-level-up" />
                    </div>
                    <div className="file-browser-button"
                        onClick={this.onClickRoot}
                        title="Browse to root">
                        <span className="fa fa-desktop" />
                    </div>
                    <div className="file-browser-button"
                        onClick={this.onClickRefresh}
                        title="Refresh current directory">
                        <span className="fa fa-refresh" />
                    </div>
                    <div className="file-browser-path" title={path}>
                        {path}
                    </div>
                </div>
                <div className="file-browser-body" ref="body">
                    {body()}
                </div>
            </div>
        );
    }
});

export default FileBrowser;
