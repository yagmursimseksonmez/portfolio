// Draws the Chengel design-system boards (colour, type, components, icons and illustrations) from the
// real components of the prototype and the real tokens, in light and dark, and saves them as images.
//
//   node tools/chengel/boards.mjs <prototype.html> <out-dir> [board names, e.g. components icons]
//
// FIT=1 prints, for each column marked data-col, how much height is left unused (it should be small).
import fs from 'node:fs';
import { launch } from './cdp.mjs';

const [, , proto, out, ...only] = process.argv;
fs.mkdirSync(out, { recursive: true });
const tokens = JSON.parse(fs.readFileSync(new URL('./tokens.json', import.meta.url), 'utf8'));
const colours = tokens.color.tokens;

// The tokens of one theme as inline custom properties, so a panel can be light or dark on its own.
const vars = (theme) =>
  colours.map((t) => `--${t.name}:${t.value[theme]}`).join(';') +
  (theme === 'dark' ? ';--mc-line:#c9c7d4;--mc-body:#6a80ba;--mc-accent:#a98fd2' : ';--mc-line:#000131;--mc-body:#94b7f8;--mc-accent:#44086a') +
  (theme === 'dark' ? ';--lift-sm:0 1px 0 0 rgba(0,0,0,0.5);--lift-md:0 10px 28px -12px rgba(0,0,0,0.7)' : ';--lift-sm:0 1px 0 0 rgba(0,1,49,0.16);--lift-md:0 10px 28px -12px rgba(0,1,49,0.35)');

const c = await launch({ scale: 2, width: 2400, height: 1200 });
await c.goto('file://' + proto);
await c.eval(`document.documentElement.setAttribute('data-theme','light'); document.body.innerHTML='<div id="board"></div>'; document.body.style.cssText='margin:0;padding:0;background:transparent;display:block'; document.documentElement.style.background='transparent'`);

async function draw(name, w, h, build) {
  if (only.length && !only.includes(name)) return;
  await c.eval(`(function(){var W=window.WordCross; var b=document.getElementById('board'); b.style.cssText='width:${w}px;height:${h}px;position:relative;font-family:var(--font-mono)'; ${build}; })()`);
  await c.sleep(500);
  await c.shot('#board', `${out}/${name}.png`, fs);
  const fit = process.env.FIT ? await c.eval(`JSON.stringify([...document.querySelectorAll('[data-col]')].map(c=>c.offsetHeight-[...c.children].reduce((s,x)=>s+x.offsetHeight,0)))`) : '';
  console.log(name, fit);
}
// A group of parts scaled by k, with a box the size it is drawn at (a CSS transform alone keeps the old size).
const FIT_JS = `b.querySelectorAll('[data-fit]').forEach(function(w){var k=+w.dataset.fit,c=w.firstChild;w.style.width=c.offsetWidth*k+'px';w.style.height=c.offsetHeight*k+'px';});`;
const J = JSON.stringify;

