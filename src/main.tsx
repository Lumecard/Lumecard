import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { CONFIG_ERRORS } from "./config/network";

function ConfigProblem() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#0e0d12] px-4 text-white">
      <div className="w-full max-w-lg rounded-3xl bg-[#17161c] p-6">
        <h1 className="text-xl font-semibold">Lumecard is not set up</h1>
        <p className="mt-2 text-sm text-neutral-400">These settings are missing or wrong. Fix them in the environment variables and redeploy. See .env.example.</p>
        <ul className="mt-4 space-y-1.5 font-mono text-xs text-orange-400">
          {CONFIG_ERRORS.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// The app is loaded only after the settings pass, so a missing address shows the message above
// instead of a blank page.
if (CONFIG_ERRORS.length > 0) {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <ConfigProblem />
    </React.StrictMode>,
  );
} else {
  import("./app");
}
