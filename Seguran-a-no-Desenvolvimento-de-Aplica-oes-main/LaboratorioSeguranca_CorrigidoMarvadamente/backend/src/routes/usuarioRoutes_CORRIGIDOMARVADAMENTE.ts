import { Router } from "express";
import { login, atualizarIptu, novoLogin, getIptuPorIdUsuario, getQRCodeOrCodBarras, getIptus } from "../controllers/usuarioController";
import { autenticar, exigirAdmin, exigirDonoOuAdmin } from "../middlewares/authMiddleware";

const router = Router();

router.post("/login", login);
router.post("/novo-login", novoLogin);

// Vulnerável: rotas abaixo não tinham nenhum middleware de autenticação/
// autorização (Broken Access Control) e o método HTTP nem batia com o que
// o front-end chamava (atualizar-iptu era POST, mas o front usa PUT; e
// iptu-por-usuario era GET, mas o front manda o corpo via POST).
// router.post("/atualizar-iptu", atualizarIptu);
// router.get("/iptu-por-usuario", getIptuPorIdUsuario);
// router.get("/iptus", getIptus);
router.put("/atualizar-iptu", autenticar, exigirAdmin, atualizarIptu);
router.post("/iptu-por-usuario", autenticar, exigirDonoOuAdmin((req) => req.body.usuarioId), getIptuPorIdUsuario);
router.get("/iptus", autenticar, exigirAdmin, getIptus);

router.get("/codigo-qr-ou-barra", getQRCodeOrCodBarras);

export default router;