import { NextFunction, Request, Response } from "express";

// [CORREÇÃO 02 - CSRF] ARQUIVO NOVO.
// Compara o token que veio no COOKIE com o token que veio no CABEÇALHO
// "X-CSRF-Token". O navegador envia o cookie sozinho (e é por isso que o
// ataque CSRF funciona), mas um site malicioso não consegue ler o token para
// colocá-lo no cabeçalho. Se faltar um dos dois ou se forem diferentes, bloqueia.
// Deve ser usado nas rotas que alteram dados (POST / PUT / DELETE).
export const csrfTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const tokenCookie = req.cookies?.csrfToken;
    const tokenHeader = req.headers["x-csrf-token"];

    if (!tokenCookie || !tokenHeader || tokenCookie !== tokenHeader) {
        return res.status(403).json({
            success: false,
            message: "Token CSRF inválido"
        });
    }

    next();
};
