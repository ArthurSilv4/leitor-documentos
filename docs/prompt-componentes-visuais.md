# Prompt: explicações visuais no chat

> Cole tudo abaixo da linha no agente de código, aberto no repositório do chat.

---

## Objetivo

Este chat já responde perguntas com base em documentos (busca e recuperação de trechos) e usa outras ferramentas. Quero que, **quando ajudar**, a resposta traga **explicações visuais interativas** para pessoas **não técnicas** entenderem o conteúdo: não enfeites, mas visuais que fazem o que o texto não consegue fazer, como deixar a pessoa explorar um processo, simular a própria situação, ver causa e efeito ou conferir se entendeu.

Use a tecnologia e as bibliotecas que o projeto já usa. Escolha o que faltar seguindo o padrão do projeto. Este documento descreve **como deve funcionar**, não como implementar.

## Como trabalhar

1. Antes de mudar qualquer coisa, entenda o chat atual: como a resposta chega à tela (de uma vez ou aos poucos), onde os trechos dos documentos são buscados e o que vem com cada um (texto, documento de origem, seção), como as mensagens são salvas e exibidas, e como as ferramentas são usadas. Me mostre um resumo curto.
2. Proponha um plano dizendo onde cada parte se encaixa e espere minha aprovação.
3. Implemente em etapas, cada uma funcionando e testada antes da próxima.
4. Siga o estilo do código existente e não mexa no que não precisa mudar.

## Como cada resposta deve funcionar

1. **O texto começa na hora.** Nada desta funcionalidade pode atrasar o início da resposta em texto.
2. **Decisão rápida, em paralelo:** um passo separado decide se esta pergunta ganha visuais ou só texto.
   - **Ganha visual:** processo ou etapas, situações (status), dúvida cuja resposta depende da situação da pessoa, o que cada perfil pode fazer, consequências de uma ação, regra com condições, prazo ou conta que a pessoa pode testar, descrição de uma tela, comparação entre opções, números comparáveis.
   - **Só texto:** pergunta pontual, sim ou não, definição curta, pedido de redação ou resumo, saudação, conversa.
   - **Na dúvida, só texto.** Quando a decisão é "só texto", nada mais acontece e nada aparece na tela.
3. **Preparação dos visuais**, se a decisão for sim:
   - um passo lê **os trechos já recuperados para esta pergunta**, junto com a conversa, e propõe até 8 blocos visuais preenchidos com o conteúdo desses trechos;
   - cada bloco é verificado (veja "Regras"), e o que estiver incompleto ou incoerente é descartado;
   - um passo de seleção escolhe, entre os blocos válidos, só os que ajudam a responder esta pergunta (poucos e bons) e como agrupá-los.
4. **Exibição aos poucos:** cada visual aparece no fim da resposta assim que fica pronto, mesmo com o texto ainda chegando. Enquanto prepara, a tela mostra uma linha discreta, por exemplo "Lendo o documento para preparar os desenhos…". Durante a decisão, não aparece nada.
5. **Encaixe no texto:** quando texto e visuais terminam, um passo escolhe depois de qual parágrafo cada visual ajuda mais (logo após o trecho que fala do mesmo assunto, nunca logo depois de um título), e o visual vai para lá. Se esse passo falhar, os visuais ficam no fim.
6. **Próximas perguntas:** a resposta termina com até 3 perguntas curtas que a pessoa provavelmente faria em seguida, escritas como ela perguntaria. Elas aparecem como botões, e um clique envia a pergunta. Esse trecho não aparece no texto e não volta para o modelo no histórico da conversa.
7. **Persistência:** ao reabrir a conversa, os visuais aparecem nos mesmos lugares e no mesmo estado inicial.

Os passos de decisão, seleção e encaixe são escolhas entre opções fixas (sim ou não; quais blocos; qual parágrafo). Use para isso um modelo rápido e barato, separado do que escreve a resposta.

## O texto da resposta

