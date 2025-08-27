# Documentação Técnica: API Conversacional para Análise de Dados de Postos de Combustível

## 1. Introdução

Esta documentação detalha a arquitetura e a implementação da API backend construída para suportar uma IA conversacional destinada a gerentes de postos de combustível. A API permite a ingestão de dados operacionais (via upload de arquivos Excel), a autenticação de usuários, o gerenciamento de sessões de chat e a interação com um modelo de linguagem avançado (GPT-4o) para consultas de dados em linguagem natural.

A solução foi desenvolvida utilizando **NestJS** (um framework progressivo para Node.js) e segue os princípios da **Clean Architecture**, promovendo a separação de preocupações, a testabilidade e a manutenibilidade do código. A autenticação é gerenciada por **JWT (JSON Web Tokens)** com chaves **RSA256**, garantindo segurança nas comunicações. O armazenamento de dados principal é o **MongoDB**.

## 2. Visão Geral da Arquitetura

A arquitetura da API é modular e segue a estrutura de Clean Architecture, dividindo o código em camadas distintas:

- **Core:** Contém as definições de domínio mais puras e agnósticas a qualquer tecnologia (entidades, erros, tipos).
- **Domain:** Define as interfaces (contratos) e as regras de negócio (Use Cases e Repositórios Abstratos), sendo a camada mais importante, independente de frameworks.
- **Infra:** Implementa os detalhes técnicos e de infraestrutura (serviços de banco de dados, comunicação com APIs externas, criptografia, autenticação, HTTP controllers).

### Tecnologias Chave:

- **NestJS:** Framework para construir aplicações Node.js eficientes e escaláveis.
- **MongoDB:** Banco de dados NoSQL utilizado para persistência de dados (chats, mensagens, transações, usuários).
- **Mongoose:** ODM (Object Data Modeling) para MongoDB no Node.js, facilitando a interação com o banco de dados.
- **Azure OpenAI (GPT-4o):** Modelo de linguagem avançado da OpenAI, consumido via Azure, responsável pela inteligência conversacional.
- **JWT (JSON Web Tokens):** Padrão para criação de tokens de acesso seguro para autenticação e autorização.
- **RSA256:** Algoritmo de criptografia assimétrica usado para assinar os JWTs, garantindo a integridade e autenticidade dos tokens.
- **ExcelJS:** Biblioteca para leitura e escrita de arquivos Excel (.xlsx) no backend.
- **date-fns:** Biblioteca para manipulação de datas, utilizada para garantir a precisão de fusos horários e ranges.

## 3. Estrutura de Pastas e Módulos

A organização do projeto reflete a Clean Architecture, facilitando a navegação e a compreensão da base de código:

```
├── app.module.ts                 # Módulo raiz da aplicação
├── core                          # Camada de Domínio Pura (agnóstica a tecnologia)
│   ├── @types                    # Definições de tipos globais
│   ├── decorators                # Decorators customizados para NestJS
│   ├── entities                  # Entidades de domínio (classes puras)
│   └── errors                    # Classes de erro de domínio
├── domain                        # Camada de Regras de Negócio (interfaces e use-cases)
│   └── intec                     # Contexto de negócio específico (Intec)
│       ├── cryptography          # Interfaces de serviços de criptografia
│       ├── entities              # DTOs (Data Transfer Objects) para entrada/saída de use-cases
│       │   └── dto
│       ├── repositories          # Interfaces de repositórios (contratos de persistência)
│       └── use-cases             # Lógica de negócio principal
├── infra                         # Camada de Implementação (detalhes técnicos)
│   ├── ai                        # Implementação de serviços de IA (OpenAI)
│   ├── auth                      # Implementação de autenticação (JWT)
│   ├── cryptography              # Implementação de serviços de criptografia (Bcrypt, JWT)
│   ├── database                  # Configuração e implementações de banco de dados (MongoDB, Mappers, Repositórios concretos, Schemas)
│   │   └── mongodb
│   ├── env                       # Gerenciamento de variáveis de ambiente
│   └── http                      # Camada HTTP (Controllers, Filtros, Guards, Interceptors)
└── main.ts                       # Ponto de entrada da aplicação NestJS
```

