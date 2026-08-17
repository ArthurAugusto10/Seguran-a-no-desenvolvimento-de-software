
import { Request, Response } from "express";
import db from "../database";


export const criarComentario = async (
    req: Request,
    res: Response
) => {

    const {
        texto,
        usuarioId
    } = req.body;

    const query =
         //setando a lista
        `INSERT INTO comentario (texto, usuario_id)
         VALUES ('$1{texto}', '$2{usuarioId}')`;

    console.log(`Query Executada: ${query}`);


    try { 
        //chamando a lista
        await db.query(query,[texto,usuarioId]);

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
