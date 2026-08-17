import { Request, Response } from "express";
import db from "../database";



export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const query =
    //Coloquei o $1 para chamar o item de cada lista;//
    //Ao invés de chamar diretamente os componentes, ele chama a lista//
        `SELECT * FROM usuario WHERE email = '$1{email}' AND senha = '$2{password}'`;

    console.log(`Query Executada: ${query}`);

    const result = await db.query(query, [email,password]);

    if (result.rowCount && result.rowCount > 0) {
        
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
};


export const novoLogin = async (req: Request, res: Response) => {
    const { email, password, nome } = req.body;

    const queryNomeIpuExiste =
        //Toda query tem indicação pra ser feita assim, devido a nem tudo ser puxado pelo front

        `SELECT * FROM iptu WHERE nome = '$1{nome}'`;

    console.log(`Query Executada: ${queryNomeIpuExiste}`);

    const iptuResult = await db.query(queryNomeIpuExiste,[nome]);

    if (iptuResult.rowCount && iptuResult.rowCount > 0) {

        const query =
            `INSERT INTO usuario (email, senha, nome, tipo_usuario_id)
             VALUES ('$1{email}', '$2{password}', '$3{nome}', 3)`;

        console.log(`Query Executada: ${query}`);

        const result = await db.query(query,[email,password,nome]);

        const queryIdUsuario =
            `SELECT id FROM usuario
             WHERE email = '$1{email}' AND senha = '$2{password}'`;

        console.log(`Query Executada: ${queryIdUsuario}`);

        const resultIdUsuario = await db.query(queryIdUsuario,[nome,email]);

        const queryUpdateTabelaIptu =
            `UPDATE iptu
             SET usuario_id = '${resultIdUsuario.rows[0].id}'
             WHERE nome = '$1{nome}'`;

        console.log(`Query Executada: ${queryUpdateTabelaIptu}`);

        const resultUpdate = await db.query(queryUpdateTabelaIptu,[nome]);

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


export const atualizarIptu = async (req: Request, res: Response) => {

    const {
        usuarioId,
        novoValor
    } = req.body;

    const query =
        `UPDATE iptu
         SET valor = '$1{novoValor}'
         WHERE usuario_id = '$2{usuarioId}'`;

    console.log(`Query Executada: ${query}`);

    try {
        await db.query(query,[novoValor,usuarioId]);

        res.json({
            message: "IPTU atualizado"
        });

    } catch (err: any) {
        res.status(500).json({
            error: err.message
        });
    }
};


export const getIptuPorIdUsuario = async (
    req: Request,
    res: Response
) => {

    const {
        usuarioId,
    } = req.body;
    const query =
        `SELECT * FROM iptu WHERE usuario_id = '$1{usuarioId}'`;

    console.log(`Query Executada: ${query}`);

    try {

        const result = await db.query(query,[usuarioId]);

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


export const getIptus = async (
    req: Request,
    res: Response
) => {

    
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


export const getQRCodeOrCodBarras = async (
    req: Request,
    res: Response
) => {

    const tipo = req.query.tipo as string;


    let codigoHtml = "";

    if (tipo === "codigoDeBarras") {

        codigoHtml =
            `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=123456789" />`;

    } else if (tipo === "qrcode") {

        codigoHtml =
            `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QRCodeDemo" />`;
    }

    res.send(`
        <h2>Tipo selecionado: ${tipo}</h2>
        ${codigoHtml}
    `);
};

