# 🎮 Beast MaraData

**Aplicação mobile para coleta e organização de dados em uma arena itinerante de games.**

O **Beast MaraData** é um projeto acadêmico desenvolvido pela equipe LevelUp para a disciplina de Programação Mobile. A aplicação tem como objetivo auxiliar na coleta e organização de informações sobre participantes e atividades de uma arena itinerante de games, contribuindo para compreender o perfil do público e apoiar a gestão das atividades realizadas no evento.

O projeto está sendo desenvolvido com React Native e Expo, utilizando uma estrutura de navegação entre telas para reunir suas principais funcionalidades em um único aplicativo.

---

## 📌 Objetivos do projeto

- Facilitar o registro de informações sobre os participantes da arena.
- Organizar as funcionalidades relacionadas aos eventos e às filas.
- Disponibilizar uma estrutura para a visualização de estatísticas.
- Desenvolver uma aplicação mobile com navegação simples e intuitiva.
- Preparar a base do sistema para futuras integrações com um back-end e um banco de dados.

## ✨ Funcionalidades

O aplicativo está em desenvolvimento e conta com telas dedicadas às seguintes áreas:

| Funcionalidade | Descrição |
|---|---|
| 🏠 **Página inicial** | Tela principal de acesso às funcionalidades do aplicativo. |
| 👥 **Cadastro de participantes** | Formulário para registrar informações como nome, idade, gênero, escolaridade e preferências relacionadas a jogos. |
| 🎯 **Filas** | Área destinada à organização das filas relacionadas às atividades da arena. |
| 📊 **Estatísticas** | Tela destinada à apresentação de informações e dados sobre os participantes e as atividades. |
| 📅 **Eventos** | Área dedicada ao cadastro e ao gerenciamento de informações sobre eventos. |
| ☰ **Navegação** | Menu lateral para facilitar o acesso às diferentes áreas do aplicativo. |

> **Observação:** a existência de uma tela não significa necessariamente que toda a funcionalidade esteja concluída. Algumas áreas ainda estão em desenvolvimento.

## 🛠️ Tecnologias utilizadas

- **React Native** — desenvolvimento da interface mobile.
- **Expo** — ambiente e ferramentas para desenvolvimento da aplicação.
- **TypeScript** — tipagem estática e organização do código.
- **Expo Router** — navegação entre telas utilizando rotas baseadas em arquivos.
- **Git e GitHub** — versionamento e colaboração no desenvolvimento.

## 📂 Estrutura do projeto

A estrutura conhecida do projeto está organizada da seguinte maneira:

```text
MaraData/
└── src/
    ├── app/
    │   ├── _layout.tsx
    │   ├── index.tsx
    │   ├── about.tsx
    │   └── (funcoes)/
    │       ├── _layout.tsx
    │       ├── novoparticipante.tsx
    │       ├── filas.tsx
    │       ├── eventos.tsx
    │       └── estatistica.tsx
    ├── components/
    │   └── icons/
    └── features/
        └── participantes/
            └── participantes.tsx
```

### Organização das pastas

- **`src/app/`** — contém as telas e os layouts responsáveis pela navegação.
- **`src/app/(funcoes)/`** — reúne as telas das funcionalidades principais.
- **`src/components/`** — concentra componentes reutilizáveis da interface.
- **`src/features/participantes/`** — contém a lógica compartilhada relacionada aos participantes.

A estrutura poderá ser atualizada conforme o projeto evoluir.

## 🚀 Como executar o projeto

### Pré-requisitos

Antes de começar, instale:

- [Node.js](https://nodejs.org/)
- npm, instalado junto com o Node.js
- [Git](https://git-scm.com/)
- Um ambiente compatível com Expo, como o aplicativo Expo Go ou um emulador configurado.

### 1. Clone o repositório

```bash
git clone https://github.com/zazagx/MaraData.git
```

### 2. Entre na pasta do projeto

```bash
cd MaraData
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Inicie o ambiente de desenvolvimento

```bash
npx expo start
```

Após iniciar o servidor, siga as instruções exibidas no terminal para abrir o aplicativo em um dispositivo compatível ou em um emulador configurado.

> **Nota:** os comandos acima consideram que o projeto utiliza npm e possui a configuração padrão do Expo. Dependências adicionais ou configurações específicas do ambiente poderão ser necessárias.

## 🗺️ Próximos passos

Entre os objetivos previstos para a evolução do projeto estão:

- Implementar o back-end da aplicação.
- Definir e implementar a estrutura do banco de dados.
- Integrar as telas à camada de persistência de dados.
- Aprimorar a identidade visual de acordo com as cores, os símbolos e a estética da instituição.
- Evoluir as funcionalidades de cadastro, filas, eventos e estatísticas.

Esses itens representam objetivos de desenvolvimento, não funcionalidades já concluídas.

## 👥 Equipe LevelUp

Projeto desenvolvido para a disciplina de **Programação Mobile**, sob orientação do professor **Kleydson Beckman Barbosa**.

Integrantes:

- Isaac Gomes Xavier
- Luis Eduardo Ribeiro Galdino
- Eduardo Silva Coelho
- Renan Campos Serra
- Dávyds Chandlé Farias Melo
- Héricles Gonçalves Tavares

## 📚 Contexto acadêmico

O Beast MaraData é um projeto acadêmico voltado à aplicação prática de conceitos de desenvolvimento mobile, organização de código, navegação entre telas e evolução incremental de software.

## 📄 Licença

A licença de distribuição do projeto ainda não foi especificada. Até que seja definida, consulte os responsáveis pelo repositório para obter informações sobre permissões de uso, modificação e distribuição.

---

**Beast MaraData — tecnologia e organização para uma experiência melhor na arena.** 🎮
