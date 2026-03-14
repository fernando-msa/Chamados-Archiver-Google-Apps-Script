# 📋 Chamados Archiver — Arquivador Automático de OS de TI

> Automação para capturar ordens de serviço recebidas via Gmail dos sistemas **Rasptelles**, **Ksys** e **SMED**, convertê-las em PDFs identificados e organizá-las no Google Drive por sistema, ano e mês — desenvolvido para o setor de TI do HAMA.

---

## 📌 Visão Geral

Chamados de TI chegam por e-mail de diferentes sistemas e se acumulam na caixa de entrada sem rastreabilidade. Este script centraliza tudo no Drive automaticamente:

1. Lê e-mails de três marcadores distintos — um por sistema
2. Extrai o número da OS diretamente do assunto do e-mail
3. Converte cada e-mail em um **PDF estilizado** com cabeçalho identificado por sistema
4. Organiza no Google Drive por **Sistema → Ano → Mês**
5. Nomeia os arquivos pelo número da OS + data e hora
6. Evita duplicatas verificando se o arquivo já existe
7. Remove o marcador após processar, mantendo o e-mail na caixa de entrada

---

## 🗂️ Estrutura no Google Drive

```
📁 Chamados TI/
├── 📁 Rasptelles/
│   └── 📁 2026/
│       └── 📁 03 - Março/
│           ├── 📄 OS_202609693_2026-03-14_08-30.pdf
│           └── 📄 OS_202609701_2026-03-14_14-15.pdf
├── 📁 Ksys/
│   └── 📁 2026/
│       └── 📁 03 - Março/
│           ├── 📄 OS_121992_2026-03-14_09-00.pdf
│           └── 📄 OS_121993_2026-03-14_11-45.pdf
├── 📁 SMED/
│   └── 📁 2026/
│       └── 📁 03 - Março/
│           ├── 📄 OS_57053_2026-03-14_10-20.pdf
│           └── 📄 OS_57054_2026-03-14_15-30.pdf
└── 📁 _logs/
    └── 📄 log_chamados_2026-03-14_08-00.txt
```

---

## 🏷️ Nomenclatura dos Arquivos

```
OS_{número}_{data}_{hora}.pdf

Exemplos:
OS_202609693_2026-03-14_08-30.pdf   ← Rasptelles
OS_121992_2026-03-14_09-00.pdf      ← Ksys
OS_57053_2026-03-14_10-20.pdf       ← SMED
```

---

## 📄 Formato do PDF Gerado

Cada PDF possui cabeçalho com cor diferente por sistema para fácil identificação visual:

| Sistema | Cor do Cabeçalho | Label | E-mail |
|---|---|---|---|
| Rasptelles | 🔵 Azul escuro | OS Manutenção | `sistema@rasptelles.com.br` |
| Ksys | 🟢 Verde escuro | Chamado Ksys | `ti.sede@igh.org.br` |
| SMED | 🟣 Roxo | OS SMED | `mlsn.smpep@gmail.com` |

Conteúdo de cada PDF:
- Número da OS
- Assunto do e-mail
- Remetente
- Data e hora
- Corpo completo do e-mail

---

## 🔍 Extração do Número da OS

| Sistema | Padrão no assunto | Exemplo | Extração |
|---|---|---|---|
| Rasptelles | `OS` + número | `OS202609693 CRIADA COM SUCESSO!` | `202609693` |
| Ksys | `#` + número | `Novo Apontamento na Solicitação # 121992` | `121992` |
| SMED | `Nº` + número | `ALTERAÇÃO DE STATUS DO CHAMADO Nº 57053` | `57053` |

---

## ⚙️ Pré-requisitos

- Conta Google com acesso ao **Google Apps Script**
- Gmail com três marcadores criados:
  - `Chamados Rasptelles`
  - `Chamados Ksys`
  - `Chamados SMED`
- Pasta de destino criada no **Google Drive**

---

## 🛠️ Como Configurar

### 1. Crie o projeto no Apps Script

Acesse [script.google.com](https://script.google.com) → **Novo Projeto** → cole o conteúdo do arquivo `chamados_archiver.gs`.

### 2. Configure as variáveis

No topo do script, ajuste o `CONFIG`:

```javascript
var CONFIG = {
  PASTA_RAIZ_ID: "SEU_ID_AQUI",   // ID da pasta raiz no Drive
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
```

> 💡 **Como obter o ID da pasta:** abra a pasta no Drive — o ID é a sequência após `/folders/` na URL.

### 3. Crie os marcadores e filtros no Gmail

Para cada sistema, crie um filtro automático no Gmail:

| De: | Aplicar marcador |
|---|---|
| `sistema@rasptelles.com.br` | `Chamados Rasptelles` |
| `ti.sede@igh.org.br` | `Chamados Ksys` |
| `mlsn.smpep@gmail.com` | `Chamados SMED` |

### 4. Autorize as permissões

Na primeira execução, clique em **Permitir** para Gmail e Drive.

### 5. Configure o gatilho automático

- No Apps Script → **Gatilhos** → **+ Adicionar gatilho**
- Função: `arquivarChamados`
- Evento: **Com base no tempo → A cada hora**

---

## 📋 Log de Auditoria

```
Data/Hora        | Sistema  | OS            | Assunto                              | Arquivo
========================================================================================================================
2026-03-14_08-30 | Rasptelles | OS #202609693 | OS202609693 CRIADA COM SUCESSO!    | OS_202609693_2026-03-14_08-30.pdf
2026-03-14_09-00 | Ksys       | OS #121992    | Novo Apontamento Solicitação #121992 | OS_121992_2026-03-14_09-00.pdf
2026-03-14_10-20 | SMED       | OS #57053     | ALTERAÇÃO DE STATUS DO CHAMADO Nº 57053 | OS_57053_2026-03-14_10-20.pdf
```

---

## ⚠️ Limitações Conhecidas

| Limitação | Detalhe |
|---|---|
| Quota do Apps Script | Execuções limitadas a ~6 min. Reduza `MAX_THREADS` para grandes volumes |
| Número não encontrado | Se o assunto não seguir o padrão esperado, o arquivo é salvo como `OS_SEM_NUMERO_...` |
| Múltiplos apontamentos | Cada e-mail gera um PDF separado — atualizações da mesma OS ficam como arquivos individuais |

---

## 🔧 Melhorias Planejadas

- [ ] Agrupamento de apontamentos da mesma OS em subpasta
- [ ] Notificação por e-mail ao gestor para OS de alta prioridade
- [ ] Suporte a novos sistemas via configuração no `CONFIG.SISTEMAS`
- [ ] Dashboard de chamados abertos/fechados por período

---

## 🧰 Stack

![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Gmail API](https://img.shields.io/badge/Gmail%20API-EA4335?style=for-the-badge&logo=gmail&logoColor=white)
![Google Drive](https://img.shields.io/badge/Google%20Drive-34A853?style=for-the-badge&logo=googledrive&logoColor=white)

---

## 👤 Autor

**Fernando S. De Santana Júnior**
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/fernando-junior-1a74ab29b/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=flat&logo=github&logoColor=white)](https://github.com/fernando-msa)

---

## 📜 Licença

Distribuído sob licença MIT.
