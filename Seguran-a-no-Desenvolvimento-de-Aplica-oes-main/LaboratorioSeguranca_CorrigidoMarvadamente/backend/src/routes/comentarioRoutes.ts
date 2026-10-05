import { Router } from "express";
import { criarComentario, listarComentarios } from "../controllers/comentarioController";
import { autenticar } from "../middlewares/authMiddleware";
// [CORREÇÃO 07 - CSRF] import do middleware que valida o token anti-CSRF
import { csrfTokenMiddleware } from "../middlewares/csrfTokenMiddleware";

const router = Router();

// router.post("/", criarComentario);
// router.get("/", listarComentarios);
// [CORREÇÃO 07 - CSRF + Broken Access Control] Criar comentário altera dados (POST), então exige
// usuário autenticado (JWT no cookie) E o token anti-CSRF no cabeçalho. Antes qualquer pessoa,
// mesmo sem login ou vinda de outro site, conseguia criar comentários.
router.post("/", autenticar, csrfTokenMiddleware, criarComentario);
router.get("/", autenticar, listarComentarios);

export default router;