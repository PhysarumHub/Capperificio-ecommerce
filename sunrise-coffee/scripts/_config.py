"""
Configurazione condivisa per gli script di amministrazione Shopware.

Nessuno script deve contenere host o password in chiaro: i valori arrivano da
`scripts/.env` (escluso da git — vedi scripts/.env.example) e possono essere
sovrascritti da riga di comando con --base / --user / --pass.

Non esiste un default per la password: in passato gli script usavano
`--pass shopware` (la password di default di Shopware) come fallback, il che
significava che un'esecuzione distratta tentava comunque di autenticarsi con la
credenziale di default. Ora se manca la configurazione lo script si ferma.

Uso tipico:

    import sys, pathlib
    sys.path.insert(0, str(pathlib.Path(__file__).parent))
    from _config import shopware_config

    cfg = shopware_config()
    BASE, ADMIN_USER, ADMIN_PASS = cfg.api_base, cfg.user, cfg.password
"""

import os
import pathlib
import sys
from types import SimpleNamespace


def _load_env():
    """Carica scripts/.env nell'ambiente, senza sovrascrivere variabili già presenti."""
    env_path = pathlib.Path(__file__).parent / '.env'
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, _, v = line.partition('=')
            os.environ.setdefault(k.strip(), v.strip().strip('"\''))


_load_env()


def cli_args():
    """Argomenti nella forma `--chiave valore` (lo stile usato da questi script)."""
    return dict(zip(sys.argv[1::2], sys.argv[2::2]))


def shopware_config(require_access_key=False, api_suffix=True):
    """
    Risolve le credenziali Shopware con precedenza: CLI > scripts/.env > errore.

    api_suffix=True  → `api_base` termina con /api (Admin API, usata dalla maggior
                       parte degli script di setup/seed).
    api_suffix=False → `api_base` resta l'URL nudo (per chi compone i path a mano).
    """
    args = cli_args()

    base_raw = (args.get('--base') or os.environ.get('SHOPWARE_URL', '')).rstrip('/')
    user = args.get('--user') or os.environ.get('SHOPWARE_ADMIN_USER', 'admin')
    password = args.get('--pass') or os.environ.get('SHOPWARE_ADMIN_PASS', '')
    access_key = os.environ.get('VITE_SHOPWARE_ACCESS_KEY', '')

    if not base_raw:
        sys.exit(
            "❌  URL Shopware mancante.\n"
            "    Imposta SHOPWARE_URL in scripts/.env (vedi scripts/.env.example)\n"
            "    oppure passa --base http://127.0.0.1:8090"
        )
    if not password:
        sys.exit(
            "❌  Password admin Shopware mancante.\n"
            "    Imposta SHOPWARE_ADMIN_PASS in scripts/.env (vedi scripts/.env.example)\n"
            "    oppure passa --pass LA_TUA_PASSWORD"
        )
    if require_access_key and not access_key:
        sys.exit(
            "❌  VITE_SHOPWARE_ACCESS_KEY mancante in scripts/.env "
            "(Shopware Admin → Sales Channels → Headless → API Access)"
        )

    if api_suffix:
        api_base = base_raw if base_raw.endswith('/api') else base_raw + '/api'
    else:
        api_base = base_raw

    return SimpleNamespace(
        api_base=api_base,
        base_url=base_raw[:-4].rstrip('/') if base_raw.endswith('/api') else base_raw,
        user=user,
        password=password,
        access_key=access_key,
        args=args,
    )
