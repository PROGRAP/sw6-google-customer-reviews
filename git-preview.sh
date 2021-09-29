#!/usr/bin/env bash

echo "updating repo..."
git fetch -p > /dev/null
git checkout master &> /dev/null
git reset --hard origin/master > /dev/null
git branch -vv | grep 'origin/.*: gone]' | awk '{print $1}' | xargs git branch -D &> /dev/null

BRANCHES=$(git branch -r --sort=committerdate | grep 'issues/')

echo "creating preview branch..."
git branch -f preview > /dev/null
git checkout preview &> /dev/null

while read -r ITEM; do
    echo "including $ITEM"

    git merge --no-ff $ITEM > /dev/null

    if [ $? -ne 0 ]
    then
        echo "faild to merge $ITEM!"
        echo "Canceling preview branch..."

        git checkout master &> /dev/null
        git branch -D preview &> /dev/null

        exit 1
    fi
done <<< "$BRANCHES"

if [[ "$(git submodule)" != "" ]]; then
    echo "creating preview of submodules..."

    create_preview=$(cat <<-END
        if [[ ! -f './git-preview.sh' ]]; then
            echo 'no preview script present!'
            echo ''
            exit 0
        fi

        ./git-preview.sh
        echo ''
END
)

    git submodule update
    echo ""
    git submodule foreach "bash \"$create_preview\" 2>&1 | sed 's/^/    /'"

    if [ $? -ne 0 ]; then
        exit 1
    fi

    submodule_paths=$(git config --file .gitmodules --get-regexp path | awk '{ print $2 }')

    for dir in $submodule_paths; do
        git add $dir
    done

    git commit -m "merge submodule state" &> /dev/null
fi

echo "an up to date preview is ready!"
