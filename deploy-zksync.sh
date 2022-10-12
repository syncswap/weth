#!/usr/bin/env bash

function bashcolor {
    if [ $2 ]; then
        echo -e "\e[$1;$2m"
    else
        echo -e "\e[$1m"
    fi
}

function bashcolorend {
    echo -e "\e[m"
}

skippedCompile=0

if [[ "$1" != "--skipCompile" ]]; then
    # Compile zkSync artifacts.
    echo "  "
    echo "  //////////////////////////////////////////////////"
    echo "  $(bashcolor 1 32)(1/4) Running$(bashcolorend) - Compile zkSync artifacts"
    echo "  //////////////////////////////////////////////////"
    echo "  "

    if [ -d "./artifacts-zk" ]; then
        rm -rf ./artifacts-zk
    fi
    if [ -d "./cache-zk" ]; then
        rm -rf ./cache-zk
    fi

    yarn hardhat compile --network zksync
  else
    skippedCompile=1
    echo "  "
    echo "  //////////////////////////////////////////////////"
    echo "  $(bashcolor 1 32)(1/4) Skipped$(bashcolorend) - Compile zkSync artifacts"
    echo "  //////////////////////////////////////////////////"
    echo "  "
fi

# Backup normal artifacts and replace with zkSync artifacts.
echo "  "
echo "  //////////////////////////////////////////////////"
echo "  $(bashcolor 1 32)(2/4) Running$(bashcolorend) - Move zkSync artifacts"
echo "  //////////////////////////////////////////////////"
echo "  "

if [ -d "./artifacts-backup" ]; then
  rm -rf ./artifacts-backup
fi
if [ -d "./cache-backup" ]; then
  rm -rf ./cache-backup
fi

if [ -d "./artifacts" ]; then
  mv ./artifacts ./artifacts-backup
fi
if [ -d "./cache" ]; then
  mv ./cache ./cache-backup
fi

if [[ ! -d "./artifacts-zk" || ! -d "./cache-zk" ]]; then
    echo "  "
    echo "  //////////////////////////////////////////////////"
    echo "  $(bashcolor 1 33)(2/4) Aborted$(bashcolorend) - Move zkSync artifacts"
    echo "  Not found zkSync artifacts, please compile it first."
    echo "  //////////////////////////////////////////////////"
    echo "  "
    exit 1
  else
    mv ./artifacts-zk ./artifacts
    mv ./cache-zk ./cache
fi

# Deploy into zkSync
# yarn hardhat deploy-zksync --script {name}.ts
echo "  "
echo "  //////////////////////////////////////////////////"
echo "  $(bashcolor 1 32)(3/4) Running$(bashcolorend) - Deploy zkSync artifacts"
echo "  //////////////////////////////////////////////////"

script=""
if [[ "$skippedCompile" == 0 && "$1" ]]; then
    script=$1
  else
    if [[ "$skippedCompile" == 1 && "$2" ]]; then
      script=$2
    fi
fi

if [[ ! -z "$script" ]]; then
    echo "  Use deploy script: $script"
    echo "  "
    yarn hardhat deploy-zksync --script "$script".ts
  else
    echo "  Use all deploy scripts."
    echo "  "
    yarn hardhat deploy-zksync
fi


# Rename artifacts back
echo "  "
echo "  //////////////////////////////////////////////////"
echo "  $(bashcolor 1 32)(4/4) Running$(bashcolorend) - Restore artifact files"
echo "  //////////////////////////////////////////////////"
echo "  "
mv ./artifacts ./artifacts-zk
mv ./cache ./cache-zk

if [ -d "./artifacts-backup" ]; then
  mv ./artifacts-backup ./artifacts
fi
if [ -d "./cache-backup" ]; then
  mv ./cache-backup ./cache
fi

echo "  "
echo "  //////////////////////////////////////////////////"
echo "  $(bashcolor 1 32)(4/4) Success$(bashcolorend) - zkSync artifacts deployed successfully."
echo "  //////////////////////////////////////////////////"
echo "  "