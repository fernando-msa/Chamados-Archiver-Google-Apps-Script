// Copie este bloco para o seu projeto Apps Script e ajuste os valores.
var CONFIG = {
  PASTA_RAIZ_ID: "SEU_ID_DE_PASTA_NO_DRIVE",
  FUSO_HORARIO:  "GMT-3",
  MAX_THREADS:   50,

  SISTEMAS: {
    RASPTELLES: {
      MARCADOR:  "Chamados Rasptelles",
      EMAIL:     "sistema@rasptelles.com.br",
      PASTA:     "Rasptelles",
      REGEX_NUM: /OS(\d+)/i
    },
    KSYS: {
      MARCADOR:  "Chamados Ksys",
      EMAIL:     "ti.sede@igh.org.br",
      PASTA:     "Ksys",
      REGEX_NUM: /#\s*(\d+)/
    },
    SMED: {
      MARCADOR:  "Chamados SMED",
      EMAIL:     "mlsn.smpep@gmail.com",
      PASTA:     "SMED",
      REGEX_NUM: /N[°º]\s*(\d+)/i
    }
  }
};
