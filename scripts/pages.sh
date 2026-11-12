#!/usr/bin/env bash
# Flip the public test page on and off (GitHub Pages mirror).
#
#   scripts/pages.sh on      sync the mirror and deploy the page
#   scripts/pages.sh off     take the page down (repo and history stay)
#   scripts/pages.sh status  where is the page right now
#
# OFF is immediate at the origin; URLs people already visited may linger in
# the GitHub CDN cache for up to 10 minutes (its max-age) before they 404.
#
# The mirror is the public repo the page deploys from; the private origin
# keeps being the working repository. Override with PAGES_MIRROR=owner/name.
set -euo pipefail

REPO="${PAGES_MIRROR:-layzyoldman/webpage-test}"
SITE="https://${REPO%%/*}.github.io/${REPO#*/}/"

# Run gh as the mirror's owner: the active gh account may be a read-only
# collaborator, and the Pages endpoints 404 without write access.
if OWNER_TOKEN="$(gh auth token -u "${REPO%%/*}" 2>/dev/null)"; then
  export GH_TOKEN="$OWNER_TOKEN"
fi

case "${1:-status}" in
  on)
    # The repo's mainline is `dev` (there is no local `master` branch any
    # more); the mirror keeps its own `master` as the deploy ref, which is
    # what deploy.yml listens for. Override with PAGES_SOURCE=branch.
    git push mirror "${PAGES_SOURCE:-dev}:master"
    if gh api "repos/$REPO/pages" -q .html_url >/dev/null 2>&1; then
      echo "pages: already enabled"
    else
      gh api "repos/$REPO/pages" -X POST -f build_type=workflow -q .html_url
    fi
    gh workflow run deploy.yml -R "$REPO"
    echo "deploying → ${SITE}pt/  (gh run list -R $REPO to watch)"
    ;;
  off)
    gh api "repos/$REPO/pages" -X DELETE
    echo "page is off — ${SITE} now 404s. Turn it back with: scripts/pages.sh on"
    ;;
  status)
    gh api "repos/$REPO/pages" -q .html_url 2>/dev/null || echo "page is off"
    gh run list -R "$REPO" --workflow deploy.yml --limit 1
    ;;
  *)
    echo "usage: $0 on|off|status" >&2
    exit 2
    ;;
esac
