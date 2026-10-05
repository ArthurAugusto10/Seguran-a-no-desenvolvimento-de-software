import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import "./index.css";
import App from "./App.tsx";

// Corrigido (CSRF/autenticação): sem isso o navegador não envia o cookie
// httpOnly "token" de volta nas próximas requisições, então o back-end
// nunca conseguiria identificar o usuário autenticado.
axios.defaults.withCredentials = true;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);