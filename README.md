# 🐾 Pontinhos & Bigodinhos

Ateliê de cores para bordado: extraia a paleta de uma imagem, case com linhas DMC reais, salve em ninhos e exporte listas e moodboards.

🔗 **No ar:** https://lschev.github.io/pontinhos-bigodinhos/

## Features (v2.5)

- 4 abas: Extrator, Ateliê, Ninhos e Catálogo
- Temas pastel/dark com wallpapers, faixas de cabeçalho e mascotes próprios
- Extrator K-means + conta-gotas com lupa e seleção de área
- 489 linhas DMC reais + 35 cores Fofinho
- Harmonias: pastel, análoga, tríade e monocromática
- Bancada de trabalho: lista de compras DMC, simulador de pontos e moodboard
- Ninhos com paletas e projetos salvos no navegador (localStorage)

## Como rodar localmente

Rode `python -m http.server 5500` na pasta do projeto e abra http://localhost:5500

## Estrutura

- `index.html` | `style.css` | `data.js` | `app.js` — app 100% no navegador, sem backend
- `assets/` — wallpapers, faixas de cabeçalho e mascotes
- `core/`, `ui/`, `app.py` — legado Streamlit, mantido só como referência

Feito com 💜 para quem borda bonito.