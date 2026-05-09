import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import AresTest from "./ares-test/AresTest";
import AresApp from "./ares/AresApp";

function pickRoot() {
  const h = window.location.hash.replace(/^#/, "");
  if (h === "ares-test") return AresTest;
  if (h === "ares") return AresApp;
  return App;
}

const Root = pickRoot();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
