import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster
      position="bottom-right"
      theme="dark"
      toastOptions={{
        style: {
          background: "#0D0D0E",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#F5F5F0",
          fontFamily: "monospace",
          fontSize: "13px",
        },
      }}
    />
  </>
);