### Detalhes de Módulos e Componentes Específicos:

- **`app.module.ts`**: Módulo raiz que importa e orquestra todos os outros módulos.
- **`core/entities`**:
  - `user.entity.ts`, `chat.entity.ts`, `message.entity.ts`, `transaction.entity.ts`: Definições das entidades de domínio, que são classes simples com construtores e propriedades `readonly`.
- **`domain/intec/repositories`**:
  - `*.repository.ts`: Interfaces abstratas que definem os contratos de persistência de dados. Ex: `TransactionRepository` com o método `abstract aggregate(pipeline: any[]): Promise<any[]>` e `abstract bulkWrite(operations: any[], session?: ClientSession): Promise<any>`.
- **`domain/intec/use-cases`**:
  - `*.use-case.ts`: Classes que contêm a lógica de negócio principal. Elas dependem apenas das interfaces dos repositórios, não de suas implementações. Ex: `SendMessageUseCase`, `ImportTransactionsUseCase`.
- **`infra/database/mongodb`**:
  - `schemas/*.schema.ts`: Schemas do Mongoose que definem a estrutura dos documentos no MongoDB.
  - `repositories/mongo-*.repository.ts`: Implementações concretas das interfaces de repositório, utilizando Mongoose para interagir com o MongoDB.
  - `mappers/*.mapper.ts`: Classes que convertem entre entidades de domínio (`core/entities`) e documentos de schema do Mongoose (`infra/database/mongodb/schemas`).
- **`infra/ai/open-ai`**:
  - `open-ai.service.ts`: Implementa a comunicação com a API do Azure OpenAI, encapsulando as chamadas e o tratamento de credenciais.

## 4. Fluxos de Negócio Implementados

### 4.1. Autenticação de Usuários

A API utiliza autenticação baseada em JWT com chaves RSA256.

- **Registro (`POST /auth/register`):**
  - Recebe `name`, `email`, `password`, `cpf` (obrigatórios) e `phone` (opcional) no `CreateUserDto`.
  - Utiliza `domain/intec/use-cases/user/create-user.use-case.ts` para processar o registro.
  - A senha é gerada e comparada usando serviços definidos em `domain/intec/cryptography` e implementados em `infra/cryptography` (ex: `bcrypt-hasher.service.ts`).
  - Retorna `id` e `email` do novo usuário.
- **Login (`POST /auth/login`):**
  - Recebe `email` e `password` no `LoginUserDto`.
  - Utiliza `domain/intec/use-cases/user/login-user.use-case.ts` para autenticar o usuário.
  - Se as credenciais forem válidas, um `access_token` JWT é gerado e retornado.
    - Este token é assinado com o algoritmo **RSA256** (via `jwt-encrypter.service.ts`), garantindo que apenas a API possa gerar e validar tokens válidos, sem compartilhar o segredo simétrico.
- **Guarda de Autenticação (`infra/auth/jwt-auth.guard.ts`):** Protege as rotas que exigem autenticação, validando o JWT presente no header `Authorization: Bearer <token>`.

### 4.2. Importação de Transações de Postos (ETL)

Este fluxo permite a ingestão de grandes volumes de dados operacionais via upload de arquivos Excel.

- **Endpoint (`POST /transactions/import`):**
  - Recebe um arquivo Excel (.xlsx) no corpo da requisição via `multipart/form-data`, no campo `file`.
  - É orquestrado pelo `TransactionsController`.
  - Documentado extensivamente via Swagger, incluindo exemplos de sucesso (código 201 com `importedCount`) e erros (código 400 com detalhes de validação por linha).
