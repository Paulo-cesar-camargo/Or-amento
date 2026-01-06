/* ================= CONFIGURAÇÃO ================= */
const SENHA = "DeusNoControle";
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzKN8i6RYpxpaBCii1A4sxYJ2pcPTzrRxyG_B80cDpOiGX8ro-pB362g1GAH1QF1zM/exec";

let dados = {};
let mesAtual = "";
let saldo = 0;

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
  saldo = 0;

  const tabela = document.getElementById("tabela");
  tabela.innerHTML = "";

  registros.forEach((r, i) => {
    let entrada = "", saida = "";

    if (r.tipo === "entrada") {
      entrada = r.valor.toFixed(2);
      saldo += r.valor;
    } else {
      saida = r.valor.toFixed(2);
      saldo -= r.valor;
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

  document.getElementById("saldo").innerText =
    `Saldo Atual: R$ ${saldo.toFixed(2)}`;
}

function adicionarRegistro() {
  const data = document.getElementById("data").value;
  const descricao = document.getElementById("descricao").value;
  const tipo = document.getElementById("tipo").value;
  const valor = parseFloat(document.getElementById("valor").value);

  if (!data || !descricao || isNaN(valor)) {
    alert("Preencha todos os campos");
    return;
  }

  const registro = { data, descricao, tipo, valor, mes: mesAtual };

  if (!dados[mesAtual]) dados[mesAtual] = [];
  dados[mesAtual].push(registro);

  salvarLocal();
  carregarMes();
  salvarNoGoogleSheets(registro);

  document.getElementById("descricao").value = "";
  document.getElementById("valor").value = "";
}

function deletar(i) {
  dados[mesAtual].splice(i, 1);
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
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
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

  let html = `
    <html>
    <head>
      <title>Planilha Camargo - ${mesAtual}</title>
      <style>
        body { font-family: Arial; padding: 20px; }
        table { width:100%; border-collapse: collapse; }
        th, td { border:1px solid #ccc; padding:8px; text-align:center; }
        .entrada { color:green; font-weight:bold; }
        .saida { color:red; font-weight:bold; }
        .saldo { margin-top:20px; font-size:18px; text-align:right; }
      </style>
    </head>
    <body>
      <h2>📊 Planilha Camargo</h2>
      <p><strong>Mês:</strong> ${mesAtual}</p>
      <table>
        <tr>
          <th>Data</th>
          <th>Descrição</th>
          <th>Entrada</th>
          <th>Saída</th>
        </tr>
  `;

  let total = 0;

  dados[mesAtual].forEach(r => {
    let ent = "", sai = "";
    if (r.tipo === "entrada") {
      ent = r.valor.toFixed(2);
      total += r.valor;
    } else {
      sai = r.valor.toFixed(2);
      total -= r.valor;
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

  html += `
      </table>
      <div class="saldo">Saldo do mês: R$ ${total.toFixed(2)}</div>
    </body>
    </html>
  `;

  const win = window.open("", "", "width=900,height=650");
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}
