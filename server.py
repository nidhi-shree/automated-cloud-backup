import json
import logging
import subprocess
import sys
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory

from backup_to_b2 import backup_site_to_b2


ROOT = Path(__file__).resolve().parent
SITE_DIR = ROOT / "docs"
CONTENT_PATH = SITE_DIR / "data" / "content.json"

load_dotenv(override=False)

app = Flask(__name__, static_url_path="", static_folder=str(SITE_DIR))


def run_script(script_name: str):
    """Execute a Python script and return (ok, message)."""
    try:
        completed = subprocess.run(
            [sys.executable, str(ROOT / script_name)],
            capture_output=True,
            text=True,
            check=True,
        )
        output = (
            completed.stdout.strip()
            or completed.stderr.strip()
            or "Operation completed."
        )
        return True, output
    except subprocess.CalledProcessError as exc:
        err = exc.stderr.strip() or exc.stdout.strip() or "Unknown error."
        return False, err


@app.route("/")
def root():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)


@app.post("/save-content")
def save_content():
    if not request.is_json:
        return jsonify({"status": "error", "message": "Expected JSON body"}), 400
    data = request.get_json()
    if not isinstance(data, dict):
        return jsonify({"status": "error", "message": "Payload must be JSON object"}), 400

    try:
        CONTENT_PATH.parent.mkdir(parents=True, exist_ok=True)
        with CONTENT_PATH.open("w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as exc:  # pragma: no cover - defensive
        return jsonify({"status": "error", "message": f"Failed to write file: {exc}"}), 500

    try:
        files_uploaded = backup_site_to_b2(load_env_vars=False)
        message = "Changes saved and backed up to cloud successfully!"
        if files_uploaded == 0:
            message += " (No files changed since last backup.)"
        return jsonify({"status": "success", "message": message})
    except Exception as exc:
        logging.exception("Automatic backup failed after saving content.json")
        return (
            jsonify(
                {
                    "status": "error",
                    "message": f"Content saved locally, but automatic backup failed: {exc}",
                }
            ),
            500,
        )


@app.post("/backup")
def trigger_backup():
    ok, message = run_script("backup_to_b2.py")
    status = "success" if ok else "error"
    return jsonify({"status": status, "message": message}), (200 if ok else 500)


@app.post("/restore")
def trigger_restore():
    ok, message = run_script("restore_from_b2.py")
    status = "success" if ok else "error"
    return jsonify({"status": status, "message": message}), (200 if ok else 500)


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)



