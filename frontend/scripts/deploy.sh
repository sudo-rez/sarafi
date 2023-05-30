#!/bin/bash
rsync -avzuhm --delete-excluded -L --exclude="*.less" --include='**/' --include='**/static/**' --include='**/template/**' --exclude='*' --progress $GOPATH/src/company/bab/media/backpanel/ bab:/home/bab/www/bab_test/media/backpanel/
# ssh -t bab cp -rf ./www/bab_test/media/backpanel ./www/bab/media/
ssh -t bab sudo service bab_test restart