- **`ImportTransactionsUseCase` (`domain/intec/use-cases/transaction/upload-transactions.use-case.ts`):**
  - **Recebimento do Buffer:** Recebe o `fileBuffer` do controller.
  - **Leitura do XLSX:** Utiliza a biblioteca `exceljs` para carregar o buffer e iterar sobre as linhas da primeira planilha (`worksheet.eachRow`).
  - **Mapeamento de Colunas:** Usa um objeto `COLUMN_INDICES` para extrair valores de células específicas baseadas em sua posição (índice 1). **Nota:** Os índices devem ser ajustados para corresponder à ordem real das colunas no arquivo Excel.
  - **Transformação de Dados:**
    - `_cleanAndParseNumber(value)`: Função auxiliar que limpa strings de valores numéricos (removendo "R$", pontos de milhar e substituindo vírgulas por pontos) antes de converter para `number`. Retorna `undefined` para valores inválidos.
    - `_parseDateAndTimeToUTC(dateCell, timeCell)`: Função auxiliar crucial para datas.
      - Ela parseia strings de data (`DD/MM/YYYY`) e hora (`HH:MM:SS`) separadamente (ou as combina se presentes).
      - **Principalmente, ela cria objetos `Date` em UTC (`new Date(Date.UTC(...))`)**. Isso garante que todas as datas sejam armazenadas no MongoDB de forma consistente (`YYYY-MM-DDTHH:MM:SS.000Z`), eliminando problemas de fuso horário.
      - Retorna `undefined` para datas/horas inválidas.
    - `_createTransactionEntity(rawData)`: Converte os dados brutos extraídos para uma instância da entidade `Transaction` (`core/entities/transaction.entity.ts`). Campos opcionais vazios recebem "N/A" para consistência.
  - **Validação por Linha (`_validateTransaction`):**
    - Verifica a presença e validade de campos essenciais (datas, cupom, funcionário, produto, quantidades, preços).
    - Logs (`warn`) são gerados para linhas com erros.
    - Registros inválidos são coletados em um array `importErrors` e **não** são incluídos na operação de inserção.
  - **Carga (`Bulk Write`):**
    - As transações válidas são agrupadas em operações `insertOne` para um `bulkOperations` array.
    - `transactionRepository.bulkWrite(bulkOperations, session)`: Executa todas as inserções em massa dentro de uma transação de sessão MongoDB. Isso garante alta performance e atomicidade.
    - Em caso de erros durante o `bulkWrite` (ex: violação de constraints, problemas de DB), a transação é abortada e uma `BadRequestException` é lançada, contendo os detalhes dos erros por linha (se aplicável) e o `importedCount` de sucesso antes da falha.

### 4.3. IA Conversacional para Consultas de Dados

A funcionalidade central da API é permitir que os usuários façam perguntas em linguagem natural sobre os dados operacionais e recebam respostas inteligentes. [cite: 1]

- **Endpoint (`POST /messages/send`):**
  - Recebe `chatId` (opcional, para continuar um chat existente) e `content` (a mensagem do usuário) no `SendMessageInput`.
  - Orquestrado pelo `MessageController`.
