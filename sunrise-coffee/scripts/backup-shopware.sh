#!/usr/bin/env bash
# ============================================================
#  backup-shopware.sh
#  Backup completo di Shopware (DB + media + plugin)
#
#  Uso:
#    bash scripts/backup-shopware.sh
#    bash scripts/backup-shopware.sh --keep 5   # mantieni ultimi 5 backup
#
#  Il backup viene salvato in:  backups/shopware_YYYY-MM-DD_HH-MM-SS/
# ============================================================

set -euo pipefail

# ── Configurazione ────────────────────────────────────────────
CONTAINER="capperificio-shopware"
DB_NAME="shopware"
DB_USER="root"
DB_PASS="root"          # password default dockware
BACKUP_DIR="$(dirname "$0")/../backups"
KEEP_LAST=${KEEP_LAST:-7}   # quanti backup conservare (default 7)

# ── Parsing argomenti ─────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --keep) KEEP_LAST="$2"; shift 2 ;;
    *) echo "Argomento non riconosciuto: $1"; exit 1 ;;
  esac
done

# ── Colori ────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}[✓]${NC} $*"; }
warning() { echo -e "${YELLOW}[!]${NC} $*"; }
error()   { echo -e "${RED}[✗]${NC} $*" >&2; exit 1; }

# ── Controllo prerequisiti ────────────────────────────────────
command -v docker &>/dev/null || error "Docker non trovato nel PATH"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  error "Container '${CONTAINER}' non in esecuzione. Avvialo con: docker compose up -d"
fi

# ── Crea directory di backup ──────────────────────────────────
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
DEST="${BACKUP_DIR}/shopware_${TIMESTAMP}"
mkdir -p "${DEST}"
info "Backup in corso → ${DEST}"

# ── 1. Dump database MySQL ────────────────────────────────────
echo ""
echo "  [1/3] Dump database MySQL..."
docker exec "${CONTAINER}" \
  mysqldump \
    -u"${DB_USER}" \
    -p"${DB_PASS}" \
    --single-transaction \
    --routines \
    --triggers \
    "${DB_NAME}" \
  > "${DEST}/database.sql"

# Comprimi il dump
gzip "${DEST}/database.sql"
info "Database → ${DEST}/database.sql.gz ($(du -sh "${DEST}/database.sql.gz" | cut -f1))"

# ── 2. Media files (immagini prodotti) ────────────────────────
echo ""
echo "  [2/3] Copia media files..."
docker cp "${CONTAINER}:/var/www/html/public/media" "${DEST}/media" 2>/dev/null \
  && info "Media → ${DEST}/media/ ($(du -sh "${DEST}/media" | cut -f1))" \
  || warning "Cartella media non trovata (skip)"

docker cp "${CONTAINER}:/var/www/html/public/thumbnail" "${DEST}/thumbnail" 2>/dev/null \
  && info "Thumbnail → ${DEST}/thumbnail/ ($(du -sh "${DEST}/thumbnail" | cut -f1))" \
  || warning "Cartella thumbnail non trovata (skip)"

# ── 3. Plugin custom ──────────────────────────────────────────
echo ""
echo "  [3/3] Copia plugin custom..."
docker cp "${CONTAINER}:/var/www/html/custom/plugins" "${DEST}/plugins" 2>/dev/null \
  && info "Plugin → ${DEST}/plugins/ ($(du -sh "${DEST}/plugins" | cut -f1))" \
  || warning "Cartella plugins non trovata (skip)"

# ── Crea archivio .tar.gz finale ──────────────────────────────
echo ""
echo "  Creazione archivio compresso..."
ARCHIVE="${BACKUP_DIR}/shopware_${TIMESTAMP}.tar.gz"
tar -czf "${ARCHIVE}" -C "${BACKUP_DIR}" "shopware_${TIMESTAMP}"
rm -rf "${DEST}"   # rimuove la cartella temporanea
info "Archivio → ${ARCHIVE} ($(du -sh "${ARCHIVE}" | cut -f1))"

# ── Pulizia backup vecchi ─────────────────────────────────────
echo ""
EXISTING=$(ls -t "${BACKUP_DIR}"/shopware_*.tar.gz 2>/dev/null | wc -l)
if [[ ${EXISTING} -gt ${KEEP_LAST} ]]; then
  TO_DELETE=$(ls -t "${BACKUP_DIR}"/shopware_*.tar.gz | tail -n +$((KEEP_LAST + 1)))
  echo "  Rimuovo backup vecchi (mantengo ultimi ${KEEP_LAST})..."
  echo "${TO_DELETE}" | xargs rm -f
  warning "Rimossi: $(echo "${TO_DELETE}" | wc -l) backup vecchi"
fi

# ── Riepilogo ─────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
info "Backup completato: shopware_${TIMESTAMP}.tar.gz"
echo "  Backup disponibili: $(ls "${BACKUP_DIR}"/shopware_*.tar.gz 2>/dev/null | wc -l)"
echo "════════════════════════════════════════"