// ------------------------------------------------------------------ colour
const groups = [
  ['Surfaces', ['paper', 'paper-raised', 'paper-sunken', 'block', 'clue-cell', 'cell-fill', 'key']],
  ['Ink', ['ink', 'ink-muted', 'ink-faint', 'key-ink']],
  ['Brand', ['primary', 'on-primary', 'sky']],
  ['Written', ['written', 'written-wash', 'hint']],
  ['Status', ['success', 'success-wash', 'warning', 'warning-ink', 'warning-wash', 'danger', 'danger-wash']],
];
await draw('colour', 1300, 640, `
  var T=${J(Object.fromEntries(colours.map((t) => [t.name, t.value])))}, G=${J(groups)}, V={light:${J(vars('light'))},dark:${J(vars('dark'))}};
  var notes={light:'Pale blue paper, navy ink, purple that acts.',dark:'A purple-tinted night grey, never pure black.'};
  b.style.display='flex'; b.style.gap='16px';
  b.innerHTML=['light','dark'].map(function(th){
    return '<div style="'+V[th]+';flex:1;background:var(--paper);color:var(--ink);border-radius:20px;border:1px solid var(--ink-faint);padding:20px 22px;display:flex;flex-direction:column;gap:10px;overflow:hidden">'+
      '<div style="display:flex;align-items:baseline;gap:12px"><div class="mono-title">'+(th==='light'?'Light':'Dark')+'</div><div class="mono-caption" style="color:var(--ink-muted)">'+notes[th]+'</div></div>'+
      G.map(function(g){return '<div><div class="mono-label" style="color:var(--ink-muted);margin-bottom:5px">'+g[0]+'</div><div style="display:flex;gap:6px">'+g[1].map(function(n){var v=T[n][th];
        return '<div style="width:74px;flex:none"><div style="height:34px;border-radius:9px;background:'+v+';border:1px solid var(--ink-faint)"></div><div style="font:500 10px/1.25 var(--font-mono);margin-top:4px;color:var(--ink);white-space:nowrap">'+n+'</div><div style="font:400 9.5px/1.2 var(--font-mono);color:var(--ink-muted)">'+v+'</div></div>';}).join('')+'</div></div>';}).join('')+
    '</div>';}).join('');
`);

// ------------------------------------------------------------------ type, lines, corners, space
const styles = tokens.type.groups[0].styles;
await draw('type', 1300, 520, `
  var S=${J(styles)}, V=${J(vars('dark'))};
  b.style.cssText+=';display:flex;gap:16px';
  var strokes=[['hair','1px'],['md','1.5px'],['bold','2px']].map(function(x){return '<div style="flex:1"><div style="border-top:'+x[1]+' solid var(--ink);margin:10px 0 8px"></div><div class="mono-caption" style="color:var(--ink-muted)">stroke-'+x[0]+'<br>'+x[1]+'</div></div>';}).join('');
  var radii=[['sm',8],['md',16],['lg',24],['pill',999]].map(function(x){return '<div style="text-align:center"><div style="width:70px;height:46px;border:1.5px solid var(--ink);border-radius:'+(x[0]==='pill'?'99px':Math.min(x[1],20)+'px')+';margin:0 auto 7px"></div><div class="mono-caption" style="color:var(--ink-muted)">'+x[0]+' · '+(x[1]===999?'999':x[1])+'</div></div>';}).join('');
  var space=[4,8,12,16,24,32,48].map(function(n){return '<div style="text-align:center"><div style="width:'+n+'px;height:'+n+'px;background:var(--sky);border-radius:3px;margin:0 auto 7px"></div><div class="mono-caption" style="color:var(--ink-muted)">'+n+'</div></div>';}).join('');
  var shadows='<div style="display:flex;gap:18px"><div style="flex:1;height:54px;border-radius:16px;background:var(--paper-raised);box-shadow:var(--lift-sm);border:1px solid var(--ink-faint)"></div><div style="flex:1;height:54px;border-radius:24px;background:var(--paper-raised);box-shadow:var(--lift-md);border:1px solid var(--ink-faint)"></div></div><div style="display:flex;gap:18px;margin-top:7px"><div class="mono-caption" style="flex:1;color:var(--ink-muted)">lift-sm · one pixel edge</div><div class="mono-caption" style="flex:1;color:var(--ink-muted)">lift-md · popups, tab bar</div></div>';
  var lab=function(t){return '<div class="mono-label" style="color:var(--ink-muted);margin-bottom:8px">'+t+'</div>';};
  var panel='background:var(--paper);color:var(--ink);border-radius:20px;border:1px solid var(--ink-faint);padding:22px 26px;';
  b.innerHTML=
   '<div style="'+V+';'+panel+'width:640px;flex:none;display:flex;flex-direction:column;gap:7px">'+
     '<div><div class="mono-label" style="color:var(--ink-muted)">Interface</div><div class="mono-heading">JetBrains Mono</div></div>'+
     S.map(function(s){return '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;border-top:1px solid var(--ink-faint);padding-top:6px"><div style="font:'+s.fontWeight+' '+s.fontSize+'/'+s.lineHeight+' var(--font-mono);'+(s.letterSpacing?'letter-spacing:'+s.letterSpacing+';':'')+'white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+s.sample+'</div><div class="mono-caption" style="color:var(--ink-muted);white-space:nowrap">'+s.name.replace('mono-','')+' · '+parseInt(s.fontSize)+'/'+parseInt(s.lineHeight)+'</div></div>';}).join('')+
     '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--written);padding-top:6px"><div style="font:400 36px/36px var(--font-letters);color:var(--written);letter-spacing:.04em">NACHT ÄÖÜ ÇĞİŞ</div><div class="mono-caption" style="color:var(--written);white-space:nowrap">puzzle-letter · 36/36<br>my handwriting</div></div>'+
   '</div>'+
   '<div style="'+V+';'+panel+'flex:1;display:flex;flex-direction:column;gap:22px;justify-content:center">'+
     '<div>'+lab('Lines')+'<div style="display:flex;gap:18px">'+strokes+'</div></div>'+
     '<div>'+lab('Corners')+'<div style="display:flex;justify-content:space-between">'+radii+'</div></div>'+
     '<div>'+lab('Space')+'<div style="display:flex;justify-content:space-between;align-items:flex-end;padding:0 6px">'+space+'</div></div>'+
     '<div>'+lab('Shadows')+shadows+'</div>'+
   '</div>';
`);

