import json
from pathlib import Path

class PluginManager:
    """Gerencia o carregamento e validação de plugins de paletas (DLCs)."""

    def __init__(self):
        self.plugins: dict[str, dict] = {}
        self.errors: list[str] = []

    def load_plugins(self, plugins_dir: str | Path = "data/plugins") -> None:
        """Lê e valida todos os arquivos JSON no diretório de plugins."""
        base_dir = Path(__file__).resolve().parent.parent
        target_dir = base_dir / plugins_dir

        if not target_dir.exists():
            self.errors.append(f"Diretório não encontrado: {target_dir}")
            return

        for json_file in target_dir.glob("*.json"):
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    
                if self._validate_plugin(data, json_file.name):
                    self.plugins[data["niche_id"]] = data
            except json.JSONDecodeError:
                self.errors.append(f"Erro de sintaxe JSON no arquivo: {json_file.name}")
            except Exception as e:
                self.errors.append(f"Erro inesperado ao ler {json_file.name}: {e}")

    def _validate_plugin(self, data: dict, filename: str) -> bool:
        """Valida o schema obrigatório de um plugin."""
        required_keys = {"niche_id", "niche_name", "version", "colors"}
        if not required_keys.issubset(data.keys()):
            self.errors.append(f"[{filename}] Faltam chaves obrigatórias. Requerido: {required_keys}")
            return False
            
        if not isinstance(data["colors"], list) or not data["colors"]:
            self.errors.append(f"[{filename}] 'colors' deve ser uma lista não vazia.")
            return False

        for idx, color in enumerate(data["colors"]):
            color_keys = {"code", "name", "rgb"}
            if not color_keys.issubset(color.keys()):
                self.errors.append(f"[{filename}] Cor index {idx} sem chaves {color_keys}.")
                return False
                
            rgb = color["rgb"]
            if not isinstance(rgb, list) or len(rgb) != 3:
                self.errors.append(f"[{filename}] Cor '{color.get('code')}' rgb deve ser uma lista de 3 inteiros.")
                return False
                
            if not all(isinstance(v, int) and 0 <= v <= 255 for v in rgb):
                self.errors.append(f"[{filename}] Cor '{color.get('code')}' rgb possui valores fora de 0-255.")
                return False

        return True

    def list_plugins(self) -> list[dict]:
        """Retorna a lista resumida de plugins carregados."""
        return [
            {"niche_id": k, "niche_name": v["niche_name"]} 
            for k, v in self.plugins.items()
        ]

    def get_plugin(self, niche_id: str) -> dict | None:
        """Retorna os dados completos de um plugin específico."""
        return self.plugins.get(niche_id)