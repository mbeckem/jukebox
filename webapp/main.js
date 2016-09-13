import "babel-polyfill";
import React from "react";
import ReactDOM from "react-dom";
import { createStore, applyMiddleware } from "redux";
import ReduxThunk from "redux-thunk";
import { Provider } from "react-redux";

import { fetchFolder } from "./actions/folder.js";
import Reducer from "./reducers.js";

import Application from "./containers/application.jsx";

let store = createStore(Reducer, applyMiddleware(ReduxThunk));
store.dispatch(fetchFolder("/"));


console.log(store.getState());

ReactDOM.render(
    React.createElement(Provider, { store }, React.createElement(Application, null)),
    document.getElementById("container")
);

store.subscribe(() => console.log(store.getState()));
