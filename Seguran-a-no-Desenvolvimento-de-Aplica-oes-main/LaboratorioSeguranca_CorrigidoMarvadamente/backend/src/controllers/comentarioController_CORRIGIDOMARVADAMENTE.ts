import { Request, Response } from "express";
import xss from "xss";
import db from "../database";


export const criarComentario = async (
    req: Request,
    res: Response
) => {

    const {
        texto,
        usuarioId
    } = req.body;

    // Vulnerável (XSS Stored): o texto vindo do front era salvo direto no
    // banco sem nenhuma sanitização, então um comentário com <script> era
    // executado no navegador de todo mundo que visse a lista de comentários.
    // const textoLimpo = texto;
    const textoLimpo = xss(texto);

    // const query =
    //     `INSERT INTO comentario (texto, usuario_id)
    //      VALUES ('${texto}', '${usuarioId}')`;
    const query =
        `INSERT INTO comentario (texto, usuario_id)
         VALUES ($1, $2)`;

    console.log(`Query Executada: ${query}`);


    try {

        // await db.query(query);
        await db.query(query, [textoLimpo, usuarioId]);

        res.status(201).json({
            message: "Comentário criado"
        });

    } catch (err: any) {

        res.status(500).json({
            error: err.message
        });
    }
};


export const listarComentarios = async (
    _req: Request,
    res: Response
) => {

    try {

        const result = await db.query(
            "SELECT * FROM comentario"
        );

        res.json(result.rows);

    } catch (err: any) {

        res.status(500).json({
            error: err.message
        });
    }
};