import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {pipeline,RawImage,env} from '@huggingface/transformers';
import {MODEL,LABELS,verdict} from './rules.mjs';
const output='Enamiran/visual-categories.json';
let index;try{index=JSON.parse(readFileSync(output,'utf8'));}catch{index={version:1,model:MODEL,items:{},failures:{}};}
if(index.model!==MODEL)throw Error('Unexpected cached model');
index.failures??={};
env.cacheDir='.cache/enamiran-clip';
const base='https://enamiran-uae.rubyrat64.chatgpt.site';
const deadline=Date.now()+14*60*1000;
async function json(path){const r=await fetch(base+path,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('Catalogue HTTP '+r.status);return r.json();}
const stores=await json('/api/stores');
// Rotate the first retailer every run, so a slow store cannot starve others.
const offset=Math.floor(Date.now()/21600000)%stores.length;
const ordered=[...stores.slice(offset),...stores.slice(0,offset)];
const candidates=new Map();
const batchLimit=Object.keys(index.items).length?1200:120;
for(let page=0;page<100&&Date.now()<deadline-180000;page++){
 let more=false;
 for(const store of ordered){for(const gender of ['Female','Male']){
  if(Date.now()>=deadline-180000)break;
  try{const data=await json('/api/backup-search?'+new URLSearchParams({store:store.id,q:'fashion',gender,page}));more||=Boolean(data.hasMore);
   for(const p of data.products||[]){const image=p.imageURLs?.[0];if(!image||!/^https:\/\//.test(image))continue;const old=index.items[p.productURL],failed=index.failures[p.productURL];if(old?.image===image||failed?.image===image&&Date.now()-failed.at<7*86400000)continue;candidates.set(p.productURL,p);}
  }catch(e){console.log('Catalogue unavailable:',store.id,e.message);}
 }if(candidates.size>=batchLimit||Date.now()>=deadline-180000)break;}
 if(!more||candidates.size>=batchLimit)break;
}
console.log('Unscanned photos found:',candidates.size);
if(candidates.size){
 const classify=await pipeline('zero-shot-image-classification',MODEL,{dtype:'q8',device:'cpu'});
 const names=Object.keys(LABELS),prompts=Object.values(LABELS);
 let scanned=0;
 function save(){index.updatedAt=new Date().toISOString();mkdirSync('Enamiran',{recursive:true});writeFileSync(output,JSON.stringify(index));}
 for(const p of candidates.values()){
  if(Date.now()>=deadline)break;
  const image=p.imageURLs[0];
  try{
   const response=await fetch(image,{signal:AbortSignal.timeout(12000),headers:{'User-Agent':'Enamiran catalogue image classifier'}});
   if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw Error('Image not readable');
   if(Number(response.headers.get('content-length'))>6000000)throw Error('Image too large');
   const reader=response.body.getReader(),chunks=[];let size=0;
   while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>6000000){await reader.cancel();throw Error('Image too large');}chunks.push(value);}
   const decoded=await RawImage.fromBlob(new Blob(chunks,{type:response.headers.get('content-type')}));
   const result=await classify(decoded,prompts,{hypothesis_template:'A product photo of {}.'});
   const scores=Object.fromEntries(result.map(r=>[names[prompts.indexOf(r.label)],r.score]));
   if(names.some(n=>!Number.isFinite(scores[n])))throw Error('Incomplete classifier output');
   index.items[p.productURL]=verdict(scores,image);delete index.failures[p.productURL];scanned++;
   if(scanned%20===0)save();
  }catch(e){index.failures[p.productURL]={image,at:Date.now()};console.log('Skipped unreadable photo:',p.storeID,e.message);}
 }
 save();console.log('Photos classified this run:',scanned,'Total:',Object.keys(index.items).length);
 if(!scanned)throw Error('No photos classified; inspect image/model errors');
}
