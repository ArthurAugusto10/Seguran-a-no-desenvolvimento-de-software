export interface RetornoPayload {
    id: any;
    // Corrigido: tipo corresponde ao tipo_usuario_id (numérico) da tabela
    // usuario/tipo_usuario (1 = Admin), usado pelo middleware de autorização.
    tipo: number;
    email: string;
    nome: string;
}