// ------------------------------------------------------------------ handwriting specimen
await draw('hand', 720, 450, `
  var V=${J(vars('dark'))};
  b.innerHTML='<div style="'+V+';box-sizing:border-box;width:720px;height:450px;background:var(--paper);color:var(--ink);border-radius:20px;border:1px solid var(--ink-faint);padding:22px 28px;display:flex;flex-direction:column;gap:6px;overflow:hidden">'+
    '<div style="display:flex;justify-content:space-between;align-items:baseline"><div class="mono-heading">Yagmur Hand</div><div class="mono-caption" style="color:var(--ink-muted)">puzzle-letter · 36/36</div></div>'+
    '<div style="font:400 150px/1.05 var(--font-letters);color:var(--written);letter-spacing:.02em">NACHT</div>'+
    '<div style="font:400 52px/1.12 var(--font-letters);color:var(--ink);letter-spacing:.06em">ABCDEFGHIJKLM<br>NOPQRSTUVWXYZ</div>'+
    '<div style="font:400 44px/1.2 var(--font-letters);color:var(--written);letter-spacing:.06em;margin-top:4px">ÄÖÜß &nbsp;ÇĞİŞ &nbsp;ÑÁÉÍÓÚ</div>'+
  '</div>';
`);

// ------------------------------------------------------------------ components
// Drawn at the size it is shown (571px is the height under the page header). Every column runs the full height,
// its groups spread from top to bottom, so the board has no empty strip.
await draw('components', 1986, 571, `
  var V=${J(vars('dark'))};
  var lab=function(s){return '<div class="mono-label" style="color:var(--ink-muted);margin:0 0 5px">'+s+'</div>';};
  var gap=function(n){return '<div style="height:'+(n||12)+'px"></div>';};
  var row=function(){return '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">'+[].slice.call(arguments).join('')+'</div>';};
  var sec=function(n,t,sub){return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><div style="width:34px;height:34px;border-radius:50%;background:var(--ink);color:var(--paper);font:700 16px/34px var(--font-mono);text-align:center">'+n+'</div><div><div class="mono-heading">'+t+'</div><div class="mono-caption" style="color:var(--ink-muted)">'+sub+'</div></div></div>';};
  var spacer='<div style="height:46px"></div>';
  var col=function(w,groups){return '<div data-col style="width:'+w+'px;flex:none;height:100%;display:flex;flex-direction:column;justify-content:space-between">'+groups.map(function(g){return '<div>'+g+'</div>';}).join('')+'</div>';};
  var fit=function(k,html){return '<div data-fit="'+k+'"><div style="transform:scale('+k+');transform-origin:top left;width:max-content">'+html+'</div></div>';};
  var c2=function(ch,s){return {ch:ch,s:s}};
  var icons=['grid','book','trophy','user','star','flame','pencil','lock','bulb','words','heart','bell','globe','moon','sun','home','search','settings','calendar','gift'].map(function(n){return W.icon(n,30);});
  var atoms=[sec('1','Atoms','The smallest parts'),
   lab('Icons, drawn by hand')+row.apply(null,icons),
   lab('Button')+row(W.Button({label:'Continue',icon:'play'}),W.Button({label:'Home',variant:'secondary'}))+gap(6)+row(W.Button({label:'Skip',variant:'ghost'}),W.Button({label:'Collect',disabled:true})),
   lab('Coin pill, toggle, page dots')+row(W.CoinPill({value:1140}),W.Toggle({on:true}),W.Toggle({on:false}),W.PageDots({count:5,active:1})),
   lab('Path node')+row(W.PathNode({state:'done',stars:3}),W.PathNode({state:'current',tag:'start'}),W.PathNode({state:'chest'}),W.PathNode({state:'locked'}))+gap(18)]; // the stars hang 18px below the node
  var molA=[sec('2','Molecules','Atoms that work together'),
   lab('Option row')+'<div style="display:flex;flex-direction:column;gap:6px">'+W.OptionRow({code:'DE',label:'Deutsch',selected:true})+W.OptionRow({label:'A1',sub:'das Lied, die E-Mail, oben'})+'</div>',
   lab('Clue bar')+W.ClueBar({clue:'never',len:3,dir:'down',hints:[{icon:'bulb',label:'Letter',cost:10},{icon:'words',label:'Word',cost:30}]}),
   lab('Level row')+W.LevelRow({level:'Dandelion',sub:'35 words to go',art:'dandelion',done:40,total:75,state:'current'}),
   lab('Stat tiles')+'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">'+[['book',25,'learned'],['flame',3,'streak'],['grid',12,'puzzles'],['star',31,'stars']].map(function(t){return W.StatTile({icon:t[0],value:t[1],label:t[2]});}).join('')+'</div>'];
  var molB=[spacer,
   lab('Status message')+'<div style="display:flex;flex-direction:column;gap:6px">'+W.StatusMessage({kind:'success',text:'NACHT is right'})+W.StatusMessage({kind:'warning',text:'You are low on coins'})+W.StatusMessage({kind:'danger',text:'Not quite. Try again.'})+'</div>',
   lab('Segmented')+W.Segmented({options:['System','Light','Dark'],value:'Light'}),
   lab('Settings group')+W.SettingsGroup({title:'Feedback',rows:[{label:'Sounds',toggle:true},{label:'Daily reminder',toggle:false}]})];
  var grid=[['B',{clue:'never',arrow:'down'},'B','B','B',{clue:'day',arrow:'down'}],[{clue:'night',arrow:'right'},c2('N','correct'),c2('A','correct'),c2('C','correct'),c2('H','correct'),c2('T','correct')],['B',c2('I','correct'),'B','B','B',c2('A','correct')],[{clue:'agreed',arrow:'right'},c2('E','correct'),c2('','active'),c2('','word'),null,null]];
  var orgA=[sec('3','Organisms','Parts of a screen'),
   lab('Crossword grid')+W.CrosswordGrid({rows:grid,cell:78}),
   lab('Tab bar')+fit(468/514,W.TabBar({active:'play',items:[{id:'play',label:'Play',icon:'grid'},{id:'words',label:'Words',icon:'book'},{id:'ach',label:'Awards',icon:'trophy'},{id:'profile',label:'Profile',icon:'user'}]}))]; // the tab bar is 514px wide
  var orgB=[spacer,
   lab('Result popup')+fit(.8,W.ResultPopup({title:'Puzzle solved!',stars:3,detail:'4 new · 0 review',primary:'Next puzzle',secondary:'Home'})),
   lab('Bloom card')+fit(.8,W.BloomCard({name:'Dandelion',art:'dandelion',kicker:'Bloom 2 of 8',done:40,total:75,next:'Tulip',nextArt:'tulip',nextNote:'250 words'}))];
  b.innerHTML='<div style="'+V+';box-sizing:border-box;width:100%;height:100%;color:var(--ink);padding:8px;display:flex;gap:28px;overflow:hidden">'+
    col(410,atoms)+col(340,molA)+col(340,molB)+col(468,orgA)+col(300,orgB)+'</div>';
  ${FIT_JS}
`);

