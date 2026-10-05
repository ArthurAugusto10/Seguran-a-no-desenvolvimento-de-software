import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import xss from "xss";
import db from "../database";

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // const query = `SELECT * FROM usuario WHERE email = '${email}' AND senha = '${password}'`;
    const query = `SELECT * FROM usuario WHERE email = $1 AND senha = $2`;

    console.log(`Query Executada: ${query}`);

    // const result = await db.query(query);
    const result = await db.query(query, [email, password]);

    if (result.rowCount && result.rowCount > 0) {
        const usuario = result.rows[0];

        // Vulnerável (CSRF): login não emitia nenhum token/cookie de sessão,
        // então não havia como o back-end validar quem estava autenticado -
        // e caso um cookie de sessão viesse a ser usado, sem os atributos
        // abaixo ele seria enviado em requisições forjadas por outros sites.
        // const token = jwt.sign(
        //     { id: usuario.id, tipo: usuario.tipo_usuario_id, email: usuario.email, nome: usuario.nome },
        //     (global as any).segredoJwt
        // );
        // res.cookie("token", token);
        const token = jwt.sign(
            { id: usuario.id, tipo: usuario.tipo_usuario_id, email: usuario.email, nome: usuario.nome },
            (global as any).segredoJwt,
            { expiresIn: "2h" }
        );
        // res.cookie("token", token, {
        //     httpOnly: true,
        //     sameSite: "strict"
        // });
        // [CORREÇÃO 08 - Cookies] Mantidos httpOnly (JavaScript não lê o cookie, protege o JWT
        // contra XSS) e sameSite "strict" (cookie só vai em requisições do mesmo site, protege contra CSRF).
        // Adicionado "secure": em produção o cookie só trafega por HTTPS.
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production"
        });

        // res.json({
        //     success: true,
        //     user: usuario
        // });
        // [CORREÇÃO 09 - JWT/dados sensíveis] Antes o login devolvia a linha inteira da tabela
        // `usuario`, incluindo o campo `senha`, que ia parar no navegador (e no localStorage).
        // Agora devolve só o sucesso: os dados do usuário (sem senha) vêm do payload do JWT
        // pela rota GET /usuario/payload-usuario.
        res.json({
            success: true
        });
    } else {
        res.status(401).json({
            success: false,
            message: "Falha no login"
        });
    }
};


export const novoLogin = async (req: Request, res: Response) => {
    const { email, password, nome } = req.body;

    // const queryNomeIpuExiste = `SELECT * FROM iptu WHERE nome = '${nome}'`;
    const queryNomeIpuExiste = `SELECT * FROM iptu WHERE nome = $1`;

    console.log(`Query Executada: ${queryNomeIpuExiste}`);

    // const iptuResult = await db.query(queryNomeIpuExiste);
    const iptuResult = await db.query(queryNomeIpuExiste, [nome]);

    if (iptuResult.rowCount && iptuResult.rowCount > 0) {

        // const query = `INSERT INTO usuario (email, senha, nome, tipo_usuario_id) VALUES ('${email}', '${password}', '${nome}', 3)`;
        const query = 
            `INSERT INTO usuario (email, senha, nome, tipo_usuario_id)
             VALUES ($1, $2, $3, 3)`;

        console.log(`Query Executada: ${query}`);

        // const result = await db.query(query);
        const result = await db.query(query, [email, password, nome]);

        // const queryIdUsuario = `SELECT id FROM usuario WHERE email = '${email}' AND senha = '${password}'`;
        const queryIdUsuario = 
            `SELECT id FROM usuario
             WHERE email = $1 AND senha = $2`;

        console.log(`Query Executada: ${queryIdUsuario}`);

        // const resultIdUsuario = await db.query(queryIdUsuario);
        const resultIdUsuario = await db.query(queryIdUsuario, [email, password]);

        // const queryUpdateTabelaIptu = `UPDATE iptu SET usuario_id = '${resultIdUsuario.rows[0].id}' WHERE nome = '${nome}'`;
        const queryUpdateTabelaIptu = 
            `UPDATE iptu
             SET usuario_id = $1
             WHERE nome = $2`;

        console.log(`Query Executada: ${queryUpdateTabelaIptu}`);

        // const resultUpdate = await db.query(queryUpdateTabelaIptu);
        const resultUpdate = await db.query(queryUpdateTabelaIptu, [resultIdUsuario.rows[0].id, nome]);

        if (
            result.rowCount &&
            result.rowCount > 0 &&
            resultUpdate.rowCount &&
            resultUpdate.rowCount > 0
        ) {
            res.json({
                success: true,
                user: result.rows[0]
            });
        } else {
            res.status(401).json({
                success: false,
                message: "Falha no login"
            });
        }
    } else {
        res.status(404).json({
            success: false,
            message: `Nome '${nome}' não encontrado no cadastro de municipes`
        });
    }
};


