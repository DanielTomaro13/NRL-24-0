import React from "react";
import { createRoot } from "react-dom/client";
import PerfectSeason from "./PerfectSeason.jsx";

const style = document.createElement("style");
style.textContent = `
  html, body, #root { height: 100%; }
  body { margin: 0; }
  * { box-sizing: border-box; }
`;
document.head.appendChild(style);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PerfectSeason />
  </React.StrictMode>
);
