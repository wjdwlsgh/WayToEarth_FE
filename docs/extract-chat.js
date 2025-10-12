const fs=require('fs');
const o=JSON.parse(fs.readFileSync('docs/openapi.json','utf8'));
const out=[];
for (const [p, pathObj] of Object.entries(o.paths||{})){
  for (const [m, op] of Object.entries(pathObj||{})){
    if (!op || typeof op!=='object') continue;
    const tags=(op.tags||[]).filter(Boolean);
    if (tags.includes('크루 채팅')){
      out.push({path:p, method:m.toUpperCase(), summary:op.summary, description: String(op.description||''), params:(op.parameters||[]).map(x=>x.name), hasBody:Boolean(op.requestBody)});
    }
  }
}
out.sort((a,b)=>a.path.localeCompare(b.path)||a.method.localeCompare(b.method));
console.log(JSON.stringify(out,null,2));
