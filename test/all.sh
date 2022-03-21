#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function all_tests () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local REPOPATH="$(readlink -m -- "$BASH_SOURCE"/../..)"
  cd -- "$REPOPATH" || return $?
  local REPOPATH_RGX="$(sed -re 's~[^A-Za-z0-9_/.-]~\\&~g' <<<"$REPOPATH")"

  echo -n 'Lint: '
  elp || return $?

  local ITEM=
  local FAILS=0
  for ITEM in docs/examples/*.devdock/test/composed.expected.yaml; do
    test_one_exdir "$ITEM" || (( FAILS += 1 ))
  done

  if [ "$FAILS" == 0 ]; then
    echo "D: All tests passed."
    return 0
  fi
  echo "E: $FAILS tests failed." >&2
  return 3
}


function test_one_exdir () {
  local EXPECTATION_FILE="$1"
  local EXAMPLE_DIR="${EXPECTATION_FILE%/test/*}"
  local PROJ_NAME="$(basename -- "$EXAMPLE_DIR" .devdock)"
  local RESULTS_BFN="$EXAMPLE_DIR"/tmp.test.composed
  echo -n "D: Test $EXAMPLE_DIR: "
  env \
    DEVDOCK_DIR="$EXAMPLE_DIR" \
    COMPOSE_PROJECT_NAME="$PROJ_NAME" \
    node -r 'devdock-recompose-pmb/src/cli.node.js' -e 0 \
    >"$RESULTS_BFN".yaml || return $?
  sed -re "s~$REPOPATH_RGX/~/…/~g" -i "$RESULTS_BFN".yaml || return $?

  diff -U 2 -- "$EXPECTATION_FILE" "$RESULTS_BFN".yaml >"$RESULTS_BFN".diff
  local RV="$?"
  if [ "$RV" == 0 ]; then
    echo 'pass.'
    rm -- "$RESULTS_BFN".{diff,yaml}
    return 0
  fi

  if [ -n "$CI" ]; then
    echo '----- 8< --== diff ==-- 8< ----- 8< ----- 8< -----'
    cat -- "$RESULTS_BFN".diff
    echo '----- >8 --== diff ==-- >8 ----- >8 ----- >8 -----'
  fi
  echo "E: Files $RESULTS_BFN.yaml and $EXPECTATION_FILE differ." >&2

  case ",$FX," in
    *,rex,* ) # Replace expectation file
      mv --verbose --no-target-directory \
        -- "$RESULTS_BFN".yaml "$EXPECTATION_FILE" || return $?
      ;;
  esac

  return 2
}










all_tests "$@"; exit $?
