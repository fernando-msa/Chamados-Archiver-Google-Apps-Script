// ============================================================
// Arquivador Automático de Chamados TI — HAMA
// Google Apps Script
// Autor: Fernando S. De Santana Júnior
// Versão: 1.0
// ============================================================
//
// FONTES:
//   Rasptelles : OS de Manutenção  — ex: "OS202609693 CRIADA COM SUCESSO"
//   Ksys       : Portal de chamados — ex: "Solicitação # 121992"
//
// ESTRUTURA gerada no Drive:
//   📁 Chamados TI/
//   ├── 📁 Rasptelles/
//   │   └── 📁 2026/
//   │       └── 📁 03 - Março/
//   │           └── 📄 OS_202609693_2026-03-14_08-30.pdf
//   └── 📁 Ksys/
//       └── 📁 2026/
//           └── 📁 03 - Março/
//               └── 📄 OS_121992_2026-03-14_09-15.pdf
// ============================================================

var CONFIG = {
  PASTA_RAIZ_ID: "1Lk1V-ytu9_EVz6KfZT4tGLz629CRdGB1",
  FUSO_HORARIO:  "GMT-3",
  MAX_THREADS:   50,

  SISTEMAS: {
    RASPTELLES: {
      MARCADOR:  "Chamados Rasptelles",
      EMAIL:     "sistema@rasptelles.com.br",
      PASTA:     "Rasptelles",
      // Extrai número do padrão: OS202609693
      REGEX_NUM: /OS(\d+)/i
    },
    KSYS: {
      MARCADOR:  "Chamados Ksys",
      EMAIL:     "ti.sede@igh.org.br",
      PASTA:     "Ksys",
      // Extrai número do padrão: # 121992
      REGEX_NUM: /#\s*(\d+)/
    },
    SMED: {
      MARCADOR:  "Chamados SMED",
      EMAIL:     "mlsn.smpep@gmail.com",
      PASTA:     "SMED",
      // Extrai número do padrão: Nº 57053
      REGEX_NUM: /N[°º]\s*(\d+)/i
    }
  }
};

var MESES = {
  "01": "Janeiro",  "02": "Fevereiro", "03": "Março",
  "04": "Abril",    "05": "Maio",      "06": "Junho",
  "07": "Julho",    "08": "Agosto",    "09": "Setembro",
  "10": "Outubro",  "11": "Novembro",  "12": "Dezembro"
};

// ============================================================
// FUNÇÃO PRINCIPAL
// ============================================================
function arquivarChamados() {
  var pastaRaiz    = DriveApp.getFolderById(CONFIG.PASTA_RAIZ_ID);
  var totalSalvos  = 0;
  var totalErros   = 0;
  var logLinhas    = [];

  // Processa cada sistema separadamente
  for (var chave in CONFIG.SISTEMAS) {
    var sistema = CONFIG.SISTEMAS[chave];
    var resultado = processarSistema(sistema, pastaRaiz, logLinhas);
    totalSalvos += resultado.salvos;
    totalErros  += resultado.erros;
  }

  if (logLinhas.length > 0) {
    salvarLog(pastaRaiz, logLinhas);
  }

  Logger.log("========================================");
  Logger.log("✅ PDFs gerados : " + totalSalvos);
  Logger.log("❌ Erros        : " + totalErros);
  Logger.log("========================================");
}

