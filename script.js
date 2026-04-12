/* ================= CONFIG ================= */
let grafico = null;
const SENHA = "123456";
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzKN8i6RYpxpaBCii1A4sxYJ2pcPTzrRxyG_B80cDpOiGX8ro-pB362g1GAH1QF1zM/exec";

let dados = {};
let mesAtual = "";
let editandoIndex = null;

/* ================= LOGIN ================= */
function entrar() {
  const senha = document.getElementById("senha")?.value || "";
  if (senha === SENHA) {
    localStorage.setItem("logado", "true");
    window.location.href = "app.html";
  } else {
    alert("Senha incorreta");
  }
}

/* ================= TEMA ================= */
function setTema(modo) {
  document.body.classList.toggle("dark", modo === "dark");
  localStorage.setItem("tema", modo);
}

function carregarTema() {
  if (localStorage.getItem("tema") === "dark") {
    document.body.classList.add("dark");
  }
}

/* ================= INICIO ================= */
window.onload = () => {
  carregarTema();

  dados = JSON.parse(localStorage.getItem("planilhaCamargo")) || {};
  mesAtual = new Date().toISOString().slice(0, 7);

  document.getElementById("mesSelecionado").value = mesAtual;
  carregarMes();
};

/* ================= GRAFICO ================= */
function atualizarGrafico(entradas, saidas, saldo) {
  const ctx = document.getElementById("graficoFinanceiro").getContext("2d");

  if (grafico) grafico.destroy();

  // 🔥 cor dinâmica do saldo
  const corSaldo = saldo < 0 ? "#ff4d4d" : "#00c853";

  grafico = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Entradas", "Saídas", "Saldo"],
      datasets: [{
        data: [entradas, saidas, saldo],
        
        // 🎨 CORES
        backgroundColor: [
          "#00c853", // verde (entrada)
          "#ff4d4d", // vermelho (saida)
          corSaldo   // saldo dinâmico
        ],
        
        borderColor: [
          "#00c853",
          "#ff4d4d",
          corSaldo
        ],
        
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

/* ================= CARREGAR ================= */
function carregarMes() {
  mesAtual = document.getElementById("mesSelecionado").value;
  const registros = dados[mesAtual] || [];

  let totalEntradas = 0;
  let totalSaidas = 0;

  const tabela = document.getElementById("tabela");
  tabela.innerHTML = "";

  registros.forEach((r, i) => {
    let entrada = "";
    let saida = "";

    if (r.tipo === "entrada") {
      entrada = r.valor.toFixed(2);
      totalEntradas += r.valor;
    } else {
      saida = r.valor.toFixed(2);
      totalSaidas += r.valor;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.data}</td>
      <td>${r.descricao}</td>
      <td class="entrada">${entrada}</td>
      <td class="saida">${saida}</td>
      <td>
        <button onclick="editar(${i})">✏️</button>
        <button onclick="deletar(${i})">🗑</button>
      </td>
    `;
    tabela.appendChild(tr);
  });

  const saldo = totalEntradas - totalSaidas;

  document.getElementById("totalEntradas").innerText =
    totalEntradas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  document.getElementById("totalSaidas").innerText =
    totalSaidas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const saldoEl = document.getElementById("saldoTotal");
  saldoEl.innerText =
    saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  atualizarGrafico(totalEntradas, totalSaidas, saldo);
}

/* ================= ADICIONAR / EDITAR ================= */
function adicionarRegistro() {
  const data = document.getElementById("data").value;
  const descricao = document.getElementById("descricao").value;
  const tipo = document.getElementById("tipo").value;
  const valor = parseFloat(document.getElementById("valor").value);

  if (!data || !descricao || !tipo || isNaN(valor)) {
    alert("Preencha corretamente");
    return;
  }

  const registro = { data, descricao, tipo, valor };

  if (!dados[mesAtual]) dados[mesAtual] = [];

  if (editandoIndex !== null) {
    dados[mesAtual][editandoIndex] = registro;
    editandoIndex = null;
    document.getElementById("btnAdicionar").innerText = "Adicionar";
  } else {
    dados[mesAtual].push(registro);
    salvarNoGoogleSheets(registro);
  }

  salvarLocal();
  carregarMes();
  limparCampos();
}

/* ================= EDITAR ================= */
function editar(i) {
  const r = dados[mesAtual][i];

  document.getElementById("data").value = r.data;
  document.getElementById("descricao").value = r.descricao;
  document.getElementById("tipo").value = r.tipo;
  document.getElementById("valor").value = r.valor;

  editandoIndex = i;
  document.getElementById("btnAdicionar").innerText = "Salvar edição";
}

/* ================= DELETAR ================= */
function deletar(i) {
  dados[mesAtual].splice(i, 1);
  salvarLocal();
  carregarMes();
}

/* ================= LIMPAR ================= */
function limparCampos() {
  document.getElementById("data").value = "";
  document.getElementById("descricao").value = "";
  document.getElementById("valor").value = "";
}

/* ================= STORAGE ================= */
function salvarLocal() {
  localStorage.setItem("planilhaCamargo", JSON.stringify(dados));
}

/* ================= GOOGLE ================= */
function salvarNoGoogleSheets(registro) {
  fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(registro)
  });
}

/* ================= PRINT ================= */
function imprimirMes() {
  window.print();
}