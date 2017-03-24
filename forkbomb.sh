#!/usr/bin/env bash
MAXPOWER=${WCLI_MAXCLIENTS:-8}

mkdir -p $(pwd)/log

for i in $(seq 0 $MAXPOWER); do
	nohup node index.js > log/cliente_$i.log 2>&1 &
done