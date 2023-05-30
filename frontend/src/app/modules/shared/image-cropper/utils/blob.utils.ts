export function base64ToFile(base64Image: string): Blob {
  const split = base64Image.split(',');
  const type = split[0].replace('data:', '').replace(';base64', '');
  const byteString = atob(split[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i += 1) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], {type});
}

export function imageFile(base64Image: string, filename: string) {

  const split = base64Image.split(',');
  const mime = split[0].match(/:(.*?);/)[1];
  const byteString = atob(split[1]);
  let n = byteString.length;
  let u8arr = new Uint8Array(n);

  while(n--){
    u8arr[n] = byteString.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}