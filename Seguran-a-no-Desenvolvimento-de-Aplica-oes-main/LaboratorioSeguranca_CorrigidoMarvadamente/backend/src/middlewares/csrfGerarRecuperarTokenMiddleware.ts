import { NextFunction, Request, Response } from "express";
import { randomBytes } from "crypto";

// [CORREÇÃO 01 - CSRF] ARQUIVO NOVO.
// Gera um token aleatório (difícil de adivinhar) e o salva em um cookie.
// Se o cookie já existir, apenas recupera o valor que já está salvo.
// O valor também é colocado em res.locals para que o próximo método da
// rota (ex.: payloadUsuario) consiga devolvê-lo ao front-end no corpo da resposta.
export const csrfGerarTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
    let csrfToken = req.cookies?.csrfToken;

    if (!csrfToken) {
        csrfToken = randomBytes(32).toString("hex");

        res.cookie("csrfToken", csrfToken, {
            httpOnly: true,
            // "secure" só em produção (HTTPS). Em desenvolvimento (http://localhost)
            // alguns navegadores descartam cookies "secure".
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });
    }

    res.locals.csrfToken = csrfToken;

    next();
};