Ajuste o prompt da resposta, **sem apagar o que ele já faz**, para que:

- responda em palavras do dia a dia e frases curtas, começando pela resposta direta em uma ou duas frases e depois explicando da ideia principal para os detalhes;
- explique cada sigla ou termo técnico na primeira vez que aparecer, e use exemplos práticos;
- não cite nomes internos de sistema, parâmetros, códigos ou nomes de campos, a menos que a pessoa peça;
- diga de qual documento e de qual seção veio a informação;
- diga claramente quando a resposta não está nos documentos;
- escreva em parágrafos curtos separados, para que os visuais possam ser encaixados entre eles;
- use tabelas simples e fluxogramas curtos (até 8 caixas) direto no texto quando organizarem a informação. **Isso fica no texto e não vira componente.**

## Os componentes

Cada componente recebe só dados (nunca código) e é preenchido com conteúdo dos documentos.

**Explicadores interativos:**

1. **Jornada guiada:** um processo em etapas numeradas e clicáveis. Cada etapa tem título, quem faz e o que acontece. Algumas etapas têm desvios "E se…?" (ex.: "O fiscal propõe outra data → já fica aprovada na nova data"). Há botões Anterior/Próxima. No celular, as etapas ficam em lista vertical.
2. **Guia "E se…?":** perguntas simples de múltipla escolha ("Já foi aprovada?") levam a uma resposta final marcada como "Pode seguir", "Atenção" ou "Não é possível". As escolhas feitas aparecem acima, e dá para voltar a qualquer uma ou recomeçar. Todo caminho tem que terminar numa resposta.
3. **Quem faz o quê:** a pessoa escolhe um perfil (com ícone) e vê duas listas, "Pode" e "Não pode", em frases simples.
4. **O que acontece quando…:** uma frase "Quando [quem] [faz o quê]…" seguida dos efeitos, cada um com ícone e tipo (mudança de situação, aviso, registro, acesso, prazo) e uma observação opcional.
5. **Regra com exemplos:** a regra em destaque, o porquê, e situações concretas do dia a dia marcadas como "Pode" ou "Não pode", cada uma com explicação (ex.: "Hoje às 9h, marcar para hoje às 15h: não pode, faltam só 6 horas").
6. **Mapa da tela:** um esboço simples de uma tela com áreas numeradas (topo, esquerda, centro, direita, rodapé) e uma legenda com o que cada área faz. Passar o mouse ou clicar numa área destaca a explicação dela.
7. **Verificador de prazo:** para regras de antecedência. A pessoa escolhe data e hora e vê quanto tempo falta, o horário mais cedo possível e o resultado "Pode marcar" ou "Não pode marcar", com o motivo. O tempo se atualiza sozinho com a página aberta.
8. **Simulador:** a pessoa muda números ou escolhe opções e vê os resultados na hora, mais uma mensagem ("Cabe", "Atenção", "Passa do limite") conforme condições. As contas vêm como fórmulas simples sobre as entradas (veja "Regras").
9. **Teste seu entendimento:** de 1 a 3 perguntas de múltipla escolha. Ao responder, mostra a certa, a errada e a explicação. No fim, mostra quantas a pessoa acertou e um botão para refazer.

**Explicações de conceito:**

10. **Conceito com analogia:** o termo, o que é, uma comparação do dia a dia em destaque ("É como…"), para que serve e um exemplo.
11. **Comparação:** 2 ou 3 opções lado a lado, cada uma com um resumo e pontos curtos.

**Números e tempo:**

12. **Número em destaque:** um valor importante, com rótulo e detalhe.
13. **Gráfico de barras**, 14. **gráfico de linha** e 15. **gráfico de pizza** (partes de um todo, até 5 fatias): todos com dica ao passar o mouse e um botão para ver os mesmos dados em tabela.
16. **Linha do tempo:** acontecimentos com data, em ordem.

Monte uma **galeria** acessível no app que mostre todos os componentes funcionando com exemplos do nosso domínio, para o time conhecer o que existe e testar a aparência.

