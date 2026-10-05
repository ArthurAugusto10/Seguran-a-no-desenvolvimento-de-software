import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Comentario } from "./Tipos/Comentario";
import type { Iptuu } from "./Tipos/Iptuu";

function Dashboard() {
  const [user, setUser] = useState<{
    id: number;
    nome: string;
    email: string;
    tipo: number;
  } | null>(null);

  const [csrfToken, setCsrfToken] = useState<string>("");
  const [message, setMessage] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);
  const [iptu, setIptu] = useState<Iptuu | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [tipoCodigo, setTipoCodigo] = useState("codigoDeBarras");
  const [urlImagem, setUrlImagem] = useState<string>("");

  const navigate = useNavigate();

  const handleGerenciamento = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      navigate("/gerenciamento");
    } catch {
      setMessage("Erro na navegação");
    }
  };

  useEffect(() => {
    // 1. Obtém os dados do usuário e o Token CSRF via sessão (sem ler localStorage)
    const inicializarSessao = async () => {
      try {
        const payloadResponse = await axios.get("/usuario/payload-usuario");
        
        if (payloadResponse.data.success) {
          const usuarioLogado = payloadResponse.data.payload;
          setUser(usuarioLogado);
          
          // Armazena o Token CSRF apenas na memória (React State)
          setCsrfToken(payloadResponse.data.cryptoToken);

          // Busca dados de IPTU do próprio usuário autenticado
          const iptuResponse = await axios.post<{ iptu: Iptuu[] }>(
            "/usuario/iptu-por-usuario",
            { usuarioId: usuarioLogado.id }
          );
          setIptu(iptuResponse.data.iptu[0]);
        }
      } catch (error) {
        console.error("Erro ao autenticar ou carregar dados do usuário", error);
      }
    };

    // 2. Busca lista de comentários da aplicação
    const buscarComentarios = async () => {
      try {
        const response = await axios.get("/comentario");
        setComentarios(response.data);
      } catch (error) {
        console.error("Erro ao buscar comentários", error);
      }
    };

    inicializarSessao();
    buscarComentarios();
  }, []);

  // 3. Envio seguro de comentário com validação CSRF
  const enviarComentario = async () => {
    if (!novoComentario.trim()) return;

    try {
      await axios.post(
        "/comentario",
        { texto: novoComentario },
        {
          headers: {
            "X-CSRF-Token": csrfToken // Envia o token CSRF no cabeçalho
          }
        }
      );

      // Atualiza a lista após inserir
      const response = await axios.get("/comentario");
      setComentarios(response.data);
      setNovoComentario("");
    } catch (error) {
      console.error("Erro ao enviar comentário", error);
    }
  };

  // 4. Recebe apenas o JSON com a URL da imagem em vez de código HTML bruto
  const buscarCodigo = async () => {
    try {
      const response = await axios.get(
        `/usuario/codigo-qr-ou-barra?tipo=${encodeURIComponent(tipoCodigo)}`
      );

      if (response.data.success) {
        setUrlImagem(response.data.urlImagem);
      }
    } catch (error) {
      console.error("Erro ao buscar código de barras/QR", error);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2>Bem-vindo, {user?.nome}</h2>

        <div style={{ position: "relative" }}>
          <button onClick={() => setMenuAberto(!menuAberto)}>
            ☰ Menu
          </button>

          {menuAberto && (
            <div style={styles.dropdown}>
              {/* O tipo_usuario_id === 1 é validado também no back-end */}
              {user?.tipo === 1 && (
                <button onClick={handleGerenciamento}>
                  Gerenciar IPTUs {message}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div style={styles.card}>
        <h3>IPTU</h3>
        {iptu && <p>Valor IPTU: {iptu.valor}</p>}
      </div>

      <div style={{ marginTop: "20px" }}>
        <select
          value={tipoCodigo}
          onChange={(e) => setTipoCodigo(e.target.value)}
        >
          <option value="codigoDeBarras">Código de Barras</option>
          <option value="qrcode">QR Code</option>
        </select>

        <button onClick={buscarCodigo}>Gerar Código</button>

        {/* CORREÇÃO XSS: Renderização segura de imagem em vez de HTML bruto */}
        {urlImagem && (
          <div style={{ marginTop: "15px" }}>
            <img src={urlImagem} alt="Código gerado" />
          </div>
        )}
      </div>

      <div style={{ padding: "40px 0" }}>
        <h2>Lista de Comentários</h2>

        <div style={{ marginBottom: "20px" }}>
          <h3>Adicionar Comentário</h3>
          <textarea
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
            placeholder="Digite seu comentário..."
            style={{
              width: "100%",
              height: "80px",
              padding: "10px",
              marginBottom: "10px"
            }}
          />
          <button onClick={enviarComentario}>Enviar Comentário</button>
        </div>

        <ul>
          {comentarios.map((comentario, index) => (
            <li key={index} style={{ marginBottom: "15px" }}>
              <div>
                <strong>Usuário ID:</strong> {comentario.usuario_id}
                <br />
                <strong>Mensagem:</strong>
                {/* CORREÇÃO XSS: Texto simples com escape automático do React */}
                <div>{comentario.texto}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    fontFamily: "Arial"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  card: {
    marginTop: "40px",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    width: "300px"
  },
  dropdown: {
    position: "absolute" as const,
    top: "40px",
    right: 0,
    background: "white",
    border: "1px solid #ccc",
    display: "flex",
    flexDirection: "column" as const,
    padding: "10px",
    gap: "5px"
  }
};

export default Dashboard;
