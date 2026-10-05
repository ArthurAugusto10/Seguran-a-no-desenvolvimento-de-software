import express from "express";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/usuarioRoutes_CORRIGIDOMARVADAMENTE";
import commentRoutes from "./routes/comentarioRoutes";
import hackerMalvadao from "./routes/hackerMalvadaoRoutes";

const app = express();

// Vulnerável: não existia segredo de JWT configurado em lugar nenhum
// (global.segredoJwt nunca era definido, então ValidarToken() sempre falhava).
// Corrigido: segredo carregado de variável de ambiente, com fallback só para dev.
(global as any).segredoJwt = process.env.JWT_SECRET || "segredo_super_secreto_trocar_em_producao";

app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// Vulnerável: cookies nunca eram lidos pelo back-end (sem cookie-parser),
// então não havia como validar o token de sessão enviado pelo navegador.
// Corrigido: habilita req.cookies para o middleware de autenticação.
app.use(cookieParser());

app.use("/usuario", userRoutes);
app.use("/comentario", commentRoutes);
app.use("/hacker-malvadao", hackerMalvadao);

app.listen(3001, () => {
    console.log("Servidor Vulnerável rodando na porta 3001");
});