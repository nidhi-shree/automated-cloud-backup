import logging
import mimetypes
import os
import sys
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from b2sdk.v2 import InMemoryAccountInfo, B2Api, UploadSourceLocalFile


def configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )


def load_env() -> None:
    # Load variables from .env into environment
    load_dotenv(override=False)


def get_env(name: str, default: Optional[str] = None, required: bool = False) -> Optional[str]:
    value = os.getenv(name, default)
    if required and (value is None or str(value).strip() == ""):
        logging.error("Missing required environment variable: %s", name)
        sys.exit(2)
    return value


def init_b2(app_key_id: Optional[str] = None, app_key: Optional[str] = None) -> B2Api:
    app_key_id = app_key_id or os.getenv("B2_APPLICATION_KEY_ID")
    app_key = app_key or os.getenv("B2_APPLICATION_KEY")
    if not app_key_id:
        raise ValueError("B2_APPLICATION_KEY_ID is not set.")
    if not app_key:
        raise ValueError("B2_APPLICATION_KEY is not set.")
    info = InMemoryAccountInfo()
    b2_api = B2Api(info)
    logging.info("Authorizing against Backblaze B2...")
    b2_api.authorize_account("production", app_key_id, app_key)
    logging.info("Authorization successful.")
    return b2_api


def ensure_bucket(b2_api: B2Api, bucket_name: str):
    try:
        bucket = b2_api.get_bucket_by_name(bucket_name)
        if bucket is None:
            raise RuntimeError(f"Bucket '{bucket_name}' not found. Create it in Backblaze first.")
        return bucket
    except Exception as exc:
        logging.exception("Failed to get bucket '%s': %s", bucket_name, exc)
        raise


def guess_content_type(path: Path) -> Optional[str]:
    ctype, _ = mimetypes.guess_type(str(path))
    return ctype


def upload_directory_to_b2(site_dir: Path, bucket, prefix: str) -> None:
    total_files = 0
    for root, _, files in os.walk(site_dir):
        for filename in files:
            local_path = Path(root) / filename
            rel_path = local_path.relative_to(site_dir).as_posix()
            b2_name = f"{prefix}/{rel_path}".replace("\\", "/")
            content_type = guess_content_type(local_path)
            try:
                total_files += 1
                logging.info("Uploading %s -> b2://%s/%s", local_path, bucket.name, b2_name)
                bucket.upload(
                    UploadSourceLocalFile(local_path),
                    file_name=b2_name,
                    content_type=content_type,
                )
            except Exception as exc:
                logging.error("Upload failed for %s: %s", local_path, exc)
                raise
    if total_files == 0:
        logging.warning("No files found in %s to upload.", site_dir)
    else:
        logging.info("Upload complete. %d files uploaded.", total_files)
    return total_files


def backup_site_to_b2(*, load_env_vars: bool = True) -> int:
    """
    Perform the site backup to Backblaze B2.

    Returns the number of files uploaded.
    """
    if load_env_vars:
        load_env()

    site_dir = Path(os.getenv("SITE_DIR", "site"))
    if not site_dir.exists() or not site_dir.is_dir():
        raise FileNotFoundError(f"Site directory '{site_dir}' does not exist.")

    bucket_name = os.getenv("B2_BUCKET_NAME")
    if not bucket_name:
        raise ValueError("B2_BUCKET_NAME is not set.")

    prefix = os.getenv("B2_PREFIX", "site")

    b2_api = init_b2()
    bucket = ensure_bucket(b2_api, bucket_name)
    return upload_directory_to_b2(site_dir, bucket, prefix)


def main() -> None:
    configure_logging()
    try:
        files_uploaded = backup_site_to_b2(load_env_vars=True)
        logging.info("Backup finished. %d files uploaded.", files_uploaded)
    except FileNotFoundError as exc:
        logging.error("%s", exc)
        sys.exit(2)
    except ValueError as exc:
        logging.error("%s", exc)
        sys.exit(2)
    except Exception as exc:
        logging.exception("Backup failed: %s", exc)
        sys.exit(1)


if __name__ == "__main__":
    main()

