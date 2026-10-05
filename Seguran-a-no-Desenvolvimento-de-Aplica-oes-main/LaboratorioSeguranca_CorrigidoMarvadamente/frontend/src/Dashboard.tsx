import axios from "axios";
import { useEffect, useState } from "react";

import type { Comentario } from "./Tipos/Comentario";
import type { Iptuu } from "./Tipos/Iptuu";
import { useNavigate } from "react-router-dom";

function Dashboard() {

  const [user, setUser] = useState<{
    id: number;
    nome: string;
    email: string;
    tipo: number;
  } | null>(null);

  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);
  const [iptu, setIptu] = useState<Iptuu | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [tipoCodigo, setTipoCodigo] = useState("codigoDeBarras");
  // const [htmlRetorno, setHtmlRetorno] = useState("");
  // [CORREÇÃO 16 - XSS Refletido (2ª camada)] Antes o front guardava um HTML pronto vindo do
  // servidor e o injetava com dangerouslySetInnerHTML. Agora guarda só dados (JSON) e o React
  // renderiza como texto.
  const [codigo, setCodigo] = useState<{ tipo: string; urlImagem: string } | null>(null);

  // [CORREÇÃO 14 - CSRF] Token anti-CSRF recebido do back-end. Fica só em memória (estado do React)
  // e é enviado no cabeçalho "X-CSRF-Token" das requisições POST/PUT/DELETE.
  const [tokenCsrf, setTokenCsrf] = useState("");


  const handleGerenciamento = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      navigate("/gerenciamento");
    } catch {
      setMessage("Erro no login");
    }
  };


  useEffect(() => {

    const buscarDados = async () => {

      try {

        // const usuarioStorage = localStorage.getItem("user");
        //
        // if (!usuarioStorage) {
        //   console.error("Usuário não encontrado no localStorage");
        //   return;
        // }
        //
        // const usuario = JSON.parse(usuarioStorage);
        //
        // console.log("Usuário recuperado do storage:", usuario);
        //
        // setUser(usuario);
        //
        // const response = await axios.post<{ iptu: Iptuu[] }>(
        //   "usuario/iptu-por-usuario",
        //   {
        //     usuarioId: usuario.id
        //   }
        // );
        //
        // setIptu(response.data.iptu[0]);

        // [CORREÇÃO 14 - CSRF/JWT] Fluxo novo, igual ao do documento: ao abrir o Dashboard o front
        // pede ao back-end o payload do JWT (dados do usuário, sem senha) e o token anti-CSRF.
        // O usuário deixa de ser lido do localStorage (que o próprio usuário/atacante poderia alterar).
        const responsePayload = await axios.get<{
          success: boolean;
          payload: { id: number; nome: string; email: string; tipo: number };
          cryptoToken: string;
        }>("/usuario/payload-usuario", { withCredentials: true });

        if (!responsePayload.data.success) {
          navigate("/");
          return;
        }

        const usuario = responsePayload.data.payload;
        const csrfRecebido = responsePayload.data.cryptoToken;

        setUser(usuario);
        setTokenCsrf(csrfRecebido);

        // Esta requisição é POST, então leva o token anti-CSRF no cabeçalho.
        const response = await axios.post<{ iptu: Iptuu[] }>(
          "/usuario/iptu-por-usuario",
          {
            usuarioId: usuario.id
          },
          {
            withCredentials: true,
            headers: { "X-CSRF-Token": csrfRecebido }
          }
        );

        setIptu(response.data.iptu[0]);

      } catch (error) {

        console.error("Erro ao buscar dados do usuário", error);

        // [CORREÇÃO 14] Sem sessão válida (cookie ausente/expirado) o back-end responde 401:
        // volta para a tela de login.
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          navigate("/");
        }

      }
    };


    const buscarComentarios = async () => {

      try {

        const response = await axios.get(
          "/comentario"
        );

        setComentarios(response.data);

      } catch (error) {

        console.error(
          "Erro ao buscar comentários",
          error
        );
      }
    };


    buscarDados();
    buscarComentarios();

  }, [navigate]);


  const enviarComentario = async () => {

    if (!novoComentario.trim()) return;


    try {

      // const usuarioStorage = localStorage.getItem("user");
      //
      // if (!usuarioStorage) {
      //   console.error("Usuário não encontrado");
      //   return;
      // }
      //
      // const usuario = JSON.parse(usuarioStorage);
      //
      //
      // await axios.post(
      //   "/comentario",
      //   {
      //     texto: novoComentario,
      //     usuarioId: usuario.id
      //   }
      // );

      // [CORREÇÃO 15 - CSRF + Broken Access Control] O POST do comentário agora envia o token
      // anti-CSRF no cabeçalho "X-CSRF-Token". O usuarioId deixou de ser enviado: o back-end
      // usa o id que está dentro do JWT, então ninguém consegue comentar em nome de outra pessoa.
      await axios.post(
        "/comentario",
        {
          texto: novoComentario
        },
        {
          headers: { "X-CSRF-Token": tokenCsrf }
        }
      );


      const response = await axios.get(
        "/comentario"
      );

      setComentarios(response.data);

      setNovoComentario("");

    } catch (error) {

      console.error(
        "Erro ao enviar comentário",
        error
      );
    }
  };


  const buscarCodigo = async () => {

    // const response = await axios.get(
    //   "usuario/codigo-qr-ou-barra?tipo=" + tipoCodigo
    // );
    //
    // setHtmlRetorno(response.data);

    // [CORREÇÃO 16 - XSS Refletido] O back-end agora devolve JSON ({ tipo, urlImagem }) em vez de
    // HTML. O parâmetro vai em `params` (o axios faz o encode correto da URL).
    try {
      const response = await axios.get<{ tipo: string; urlImagem: string }>(
        "/usuario/codigo-qr-ou-barra",
        { params: { tipo: tipoCodigo } }
      );

      setCodigo(response.data);
    } catch (error) {
      console.error("Erro ao gerar código", error);
      setCodigo(null);
    }
  };


  return (
    <div style={styles.container}>

      <header style={styles.header}>

        <h2>
          Bem-vindo, {user?.nome}
        </h2>


        <div style={{ position: "relative" }}>

          <button
            onClick={() =>
              setMenuAberto(!menuAberto)
            }
          >
            ☰ Menu
          </button>


          {menuAberto && (

            <div style={styles.dropdown}>

              {user?.id === 1 && (

                <button
                  onClick={handleGerenciamento}
                >
                  Gerenciar IPTUs {message}
                </button>

              )}

            </div>

          )}

        </div>

      </header>


      <div style={styles.card}>

        <h3>IPTU</h3>

        {iptu && (
          <p>
            Valor IPTU: {iptu.valor}
          </p>
        )}

        <p>
          Status: {iptu?.valor}
        </p>

      </div>


      <select
        value={tipoCodigo}
        onChange={(e) =>
          setTipoCodigo(e.target.value)
        }
      >

        <option value="codigoDeBarras">
          Código de Barras
        </option>

        <option value="qrcode">
          QR Code
        </option>

      </select>


      <button onClick={buscarCodigo}>
        Gerar Código
      </button>


      {/*
        {htmlRetorno && (

          <div
            dangerouslySetInnerHTML={{
              __html: htmlRetorno,
            }}
          />

        )}
      */}

      {/*
        [CORREÇÃO 16 - XSS Refletido (2ª camada)] Sem dangerouslySetInnerHTML: o React trata o
        valor de `codigo.tipo` como TEXTO (escape automático) e a imagem é montada pelo próprio
        React, não por uma string de HTML vinda do servidor.
      */}
      {codigo && (

        <div>
          <h2>Tipo selecionado: {codigo.tipo}</h2>
          <img src={codigo.urlImagem} alt={`Código: ${codigo.tipo}`} />
        </div>

      )}


      <div style={{ padding: "40px" }}>

        <h2>
          Lista de Comentários
        </h2>


        <div style={{ marginBottom: "20px" }}>

          <h3>
            Adicionar Comentário
          </h3>


          <textarea
            value={novoComentario}
            onChange={(e) =>
              setNovoComentario(e.target.value)
            }
            placeholder="Digite seu comentário..."
            style={{
              width: "100%",
              height: "80px",
              padding: "10px",
              marginBottom: "10px",
            }}
          />


          <button onClick={enviarComentario}>
            Enviar Comentário
          </button>

        </div>


        <ul>

          {comentarios.map(
            (comentario, index) => (

              <li key={index}>

                <div>

                  <strong>
                    Usuário:
                  </strong>{" "}

                  {comentario.usuario_id}

                  <br />

                  <strong>
                    Mensagem:
                  </strong>


                  {/* 
                    VULNERÁVEL A STORED XSS

                    O conteúdo vindo do banco é interpretado
                    como HTML pelo navegador.

                  <div
                    dangerouslySetInnerHTML={{
                      __html: comentario.texto
                    }}
                  />
                  */}

                  {/*
                    [CORREÇÃO 17 - XSS Armazenado (2ª camada)] O comentário é exibido como TEXTO
                    (o React faz o escape automático). Mesmo que algum texto malicioso já
                    estivesse salvo no banco, ele aparece escrito na tela e não é executado.
                    A 1ª camada (sanitização com a biblioteca xss) está no comentarioController.
                  */}
                  <div>{comentario.texto}</div>

                </div>

              </li>

            )
          )}

        </ul>

      </div>

    </div>
  );
}


const styles = {

  container: {
    padding: "40px",
    fontFamily: "Arial",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  card: {
    marginTop: "40px",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    width: "300px",
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
    gap: "5px",
  },

};


export default Dashboard;

