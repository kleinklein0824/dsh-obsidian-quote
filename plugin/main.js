/*
Obsidian Quote — local, read-only vault retrieval for AI coding harnesses.
Built with esbuild. Do not edit the bundled output.
*/
"use strict";var ye=Object.create;var ct=Object.defineProperty;var xe=Object.getOwnPropertyDescriptor;var we=Object.getOwnPropertyNames;var ke=Object.getPrototypeOf,Se=Object.prototype.hasOwnProperty;var Ce=(i,t)=>{for(var e in t)ct(i,e,{get:t[e],enumerable:!0})},Bt=(i,t,e,s)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of we(t))!Se.call(i,n)&&n!==e&&ct(i,n,{get:()=>t[n],enumerable:!(s=xe(t,n))||s.enumerable});return i};var j=(i,t,e)=>(e=i!=null?ye(ke(i)):{},Bt(t||!i||!i.__esModule?ct(e,"default",{value:i,enumerable:!0}):e,i)),Re=i=>Bt(ct({},"__esModule",{value:!0}),i);var gs={};Ce(gs,{default:()=>Tt});module.exports=Re(gs);var O=j(require("fs")),be=j(require("os")),et=j(require("path")),J=require("obsidian");var Mt=require("crypto"),U="obsidian-quote-panel";function Ee(){return(0,Mt.randomBytes)(32).toString("hex")}function _t(){return{vaults:[],scope:{includeFolders:[],excludeFolders:[],requiredTags:[]},retrieval:{topK:5,maxCharsPerSnippet:1200,totalCharsBudget:6e3,perFileLimit:3,minScoreRatio:.2},server:{enabled:!0,host:"127.0.0.1",port:43117,token:Ee()},index:{refreshSeconds:120,maxFileSizeKB:512,watch:!0},ui:{advanced:!1,autoRegisterCurrentVault:!0},injection:{format:"markdown",timing:"manual"},profiles:[]}}var H=j(require("fs")),rt=j(require("path"));var dt=j(require("fs")),V=j(require("path"));var ut={must:"## 必须",should:"## 建议",tip:"## 可选"};function Ft(i,t,e){return e==="plain"?`查询：${i} · ${t} 段`:`<!-- obsidian-quote: query="${i}" snippets=${t} -->`}var Pe=new Set(["node_modules",".git",".svn",".hg","dist","build","out",".next",".nuxt",".output","target","venv",".venv","__pycache__",".idea",".vscode","coverage",".cache",".turbo"]),Ie={vue:["vue"],nuxt:["nuxt","vue"],react:["react"],"react-dom":["react"],next:["next","react"],svelte:["svelte"],typescript:["typescript"],vite:["vite"],webpack:["webpack"],tailwindcss:["tailwind"],sass:["css"],less:["css"],pinia:["vue","state"],vuex:["vue","state"],redux:["react","state"],"@nestjs/core":["node"],express:["node"],koa:["node"],fastify:["node"],antd:["react"],"element-plus":["vue"],"ant-design-vue":["vue"],vitest:["testing"],jest:["testing"]},Te=[{pattern:/^tsconfig.*\.json$/i,stack:["typescript"]},{pattern:/^vite\.config\./i,stack:["vite"]},{pattern:/^next\.config\./i,stack:["next","react"]},{pattern:/^nuxt\.config\./i,stack:["nuxt","vue"]},{pattern:/^tailwind\.config\./i,stack:["tailwind"]},{pattern:/^eslint\.config\.|^\.eslintrc/i,stack:["eslint"]},{pattern:/^pyproject\.toml$|^requirements\.txt$|^setup\.py$/i,stack:["python"]},{pattern:/^go\.mod$/i,stack:["go"]},{pattern:/^Cargo\.toml$/i,stack:["rust"]},{pattern:/^pom\.xml$|^build\.gradle/i,stack:["java"]},{pattern:/^platformio\.ini$/i,stack:["embedded"]},{pattern:/\.uvprojx$|\.ioc$/i,stack:["embedded"]}],Vt={".vue":{stack:["vue"],min:1},".tsx":{stack:["react","typescript"],min:1},".jsx":{stack:["react"],min:1},".ts":{stack:["typescript"],min:3},".js":{stack:["javascript"],min:3},".py":{stack:["python"],min:1},".c":{stack:["c"],min:3},".h":{stack:["c"],min:3},".cpp":{stack:["cpp"],min:1},".ino":{stack:["embedded"],min:1},".go":{stack:["go"],min:1},".rs":{stack:["rust"],min:1},".java":{stack:["java"],min:1},".css":{stack:["css"],min:3},".scss":{stack:["css"],min:1}},$e={vue:["组件","样式","状态管理","目录结构","命名","类型"],nuxt:["组件","目录结构","样式","状态管理"],react:["组件","状态管理","目录结构","命名","类型"],next:["目录结构","组件","样式","性能"],svelte:["组件","样式","状态管理"],typescript:["类型","命名","注释"],javascript:["命名","注释","错误处理","格式"],node:["接口","错误处理","配置","日志"],python:["命名","注释","错误处理","测试"],embedded:["命名","注释","配置","错误处理"],c:["命名","注释","错误处理"],cpp:["命名","注释","错误处理"],rust:["命名","注释","错误处理","测试"],go:["命名","注释","错误处理","测试"],java:["命名","注释","错误处理","测试"],css:["样式","命名"],tailwind:["样式"],vite:["配置","目录结构"],webpack:["配置","目录结构"],eslint:["格式","命名"],testing:["测试"],state:["状态管理"]},Ht=600,qe=[{stack:"vue",pattern:/(vue|pinia|vuex|element-plus|elementplus)/i},{stack:"react",pattern:/(react|jsx|redux)/i},{stack:"next",pattern:/next\.?js/i},{stack:"embedded",pattern:/(stm32|gpio|单片机|寄存器|中断|串口|定时器|外设|keil|mdk|固件库)/i},{stack:"python",pattern:/(python|django|flask|pip install)/i},{stack:"rust",pattern:/(rust|cargo)/i},{stack:"go",pattern:/(golang|goroutine|go\.mod)/i},{stack:"java",pattern:/(java|spring boot|maven|gradle)/i},{stack:"vite",pattern:/\bvite\b/i},{stack:"tailwind",pattern:/tailwind/i}],Ne=new Set(["vue","nuxt","react","next","svelte","css","tailwind","vite","html"]);function Wt(i,t){let e=new Set(t),s=`${i.text} ${i.heading} ${i.path} ${i.tags.join(" ")}`;return!Array.from(e).some(r=>Ne.has(r))&&/(kebab-case|类名|scss|tailwind|样式表|颜色值|背景色|var\(--)/i.test(s)?!0:qe.some(r=>!e.has(r.stack)&&r.pattern.test(s))}function st(i,t){for(let e of t)i.includes(e)||i.push(e)}async function zt(i,t,e,s){var n,r;try{let o=await dt.promises.readFile(i,"utf8"),d=JSON.parse(o),c=Object.keys({...(n=d.dependencies)!=null?n:{},...(r=d.devDependencies)!=null?r:{}}),u=[];for(let p of c){let h=Ie[p];h&&st(u,h)}u.length>0&&(st(e,u),s.length<2&&s.push(`${t}：${u.slice(0,4).join("、")}`))}catch(o){s.push(`${t} 无法解析`)}}async function Jt(i){let t=[],e=[],s=V.resolve(i),n;try{n=await dt.promises.readdir(s,{withFileTypes:!0})}catch(h){return{stack:t,evidence:["项目路径不可读"]}}n.find(h=>h.isFile()&&h.name==="package.json")&&await zt(V.join(s,"package.json"),"package.json",t,e);let o=[];for(let h of n)if(h.isFile()){for(let g of Te)if(g.pattern.test(h.name)){st(t,g.stack),o.push(h.name);break}}o.length>0&&e.push(`配置文件：${o.slice(0,4).join("、")}`);let d=new Map,c=0,u=async(h,g)=>{var x;if(c>Ht||g>2)return;let m;try{m=await dt.promises.readdir(h,{withFileTypes:!0})}catch(w){return}for(let w of m){if(c++,c>Ht)return;if(w.isDirectory()){if(w.name.startsWith(".")||Pe.has(w.name.toLowerCase()))continue;await u(V.join(h,w.name),g+1)}else if(w.isFile()){if(w.name==="package.json"&&g>=1&&g<=2){let v=V.relative(s,V.join(h,w.name)).replace(/\\/g,"/");await zt(V.join(h,w.name),v,t,e);continue}let k=V.extname(w.name).toLowerCase();Vt[k]&&d.set(k,((x=d.get(k))!=null?x:0)+1)}}};await u(s,0);let p=[];for(let[h,g]of d){let m=Vt[h];g>=m.min&&(st(t,m.stack),p.some(x=>x.startsWith(h))||p.push(`${g} 个 ${h}`))}return p.length>0&&e.push(p.slice(0,4).join("，")),{stack:t.slice(0,8),evidence:e}}function Qt(i){var e;let t=["命名","目录结构","注释","格式"];for(let s of i)st(t,(e=$e[s])!=null?e:[]);return t}function Ae(i){let t=i.count>1?`（${i.count} 篇同述）`:"";return`- \`${i.id}\` ${i.text}${t} — ${i.path}`}function Kt(i,t,e,s){let n=[`<!-- obsidian-quote brief | stack: ${i.join(", ")||"unknown"} | rules: ${e.length} -->`,"## 适用范围",i.length>0?i.join("、"):"未识别技术栈（可显式指定 stack）"];t.length>0&&n.push(`依据：${t.slice(0,3).join("；")}`);let r="> 只读引用自本地 Obsidian 知识库；与项目既有配置冲突时，以项目配置为准。",o=[{title:ut.must,priority:"must"},{title:ut.should,priority:"should"},{title:ut.tip,priority:"tip"}],d=[],c=n.join(`
`).length+2+r.length,u=0;for(let h of o){let g=e.filter(w=>w.priority===h.priority);if(g.length===0)continue;let m=[],x=h.title.length+2;for(let w of g){let k=Ae(w);if(c+x+k.length+1>s)break;m.push(k),x+=k.length+1}m.length>0&&(d.push("",h.title,...m),c+=x,u+=m.length)}if(u===0){let h="知识库中暂未提取到可执行条款，可改用检索片段（search / context）。";d.push("",h),c+=h.length+2}let p=[...n,...d,"",r].join(`
`);return p.length>s&&(p=p.slice(0,s)),{stack:i,evidence:t,markdown:p,used:p.length,ruleCount:u}}var ht=j(require("path")),Le=/^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/,Oe=/^(#{1,6})\s+(.+?)\s*#*\s*$/,Gt=/^\s*(```+|~~~+)/,Ut=/(^|[\s(（【])#([\p{L}\p{N}_/-]*[\p{L}_][\p{L}\p{N}_/-]*)/gu;function Xt(i){return i.trim().replace(/^["']|["']$/g,"").trim()}function pt(i,t){let e=Xt(t).replace(/^#/,"").trim();e&&(i.includes(e)||i.push(e))}function De(i){let t=[],e="",s=i.split(/\r?\n/),n=!1;for(let r of s){let o=/^tags\s*:\s*(.*)$/i.exec(r);if(o){let c=o[1].trim();n=c.length===0,c.startsWith("[")?c.replace(/^\[|\]$/g,"").split(",").forEach(u=>pt(t,u)):c.length>0&&c.split(",").forEach(u=>pt(t,u));continue}let d=/^title\s*:\s*(.*)$/i.exec(r);if(d){e=Xt(d[1]),n=!1;continue}if(n){let c=/^\s*-\s+(.+)$/.exec(r);if(c){pt(t,c[1]);continue}/^\S/.test(r)&&(n=!1)}}return{title:e,tags:t}}function je(i,t){let e=!1,s="";for(let n of i){let r=Gt.exec(n);if(r){e?n.trim().startsWith(s.repeat(3))&&(e=!1):(e=!0,s=r[1][0]);continue}if(e||/^\s*#{1,6}\s/.test(n))continue;Ut.lastIndex=0;let o;for(;(o=Ut.exec(n))!==null;)pt(t,o[2])}}function Be(i,t){let e=i.split(/\r?\n/),s=[],n=[],r=[],o="",d=!1,c="",u=()=>{let p=r.join(`
`).trim();p&&s.push({heading:o,text:p}),r=[]};for(let p of e){let h=Gt.exec(p);if(h){d?p.trim().startsWith(c.repeat(3))&&(d=!1):(d=!0,c=h[1][0]),r.push(p);continue}if(!d){let g=Oe.exec(p);if(g){u();let m=g[1].length;for(;n.length>0&&n[n.length-1].level>=m;)n.pop();n.push({level:m,text:g[2].trim()});let x=n.map(w=>w.text);x.length>1&&x[0]===t&&x.shift(),o=x.filter((w,k)=>w!==x[k-1]).join(" › ");continue}}r.push(p)}return u(),s}function Yt(i,t){let e=i.replace(/^\uFEFF/,""),s=Le.exec(e),n="",r=e;s&&(n=s[1],r=e.slice(s[0].length));let o=De(n),d=o.tags.slice();je(r.split(/\r?\n/),d);let c=ht.basename(t,ht.extname(t)),u=o.title||c;return{title:u,tags:d,sections:Be(r,u)}}var Zt=j(require("crypto"));var Me=/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]+/g,_e=/[a-z0-9_]+/g;function Q(i){let t=[];if(!i)return t;let e=i.toLowerCase(),s=e.match(_e);if(s)for(let r of s)r.length>1&&t.push(r);let n=e.match(Me);if(n)for(let r of n){if(r.length===1){t.push(r);continue}for(let o=0;o<r.length-1;o++)t.push(r.slice(o,o+2))}return t}var Fe=/(必须|禁止|严禁|不得|不允许|务必|一定要|\bmust\b|\bnever\b|\brequired\b|\bshall\b)/i,Ve=/(应该|应当|推荐|建议|统一|\bshould\b|\brecommend|\bprefer\b)/i,He=/(避免|不要|不建议|注意|切勿|\bavoid\b|\bdon'?t\b)/i,ze=/(不建议|不推荐|不提倡|不要求|不需要|不必|无须|无需|不应|不应该|不应当|\bnot\s+recommend|\bnot\s+prefer|\bshould\s+not\b)/i,te={命名:["命名","名称","大小写","camel","pascal","kebab","snake"],目录结构:["目录","文件夹","工程结构","分层","src/"],注释:["注释","jsdoc","docstring","文档注释"],格式:["缩进","分号","引号","格式化","prettier","eslint","代码风格"],错误处理:["错误处理","异常","try","catch","兜底","错误码"],组件:["组件","props","emit","slot","component"],样式:["样式","css","scss","类名","tailwind"],类型:["类型","interface","泛型","typescript"],接口:["接口","api","请求","rest"],状态管理:["状态管理","pinia","vuex","redux","store"],测试:["测试","单测","覆盖率","test"],提交:["提交","commit","分支","git"],配置:["配置","环境变量","config","setting"],性能:["性能","优化","缓存","懒加载"],安全:["安全","鉴权","权限","token"],数据库:["数据库","sql","表结构"],日志:["日志","log","打印"]},ee=Object.keys(te),We={must:1.4,should:1.15,tip:.9},Je=60;function Qe(i){return i.replace(/(`+)(.*?)\1|\*\*|__|\s+/g,(t,e)=>e?t:/^\s/.test(t)?" ":"").replace(/^[-*+>\s]+/,"").trim()}function Ke(i){let t=i.replace(/```[\s\S]*?```/g,`
`),e=[];for(let s of t.split(/\r?\n/)){let n=s.trim();if(n&&!/^#{1,6}\s/.test(n)){if(n.startsWith("|")){let r=n.split("|").map(o=>o.trim()).filter(o=>o.length>0);r.length>=2&&!/^[-:\s]+$/.test(r[0])&&e.push({text:`${r[0]}：${r[1]}`,raw:r.join("；")});continue}if(n=n.replace(/^>\s*/,""),n=n.replace(/^[-*+]\s+/,"").replace(/^\d+[.)]\s+/,""),!!n)for(let r of n.split(/(?<=[。！？；!?;])\s*/)){let o=r.trim();o&&e.push({text:o,raw:o})}}}return e}function Ue(i){return Fe.test(i)?"must":ze.test(i)?"tip":Ve.test(i)?"should":He.test(i)?"tip":null}function Ge(i){let t=i.toLowerCase(),e=[];for(let s of ee)if(te[s].some(r=>t.includes(r.toLowerCase()))&&e.push(s),e.length>=4)break;return e}function Xe(i){let t=/^([^：:]{1,14})[：:]\s*(.{2,60})$/.exec(i);if(!t)return!1;let e=t[1].trim();if(!ee.includes(e))return!1;let s=t[2].trim();return s.length>40?!1:/[A-Za-z`]/.test(s)||/(PascalCase|camelCase|kebab-case|snake_case|大写|小写|单引号|双引号|分号|缩进)/i.test(s)}var Ye=/^(一句话|相关|前置|下游|上游|参见|详见|命名拆解|目录结构说明)\s*[：:]/;function Ze(i){return!!(/^(\[\[[^\]]*\]\]\s*)+$/.test(i)||/^(来源|参考资料|参考文献|图|表|示例|目录|索引|返回|上一篇|下一篇)\s*[：:]?/.test(i)&&i.length<12)}function ft(i){return i.trim()}function ts(i){return`R-${Zt.createHash("sha256").update(ft(i)).digest("hex").slice(0,16).toUpperCase()}`}function $t(i){return We[i]}function se(i,t){let e=[],s=new Set;for(let n of Ke(i)){if(e.length>=Je)break;let r=Qe(n.text);if(r.length<6||r.length>180||!/[\p{L}]/u.test(r)||Ze(r)||Ye.test(r)||/[：:，,、]$/.test(r))continue;let o=Ue(n.raw);if(!o){if(!Xe(r)||r.length>80)continue;o="tip"}let d=ft(r);if(!d||s.has(d))continue;s.add(d);let c=Ge(`${r} ${t.heading}`),u=Array.from(new Set(Array.from(r.matchAll(/`([^`\n]{1,40})`/g)).map(m=>m[1]))).slice(0,3),p=new Map,h=(m,x)=>{var w;if(m)for(let k of Q(m))p.set(k,((w=p.get(k))!=null?w:0)+x)};h(r,3),h(t.heading,2),h(t.tags.join(" "),1);let g=0;for(let m of p.values())g+=m;e.push({id:ts(r),text:r,priority:o,topics:c,code:u,tags:t.tags.slice(0,8),vaultId:t.vaultId,vault:t.vault,path:t.path,heading:t.heading,updated:t.updated,count:1,tf:p,length:g})}return e}function gt(i){return{id:i.id,text:i.text,priority:i.priority,topics:i.topics,code:i.code,tags:i.tags,vaultId:i.vaultId,vault:i.vault,path:i.path,heading:i.heading,updated:i.updated,count:i.count}}var ne=j(require("crypto")),G=j(require("fs")),qt=j(require("os")),B=j(require("path"));function mt(i,t){let e=B.relative(t,i);return e===""||e!==".."&&!e.startsWith(`..${B.sep}`)&&!B.isAbsolute(e)}function K(i){let t=i.trim();return(t.startsWith('"')&&t.endsWith('"')||t.startsWith("'")&&t.endsWith("'"))&&(t=t.slice(1,-1)),t=t.replace(/^file:\/\//i,""),/^\/[A-Za-z]:\//.test(t)&&(t=t.slice(1)),B.resolve(t)}function ie(i){let t=i.trim();return(t.startsWith('"')&&t.endsWith('"')||t.startsWith("'")&&t.endsWith("'"))&&(t=t.slice(1,-1)),t=t.replace(/^file:\/\//i,""),/^\/[A-Za-z]:\//.test(t)&&(t=t.slice(1)),B.isAbsolute(t)}function nt(i){return ne.createHash("sha1").update(i.toLowerCase()).digest("hex").slice(0,12)}function vt(i){return B.basename(i)||i}function re(i){try{return G.statSync(i).isDirectory()}catch(t){return!1}}function it(i){let t=K(i);return{id:nt(t),name:vt(t),path:t,enabled:!0}}function oe(){var s,n;let i=[];process.env.APPDATA&&i.push(B.join(process.env.APPDATA,"obsidian","obsidian.json")),i.push(B.join(qt.homedir(),"Library","Application Support","obsidian","obsidian.json")),i.push(B.join(qt.homedir(),".config","obsidian","obsidian.json"));let t=[],e=new Set;for(let r of i)if(G.existsSync(r))try{let o=G.readFileSync(r,"utf8"),c=(s=JSON.parse(o).vaults)!=null?s:{};for(let u of Object.keys(c)){let p=(n=c[u])==null?void 0:n.path;if(!p)continue;let h=K(p),g=nt(h);e.has(g)||(e.add(g),t.push({name:vt(h),path:h}))}}catch(o){}return t}var es=new Set([".git",".trash",".stfolder",".stversions","node_modules","__pycache__",".venv","venv",".idea",".vscode",".next",".nuxt",".cache",".tox",".mypy_cache",".pytest_cache"]),X=1.2,Y=.6,ss=/(资料来源|参考资料|参考文献|来源|关系|相关笔记|相关链接|目录|索引|导航|总览|references?|sources?|see also|related)/i;function ns(i,t){var d;let e=i.length;if(e===0)return 0;let r=((d=i.match(/\[\[[^\]]*\]\]|\[[^\]]*\]\([^)]*\)/g))!=null?d:[]).reduce((c,u)=>c+u.length,0)/e,o=1;return e<80&&(o*=.85),r>.4?o*=.55:r>.2&&(o*=.8),ss.test(t)&&(o*=.6),o}function bt(i){return i.trim().replace(/\\/g,"/").replace(/^\.\//,"").replace(/^\/+/,"").replace(/\/+$/,"")}function Nt(i,t){return t?i===t||i.startsWith(t+"/"):!1}function ae(i){return{...i,tf:new Map(i.tf),count:1}}function At(i){let t=new Map;for(let e of i){let s=ft(e.text),n=t.get(s);n?n.count+=1:t.set(s,ae(e))}return Array.from(t.values())}function is(i,t){if(i.length<=t)return[i];let e=[],s="",n=()=>{s.trim()&&e.push(s.trim()),s=""};for(let r of i.split(/\n{2,}/))for((s?`${s}

${r}`:r).length>t&&s&&n(),s=s?`${s}

${r}`:r;s.length>t;)e.push(s.slice(0,t)),s=s.slice(t);return n(),e}async function rs(i,t,e){let s=[],n=t.scope.includeFolders.map(bt).filter(Boolean),r=t.scope.excludeFolders.map(bt).filter(Boolean),o=bt(e!=null?e:""),d=async c=>{let u;try{u=await H.promises.readdir(c?rt.join(i,c):i,{withFileTypes:!0})}catch(p){return}for(let p of u){let h=c?`${c}/${p.name}`:p.name;if(!(o&&mt(h,o))){if(p.isDirectory()){if(p.name.startsWith(".")||es.has(p.name.toLowerCase())||r.some(g=>Nt(h,g)))continue;await d(h)}else if(p.isFile()&&p.name.toLowerCase().endsWith(".md")){if(r.some(g=>Nt(h,g))||n.length>0&&!n.some(g=>Nt(h,g)))continue;s.push(h)}}}};return await d(""),s.sort(),s}function os(i,t){if(t.length===0)return!0;let e=i.map(s=>s.toLowerCase());return t.some(s=>e.includes(s.toLowerCase()))}function as(i,t,e,s,n,r,o,d){let c=new Map,u=(h,g)=>{var m;if(h)for(let x of Q(h))c.set(x,((m=c.get(x))!=null?m:0)+g)};u(s,3),u(n,2),u(o.join(" "),2),u(e,1),u(r,1);let p=0;for(let h of c.values())p+=h;return{vaultId:i,vaultName:t,relPath:e,title:s,heading:n,text:r,tags:o,mtime:d,length:p,weight:ns(r,n),termFreq:c}}function Lt(i,t,e){return e.some(s=>s.vaultId===i&&(!s.path||t===s.path||t.startsWith(s.path+"/")))}var yt=class{constructor(t,e=()=>{}){this.getSettings=t;this.getConfigDir=e;this.ruleOccurrences=[];this.chunks=[];this.rules=[];this.stats=new Map;this.docFreq=new Map;this.avgLength=0;this.ruleDf=new Map;this.ruleAvgLength=0;this.building=null;this.cache=new Map;this.cacheSignature="";this.lastWarnings=[];this.lastBuiltAt=0}get isBuilding(){return this.building!==null}get chunkCount(){return this.chunks.length}get ruleCount(){return this.rules.length}get docCount(){let t=0;for(let e of this.stats.values())t+=e.docs;return t}get statsList(){return Array.from(this.stats.values())}statsFor(t){return this.stats.get(t)}resolveSources(t,e){var d,c;let s=this.getSettings();if(this.lastWarnings=[],!!!(t&&t.length>0||e))return null;let r=t;if((!r||r.length===0)&&e){let u=s.profiles.find(p=>p.id===e||p.name===e);u||this.lastWarnings.push(`未找到组合「${e}」`),r=u==null?void 0:u.sources}if(!r||r.length===0)return e||this.lastWarnings.push("指定的来源为空，未检索任何知识库"),[];let o=[];for(let u of r){if(!u||typeof u.vault!="string")continue;let p;if(u.vaultId)p=s.vaults.find(h=>h.id===u.vaultId);else{let h=s.vaults.filter(g=>g.name.toLowerCase()===u.vault.toLowerCase());if(h.length>1){this.lastWarnings.push(`来源「${u.vault}」匹配到 ${h.length} 个同名知识库，已跳过；请改用唯一的库名或 vaultId`);continue}p=(d=h[0])!=null?d:s.vaults.find(g=>g.id===u.vault)}if(!p){this.lastWarnings.push(`未找到知识库「${u.vault}」`);continue}o.push({vaultId:p.id,vaultName:p.name,path:bt((c=u.path)!=null?c:"")})}return o}async build(){return this.building?this.building:(this.building=this.doBuild().finally(()=>{this.building=null}),this.building)}ensureFresh(){if(this.building)return;let t=Math.max(10,this.getSettings().index.refreshSeconds)*1e3;Date.now()-this.lastBuiltAt>t&&this.build()}async doBuild(){var w,k;let t=this.getSettings(),e=[],s=new Map,n=Date.now(),r=Math.max(1,t.index.maxFileSizeKB)*1024,o=Math.max(200,t.retrieval.maxCharsPerSnippet),d=[],c=`${o}|${r}|${t.scope.requiredTags.join(",")}`;this.cacheSignature!==c&&(this.cache.clear(),this.cacheSignature=c);let u=new Map;for(let v of t.vaults){if(!v.enabled){s.set(v.id,{vaultId:v.id,vaultName:v.name,docs:0,chunks:0,rules:0,skipped:0,builtAt:n});continue}let R=0,P=0,$=0,N=0,l;try{if(await H.promises.access(v.path,H.constants.R_OK),!(await H.promises.stat(v.path)).isDirectory())throw new Error("不是目录")}catch(S){s.set(v.id,{vaultId:v.id,vaultName:v.name,docs:0,chunks:0,rules:0,skipped:0,error:S instanceof Error?`路径不可读：${S.message}`:"路径不可读",builtAt:n});continue}let b=await rs(v.path,t,this.getConfigDir(v.path));for(let S of b){let q=rt.join(v.path,S);try{let a=await H.promises.stat(q);if(a.size>r){N++;continue}let f=`${v.id}|${S}`,y=this.cache.get(f);if(y&&y.mtimeMs===a.mtimeMs&&y.size===a.size&&y.vaultName===v.name){e.push(...y.chunks),d.push(...y.rules.map(ae)),R++,P+=y.chunks.length,$+=y.rules.length,u.set(f,y);continue}let I=await H.promises.readFile(q,"utf8"),T=Yt(I,S);if(!os(T.tags,t.scope.requiredTags)){N++;continue}R++;let D=[],M=[],E=new Date(a.mtimeMs).toISOString();for(let A of T.sections){for(let _ of is(A.text,o))D.push(as(v.id,v.name,S,T.title,A.heading,_,T.tags,a.mtimeMs));M.push(...se(A.text,{vaultId:v.id,vault:v.name,path:S,heading:A.heading,tags:T.tags,updated:E}))}e.push(...D),d.push(...M),P+=D.length,$+=M.length,u.set(f,{mtimeMs:a.mtimeMs,size:a.size,vaultName:v.name,chunks:D,rules:M})}catch(a){if(N++,!l){let f=a instanceof Error?a.message:String(a);l=`${S}：${f}`}}}s.set(v.id,{vaultId:v.id,vaultName:v.name,docs:R,chunks:P,rules:$,skipped:N,error:l,builtAt:n})}let p=At(d),h=new Map,g=0;for(let v of e){g+=v.length;for(let R of v.termFreq.keys())h.set(R,((w=h.get(R))!=null?w:0)+1)}let m=new Map,x=0;for(let v of p){x+=v.length;for(let R of v.tf.keys())m.set(R,((k=m.get(R))!=null?k:0)+1)}this.chunks=e,this.ruleOccurrences=d,this.rules=p,this.docFreq=h,this.avgLength=e.length>0?g/e.length:0,this.ruleDf=m,this.ruleAvgLength=p.length>0?x/p.length:0,this.cache=u,this.stats=s,this.lastBuiltAt=Date.now()}search(t,e={}){var N,l,b,S,q;let s=Date.now(),n=this.getSettings(),r=Math.max(1,(N=e.limit)!=null?N:n.retrieval.topK),o=Math.max(100,(l=e.maxChars)!=null?l:n.retrieval.maxCharsPerSnippet),d=(b=e.minScoreRatio)!=null?b:n.retrieval.minScoreRatio,c=Math.max(1,n.retrieval.perFileLimit),u=t.trim();if(!u||this.chunks.length===0)return{query:t,total:0,tookMs:Date.now()-s,hits:[]};let p=e.vaults&&e.vaults.length>0?new Set(e.vaults.map(a=>a.toLowerCase())):null,h=this.resolveSources(e.sources,e.profile),g=this.lastWarnings.length>0?[...this.lastWarnings]:void 0,m=Array.from(new Set(Q(u))),x=m.length===0?this.literalFallback(u):null;if(m.length===0&&!x)return{query:t,total:0,tookMs:Date.now()-s,hits:[],warnings:g};let w=u.toLowerCase().replace(/\s+/g,""),k=this.chunks.length,v=[];for(let a of this.chunks){if(h){if(!Lt(a.vaultId,a.relPath,h))continue}else if(p&&!p.has(a.vaultId.toLowerCase())&&!p.has(a.vaultName.toLowerCase()))continue;let f=0;if(x){let I=`${a.title}
${a.heading}
${a.text}`.match(x);if(!I)continue;f=I.length}else for(let y of m){let I=a.termFreq.get(y);if(!I)continue;let T=(S=this.docFreq.get(y))!=null?S:0,D=Math.log(1+(k-T+.5)/(T+.5)),M=I+X*(1-Y+Y*a.length/(this.avgLength||1));f+=D*I*(X+1)/M}f<=0||(f*=a.weight,!x&&w.length>=2&&(a.text.toLowerCase().replace(/\s+/g,"").includes(w)?f*=1.4:a.title.toLowerCase().includes(u.toLowerCase())&&(f*=1.2)),v.push({chunk:a,score:f}))}v.sort((a,f)=>f.score-a.score||f.chunk.mtime-a.chunk.mtime);let R=v.length>0?v[0].score*Math.max(0,d):0,P=new Map,$=[];for(let a of v){if($.length>=r||a.score<R)break;let f=`${a.chunk.vaultId}|${a.chunk.relPath}`,y=(q=P.get(f))!=null?q:0;y>=c||(P.set(f,y+1),$.push({vaultId:a.chunk.vaultId,vault:a.chunk.vaultName,path:a.chunk.relPath,title:a.chunk.title,heading:a.chunk.heading,tags:a.chunk.tags,score:Number(a.score.toFixed(4)),updated:new Date(a.chunk.mtime).toISOString(),excerpt:a.chunk.text.length>o?`${a.chunk.text.slice(0,o).trimEnd()}
…`:a.chunk.text}))}return{query:t,total:v.length,tookMs:Date.now()-s,hits:$,warnings:g}}literalFallback(t){if(!/^[A-Za-z0-9_]{1,2}$/.test(t))return null;let e=t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return new RegExp(`(^|[^A-Za-z0-9_])${e}([^A-Za-z0-9_]|$)`,"gi")}buildContext(t,e,s,n,r){var x;let o=this.getSettings(),d=Math.max(200,e!=null?e:o.retrieval.totalCharsBudget),c=this.search(t,{limit:s!=null?s:o.retrieval.topK,maxChars:o.retrieval.maxCharsPerSnippet,sources:n,profile:r}),u=[],p=((x=o.injection)==null?void 0:x.format)==="plain"?"plain":"markdown",h=p==="plain"?`

`:`

---

`,g=96;for(let w of c.hits){let k=[`- 来源：${w.vault} / ${w.path}`];w.tags.length>0&&k.push(`- 标签：${w.tags.join(", ")}`);let R=[`### ${w.heading?`${w.title} › ${w.heading}`:w.title}`,...k,"",w.excerpt].join(`
`),P=u.length>0?h.length:0;if(g+u.reduce(($,N)=>$+N.length,0)+P+R.length>d){if(u.length===0){let $=Math.max(0,d-g);$>0&&u.push(R.slice(0,$))}break}u.push(R)}let m="";if(u.length>0){let w=()=>`${`${Ft(t,u.length,p)}

`}${u.join(h)}`;for(m=w();u.length>0&&m.length>d;){let k=m.length-d,v=u[u.length-1];v.length>k+8?u[u.length-1]=`${v.slice(0,Math.max(0,v.length-k-1)).trimEnd()}…`:u.pop(),m=u.length>0?w():""}m.length>d&&(m=m.slice(0,d))}return{query:t,markdown:m,used:m.length,hits:c.hits,warnings:c.warnings}}getRules(t={}){var h,g,m,x,w;let e=Date.now(),s=Math.max(1,Math.min(100,(h=t.limit)!=null?h:20)),n=((g=t.topic)!=null?g:"").trim(),r=((m=t.priority)!=null?m:"").toString().trim().toLowerCase(),o=this.resolveSources(t.sources,t.profile),d=this.lastWarnings.length>0?[...this.lastWarnings]:void 0,c=this.ruleOccurrences;o&&(c=c.filter(k=>Lt(k.vaultId,k.path,o))),(r==="must"||r==="should"||r==="tip")&&(c=c.filter(k=>k.priority===r)),n&&(c=c.filter(k=>k.topics.some(v=>v===n||v.includes(n)||n.includes(v)))),c=At(c);let u=((x=t.query)!=null?x:"").trim(),p=[];if(u){let k=Array.from(new Set(Q(u))),v=this.rules.length||1;for(let R of c){let P=0;for(let $ of k){let N=R.tf.get($);if(!N)continue;let l=(w=this.ruleDf.get($))!=null?w:0,b=Math.log(1+(v-l+.5)/(l+.5)),S=N+X*(1-Y+Y*R.length/(this.ruleAvgLength||1));P+=b*N*(X+1)/S}P<=0||p.push({...gt(R),score:Number((P*$t(R.priority)).toFixed(4))})}p.sort((R,P)=>P.score-R.score||P.count-R.count)}else{let k={must:0,should:1,tip:2},v=c.slice().sort((R,P)=>k[R.priority]-k[P.priority]||P.count-R.count);for(let R of v)p.push({...gt(R),score:0})}return{total:p.length,tookMs:Date.now()-e,rules:p.slice(0,s),warnings:d}}async buildBrief(t={}){var R,P,$,N;let e=Math.max(400,(R=t.budget)!=null?R:4e3),s=Math.max(4,Math.min(60,(P=t.limit)!=null?P:24)),n=(($=t.stack)!=null?$:[]).map(l=>l.trim()).filter(Boolean),r=[];if(n.length===0&&t.projectPath){let l=rt.resolve(t.projectPath),b=!1;try{b=H.statSync(l).isDirectory()}catch(q){b=!1}if(!b)return{stack:[],evidence:["项目路径不可读"],markdown:`<!-- obsidian-quote brief | error: unreadable project -->

项目路径不可读：${t.projectPath}`,used:0,ruleCount:0,rules:[],error:`项目路径不可读：${t.projectPath}`};let S=await Jt(l);n=S.stack,r=S.evidence}n.length===0&&(n=["通用"]);let o=Qt(n),d=n[0]!=="通用",c=this.resolveSources(t.sources,t.profile),u=this.lastWarnings.length>0?[...this.lastWarnings]:void 0;c&&c.length>0&&(r=[`范围 ${c.map(l=>l.path?`${l.vaultName}/${l.path}`:l.vaultName).join("、")}`,...r]);let p=Array.from(new Set(Q([...n,...o,"规范","约定","命名","目录","风格"].join(" ")))),h=this.rules.length||1,g=[],m=At(this.ruleOccurrences.filter(l=>c&&!Lt(l.vaultId,l.path,c)||d&&Wt(l,n)?!1:l.topics.length===0||l.topics.some(b=>o.includes(b))));for(let l of m){let b=0;for(let a of p){let f=l.tf.get(a);if(!f)continue;let y=(N=this.ruleDf.get(a))!=null?N:0,I=Math.log(1+(h-y+.5)/(y+.5)),T=f+X*(1-Y+Y*l.length/(this.ruleAvgLength||1));b+=I*f*(X+1)/T}let S=l.topics.filter(a=>o.includes(a)).length*.8,q=(b+S)*$t(l.priority);q<=0||g.push({...gt(l),score:Number(q.toFixed(4))})}g.sort((l,b)=>b.score-l.score);let x={must:s,should:Math.ceil(s*.35),tip:s},w={must:0,should:0,tip:0},k=[];for(let l of g){if(k.length>=s)break;w[l.priority]>=x[l.priority]||(w[l.priority]++,k.push(l))}return{...Kt(n,r,k,e),rules:k,warnings:u}}};var xt=class{constructor(){this.queries=0;this.citations=0;this.records=[];this.notes=new Map;this.dirty=!1}get isDirty(){return this.dirty}record(t,e,s){this.queries++;let n=new Set,r=[];for(let d of s){let c=`${d.vault}|${d.path}`;n.has(c)||(n.add(c),r.push(d))}this.citations+=r.length;let o=Date.now();for(let d of r){let c=`${d.vault}|${d.path}`,u=this.notes.get(c);u?(u.count++,u.lastAt=o):this.notes.set(c,{vault:d.vault,path:d.path,title:d.title,count:1,lastAt:o})}if(this.records.push({at:o,kind:t,query:e,hits:r.length,top:r.slice(0,3)}),this.records.length>120&&this.records.splice(0,this.records.length-120),this.notes.size>200){let d=Array.from(this.notes.entries()).sort((c,u)=>u[1].count-c[1].count).slice(0,200);this.notes=new Map(d)}this.dirty=!0}getStats(){let t=Array.from(this.notes.values()).sort((s,n)=>n.count-s.count||n.lastAt-s.lastAt).slice(0,8),e=this.records.slice(-10).reverse();return{totalQueries:this.queries,totalCitations:this.citations,topNotes:t,recent:e}}load(t){if(!(!t||typeof t!="object")){if(this.queries=Number.isFinite(t.queries)?Number(t.queries):0,this.citations=Number.isFinite(t.citations)?Number(t.citations):0,this.records=Array.isArray(t.records)?t.records.slice(-120):[],this.notes=new Map,Array.isArray(t.notes))for(let e of t.notes.slice(0,200))!e||typeof e.path!="string"||this.notes.set(`${e.vault}|${e.path}`,e);this.dirty=!1}}toJSON(){return{queries:this.queries,citations:this.citations,records:this.records.slice(-120),notes:Array.from(this.notes.values()).sort((t,e)=>e.count-t.count).slice(0,200)}}clear(){this.queries=0,this.citations=0,this.records=[],this.notes.clear(),this.dirty=!0}};var C=require("obsidian");function Ot(i){return i.split(/\r?\n/).map(t=>t.trim()).filter(t=>t.length>0)}function le(i,t,e,s){let n=Number(i);return Number.isFinite(n)?Math.min(e,Math.max(t,Math.round(n))):s}function ls(i){return new Date(i).toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"})}function cs(i){let t=i.app;t.setting&&(t.setting.open(),t.setting.openTabById(i.manifest.id))}function W(i,t,e){let s=i.createDiv({cls:"oq-card"}),r=s.createDiv({cls:"oq-card-head"}).createDiv({cls:"oq-card-heading"});return r.createEl("h3",{text:t,cls:"oq-card-title"}),e&&r.createEl("p",{text:e,cls:"oq-card-desc"}),s.createDiv({cls:"oq-card-body"})}function wt(i,t,e){let s=i.createDiv({cls:"oq-metric"});s.createDiv({cls:"oq-metric-value",text:String(t)}),s.createDiv({cls:"oq-metric-label",text:e})}function kt(i,t){i.buttonEl.addClass("oq-btn",`oq-btn-${t}`)}function Dt(i,t=!1){i.extraSettingsEl.addClass("oq-icon-btn"),t&&i.extraSettingsEl.addClass("oq-icon-btn-danger")}function ot(i){i.toggleEl.addClass("oq-switch")}function ce(i){i.selectEl.addClass("oq-select")}function jt(i,t,e={}){i.empty(),i.addClass("obsidian-quote-panel");let s=t.getStatus(),n=t.settings.ui.advanced,r=JSON.stringify({url:s.server.url,token:t.settings.server.token},null,2),o=i.createDiv({cls:"oq-hero"}),d=o.createDiv({cls:"oq-hero-top"}),c=d.createDiv({cls:"oq-hero-heading"});c.createEl("h2",{text:"知识库引用",cls:"oq-title"}),c.createEl("p",{cls:"oq-hint oq-hero-sub",text:"把本地 Obsidian 知识库作为只读参考源，供 AI 编码 harness 按需检索。"});let u=d.createDiv({cls:`oq-pill ${s.indexing?"is-busy":"is-on"}`});u.createSpan({cls:"oq-pill-dot"}),u.createSpan({text:s.indexing?"索引中":"索引就绪"});let p=o.createDiv({cls:"oq-status"}),h=p.createDiv({cls:"oq-status-line"});h.createSpan({cls:`oq-dot ${s.server.running?"is-on":"is-off"}`}),h.createSpan({text:s.server.running?`引用服务运行中 · ${s.server.url}`:"引用服务未启动"}),p.createDiv({cls:"oq-status-meta",text:`${s.vaults.length} 个知识库 · ${s.totalDocs} 篇笔记 · ${s.totalChunks} 个段落 · ${s.totalRules} 条规则${s.indexing?" · 索引中…":""}`});let g=o.createDiv({cls:"oq-metrics"});wt(g,s.vaults.length,"知识库"),wt(g,s.totalDocs,"笔记"),wt(g,s.totalChunks,"段落"),wt(g,s.totalRules,"条款");let m=o.createDiv({cls:"oq-actions"}),x=m.createEl("button",{text:"重建索引",cls:"oq-btn oq-btn-primary"});x.addEventListener("click",()=>{x.setAttribute("disabled","true"),x.setText("索引中…"),t.rebuild().then(()=>{new C.Notice(`索引完成：${t.getStatus().totalChunks} 个段落`)}).catch(a=>{new C.Notice(`索引失败：${a instanceof Error?a.message:String(a)}`)}).finally(()=>{x.removeAttribute("disabled"),x.setText("重建索引")})}),m.createEl("button",{text:"复制接入配置",cls:"oq-btn oq-btn-secondary"}).addEventListener("click",()=>{navigator.clipboard.writeText(r).then(()=>new C.Notice("接入配置已复制"),()=>new C.Notice("复制失败，请手动选择下方配置"))});let k=m.createEl("button",{text:"写入接入配置",cls:"oq-btn oq-btn-secondary"});k.title="写入 ~/.obsidian-quote/config.json，harness 会直接读取",k.addEventListener("click",()=>{k.setAttribute("disabled","true"),t.writeHarnessConfig().then(a=>{new C.Notice(a.message)}).finally(()=>{k.removeAttribute("disabled")})}),e.showSettingsLink&&n&&m.createEl("button",{text:"全部设置",cls:"oq-btn oq-btn-ghost"}).addEventListener("click",()=>cs(t));let v=W(i,"知识库","只读引用，不会修改、移动或迁移笔记。开关表示参与检索。"),R=v.createDiv({cls:"oq-vault-list"});t.settings.vaults.length===0&&R.createEl("p",{cls:"oq-empty",text:"尚未登记知识库。"});for(let a of t.settings.vaults){let f=t.indexer.statsFor(a.id),y=[a.path];f&&y.push(`${f.docs} 篇 / ${f.chunks} 段 / ${f.rules} 条规则`),f!=null&&f.error&&y.push(f.error),new C.Setting(R).setName(a.name).setDesc(y.join(" · ")).addToggle(I=>{ot(I),I.setValue(a.enabled).onChange(async T=>{a.enabled=T,await t.saveSettings(),t.scheduleRebuild(0)})}).addExtraButton(I=>{Dt(I,!0),I.setIcon("trash-2").setTooltip("移除").onClick(async()=>{t.settings.vaults=t.settings.vaults.filter(T=>T.id!==a.id),await t.saveSettings(),t.scheduleRebuild(0),t.notify()})})}let P="";new C.Setting(v).setClass("oq-setting-wide").setName("登记知识库").setDesc("填写本机可访问的知识库根目录绝对路径，可登记当前 Obsidian 库以外的目录。").addText(a=>{a.inputEl.addClass("oq-input"),a.setPlaceholder("D:\\Notes\\MyVault").onChange(f=>{P=f})}).addButton(a=>{kt(a,"primary"),a.setButtonText("添加").onClick(async()=>{let f=P.trim();if(!f){new C.Notice("请先填写知识库路径");return}let y=t.addVault(f);if(!y.ok){new C.Notice(y.message);return}await t.saveSettings(),t.scheduleRebuild(0),t.notify()})}),new C.Setting(v).setName("快速登记").setDesc("从当前打开的库，或本机 Obsidian 配置中读取。").addButton(a=>{kt(a,"secondary"),a.setButtonText("当前库").onClick(async()=>{var I,T;let f=(T=(I=t.app.vault.adapter).getBasePath)==null?void 0:T.call(I);if(!f){new C.Notice("无法读取当前库路径");return}let y=t.addVault(f);new C.Notice(y.message),y.ok&&(await t.saveSettings(),t.scheduleRebuild(0),t.notify())})}).addButton(a=>{kt(a,"secondary"),a.setButtonText("扫描本机").onClick(async()=>{let f=oe(),y=0;for(let I of f){let T=K(I.path);t.settings.vaults.some(D=>D.id===it(T).id)||(t.settings.vaults.push(it(T)),y++)}new C.Notice(f.length===0?"未在本机配置中找到知识库":`新增 ${y} 个知识库`),y!==0&&(await t.saveSettings(),t.scheduleRebuild(0),t.notify())})});let $=W(i,"引用范围","目录均相对知识库根目录，每行一条；留空表示不限。");new C.Setting($).setClass("oq-setting-wide").setName("包含目录").setDesc("仅检索这些目录下的笔记。留空表示全库。").addTextArea(a=>{a.inputEl.rows=3,a.inputEl.addClass("oq-textarea"),a.setPlaceholder(`10-规范
20-项目`).setValue(t.settings.scope.includeFolders.join(`
`)).onChange(f=>{t.settings.scope.includeFolders=Ot(f),t.scheduleSave(),t.scheduleRebuild(1200)})}),new C.Setting($).setClass("oq-setting-wide").setName("排除目录").setDesc("这些目录不参与检索。").addTextArea(a=>{a.inputEl.rows=3,a.inputEl.addClass("oq-textarea"),a.setPlaceholder(`archive
templates`).setValue(t.settings.scope.excludeFolders.join(`
`)).onChange(f=>{t.settings.scope.excludeFolders=Ot(f),t.scheduleSave(),t.scheduleRebuild(1200)})}),new C.Setting($).setClass("oq-setting-wide").setName("仅含标签").setDesc("笔记需至少带有一个标签，逗号分隔；留空表示不过滤。").addText(a=>{a.inputEl.addClass("oq-input"),a.setPlaceholder("规范, 代码风格").setValue(t.settings.scope.requiredTags.join(", ")).onChange(f=>{t.settings.scope.requiredTags=f.split(",").map(y=>y.trim().replace(/^#/,"")).filter(y=>y.length>0),t.scheduleSave(),t.scheduleRebuild(1200)})});let N=W(i,"检索参数","控制单次引用的条数与篇幅，避免一次注入过多内容。"),l=(a,f,y,I,T,D,M)=>{new C.Setting(N).setName(a).setDesc(f).addText(E=>{E.inputEl.type="number",E.inputEl.min=String(I),E.inputEl.max=String(T),E.inputEl.addClass("oq-input","oq-input-number"),E.setValue(String(y)).onChange(A=>{M(le(A,I,T,D))})})};if(l("单次引用条数","默认 5，范围 1–50。",t.settings.retrieval.topK,1,50,5,a=>{t.settings.retrieval.topK=a,t.scheduleSave()}),l("单段最大字符","默认 1200，范围 200–8000。超出会切分段落。",t.settings.retrieval.maxCharsPerSnippet,200,8e3,1200,a=>{t.settings.retrieval.maxCharsPerSnippet=a,t.scheduleSave(),t.scheduleRebuild(1200)}),l("单次总字符预算","默认 6000，范围 500–40000。超出预算的片段不再引用。",t.settings.retrieval.totalCharsBudget,500,4e4,6e3,a=>{t.settings.retrieval.totalCharsBudget=a,t.scheduleSave()}),l("单篇最多片段","默认 3，避免同一篇笔记占满结果。",t.settings.retrieval.perFileLimit,1,10,3,a=>{t.settings.retrieval.perFileLimit=a,t.scheduleSave()}),new C.Setting(N).setName("最低相关度").setDesc("默认 0.2，相对最高分的比例，范围 0–1。").addText(a=>{a.inputEl.type="number",a.inputEl.min="0",a.inputEl.max="1",a.inputEl.step="0.05",a.inputEl.addClass("oq-input","oq-input-number"),a.setValue(String(t.settings.retrieval.minScoreRatio)).onChange(f=>{let y=Number(f);Number.isFinite(y)&&(t.settings.retrieval.minScoreRatio=Math.min(1,Math.max(0,y)),t.scheduleSave())})}),new C.Setting(N).setName("自动跟随文件变化").setDesc("笔记新增或保存后自动增量重建索引。").addToggle(a=>{ot(a),a.setValue(t.settings.index.watch).onChange(async f=>{t.settings.index.watch=f,await t.saveSettings(),t.notify()})}),n){let a=W(i,"引用组合","把多个库或库内子目录打包成一个来源，harness 侧用 --profile 名称 一次引用。"),f=a.createDiv({cls:"oq-vault-list"});t.settings.profiles.length===0&&f.createEl("p",{cls:"oq-empty",text:"尚未创建组合。"});for(let E of t.settings.profiles){let A=E.sources.map(_=>_.path?`${_.vault}/${_.path}`:_.vault).join(" + ");new C.Setting(f).setName(E.name).setDesc(A).addExtraButton(_=>{Dt(_,!0),_.setIcon("trash-2").setTooltip("移除").onClick(async()=>{t.settings.profiles=t.settings.profiles.filter(lt=>lt.id!==E.id),await t.saveSettings(),t.notify()})})}let y="",I="";new C.Setting(a).setClass("oq-setting-wide").setName("组合来源").setDesc("每行一个：库名，或 库名/子目录。可跨库混合。").addTextArea(E=>{E.inputEl.rows=3,E.inputEl.addClass("oq-textarea"),E.setPlaceholder(`Obsidian test1/Vue3/组件规范
Obsidian Vault/wiki`).onChange(A=>{y=A})}),new C.Setting(a).setClass("oq-setting-wide").setName("组合名称").addText(E=>{E.inputEl.addClass("oq-input"),E.setPlaceholder("vue-规范").onChange(A=>{I=A})}).addButton(E=>{kt(E,"primary"),E.setButtonText("添加组合").onClick(async()=>{let A=t.addProfile(I,Ot(y));new C.Notice(A.message),A.ok&&(await t.saveSettings(),t.notify())})});let T=W(i,"注入设置","控制交给 harness 的上下文格式与建议时机。");new C.Setting(T).setName("上下文格式").setDesc("markdown 带 HTML 注释头，plain 为纯文本；影响 /context 输出。").addDropdown(E=>{ce(E),E.addOption("markdown","Markdown").addOption("plain","纯文本").setValue(t.settings.injection.format).onChange(async A=>{t.settings.injection.format=A==="plain"?"plain":"markdown",await t.saveSettings(),t.notify()})}),new C.Setting(T).setName("建议注入时机").setDesc("写入 /health 供 harness 参考：manual 按需检索；brief-first 项目开始先取一次摘要。").addDropdown(E=>{ce(E),E.addOption("manual","按需检索").addOption("brief-first","项目开始先取摘要").setValue(t.settings.injection.timing).onChange(async A=>{t.settings.injection.timing=A==="brief-first"?"brief-first":"manual",await t.saveSettings(),t.notify()})});let D=W(i,"引用台账","仅记录在本机，用于反推该收窄还是补充知识库。"),M=t.getStats();if(D.createEl("p",{cls:"oq-hint",text:`累计 ${M.totalQueries} 次检索 · 引用 ${M.totalCitations} 个片段`}),M.recent.length===0)D.createEl("p",{cls:"oq-empty",text:"暂无引用记录。"});else{let E=D.createDiv({cls:"oq-ledger"});for(let _ of M.recent.slice(0,3)){let lt=E.createDiv({cls:"oq-ledger-row"});lt.createSpan({cls:"oq-ledger-query",text:`${_.kind} · ${_.query||"（空）"}`}),lt.createSpan({cls:"oq-ledger-meta",text:`${_.hits} 条 · ${ls(_.at)}`})}let A=M.topNotes[0];A&&D.createEl("p",{cls:"oq-hint",text:`高频：${A.path}（${A.count} 次）`})}}let b=W(i,"Harness 接入","插件只提供本地只读检索服务，不改动 harness 的配置或源码；harness 侧通过 skill 或 MCP 适配层调用。");new C.Setting(b).setName("启用引用服务").setDesc("仅监听本机回环地址。关闭后 harness 无法检索。").addToggle(a=>{ot(a),a.setValue(t.settings.server.enabled).onChange(async f=>{if(t.settings.server.enabled=f,f)try{await t.server.start()}catch(y){t.settings.server.enabled=!1,new C.Notice(`服务启动失败：${y instanceof Error?y.message:String(y)}`)}else await t.server.stop();await t.saveSettings(),t.notify()})}),new C.Setting(b).setName("端口").setDesc("默认 43117；被占用时自动顺延最多 9 个端口。修改后失焦生效。").addText(a=>{a.inputEl.type="number",a.inputEl.min="1024",a.inputEl.max="65535",a.inputEl.addClass("oq-input","oq-input-number"),a.setValue(String(t.settings.server.port)).onChange(f=>{let y=le(f,1024,65535,43117);y!==t.settings.server.port&&(t.settings.server.port=y,t.scheduleSave())}),a.inputEl.addEventListener("blur",()=>{t.server.running&&t.server.port!==t.settings.server.port&&(async()=>{await t.server.stop();try{await t.server.start()}catch(f){new C.Notice(`端口切换失败：${f instanceof Error?f.message:String(f)}`)}t.notify()})()})}),new C.Setting(b).setClass("oq-setting-wide").setName("访问令牌").setDesc("harness 请求需携带 Bearer 令牌。").addText(a=>{a.inputEl.readOnly=!0,a.inputEl.addClass("oq-token","oq-input"),a.setValue(t.settings.server.token)}).addExtraButton(a=>{Dt(a),a.setIcon("copy").setTooltip("复制接入配置").onClick(()=>{navigator.clipboard.writeText(r).then(()=>new C.Notice("接入配置已复制"),()=>new C.Notice("复制失败"))})}),b.createEl("pre",{cls:"oq-config"}).createEl("code",{text:r}),b.createEl("p",{cls:"oq-hint",text:"点「写入接入配置」可直接保存到 ~/.obsidian-quote/config.json（原文件自动备份为 .bak），也可以手动粘贴给环境变量 OBSIDIAN_QUOTE_URL / OBSIDIAN_QUOTE_TOKEN。"});let q=W(i,"面板","默认保持最小可用；需要组合、注入格式或台账时再展开。");new C.Setting(q).setName("显示高级功能").setDesc("引用组合、注入设置与引用台账。").addToggle(a=>{ot(a),a.setValue(n).onChange(async f=>{t.settings.ui.advanced=f,await t.saveSettings(),t.notify()})}),new C.Setting(q).setName("首次启用自动登记当前库").setDesc("知识库列表为空时，自动把当前打开的库加入只读引用。").addToggle(a=>{ot(a),a.setValue(t.settings.ui.autoRegisterCurrentVault).onChange(async f=>{t.settings.ui.autoRegisterCurrentVault=f,await t.saveSettings()})})}var St=class extends C.ItemView{constructor(e,s){super(e);this.plugin=s;this.unsubscribe=null}getViewType(){return U}getDisplayText(){return"知识库引用"}getIcon(){return"library"}async onOpen(){this.unsubscribe=this.plugin.subscribe(()=>this.render()),this.render()}async onClose(){var e;(e=this.unsubscribe)==null||e.call(this),this.unsubscribe=null}render(){jt(this.contentEl,this.plugin,{showSettingsLink:!0})}};var ge=j(require("http")),Pt=j(require("node:timers")),at=require("crypto"),Rt=require("url");function ue(i){return us.split("__NONCE__").join(i)}var us=`<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="referrer" content="no-referrer">
<title>Obsidian 知识库 · 只读面板</title>
<style nonce="__NONCE__">
:root {
  color-scheme: light dark;
  --bg: #f5f6f8;
  --panel: #ffffff;
  --text: #1f2328;
  --muted: #667085;
  --border: #d5d9e0;
  --border-strong: #b8bfc9;
  --accent: #4f46e5;
  --accent-soft: #eef2ff;
  --ok: #12805c;
  --err: #b42318;
  --warn: #b54708;
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f1115;
    --panel: #161a20;
    --text: #e6e8ee;
    --muted: #98a2b3;
    --border: #2a303a;
    --border-strong: #3b4350;
    --accent: #8b87f8;
    --accent-soft: #1e2436;
    --ok: #3ddc97;
    --err: #ff8a80;
    --warn: #fdb022;
  }
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--bg);
  color: var(--text);
  font: 14px/1.55 var(--sans);
  -webkit-font-smoothing: antialiased;
}
.hidden { display: none !important; }
.boot { padding: 64px 20px; text-align: center; color: var(--muted); }
.wrap { max-width: 1020px; margin: 0 auto; padding: 18px 16px 72px; }
h1 { font-size: 16px; margin: 0; font-weight: 650; }
h2 { font-size: 13px; margin: 0 0 8px; font-weight: 600; color: var(--muted); letter-spacing: .02em; }
.top {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding-bottom: 12px; margin-bottom: 16px; border-bottom: 1px solid var(--border);
}
.top .grow { flex: 1 1 auto; }
.pills { display: flex; gap: 6px; flex-wrap: wrap; }
.pill {
  border: 1px solid var(--border); border-radius: 999px; padding: 2px 9px;
  font-size: 11px; color: var(--muted); background: var(--panel); white-space: nowrap;
}
.pill.ok { color: var(--ok); border-color: currentColor; }
.pill.bad { color: var(--err); border-color: currentColor; }
.pill b { font-weight: 600; color: inherit; }
.login {
  max-width: 440px; margin: 56px auto; background: var(--panel);
  border: 1px solid var(--border); border-radius: 12px; padding: 22px 22px 18px;
}
.login h2 { color: var(--text); font-size: 15px; margin-bottom: 4px; }
.login p { margin: 0 0 14px; color: var(--muted); font-size: 12px; }
.field { display: flex; gap: 8px; }
.field.col { flex-direction: column; }
label { font-size: 11px; color: var(--muted); display: block; margin-bottom: 3px; }
input[type="text"], input[type="password"], input[type="number"], select {
  width: 100%; padding: 6px 9px; font: inherit; font-size: 13px; color: var(--text);
  background: var(--bg); border: 1px solid var(--border-strong); border-radius: 7px;
}
input:focus, select:focus, button:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
button {
  font: inherit; font-size: 12px; padding: 5px 14px; border-radius: 7px; cursor: pointer;
  color: var(--text); background: var(--panel); border: 1px solid var(--border-strong);
  white-space: nowrap;
}
button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
button:disabled { opacity: .5; cursor: default; }
.row { display: flex; gap: 8px; flex-wrap: wrap; align-items: flex-end; }
.row > .f { flex: 1 1 160px; min-width: 120px; }
.row > .f.narrow { flex: 0 0 96px; }
.row > .f.tiny { flex: 0 0 76px; }
.tabs { display: flex; gap: 4px; flex-wrap: wrap; padding: 4px; background: var(--panel); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 14px; }
.tabs button { border: 0; background: transparent; color: var(--muted); padding: 5px 12px; border-radius: 7px; }
.tabs button.on { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
.scope { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; margin-bottom: 14px; }
.scope-list { display: flex; gap: 6px; flex-wrap: wrap; }
.scope-chip { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--border); border-radius: 999px; padding: 3px 10px; font-size: 12px; cursor: pointer; user-select: none; }
.scope-chip input { margin: 0; accent-color: var(--accent); }
.scope-chip.off { color: var(--muted); text-decoration: line-through; cursor: default; opacity: .6; }
.out { min-height: 40px; }
.card { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; }
.card .title { font-weight: 600; margin-bottom: 2px; word-break: break-word; }
.card .meta { color: var(--muted); font-size: 11px; margin-bottom: 6px; word-break: break-all; }
.card .excerpt { font-size: 12.5px; white-space: pre-wrap; word-break: break-word; color: var(--text); }
.card .excerpt mark { background: var(--accent-soft); color: inherit; border-radius: 3px; padding: 0 2px; }
.md {
  background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
  padding: 12px 14px; margin: 0 0 10px; white-space: pre-wrap; word-break: break-word;
  font: 12.5px/1.6 var(--mono); overflow-x: auto;
}
.count { color: var(--muted); font-size: 12px; margin: 2px 0 8px; }
.warn { color: var(--warn); font-size: 12px; margin: 0 0 8px; white-space: pre-wrap; }
.err { color: var(--err); font-size: 12px; margin: 8px 0 0; white-space: pre-wrap; }
.empty { color: var(--muted); font-size: 12.5px; padding: 10px 2px; }
.badge { display: inline-block; font-size: 10px; font-weight: 600; border-radius: 4px; padding: 0 5px; border: 1px solid currentColor; margin-right: 5px; vertical-align: 1px; }
.badge.must { color: var(--err); }
.badge.should { color: var(--warn); }
.badge.tip { color: var(--ok); }
.rule { padding: 7px 2px; border-bottom: 1px dashed var(--border); }
.rule:last-child { border-bottom: 0; }
.rule .text { font-size: 13px; }
.rule .src { color: var(--muted); font-size: 11px; margin-top: 2px; word-break: break-all; }
.chip { display: inline-block; background: var(--accent-soft); color: var(--accent); border-radius: 5px; padding: 1px 7px; font-size: 11px; margin: 0 4px 4px 0; }
.statgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin-bottom: 14px; }
.stat { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; }
.stat .k { color: var(--muted); font-size: 11px; }
.stat .v { font-size: 18px; font-weight: 650; font-variant-numeric: tabular-nums; }
.hr { border: 0; border-top: 1px solid var(--border); margin: 14px 0; }
.foot { color: var(--muted); font-size: 11px; margin-top: 24px; text-align: center; }
@media (max-width: 560px) {
  .wrap { padding: 12px 10px 56px; }
  .pills { margin-left: 0; }
}
</style>
</head>
<body>
<div id="boot" class="boot">正在连接本地引用服务…</div>

