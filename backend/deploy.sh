#!/bin/bash  
server=0
user=root
mediaPath=""
serverPath=""
command="" 
echo Enter Version : 
read version
echo 1:panel 2:gateway 
read type
echo Backend [Y/n]:
read backend
echo UI [Y/n]:
read ui 
case $type in
    1)
        server=165.232.67.106
        mediaPath=./dist
        serverPath=/opt/panel
    ;;
    2)
        server=165.232.67.106
        mediaPath=./media
        serverPath=/opt/payment
    ;;
esac
if [ $backend != 'n' ]
then
fileName=payment-v$version.tar.xz
command="cd $serverPath; tar xvf $fileName;rm $fileName;chmod a+x payment;"
GOOS=linux GOARCH=amd64 go build -o payment
tar -czvf $fileName payment
rsync -avzh --progress $fileName $user@$server:$serverPath
fi
if [ $ui != 'n' ]
then 
rsync -avzh --progress $mediaPath $user@$server:$serverPath
fi

ssh $user@$server "$command systemctl restart payment;systemctl restart panel"

if [  $backend != 'n' ]
then 
rm $fileName
rm payment
fi