- **`SendMessageUseCase` (`domain/intec/use-cases/message/send-message.use-case.ts`):** Orquestrador do fluxo da IA.
  - **Gerenciamento de Chat:**
    - Se `chatId` não for fornecido, um novo chat é criado (`chatRepository.create`). A IA é usada para gerar um título curto para o novo chat (`iaApiService.generateTitle`).
    - Se `chatId` existe, as últimas `10` mensagens do histórico do chat são recuperadas do MongoDB (`messageRepository.findMany({ ..., limit: 10, sort: { createdAt: -1 } })`). O histórico é então **invertido (`.reverse()`)** para ser passado à IA na ordem cronológica (mais antiga para mais recente), otimizando o contexto.
  - **Fluxo da IA em Três Etapas:**
    1.  **Interpretação da Intenção e Geração da Query (`iaApiService.generateMongoQuery`):**
        - A mensagem do usuário e o histórico são enviados ao `OpenAiService.generateMongoQuery`.
        - **Prompt de Sistema:** Um prompt altamente detalhado (conforme seção 3.2 do ETL) é enviado ao GPT-4o, incluindo:
          - O **schema completo** do MongoDB para a coleção `transactions`, informando os campos e seus tipos.
          - **Regras detalhadas** para a IA construir o pipeline de agregação (`$match`, `$group`, `$sum`, `$avg`, `$sort`, `$limit`).
          - **Regras para filtros de data:** A IA é instruída a usar **placeholders simplificados** para datas (`"TODAY"`, `"YESTERDAY"`, `"SPECIFIC_DATE_DD/MM/YYYY"`, `"MONTH_MM/YYYY"`, `"YEAR_YYYY"`, `"ALL_TIME"`). Isso reduz a chance de erros de sintaxe da IA.
          - **Regras para filtros de produto:** A IA é instruída a usar filtros `$regex` para o campo `product` (ex: `"product": { "$regex": "gasolina", "$options": "i" }`).
          - **Exemplos (Few-shot Learning):** Numerosos exemplos de perguntas e seus pipelines JSON correspondentes são fornecidos, cobrindo todas as intenções e combinações de filtros (data, produto).
          - **Restrição de Formato JSON:** Uma instrução explícita (`**IMPORTANTE: A SAÍDA DEVE SER SEMPRE UM JSON VÁLIDO E PERFEITAMENTE FORMATADO, SEM VÍRGULAS EXTRAS OU ERROS DE SINTAXE.**`) é dada para mitigar erros de parsing de JSON na resposta da IA.
        - **Parâmetros da Chamada:** `temperature` baixo (0.1) para respostas mais determinísticas, `maxTokens` alto (700) para acomodar a complexidade dos pipelines.
        - **Tratamento de Saída da IA:** O backend tenta `JSON.parse()` a resposta da IA. Se o parsing falhar, um erro é logado e uma mensagem de erro genérica é retornada ao usuário.
    2.  **Injeção de Datas e Execução da Query (`SendMessageUseCase.injectDatesIntoPipeline` + `transactionRepository.aggregate`):**
        - Se a IA gerou um pipeline válido, a função `injectDatesIntoPipeline` é chamada.
        - Esta função pega o pipeline com os placeholders simplificados gerados pela IA.
        - Com base no placeholder (ex: "MONTH_04/2025"), ela calcula o range de datas `($gte, $lt)` preciso, criando **objetos `Date` em UTC** que correspondem ao início do dia (ou mês, ou ano) e o início do dia (ou mês, ou ano) seguinte.
        - Estes objetos `Date` são injetados diretamente no pipeline.
        - O pipeline final (com objetos `Date` reais) é então executado no MongoDB via `transactionRepository.aggregate()`.
    3.  **Humanização da Resposta (`iaApiService.humanizeResponse`):**
        - O resultado (cru) da query do MongoDB, a pergunta original do usuário e o histórico são enviados ao `OpenAiService.humanizeResponse`.
        - **Prompt de Sistema:** Este prompt instrui a IA a formatar o resultado em uma resposta "clara, concisa e amigável em português".
        - **Regras de Formatação:** Inclui regras para formatar valores numéricos (R$, vírgulas/pontos) e lidar com resultados vazios (ex: "Não foi possível encontrar informações...").
        - **Exemplos:** Vários exemplos de humanização para diferentes cenários são fornecidos.
        - **Parâmetros da Chamada:** `temperature` um pouco mais alto (0.7) para permitir mais fluidez.
  - **Persistência:** As mensagens do usuário e as respostas da IA são salvas no MongoDB (`messageRepository.create`) para manter o histórico do chat.

## 5. Endpoints da API (Swagger)

A API é documentada usando Swagger/OpenAPI, acessível em `/docs`.

- **`POST /auth/register`**: Cadastra um novo usuário.
- **`POST /auth/login`**: Autentica um usuário e retorna um JWT.
- **`GET /chats`**: Recupera todos os chats do usuário logado.
- **`POST /messages/send`**: Envia uma mensagem à IA, gerencia chats e salva a conversa.
- **`GET /messages?chatId={id}`**: Recupera todas as mensagens de um chat específico.
- **`GET /users/me`**: Busca informações do usuário logado.
- **`POST /transactions/import`**: Realiza o upload de um arquivo Excel para importação de transações.

## 6. Considerações Finais

A API é uma solução robusta e escalável, utilizando tecnologias modernas e princípios de design sólidos. O foco na Clean Architecture garante que a lógica de negócio esteja desacoplada da infraestrutura, facilitando futuras manutenções e evoluções. A integração com o GPT-4o e o processo ETL dedicado permitem análises de dados complexas de forma intuitiva para o usuário final.