// ============================================================
// PROCESSA UM SISTEMA (Rasptelles ou Ksys)
// ============================================================
function processarSistema(sistema, pastaRaiz, logLinhas) {
  var salvos = 0;
  var erros  = 0;

  var marcador = GmailApp.getUserLabelByName(sistema.MARCADOR);
  if (!marcador) {
    Logger.log("❌ Marcador '" + sistema.MARCADOR + "' não encontrado.");
    return { salvos: 0, erros: 1 };
  }

  var threads = marcador.getThreads(0, CONFIG.MAX_THREADS);
  Logger.log("📬 [" + sistema.PASTA + "] " + threads.length + " thread(s) encontrada(s).");

  var pastaSistema = obterOuCriarPasta(pastaRaiz, sistema.PASTA);

  for (var i = 0; i < threads.length; i++) {
    var mensagens = threads[i].getMessages();

    for (var j = 0; j < mensagens.length; j++) {
      var msg    = mensagens[j];
      var data   = msg.getDate();
      var assunto = msg.getSubject();

      // Extrai número do chamado
      var numeroChamado = extrairNumeroChamado(assunto, sistema.REGEX_NUM);
      if (!numeroChamado) {
        Logger.log("⚠️  Número não encontrado no assunto: " + assunto);
        numeroChamado = "SEM_NUMERO";
      }

      try {
        var ano       = Utilities.formatDate(data, CONFIG.FUSO_HORARIO, "yyyy");
        var mes       = Utilities.formatDate(data, CONFIG.FUSO_HORARIO, "MM");
        var dataHora  = Utilities.formatDate(data, CONFIG.FUSO_HORARIO, "yyyy-MM-dd_HH-mm");
        var nomeMes   = mes + " - " + MESES[mes];

        var pastaAno  = obterOuCriarPasta(pastaSistema, ano);
        var pastaMes  = obterOuCriarPasta(pastaAno, nomeMes);

        var nomeArq   = "OS_" + numeroChamado + "_" + dataHora + ".pdf";

        // Evita duplicatas
        if (arquivoJaExiste(pastaMes, nomeArq)) {
          Logger.log("⏭️  Já existe: " + nomeArq);
          continue;
        }

        // Converte e-mail em PDF estilizado
        var pdf = gerarPDF(msg, sistema.PASTA, numeroChamado, nomeArq);
        pastaMes.createFile(pdf);

        Logger.log("✅ Arquivado: " + nomeArq);
        logLinhas.push(
          dataHora + " | " + sistema.PASTA +
          " | OS #" + numeroChamado +
          " | " + assunto.substring(0, 60) +
          " | " + nomeArq
        );
        salvos++;

      } catch (e) {
        Logger.log("❌ Erro ao processar OS #" + numeroChamado + ": " + e.message);
        erros++;
      }
    }

    // Mantém na caixa de entrada — apenas remove o marcador
    threads[i].removeLabel(marcador);
  }

  return { salvos: salvos, erros: erros };
}

// ============================================================
// GERAÇÃO DO PDF
// ============================================================
function gerarPDF(msg, sistema, numeroChamado, nomeArq) {
  var dataFormatada = Utilities.formatDate(
    msg.getDate(), CONFIG.FUSO_HORARIO, "dd/MM/yyyy 'às' HH:mm"
  );

  var corSistema = sistema === "Rasptelles" ? "#1a5276" : sistema === "Ksys" ? "#145a32" : "#6e2fa1";
  var labelOS    = sistema === "Rasptelles" ? "OS Manutenção" : sistema === "Ksys" ? "Chamado Ksys" : "OS SMED";

  var css = "<style>" +
    "body { font-family: 'Courier New', monospace; font-size: 12px; color: #222; margin: 0; padding: 20px; }" +
    ".header { background-color: " + corSistema + "; color: white; padding: 16px 20px; border-radius: 4px; margin-bottom: 20px; }" +
    ".header h2 { margin: 0 0 6px 0; font-size: 16px; }" +
    ".header .meta { font-size: 11px; opacity: 0.85; }" +
    ".badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 2px 10px; border-radius: 12px; font-size: 11px; margin-top: 6px; }" +
    ".body { white-space: pre-wrap; line-height: 1.6; background: #f9f9f9; padding: 16px; border-radius: 4px; border: 1px solid #ddd; }" +
    "</style>";

  var html = "<html><head>" + css + "</head><body>" +
    "<div class='header'>" +
    "<h2>" + labelOS + " — #" + numeroChamado + "</h2>" +
    "<div class='meta'>" +
    "<b>Assunto:</b> " + msg.getSubject() + "<br>" +
    "<b>Remetente:</b> " + msg.getFrom() + "<br>" +
    "<b>Data:</b> " + dataFormatada +
    "</div>" +
    "<span class='badge'>" + sistema + "</span>" +
    "</div>" +
    "<div class='body'>" + msg.getPlainBody() + "</div>" +
    "</body></html>";

  return Utilities.newBlob(html, "text/html")
    .getAs("application/pdf")
    .setName(nomeArq);
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function extrairNumeroChamado(assunto, regex) {
  var match = assunto.match(regex);
  return match ? match[1] : null;
}

function obterOuCriarPasta(pai, nome) {
  var iter = pai.getFoldersByName(nome);
  return iter.hasNext() ? iter.next() : pai.createFolder(nome);
}

function arquivoJaExiste(pasta, nomeArquivo) {
  return pasta.getFilesByName(nomeArquivo).hasNext();
}

function salvarLog(pastaRaiz, linhas) {
  var dataHoje  = Utilities.formatDate(new Date(), CONFIG.FUSO_HORARIO, "yyyy-MM-dd_HH-mm");
  var nomeLog   = "log_chamados_" + dataHoje + ".txt";
  var cabecalho = "Data/Hora        | Sistema     | OS         | Assunto                                                     | Arquivo\n";
  cabecalho    += "=".repeat(120) + "\n";
  var conteudo  = cabecalho + linhas.join("\n");
  var pastaLogs = obterOuCriarPasta(pastaRaiz, "_logs");
  pastaLogs.createFile(nomeLog, conteudo, MimeType.PLAIN_TEXT);
  Logger.log("📋 Log salvo: " + nomeLog);
}
