# 🐾 HANDOFF — Pontinhos & Bigodinhos (ex-Palette Master / ex-Pontinhos & Ratinhos)
Documento-fonte da verdade. Atualizar ao fim de cada fase.

## 1. PESSOAS E OBJETIVO
Dono: Schev. Usuária final: Helo (bordadeira).
App web de ateliê de cores: extrair paleta de imagem → casar com linhas DMC → salvar em ninhos → exportar.
Identidade: kawaii multi-bichinho ("todo bicho tem bigode"); mockups Meta IA + artes geradas no chat = fonte da verdade visual.

## 2. LINKS
Repo: github.com/lSchev/pontinhos-bigodinhos (renomeado em 31/08/2026).
GitHub Pages: https://lschev.github.io/pontinhos-bigodinhos/ (ativado 31/08/2026).
Streamlit legado (aposentar): https://palette-master.streamlit.app.

## 3. FLUXO / REGRAS
Conciso, sem rodeios; não citar TDAH.
Qwen escreve/revisa código; Meta IA só p/ mockups/artes; Schev cola arquivos inteiros (NUNCA micro-patches) e testa com prints.
Confirmar antes de executar links de terceiros; só vale o que chegar no chat.
NUNCA instruir push/deploy/rename sem autorização explícita (push e rename AUTORIZADOS em 31/08/2026).

## 4. STACK E TESTE LOCAL
App REAL 100% client-side: index.html + style.css + data.js + app.js
(React 18 UMD + Babel standalone + Tailwind CDN; ícones = SVG React nativo; sem backend).
Teste local: python -m http.server 5500 → http://localhost:5500.
PC: Ryzen 9 7900X / RTX 5070 Ti / Windows (PowerShell).
Legado Streamlit (app.py, core/, ui/ etc.) mantido no repo só como referência.

## 5. REPO ATUAL (árvore)
Raiz: index.html | style.css | data.js | app.js | HANDOFF.md | README.md | requirements.txt (legado)
assets/: wallpaper-pastel.png, wallpaper-dark.png, header-pastel.png, header-dark.png
assets/mascotes/: mascote-avatar.webp (claro), mascote-avatar-dark.png (dark), mascote-balao.jpg, mascote-dicas.jpg, mascote-pensando.jpg, mascote-turma.webp
Legado Streamlit: app.py, core/, ui/, assets/css/, data/plugins/ (bordado_dmc.json 489 + dmc_fofinho.json 35), scripts/, .streamlit/

## 6. FEATURES v2.5 (FASE 9 FECHADA)
4 abas: Extrator | Ateliê | Ninhos | Catálogo. Harmonias dentro do Extrator.
Temas: pastel (padrão) / dark; localStorage "pm_theme".
Visual por tema: wallpaper (wallpaper-pastel/dark, opacidade ~45%/35% + fallback polka dots); cabeçalho com faixa repetida (header-pastel/dark via ::before, opacity .45/.35); avatar troca (mascote-avatar.webp / mascote-avatar-dark.png) via window.__PB_DARK (setado no corpo do App; usado no header e no HamsterTip).
Fontes: Quicksand (títulos) + Nunito (texto). ZERO emojis.

EXTRATOR:
- Upload/arrastar JPG/PNG/WEBP; canvas persiste entre abas (display:none).
- Conta-gotas: média NxN (N=4–30 via rodinha sobre a foto + chip "Área"); lupa com zoom real 2–12x (slider); clique suga a cor.
- Arrastar: desenha área de captura (moldura tracejada + florzinhas nos cantos); K-means só da área; "limpar área" volta ao todo; trocar p/ conta-gotas limpa a área.
- K-means k=2–12 (slider; reextrai no mouseup).
- Linha DMC mais próxima (top 6) com % de confiança.
- Harmonias: pastel/analoga/triade/monocrom + slider força pastel (0–100).
- Salvar paleta/harmonia: modal nome + ninho (opcional) + "+ Criar novo ninho".

ATELIÊ:
- Paletas salvas: export PNG/CSS, apagar, limpar tudo; mostra ninho e data.
- Bancada (3 ferramentas, cada uma com "Salvar no ninho"):
  1. Lista de compras DMC: paleta + tamanho P/M/G (10/20/30cm, aida 14) → meadas por linha DMC (~800 pts/meada); exporta .txt.
  2. Simulador de pontos: largura/altura em pontos + aida 14/16/18 → tamanho final em cm + total de pontos.
  3. Moodboard: paleta + foto de referência + notas → exporta PNG.

NINHOS:
- Criar/apagar; contadores de paletas e projetos.
- Por paleta: exportar PNG, copiar CSS, Continuar (carrega as cores no Extrator).
- Por projeto (lista/sim/mood): Abrir (devolve config à bancada) e Exportar (.txt/PNG).
- Ícone por ninho editável no mapa NINHO_ICONES (topo do app.js).

CATÁLOGO:
- 489 DMC reais + 35 Fofinho mesclados; busca por código/nome fofo/nome/hex + aliases PT→EN; filtro por família HSV; copiar hex.

PERSISTÊNCIA: localStorage pb_groups (ninhos c/ paletas+projetos), pb_palettes, pm_theme.

## 7. FÓRMULAS
Match DMC: distância euclidiana RGB; % = clamp(0..100, round((100 - dist/sqrt(3*255²))*100)/10).
Slider pastel t(0–100): s'=max(10, s*(1-0.75t)); l'=min(90, l+t*(84-l)).
Harmonias HSL: análogas ±30; tríade +120/+240; mono l+20/0/-15/-30.
Finder HSV: Neutros s<0.15 ou v<0.15; Marrom 15≤h<45 e v<0.65; Vermelho h<15 ou h≥345; Laranja 15–40; Amarelo 40–70; Verde 70–170; Azul 170–260; Roxo 260–310; Rosa 310–345.
Lista de compras: aida 14 → ptsPerCm=14/2.54; lado=round(cm*ptsPerCm); total=lado²; per=total/nCores; meadas=max(1, ceil(per/800)).
Simulador: cm final = pontos / (count/2.54).

## 8. BACKLOG (FUTURO)
- Exports seguindo o tema ativo (PNG/CSS/moodboard hoje usam paleta clara fixa).
- Coleções no Catálogo: seletor DMC/Fofinho/Site/Minhas ao subir mais linhas.
- Marca d'água (~15% opacidade) nos cards dos Ninhos.
- Bastidor de madeira p/ harmonias (detalhe do mockup antigo).
- Ajustes visuais pequenos que o Schev deixou "pra outro dia".
- FASE 7A — Mascotes SVG por tema/DLC. FASE 7B — Sons WebAudio (toggle off).
- FASE 10 — Login/nuvem (Supabase grátis) + backup entre dispositivos.
- FASE 11 — Assinatura (Stripe).
- Rename do repo p/ pontinhos-bigodinhos (AGUARDANDO AUTORIZAÇÃO).

## 9. ROTINA GIT/DEPLOY
git add -A → git commit -m "fase X: descrição" → git push (autorizado p/ Pages em 31/08/2026; rename NÃO) → aguardar 1–3 min → testar em https://lschev.github.io/palette-master/.
GitHub Pages: Settings → Pages → Deploy from a branch → main + / (root).

## 10. PRIMEIRA MENSAGEM DO CHAT NOVO
"Leia todo o conhecimento do projeto (HANDOFF.md). Continue do item mais baixo do backlog. Qwen escreve o código; entregue arquivos inteiros, nunca micro-patches."