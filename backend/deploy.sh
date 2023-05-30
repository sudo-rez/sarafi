#!/bin/bash  
server=0
user=root
mediaPath=""
echo Enter Version : 
read version
echo 1:panel 2:gateway 
read type
case $type in
    1)
        server=164.90.179.177
        mediaPath=./dist
    ;;
    2)
        server=165.232.67.106
        mediaPath=./media
    ;;
esac
fileName=payment-v$version.tar.xz
GOOS=linux GOARCH=amd64 go build 
tar -czvf $fileName payment
rsync -avzh --progress $fileName $user@$server:/opt/payment
rsync -avzh --progress $mediaPath $user@$server:/opt/payment


ssh $user@$server "cd /opt/payment; tar xvf $fileName;rm $fileName;chmod a+x payment;systemctl restart payment;"


