---
name: frontend-visual-system-fluid-glass
description: "Use when: padronizar a parte visual da aplicacao; definir cores padrao e tokens de design; aplicar linguagem fluid glass inspirada no iPhone; atuar como senior frontend em Next.js e Tailwind; refatorar para reutilizacao de componentes e evitar codigos longos."
---

# Frontend Visual System Fluid Glass

## Objetivo

Criar e manter um sistema visual consistente, elegante e reutilizavel para a aplicacao, com foco em:

- cores padrao baseadas em tokens
- componentes reutilizaveis e composicao limpa
- acabamento visual fluid glass (fundo translucido, blur, camadas e profundidade)
- legibilidade, acessibilidade e responsividade

## Quando usar

Use esta skill quando o pedido envolver:

- padronizacao visual de telas novas ou existentes
- reducao de codigo repetido em UI
- criacao de design system leve com tokens
- refatoracao de componentes para padrao senior frontend
- upgrade visual para estilo fluid glass

## Entradas minimas

Antes de implementar, confirmar:

- paginas e componentes alvo
- tema base (claro, escuro, ambos)
- paleta principal (ou liberdade para propor)
- nivel de refatoracao permitido (local ou amplo)

Padrao desta skill:

- escopo workspace (repositorio)
- tema dark-first, com light opcional
- refatoracao moderada (extracao para compartilhados quando houver duplicacao clara)

Se alguma entrada faltar, fazer perguntas curtas e objetivas antes de editar.

## Fluxo de trabalho

### 1. Diagnostico rapido

- mapear componentes repetidos, classes duplicadas e cores hardcoded
- identificar inconsistencias de spacing, tipografia, bordas e estados
- listar gargalos de manutencao (componentes muito longos, props excessivas, blocos repetidos)

### 2. Fundacao do sistema visual

- criar ou consolidar tokens semanticos de cor, superficie, borda, sombra e texto
- definir tokens de estado: default, hover, active, disabled, focus, danger, success
- estabelecer escala de radius, blur, elevation e opacidade para o efeito glass

Decisao:

- se houver design system existente, estender sem quebrar padrao
- se nao houver, criar base minima em camadas reutilizaveis

### 3. Arquitetura de componentes

- extrair primitivas reutilizaveis para reduzir repeticao
- compor componentes de dominio a partir das primitivas
- mover estilos recorrentes para variantes e utilitarios

Decisao:

- se um bloco visual se repetir 2 ou mais vezes, extrair componente
- se um componente ultrapassar complexidade alta (muito estado + muito markup), quebrar em subcomponentes
- priorizar dark mode na primeira iteracao e manter caminho de extensao para light mode

### 4. Aplicacao do estilo fluid glass

- usar superficies translucidas com blur e borda sutil
- aplicar camadas de fundo com gradientes suaves e contraste controlado
- reforcar hierarquia visual com sombras macias e tipografia clara
- preservar performance: evitar excesso de filtros e efeitos simultaneos

Padrao tecnico sugerido:

```css
.glass-panel {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.18) 0%,
    rgba(255, 255, 255, 0.08) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border-radius: 1rem;
}
```

Fallback sem blur:

- aumentar opacidade de fundo para rgba(255,255,255,0.22)
- manter borda e sombra para profundidade

### 4.1 Tokens de referencia (dark-first)

```css
:root {
  --bg-base: 150 55% 8%;
  --bg-mid: 142 70% 11%;
  --bg-soft: 0 0% 8%;
  --glass-surface: 0 0% 100%;
  --glass-border: 0 0% 100%;
  --text-primary: 0 0% 97%;
  --text-secondary: 0 0% 78%;
  --brand-primary: 142 62% 33%;
  --brand-primary-strong: 142 55% 52%;
  --accent-warm: 40 38% 92%;
}
```

### 4.2 Motion padrao

- entrada de pagina: fade + subida leve
- cards em grade: stagger curto
- hover de card: translacao leve + brilho de borda
- duracao base: 180-220ms

```css
:root {
  --ease-ui: cubic-bezier(0.22, 1, 0.36, 1);
  --dur-fast: 160ms;
  --dur-base: 220ms;
}
```

Evitar:

- animacao longa acima de 350ms
- bounce exagerado
- excesso de easing diferente na mesma tela

### 5. Validacao de qualidade

- confirmar contraste de texto e foco visivel
- validar comportamento em mobile e desktop
- garantir consistencia de tokens em toda a tela alterada
- revisar legibilidade em estados hover, active e disabled

## Criterios de conclusao

Concluir somente quando:

- nao houver cor hardcoded fora do arquivo de tokens (exceto casos justificados)
- principais blocos de UI estiverem componentizados e reutilizaveis
- codigo visual estiver mais curto, legivel e previsivel
- a interface apresentar identidade unica e coesa no estilo fluid glass
- layout estiver funcional em desktop e mobile

## Checklist rapido

- tokens de cor definidos
- superficies glass padronizadas
- componentes reutilizaveis extraidos
- estados visuais completos
- contraste e foco validados
- responsividade validada

Checklist extra visual:

- fundo com gradiente dinamico (nao flat)
- hover e focus consistentes
- alvos clicaveis com minimo de 40x40
- contraste minimo de 4.5:1 para texto comum

## Saida esperada

Ao usar esta skill, produzir:

- proposta de direcao visual (curta)
- lista de componentes novos/refatorados
- implementacao dos tokens e estilos
- resumo de ganhos de reutilizacao e manutencao
- validacao final de acessibilidade e responsividade

## Prompts de exemplo

- "Aplique a skill de fluid glass na dashboard e padronize todas as cores em tokens."
- "Refatore os formularios para reduzir duplicacao e usar componentes reutilizaveis com estilo glass."
- "Padronize navbar, cards e modais com visual senior frontend e mantenha desempenho."
