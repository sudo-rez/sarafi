#!/bin/bash  
server=0
user=root
mediaPath=""
serverPath=""
echo Enter Version : 
read version
echo 1:panel 2:gateway 
read type
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
fileName=payment-v$version.tar.xz
GOOS=linux GOARCH=amd64 go build -o payment
tar -czvf $fileName payment
rsync -avzh --progress $fileName $user@$server:$serverPath
rsync -avzh --progress $mediaPath $user@$server:$serverPath


ssh $user@$server "cd $serverPath; tar xvf $fileName;rm $fileName;chmod a+x payment;systemctl restart payment;systemctl restart panel"

rm $fileName
rm payment


