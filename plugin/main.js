/*
Obsidian Quote — local, read-only vault retrieval for AI coding harnesses.
Built with esbuild. Do not edit the bundled output.
*/
"use strict";var ve=Object.create;var lt=Object.defineProperty;var be=Object.getOwnPropertyDescriptor;var ye=Object.getOwnPropertyNames;var xe=Object.getPrototypeOf,we=Object.prototype.hasOwnProperty;var ke=(s,t)=>{for(var e in t)lt(s,e,{get:t[e],enumerable:!0})},Dt=(s,t,e,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of ye(t))!we.call(s,i)&&i!==e&&lt(s,i,{get:()=>t[i],enumerable:!(n=be(t,i))||n.enumerable});return s};var M=(s,t,e)=>(e=s!=null?ve(xe(s)):{},Dt(t||!s||!s.__esModule?lt(e,"default",{value:s,enumerable:!0}):e,s)),Se=s=>Dt(lt({},"__esModule",{value:!0}),s);var fn={};ke(fn,{default:()=>Et});module.exports=Se(fn);var O=M(require("fs")),me=M(require("os")),Rt=M(require("path")),U=require("obsidian");var jt=require("crypto"),J="obsidian-quote-panel",Mt="obsidian-quote";function Ce(){return(0,jt.randomBytes)(32).toString("hex")}function Bt(){return{vaults:[],scope:{includeFolders:[],excludeFolders:[],requiredTags:[]},retrieval:{topK:5,maxCharsPerSnippet:1200,totalCharsBudget:6e3,perFileLimit:3,minScoreRatio:.2},server:{enabled:!0,host:"127.0.0.1",port:43117,token:Ce()},index:{refreshSeconds:120,maxFileSizeKB:512,watch:!0},ui:{advanced:!1,autoRegisterCurrentVault:!0},injection:{format:"markdown",timing:"manual"},profiles:[]}}var H=M(require("fs")),et=M(require("path"));var ut=M(require("fs")),F=M(require("path"));var ct={must:"## 必须",should:"## 建议",tip:"## 可选"};function _t(s,t,e){return e==="plain"?`查询：${s} · ${t} 段`:`<!-- obsidian-quote: query="${s}" snippets=${t} -->`}var Re=new Set(["node_modules",".git",".svn",".hg","dist","build","out",".next",".nuxt",".output","target","venv",".venv","__pycache__",".idea",".vscode","coverage",".cache",".turbo"]),Ee={vue:["vue"],nuxt:["nuxt","vue"],react:["react"],"react-dom":["react"],next:["next","react"],svelte:["svelte"],typescript:["typescript"],vite:["vite"],webpack:["webpack"],tailwindcss:["tailwind"],sass:["css"],less:["css"],pinia:["vue","state"],vuex:["vue","state"],redux:["react","state"],"@nestjs/core":["node"],express:["node"],koa:["node"],fastify:["node"],antd:["react"],"element-plus":["vue"],"ant-design-vue":["vue"],vitest:["testing"],jest:["testing"]},Ie=[{pattern:/^tsconfig.*\.json$/i,stack:["typescript"]},{pattern:/^vite\.config\./i,stack:["vite"]},{pattern:/^next\.config\./i,stack:["next","react"]},{pattern:/^nuxt\.config\./i,stack:["nuxt","vue"]},{pattern:/^tailwind\.config\./i,stack:["tailwind"]},{pattern:/^eslint\.config\.|^\.eslintrc/i,stack:["eslint"]},{pattern:/^pyproject\.toml$|^requirements\.txt$|^setup\.py$/i,stack:["python"]},{pattern:/^go\.mod$/i,stack:["go"]},{pattern:/^Cargo\.toml$/i,stack:["rust"]},{pattern:/^pom\.xml$|^build\.gradle/i,stack:["java"]},{pattern:/^platformio\.ini$/i,stack:["embedded"]},{pattern:/\.uvprojx$|\.ioc$/i,stack:["embedded"]}],Ft={".vue":{stack:["vue"],min:1},".tsx":{stack:["react","typescript"],min:1},".jsx":{stack:["react"],min:1},".ts":{stack:["typescript"],min:3},".js":{stack:["javascript"],min:3},".py":{stack:["python"],min:1},".c":{stack:["c"],min:3},".h":{stack:["c"],min:3},".cpp":{stack:["cpp"],min:1},".ino":{stack:["embedded"],min:1},".go":{stack:["go"],min:1},".rs":{stack:["rust"],min:1},".java":{stack:["java"],min:1},".css":{stack:["css"],min:3},".scss":{stack:["css"],min:1}},Pe={vue:["组件","样式","状态管理","目录结构","命名","类型"],nuxt:["组件","目录结构","样式","状态管理"],react:["组件","状态管理","目录结构","命名","类型"],next:["目录结构","组件","样式","性能"],svelte:["组件","样式","状态管理"],typescript:["类型","命名","注释"],javascript:["命名","注释","错误处理","格式"],node:["接口","错误处理","配置","日志"],python:["命名","注释","错误处理","测试"],embedded:["命名","注释","配置","错误处理"],c:["命名","注释","错误处理"],cpp:["命名","注释","错误处理"],rust:["命名","注释","错误处理","测试"],go:["命名","注释","错误处理","测试"],java:["命名","注释","错误处理","测试"],css:["样式","命名"],tailwind:["样式"],vite:["配置","目录结构"],webpack:["配置","目录结构"],eslint:["格式","命名"],testing:["测试"],state:["状态管理"]},Ht=600,Te=[{stack:"vue",pattern:/(vue|pinia|vuex|element-plus|elementplus)/i},{stack:"react",pattern:/(react|jsx|redux)/i},{stack:"next",pattern:/next\.?js/i},{stack:"embedded",pattern:/(stm32|gpio|单片机|寄存器|中断|串口|定时器|外设|keil|mdk|固件库)/i},{stack:"python",pattern:/(python|django|flask|pip install)/i},{stack:"rust",pattern:/(rust|cargo)/i},{stack:"go",pattern:/(golang|goroutine|go\.mod)/i},{stack:"java",pattern:/(java|spring boot|maven|gradle)/i},{stack:"vite",pattern:/\bvite\b/i},{stack:"tailwind",pattern:/tailwind/i}],$e=new Set(["vue","nuxt","react","next","svelte","css","tailwind","vite","html"]);function zt(s,t){let e=new Set(t),n=`${s.text} ${s.heading} ${s.path} ${s.tags.join(" ")}`;return!Array.from(e).some(r=>$e.has(r))&&/(kebab-case|类名|scss|tailwind|样式表|颜色值|背景色|var\(--)/i.test(n)?!0:Te.some(r=>!e.has(r.stack)&&r.pattern.test(n))}function tt(s,t){for(let e of t)s.includes(e)||s.push(e)}async function Vt(s,t,e,n){var i,r;try{let o=await ut.promises.readFile(s,"utf8"),u=JSON.parse(o),l=Object.keys({...(i=u.dependencies)!=null?i:{},...(r=u.devDependencies)!=null?r:{}}),c=[];for(let p of l){let h=Ee[p];h&&tt(c,h)}c.length>0&&(tt(e,c),n.length<2&&n.push(`${t}：${c.slice(0,4).join("、")}`))}catch(o){n.push(`${t} 无法解析`)}}async function Wt(s){let t=[],e=[],n=F.resolve(s),i;try{i=await ut.promises.readdir(n,{withFileTypes:!0})}catch(h){return{stack:t,evidence:["项目路径不可读"]}}i.find(h=>h.isFile()&&h.name==="package.json")&&await Vt(F.join(n,"package.json"),"package.json",t,e);let o=[];for(let h of i)if(h.isFile()){for(let v of Ie)if(v.pattern.test(h.name)){tt(t,v.stack),o.push(h.name);break}}o.length>0&&e.push(`配置文件：${o.slice(0,4).join("、")}`);let u=new Map,l=0,c=async(h,v)=>{var x;if(l>Ht||v>2)return;let m;try{m=await ut.promises.readdir(h,{withFileTypes:!0})}catch(w){return}for(let w of m){if(l++,l>Ht)return;if(w.isDirectory()){if(w.name.startsWith(".")||Re.has(w.name.toLowerCase()))continue;await c(F.join(h,w.name),v+1)}else if(w.isFile()){if(w.name==="package.json"&&v>=1&&v<=2){let b=F.relative(n,F.join(h,w.name)).replace(/\\/g,"/");await Vt(F.join(h,w.name),b,t,e);continue}let k=F.extname(w.name).toLowerCase();Ft[k]&&u.set(k,((x=u.get(k))!=null?x:0)+1)}}};await c(n,0);let p=[];for(let[h,v]of u){let m=Ft[h];v>=m.min&&(tt(t,m.stack),p.some(x=>x.startsWith(h))||p.push(`${v} 个 ${h}`))}return p.length>0&&e.push(p.slice(0,4).join("，")),{stack:t.slice(0,8),evidence:e}}function Jt(s){var e;let t=["命名","目录结构","注释","格式"];for(let n of s)tt(t,(e=Pe[n])!=null?e:[]);return t}function Ne(s){let t=s.count>1?`（${s.count} 篇同述）`:"";return`- \`${s.id}\` ${s.text}${t} — ${s.path}`}function Qt(s,t,e,n){let i=[`<!-- obsidian-quote brief | stack: ${s.join(", ")||"unknown"} | rules: ${e.length} -->`,"## 适用范围",s.length>0?s.join("、"):"未识别技术栈（可显式指定 stack）"];t.length>0&&i.push(`依据：${t.slice(0,3).join("；")}`);let r="> 只读引用自本地 Obsidian 知识库；与项目既有配置冲突时，以项目配置为准。",o=[{title:ct.must,priority:"must"},{title:ct.should,priority:"should"},{title:ct.tip,priority:"tip"}],u=[],l=i.join(`
`).length+2+r.length,c=0;for(let h of o){let v=e.filter(w=>w.priority===h.priority);if(v.length===0)continue;let m=[],x=h.title.length+2;for(let w of v){let k=Ne(w);if(l+x+k.length+1>n)break;m.push(k),x+=k.length+1}m.length>0&&(u.push("",h.title,...m),l+=x,c+=m.length)}if(c===0){let h="知识库中暂未提取到可执行条款，可改用检索片段（search / context）。";u.push("",h),l+=h.length+2}let p=[...i,...u,"",r].join(`
`);return p.length>n&&(p=p.slice(0,n)),{stack:s,evidence:t,markdown:p,used:p.length,ruleCount:c}}var pt=M(require("path")),Le=/^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/,qe=/^(#{1,6})\s+(.+?)\s*#*\s*$/,Ut=/^\s*(```+|~~~+)/,Kt=/(^|[\s(（【])#([\p{L}\p{N}_/-]*[\p{L}_][\p{L}\p{N}_/-]*)/gu;function Gt(s){return s.trim().replace(/^["']|["']$/g,"").trim()}function dt(s,t){let e=Gt(t).replace(/^#/,"").trim();e&&(s.includes(e)||s.push(e))}function Oe(s){let t=[],e="",n=s.split(/\r?\n/),i=!1;for(let r of n){let o=/^tags\s*:\s*(.*)$/i.exec(r);if(o){let l=o[1].trim();i=l.length===0,l.startsWith("[")?l.replace(/^\[|\]$/g,"").split(",").forEach(c=>dt(t,c)):l.length>0&&l.split(",").forEach(c=>dt(t,c));continue}let u=/^title\s*:\s*(.*)$/i.exec(r);if(u){e=Gt(u[1]),i=!1;continue}if(i){let l=/^\s*-\s+(.+)$/.exec(r);if(l){dt(t,l[1]);continue}/^\S/.test(r)&&(i=!1)}}return{title:e,tags:t}}function Ae(s,t){let e=!1,n="";for(let i of s){let r=Ut.exec(i);if(r){e?i.trim().startsWith(n.repeat(3))&&(e=!1):(e=!0,n=r[1][0]);continue}if(e||/^\s*#{1,6}\s/.test(i))continue;Kt.lastIndex=0;let o;for(;(o=Kt.exec(i))!==null;)dt(t,o[2])}}function De(s,t){let e=s.split(/\r?\n/),n=[],i=[],r=[],o="",u=!1,l="",c=()=>{let p=r.join(`
`).trim();p&&n.push({heading:o,text:p}),r=[]};for(let p of e){let h=Ut.exec(p);if(h){u?p.trim().startsWith(l.repeat(3))&&(u=!1):(u=!0,l=h[1][0]),r.push(p);continue}if(!u){let v=qe.exec(p);if(v){c();let m=v[1].length;for(;i.length>0&&i[i.length-1].level>=m;)i.pop();i.push({level:m,text:v[2].trim()});let x=i.map(w=>w.text);x.length>1&&x[0]===t&&x.shift(),o=x.filter((w,k)=>w!==x[k-1]).join(" › ");continue}}r.push(p)}return c(),n}function Xt(s,t){let e=s.replace(/^\uFEFF/,""),n=Le.exec(e),i="",r=e;n&&(i=n[1],r=e.slice(n[0].length));let o=Oe(i),u=o.tags.slice();Ae(r.split(/\r?\n/),u);let l=pt.basename(t,pt.extname(t)),c=o.title||l;return{title:c,tags:u,sections:De(r,c)}}var Yt=M(require("crypto"));var je=/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]+/g,Me=/[a-z0-9_]+/g;function Q(s){let t=[];if(!s)return t;let e=s.toLowerCase(),n=e.match(Me);if(n)for(let r of n)r.length>1&&t.push(r);let i=e.match(je);if(i)for(let r of i){if(r.length===1){t.push(r);continue}for(let o=0;o<r.length-1;o++)t.push(r.slice(o,o+2))}return t}var Be=/(必须|禁止|严禁|不得|不允许|务必|一定要|\bmust\b|\bnever\b|\brequired\b|\bshall\b)/i,_e=/(应该|应当|推荐|建议|统一|\bshould\b|\brecommend|\bprefer\b)/i,Fe=/(避免|不要|不建议|注意|切勿|\bavoid\b|\bdon'?t\b)/i,He=/(不建议|不推荐|不提倡|不要求|不需要|不必|无须|无需|不应|不应该|不应当|\bnot\s+recommend|\bnot\s+prefer|\bshould\s+not\b)/i,Zt={命名:["命名","名称","大小写","camel","pascal","kebab","snake"],目录结构:["目录","文件夹","工程结构","分层","src/"],注释:["注释","jsdoc","docstring","文档注释"],格式:["缩进","分号","引号","格式化","prettier","eslint","代码风格"],错误处理:["错误处理","异常","try","catch","兜底","错误码"],组件:["组件","props","emit","slot","component"],样式:["样式","css","scss","类名","tailwind"],类型:["类型","interface","泛型","typescript"],接口:["接口","api","请求","rest"],状态管理:["状态管理","pinia","vuex","redux","store"],测试:["测试","单测","覆盖率","test"],提交:["提交","commit","分支","git"],配置:["配置","环境变量","config","setting"],性能:["性能","优化","缓存","懒加载"],安全:["安全","鉴权","权限","token"],数据库:["数据库","sql","表结构"],日志:["日志","log","打印"]},te=Object.keys(Zt),Ve={must:1.4,should:1.15,tip:.9},ze=60;function We(s){return s.replace(/(`+)(.*?)\1|\*\*|__|\s+/g,(t,e)=>e?t:/^\s/.test(t)?" ":"").replace(/^[-*+>\s]+/,"").trim()}function Je(s){let t=s.replace(/```[\s\S]*?```/g,`
`),e=[];for(let n of t.split(/\r?\n/)){let i=n.trim();if(i&&!/^#{1,6}\s/.test(i)){if(i.startsWith("|")){let r=i.split("|").map(o=>o.trim()).filter(o=>o.length>0);r.length>=2&&!/^[-:\s]+$/.test(r[0])&&e.push({text:`${r[0]}：${r[1]}`,raw:r.join("；")});continue}if(i=i.replace(/^>\s*/,""),i=i.replace(/^[-*+]\s+/,"").replace(/^\d+[.)]\s+/,""),!!i)for(let r of i.split(/(?<=[。！？；!?;])\s*/)){let o=r.trim();o&&e.push({text:o,raw:o})}}}return e}function Qe(s){return Be.test(s)?"must":He.test(s)?"tip":_e.test(s)?"should":Fe.test(s)?"tip":null}function Ke(s){let t=s.toLowerCase(),e=[];for(let n of te)if(Zt[n].some(r=>t.includes(r.toLowerCase()))&&e.push(n),e.length>=4)break;return e}function Ue(s){let t=/^([^：:]{1,14})[：:]\s*(.{2,60})$/.exec(s);if(!t)return!1;let e=t[1].trim();if(!te.includes(e))return!1;let n=t[2].trim();return n.length>40?!1:/[A-Za-z`]/.test(n)||/(PascalCase|camelCase|kebab-case|snake_case|大写|小写|单引号|双引号|分号|缩进)/i.test(n)}var Ge=/^(一句话|相关|前置|下游|上游|参见|详见|命名拆解|目录结构说明)\s*[：:]/;function Xe(s){return!!(/^(\[\[[^\]]*\]\]\s*)+$/.test(s)||/^(来源|参考资料|参考文献|图|表|示例|目录|索引|返回|上一篇|下一篇)\s*[：:]?/.test(s)&&s.length<12)}function ht(s){return s.trim()}function Ye(s){return`R-${Yt.createHash("sha256").update(ht(s)).digest("hex").slice(0,16).toUpperCase()}`}function It(s){return Ve[s]}function ee(s,t){let e=[],n=new Set;for(let i of Je(s)){if(e.length>=ze)break;let r=We(i.text);if(r.length<6||r.length>180||!/[\p{L}]/u.test(r)||Xe(r)||Ge.test(r)||/[：:，,、]$/.test(r))continue;let o=Qe(i.raw);if(!o){if(!Ue(r)||r.length>80)continue;o="tip"}let u=ht(r);if(!u||n.has(u))continue;n.add(u);let l=Ke(`${r} ${t.heading}`),c=Array.from(new Set(Array.from(r.matchAll(/`([^`\n]{1,40})`/g)).map(m=>m[1]))).slice(0,3),p=new Map,h=(m,x)=>{var w;if(m)for(let k of Q(m))p.set(k,((w=p.get(k))!=null?w:0)+x)};h(r,3),h(t.heading,2),h(t.tags.join(" "),1);let v=0;for(let m of p.values())v+=m;e.push({id:Ye(r),text:r,priority:o,topics:l,code:c,tags:t.tags.slice(0,8),vaultId:t.vaultId,vault:t.vault,path:t.path,heading:t.heading,updated:t.updated,count:1,tf:p,length:v})}return e}function ft(s){return{id:s.id,text:s.text,priority:s.priority,topics:s.topics,code:s.code,tags:s.tags,vaultId:s.vaultId,vault:s.vault,path:s.path,heading:s.heading,updated:s.updated,count:s.count}}var Ze=new Set([".obsidian",".git",".trash",".stfolder",".stversions","node_modules","__pycache__",".venv","venv",".idea",".vscode",".next",".nuxt",".cache",".tox",".mypy_cache",".pytest_cache"]),G=1.2,X=.6,tn=/(资料来源|参考资料|参考文献|来源|关系|相关笔记|相关链接|目录|索引|导航|总览|references?|sources?|see also|related)/i;function en(s,t){var u;let e=s.length;if(e===0)return 0;let r=((u=s.match(/\[\[[^\]]*\]\]|\[[^\]]*\]\([^)]*\)/g))!=null?u:[]).reduce((l,c)=>l+c.length,0)/e,o=1;return e<80&&(o*=.85),r>.4?o*=.55:r>.2&&(o*=.8),tn.test(t)&&(o*=.6),o}function Nt(s){return s.trim().replace(/\\/g,"/").replace(/^\.\//,"").replace(/^\/+/,"").replace(/\/+$/,"")}function Pt(s,t){return t?s===t||s.startsWith(t+"/"):!1}function ne(s){return{...s,tf:new Map(s.tf),count:1}}function Tt(s){let t=new Map;for(let e of s){let n=ht(e.text),i=t.get(n);i?i.count+=1:t.set(n,ne(e))}return Array.from(t.values())}function nn(s,t){if(s.length<=t)return[s];let e=[],n="",i=()=>{n.trim()&&e.push(n.trim()),n=""};for(let r of s.split(/\n{2,}/))for((n?`${n}

${r}`:r).length>t&&n&&i(),n=n?`${n}

${r}`:r;n.length>t;)e.push(n.slice(0,t)),n=n.slice(t);return i(),e}async function sn(s,t){let e=[],n=t.scope.includeFolders.map(Nt).filter(Boolean),i=t.scope.excludeFolders.map(Nt).filter(Boolean),r=async o=>{let u;try{u=await H.promises.readdir(o?et.join(s,o):s,{withFileTypes:!0})}catch(l){return}for(let l of u){let c=o?`${o}/${l.name}`:l.name;if(l.isDirectory()){if(l.name.startsWith(".")||Ze.has(l.name.toLowerCase())||i.some(p=>Pt(c,p)))continue;await r(c)}else if(l.isFile()&&l.name.toLowerCase().endsWith(".md")){if(i.some(p=>Pt(c,p))||n.length>0&&!n.some(p=>Pt(c,p)))continue;e.push(c)}}};return await r(""),e.sort(),e}function rn(s,t){if(t.length===0)return!0;let e=s.map(n=>n.toLowerCase());return t.some(n=>e.includes(n.toLowerCase()))}function on(s,t,e,n,i,r,o,u){let l=new Map,c=(h,v)=>{var m;if(h)for(let x of Q(h))l.set(x,((m=l.get(x))!=null?m:0)+v)};c(n,3),c(i,2),c(o.join(" "),2),c(e,1),c(r,1);let p=0;for(let h of l.values())p+=h;return{vaultId:s,vaultName:t,relPath:e,title:n,heading:i,text:r,tags:o,mtime:u,length:p,weight:en(r,i),termFreq:l}}function $t(s,t,e){return e.some(n=>n.vaultId===s&&(!n.path||t===n.path||t.startsWith(n.path+"/")))}var gt=class{constructor(t){this.getSettings=t;this.ruleOccurrences=[];this.chunks=[];this.rules=[];this.stats=new Map;this.docFreq=new Map;this.avgLength=0;this.ruleDf=new Map;this.ruleAvgLength=0;this.building=null;this.cache=new Map;this.cacheSignature="";this.lastWarnings=[];this.lastBuiltAt=0}get isBuilding(){return this.building!==null}get chunkCount(){return this.chunks.length}get ruleCount(){return this.rules.length}get docCount(){let t=0;for(let e of this.stats.values())t+=e.docs;return t}get statsList(){return Array.from(this.stats.values())}statsFor(t){return this.stats.get(t)}resolveSources(t,e){var u,l;let n=this.getSettings();if(this.lastWarnings=[],!!!(t&&t.length>0||e))return null;let r=t;if((!r||r.length===0)&&e){let c=n.profiles.find(p=>p.id===e||p.name===e);c||this.lastWarnings.push(`未找到组合「${e}」`),r=c==null?void 0:c.sources}if(!r||r.length===0)return e||this.lastWarnings.push("指定的来源为空，未检索任何知识库"),[];let o=[];for(let c of r){if(!c||typeof c.vault!="string")continue;let p;if(c.vaultId)p=n.vaults.find(h=>h.id===c.vaultId);else{let h=n.vaults.filter(v=>v.name.toLowerCase()===c.vault.toLowerCase());if(h.length>1){this.lastWarnings.push(`来源「${c.vault}」匹配到 ${h.length} 个同名知识库，已跳过；请改用唯一的库名或 vaultId`);continue}p=(u=h[0])!=null?u:n.vaults.find(v=>v.id===c.vault)}if(!p){this.lastWarnings.push(`未找到知识库「${c.vault}」`);continue}o.push({vaultId:p.id,vaultName:p.name,path:Nt((l=c.path)!=null?l:"")})}return o}async build(){return this.building?this.building:(this.building=this.doBuild().finally(()=>{this.building=null}),this.building)}ensureFresh(){if(this.building)return;let t=Math.max(10,this.getSettings().index.refreshSeconds)*1e3;Date.now()-this.lastBuiltAt>t&&this.build()}async doBuild(){var w,k;let t=this.getSettings(),e=[],n=new Map,i=Date.now(),r=Math.max(1,t.index.maxFileSizeKB)*1024,o=Math.max(200,t.retrieval.maxCharsPerSnippet),u=[],l=`${o}|${r}|${t.scope.requiredTags.join(",")}`;this.cacheSignature!==l&&(this.cache.clear(),this.cacheSignature=l);let c=new Map;for(let b of t.vaults){if(!b.enabled){n.set(b.id,{vaultId:b.id,vaultName:b.name,docs:0,chunks:0,rules:0,skipped:0,builtAt:i});continue}let R=0,P=0,N=0,d=0,f;try{if(await H.promises.access(b.path,H.constants.R_OK),!(await H.promises.stat(b.path)).isDirectory())throw new Error("不是目录")}catch(E){n.set(b.id,{vaultId:b.id,vaultName:b.name,docs:0,chunks:0,rules:0,skipped:0,error:E instanceof Error?`路径不可读：${E.message}`:"路径不可读",builtAt:i});continue}let S=await sn(b.path,t);for(let E of S){let B=et.join(b.path,E);try{let a=await H.promises.stat(B);if(a.size>r){d++;continue}let g=`${b.id}|${E}`,y=this.cache.get(g);if(y&&y.mtimeMs===a.mtimeMs&&y.size===a.size&&y.vaultName===b.name){e.push(...y.chunks),u.push(...y.rules.map(ne)),R++,P+=y.chunks.length,N+=y.rules.length,c.set(g,y);continue}let T=await H.promises.readFile(B,"utf8"),$=Xt(T,E);if(!rn($.tags,t.scope.requiredTags)){d++;continue}R++;let A=[],D=[],I=new Date(a.mtimeMs).toISOString();for(let L of $.sections){for(let j of nn(L.text,o))A.push(on(b.id,b.name,E,$.title,L.heading,j,$.tags,a.mtimeMs));D.push(...ee(L.text,{vaultId:b.id,vault:b.name,path:E,heading:L.heading,tags:$.tags,updated:I}))}e.push(...A),u.push(...D),P+=A.length,N+=D.length,c.set(g,{mtimeMs:a.mtimeMs,size:a.size,vaultName:b.name,chunks:A,rules:D})}catch(a){if(d++,!f){let g=a instanceof Error?a.message:String(a);f=`${E}：${g}`}}}n.set(b.id,{vaultId:b.id,vaultName:b.name,docs:R,chunks:P,rules:N,skipped:d,error:f,builtAt:i})}let p=Tt(u),h=new Map,v=0;for(let b of e){v+=b.length;for(let R of b.termFreq.keys())h.set(R,((w=h.get(R))!=null?w:0)+1)}let m=new Map,x=0;for(let b of p){x+=b.length;for(let R of b.tf.keys())m.set(R,((k=m.get(R))!=null?k:0)+1)}this.chunks=e,this.ruleOccurrences=u,this.rules=p,this.docFreq=h,this.avgLength=e.length>0?v/e.length:0,this.ruleDf=m,this.ruleAvgLength=p.length>0?x/p.length:0,this.cache=c,this.stats=n,this.lastBuiltAt=Date.now()}search(t,e={}){var d,f,S,E,B;let n=Date.now(),i=this.getSettings(),r=Math.max(1,(d=e.limit)!=null?d:i.retrieval.topK),o=Math.max(100,(f=e.maxChars)!=null?f:i.retrieval.maxCharsPerSnippet),u=(S=e.minScoreRatio)!=null?S:i.retrieval.minScoreRatio,l=Math.max(1,i.retrieval.perFileLimit),c=t.trim();if(!c||this.chunks.length===0)return{query:t,total:0,tookMs:Date.now()-n,hits:[]};let p=e.vaults&&e.vaults.length>0?new Set(e.vaults.map(a=>a.toLowerCase())):null,h=this.resolveSources(e.sources,e.profile),v=this.lastWarnings.length>0?[...this.lastWarnings]:void 0,m=Array.from(new Set(Q(c))),x=m.length===0?this.literalFallback(c):null;if(m.length===0&&!x)return{query:t,total:0,tookMs:Date.now()-n,hits:[],warnings:v};let w=c.toLowerCase().replace(/\s+/g,""),k=this.chunks.length,b=[];for(let a of this.chunks){if(h){if(!$t(a.vaultId,a.relPath,h))continue}else if(p&&!p.has(a.vaultId.toLowerCase())&&!p.has(a.vaultName.toLowerCase()))continue;let g=0;if(x){let T=`${a.title}
${a.heading}
${a.text}`.match(x);if(!T)continue;g=T.length}else for(let y of m){let T=a.termFreq.get(y);if(!T)continue;let $=(E=this.docFreq.get(y))!=null?E:0,A=Math.log(1+(k-$+.5)/($+.5)),D=T+G*(1-X+X*a.length/(this.avgLength||1));g+=A*T*(G+1)/D}g<=0||(g*=a.weight,!x&&w.length>=2&&(a.text.toLowerCase().replace(/\s+/g,"").includes(w)?g*=1.4:a.title.toLowerCase().includes(c.toLowerCase())&&(g*=1.2)),b.push({chunk:a,score:g}))}b.sort((a,g)=>g.score-a.score||g.chunk.mtime-a.chunk.mtime);let R=b.length>0?b[0].score*Math.max(0,u):0,P=new Map,N=[];for(let a of b){if(N.length>=r||a.score<R)break;let g=`${a.chunk.vaultId}|${a.chunk.relPath}`,y=(B=P.get(g))!=null?B:0;y>=l||(P.set(g,y+1),N.push({vaultId:a.chunk.vaultId,vault:a.chunk.vaultName,path:a.chunk.relPath,title:a.chunk.title,heading:a.chunk.heading,tags:a.chunk.tags,score:Number(a.score.toFixed(4)),updated:new Date(a.chunk.mtime).toISOString(),excerpt:a.chunk.text.length>o?`${a.chunk.text.slice(0,o).trimEnd()}
…`:a.chunk.text}))}return{query:t,total:b.length,tookMs:Date.now()-n,hits:N,warnings:v}}literalFallback(t){if(!/^[A-Za-z0-9_]{1,2}$/.test(t))return null;let e=t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return new RegExp(`(^|[^A-Za-z0-9_])${e}([^A-Za-z0-9_]|$)`,"gi")}buildContext(t,e,n,i,r){var x;let o=this.getSettings(),u=Math.max(200,e!=null?e:o.retrieval.totalCharsBudget),l=this.search(t,{limit:n!=null?n:o.retrieval.topK,maxChars:o.retrieval.maxCharsPerSnippet,sources:i,profile:r}),c=[],p=((x=o.injection)==null?void 0:x.format)==="plain"?"plain":"markdown",h=p==="plain"?`

`:`

---

`,v=96;for(let w of l.hits){let k=[`- 来源：${w.vault} / ${w.path}`];w.tags.length>0&&k.push(`- 标签：${w.tags.join(", ")}`);let R=[`### ${w.heading?`${w.title} › ${w.heading}`:w.title}`,...k,"",w.excerpt].join(`
`),P=c.length>0?h.length:0;if(v+c.reduce((N,d)=>N+d.length,0)+P+R.length>u){if(c.length===0){let N=Math.max(0,u-v);N>0&&c.push(R.slice(0,N))}break}c.push(R)}let m="";if(c.length>0){let w=()=>`${`${_t(t,c.length,p)}

`}${c.join(h)}`;for(m=w();c.length>0&&m.length>u;){let k=m.length-u,b=c[c.length-1];b.length>k+8?c[c.length-1]=`${b.slice(0,Math.max(0,b.length-k-1)).trimEnd()}…`:c.pop(),m=c.length>0?w():""}m.length>u&&(m=m.slice(0,u))}return{query:t,markdown:m,used:m.length,hits:l.hits,warnings:l.warnings}}getRules(t={}){var h,v,m,x,w;let e=Date.now(),n=Math.max(1,Math.min(100,(h=t.limit)!=null?h:20)),i=((v=t.topic)!=null?v:"").trim(),r=((m=t.priority)!=null?m:"").toString().trim().toLowerCase(),o=this.resolveSources(t.sources,t.profile),u=this.lastWarnings.length>0?[...this.lastWarnings]:void 0,l=this.ruleOccurrences;o&&(l=l.filter(k=>$t(k.vaultId,k.path,o))),(r==="must"||r==="should"||r==="tip")&&(l=l.filter(k=>k.priority===r)),i&&(l=l.filter(k=>k.topics.some(b=>b===i||b.includes(i)||i.includes(b)))),l=Tt(l);let c=((x=t.query)!=null?x:"").trim(),p=[];if(c){let k=Array.from(new Set(Q(c))),b=this.rules.length||1;for(let R of l){let P=0;for(let N of k){let d=R.tf.get(N);if(!d)continue;let f=(w=this.ruleDf.get(N))!=null?w:0,S=Math.log(1+(b-f+.5)/(f+.5)),E=d+G*(1-X+X*R.length/(this.ruleAvgLength||1));P+=S*d*(G+1)/E}P<=0||p.push({...ft(R),score:Number((P*It(R.priority)).toFixed(4))})}p.sort((R,P)=>P.score-R.score||P.count-R.count)}else{let k={must:0,should:1,tip:2},b=l.slice().sort((R,P)=>k[R.priority]-k[P.priority]||P.count-R.count);for(let R of b)p.push({...ft(R),score:0})}return{total:p.length,tookMs:Date.now()-e,rules:p.slice(0,n),warnings:u}}async buildBrief(t={}){var R,P,N,d;let e=Math.max(400,(R=t.budget)!=null?R:4e3),n=Math.max(4,Math.min(60,(P=t.limit)!=null?P:24)),i=((N=t.stack)!=null?N:[]).map(f=>f.trim()).filter(Boolean),r=[];if(i.length===0&&t.projectPath){let f=et.resolve(t.projectPath),S=!1;try{S=H.statSync(f).isDirectory()}catch(B){S=!1}if(!S)return{stack:[],evidence:["项目路径不可读"],markdown:`<!-- obsidian-quote brief | error: unreadable project -->

项目路径不可读：${t.projectPath}`,used:0,ruleCount:0,rules:[],error:`项目路径不可读：${t.projectPath}`};let E=await Wt(f);i=E.stack,r=E.evidence}i.length===0&&(i=["通用"]);let o=Jt(i),u=i[0]!=="通用",l=this.resolveSources(t.sources,t.profile),c=this.lastWarnings.length>0?[...this.lastWarnings]:void 0;l&&l.length>0&&(r=[`范围 ${l.map(f=>f.path?`${f.vaultName}/${f.path}`:f.vaultName).join("、")}`,...r]);let p=Array.from(new Set(Q([...i,...o,"规范","约定","命名","目录","风格"].join(" ")))),h=this.rules.length||1,v=[],m=Tt(this.ruleOccurrences.filter(f=>l&&!$t(f.vaultId,f.path,l)||u&&zt(f,i)?!1:f.topics.length===0||f.topics.some(S=>o.includes(S))));for(let f of m){let S=0;for(let a of p){let g=f.tf.get(a);if(!g)continue;let y=(d=this.ruleDf.get(a))!=null?d:0,T=Math.log(1+(h-y+.5)/(y+.5)),$=g+G*(1-X+X*f.length/(this.ruleAvgLength||1));S+=T*g*(G+1)/$}let E=f.topics.filter(a=>o.includes(a)).length*.8,B=(S+E)*It(f.priority);B<=0||v.push({...ft(f),score:Number(B.toFixed(4))})}v.sort((f,S)=>S.score-f.score);let x={must:n,should:Math.ceil(n*.35),tip:n},w={must:0,should:0,tip:0},k=[];for(let f of v){if(k.length>=n)break;w[f.priority]>=x[f.priority]||(w[f.priority]++,k.push(f))}return{...Qt(i,r,k,e),rules:k,warnings:c}}};var mt=class{constructor(){this.queries=0;this.citations=0;this.records=[];this.notes=new Map;this.dirty=!1}get isDirty(){return this.dirty}record(t,e,n){this.queries++;let i=new Set,r=[];for(let u of n){let l=`${u.vault}|${u.path}`;i.has(l)||(i.add(l),r.push(u))}this.citations+=r.length;let o=Date.now();for(let u of r){let l=`${u.vault}|${u.path}`,c=this.notes.get(l);c?(c.count++,c.lastAt=o):this.notes.set(l,{vault:u.vault,path:u.path,title:u.title,count:1,lastAt:o})}if(this.records.push({at:o,kind:t,query:e,hits:r.length,top:r.slice(0,3)}),this.records.length>120&&this.records.splice(0,this.records.length-120),this.notes.size>200){let u=Array.from(this.notes.entries()).sort((l,c)=>c[1].count-l[1].count).slice(0,200);this.notes=new Map(u)}this.dirty=!0}getStats(){let t=Array.from(this.notes.values()).sort((n,i)=>i.count-n.count||i.lastAt-n.lastAt).slice(0,8),e=this.records.slice(-10).reverse();return{totalQueries:this.queries,totalCitations:this.citations,topNotes:t,recent:e}}load(t){if(!(!t||typeof t!="object")){if(this.queries=Number.isFinite(t.queries)?Number(t.queries):0,this.citations=Number.isFinite(t.citations)?Number(t.citations):0,this.records=Array.isArray(t.records)?t.records.slice(-120):[],this.notes=new Map,Array.isArray(t.notes))for(let e of t.notes.slice(0,200))!e||typeof e.path!="string"||this.notes.set(`${e.vault}|${e.path}`,e);this.dirty=!1}}toJSON(){return{queries:this.queries,citations:this.citations,records:this.records.slice(-120),notes:Array.from(this.notes.values()).sort((t,e)=>e.count-t.count).slice(0,200)}}clear(){this.queries=0,this.citations=0,this.records=[],this.notes.clear(),this.dirty=!0}};var C=require("obsidian");var se=M(require("crypto")),Y=M(require("fs")),Lt=M(require("os")),V=M(require("path"));function K(s){let t=s.trim();return(t.startsWith('"')&&t.endsWith('"')||t.startsWith("'")&&t.endsWith("'"))&&(t=t.slice(1,-1)),t=t.replace(/^file:\/\//i,""),/^\/[A-Za-z]:\//.test(t)&&(t=t.slice(1)),V.resolve(t)}function nt(s){return se.createHash("sha1").update(s.toLowerCase()).digest("hex").slice(0,12)}function vt(s){return V.basename(s)||s}function ie(s){try{return Y.statSync(s).isDirectory()}catch(t){return!1}}function st(s){let t=K(s);return{id:nt(t),name:vt(t),path:t,enabled:!0}}function re(){var n,i;let s=[];process.env.APPDATA&&s.push(V.join(process.env.APPDATA,"obsidian","obsidian.json")),s.push(V.join(Lt.homedir(),"Library","Application Support","obsidian","obsidian.json")),s.push(V.join(Lt.homedir(),".config","obsidian","obsidian.json"));let t=[],e=new Set;for(let r of s)if(Y.existsSync(r))try{let o=Y.readFileSync(r,"utf8"),l=(n=JSON.parse(o).vaults)!=null?n:{};for(let c of Object.keys(l)){let p=(i=l[c])==null?void 0:i.path;if(!p)continue;let h=K(p),v=nt(h);e.has(v)||(e.add(v),t.push({name:vt(h),path:h}))}}catch(o){}return t}function qt(s){return s.split(/\r?\n/).map(t=>t.trim()).filter(t=>t.length>0)}function oe(s,t,e,n){let i=Number(s);return Number.isFinite(i)?Math.min(e,Math.max(t,Math.round(i))):n}function an(s){return new Date(s).toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"})}function ln(s){let t=s.app;t.setting&&(t.setting.open(),t.setting.openTabById(Mt))}function z(s,t,e){let n=s.createDiv({cls:"oq-card"}),r=n.createDiv({cls:"oq-card-head"}).createDiv({cls:"oq-card-heading"});return r.createEl("h3",{text:t,cls:"oq-card-title"}),e&&r.createEl("p",{text:e,cls:"oq-card-desc"}),n.createDiv({cls:"oq-card-body"})}function bt(s,t,e){let n=s.createDiv({cls:"oq-metric"});n.createDiv({cls:"oq-metric-value",text:String(t)}),n.createDiv({cls:"oq-metric-label",text:e})}function yt(s,t){s.buttonEl.addClass("oq-btn",`oq-btn-${t}`)}function Ot(s,t=!1){s.extraSettingsEl.addClass("oq-icon-btn"),t&&s.extraSettingsEl.addClass("oq-icon-btn-danger")}function it(s){s.toggleEl.addClass("oq-switch")}function ae(s){s.selectEl.addClass("oq-select")}function At(s,t,e={}){s.empty(),s.addClass("obsidian-quote-panel");let n=t.getStatus(),i=t.settings.ui.advanced,r=JSON.stringify({url:n.server.url,token:t.settings.server.token},null,2),o=s.createDiv({cls:"oq-hero"}),u=o.createDiv({cls:"oq-hero-top"}),l=u.createDiv({cls:"oq-hero-heading"});l.createEl("h2",{text:"知识库引用",cls:"oq-title"}),l.createEl("p",{cls:"oq-hint oq-hero-sub",text:"把本地 Obsidian 知识库作为只读参考源，供 AI 编码 harness 按需检索。"});let c=u.createDiv({cls:`oq-pill ${n.indexing?"is-busy":"is-on"}`});c.createSpan({cls:"oq-pill-dot"}),c.createSpan({text:n.indexing?"索引中":"索引就绪"});let p=o.createDiv({cls:"oq-status"}),h=p.createDiv({cls:"oq-status-line"});h.createSpan({cls:`oq-dot ${n.server.running?"is-on":"is-off"}`}),h.createSpan({text:n.server.running?`引用服务运行中 · ${n.server.url}`:"引用服务未启动"}),p.createDiv({cls:"oq-status-meta",text:`${n.vaults.length} 个知识库 · ${n.totalDocs} 篇笔记 · ${n.totalChunks} 个段落 · ${n.totalRules} 条规则${n.indexing?" · 索引中…":""}`});let v=o.createDiv({cls:"oq-metrics"});bt(v,n.vaults.length,"知识库"),bt(v,n.totalDocs,"笔记"),bt(v,n.totalChunks,"段落"),bt(v,n.totalRules,"条款");let m=o.createDiv({cls:"oq-actions"}),x=m.createEl("button",{text:"重建索引",cls:"oq-btn oq-btn-primary"});x.addEventListener("click",()=>{x.setAttribute("disabled","true"),x.setText("索引中…"),t.rebuild().then(()=>{new C.Notice(`索引完成：${t.getStatus().totalChunks} 个段落`)}).catch(a=>{new C.Notice(`索引失败：${a instanceof Error?a.message:String(a)}`)}).finally(()=>{x.removeAttribute("disabled"),x.setText("重建索引")})}),m.createEl("button",{text:"复制接入配置",cls:"oq-btn oq-btn-secondary"}).addEventListener("click",()=>{navigator.clipboard.writeText(r).then(()=>new C.Notice("接入配置已复制"),()=>new C.Notice("复制失败，请手动选择下方配置"))});let k=m.createEl("button",{text:"写入接入配置",cls:"oq-btn oq-btn-secondary"});k.title="写入 ~/.obsidian-quote/config.json，harness 会直接读取",k.addEventListener("click",()=>{k.setAttribute("disabled","true"),t.writeHarnessConfig().then(a=>{new C.Notice(a.message)}).finally(()=>{k.removeAttribute("disabled")})}),e.showSettingsLink&&i&&m.createEl("button",{text:"全部设置",cls:"oq-btn oq-btn-ghost"}).addEventListener("click",()=>ln(t));let b=z(s,"知识库","只读引用，不会修改、移动或迁移笔记。开关表示参与检索。"),R=b.createDiv({cls:"oq-vault-list"});t.settings.vaults.length===0&&R.createEl("p",{cls:"oq-empty",text:"尚未登记知识库。"});for(let a of t.settings.vaults){let g=t.indexer.statsFor(a.id),y=[a.path];g&&y.push(`${g.docs} 篇 / ${g.chunks} 段 / ${g.rules} 条规则`),g!=null&&g.error&&y.push(g.error),new C.Setting(R).setName(a.name).setDesc(y.join(" · ")).addToggle(T=>{it(T),T.setValue(a.enabled).onChange(async $=>{a.enabled=$,await t.saveSettings(),t.scheduleRebuild(0)})}).addExtraButton(T=>{Ot(T,!0),T.setIcon("trash-2").setTooltip("移除").onClick(async()=>{t.settings.vaults=t.settings.vaults.filter($=>$.id!==a.id),await t.saveSettings(),t.scheduleRebuild(0),t.notify()})})}let P="";new C.Setting(b).setName("登记知识库").setDesc("填写知识库根目录的绝对路径。").addText(a=>{a.inputEl.addClass("oq-input"),a.setPlaceholder("D:\\Notes\\MyVault").onChange(g=>{P=g})}).addButton(a=>{yt(a,"primary"),a.setButtonText("添加").onClick(async()=>{let g=P.trim();if(!g){new C.Notice("请先填写知识库路径");return}let y=t.addVault(g);if(!y.ok){new C.Notice(y.message);return}await t.saveSettings(),t.scheduleRebuild(0),t.notify()})}),new C.Setting(b).setName("快速登记").setDesc("从当前打开的库，或本机 Obsidian 配置中读取。").addButton(a=>{yt(a,"secondary"),a.setButtonText("当前库").onClick(async()=>{var T,$;let g=($=(T=t.app.vault.adapter).getBasePath)==null?void 0:$.call(T);if(!g){new C.Notice("无法读取当前库路径");return}let y=t.addVault(g);new C.Notice(y.message),y.ok&&(await t.saveSettings(),t.scheduleRebuild(0),t.notify())})}).addButton(a=>{yt(a,"secondary"),a.setButtonText("扫描本机").onClick(async()=>{let g=re(),y=0;for(let T of g){let $=K(T.path);t.settings.vaults.some(A=>A.id===st($).id)||(t.settings.vaults.push(st($)),y++)}new C.Notice(g.length===0?"未在本机配置中找到知识库":`新增 ${y} 个知识库`),y!==0&&(await t.saveSettings(),t.scheduleRebuild(0),t.notify())})});let N=z(s,"引用范围","目录均相对知识库根目录，每行一条；留空表示不限。");new C.Setting(N).setName("包含目录").setDesc("仅检索这些目录下的笔记。留空表示全库。").addTextArea(a=>{a.inputEl.rows=3,a.inputEl.addClass("oq-textarea"),a.setPlaceholder(`10-规范
20-项目`).setValue(t.settings.scope.includeFolders.join(`
`)).onChange(g=>{t.settings.scope.includeFolders=qt(g),t.scheduleSave(),t.scheduleRebuild(1200)})}),new C.Setting(N).setName("排除目录").setDesc("这些目录不参与检索。").addTextArea(a=>{a.inputEl.rows=3,a.inputEl.addClass("oq-textarea"),a.setPlaceholder(`archive
templates`).setValue(t.settings.scope.excludeFolders.join(`
`)).onChange(g=>{t.settings.scope.excludeFolders=qt(g),t.scheduleSave(),t.scheduleRebuild(1200)})}),new C.Setting(N).setName("仅含标签").setDesc("笔记需至少带有一个标签，逗号分隔；留空表示不过滤。").addText(a=>{a.inputEl.addClass("oq-input"),a.setPlaceholder("规范, 代码风格").setValue(t.settings.scope.requiredTags.join(", ")).onChange(g=>{t.settings.scope.requiredTags=g.split(",").map(y=>y.trim().replace(/^#/,"")).filter(y=>y.length>0),t.scheduleSave(),t.scheduleRebuild(1200)})});let d=z(s,"检索参数","控制单次引用的条数与篇幅，避免一次注入过多内容。"),f=(a,g,y,T,$,A,D)=>{new C.Setting(d).setName(a).setDesc(g).addText(I=>{I.inputEl.type="number",I.inputEl.min=String(T),I.inputEl.max=String($),I.inputEl.addClass("oq-input","oq-input-number"),I.setValue(String(y)).onChange(L=>{D(oe(L,T,$,A))})})};if(f("单次引用条数","默认 5，范围 1–50。",t.settings.retrieval.topK,1,50,5,a=>{t.settings.retrieval.topK=a,t.scheduleSave()}),f("单段最大字符","默认 1200，范围 200–8000。超出会切分段落。",t.settings.retrieval.maxCharsPerSnippet,200,8e3,1200,a=>{t.settings.retrieval.maxCharsPerSnippet=a,t.scheduleSave(),t.scheduleRebuild(1200)}),f("单次总字符预算","默认 6000，范围 500–40000。超出预算的片段不再引用。",t.settings.retrieval.totalCharsBudget,500,4e4,6e3,a=>{t.settings.retrieval.totalCharsBudget=a,t.scheduleSave()}),f("单篇最多片段","默认 3，避免同一篇笔记占满结果。",t.settings.retrieval.perFileLimit,1,10,3,a=>{t.settings.retrieval.perFileLimit=a,t.scheduleSave()}),new C.Setting(d).setName("最低相关度").setDesc("默认 0.2，相对最高分的比例，范围 0–1。").addText(a=>{a.inputEl.type="number",a.inputEl.min="0",a.inputEl.max="1",a.inputEl.step="0.05",a.inputEl.addClass("oq-input","oq-input-number"),a.setValue(String(t.settings.retrieval.minScoreRatio)).onChange(g=>{let y=Number(g);Number.isFinite(y)&&(t.settings.retrieval.minScoreRatio=Math.min(1,Math.max(0,y)),t.scheduleSave())})}),new C.Setting(d).setName("自动跟随文件变化").setDesc("笔记新增或保存后自动增量重建索引。").addToggle(a=>{it(a),a.setValue(t.settings.index.watch).onChange(async g=>{t.settings.index.watch=g,await t.saveSettings(),t.notify()})}),i){let a=z(s,"引用组合","把多个库或库内子目录打包成一个来源，harness 侧用 --profile 名称 一次引用。"),g=a.createDiv({cls:"oq-vault-list"});t.settings.profiles.length===0&&g.createEl("p",{cls:"oq-empty",text:"尚未创建组合。"});for(let I of t.settings.profiles){let L=I.sources.map(j=>j.path?`${j.vault}/${j.path}`:j.vault).join(" + ");new C.Setting(g).setName(I.name).setDesc(L).addExtraButton(j=>{Ot(j,!0),j.setIcon("trash-2").setTooltip("移除").onClick(async()=>{t.settings.profiles=t.settings.profiles.filter(at=>at.id!==I.id),await t.saveSettings(),t.notify()})})}let y="",T="";new C.Setting(a).setName("组合来源").setDesc("每行一个：库名，或 库名/子目录。可跨库混合。").addTextArea(I=>{I.inputEl.rows=3,I.inputEl.addClass("oq-textarea"),I.setPlaceholder(`Obsidian test1/Vue3/组件规范
Obsidian Vault/wiki`).onChange(L=>{y=L})}),new C.Setting(a).setName("组合名称").addText(I=>{I.inputEl.addClass("oq-input"),I.setPlaceholder("vue-规范").onChange(L=>{T=L})}).addButton(I=>{yt(I,"primary"),I.setButtonText("添加组合").onClick(async()=>{let L=t.addProfile(T,qt(y));new C.Notice(L.message),L.ok&&(await t.saveSettings(),t.notify())})});let $=z(s,"注入设置","控制交给 harness 的上下文格式与建议时机。");new C.Setting($).setName("上下文格式").setDesc("markdown 带 HTML 注释头，plain 为纯文本；影响 /context 输出。").addDropdown(I=>{ae(I),I.addOption("markdown","Markdown").addOption("plain","纯文本").setValue(t.settings.injection.format).onChange(async L=>{t.settings.injection.format=L==="plain"?"plain":"markdown",await t.saveSettings(),t.notify()})}),new C.Setting($).setName("建议注入时机").setDesc("写入 /health 供 harness 参考：manual 按需检索；brief-first 项目开始先取一次摘要。").addDropdown(I=>{ae(I),I.addOption("manual","按需检索").addOption("brief-first","项目开始先取摘要").setValue(t.settings.injection.timing).onChange(async L=>{t.settings.injection.timing=L==="brief-first"?"brief-first":"manual",await t.saveSettings(),t.notify()})});let A=z(s,"引用台账","仅记录在本机，用于反推该收窄还是补充知识库。"),D=t.getStats();if(A.createEl("p",{cls:"oq-hint",text:`累计 ${D.totalQueries} 次检索 · 引用 ${D.totalCitations} 个片段`}),D.recent.length===0)A.createEl("p",{cls:"oq-empty",text:"暂无引用记录。"});else{let I=A.createDiv({cls:"oq-ledger"});for(let j of D.recent.slice(0,3)){let at=I.createDiv({cls:"oq-ledger-row"});at.createSpan({cls:"oq-ledger-query",text:`${j.kind} · ${j.query||"（空）"}`}),at.createSpan({cls:"oq-ledger-meta",text:`${j.hits} 条 · ${an(j.at)}`})}let L=D.topNotes[0];L&&A.createEl("p",{cls:"oq-hint",text:`高频：${L.path}（${L.count} 次）`})}}let S=z(s,"Harness 接入","插件只提供本地只读检索服务，不改动 harness 的配置或源码；harness 侧通过 skill 或 MCP 适配层调用。");new C.Setting(S).setName("启用引用服务").setDesc("仅监听本机回环地址。关闭后 harness 无法检索。").addToggle(a=>{it(a),a.setValue(t.settings.server.enabled).onChange(async g=>{if(t.settings.server.enabled=g,g)try{await t.server.start()}catch(y){t.settings.server.enabled=!1,new C.Notice(`服务启动失败：${y instanceof Error?y.message:String(y)}`)}else await t.server.stop();await t.saveSettings(),t.notify()})}),new C.Setting(S).setName("端口").setDesc("默认 43117；被占用时自动顺延最多 9 个端口。修改后失焦生效。").addText(a=>{a.inputEl.type="number",a.inputEl.min="1024",a.inputEl.max="65535",a.inputEl.addClass("oq-input","oq-input-number"),a.setValue(String(t.settings.server.port)).onChange(g=>{let y=oe(g,1024,65535,43117);y!==t.settings.server.port&&(t.settings.server.port=y,t.scheduleSave())}),a.inputEl.addEventListener("blur",()=>{t.server.running&&t.server.port!==t.settings.server.port&&(async()=>{await t.server.stop();try{await t.server.start()}catch(g){new C.Notice(`端口切换失败：${g instanceof Error?g.message:String(g)}`)}t.notify()})()})}),new C.Setting(S).setName("访问令牌").setDesc("harness 请求需携带 Bearer 令牌。").addText(a=>{a.inputEl.readOnly=!0,a.inputEl.addClass("oq-token","oq-input"),a.setValue(t.settings.server.token)}).addExtraButton(a=>{Ot(a),a.setIcon("copy").setTooltip("复制接入配置").onClick(()=>{navigator.clipboard.writeText(r).then(()=>new C.Notice("接入配置已复制"),()=>new C.Notice("复制失败"))})}),S.createEl("pre",{cls:"oq-config"}).createEl("code",{text:r}),S.createEl("p",{cls:"oq-hint",text:"点「写入接入配置」可直接保存到 ~/.obsidian-quote/config.json（原文件自动备份为 .bak），也可以手动粘贴给环境变量 OBSIDIAN_QUOTE_URL / OBSIDIAN_QUOTE_TOKEN。"});let B=z(s,"面板","默认保持最小可用；需要组合、注入格式或台账时再展开。");new C.Setting(B).setName("显示高级功能").setDesc("引用组合、注入设置与引用台账。").addToggle(a=>{it(a),a.setValue(i).onChange(async g=>{t.settings.ui.advanced=g,await t.saveSettings(),t.notify()})}),new C.Setting(B).setName("首次启用自动登记当前库").setDesc("知识库列表为空时，自动把当前打开的库加入只读引用。").addToggle(a=>{it(a),a.setValue(t.settings.ui.autoRegisterCurrentVault).onChange(async g=>{t.settings.ui.autoRegisterCurrentVault=g,await t.saveSettings()})})}var xt=class extends C.ItemView{constructor(e,n){super(e);this.plugin=n;this.unsubscribe=null}getViewType(){return J}getDisplayText(){return"知识库引用"}getIcon(){return"library"}async onOpen(){this.unsubscribe=this.plugin.subscribe(()=>this.render()),this.render()}async onClose(){var e;(e=this.unsubscribe)==null||e.call(this),this.unsubscribe=null}render(){At(this.contentEl,this.plugin,{showSettingsLink:!0})}};var he=M(require("http")),ot=require("crypto"),kt=require("url");function le(s){return cn.split("__NONCE__").join(s)}var cn=`<!doctype html>
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
</html>`;var un=1e6,wt="oq_session",ce=720*60*1e3,fe=new Set(["localhost","127.0.0.1","::1","[::1]"]);function ue(s){let t={};if(!s)return t;for(let e of s.split(";")){let n=e.indexOf("=");if(n===-1)continue;let i=e.slice(0,n).trim();if(i)try{t[i]=decodeURIComponent(e.slice(n+1).trim())}catch(r){t[i]=e.slice(n+1).trim()}}return t}function dn(s){if(!s)return!0;let t=s.startsWith("[")?s.slice(0,s.indexOf("]")+1):s.split(":")[0];return fe.has(t.toLowerCase())}function pn(s){try{let{hostname:t}=new kt.URL(s);return fe.has(t.toLowerCase())}catch(t){return!1}}var W=class extends Error{constructor(e,n){super(n);this.status=e}};function hn(s){return new Promise((t,e)=>{let n=[],i=0,r=!1;s.on("data",o=>{if(!r){if(i+=o.length,i>un){r=!0,e(new W(413,"请求体过大")),s.resume();return}n.push(o)}}),s.on("end",()=>{if(r)return;r=!0;let o=Buffer.concat(n).toString("utf8").trim();if(!o){t({});return}try{t(JSON.parse(o))}catch(u){e(new W(400,"请求体不是合法 JSON"))}}),s.on("error",o=>{r||(r=!0,e(o))})})}function q(s){return typeof s=="string"?s:void 0}async function rt(s){let t=await hn(s);if(t===null||typeof t!="object"||Array.isArray(t))throw new W(400,"请求体必须是 JSON 对象");return t}function _(s){if(typeof s=="number"&&Number.isFinite(s))return s;if(typeof s=="string"&&s.trim()!==""){let t=Number(s);if(Number.isFinite(t))return t}}function de(s){if(!Array.isArray(s))return;let t=s.filter(e=>typeof e=="string"&&e.trim().length>0);return t.length>0?t:void 0}function pe(s){if(typeof s!="string")return;let t=s.trim().toLowerCase();if(t){if(t==="must"||t==="should"||t==="tip")return t;throw new W(400,`priority 只能是 must / should / tip，收到：${s}`)}}function Z(s){var e;if(!Array.isArray(s))return;let t=[];for(let n of s){if(typeof n=="string"&&n.trim()){let i=n.trim(),r=i.indexOf("/");t.push(r===-1?{vault:i}:{vault:i.slice(0,r),path:i.slice(r+1)});continue}if(n&&typeof n=="object"){let i=n,r=(e=q(i.vault))!=null?e:q(i.vaultId);if(!r)continue;t.push({vault:r,vaultId:q(i.vaultId),path:q(i.path)})}}return t.length>0?t:void 0}var St=class{constructor(t){this.host=t;this.server=null;this.starting=null;this.boundPort=0;this.sessions=new Map;this.sessionToken=null}get running(){return this.server!==null}get port(){return this.boundPort||this.host.getSettings().server.port}get url(){let{host:t}=this.host.getSettings().server;return`http://${t.includes(":")?`[${t}]`:t}:${this.port}`}async start(){if(!this.server)return this.starting?this.starting:(this.starting=this.doStart().finally(()=>{this.starting=null}),this.starting)}async doStart(){var i;let t=this.host.getSettings().server;if(!["127.0.0.1","localhost","::1"].includes(t.host))throw new Error("引用服务仅支持本机回环地址（127.0.0.1 / localhost / ::1）");if(!((i=t.token)!=null&&i.trim()))throw new Error("缺少访问令牌，拒绝启动引用服务");let e=[t.port];for(let r=1;r<=9;r++)e.push(t.port+r);let n=null;for(let r of e)try{await this.listen(r),this.boundPort=r,this.host.log(`引用服务已启动：${this.url}`);return}catch(o){n=o}throw n instanceof Error?n:new Error("端口启动失败")}async stop(){this.starting&&await this.starting.catch(()=>{}),this.sessions.clear(),this.sessionToken=null;let t=this.server;t&&(this.server=null,await new Promise(e=>{var o;let n=!1,i=()=>{n||(n=!0,clearTimeout(r),e())},r=setTimeout(i,1e3);t.close(i),(o=t.closeAllConnections)==null||o.call(t)}),this.host.log("引用服务已停止"))}listen(t){return new Promise((e,n)=>{let i=he.createServer((o,u)=>{this.handle(o,u).catch(l=>{this.sendJson(u,500,{error:l instanceof Error?l.message:String(l)})})}),r=o=>{i.close(),n(o)};i.once("error",r),i.listen(t,this.host.getSettings().server.host,()=>{i.off("error",r),this.server=i,e()})})}authorized(t,e,n=!0){var l;let i=this.host.getSettings().server.token;if(!(i!=null&&i.trim()))return!1;let r=t.headers.authorization;if(typeof r=="string"&&r.toLowerCase().startsWith("bearer ")&&this.tokenMatches(r.slice(7).trim()))return!0;let o=t.headers["x-quote-token"];if(typeof o=="string"&&this.tokenMatches(o)||this.tokenMatches((l=e.searchParams.get("token"))!=null?l:void 0))return!0;if(!n)return!1;let u=t.headers.origin;if(u)try{if(new kt.URL(u).origin!==e.origin)return!1}catch(c){return!1}return this.sessionValid(t)}tokenMatches(t){let e=this.host.getSettings().server.token;if(!(e!=null&&e.trim())||typeof t!="string")return!1;let n=Buffer.from(t,"utf8"),i=Buffer.from(e,"utf8");return n.length!==i.length?!1:(0,ot.timingSafeEqual)(n,i)}createSession(){this.pruneSessions();let t=(0,ot.randomBytes)(32).toString("hex");return this.sessions.set(t,Date.now()+ce),t}pruneSessions(){let t=this.host.getSettings().server.token;this.sessionToken!==t&&(this.sessions.clear(),this.sessionToken=t);let e=Date.now();for(let[n,i]of this.sessions)i<=e&&this.sessions.delete(n)}sessionValid(t){this.pruneSessions();let e=ue(t.headers.cookie)[wt];if(!e)return!1;let n=this.sessions.get(e);return n?n<=Date.now()?(this.sessions.delete(e),!1):!0:!1}destroySession(t){let e=ue(t.headers.cookie)[wt];e&&this.sessions.delete(e)}sessionCookie(t){let e="Path=/; HttpOnly; SameSite=Strict";if(!t)return`${wt}=; ${e}; Max-Age=0`;let n=Math.floor(ce/1e3);return`${wt}=${t}; ${e}; Max-Age=${n}`}async handle(t,e){var r,o,u,l,c,p,h,v,m,x,w,k,b,R,P,N;let n=new kt.URL((r=t.url)!=null?r:"/",`http://${(o=t.headers.host)!=null?o:"127.0.0.1"}`);if(!dn(t.headers.host)){this.sendJson(e,403,{error:"forbidden host"});return}let i=t.headers.origin;if(typeof i=="string"&&pn(i)&&(e.setHeader("Access-Control-Allow-Origin",i),e.setHeader("Vary","Origin")),e.setHeader("Access-Control-Allow-Headers","authorization, content-type, x-quote-token"),e.setHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS"),e.setHeader("Cache-Control","no-store"),e.setHeader("X-Content-Type-Options","nosniff"),e.setHeader("Referrer-Policy","no-referrer"),e.setHeader("X-Frame-Options","DENY"),t.method==="OPTIONS"){e.statusCode=204,e.end();return}if(n.pathname==="/ui"||n.pathname==="/ui/"){if(t.method!=="GET"){this.sendJson(e,405,{error:"method not allowed"});return}let d=n.searchParams.get("token");if(d!==null){if(!this.tokenMatches(d)){this.sendJson(e,401,{error:"unauthorized"});return}e.setHeader("Set-Cookie",this.sessionCookie(this.createSession())),this.redirect(e,"/ui");return}let f=(0,ot.randomBytes)(16).toString("base64");this.sendHtml(e,le(f),f);return}if(t.method==="POST"&&n.pathname==="/ui/session"){try{let d=await rt(t),f=q(d.token);if(!f){this.sendJson(e,400,{ok:!1,error:"缺少令牌。"});return}if(!this.tokenMatches(f)){this.sendJson(e,401,{ok:!1,error:"令牌不正确。"});return}e.setHeader("Set-Cookie",this.sessionCookie(this.createSession())),this.sendJson(e,200,{ok:!0})}catch(d){let f=d instanceof W?d.status:500;this.sendJson(e,f,{ok:!1,error:d instanceof Error?d.message:String(d)})}return}if(t.method==="POST"&&n.pathname==="/ui/logout"){this.destroySession(t),e.setHeader("Set-Cookie",this.sessionCookie(null)),this.sendJson(e,200,{ok:!0});return}if(n.pathname==="/health"){let d=this.host.getStatus();this.sendJson(e,200,{ok:!0,version:d.version,indexing:d.indexing,vaults:d.vaults.length,docs:d.totalDocs,chunks:d.totalChunks,rules:d.totalRules,lastBuiltAt:d.lastBuiltAt,injection:d.settings.injection});return}if(!this.authorized(t,n,n.pathname!=="/reindex")){this.sendJson(e,401,{error:"unauthorized",hint:"在插件面板复制接入配置，使用 Bearer 令牌访问。"});return}try{if(t.method==="GET"&&n.pathname==="/vaults"){let d=this.host.getStatus();this.sendJson(e,200,{vaults:d.vaults});return}if(t.method==="GET"&&n.pathname==="/search"){let d=(l=(u=n.searchParams.get("q"))!=null?u:n.searchParams.get("query"))!=null?l:"";if(!d.trim()){this.sendJson(e,400,{error:"缺少查询参数 q"});return}let f=this.host.search(d,this.optionsFrom(n.searchParams));this.host.recordCitation("search",d,f.hits),this.sendJson(e,200,f);return}if(t.method==="POST"&&n.pathname==="/search"){let d=await rt(t),f=(p=(c=q(d.query))!=null?c:q(d.q))!=null?p:"";if(!f.trim()){this.sendJson(e,400,{error:"缺少 query 字段"});return}let S={limit:_(d.limit),maxChars:_(d.maxChars),vaults:de(d.vaults),sources:Z(d.sources),profile:q(d.profile),minScoreRatio:_(d.minScoreRatio)},E=this.host.search(f,S);this.host.recordCitation("search",f,E.hits),this.sendJson(e,200,E);return}if(t.method==="POST"&&n.pathname==="/context"){let d=await rt(t),f=(v=(h=q(d.query))!=null?h:q(d.q))!=null?v:"";if(!f.trim()){this.sendJson(e,400,{error:"缺少 query 字段"});return}let S=this.host.buildContext(f,_(d.budget),_(d.limit),Z(d.sources),q(d.profile));this.host.recordCitation("context",f,S.hits),this.sendJson(e,200,S);return}if(t.method==="GET"&&n.pathname==="/rules"){let d={query:(x=(m=n.searchParams.get("q"))!=null?m:n.searchParams.get("query"))!=null?x:void 0,topic:(w=n.searchParams.get("topic"))!=null?w:void 0,priority:pe(n.searchParams.get("priority")),limit:_(n.searchParams.get("limit")),sources:Z(n.searchParams.getAll("source")),profile:(k=n.searchParams.get("profile"))!=null?k:void 0},f=this.host.getRules(d);this.host.recordCitation("rules",(b=d.query)!=null?b:"",f.rules.map(S=>({vault:S.vault,path:S.path,title:S.heading||S.text}))),this.sendJson(e,200,f);return}if(t.method==="POST"&&n.pathname==="/rules"){let d=await rt(t),f={query:(R=q(d.query))!=null?R:q(d.q),topic:q(d.topic),priority:pe(d.priority),limit:_(d.limit),sources:Z(d.sources),profile:q(d.profile)},S=this.host.getRules(f);this.host.recordCitation("rules",(P=f.query)!=null?P:"",S.rules.map(E=>({vault:E.vault,path:E.path,title:E.heading||E.text}))),this.sendJson(e,200,S);return}if(t.method==="POST"&&n.pathname==="/brief"){let d=await rt(t),f={projectPath:(N=q(d.projectPath))!=null?N:q(d.project),stack:de(d.stack),budget:_(d.budget),limit:_(d.limit),sources:Z(d.sources),profile:q(d.profile)},S=await this.host.buildBrief(f);if(S.error){this.sendJson(e,400,{error:S.error});return}this.host.recordCitation("brief",`brief: ${S.stack.join(", ")}`,S.rules.map(E=>({vault:E.vault,path:E.path,title:E.heading||E.text}))),this.sendJson(e,200,S);return}if(t.method==="GET"&&n.pathname==="/stats"){this.sendJson(e,200,this.host.getStats());return}if(t.method==="POST"&&n.pathname==="/reindex"){await this.host.rebuild();let d=this.host.getStatus();this.sendJson(e,200,{ok:!0,docs:d.totalDocs,chunks:d.totalChunks,rules:d.totalRules});return}this.sendJson(e,404,{error:"not found",endpoints:["/health","/ui","/vaults","/search","/context","/rules","/brief","/stats","/reindex"]})}catch(d){let f=d instanceof W?d.status:500;this.sendJson(e,f,{error:d instanceof Error?d.message:String(d)})}}optionsFrom(t){var e;return{limit:_(t.get("limit")),maxChars:_(t.get("maxChars")),vaults:t.getAll("vault"),sources:Z(t.getAll("source")),profile:(e=t.get("profile"))!=null?e:void 0,minScoreRatio:_(t.get("minScoreRatio"))}}sendHtml(t,e,n){if(t.writableEnded)return;let i=Buffer.from(e,"utf8");t.statusCode=200,t.setHeader("Content-Type","text/html; charset=utf-8"),t.setHeader("Content-Security-Policy",["default-src 'none'",`style-src 'nonce-${n}'`,`script-src 'nonce-${n}'`,"connect-src 'self'","img-src 'none'","base-uri 'none'","form-action 'none'","frame-ancestors 'none'"].join("; ")),t.setHeader("Content-Length",i.length),t.end(i)}redirect(t,e){t.statusCode=303,t.setHeader("Location",e),t.end()}sendJson(t,e,n){if(t.writableEnded)return;let i=JSON.stringify(n,null,2);t.statusCode=e,t.setHeader("Content-Type","application/json; charset=utf-8"),t.setHeader("Content-Length",Buffer.byteLength(i)),t.end(i)}};var ge=require("obsidian");var Ct=class extends ge.PluginSettingTab{constructor(e,n){super(e,n);this.plugin=n;this.unsubscribe=null}display(){let{containerEl:e}=this;e.empty(),e.addClass("obsidian-quote-settings"),this.unsubscribe||(this.unsubscribe=this.plugin.subscribe(()=>this.display())),At(e,this.plugin)}hide(){var e;(e=this.unsubscribe)==null||e.call(this),this.unsubscribe=null}};var Et=class extends U.Plugin{constructor(){super(...arguments);this.ledger=new mt;this.listeners=new Set;this.saveTimer=null;this.rebuildTimer=null;this.watchers=[];this.watchSignature=""}async onload(){await this.loadSettings(),this.indexer=new gt(()=>this.settings),this.server=new St(this),this.registerView(J,e=>new xt(e,this)),this.addRibbonIcon("library","知识库引用",()=>{this.openPanel()}),this.addCommand({id:"open-quote-panel",name:"打开知识库引用面板",callback:()=>{this.openPanel()}}),this.addCommand({id:"rebuild-quote-index",name:"重建知识库索引",callback:()=>{this.rebuild().then(()=>{new U.Notice(`索引完成：${this.indexer.chunkCount} 个段落 / ${this.indexer.ruleCount} 条规则`)}).catch(e=>{new U.Notice(`索引失败：${e instanceof Error?e.message:String(e)}`)})}}),this.addSettingTab(new Ct(this.app,this)),this.app.workspace.onLayoutReady(()=>{var e;if(this.settings.ui.autoRegisterCurrentVault&&this.settings.vaults.length===0){let n=this.app.vault.adapter,i=(e=n.getBasePath)==null?void 0:e.call(n);if(i){let r=this.settings.vaults.length;if(this.addVault(i).ok&&this.settings.vaults.length>r){let u=this.settings.vaults[this.settings.vaults.length-1];new U.Notice(`已自动登记当前库：${u.name}`),this.saveSettings()}}}this.settings.server.enabled&&this.server.start().catch(n=>{new U.Notice(`引用服务启动失败：${n instanceof Error?n.message:String(n)}`)}),this.syncWatchers(),this.rebuild()})}onunload(){this.saveTimer!==null&&window.clearTimeout(this.saveTimer),this.rebuildTimer!==null&&window.clearTimeout(this.rebuildTimer),this.saveTimer=null,this.rebuildTimer=null,this.listeners.clear(),this.closeWatchers(),this.server.stop(),this.app.workspace.detachLeavesOfType(J)}async loadSettings(){var r,o,u,l,c,p,h;let e=await this.loadData(),n=(r=e==null?void 0:e.settings)!=null?r:e,i=Bt();this.settings={vaults:this.normalizeVaults(n==null?void 0:n.vaults),scope:{...i.scope,...(o=n==null?void 0:n.scope)!=null?o:{}},retrieval:{...i.retrieval,...(u=n==null?void 0:n.retrieval)!=null?u:{}},server:{...i.server,...(l=n==null?void 0:n.server)!=null?l:{}},index:{...i.index,...(c=n==null?void 0:n.index)!=null?c:{}},ui:{...i.ui,...(p=n==null?void 0:n.ui)!=null?p:{}},injection:{...i.injection,...(h=n==null?void 0:n.injection)!=null?h:{}},profiles:this.normalizeProfiles(n==null?void 0:n.profiles)};for(let v of["includeFolders","excludeFolders","requiredTags"])Array.isArray(this.settings.scope[v])||(this.settings.scope[v]=[]);this.settings.server.token||(this.settings.server.token=i.server.token),typeof this.settings.index.watch!="boolean"&&(this.settings.index.watch=!0),typeof this.settings.ui.advanced!="boolean"&&(this.settings.ui.advanced=!1),typeof this.settings.ui.autoRegisterCurrentVault!="boolean"&&(this.settings.ui.autoRegisterCurrentVault=!0),this.settings.injection.format!=="plain"&&(this.settings.injection.format="markdown"),this.settings.injection.timing!=="brief-first"&&(this.settings.injection.timing="manual"),this.ledger.load(e==null?void 0:e.ledger)}addProfile(e,n){let i=e.trim();if(!i)return{ok:!1,message:"请填写组合名称"};if(this.settings.profiles.some(o=>o.name===i))return{ok:!1,message:"同名组合已存在"};let r=[];for(let o of n){let u=o.trim();if(!u)continue;let l=u.indexOf("/"),c=(l===-1?u:u.slice(0,l)).trim(),p=l===-1?"":u.slice(l+1).replace(/\\/g,"/").replace(/^\/+|\/+$/g,"").trim(),h=this.settings.vaults.find(x=>x.id===c),v=this.settings.vaults.filter(x=>x.name.toLowerCase()===c.toLowerCase());if(!h&&v.length>1)return{ok:!1,message:`存在同名知识库：${c}，请使用知识库 id 指定来源`};let m=h!=null?h:v[0];if(!m)return{ok:!1,message:`未登记的知识库：${c}`};if(p){let x=Rt.join(m.path,p);if(!O.existsSync(x)||!O.statSync(x).isDirectory())return{ok:!1,message:`子目录不存在：${m.name}/${p}`}}r.push({vault:m.name,vaultId:m.id,path:p||void 0})}return r.length===0?{ok:!1,message:"至少填写一个来源"}:(this.settings.profiles.push({id:`P-${Date.now().toString(36)}`,name:i,sources:r}),{ok:!0,message:"已添加组合"})}async saveSettings(){await this.saveData({settings:this.settings,ledger:this.ledger.toJSON()}),this.syncWatchers()}async writeHarnessConfig(){let e=Rt.join(me.homedir(),".obsidian-quote"),n=Rt.join(e,"config.json"),i={url:this.server.url,token:this.settings.server.token};try{O.mkdirSync(e,{recursive:!0,mode:448}),process.platform!=="win32"&&O.chmodSync(e,448);let r="";if(O.existsSync(n)){process.platform!=="win32"&&O.chmodSync(n,384);try{O.copyFileSync(n,`${n}.bak`),process.platform!=="win32"&&O.chmodSync(`${n}.bak`,384),r="（原文件已备份为 config.json.bak）"}catch(o){}}return O.writeFileSync(n,`${JSON.stringify(i,null,2)}
`,{encoding:"utf8",mode:384}),process.platform!=="win32"&&O.chmodSync(n,384),{ok:!0,message:`接入配置已写入 ${n}${r}`}}catch(r){return{ok:!1,message:`写入接入配置失败：${r instanceof Error?r.message:String(r)}`}}}scheduleSave(e=250){this.saveTimer!==null&&window.clearTimeout(this.saveTimer),this.saveTimer=window.setTimeout(()=>{this.saveTimer=null,this.saveSettings()},e)}scheduleRebuild(e=600){this.rebuildTimer!==null&&window.clearTimeout(this.rebuildTimer),this.rebuildTimer=window.setTimeout(()=>{this.rebuildTimer=null,this.rebuild()},e)}async rebuild(){await this.indexer.build(),this.notify()}subscribe(e){return this.listeners.add(e),()=>{this.listeners.delete(e)}}notify(){for(let e of Array.from(this.listeners))e()}addVault(e){let n=K(e);if(!ie(n))return{ok:!1,message:"路径不存在或不是文件夹"};let i=nt(n);return this.settings.vaults.some(r=>r.id===i)?{ok:!1,message:"该知识库已登记"}:(this.settings.vaults.push(st(n)),{ok:!0,message:"已添加"})}async openPanel(){var i;let e=this.app.workspace.getLeavesOfType(J)[0];if(e){await this.app.workspace.revealLeaf(e);return}let n=(i=this.app.workspace.getRightLeaf(!1))!=null?i:this.app.workspace.getLeaf(!0);await n.setViewState({type:J,active:!0}),await this.app.workspace.revealLeaf(n)}getSettings(){return this.settings}getStatus(){let e=new Map(this.indexer.statsList.map(n=>[n.vaultId,n]));return{version:this.manifest.version,vaults:this.settings.vaults.map(n=>{var r,o,u;let i=e.get(n.id);return{id:n.id,name:n.name,path:n.path,enabled:n.enabled,docs:(r=i==null?void 0:i.docs)!=null?r:0,chunks:(o=i==null?void 0:i.chunks)!=null?o:0,rules:(u=i==null?void 0:i.rules)!=null?u:0,error:i==null?void 0:i.error}}),totalDocs:this.indexer.docCount,totalChunks:this.indexer.chunkCount,totalRules:this.indexer.ruleCount,indexing:this.indexer.isBuilding,lastBuiltAt:this.indexer.lastBuiltAt,server:{running:this.server.running,url:this.server.url,port:this.server.port},settings:this.settings}}search(e,n={}){return this.indexer.ensureFresh(),this.indexer.search(e,n)}buildContext(e,n,i,r,o){return this.indexer.ensureFresh(),this.indexer.buildContext(e,n,i,r,o)}getRules(e){return this.indexer.ensureFresh(),this.indexer.getRules(e)}buildBrief(e){return this.indexer.ensureFresh(),this.indexer.buildBrief(e)}getStats(){return this.ledger.getStats()}recordCitation(e,n,i){this.ledger.record(e,n,i),this.scheduleSave(4e3)}log(e){console.log(`[obsidian-quote] ${e}`)}syncWatchers(){let e=`${this.settings.index.watch}|${this.settings.vaults.filter(n=>n.enabled).map(n=>n.path).join("|")}`;if(e!==this.watchSignature&&(this.watchSignature=e,this.closeWatchers(),!!this.settings.index.watch)){for(let n of this.settings.vaults)if(n.enabled)try{let i=O.watch(n.path,{recursive:!0},(r,o)=>{typeof o=="string"&&o.length>0&&!this.isRelevantChange(o)||this.scheduleRebuild(1200)});i.on("error",()=>{}),this.watchers.push(i)}catch(i){this.log(`无法监听 ${n.path}：${i instanceof Error?i.message:String(i)}`)}}}isRelevantChange(e){var r;let n=e.replace(/\\/g,"/");return n.includes("/.git/")||n.includes("/.obsidian/")||n.includes("/node_modules/")?!1:((r=n.split("/").pop())!=null?r:n).toLowerCase().endsWith(".md")}closeWatchers(){for(let e of this.watchers)try{e.close()}catch(n){}this.watchers=[]}normalizeProfiles(e){if(!Array.isArray(e))return[];let n=[];for(let i of e){if(!i||typeof i!="object")continue;let r=i;if(typeof r.name!="string"||!r.name.trim()||!Array.isArray(r.sources))continue;let o=[];for(let u of r.sources){if(!u||typeof u!="object")continue;let l=u;typeof l.vault!="string"||!l.vault.trim()||o.push({vault:l.vault,vaultId:typeof l.vaultId=="string"?l.vaultId:void 0,path:typeof l.path=="string"?l.path:void 0})}o.length!==0&&n.push({id:typeof r.id=="string"&&r.id?r.id:`P-${n.length+1}`,name:r.name.trim(),sources:o})}return n}normalizeVaults(e){if(!Array.isArray(e))return[];let n=[],i=new Set;for(let r of e){if(!r||typeof r!="object")continue;let o=r;if(typeof o.path!="string"||o.path.trim().length===0)continue;let u=K(o.path),l=nt(u);i.has(l)||(i.add(l),n.push({id:l,name:typeof o.name=="string"&&o.name.trim()?o.name:vt(u),path:u,enabled:o.enabled!==!1}))}return n}};
