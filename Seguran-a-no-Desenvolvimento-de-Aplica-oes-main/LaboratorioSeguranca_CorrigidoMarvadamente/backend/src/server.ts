import express from "express";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/usuarioRoutes";
import commentRoutes from "./routes/comentarioRoutes";
import hackerMalvadao from "./routes/hackerMalvadaoRoutes";

const app = express();

// Vulnerável: não existia segredo de JWT configurado em lugar nenhum
// (global.segredoJwt nunca era definido, então ValidarToken() sempre falhava).
// Corrigido: segredo carregado de variável de ambiente, com fallback só para dev.
// (global as any).segredoJwt = process.env.JWT_SECRET || "segredo_super_secreto_trocar_em_producao";

// [CORREÇÃO 04 - JWT] A chave secreta do JWT não pode ficar escrita no código-fonte
// (quem tiver acesso ao repositório poderia forjar tokens de qualquer usuário, inclusive Admin).
// Agora ela vem SOMENTE da variável de ambiente JWT_SECRET:
//  - em produção, se a variável não existir o servidor se recusa a subir;
//  - em desenvolvimento, se não existir, é gerada uma chave aleatória a cada execução
//    (os logins anteriores deixam de valer quando o servidor reinicia).
const segredoJwtAmbiente = process.env.JWT_SECRET;

if (!segredoJwtAmbiente && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET não definido. Defina a variável de ambiente antes de subir o servidor.");
}

if (!segredoJwtAmbiente) {
    console.warn("[AVISO] JWT_SECRET não definido: usando chave aleatória temporária (apenas desenvolvimento).");
}

(global as any).segredoJwt = segredoJwtAmbiente || crypto.randomBytes(64).toString("hex");

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