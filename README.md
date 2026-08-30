# 🎨 Palette Master

App web que extrai paleta de cores de imagens (seleção de área com 1 clique) e sugere correspondências em catálogos JSON por nicho (bordado, tintas etc.) com nível de confiança.

## Features
- Plugins modulares (DLCs) em `data/plugins/`
- 3 temas visuais com detecção do navegador e memória por localStorage
- Seleção de área com 1 clique (tamanhos P/M/G)
- Matching RGB por distância euclidiana com % de confiança
- Buscador de paletas por tom (catálogo ativo)
- Grupos salvos com persistência no navegador

## Como rodar localmente
pip install -r requirements.txt
streamlit run app.py