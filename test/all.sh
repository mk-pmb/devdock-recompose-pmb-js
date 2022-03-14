#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function all_tests () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local REPOPATH="$(readlink -m -- "$BASH_SOURCE"/../..)"
  cd -- "$REPOPATH" || return $?

  elp || return $?
  env \
    DEVDOCK_DIR='docs/examples/ex01.devdock' \
    COMPOSE_PROJECT_NAME='ex01' \
    node -r 'devdock-recompose-pmb/src/cli.node.js' -e 0 || return $?
}










all_tests "$@"; exit $?
