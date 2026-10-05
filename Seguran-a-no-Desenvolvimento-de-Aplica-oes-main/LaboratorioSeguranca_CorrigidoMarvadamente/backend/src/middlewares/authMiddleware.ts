import { Request, Response, NextFunction } from "express";
import ValidarToken from "../Services/jwtServices";
import { RetornoPayload } from "../Tipos/retornoPayload";

// Corrige a vulnerabilidade de Broken Access Control:
// antes nenhuma rota verificava se existia um usuário autenticado nem se
// esse usuário tinha permissão para acessar o recurso pedido (qualquer um
// podia mandar um usuarioId de outra pessoa e ver/alterar os dados dela,
// ou acessar funcionalidades de Admin sem checagem nenhuma no back-end).

declare global {
    namespace Express {
        interface Request {
            usuario?: RetornoPayload;
        }
    }
}

const ID_TIPO_ADMIN = 1;

export function autenticar(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ success: false, message: "Não autenticado" });
    }

    const payload = ValidarToken(token);

    if (!payload) {
        return res.status(401).json({ success: false, message: "Token inválido ou expirado" });
    }

    req.usuario = payload;

    // [CORREÇÃO 03 - CSRF/JWT] O payload validado do JWT também fica em res.locals
    // para que a rota /usuario/payload-usuario consiga devolvê-lo ao front-end.
    // Assim o front não precisa mais guardar os dados do usuário no localStorage.
    res.locals.payload = payload;

    next();
}

// Escalada vertical de privilégio: garante que só o tipo_usuario_id de Admin
// (id 1, ver postgres/init.sql) acesse rotas administrativas, independente
// do que o front-end esconde ou mostra na tela.
export function exigirAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.usuario || Number(req.usuario.tipo) !== ID_TIPO_ADMIN) {
        return res.status(403).json({ success: false, message: "Acesso negado" });
    }
    next();
}

// Escalada horizontal de privilégio (IDOR/BOLA): garante que o usuarioId
// pedido na requisição seja o mesmo do usuário autenticado pelo token,
// a não ser que ele seja Admin.
export function exigirDonoOuAdmin(usuarioIdDaRequisicao: (req: Request) => any) {
    return (req: Request, res: Response, next: NextFunction) => {
        const usuarioIdSolicitado = usuarioIdDaRequisicao(req);
        const ehAdmin = Number(req.usuario?.tipo) === ID_TIPO_ADMIN;
        const ehDono = String(req.usuario?.id) === String(usuarioIdSolicitado);

        if (!ehAdmin && !ehDono) {
            return res.status(403).json({ success: false, message: "Acesso negado" });
        }
        next();
    };
}