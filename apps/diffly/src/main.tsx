import { createRoot } from "react-dom/client";
import { App } from "./app.tsx";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Diffly's root element is missing.");
}

createRoot(root).render(<App />);