## Regras que não podem ser quebradas

- **Nenhum código vindo da IA é executado.** As fórmulas do simulador são avaliadas por uma calculadora própria que aceita só números, os nomes das entradas daquele simulador, `+ - * / %`, comparações, "e", "ou", "não" e as funções mínimo, máximo, arredondar e valor absoluto. Qualquer outra coisa invalida o bloco. Inclua testes com tentativas de abuso, como chamadas de função desconhecidas, acesso a propriedades e texto no lugar de número.
- **Só conteúdo recuperado.** Nada de inventar números, datas, regras, perfis ou exemplos que contradigam os documentos. Se a busca não trouxe base, não há visual.
- **Validação estrita de cada bloco**, com descarte de qualquer bloco que não passe:
  - campos obrigatórios presentes e com o tipo certo;
  - desvios da jornada apontando para etapas que existem;
  - todo caminho do guia levando a uma pergunta existente ou a uma resposta final;
  - resposta certa do teste entre as opções;
  - fórmulas válidas;
  - limites de quantidade respeitados (etapas, perguntas, fatias, itens).
  
  Campos opcionais que vierem faltando são tratados como vazios. Nada é "consertado" à força.
- **Linguagem para não técnicos** também nos visuais: rótulos curtos, palavras do dia a dia e siglas explicadas.
- **Interface sem jargão:** nenhum nome de modelo, provedor ou termo técnico aparece para o usuário. Erros aparecem em linguagem simples (ex.: "Não consegui me conectar. Verifique sua internet e tente de novo"), com um botão "Tentar de novo" e o detalhe técnico escondido em "Detalhes para o suporte".
- **Falhas não derrubam a resposta:** se qualquer passo dos visuais falhar, o texto chega normalmente. Os visuais não aparecem, ou ficam no fim, e a falha é registrada para o suporte.
- **Acessibilidade:**
  - estados como "pode", "não pode" e "atenção" sempre com ícone e texto, nunca só com cor;
  - tudo usável por teclado;
  - cores dos gráficos com contraste e distinguíveis por quem tem daltonismo, nos modos claro e escuro;
  - legenda sempre visível nos gráficos com mais de uma cor;
  - tudo funciona no celular.
- **Chaves e credenciais só no servidor.**

## Controles do usuário

- No campo de mensagem, um botão alterna entre **Desenhos: automático** (o passo de decisão escolhe), **sempre** e **nunca**. A escolha fica lembrada.
- Respostas sem visuais ganham o botão **Explicar com desenhos**, que gera visuais só para aquela resposta, sem refazer o texto.
- A tela inicial mostra algumas perguntas de exemplo ("Resuma este documento em linguagem simples", "Quem pode fazer o quê?"). Clicar preenche o campo.

## Etapas

1. **Componentes e galeria:** todos os componentes funcionando com dados de exemplo, nos modos claro e escuro e no celular.
2. **Passos no servidor:** decisão, preparação, verificação, seleção e encaixe, em paralelo ao texto. Teste com modelos simulados que:
   - a ordem dos acontecimentos é decisão, preparação com o texto já chegando, visuais prontos e, por fim, encaixe;
   - uma pergunta pontual não dispara a preparação.
3. **Tela:** visuais aparecendo aos poucos e mudando de lugar, próximas perguntas, controles, mensagens de erro e conversa reaberta igual.
4. **Ajuste com perguntas reais:** pelo menos 10 perguntas sobre os nossos documentos, metade pontuais e metade sobre processos e regras. Me mostre:
   - quantas ganharam visuais e quais componentes;
   - o tempo até o primeiro texto e até o primeiro visual;
   - os blocos descartados e o motivo.

## Entrega

- Resumo do que mudou e onde.
- Como rodar e o que configurar.
- Resultado da etapa 4, com prints.
- Riscos e decisões em aberto: custo por pergunta, tempo de resposta, limites.
