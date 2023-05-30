#!/bin/bash
RED='\e[0;31m'
GREEN='\e[0;32m'
BLUE='\e[1;34m'
END='\e[0m'

pass() {
    if [ $1 -eq 0 ]; then
        echo -e ${GREEN} ${END} ${BLUE}$2${END}
    else
        echo -e ${RED} ${END} ${BLUE}$2${END}
        exit
    fi
}

cmds=(
    "npm run build"
    "mv ./dist/*.* ./dist/static/"
    "mkdir ./dist/template/"
    "mv ./dist/static/index.html ./dist/template/"
    "rm -rf ./panel/"
    "mv ./dist ./panel"
    "cd ./"
    "rm *.tar.xz"
    'tar -cvJf "club-panel_$(date '+%Y%m%d%H%M').tar.xz" ./panel/'
)

for i in ${!cmds[*]}; do
    cmd=${cmds[$i]}
    eval $cmd
    pass $? "$cmd"
done

echo -e "\n${GREEN}⇨ Proccess complete.${END}\n";
