import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import AresTest from "./ares-test/AresTest";

const Root = window.location.hash.includes("ares-test") ? AresTest : App;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
