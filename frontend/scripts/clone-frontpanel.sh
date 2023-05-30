#!/bin/bash
rsync -avzuhm --exclude ".git*" --progress bab:/home/bab/www/bab/media/frontpanel/ $GOPATH/src/company/bab/media/frontpanel/
rsync -avzuhm --delete-excluded --progress bab:/home/bab/www/bab/media/public/theme/ $GOPATH/src/company/bab/media/public/theme/
