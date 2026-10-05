import { Request, Response } from "express";
import jwt from "jsonwebtoken";
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
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict"
        });

        res.json({
            success: true,
            user: usuario
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


export const getQRCodeOrCodBarras = async (req: Request, res: Response) => {
    const tipo = req.query.tipo as string;

    let codigoHtml = "";

    if (tipo === "codigoDeBarras") {
        codigoHtml = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=123456789" />`;
    } else if (tipo === "qrcode") {
        codigoHtml = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QRCodeDemo" />`;
    }

    res.send(`
        <h2>Tipo selecionado: ${tipo}</h2>
        ${codigoHtml}
    `);
};