// [CORREÇÃO 10 - CSRF/JWT] FUNÇÃO NOVA (rota GET /usuario/payload-usuario).
// Devolve ao front-end o payload do JWT (id, tipo, email, nome - sem senha) que o
// middleware `autenticar` deixou em res.locals.payload, e o token anti-CSRF que o
// middleware csrfGerarRecuperarTokenMiddleware deixou em res.locals.csrfToken.
// O front guarda o token CSRF em memória (estado do React) e o envia no cabeçalho
// "X-CSRF-Token" das requisições POST/PUT/DELETE.
export const payloadUsuario = async (_req: Request, res: Response) => {
    return res.json({
        success: true,
        message: "Payload do usuário obtido com sucesso",
        payload: res.locals.payload,
        cryptoToken: res.locals.csrfToken
    });
};


// Vulnerável (Broken Access Control - escalada vertical): qualquer usuário
// autenticado ou não podia chamar essa rota e alterar o IPTU de qualquer
// municipe, já que não existia checagem de papel (Admin) nenhuma aqui.
// Corrigido: rota protegida com os middlewares `autenticar` e `exigirAdmin`
// em usuarioRoutes.ts, então só chega até aqui quem já foi validado como Admin.
export const atualizarIptu = async (req: Request, res: Response) => {
    const { usuarioId, novoValor } = req.body;

    // const query = `UPDATE iptu SET valor = '${novoValor}' WHERE usuario_id = '${usuarioId}'`;
    const query = 
        `UPDATE iptu
         SET valor = $1
         WHERE usuario_id = $2`;

    console.log(`Query Executada: ${query}`);

    try {
        // await db.query(query);
        await db.query(query, [novoValor, usuarioId]);

        res.json({
            message: "IPTU atualizado"
        });

    } catch (err: any) {
        res.status(500).json({
            error: err.message
        });
    }
};


// Vulnerável (Broken Access Control - IDOR/BOLA / escalada horizontal):
// o back-end confiava cegamente no usuarioId enviado pelo front-end, então
// bastava trocar esse valor na requisição para ver o IPTU de outro municipe.
// Corrigido: a rota exige autenticação e o middleware `exigirDonoOuAdmin`
// (em usuarioRoutes.ts) barra qualquer usuarioId que não seja o do próprio
// dono do token (ou de um Admin) antes mesmo de chegar aqui.
export const getIptuPorIdUsuario = async (req: Request, res: Response) => {
    const { usuarioId } = req.body;

    // const query = `SELECT * FROM iptu WHERE usuario_id = '${usuarioId}'`;
    const query = `SELECT * FROM iptu WHERE usuario_id = $1`;

    console.log(`Query Executada: ${query}`);

    try {
        // const result = await db.query(query);
        const result = await db.query(query, [usuarioId]);

        console.log(`Retorno: ${JSON.stringify(result.rows)}`);

        res.json({
            iptu: result.rows
        });

    } catch (err: any) {
        res.status(500).json({
            error: err.message
        });
    }
};


// Vulnerável (Broken Access Control - escalada vertical): retornava o IPTU
// de TODOS os municipes para qualquer chamador, sem checar se era Admin.
// Corrigido: rota protegida com `autenticar` + `exigirAdmin` em usuarioRoutes.ts.
export const getIptus = async (req: Request, res: Response) => {
    const query = `SELECT * FROM iptu`;

    console.log(`Query Executada: ${query}`);

    try {
        const result = await db.query(query);

        res.json({
            iptu: result.rows
        });

    } catch (err: any) {
        res.status(500).json({
            error: err.message
        });
    }
};


// Vulnerável (XSS Refletido): o parâmetro `tipo` da URL era devolvido dentro de um HTML
// montado no servidor (<h2>Tipo selecionado: ${tipo}</h2>) sem nenhum tratamento. Um link como
// /usuario/codigo-qr-ou-barra?tipo=<script>...</script> executava JavaScript no navegador da vítima.
//
// export const getQRCodeOrCodBarras = async (req: Request, res: Response) => {
//     const tipo = req.query.tipo as string;
//
//     let codigoHtml = "";
//
//     if (tipo === "codigoDeBarras") {
//         codigoHtml = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=123456789" />`;
//     } else if (tipo === "qrcode") {
//         codigoHtml = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QRCodeDemo" />`;
//     }
//
//     res.send(`
//         <h2>Tipo selecionado: ${tipo}</h2>
//         ${codigoHtml}
//     `);
// };

// [CORREÇÃO 11 - XSS Refletido] Três mudanças:
//  1) Lista de valores permitidos (whitelist): qualquer `tipo` diferente dos dois esperados é
//     rejeitado e NUNCA é devolvido na resposta, então não há o que refletir.
//  2) A resposta deixou de ser HTML e passou a ser JSON: o back-end devolve só dados e o React
//     monta a tela, tratando tudo como texto (escape automático).
//  3) Por garantia, o valor ainda passa pela biblioteca `xss` antes de ser devolvido.
const CODIGOS_PERMITIDOS: { [tipo: string]: string } = {
    codigoDeBarras: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=123456789",
    qrcode: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QRCodeDemo"
};

export const getQRCodeOrCodBarras = async (req: Request, res: Response) => {
    const tipo = String(req.query.tipo ?? "");

    if (!Object.prototype.hasOwnProperty.call(CODIGOS_PERMITIDOS, tipo)) {
        return res.status(400).json({
            success: false,
            message: "Tipo de código inválido"
        });
    }

    res.json({
        success: true,
        tipo: xss(tipo),
        urlImagem: CODIGOS_PERMITIDOS[tipo]
    });
};