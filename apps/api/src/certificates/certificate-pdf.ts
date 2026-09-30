import {PDFDocument,rgb} from 'pdf-lib';
import * as fontkit from '@pdf-lib/fontkit';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {BadRequestException} from '@nestjs/common';
export async function certificatePdf(input:{name:string;course:string;number:string;code:string;issuedAt:Date;verificationUrl:string}) {
 const doc=await PDFDocument.create();const page=doc.addPage([842,595]);
 doc.registerFontkit(fontkit);
 const regular=await doc.embedFont(await readFile(join(__dirname,'../../assets/NotoSans-Regular.ttf')),{subset:true});
 const bold=regular;
 const supportedCharacters=new Set(regular.getCharacterSet());
 const ink=rgb(.08,.2,.18);const gold=rgb(.66,.48,.2);
 page.drawRectangle({x:22,y:22,width:798,height:551,borderWidth:2,borderColor:gold});
 page.drawRectangle({x:32,y:32,width:778,height:531,borderWidth:.5,borderColor:gold});
 function centered(text:string,y:number,size:number,strong=false,maxLines=1){
  const font=strong?bold:regular;
  if(Array.from(text).some(c=>! /\s/.test(c)&&!supportedCharacters.has(c.codePointAt(0)!))) throw new BadRequestException('This certificate contains characters not supported by the certificate font. Please contact support.');
  const supported=text;
  const wrap=()=>{const lines:string[]=[];let line='';for(const word of supported.trim().split(/\s+/)){if(font.widthOfTextAtSize((line?line+' ':'')+word,size)>690&&line){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);return lines;};
  let lines=wrap();
  while(size>8&&(lines.length>maxLines||lines.some(line=>font.widthOfTextAtSize(line,size)>690))){size-=.5;lines=wrap();}
  if(lines.length>maxLines||lines.some(line=>font.widthOfTextAtSize(line,size)>690))throw new BadRequestException('The certificate text is too long to fit. Please contact support.');
  for(const [i,value] of lines.entries()){page.drawText(value,{x:(842-font.widthOfTextAtSize(value,size))/2,y:y-i*(size+7),size,font,color:ink});}
  return y-lines.length*(size+7);
 }
 centered('TRANSLINGUAL',515,17,true);centered('CERTIFICATE OF COMPLETION',455,28,true);
 centered('This certifies that',405,13);
 centered(input.name,369,25,true,2);
 centered('has completed the required lessons and assessments for',297,12);
 centered(input.course,262,20,true,3);
 centered('Issued '+input.issuedAt.toISOString().slice(0,10)+' | '+input.number,145,11);
 centered('Verification code: '+input.code,113,10);
 centered(new URL(input.verificationUrl).origin+'/certificates/verify',83,9);
 doc.setTitle('Certificate - '+input.course);doc.setAuthor('Translingual');
 return Buffer.from(await doc.save());
}
