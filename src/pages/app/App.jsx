import { useMemo, useState , useEffect} from "react";

import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import "./App.scss";


function App() {

  const [tema, setTema] = useState(
  () => localStorage.getItem("iaInvestTema") || "dark"
);

useEffect(() => {
  document.documentElement.setAttribute("data-theme", tema);
  localStorage.setItem("iaInvestTema", tema);
}, [tema]);
  // =====================================================
  // ESTADOS
  // =====================================================

  const [nome, setNome] = useState("");

  const [valorInicial, setValorInicial] = useState(5000);

  const [aporteMensal, setAporteMensal] = useState(500);

  const [tempo, setTempo] = useState(5);

  const [perfil, setPerfil] = useState("Moderado");

  const [tipoInvestimento, setTipoInvestimento] =
    useState("ETFs");


  // =====================================================
  // ESTADOS DA INTELIGÊNCIA ARTIFICIAL
  // =====================================================

  const [analiseIA, setAnaliseIA] = useState("");

  const [carregandoIA, setCarregandoIA] =
    useState(false);

  const [erroIA, setErroIA] = useState("");


  // =====================================================
  // TAXAS POR PERFIL
  // =====================================================

  const taxasPerfil = {

    Conservador: 0.08,

    Moderado: 0.12,

    Arrojado: 0.16,

  };


  // =====================================================
  // TAXAS POR TIPO DE INVESTIMENTO
  // =====================================================

  const taxasInvestimento = {

    "Poupança": 0.06,

    "Tesouro Direto": 0.10,

    "CDB": 0.105,

    "LCI / LCA": 0.095,

    "Fundos Imobiliários": 0.11,

    "Ações": 0.14,

    "ETFs": 0.13,

    "Criptomoedas": 0.20,

  };


  // =====================================================
  // TAXA UTILIZADA NA SIMULAÇÃO
  // =====================================================

  const taxaAnual = useMemo(() => {

    const taxaPerfil =
      taxasPerfil[perfil] || 0;

    const taxaInvestimento =
      taxasInvestimento[tipoInvestimento] || 0;

    /*
      Aqui fazemos uma média apenas para a
      simulação visual do projeto.

      Não representa uma previsão real
      de rentabilidade.
    */

    return (
      (taxaPerfil + taxaInvestimento) / 2
    );

  }, [
    perfil,
    tipoInvestimento,
  ]);


  // =====================================================
  // DADOS PARA O GRÁFICO
  // =====================================================

  const dadosGrafico = useMemo(() => {

    const mesesTotais =
      Math.round(tempo * 12);

    const taxaMensal =
      Math.pow(
        1 + taxaAnual,
        1 / 12
      ) - 1;

    let patrimonio =
      Number(valorInicial) || 0;

    const dados = [];


    // ===============================================
    // MÊS ZERO
    // ===============================================

    dados.push({

      mes: 0,

      nome: "0m",

      investido:
        Number(valorInicial) || 0,

      projetado:
        Number(valorInicial) || 0,

    });


    // ===============================================
    // CALCULA MÊS A MÊS
    // ===============================================

    for (
      let mes = 1;
      mes <= mesesTotais;
      mes++
    ) {

      patrimonio =
        patrimonio *
          (1 + taxaMensal) +
        (Number(aporteMensal) || 0);


      const totalInvestido =
        (Number(valorInicial) || 0) +
        (Number(aporteMensal) || 0) *
          mes;


      dados.push({

        mes,

        nome:
          mes % 12 === 0
            ? `${mes / 12}a`
            : `${mes}m`,

        investido:
          Number(
            totalInvestido.toFixed(2)
          ),

        projetado:
          Number(
            patrimonio.toFixed(2)
          ),

      });

    }


    return dados;

  }, [
    valorInicial,
    aporteMensal,
    tempo,
    taxaAnual,
  ]);


  // =====================================================
  // RESULTADOS
  // =====================================================

  const resultados = useMemo(() => {

    const ultimo =
      dadosGrafico[
        dadosGrafico.length - 1
      ];


    const totalInvestido =
      ultimo?.investido || 0;


    const valorProjetado =
      ultimo?.projetado || 0;


    const rendimento =
      valorProjetado -
      totalInvestido;


    const retorno =
      totalInvestido > 0
        ? (
            rendimento /
            totalInvestido
          ) * 100
        : 0;


    return {

      totalInvestido,

      valorProjetado,

      rendimento,

      retorno,

    };

  }, [
    dadosGrafico,
  ]);


  // =====================================================
  // FORMATAÇÃO DE DINHEIRO
  // =====================================================

  const dinheiro = (valor) => {

    return Number(
      valor || 0
    ).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );

  };


  // =====================================================
  // FORMATAÇÃO DO EIXO DO GRÁFICO
  // =====================================================

  const formatarEixo = (valor) => {

    if (valor >= 1000000) {

      return (
        `R$ ${(valor / 1000000)
          .toFixed(1)}M`
      );

    }


    if (valor >= 1000) {

      return (
        `R$ ${(valor / 1000)
          .toFixed(0)}k`
      );

    }


    return `R$ ${valor}`;

  };


  // =====================================================
  // ANALISAR COM INTELIGÊNCIA ARTIFICIAL
  // =====================================================

  const analisarComIA = async () => {

    try {

      // ===============================================
      // COMEÇA LOADING
      // ===============================================

      setCarregandoIA(true);

      setErroIA("");

      setAnaliseIA("");


      // ===============================================
      // ENVIA PARA O BACKEND
      // ===============================================

      const response = await fetch(
        "http://localhost:3001/api/analisar",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({

            nome,

            valorInicial,

            aporteMensal,

            tempo,

            perfil,

            tipoInvestimento,

            taxaAnual,

            totalInvestido:
              resultados.totalInvestido,

            valorProjetado:
              resultados.valorProjetado,

            rendimento:
              resultados.rendimento,

            retorno:
              resultados.retorno,

          }),

        }
      );


      // ===============================================
      // TRANSFORMA RESPOSTA EM JSON
      // ===============================================

      const data =
        await response.json();


      // ===============================================
      // VERIFICA ERRO
      // ===============================================

      if (!response.ok) {

        throw new Error(
          data.error ||
          "Erro ao consultar a IA."
        );

      }


      // ===============================================
      // SALVA RESPOSTA
      // ===============================================

      setAnaliseIA(
        data.analise
      );

    } catch (error) {

      console.error(
        "Erro na IA:",
        error
      );


      setErroIA(
        error.message ||
        "Não foi possível gerar a análise."
      );

    } finally {

      // ===============================================
      // FINALIZA LOADING
      // ===============================================

      setCarregandoIA(false);

    }

  };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="App">


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="App-header">

        <nav>

          <h1>
            UP<span>.INVEST</span>
          </h1>


        <div className="NavDireita">
  <ul>
    <li><a href="#simulador">Simulador</a></li>
    <li><a href="#carteira">Carteira</a></li>
    <li><a href="#dashboard">Dashboard</a></li>
    <li><a href="#historico">Histórico</a></li>
  </ul>

  <button
    className="ThemeToggle"
    onClick={() => setTema(tema === "dark" ? "light" : "dark")}
    aria-label="Alternar tema"
  >
    {tema === "dark" ? "☀" : "☾"}
  </button>
