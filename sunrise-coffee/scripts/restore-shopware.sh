#!/usr/bin/env bash
# ============================================================
#  restore-shopware.sh
#  Ripristina un backup Shopware creato da backup-shopware.sh
#
#  Uso:
#    bash scripts/restore-shopware.sh backups/shopware_2025-01-01_12-00-00.tar.gz
#
#  ATTENZIONE: sovrascrive il database e i file attuali!
# ============================================================

set -euo pipefail

# ── Configurazione ────────────────────────────────────────────
CONTAINER="capperificio-shopware"
DB_NAME="shopware"
DB_USER="root"
DB_PASS="root"

# ── Colori ────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}[✓]${NC} $*"; }
warning() { echo -e "${YELLOW}[!]${NC} $*"; }
error()   { echo -e "${RED}[✗]${NC} $*" >&2; exit 1; }

# ── Argomenti ─────────────────────────────────────────────────
ARCHIVE="${1:-}"
[[ -z "${ARCHIVE}" ]] && {
  echo "Uso: bash scripts/restore-shopware.sh <archivio.tar.gz>"
  echo ""
  echo "Backup disponibili:"
  ls -lh backups/shopware_*.tar.gz 2>/dev/null || echo "  (nessun backup trovato in backups/)"
  exit 1
}
[[ -f "${ARCHIVE}" ]] || error "File non trovato: ${ARCHIVE}"

# ── Conferma ─────────────────────────────────────────────────
echo ""
warning "ATTENZIONE: il restore sovrascriverà il database e i media attuali!"
echo "  Archivio: ${ARCHIVE}"
echo ""
read -r -p "Continuare? (digita 'si' per confermare): " CONFIRM
[[ "${CONFIRM}" == "si" ]] || { echo "Operazione annullata."; exit 0; }

# ── Controlli ─────────────────────────────────────────────────
command -v docker &>/dev/null || error "Docker non trovato nel PATH"
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  error "Container '${CONTAINER}' non in esecuzione. Avvialo con: docker compose up -d"
fi

# ── Estrai archivio ───────────────────────────────────────────
WORK_DIR=$(mktemp -d)
trap 'rm -rf "${WORK_DIR}"' EXIT

echo ""
echo "  Estrazione archivio..."
tar -xzf "${ARCHIVE}" -C "${WORK_DIR}"
BACKUP_FOLDER=$(ls "${WORK_DIR}")
BACKUP_PATH="${WORK_DIR}/${BACKUP_FOLDER}"
info "Estratto in: ${BACKUP_PATH}"

# ── 1. Restore database ───────────────────────────────────────
echo ""
echo "  [1/3] Restore database MySQL..."
if [[ -f "${BACKUP_PATH}/database.sql.gz" ]]; then
  gunzip -c "${BACKUP_PATH}/database.sql.gz" | \
    docker exec -i "${CONTAINER}" \
      mysql -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}"
  info "Database ripristinato"
else
  warning "database.sql.gz non trovato nel backup (skip)"
fi

# ── 2. Restore media ──────────────────────────────────────────
echo ""
echo "  [2/3] Restore media files..."
if [[ -d "${BACKUP_PATH}/media" ]]; then
  docker exec "${CONTAINER}" rm -rf /var/www/html/public/media
  docker cp "${BACKUP_PATH}/media" "${CONTAINER}:/var/www/html/public/media"
  info "Media ripristinati"
else
  warning "Cartella media non trovata nel backup (skip)"
fi

if [[ -d "${BACKUP_PATH}/thumbnail" ]]; then
  docker exec "${CONTAINER}" rm -rf /var/www/html/public/thumbnail
  docker cp "${BACKUP_PATH}/thumbnail" "${CONTAINER}:/var/www/html/public/thumbnail"
  info "Thumbnail ripristinati"
else
  warning "Cartella thumbnail non trovata nel backup (skip)"
fi

# ── 3. Restore plugin ─────────────────────────────────────────
echo ""
echo "  [3/3] Restore plugin custom..."
if [[ -d "${BACKUP_PATH}/plugins" ]]; then
  docker exec "${CONTAINER}" rm -rf /var/www/html/custom/plugins
  docker cp "${BACKUP_PATH}/plugins" "${CONTAINER}:/var/www/html/custom/plugins"
  docker exec "${CONTAINER}" bash -c "cd /var/www/html && php bin/console plugin:refresh 2>/dev/null || true"
  info "Plugin ripristinati"
else
  warning "Cartella plugins non trovata nel backup (skip)"
fi

# ── Pulizia cache Shopware ────────────────────────────────────
echo ""
echo "  Pulizia cache Shopware..."
docker exec "${CONTAINER}" bash -c "cd /var/www/html && php bin/console cache:clear 2>/dev/null || true"
info "Cache pulita"

# ── Fine ──────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
info "Restore completato da: $(basename "${ARCHIVE}")"
echo "  Shopware disponibile su: http://localhost:8090"
echo "════════════════════════════════════════"
