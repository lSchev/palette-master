import json
from pathlib import Path

def generate_mock_plugin() -> None:
    """Gera um plugin JSON (tintas_demo.json) com dados fictícios para testes."""
    base_dir = Path(__file__).resolve().parent.parent
    plugins_dir = base_dir / "data" / "plugins"
    plugins_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = plugins_dir / "tintas_demo.json"
    
    plugin_data = {
        "niche_id": "tintas_demo",
        "niche_name": "Tintas - Linha Premium",
        "version": "1.0",
        "icon": "🖌️",
        "colors": [
            {"code": "T-101", "name": "Branco Neve", "rgb": [250, 250, 250]},
            {"code": "T-102", "name": "Cinza Asfalto", "rgb": [128, 128, 128]},
            {"code": "T-103", "name": "Vermelho Paixão", "rgb": [200, 30, 30]},
            {"code": "T-104", "name": "Azul Oceano", "rgb": [20, 80, 180]},
            {"code": "T-105", "name": "Verde Floresta", "rgb": [34, 139, 34]},
            {"code": "T-106", "name": "Amarelo Canário", "rgb": [255, 255, 0]},
            {"code": "T-107", "name": "Preto Absoluto", "rgb": [15, 15, 15]},
            {"code": "T-108", "name": "Bege Areia", "rgb": [215, 205, 180]},
            {"code": "T-109", "name": "Rosa Choque", "rgb": [255, 105, 180]},
            {"code": "T-110", "name": "Roxo Majestade", "rgb": [128, 0, 128]},
            {"code": "T-111", "name": "Laranja Fogo", "rgb": [255, 140, 0]},
            {"code": "T-112", "name": "Marrom Terra", "rgb": [139, 69, 19]}
        ]
    }
    
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(plugin_data, f, indent=2, ensure_ascii=False)
        
    print("Plugin tintas_demo.json gerado com sucesso.")

if __name__ == "__main__":
    generate_mock_plugin()