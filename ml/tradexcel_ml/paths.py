from pathlib import Path

ML_ROOT = Path(__file__).resolve().parent.parent
REPO_ROOT = ML_ROOT.parent
EXPORT_PATH = ML_ROOT / "data" / "kb_export.json"
CONFIG_DIR = ML_ROOT / "config"
REPORTS_DIR = ML_ROOT / "reports"
ARTIFACTS_DIR = ML_ROOT / "artifacts"
