export function prepareFilters(rows, full, lexicon) {
  const groups=new Map();
  rows.forEach(r=>{const key=full(r.result);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r)});
  const searchIndex=new Map(rows.map(r=>[r,['result','item1','item2'].map(f=>{const o=r[f];return [full(o),lexicon.names[o.name].en,lexicon.names[o.name].zh,...o.modifiers.map(m=>lexicon.modifiers[m].zh)].join(' ')}).join(' ').toLowerCase()]));
  return {groups,searchIndex,allMods:[...new Set(rows.flatMap(r=>r.result.modifiers))].sort()};
}
export function selectDescriptors({rows,groups,searchIndex,terms,buff,category,modifier,unique,expandedKey,cardMode,number,categoryOf,itemName,full,language}) {
  const matches=rows.filter(r=>terms.every(term=>searchIndex.get(r).includes(term))&&(!category||categoryOf(r)===category)&&(!modifier||r.result.modifiers.includes(modifier))&&(!buff||(buff==='unknown'?r.notes.length>0:number(r.values[buff])>0)));
  const grouped=new Map();matches.forEach(r=>{const key=full(r.result);if(!grouped.has(key))grouped.set(key,{key,all:groups.get(key),matches:new Set(),first:r});grouped.get(key).matches.add(r)});
  const collator=new Intl.Collator(language==='zh'?'zh-CN':'en',{numeric:true,sensitivity:'base'}),categoryOrder=['food','drink','herbal','alcohol'],modOrder=['Creamy','Extra sweet','Flambéed','Herbal','Intense','Mixed','Rare'];
  const rank=o=>o.modifiers.length?modOrder.indexOf(o.modifiers[0])+1:0;
  const ordered=[...grouped.values()].sort((a,b)=>categoryOrder.indexOf(categoryOf(a.first))-categoryOrder.indexOf(categoryOf(b.first))||collator.compare(itemName(a.first.result),itemName(b.first.result))||rank(a.first.result)-rank(b.first.result)||a.key.localeCompare(b.key));
  const descriptors=[];let familyIndex=-1,lastFamily=null;
  ordered.forEach(g=>{if(g.first.result.name!==lastFamily){familyIndex++;lastFamily=g.first.result.name}const stripe=familyIndex%2?'family-b':'family-a';if(!unique){[...g.matches].forEach((r,i)=>descriptors.push({r,cls:`${stripe} ${i===0?'group-start':''}`}));return}const open=expandedKey===g.key;descriptors.push({r:g.first,g,cls:`group-summary group-start ${stripe} ${open?'is-open':''}`,key:g.all.length>1?g.key:null});if(open&&!cardMode)g.all.filter(r=>r!==g.first).forEach((r,i)=>descriptors.push({r,g,detail:i+1,cls:`recipe-detail ${stripe}`}))});
  if(!cardMode)descriptors.forEach((d,i)=>{const prev=descriptors[i-1],next=descriptors[i+1];if(!prev||prev.r.result.name!==d.r.result.name)d.cls+=' family-start';if(!next||next.r.result.name!==d.r.result.name)d.cls+=' family-end';if(d.detail&&!prev?.detail)d.cls+=' detail-start';if(d.detail&&!next?.detail)d.cls+=' detail-end'});
  return descriptors;
}
