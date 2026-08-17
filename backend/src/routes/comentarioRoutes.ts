import { Router } from "express";
import { criarComentario, listarComentarios } from "../controllers/comentarioController";

const router = Router();

router.post("/", criarComentario);
router.get("/", listarComentarios);

export default router;