import { Router } from "express";
import { login, atualizarIptu, novoLogin, getIptuPorIdUsuario, getQRCodeOrCodBarras, getIptus, payloadUsuario } from "../controllers/usuarioController";
import { autenticar, exigirAdmin, exigirDonoOuAdmin } from "../middlewares/authMiddleware";
// [CORREÇÃO 05 - CSRF] imports dos dois middlewares anti-CSRF
import { csrfTokenMiddleware } from "../middlewares/csrfTokenMiddleware";
import { csrfGerarTokenMiddleware as csrfGerarRecuperarTokenMiddleware } from "../middlewares/csrfGerarRecuperarTokenMiddleware";

const router = Router();

// router.post("/login", login);
// router.post("/novo-login", novoLogin);
// [CORREÇÃO 05 - CSRF] No login/cadastro o back-end gera o token anti-CSRF e o salva em cookie.
router.post("/login", csrfGerarRecuperarTokenMiddleware, login);
router.post("/novo-login", csrfGerarRecuperarTokenMiddleware, novoLogin);

// [CORREÇÃO 05 - CSRF] ROTA NOVA: o front chama esta rota ao abrir o Dashboard/Gerenciamento.
// `autenticar` valida o JWT do cookie, o middleware recupera o token CSRF do cookie e
// payloadUsuario devolve (no corpo da resposta) os dados do usuário + o token CSRF.
router.get("/payload-usuario", autenticar, csrfGerarRecuperarTokenMiddleware, payloadUsuario);

// Vulnerável: rotas abaixo não tinham nenhum middleware de autenticação/
// autorização (Broken Access Control) e o método HTTP nem batia com o que
// o front-end chamava (atualizar-iptu era POST, mas o front usa PUT; e
// iptu-por-usuario era GET, mas o front manda o corpo via POST).
// router.post("/atualizar-iptu", atualizarIptu);
// router.get("/iptu-por-usuario", getIptuPorIdUsuario);
// router.get("/iptus", getIptus);
// router.put("/atualizar-iptu", autenticar, exigirAdmin, atualizarIptu);
// router.post("/iptu-por-usuario", autenticar, exigirDonoOuAdmin((req) => req.body.usuarioId), getIptuPorIdUsuario);
// [CORREÇÃO 05 - CSRF] Rotas que usam POST/PUT (podem alterar dados) agora exigem também o token
// anti-CSRF no cabeçalho "X-CSRF-Token", comparado com o token salvo no cookie.
router.put("/atualizar-iptu", autenticar, csrfTokenMiddleware, exigirAdmin, atualizarIptu);
router.post("/iptu-por-usuario", autenticar, csrfTokenMiddleware, exigirDonoOuAdmin((req) => req.body.usuarioId), getIptuPorIdUsuario);
router.get("/iptus", autenticar, exigirAdmin, getIptus);

// router.get("/codigo-qr-ou-barra", getQRCodeOrCodBarras);
// [CORREÇÃO 06 - XSS Refletido] A rota passa a exigir usuário autenticado (a tela que usa
// só existe após o login). A correção do XSS em si está no controller getQRCodeOrCodBarras.
router.get("/codigo-qr-ou-barra", autenticar, getQRCodeOrCodBarras);

export default router;