<div id="login" class="login hidden">
  <h2>连接本地知识库</h2>
  <p>这是 Obsidian Quote 的通用浏览器只读面板。请粘贴 Obsidian 插件面板里的访问令牌；令牌只在本机用于换取一次会话 Cookie，不会写进 URL 或历史记录。</p>
  <label for="token">访问令牌</label>
  <form id="login-form" class="field col">
    <input id="token" type="password" autocomplete="off" spellcheck="false" placeholder="粘贴访问令牌">
    <div class="row" style="justify-content:flex-end">
      <button type="submit" class="primary" id="login-btn">连接</button>
    </div>
  </form>
  <p class="err" id="login-error"></p>
</div>

<div id="app" class="wrap hidden">
  <div class="top">
    <div class="grow">
      <h1>Obsidian 知识库 · 只读面板</h1>
      <div class="sub" id="status-line">正在读取状态…</div>
    </div>
    <div class="pills" id="status-pills"></div>
    <button type="button" id="logout-btn">断开</button>
  </div>

  <div class="scope">
    <div class="row" style="justify-content:space-between;margin-bottom:6px">
      <h2 style="margin:0">检索范围</h2>
      <span class="count" id="scope-note" style="margin:0">未选择 = 全部已启用库</span>
    </div>
    <div class="scope-list" id="scope-list"></div>
  </div>

  <div class="tabs" role="tablist">
    <button type="button" data-tab="search" class="on" role="tab" aria-selected="true">检索</button>
    <button type="button" data-tab="context" role="tab" aria-selected="false">上下文</button>
    <button type="button" data-tab="rules" role="tab" aria-selected="false">规范条款</button>
    <button type="button" data-tab="brief" role="tab" aria-selected="false">摘要</button>
    <button type="button" data-tab="stats" role="tab" aria-selected="false">统计</button>
  </div>

  <section id="panel-search" class="tabpanel">
    <div class="row">
      <div class="f"><label for="search-q">关键词 / 问题</label><input id="search-q" type="text" placeholder="例如：GPIO 初始化顺序"></div>
      <div class="f tiny"><label for="search-limit">条数</label><input id="search-limit" type="number" min="1" max="50" value="8"></div>
      <button type="button" class="primary" id="search-run">检索</button>
    </div>
    <div class="hr"></div>
    <div class="out" id="search-out"><div class="empty">输入关键词后回车或点“检索”。结果按 BM25 相关度排序，只读。</div></div>
  </section>

  <section id="panel-context" class="tabpanel hidden">
    <div class="row">
      <div class="f"><label for="context-q">主题</label><input id="context-q" type="text" placeholder="例如：Vue 组件命名"></div>
      <div class="f narrow"><label for="context-budget">字符预算</label><input id="context-budget" type="number" min="500" max="40000" step="500" value="6000"></div>
      <div class="f tiny"><label for="context-limit">条数</label><input id="context-limit" type="number" min="1" max="30" value="8"></div>
      <button type="button" class="primary" id="context-run">生成</button>
    </div>
    <div class="hr"></div>
    <div class="out" id="context-out"><div class="empty">生成一份可直接粘贴给模型的知识库 Markdown 上下文。</div></div>
  </section>

  <section id="panel-rules" class="tabpanel hidden">
    <div class="row">
      <div class="f"><label for="rules-q">关键词</label><input id="rules-q" type="text" placeholder="可留空，只看主题/级别"></div>
      <div class="f"><label for="rules-topic">主题</label><input id="rules-topic" type="text" placeholder="如 命名、目录结构"></div>
      <div class="f narrow"><label for="rules-priority">级别</label>
        <select id="rules-priority"><option value="">全部</option><option value="must">必须</option><option value="should">建议</option><option value="tip">可选</option></select>
      </div>
      <div class="f tiny"><label for="rules-limit">条数</label><input id="rules-limit" type="number" min="1" max="100" value="20"></div>
      <button type="button" class="primary" id="rules-run">查询</button>
    </div>
    <div class="hr"></div>
    <div class="out" id="rules-out"><div class="empty">从笔记里提炼的规范条款，带级别与来源路径。</div></div>
  </section>

  <section id="panel-brief" class="tabpanel hidden">
    <div class="row">
      <div class="f"><label for="brief-path">项目路径（可选，用于识别技术栈）</label><input id="brief-path" type="text" placeholder="例如 D:\\work\\my-app"></div>
      <div class="f"><label for="brief-stack">技术栈（可选，逗号分隔）</label><input id="brief-stack" type="text" placeholder="如 vue, typescript"></div>
      <div class="f tiny"><label for="brief-budget">预算</label><input id="brief-budget" type="number" min="1000" max="40000" step="500" value="4000"></div>
      <button type="button" class="primary" id="brief-run">生成</button>
    </div>
    <div class="hr"></div>
    <div class="out" id="brief-out"><div class="empty">按技术栈筛选出“必须 / 建议 / 可选”三段式规范摘要。</div></div>
  </section>

  <section id="panel-stats" class="tabpanel hidden">
    <div class="row" style="justify-content:flex-end"><button type="button" id="stats-refresh">刷新</button></div>
    <div class="hr"></div>
    <div class="out" id="stats-out"><div class="empty">台账统计：查询次数、引用次数、最常被引用的笔记。</div></div>
  </section>

  <div class="foot">只读面板 · 数据留在本机 · 不写回任何笔记或 harness</div>
