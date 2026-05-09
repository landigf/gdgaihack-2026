import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import AresTest from "./ares-test/AresTest";
import AresApp from "./ares/AresApp";

function pickRoot() {
  const h = window.location.hash;
  if (h.includes("ares-test")) return AresTest;
  if (h.includes("ares")) return AresApp;
  return App;
}

const Root = pickRoot();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
