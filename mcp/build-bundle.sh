#!/bin/sh
set -eu
: "${1:?usage: sh mcp/build-bundle.sh /absolute/path/to/weydub-media.mcpb}"
case "$1" in /*) archive=$1 ;; *) exit 2 ;; esac
test ! -e "$archive"
root=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT
mkdir -p "$stage/mcp" "$stage/examples"
cp "$root/mcp/manifest.json" "$stage/"
cp "$root/mcp/server.mjs" "$root/mcp/package.json" "$root/mcp/package-lock.json" "$stage/mcp/"
cp "$root/examples/media.mjs" "$root/examples/Weydub.postman_collection.json" "$stage/examples/"
(cd "$stage/mcp" && npm ci --omit=dev --ignore-scripts --no-audit --no-fund)
# Test the staged files, not the developer's existing checkout.
cp "$root/mcp/check.mjs" "$stage/mcp/"
node "$stage/mcp/check.mjs"
(cd "$stage" && zip -Xqr "$archive" manifest.json mcp examples -x '*/.bin/*')
