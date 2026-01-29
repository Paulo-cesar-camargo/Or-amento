
/* ================= CONFIGURAÇÃO ================= */
const SENHA = "";
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzKN8i6RYpxpaBCii1A4sxYJ2pcPTzrRxyG_B80cDpOiGX8ro-pB362g1GAH1QF1zM/exec";

let dados = {};
let mesAtual = "";

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
  const tema = localStorage.getItem("tema") || "light";
  if (tema === "dark") document.body.classList.add("dark");
}

/* ================= INICIALIZAÇÃO ================= */
window.onload = () => {
  carregarTema();

  if (!document.getElementById("mesSelecionado")) return;

  dados = JSON.parse(localStorage.getItem("planilhaCamargo")) || {};
  mesAtual = new Date().toISOString().slice(0, 7);

  document.getElementById("mesSelecionado").value = mesAtual;
  carregarMes();
};

/* ================= PLANILHA ================= */
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
      <td><button onclick="deletar(${i})">🗑</button></td>
    `;
    tabela.appendChild(tr);
  });

  const saldoTotal = totalEntradas - totalSaidas;

  document.getElementById("totalEntradas").innerText =
    totalEntradas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  document.getElementById("totalSaidas").innerText =
    totalSaidas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  document.getElementById("saldoTotal").innerText =
    saldoTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const saldoEl = document.getElementById("saldoTotal");

saldoEl.classList.remove("saldo-positivo", "saldo-negativo");
saldoEl.classList.add(saldoTotal < 0 ? "saldo-negativo" : "saldo-positivo");

}

/* ================= REGISTROS ================= */
function adicionarRegistro() {
  const data = document.getElementById("data").value;
  const descricao = document.getElementById("descricao").value;
  const tipo = document.getElementById("tipo").value;
  const valor = parseFloat(document.getElementById("valor").value);

  if (!data || !descricao || !tipo || isNaN(valor) || valor <= 0) {
    alert("Preencha todos os campos corretamente");
    return;
  }

  const registro = { data, descricao, tipo, valor };

  if (!dados[mesAtual]) dados[mesAtual] = [];
  dados[mesAtual].push(registro);

  salvarLocal();
  carregarMes();
  salvarNoGoogleSheets(registro);

  document.getElementById("descricao").value = "";
  document.getElementById("valor").value = "";
}

function deletar(index) {
  dados[mesAtual].splice(index, 1);
  salvarLocal();
  carregarMes();
}

function fecharMes() {
  const [ano, mes] = mesAtual.split("-");
  mesAtual = new Date(ano, Number(mes), 1).toISOString().slice(0, 7);
  document.getElementById("mesSelecionado").value = mesAtual;
  carregarMes();
}

/* ================= LOCAL STORAGE ================= */
function salvarLocal() {
  localStorage.setItem("planilhaCamargo", JSON.stringify(dados));
}

/* ================= GOOGLE SHEETS ================= */
function salvarNoGoogleSheets(registro) {
  fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(registro)
  })
  .then(r => r.text())
  .then(txt => console.log("Sheets:", txt))
  .catch(err => console.error(err));
}

/* ================= IMPRESSÃO ================= */
function imprimirMes() {
  if (!dados[mesAtual] || dados[mesAtual].length === 0) {
    alert("Não há registros para imprimir.");
    return;
  }

  let totalEntradas = 0;
  let totalSaidas = 0;

  let html = `
  <html>
  <head>
    <title>Planilha - ${mesAtual}</title>
    <style>
      body { font-family: Arial; padding: 20px; }
      table { width:100%; border-collapse: collapse; }
      th, td { border:1px solid #ccc; padding:8px; text-align:center; }
      .entrada { color:green; font-weight:bold; }
      .saida { color:red; font-weight:bold; }
      .resumo { margin-top:20px; font-size:18px; text-align:right; }
    </style>
  </head>
  <body>
    <h2>📊 Planilha </h2>
    <p><strong>Mês:</strong> ${mesAtual}</p>
    <table>
      <tr>
        <th>Data</th>
        <th>Descrição</th>
        <th>Entrada</th>
        <th>Saída</th>
      </tr>
  `;

  dados[mesAtual].forEach(r => {
    let ent = "";
    let sai = "";

    if (r.tipo === "entrada") {
      ent = r.valor.toFixed(2);
      totalEntradas += r.valor;
    } else {
      sai = r.valor.toFixed(2);
      totalSaidas += r.valor;
    }

    html += `
      <tr>
        <td>${r.data}</td>
        <td>${r.descricao}</td>
        <td class="entrada">${ent}</td>
        <td class="saida">${sai}</td>
      </tr>
    `;
  });

  const saldoTotal = totalEntradas - totalSaidas;

  html += `
    </table>
    <div class="resumo">
      <p>Total de Entradas: R$ ${totalEntradas.toFixed(2)}</p>
      <p>Total de Saídas: R$ ${totalSaidas.toFixed(2)}</p>
      <strong>Saldo do mês: R$ ${saldoTotal.toFixed(2)}</strong>
    </div>
  </body>
  </html>
  `;

  const win = window.open("", "", "width=900,height=650");
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

