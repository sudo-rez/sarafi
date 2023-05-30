#!/bin/bash
rsync -avzuhm --delete-excluded --progress $GOPATH/src/company/bab/media/public/theme/ bab:/home/bab/www/bab/media/public/theme/
