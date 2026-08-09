import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

/* El service worker deja la app instalada y utilizable sin conexión.
   Se registra con ruta relativa para funcionar también en subdirectorios.
   Sin manifest no hay despliegue completo detrás (es el caso del archivo
   único de `build:single`), así que ni se intenta. */
const desplieguecompleto = document.querySelector('link[rel="manifest"]');
if ("serviceWorker" in navigator && desplieguecompleto && window.location.protocol !== "file:") {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register(new URL("sw.js", document.baseURI), {
        scope: new URL("./", document.baseURI).pathname,
      });
      reg.addEventListener("updatefound", () => {
        const nuevo = reg.installing;
        if (!nuevo) return;
        nuevo.addEventListener("statechange", () => {
          // Sólo avisamos si ya había una versión anterior funcionando.
          if (nuevo.state === "installed" && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent("sw-update"));
          }
        });
      });
    } catch {
      /* sin service worker la app sigue funcionando, pero necesita conexión */
    }
  });
}
