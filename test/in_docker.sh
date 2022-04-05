#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function indk_main () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local REPOPATH="$(readlink -m -- "$BASH_SOURCE"/../..)"
  cd -- "$REPOPATH" || return $?

  local TASK="$1"; shift
  indk_"${TASK:-run}" "$@" || return $?
}


function indk_run () {
  local CTNR_NAME="test_${REPOPATH##*/}"-$$
  echo "D: container name: $CTNR_NAME"
  local DK=(
    docker
    run
    --rm
    # --tty
    --interactive
    --name "$CTNR_NAME"
    --volume "$PWD:/orig-repo:ro"
    --env NPMRC_ADD
    )

  local DK0_IP="$(ip a show docker0 | grep -m 1 -oPe '^\s+inet\s+[\d\.]+')"
  DK0_IP="${DK0_IP##* }"
  [ -n "$DK0_IP" ] && DK+=( --add-host "docker0.local:$DK0_IP" )

  indk_add_userhome_resource .node_modules || return $?

  DK+=(
    node:16
    /orig-repo/test/in_docker.sh unfold
    )
  exec &> >(LANG=C ts -s | tee -- test/tmp."$CTNR_NAME".log)
  "${DK[@]}" || return $?$(echo "E: docker failed: rv=$?" >&2)
}


function indk_add_userhome_resource () {
  [ -d "$HOME/$1" ] && DK+=( --volume "$HOME/$1:/root/$1:ro" )
}


function indk_unfold () {
  exec </dev/null

  sed -re 's~^\s+~~' <<<'
    ; -*- coding: utf-8, tab-width: 4 -*-
    color = false
    progress = false
    registry        = https://registry.npmjs.org/
    send-metrics    = false
    package-lock    = false
    update-notifier = false
    ignore-scripts  = false
    prefer-offline  = true
    fetch-timeout          = '10'000
    fetch-retry-mintimeout = '5'000
    fetch-retry-maxtimeout = '10'000

    '"$NPMRC_ADD" >"$HOME"/.npmrc

  git config init.defaultbranch 'master'
  git config user.name 'User Name'
  git config user.email 'user@host.tld'

  git clone /orig-repo /app || return $?
  cd /app || return $?

  CI=true npm install --verbose . &
  local NPM_PID="$!"

  while kill -0 "$NPM_PID" &>/dev/null; do
    echo "# npm pid $NPM_PID is still alive."
    sleep 5s
  done
  wait "$NPM_PID"

  npm test
  npm audit --verbose
}










indk_main "$@"; exit $?