</div>
        </nav>

      </header>



      {/* =================================================
          HERO
      ================================================= */}

      <section className="ParteDeCima">


        <div className="tituloCima">

          <span className="tag">
            INTELIGÊNCIA ARTIFICIAL + INVESTIMENTOS
          </span>


          <h1>

            Invista melhor.

            <br />

            Decida mais rápido.

          </h1>


          <p>

            Simule seus investimentos,
            acompanhe projeções e entenda
            como seu patrimônio pode evoluir
            ao longo do tempo.

          </p>

        </div>



        <div className="BotoesCima">


          <button
            className="BotaoCarteira"

            onClick={() => {

              document
                .getElementById("simulador")
                ?.scrollIntoView({
                  behavior: "smooth",
                });

            }}
          >

            Criar minha simulação

          </button>



          <button
            className="BotaoDashboard"

            onClick={() => {

              document
                .getElementById("carteira")
                ?.scrollIntoView({
                  behavior: "smooth",
                });

            }}
          >

            Ver carteira

          </button>


        </div>



        {/* CARD 1 */}

        <div className="cardsCima">

          <span>
            ✦
          </span>

          <h3>
            Análise por IA
          </h3>

          <p>
            Leitura personalizada do seu plano.
          </p>

        </div>



        {/* CARD 2 */}

        <div className="cardsCima">

          <span>
            ⌁
          </span>

          <h3>
            Projeções vivas
          </h3>

          <p>
            Dados atualizados automaticamente.
          </p>

        </div>



        {/* CARD 3 */}

        <div className="cardsCima">

          <span>
            ◈
          </span>

          <h3>
            Risco claro
          </h3>

          <p>
            Visualize perfil e diversificação.
          </p>

        </div>


      </section>



      {/* =================================================
          SIMULADOR
      ================================================= */}

      <section
        className="Simulador"
        id="simulador"
      >


        {/* =================================================
            PARTE ESQUERDA
        ================================================= */}

        <div className="SimuladorMeio">


          <div className="tituloSimulador">

            <span className="sectionTag">
              SIMULADOR
            </span>


            <h1>
              Monte sua simulação
            </h1>


            <p>
              Preencha os dados e acompanhe
              a projeção do seu patrimônio.
            </p>

          </div>



          {/* =================================================
              CARD DADOS
          ================================================= */}

          <div className="CardSimuladorGrande">


            <div className="cardTitulo">

              <span>
                ✣
              </span>

              <h2>
                Dados do investimento
              </h2>

            </div>



            {/* NOME + VALOR */}

            <div className="InputsLinha">


              <div className="InputsArea">

                <label>
                  Seu nome (opcional)
                </label>


                <input
                  type="text"

                  value={nome}

                  onChange={(e) =>
                    setNome(
                      e.target.value
                    )
                  }

                  placeholder="Como quer ser chamado?"
                />

              </div>



              <div className="InputsArea">

                <label>
                  Valor inicial (R$)
                </label>


                <input
                  type="number"

                  min="0"

                  value={valorInicial}

                  onChange={(e) =>
                    setValorInicial(
                      Number(
                        e.target.value
                      )
                    )
                  }

                />

              </div>


            </div>



            {/* APORTE */}

            <div className="InputsArea">

              <label>
                Aporte mensal (R$) — opcional
              </label>


              <input
                type="number"

                min="0"

                value={aporteMensal}

                onChange={(e) =>
                  setAporteMensal(
                    Number(
                      e.target.value
                    )
                  )
                }

              />

            </div>



            {/* =================================================
                TEMPO
            ================================================= */}

            <div className="campo">

              <label>
                Tempo de investimento
              </label>


              <div className="TempoSimulador">


                {[

                  0.5,

                  1,

                  2,

                  5,

                  10,

                ].map((valor) => {


                  let texto;


                  if (valor === 0.5) {

                    texto =
                      "6 meses";

                  } else {

                    texto =
                      `${valor} ${
                        valor === 1
                          ? "ano"
                          : "anos"
                      }`;

                  }


                  return (

                    <button
                      key={valor}

                      className={
                        tempo === valor
                          ? "botaoSimulador ativo"
                          : "botaoSimulador"
                      }

                      onClick={() =>
                        setTempo(valor)
                      }
                    >

                      {texto}

                    </button>

                  );

                })}


              </div>

            </div>



            {/* =================================================
                PERFIL
            ================================================= */}

            <div className="campo">

              <label>
                Perfil de investidor
              </label>


              <div className="PerfilInvestidoSimulador">


                {Object.keys(
                  taxasPerfil
                ).map((item) => (

                  <button
                    key={item}

                    className={
                      perfil === item
                        ? "CarsPerfil ativo"
                        : "CarsPerfil"
                    }

                    onClick={() =>
                      setPerfil(item)
                    }
                  >

                    <strong>
                      {item}
                    </strong>


                    <span>

                      {item ===
                        "Conservador" &&
                        "Prioriza segurança e liquidez"}


                      {item ===
                        "Moderado" &&
                        "Equilíbrio entre risco e retorno"}


                      {item ===
                        "Arrojado" &&
                        "Aceita maior volatilidade"}

                    </span>

                  </button>

                ))}


              </div>

            </div>



            {/* =================================================
                TIPOS DE INVESTIMENTO
            ================================================= */}

            <div className="campo">

              <label>
                Tipo de investimento
              </label>


              <div className="TipoInvestimento">


                {Object.keys(
                  taxasInvestimento
                ).map((tipo) => (

                  <button
                    key={tipo}

                    className={
                      tipoInvestimento === tipo
                        ? "BotaoInvestimento ativo"
                        : "BotaoInvestimento"
                    }

                    onClick={() =>
                      setTipoInvestimento(
                        tipo
                      )
                    }
                  >

                    {tipo}

                  </button>

                ))}


              </div>

            </div>



            {/* =================================================
                TAXA
            ================================================= */}

            <div className="informacao">

              Taxa utilizada na simulação:{" "}

              <strong>

                {(taxaAnual * 100)
                  .toFixed(1)}%

                a.a.

              </strong>


              <br />


              <small>

                Valores ilustrativos para fins
                de simulação. Não representam
                garantia de rentabilidade.

              </small>

            </div>



            {/* =================================================
                BOTÃO IA
            ================================================= */}

            <button

              className="IA"

              onClick={
                analisarComIA
              }

              disabled={
                carregandoIA
              }

            >

              {carregandoIA

                ? "✦ Analisando sua simulação..."

                : "✦ Analisar com Inteligência Artificial"

              }

            </button>


          </div>

        </div>



        {/* =================================================
            PROJEÇÃO
        ================================================= */}

        <div className="CardGrande2">


          <div className="cardTitulo">

            <span>
              ⌁
            </span>

            <h2>
              Projeção em tempo real
            </h2>

          </div>



          {/* =================================================
              INDICADORES
          ================================================= */}

          <div className="cardsProjecao">


            <div className="cardsPequenos">

              <span>
                Total investido
              </span>


              <strong>
                {dinheiro(
                  resultados.totalInvestido
                )}
              </strong>

            </div>



            <div className="cardsPequenos destaque">

              <span>
                Valor projetado
              </span>


              <strong>
                {dinheiro(
                  resultados.valorProjetado
                )}
              </strong>

            </div>



            <div className="cardsPequenos">

              <span>
                Rendimento
              </span>


              <strong>
                {dinheiro(
                  resultados.rendimento
                )}
              </strong>

            </div>



            <div className="cardsPequenos">

              <span>
                Retorno acumulado
              </span>


              <strong>
                {resultados.retorno.toFixed(
                  1
                )}%

              </strong>

            </div>


          </div>



          {/* =================================================
              GRÁFICO
          ================================================= */}

          <div className="graficoContainer">


            <ResponsiveContainer
              width="100%"
              height={260}
            >


              <AreaChart
                data={dadosGrafico}

                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 0,
                }}
              >


                <defs>

                  <linearGradient
                    id="corProjetado"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >

                    <stop
                      offset="5%"
                      stopColor="#e8bd4e"
                      stopOpacity={0.35}
                    />

                    <stop
                      offset="95%"
                      stopColor="#e8bd4e"
                      stopOpacity={0}
                    />

                  </linearGradient>

                </defs>



                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#24344d"
                />



                <XAxis
                  dataKey="nome"

                  stroke="#64748b"

                  tick={{
                    fontSize: 10,
                  }}

                  interval="preserveStartEnd"
                />



                <YAxis

                  stroke="#64748b"

                  tick={{
                    fontSize: 10,
                  }}

                  tickFormatter={
                    formatarEixo
                  }

                />



                <Tooltip

                  contentStyle={{
                    background:
                      "#101d32",

                    border:
                      "1px solid #293b55",

                    borderRadius:
                      "10px",

                    color: "#fff",
                  }}

                  formatter={(value) =>
                    dinheiro(value)
                  }

                />



                {/* LINHA VALOR PROJETADO */}

                <Area

                  type="monotone"

                  dataKey="projetado"

                  stroke="#e8bd4e"

                  strokeWidth={2}

                  fill="url(#corProjetado)"

                  name="Projetado"

                />



                {/* LINHA TOTAL INVESTIDO */}

                <Line

                  type="monotone"

                  dataKey="investido"

                  stroke="#55b7e8"

                  strokeWidth={2}

                  dot={false}

                  name="Investido"

                />


              </AreaChart>


            </ResponsiveContainer>


          </div>



          {/* =================================================
              LEGENDA
          ================================================= */}

          <div className="legendaGrafico">


            <span>

              <i className="linhaAzul"></i>

              Total investido

            </span>


            <span>

              <i className="linhaAmarela"></i>

              Valor projetado

            </span>


          </div>


        </div>


      </section>



      {/* =================================================
          CARTEIRA INTELIGENTE
      ================================================= */}

      <section
        className="CarteiraInteligente"
        id="carteira"
      >


        <span className="sectionTag">

          CARTEIRA INTELIGENTE

        </span>



        <div className="titulo">

          <h1>
            Sua carteira e a leitura da IA
          </h1>


          <p>

            Resumo do plano escolhido e
            interpretação dos dados da simulação.

          </p>

        </div>



        <div className="CarteiraGrid">


          {/* =================================================
              CARD CARTEIRA
          ================================================= */}

          <div className="CardGrandeCarteira">


            <div className="cardTitulo">

              <span>
                ▣
              </span>

              <h2>
                Carteira
              </h2>

            </div>



            {/* TAGS */}

            <div className="tagsCarteira">


              <span>
                {tipoInvestimento}
              </span>


              <span>
                Perfil {perfil}
              </span>


              <span>
                {tempo === 0.5
                  ? "6 meses"
                  : `${tempo} ${
                      tempo === 1
                        ? "ano"
                        : "anos"
                    }`}
              </span>


            </div>



            {/* DADOS */}

            <div className="dadosCarteira">


              <div>

                <span>
                  Valor investido
                </span>


                <strong>
                  {dinheiro(
                    resultados.totalInvestido
                  )}
                </strong>

              </div>



              <div>

                <span>
                  Aporte mensal
                </span>


                <strong>
                  {dinheiro(
                    aporteMensal
                  )}
                </strong>

              </div>



              <div>

                <span>
                  Rentabilidade estimada
                </span>


                <strong>

                  {(taxaAnual * 100)
                    .toFixed(1)}%

                  {" "}a.a.

                </strong>

              </div>



              <div>

                <span>
                  Valor projetado
                </span>


                <strong>
                  {dinheiro(
                    resultados.valorProjetado
                  )}
                </strong>

              </div>



              <div>

                <span>
                  Retorno acumulado
                </span>


                <strong>

                  {resultados.retorno.toFixed(
                    1
                  )}%

                </strong>

              </div>


            </div>


          </div>



          {/* =================================================
              CARD IA
          ================================================= */}

          <div className="CardGrande2Carteira">


            <div className="cardTitulo">

              <span>
                ✣
              </span>

              <h2>
                Recomendações da IA
              </h2>

            </div>



            {/* =================================================
                ESTADO INICIAL
            ================================================= */}

            {!analiseIA &&
              !carregandoIA &&
              !erroIA && (

                <div className="IAInicial">


                  <div className="iconeIA">
                    ✦
                  </div>


                  <h3>
                    Sua análise ainda não foi gerada
                  </h3>


                  <p>

                    Clique em "Analisar com
                    Inteligência Artificial"
                    para analisar os dados
                    da sua simulação.

                  </p>


                </div>

              )}



            {/* =================================================
                LOADING
            ================================================= */}

            {carregandoIA && (

              <div className="IALoading">


                <div className="spinner"></div>


                <h3>
                  Analisando sua simulação...
                </h3>


                <p>

                  A inteligência artificial
                  está interpretando seus dados.

                </p>


              </div>

            )}



            {/* =================================================
                ERRO
            ================================================= */}

            {erroIA && (

              <div className="IAErro">


                <strong>
                  Não foi possível realizar a análise.
                </strong>


                <p>
                  {erroIA}
                </p>


              </div>

            )}



            {/* =================================================
                RESULTADO
            ================================================= */}

            {analiseIA && (

              <div className="IAResultado">


                {analiseIA
                  .split("\n")
                  .map(
                    (linha, index) => {


                      // Linha vazia

                      if (
                        !linha.trim()
                      ) {

                        return (

                          <div
                            key={index}
                            className="espacoIA"
                          />

                        );

                      }



                      // Detecta títulos

                      const texto =
                        linha.trim();


                      const ehTitulo =
                        texto ===
                          texto.toUpperCase() &&
                        texto.length < 60;



                      if (ehTitulo) {

                        return (

                          <h3
                            key={index}
                          >

                            {texto}

                          </h3>

                        );

                      }



                      return (

                        <p
                          key={index}
                        >

                          {texto}

                        </p>

                      );

                    }
                  )}


              </div>

            )}


          </div>


        </div>


      </section>


    </div>

  );

}


export default App;