</div>

<script nonce="__NONCE__">
(function () {
  'use strict';

  var state = { vaults: [], scope: [], tab: 'search' };

  function byId(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function num(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  function clamp(value, min, max, fallback) {
    var n = num(value, fallback);
    return Math.min(max, Math.max(min, Math.round(n)));
  }
  function fmtTime(ts) {
    if (!ts) return '—';
    try { return new Date(ts).toLocaleString('zh-CN', { hour12: false }); } catch (e) { return '—'; }
  }
  function fmtNum(n) {
    return typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString('zh-CN') : String(n === undefined ? '—' : n);
  }
  function setError(node, message) {
    node.textContent = message || '';
  }
  function request(path, options) {
    var opts = options || {};
    var init = { method: opts.method || 'GET', credentials: 'same-origin' };
    if (opts.body !== undefined) {
      init.headers = { 'content-type': 'application/json' };
      init.body = JSON.stringify(opts.body);
    }
    return fetch(path, init).then(function (res) {
      return res.text().then(function (text) {
        var body;
        try { body = text ? JSON.parse(text) : null; } catch (e) { body = { error: '服务返回了非 JSON 响应（HTTP ' + res.status + '）' }; }
        return { ok: res.ok, status: res.status, body: body };
      });
    });
  }
  function fail(node, result) {
    var message = result && result.body && (result.body.error || result.body.reason);
    if (!message) message = '请求失败（HTTP ' + (result ? result.status : '?') + '）';
    node.textContent = message;
  }
  function busy(node, text) {
    clear(node);
    node.appendChild(el('div', 'empty', text));
  }

  function showLogin(message) {
    byId('boot').classList.add('hidden');
    byId('app').classList.add('hidden');
    byId('login').classList.remove('hidden');
    setError(byId('login-error'), message || '');
    var input = byId('token');
    if (input) input.focus();
  }

  function pills(items) {
    var box = byId('status-pills');
    clear(box);
    items.forEach(function (item) {
      var pill = el('span', 'pill ' + (item.ok === false ? 'bad' : item.ok ? 'ok' : ''), '');
      if (item.label) {
        pill.appendChild(el('span', '', item.label + ' '));
      }
      pill.appendChild(el('b', '', item.value));
      box.appendChild(pill);
    });
  }

  function renderStatus(health) {
    var line = byId('status-line');
    if (!health || health.ok !== true) {
      line.textContent = '本地引用服务未响应；请确认 Obsidian 正在运行且插件已启用。';
      pills([{ label: '服务', value: '离线', ok: false }]);
      return;
    }
    line.textContent = '版本 ' + health.version + ' · 上次建索引 ' + fmtTime(health.lastBuiltAt) + (health.indexing ? ' · 正在建索引' : '');
    pills([
      { label: '文档', value: fmtNum(health.docs), ok: true },
      { label: '分块', value: fmtNum(health.chunks), ok: true },
      { label: '条款', value: fmtNum(health.rules), ok: true }
    ]);
  }

  function renderScope(vaults) {
    var box = byId('scope-list');
    clear(box);
    state.vaults = vaults || [];
    vaults.forEach(function (vault) {
      var label = el('label', 'scope-chip' + (vault.enabled ? '' : ' off'));
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.disabled = !vault.enabled;
      input.value = vault.id;
      input.addEventListener('change', function () {
        if (input.checked) state.scope.push(vault.id);
        else state.scope = state.scope.filter(function (id) { return id !== vault.id; });
        var note = byId('scope-note');
        note.textContent = state.scope.length ? ('已选 ' + state.scope.length + ' 个库') : '未选择 = 全部已启用库';
      });
      label.appendChild(input);
      label.appendChild(el('span', '', vault.name + ' · ' + fmtNum(vault.docs) + ' 篇'));
      box.appendChild(label);
    });
    if (!vaults.length) box.appendChild(el('div', 'empty', '没有已登记的库。'));
  }

  function scopeSources() {
    return state.scope.map(function (id) {
      var vault = state.vaults.filter(function (item) { return item.id === id; })[0];
      return { vaultId: id, vault: vault ? vault.name : id };
    });
  }

  function showTab(name) {
    state.tab = name;
    Array.prototype.forEach.call(document.querySelectorAll('.tabs button'), function (button) {
      var on = button.getAttribute('data-tab') === name;
      button.className = on ? 'on' : '';
      button.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.tabpanel'), function (panel) {
      panel.classList.toggle('hidden', panel.id !== 'panel-' + name);
    });
    if (name === 'stats') loadStats();
  }

  function wireTabs() {
    Array.prototype.forEach.call(document.querySelectorAll('.tabs button'), function (button) {
      button.addEventListener('click', function () { showTab(button.getAttribute('data-tab')); });
    });
  }

  function renderHits(out, body, kind) {
    clear(out);
    var head = el('div', 'count', '共 ' + fmtNum(body.total) + ' 条 · ' + fmtNum(body.tookMs) + ' ms');
    out.appendChild(head);
    (body.warnings || []).forEach(function (warning) { out.appendChild(el('p', 'warn', '提示：' + warning)); });
    if (!body.hits || !body.hits.length) {
      out.appendChild(el('div', 'empty', kind === 'search' ? '没有命中。试试更短的关键词，或放宽检索范围。' : '没有可用的片段。'));
      return;
    }
    body.hits.forEach(function (hit) {
      var card = el('div', 'card');
      card.appendChild(el('div', 'title', hit.title || hit.path));
      var meta = [hit.vault, hit.path, 'score ' + Number(hit.score).toFixed(2)].join(' · ');
      card.appendChild(el('div', 'meta', meta));
      if (hit.excerpt) card.appendChild(el('div', 'excerpt', hit.excerpt));
      out.appendChild(card);
    });
  }

  function doSearch() {
    var out = byId('search-out');
    var query = byId('search-q').value.trim();
    if (!query) { busy(out, '请输入关键词。'); return; }
    var body = { query: query, limit: clamp(byId('search-limit').value, 1, 50, 8) };
    var sources = scopeSources();
    if (sources.length) body.sources = sources;
    busy(out, '检索中…');
    request('/search', { method: 'POST', body: body }).then(function (result) {
      if (!result.ok) { clear(out); fail(out, result); return; }
      renderHits(out, result.body, 'search');
    }).catch(function (error) { clear(out); out.appendChild(el('p', 'err', '网络错误：' + error.message)); });
  }

  function doContext() {
    var out = byId('context-out');
    var query = byId('context-q').value.trim();
    if (!query) { busy(out, '请输入主题。'); return; }
    var body = {
      query: query,
      budget: clamp(byId('context-budget').value, 500, 40000, 6000),
      limit: clamp(byId('context-limit').value, 1, 30, 8)
    };
    var sources = scopeSources();
    if (sources.length) body.sources = sources;
    busy(out, '生成中…');
    request('/context', { method: 'POST', body: body }).then(function (result) {
      if (!result.ok) { clear(out); fail(out, result); return; }
      clear(out);
      var body2 = result.body;
      out.appendChild(el('div', 'count', '用了 ' + fmtNum(body2.used) + ' 字符 · ' + fmtNum((body2.hits || []).length) + ' 个片段'));
      (body2.warnings || []).forEach(function (warning) { out.appendChild(el('p', 'warn', '提示：' + warning)); });
      out.appendChild(el('pre', 'md', body2.markdown || ''));
      appendCopy(out, body2.markdown || '');
    }).catch(function (error) { clear(out); out.appendChild(el('p', 'err', '网络错误：' + error.message)); });
  }

  function appendCopy(container, text) {
    if (!text) return;
    var row = el('div', 'row');
    row.style.marginTop = '10px';
    var button = el('button', '', '复制 Markdown');
    var note = el('span', 'count', '');
    note.style.margin = '0';
    button.addEventListener('click', function () {
      var done = function () { note.textContent = '已复制'; };
      var failed = function () { note.textContent = '复制失败，请手动选择文本。'; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, failed);
      } else {
        failed();
      }
    });
    row.appendChild(button);
    row.appendChild(note);
    container.appendChild(row);
  }

  function doRules() {
    var out = byId('rules-out');
    var params = [];
    function add(key, value) { if (value) params.push(encodeURIComponent(key) + '=' + encodeURIComponent(value)); }
    add('q', byId('rules-q').value.trim());
    add('topic', byId('rules-topic').value.trim());
    add('priority', byId('rules-priority').value);
    add('limit', clamp(byId('rules-limit').value, 1, 100, 20));
    var sources = scopeSources();
    sources.forEach(function (source) { add('source', source.vault); });
    busy(out, '查询中…');
    request('/rules' + (params.length ? '?' + params.join('&') : '')).then(function (result) {
      if (!result.ok) { clear(out); fail(out, result); return; }
      clear(out);
      var body = result.body;
      out.appendChild(el('div', 'count', '共 ' + fmtNum(body.total) + ' 条 · ' + fmtNum(body.tookMs) + ' ms'));
      (body.warnings || []).forEach(function (warning) { out.appendChild(el('p', 'warn', '提示：' + warning)); });
      if (!body.rules || !body.rules.length) {
        out.appendChild(el('div', 'empty', '没有匹配的条款。'));
        return;
      }
      body.rules.forEach(function (rule) {
        var item = el('div', 'rule');
        var priority = el('span', 'badge ' + rule.priority, rule.priority === 'must' ? '必须' : rule.priority === 'should' ? '建议' : '可选');
        item.appendChild(priority);
        item.appendChild(el('span', 'text', rule.text));
        var src = [rule.id, rule.vault, rule.path, rule.heading].filter(Boolean).join(' · ');
        item.appendChild(el('div', 'src', src + (rule.count > 1 ? ' · 被 ' + rule.count + ' 篇笔记提到' : '')));
        out.appendChild(item);
      });
    }).catch(function (error) { clear(out); out.appendChild(el('p', 'err', '网络错误：' + error.message)); });
  }

  function doBrief() {
    var out = byId('brief-out');
    var body = { budget: clamp(byId('brief-budget').value, 1000, 40000, 4000) };
    var projectPath = byId('brief-path').value.trim();
    var stack = byId('brief-stack').value.split(',').map(function (item) { return item.trim(); }).filter(Boolean);
    if (projectPath) body.projectPath = projectPath;
    if (stack.length) body.stack = stack;
    var sources = scopeSources();
    if (sources.length) body.sources = sources;
    busy(out, '生成中…');
    request('/brief', { method: 'POST', body: body }).then(function (result) {
      if (!result.ok) { clear(out); fail(out, result); return; }
      clear(out);
      var data = result.body;
      out.appendChild(el('div', 'count', '技术栈：' + ((data.stack || []).join(', ') || '未识别') + ' · 条款 ' + fmtNum(data.ruleCount)));
      var chips = el('div', '');
      (data.stack || []).forEach(function (item) { chips.appendChild(el('span', 'chip', item)); });
      out.appendChild(chips);
      (data.warnings || []).forEach(function (warning) { out.appendChild(el('p', 'warn', '提示：' + warning)); });
      out.appendChild(el('pre', 'md', data.markdown || ''));
      appendCopy(out, data.markdown || '');
    }).catch(function (error) { clear(out); out.appendChild(el('p', 'err', '网络错误：' + error.message)); });
  }

  function loadStats() {
    var out = byId('stats-out');
    busy(out, '读取中…');
    request('/stats').then(function (result) {
      if (!result.ok) { clear(out); fail(out, result); return; }
      clear(out);
      var data = result.body;
      var grid = el('div', 'statgrid');
      [['查询次数', data.totalQueries], ['引用次数', data.totalCitations]].forEach(function (pair) {
        var card = el('div', 'stat');
        card.appendChild(el('div', 'k', pair[0]));
        card.appendChild(el('div', 'v', fmtNum(pair[1])));
        grid.appendChild(card);
      });
      out.appendChild(grid);
      out.appendChild(el('h2', '', '最常被引用'));
      if (!data.topNotes || !data.topNotes.length) {
        out.appendChild(el('div', 'empty', '还没有引用记录。'));
      } else {
        data.topNotes.forEach(function (note) {
          var line = el('div', 'rule');
          line.appendChild(el('div', 'text', note.title || note.path));
          line.appendChild(el('div', 'src', note.vault + ' · ' + note.path + ' · ' + fmtNum(note.count) + ' 次'));
          out.appendChild(line);
        });
      }
      out.appendChild(el('h2', '', '最近引用'));
      if (!data.recent || !data.recent.length) {
        out.appendChild(el('div', 'empty', '还没有最近记录。'));
      } else {
        data.recent.slice().reverse().forEach(function (item) {
          var line = el('div', 'rule');
          line.appendChild(el('div', 'text', '[' + item.kind + '] ' + (item.query || '（空查询）')));
          var top = (item.top && item.top[0]) ? (item.top[0].title || item.top[0].path) : '';
          line.appendChild(el('div', 'src', fmtTime(item.at) + ' · ' + fmtNum(item.hits) + ' 条' + (top ? ' · ' + top : '')));
          out.appendChild(line);
        });
      }
    }).catch(function (error) { clear(out); out.appendChild(el('p', 'err', '网络错误：' + error.message)); });
  }

  function login() {
    var token = byId('token').value.trim();
    if (!token) { setError(byId('login-error'), '请先粘贴访问令牌。'); return; }
    var button = byId('login-btn');
    button.disabled = true;
    setError(byId('login-error'), '');
    request('/ui/session', { method: 'POST', body: { token: token } }).then(function (result) {
      button.disabled = false;
      if (!result.ok) {
        setError(byId('login-error'), (result.body && result.body.error) || '令牌不正确。');
        return;
      }
      byId('token').value = '';
      boot();
    }).catch(function (error) {
      button.disabled = false;
      setError(byId('login-error'), '无法连接本地服务：' + error.message);
    });
  }

  function logout() {
    request('/ui/logout', { method: 'POST', body: {} }).then(function () { showLogin('已断开。'); }, function () { showLogin('已断开。'); });
  }

  function boot() {
    return Promise.all([request('/health'), request('/vaults')]).then(function (results) {
      var health = results[0].body;
      var vaults = results[1];
      if (vaults.status === 401) { showLogin(''); return; }
      if (!vaults.ok) { showLogin((vaults.body && vaults.body.error) || '无法读取知识库列表。'); return; }
      byId('boot').classList.add('hidden');
      byId('login').classList.add('hidden');
      byId('app').classList.remove('hidden');
      renderStatus(health);
      renderScope((vaults.body && vaults.body.vaults) || []);
      byId('scope-note').textContent = '未选择 = 全部已启用库';
    }).catch(function (error) { showLogin('无法连接本地引用服务：' + error.message); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    wireTabs();
    byId('login-form').addEventListener('submit', function (event) { event.preventDefault(); login(); });
    byId('search-run').addEventListener('click', doSearch);
    byId('search-q').addEventListener('keydown', function (event) { if (event.key === 'Enter') doSearch(); });
    byId('context-run').addEventListener('click', doContext);
    byId('context-q').addEventListener('keydown', function (event) { if (event.key === 'Enter') doContext(); });
    byId('rules-run').addEventListener('click', doRules);
    byId('rules-q').addEventListener('keydown', function (event) { if (event.key === 'Enter') doRules(); });
    byId('brief-run').addEventListener('click', doBrief);
    byId('stats-refresh').addEventListener('click', loadStats);
    byId('logout-btn').addEventListener('click', logout);
    boot();
  });
})();
</script>
</body>
</html>`;var ds=1e6,Ct="oq_session",de=720*60*1e3,me=new Set(["localhost","127.0.0.1","::1","[::1]"]);function pe(i){let t={};if(!i)return t;for(let e of i.split(";")){let s=e.indexOf("=");if(s===-1)continue;let n=e.slice(0,s).trim();if(n)try{t[n]=decodeURIComponent(e.slice(s+1).trim())}catch(r){t[n]=e.slice(s+1).trim()}}return t}function ps(i){if(!i)return!0;let t=i.startsWith("[")?i.slice(0,i.indexOf("]")+1):i.split(":")[0];return me.has(t.toLowerCase())}function hs(i){try{let{hostname:t}=new Rt.URL(i);return me.has(t.toLowerCase())}catch(t){return!1}}var z=class extends Error{constructor(e,s){super(s);this.status=e}};function fs(i){return new Promise((t,e)=>{let s=[],n=0,r=!1;i.on("data",o=>{if(!r){if(n+=o.length,n>ds){r=!0,e(new z(413,"请求体过大")),i.resume();return}s.push(o)}}),i.on("end",()=>{if(r)return;r=!0;let o=Buffer.concat(s).toString("utf8").trim();if(!o){t({});return}try{t(JSON.parse(o))}catch(d){e(new z(400,"请求体不是合法 JSON"))}}),i.on("error",o=>{r||(r=!0,e(o))})})}function L(i){return typeof i=="string"?i:void 0}async function Z(i){let t=await fs(i);if(t===null||typeof t!="object"||Array.isArray(t))throw new z(400,"请求体必须是 JSON 对象");return t}function F(i){if(typeof i=="number"&&Number.isFinite(i))return i;if(typeof i=="string"&&i.trim()!==""){let t=Number(i);if(Number.isFinite(t))return t}}function he(i){if(!Array.isArray(i))return;let t=i.filter(e=>typeof e=="string"&&e.trim().length>0);return t.length>0?t:void 0}function fe(i){if(typeof i!="string")return;let t=i.trim().toLowerCase();if(t){if(t==="must"||t==="should"||t==="tip")return t;throw new z(400,`priority 只能是 must / should / tip，收到：${i}`)}}function tt(i){var e;if(!Array.isArray(i))return;let t=[];for(let s of i){if(typeof s=="string"&&s.trim()){let n=s.trim(),r=n.indexOf("/");t.push(r===-1?{vault:n}:{vault:n.slice(0,r),path:n.slice(r+1)});continue}if(s&&typeof s=="object"){let n=s,r=(e=L(n.vault))!=null?e:L(n.vaultId);if(!r)continue;t.push({vault:r,vaultId:L(n.vaultId),path:L(n.path)})}}return t.length>0?t:void 0}var Et=class{constructor(t){this.host=t;this.server=null;this.starting=null;this.boundPort=0;this.sessions=new Map;this.sessionToken=null}get running(){return this.server!==null}get port(){return this.boundPort||this.host.getSettings().server.port}get url(){let{host:t}=this.host.getSettings().server;return`http://${t.includes(":")?`[${t}]`:t}:${this.port}`}async start(){if(!this.server)return this.starting?this.starting:(this.starting=this.doStart().finally(()=>{this.starting=null}),this.starting)}async doStart(){var n;let t=this.host.getSettings().server;if(!["127.0.0.1","localhost","::1"].includes(t.host))throw new Error("引用服务仅支持本机回环地址（127.0.0.1 / localhost / ::1）");if(!((n=t.token)!=null&&n.trim()))throw new Error("缺少访问令牌，拒绝启动引用服务");let e=[t.port];for(let r=1;r<=9;r++)e.push(t.port+r);let s=null;for(let r of e)try{await this.listen(r),this.boundPort=r;return}catch(o){s=o}throw s instanceof Error?s:new Error("端口启动失败")}async stop(){this.starting&&await this.starting.catch(()=>{}),this.sessions.clear(),this.sessionToken=null;let t=this.server;t&&(this.server=null,await new Promise(e=>{var o;let s=!1,n=()=>{s||(s=!0,Pt.clearTimeout(r),e())},r=Pt.setTimeout(n,1e3);t.close(n),(o=t.closeAllConnections)==null||o.call(t)}))}listen(t){return new Promise((e,s)=>{let n=ge.createServer((o,d)=>{this.handle(o,d).catch(c=>{this.sendJson(d,500,{error:c instanceof Error?c.message:String(c)})})}),r=o=>{n.close(),s(o)};n.once("error",r),n.listen(t,this.host.getSettings().server.host,()=>{n.off("error",r),this.server=n,e()})})}authorized(t,e,s=!0){var c;let n=this.host.getSettings().server.token;if(!(n!=null&&n.trim()))return!1;let r=t.headers.authorization;if(typeof r=="string"&&r.toLowerCase().startsWith("bearer ")&&this.tokenMatches(r.slice(7).trim()))return!0;let o=t.headers["x-quote-token"];if(typeof o=="string"&&this.tokenMatches(o)||this.tokenMatches((c=e.searchParams.get("token"))!=null?c:void 0))return!0;if(!s)return!1;let d=t.headers.origin;if(d)try{if(new Rt.URL(d).origin!==e.origin)return!1}catch(u){return!1}return this.sessionValid(t)}tokenMatches(t){let e=this.host.getSettings().server.token;if(!(e!=null&&e.trim())||typeof t!="string")return!1;let s=Buffer.from(t,"utf8"),n=Buffer.from(e,"utf8");return s.length!==n.length?!1:(0,at.timingSafeEqual)(s,n)}createSession(){this.pruneSessions();let t=(0,at.randomBytes)(32).toString("hex");return this.sessions.set(t,Date.now()+de),t}pruneSessions(){let t=this.host.getSettings().server.token;this.sessionToken!==t&&(this.sessions.clear(),this.sessionToken=t);let e=Date.now();for(let[s,n]of this.sessions)n<=e&&this.sessions.delete(s)}sessionValid(t){this.pruneSessions();let e=pe(t.headers.cookie)[Ct];if(!e)return!1;let s=this.sessions.get(e);return s?s<=Date.now()?(this.sessions.delete(e),!1):!0:!1}destroySession(t){let e=pe(t.headers.cookie)[Ct];e&&this.sessions.delete(e)}sessionCookie(t){let e="Path=/; HttpOnly; SameSite=Strict";if(!t)return`${Ct}=; ${e}; Max-Age=0`;let s=Math.floor(de/1e3);return`${Ct}=${t}; ${e}; Max-Age=${s}`}async handle(t,e){var r,o,d,c,u,p,h,g,m,x,w,k,v,R,P,$,N;let s=new Rt.URL((r=t.url)!=null?r:"/",`http://${(o=t.headers.host)!=null?o:"127.0.0.1"}`);if(!ps(t.headers.host)){this.sendJson(e,403,{error:"forbidden host"});return}let n=t.headers.origin;if(typeof n=="string"&&hs(n)&&(e.setHeader("Access-Control-Allow-Origin",n),e.setHeader("Vary","Origin")),e.setHeader("Access-Control-Allow-Headers","authorization, content-type, x-quote-token"),e.setHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS"),e.setHeader("Cache-Control","no-store"),e.setHeader("X-Content-Type-Options","nosniff"),e.setHeader("Referrer-Policy","no-referrer"),e.setHeader("X-Frame-Options","DENY"),t.method==="OPTIONS"){e.statusCode=204,e.end();return}if(s.pathname==="/ui"||s.pathname==="/ui/"){if(t.method!=="GET"){this.sendJson(e,405,{error:"method not allowed"});return}let l=s.searchParams.get("token");if(l!==null){if(!this.tokenMatches(l)){this.sendJson(e,401,{error:"unauthorized"});return}e.setHeader("Set-Cookie",this.sessionCookie(this.createSession())),this.redirect(e,"/ui");return}let b=(0,at.randomBytes)(16).toString("base64");this.sendHtml(e,ue(b),b);return}if(t.method==="POST"&&s.pathname==="/ui/session"){try{let l=await Z(t),b=L(l.token);if(!b){this.sendJson(e,400,{ok:!1,error:"缺少令牌。"});return}if(!this.tokenMatches(b)){this.sendJson(e,401,{ok:!1,error:"令牌不正确。"});return}e.setHeader("Set-Cookie",this.sessionCookie(this.createSession())),this.sendJson(e,200,{ok:!0})}catch(l){let b=l instanceof z?l.status:500;this.sendJson(e,b,{ok:!1,error:l instanceof Error?l.message:String(l)})}return}if(t.method==="POST"&&s.pathname==="/ui/logout"){this.destroySession(t),e.setHeader("Set-Cookie",this.sessionCookie(null)),this.sendJson(e,200,{ok:!0});return}if(s.pathname==="/health"){let l=this.host.getStatus();this.sendJson(e,200,{ok:!0,version:l.version,indexing:l.indexing,vaults:l.vaults.length,docs:l.totalDocs,chunks:l.totalChunks,rules:l.totalRules,lastBuiltAt:l.lastBuiltAt,injection:l.settings.injection});return}if(!this.authorized(t,s,s.pathname!=="/reindex")){this.sendJson(e,401,{error:"unauthorized",hint:"在插件面板复制接入配置，使用 Bearer 令牌访问。"});return}try{if(t.method==="GET"&&s.pathname==="/vaults"){let l=this.host.getStatus();this.sendJson(e,200,{vaults:l.vaults,indexing:l.indexing});return}if(t.method==="POST"&&s.pathname==="/vaults"){let l=await Z(t),b=(d=L(l.path))==null?void 0:d.trim();if(!b||b.length>4096||b.includes("\0"))throw new z(400,"请输入有效的本机文件夹绝对路径");let S=await this.host.registerVault(b);if(!S.ok){this.sendJson(e,S.status,{error:S.message});return}this.sendJson(e,201,{vault:S.vault});return}if(t.method==="GET"&&s.pathname==="/search"){let l=(u=(c=s.searchParams.get("q"))!=null?c:s.searchParams.get("query"))!=null?u:"";if(!l.trim()){this.sendJson(e,400,{error:"缺少查询参数 q"});return}let b=this.host.search(l,this.optionsFrom(s.searchParams));this.host.recordCitation("search",l,b.hits),this.sendJson(e,200,b);return}if(t.method==="POST"&&s.pathname==="/search"){let l=await Z(t),b=(h=(p=L(l.query))!=null?p:L(l.q))!=null?h:"";if(!b.trim()){this.sendJson(e,400,{error:"缺少 query 字段"});return}let S={limit:F(l.limit),maxChars:F(l.maxChars),vaults:he(l.vaults),sources:tt(l.sources),profile:L(l.profile),minScoreRatio:F(l.minScoreRatio)},q=this.host.search(b,S);this.host.recordCitation("search",b,q.hits),this.sendJson(e,200,q);return}if(t.method==="POST"&&s.pathname==="/context"){let l=await Z(t),b=(m=(g=L(l.query))!=null?g:L(l.q))!=null?m:"";if(!b.trim()){this.sendJson(e,400,{error:"缺少 query 字段"});return}let S=this.host.buildContext(b,F(l.budget),F(l.limit),tt(l.sources),L(l.profile));this.host.recordCitation("context",b,S.hits),this.sendJson(e,200,S);return}if(t.method==="GET"&&s.pathname==="/rules"){let l={query:(w=(x=s.searchParams.get("q"))!=null?x:s.searchParams.get("query"))!=null?w:void 0,topic:(k=s.searchParams.get("topic"))!=null?k:void 0,priority:fe(s.searchParams.get("priority")),limit:F(s.searchParams.get("limit")),sources:tt(s.searchParams.getAll("source")),profile:(v=s.searchParams.get("profile"))!=null?v:void 0},b=this.host.getRules(l);this.host.recordCitation("rules",(R=l.query)!=null?R:"",b.rules.map(S=>({vault:S.vault,path:S.path,title:S.heading||S.text}))),this.sendJson(e,200,b);return}if(t.method==="POST"&&s.pathname==="/rules"){let l=await Z(t),b={query:(P=L(l.query))!=null?P:L(l.q),topic:L(l.topic),priority:fe(l.priority),limit:F(l.limit),sources:tt(l.sources),profile:L(l.profile)},S=this.host.getRules(b);this.host.recordCitation("rules",($=b.query)!=null?$:"",S.rules.map(q=>({vault:q.vault,path:q.path,title:q.heading||q.text}))),this.sendJson(e,200,S);return}if(t.method==="POST"&&s.pathname==="/brief"){let l=await Z(t),b={projectPath:(N=L(l.projectPath))!=null?N:L(l.project),stack:he(l.stack),budget:F(l.budget),limit:F(l.limit),sources:tt(l.sources),profile:L(l.profile)},S=await this.host.buildBrief(b);if(S.error){this.sendJson(e,400,{error:S.error});return}this.host.recordCitation("brief",`brief: ${S.stack.join(", ")}`,S.rules.map(q=>({vault:q.vault,path:q.path,title:q.heading||q.text}))),this.sendJson(e,200,S);return}if(t.method==="GET"&&s.pathname==="/stats"){this.sendJson(e,200,this.host.getStats());return}if(t.method==="POST"&&s.pathname==="/reindex"){await this.host.rebuild();let l=this.host.getStatus();this.sendJson(e,200,{ok:!0,docs:l.totalDocs,chunks:l.totalChunks,rules:l.totalRules});return}this.sendJson(e,404,{error:"not found",endpoints:["/health","/ui","/vaults","/search","/context","/rules","/brief","/stats","/reindex"]})}catch(l){let b=l instanceof z?l.status:500;this.sendJson(e,b,{error:l instanceof Error?l.message:String(l)})}}optionsFrom(t){var e;return{limit:F(t.get("limit")),maxChars:F(t.get("maxChars")),vaults:t.getAll("vault"),sources:tt(t.getAll("source")),profile:(e=t.get("profile"))!=null?e:void 0,minScoreRatio:F(t.get("minScoreRatio"))}}sendHtml(t,e,s){if(t.writableEnded)return;let n=Buffer.from(e,"utf8");t.statusCode=200,t.setHeader("Content-Type","text/html; charset=utf-8"),t.setHeader("Content-Security-Policy",["default-src 'none'",`style-src 'nonce-${s}'`,`script-src 'nonce-${s}'`,"connect-src 'self'","img-src 'none'","base-uri 'none'","form-action 'none'","frame-ancestors 'none'"].join("; ")),t.setHeader("Content-Length",n.length),t.end(n)}redirect(t,e){t.statusCode=303,t.setHeader("Location",e),t.end()}sendJson(t,e,s){if(t.writableEnded)return;let n=JSON.stringify(s,null,2);t.statusCode=e,t.setHeader("Content-Type","application/json; charset=utf-8"),t.setHeader("Content-Length",Buffer.byteLength(n)),t.end(n)}};var ve=require("obsidian");var It=class extends ve.PluginSettingTab{constructor(e,s){super(e,s);this.plugin=s;this.unsubscribe=null}display(){let{containerEl:e}=this;e.empty(),e.addClass("obsidian-quote-settings"),this.unsubscribe||(this.unsubscribe=this.plugin.subscribe(()=>this.display())),jt(e,this.plugin)}hide(){var e;(e=this.unsubscribe)==null||e.call(this),this.unsubscribe=null}};var Tt=class extends J.Plugin{constructor(){super(...arguments);this.ledger=new xt;this.listeners=new Set;this.saveTimer=null;this.rebuildTimer=null;this.watchers=[];this.watchSignature=""}async onload(){await this.loadSettings(),this.indexer=new yt(()=>this.settings,e=>this.configDirForVault(e)),this.server=new Et(this),this.registerView(U,e=>new St(e,this)),this.addRibbonIcon("library","知识库引用",()=>{this.openPanel()}),this.addCommand({id:"open-quote-panel",name:"打开知识库引用面板",callback:()=>{this.openPanel()}}),this.addCommand({id:"rebuild-quote-index",name:"重建知识库索引",callback:()=>{this.rebuild().then(()=>{new J.Notice(`索引完成：${this.indexer.chunkCount} 个段落 / ${this.indexer.ruleCount} 条规则`)}).catch(e=>{new J.Notice(`索引失败：${e instanceof Error?e.message:String(e)}`)})}}),this.addSettingTab(new It(this.app,this)),this.app.workspace.onLayoutReady(()=>{var e;if(this.settings.ui.autoRegisterCurrentVault&&this.settings.vaults.length===0){let s=this.app.vault.adapter,n=(e=s.getBasePath)==null?void 0:e.call(s);if(n){let r=this.settings.vaults.length;if(this.addVault(n).ok&&this.settings.vaults.length>r){let d=this.settings.vaults[this.settings.vaults.length-1];new J.Notice(`已自动登记当前库：${d.name}`),this.saveSettings()}}}this.settings.server.enabled&&this.server.start().catch(s=>{new J.Notice(`引用服务启动失败：${s instanceof Error?s.message:String(s)}`)}),this.syncWatchers(),this.rebuild()})}onunload(){this.saveTimer!==null&&window.clearTimeout(this.saveTimer),this.rebuildTimer!==null&&window.clearTimeout(this.rebuildTimer),this.saveTimer=null,this.rebuildTimer=null,this.listeners.clear(),this.closeWatchers(),this.server.stop()}async loadSettings(){var r,o,d,c,u,p,h;let e=await this.loadData(),s=(r=e==null?void 0:e.settings)!=null?r:e,n=_t();this.settings={vaults:this.normalizeVaults(s==null?void 0:s.vaults),scope:{...n.scope,...(o=s==null?void 0:s.scope)!=null?o:{}},retrieval:{...n.retrieval,...(d=s==null?void 0:s.retrieval)!=null?d:{}},server:{...n.server,...(c=s==null?void 0:s.server)!=null?c:{}},index:{...n.index,...(u=s==null?void 0:s.index)!=null?u:{}},ui:{...n.ui,...(p=s==null?void 0:s.ui)!=null?p:{}},injection:{...n.injection,...(h=s==null?void 0:s.injection)!=null?h:{}},profiles:this.normalizeProfiles(s==null?void 0:s.profiles)};for(let g of["includeFolders","excludeFolders","requiredTags"])Array.isArray(this.settings.scope[g])||(this.settings.scope[g]=[]);this.settings.server.token||(this.settings.server.token=n.server.token),typeof this.settings.index.watch!="boolean"&&(this.settings.index.watch=!0),typeof this.settings.ui.advanced!="boolean"&&(this.settings.ui.advanced=!1),typeof this.settings.ui.autoRegisterCurrentVault!="boolean"&&(this.settings.ui.autoRegisterCurrentVault=!0),this.settings.injection.format!=="plain"&&(this.settings.injection.format="markdown"),this.settings.injection.timing!=="brief-first"&&(this.settings.injection.timing="manual"),this.ledger.load(e==null?void 0:e.ledger)}addProfile(e,s){let n=e.trim();if(!n)return{ok:!1,message:"请填写组合名称"};if(this.settings.profiles.some(o=>o.name===n))return{ok:!1,message:"同名组合已存在"};let r=[];for(let o of s){let d=o.trim();if(!d)continue;let c=d.indexOf("/"),u=(c===-1?d:d.slice(0,c)).trim(),p=c===-1?"":d.slice(c+1).replace(/\\/g,"/").replace(/^\/+|\/+$/g,"").trim(),h=this.settings.vaults.find(x=>x.id===u),g=this.settings.vaults.filter(x=>x.name.toLowerCase()===u.toLowerCase());if(!h&&g.length>1)return{ok:!1,message:`存在同名知识库：${u}，请使用知识库 id 指定来源`};let m=h!=null?h:g[0];if(!m)return{ok:!1,message:`未登记的知识库：${u}`};if(p){let x=et.join(m.path,p);if(!O.existsSync(x)||!O.statSync(x).isDirectory())return{ok:!1,message:`子目录不存在：${m.name}/${p}`}}r.push({vault:m.name,vaultId:m.id,path:p||void 0})}return r.length===0?{ok:!1,message:"至少填写一个来源"}:(this.settings.profiles.push({id:`P-${Date.now().toString(36)}`,name:n,sources:r}),{ok:!0,message:"已添加组合"})}async saveSettings(){await this.saveData({settings:this.settings,ledger:this.ledger.toJSON()}),this.syncWatchers()}async writeHarnessConfig(){let e=et.join(be.homedir(),".obsidian-quote"),s=et.join(e,"config.json"),n={url:this.server.url,token:this.settings.server.token};try{O.mkdirSync(e,{recursive:!0,mode:448}),process.platform!=="win32"&&O.chmodSync(e,448);let r="";if(O.existsSync(s)){process.platform!=="win32"&&O.chmodSync(s,384);try{O.copyFileSync(s,`${s}.bak`),process.platform!=="win32"&&O.chmodSync(`${s}.bak`,384),r="（原文件已备份为 config.json.bak）"}catch(o){}}return O.writeFileSync(s,`${JSON.stringify(n,null,2)}
`,{encoding:"utf8",mode:384}),process.platform!=="win32"&&O.chmodSync(s,384),{ok:!0,message:`接入配置已写入 ${s}${r}`}}catch(r){return{ok:!1,message:`写入接入配置失败：${r instanceof Error?r.message:String(r)}`}}}scheduleSave(e=250){this.saveTimer!==null&&window.clearTimeout(this.saveTimer),this.saveTimer=window.setTimeout(()=>{this.saveTimer=null,this.saveSettings()},e)}scheduleRebuild(e=600){this.rebuildTimer!==null&&window.clearTimeout(this.rebuildTimer),this.rebuildTimer=window.setTimeout(()=>{this.rebuildTimer=null,this.rebuild()},e)}async rebuild(){await this.indexer.build(),this.notify()}subscribe(e){return this.listeners.add(e),()=>{this.listeners.delete(e)}}notify(){for(let e of Array.from(this.listeners))e()}addVault(e){let s=K(e);if(!re(s))return{ok:!1,message:"路径不存在或不是文件夹"};let n=nt(s);return this.settings.vaults.some(r=>r.id===n)?{ok:!1,message:"该知识库已登记"}:(this.settings.vaults.push(it(s)),{ok:!0,message:"已添加"})}async registerVault(e){if(!ie(e))return{ok:!1,status:400,message:"请输入有效的本机文件夹绝对路径"};let s=this.addVault(e);if(!s.ok)return{ok:!1,status:s.message==="该知识库已登记"?409:400,message:s.message};let n=this.settings.vaults[this.settings.vaults.length-1];try{await this.saveSettings()}catch(r){throw this.settings.vaults=this.settings.vaults.filter(o=>o.id!==n.id),r}return this.scheduleRebuild(0),{ok:!0,vault:{id:n.id,name:n.name,enabled:n.enabled}}}async openPanel(){var n;let e=this.app.workspace.getLeavesOfType(U)[0];if(e){await this.app.workspace.revealLeaf(e);return}let s=(n=this.app.workspace.getRightLeaf(!1))!=null?n:this.app.workspace.getLeaf(!0);await s.setViewState({type:U,active:!0}),await this.app.workspace.revealLeaf(s)}getSettings(){return this.settings}getStatus(){let e=new Map(this.indexer.statsList.map(s=>[s.vaultId,s]));return{version:this.manifest.version,vaults:this.settings.vaults.map(s=>{var r,o,d;let n=e.get(s.id);return{id:s.id,name:s.name,path:s.path,enabled:s.enabled,docs:(r=n==null?void 0:n.docs)!=null?r:0,chunks:(o=n==null?void 0:n.chunks)!=null?o:0,rules:(d=n==null?void 0:n.rules)!=null?d:0,error:n==null?void 0:n.error}}),totalDocs:this.indexer.docCount,totalChunks:this.indexer.chunkCount,totalRules:this.indexer.ruleCount,indexing:this.indexer.isBuilding,lastBuiltAt:this.indexer.lastBuiltAt,server:{running:this.server.running,url:this.server.url,port:this.server.port},settings:this.settings}}search(e,s={}){return this.indexer.ensureFresh(),this.indexer.search(e,s)}buildContext(e,s,n,r,o){return this.indexer.ensureFresh(),this.indexer.buildContext(e,s,n,r,o)}getRules(e){return this.indexer.ensureFresh(),this.indexer.getRules(e)}buildBrief(e){return this.indexer.ensureFresh(),this.indexer.buildBrief(e)}getStats(){return this.ledger.getStats()}recordCitation(e,s,n){this.ledger.record(e,s,n),this.scheduleSave(4e3)}configDirForVault(e){var n,r;let s=(r=(n=this.app.vault.adapter).getBasePath)==null?void 0:r.call(n);if(!(!s||et.relative(s,e)!==""))return this.app.vault.configDir}syncWatchers(){let e=`${this.settings.index.watch}|${this.settings.vaults.filter(s=>s.enabled).map(s=>s.path).join("|")}`;if(e!==this.watchSignature&&(this.watchSignature=e,this.closeWatchers(),!!this.settings.index.watch)){for(let s of this.settings.vaults)if(s.enabled)try{let n=O.watch(s.path,{recursive:!0},(r,o)=>{typeof o=="string"&&o.length>0&&!this.isRelevantChange(o,s.path)||this.scheduleRebuild(1200)});n.on("error",()=>{}),this.watchers.push(n)}catch(n){new J.Notice(`知识库文件监听不可用，请手动重建索引：${n instanceof Error?n.message:String(n)}`)}}}isRelevantChange(e,s){var c,u;let n=e.replace(/\\/g,"/");if(n.split("/").some(p=>p.startsWith(".")||p==="node_modules"))return!1;let o=(c=this.configDirForVault(s))==null?void 0:c.replace(/\\/g,"/").replace(/\/+$/,"");return o&&mt(n,o)?!1:((u=n.split("/").pop())!=null?u:n).toLowerCase().endsWith(".md")}closeWatchers(){for(let e of this.watchers)try{e.close()}catch(s){}this.watchers=[]}normalizeProfiles(e){if(!Array.isArray(e))return[];let s=[];for(let n of e){if(!n||typeof n!="object")continue;let r=n;if(typeof r.name!="string"||!r.name.trim()||!Array.isArray(r.sources))continue;let o=[];for(let d of r.sources){if(!d||typeof d!="object")continue;let c=d;typeof c.vault!="string"||!c.vault.trim()||o.push({vault:c.vault,vaultId:typeof c.vaultId=="string"?c.vaultId:void 0,path:typeof c.path=="string"?c.path:void 0})}o.length!==0&&s.push({id:typeof r.id=="string"&&r.id?r.id:`P-${s.length+1}`,name:r.name.trim(),sources:o})}return s}normalizeVaults(e){if(!Array.isArray(e))return[];let s=[],n=new Set;for(let r of e){if(!r||typeof r!="object")continue;let o=r;if(typeof o.path!="string"||o.path.trim().length===0)continue;let d=K(o.path),c=nt(d);n.has(c)||(n.add(c),s.push({id:c,name:typeof o.name=="string"&&o.name.trim()?o.name:vt(d),path:d,enabled:o.enabled!==!1}))}return s}};
