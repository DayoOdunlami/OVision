import React from "react";
import { createRoot } from "react-dom/client";
import App from "./tend/App.jsx";
import { registerWorker } from "./tend/register-worker.js";
const hour = new URLSearchParams(location.search).has("h")
  ? Number(new URLSearchParams(location.search).get("h"))
  : new Date().getHours();
document.body.dataset.theme = hour < 7 || hour >= 20 ? "night" : "day";
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
registerWorker();