// ------------------------------------------------------------------ icons, Cengo, spot illustrations and blooms
// Drawn at the size it is shown. Left: icons, spot illustrations and Cengo, spread over the full height.
// Right: the blooms with one column per level, eight rows tall, so the board ends level on both sides.
await draw('icons', 985, 571, `
  var V=${J(vars('dark'))};
  var head=function(t,sub){return '<div style="margin-bottom:8px"><div class="mono-heading">'+t+'</div><div class="mono-caption" style="color:var(--ink-muted)">'+sub+'</div></div>';};
  var name=function(n,wrap){return '<div style="font:400 8.5px/1.2 var(--font-mono);color:var(--ink-muted);margin-top:3px;'+(wrap?'':'white-space:nowrap')+'">'+(wrap?n.replace('-','-<br>'):n)+'</div>';};
  var icons=W.iconNames.map(function(n){return '<div style="width:48px;text-align:center">'+W.icon(n,28)+name(n)+'</div>';}).join('');
  var poses=W.mascotPoses.map(function(p){return '<div style="text-align:center;width:89px">'+W.Mascot({pose:p,size:76})+'<div style="font:500 10px/1.2 var(--font-mono);color:var(--ink-muted)">'+p+'</div></div>';}).join('');
  var spot=['ok','warn','bad','chest','folder-known','folder-letters','folder-weak','sprout','mushroom'].filter(function(n){return W.illoNames.indexOf(n)>-1;}).map(function(n){return '<div style="width:69px;text-align:center">'+W.illo(n,48)+name(n,true)+'</div>';}).join('');
  var bl={A1:['flower','dandelion','tulip','poppy','lavender','orchid','edelweiss','kadupul'],A2:['sunflower','iris','rose','peony','lotus','magnolia','bluepoppy','cherry'],B1:['hydrangea','wisteria','camellia','jasmine','fuchsia','protea','bird','cosmos'],B2:['crocus','gentian','snowdrop','primrose','pasque','moss','snowlotus','himprim'],C1:['slipper','rafflesia','titan','juliet','bat','middlemist','jade','ghostorchid']};
  var blooms='<div style="display:flex;gap:7px">'+Object.keys(bl).map(function(k){return '<div style="display:flex;flex-direction:column;align-items:center;gap:4px"><div class="mono-label" style="color:var(--ink-muted);height:16px">'+k+'</div>'+bl[k].map(function(n){return '<div style="width:57px;height:57px;border-radius:50%;background:var(--written-wash);display:grid;place-items:center">'+W.illo(n,42)+'</div>';}).join('')+'</div>';}).join('')+'</div>';
  b.innerHTML='<div style="'+V+';box-sizing:border-box;width:100%;height:100%;color:var(--ink);display:flex;gap:48px;overflow:hidden">'+
    '<div data-col style="width:624px;flex:none;height:100%;display:flex;flex-direction:column;justify-content:space-between">'+
      '<div>'+head('52 icons','Hand-drawn, 24px grid, 1.75px line')+'<div style="display:flex;flex-wrap:wrap;gap:8px 0">'+icons+'</div></div>'+
      '<div>'+head('Spot illustrations','Status, rewards and word folders')+'<div style="display:flex">'+spot+'</div></div>'+
      '<div>'+head('Cengo, seven poses','The tile mascot with a sprout')+'<div style="display:flex">'+poses+'</div></div>'+
    '</div>'+
    '<div data-col style="flex:1;min-width:0;height:100%;display:flex;flex-direction:column;justify-content:space-between">'+
      '<div>'+head('40 blooms, five levels','A1 to C1, eight each, planted in the garden')+'</div>'+blooms+
    '</div>'+
  '</div>';
`);

await c.close();
