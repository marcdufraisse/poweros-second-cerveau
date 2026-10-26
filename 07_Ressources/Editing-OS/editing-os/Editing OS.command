#!/bin/bash
# Lanceur double-cliquable du hub Editing OS (macOS).
# Démarre le serveur s'il ne tourne pas déjà, puis ouvre le hub dans Chrome.
# Laisser cette fenêtre de Terminal ouverte : c'est elle qui fait tourner le hub.
cd "$(dirname "$0")/.." || exit 1

PORT=4200
if curl -s -o /dev/null --max-time 2 "http://localhost:$PORT/api/state"; then
  echo "Le hub tourne déjà sur le port $PORT."
else
  echo "Démarrage du hub…"
  npm run os &
  for i in $(seq 1 40); do
    curl -s -o /dev/null --max-time 1 "http://localhost:$PORT/api/state" && break
    sleep 0.5
  done
fi

open "http://localhost:$PORT/"
echo
echo "Hub ouvert sur http://localhost:$PORT/"
echo "Ferme cette fenêtre pour arrêter le hub."
wait
