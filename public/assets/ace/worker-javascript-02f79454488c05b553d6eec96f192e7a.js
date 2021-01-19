!function(e){if(!(void 0!==e.window&&e.document||e.require&&e.define)){e.console||(e.console=function(){var e=Array.prototype.slice.call(arguments,0)
postMessage({type:"log",data:e})},e.console.error=e.console.warn=e.console.log=e.console.trace=e.console),e.window=e,e.ace=e,e.onerror=function(e,t,n,r,i){postMessage({type:"error",data:{message:e,data:i.data,file:t,line:n,col:r,stack:i.stack}})},e.normalizeModule=function(t,n){if(-1!==n.indexOf("!")){var r=n.split("!")
return e.normalizeModule(t,r[0])+"!"+e.normalizeModule(t,r[1])}if("."==n.charAt(0)){var i=t.split("/").slice(0,-1).join("/")
for(n=(i?i+"/":"")+n;-1!==n.indexOf(".")&&o!=n;){var o=n
n=n.replace(/^\.\//,"").replace(/\/\.\//,"/").replace(/[^\/]+\/\.\.\//,"")}}return n},e.require=function(t,n){if(n||(n=t,t=null),!n.charAt)throw new Error("worker.js require() accepts only (parentId, id) as arguments")
n=e.normalizeModule(t,n)
var r=e.require.modules[n]
if(r)return r.initialized||(r.initialized=!0,r.exports=r.factory().exports),r.exports
if(!e.require.tlns)return console.log("unable to load "+n)
var i=function(e,t){var n=e,r=""
for(;n;){var i=t[n]
if("string"==typeof i)return i+r
if(i)return i.location.replace(/\/*$/,"/")+(r||i.main||i.name)
if(!1===i)return""
var o=n.lastIndexOf("/")
if(-1===o)break
r=n.substr(o)+r,n=n.slice(0,o)}return e}(n,e.require.tlns)
return".js"!=i.slice(-3)&&(i+=".js"),e.require.id=n,e.require.modules[n]={},importScripts(i),e.require(t,n)},e.require.modules={},e.require.tlns={},e.define=function(t,n,r){if(2==arguments.length?(r=n,"string"!=typeof t&&(n=t,t=e.require.id)):1==arguments.length&&(r=t,n=[],t=e.require.id),"function"==typeof r){n.length||(n=["require","exports","module"])
var i=function(n){return e.require(t,n)}
e.require.modules[t]={exports:{},factory:function(){var e=this,t=r.apply(this,n.slice(0,r.length).map((function(t){switch(t){case"require":return i
case"exports":return e.exports
case"module":return e
default:return i(t)}})))
return t&&(e.exports=t),e}}}else e.require.modules[t]={exports:r,initialized:!0}},e.define.amd={},require.tlns={},e.initBaseUrls=function(e){for(var t in e)require.tlns[t]=e[t]},e.initSender=function(){var t=e.require("ace/lib/event_emitter").EventEmitter,n=e.require("ace/lib/oop"),r=function(){}
return function(){n.implement(this,t),this.callback=function(e,t){postMessage({type:"call",id:t,data:e})},this.emit=function(e,t){postMessage({type:"event",name:e,data:t})}}.call(r.prototype),new r}
var t=e.main=null,n=e.sender=null
e.onmessage=function(r){var i=r.data
if(i.event&&n)n._signal(i.event,i.data)
else if(i.command)if(t[i.command])t[i.command].apply(t,i.args)
else{if(!e[i.command])throw new Error("Unknown command:"+i.command)
e[i.command].apply(e,i.args)}else if(i.init){e.initBaseUrls(i.tlns),require("ace/lib/es5-shim"),n=e.sender=e.initSender()
var o=require(i.module)[i.classname]
t=e.main=new o(n)}}}}(this),ace.define("ace/lib/oop",[],(function(e,t,n){"use strict"
t.inherits=function(e,t){e.super_=t,e.prototype=Object.create(t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}})},t.mixin=function(e,t){for(var n in t)e[n]=t[n]
return e},t.implement=function(e,n){t.mixin(e,n)}})),ace.define("ace/range",[],(function(e,t,n){"use strict"
var r=function(e,t,n,r){this.start={row:e,column:t},this.end={row:n,column:r}};(function(){this.isEqual=function(e){return this.start.row===e.start.row&&this.end.row===e.end.row&&this.start.column===e.start.column&&this.end.column===e.end.column},this.toString=function(){return"Range: ["+this.start.row+"/"+this.start.column+"] -> ["+this.end.row+"/"+this.end.column+"]"},this.contains=function(e,t){return 0==this.compare(e,t)},this.compareRange=function(e){var t,n=e.end,r=e.start
return 1==(t=this.compare(n.row,n.column))?1==(t=this.compare(r.row,r.column))?2:0==t?1:0:-1==t?-2:-1==(t=this.compare(r.row,r.column))?-1:1==t?42:0},this.comparePoint=function(e){return this.compare(e.row,e.column)},this.containsRange=function(e){return 0==this.comparePoint(e.start)&&0==this.comparePoint(e.end)},this.intersects=function(e){var t=this.compareRange(e)
return-1==t||0==t||1==t},this.isEnd=function(e,t){return this.end.row==e&&this.end.column==t},this.isStart=function(e,t){return this.start.row==e&&this.start.column==t},this.setStart=function(e,t){"object"==typeof e?(this.start.column=e.column,this.start.row=e.row):(this.start.row=e,this.start.column=t)},this.setEnd=function(e,t){"object"==typeof e?(this.end.column=e.column,this.end.row=e.row):(this.end.row=e,this.end.column=t)},this.inside=function(e,t){return 0==this.compare(e,t)&&(!this.isEnd(e,t)&&!this.isStart(e,t))},this.insideStart=function(e,t){return 0==this.compare(e,t)&&!this.isEnd(e,t)},this.insideEnd=function(e,t){return 0==this.compare(e,t)&&!this.isStart(e,t)},this.compare=function(e,t){return this.isMultiLine()||e!==this.start.row?e<this.start.row?-1:e>this.end.row?1:this.start.row===e?t>=this.start.column?0:-1:this.end.row===e?t<=this.end.column?0:1:0:t<this.start.column?-1:t>this.end.column?1:0},this.compareStart=function(e,t){return this.start.row==e&&this.start.column==t?-1:this.compare(e,t)},this.compareEnd=function(e,t){return this.end.row==e&&this.end.column==t?1:this.compare(e,t)},this.compareInside=function(e,t){return this.end.row==e&&this.end.column==t?1:this.start.row==e&&this.start.column==t?-1:this.compare(e,t)},this.clipRows=function(e,t){if(this.end.row>t)var n={row:t+1,column:0}
else if(this.end.row<e)n={row:e,column:0}
if(this.start.row>t)var i={row:t+1,column:0}
else if(this.start.row<e)i={row:e,column:0}
return r.fromPoints(i||this.start,n||this.end)},this.extend=function(e,t){var n=this.compare(e,t)
if(0==n)return this
if(-1==n)var i={row:e,column:t}
else var o={row:e,column:t}
return r.fromPoints(i||this.start,o||this.end)},this.isEmpty=function(){return this.start.row===this.end.row&&this.start.column===this.end.column},this.isMultiLine=function(){return this.start.row!==this.end.row},this.clone=function(){return r.fromPoints(this.start,this.end)},this.collapseRows=function(){return 0==this.end.column?new r(this.start.row,0,Math.max(this.start.row,this.end.row-1),0):new r(this.start.row,0,this.end.row,0)},this.toScreenRange=function(e){var t=e.documentToScreenPosition(this.start),n=e.documentToScreenPosition(this.end)
return new r(t.row,t.column,n.row,n.column)},this.moveBy=function(e,t){this.start.row+=e,this.start.column+=t,this.end.row+=e,this.end.column+=t}}).call(r.prototype),r.fromPoints=function(e,t){return new r(e.row,e.column,t.row,t.column)},r.comparePoints=function(e,t){return e.row-t.row||e.column-t.column},r.comparePoints=function(e,t){return e.row-t.row||e.column-t.column},t.Range=r})),ace.define("ace/apply_delta",[],(function(e,t,n){"use strict"
t.applyDelta=function(e,t,n){var r=t.start.row,i=t.start.column,o=e[r]||""
switch(t.action){case"insert":if(1===t.lines.length)e[r]=o.substring(0,i)+t.lines[0]+o.substring(i)
else{var s=[r,1].concat(t.lines)
e.splice.apply(e,s),e[r]=o.substring(0,i)+e[r],e[r+t.lines.length-1]+=o.substring(i)}break
case"remove":var a=t.end.column,c=t.end.row
r===c?e[r]=o.substring(0,i)+o.substring(a):e.splice(r,c-r+1,o.substring(0,i)+e[c].substring(a))}}})),ace.define("ace/lib/event_emitter",[],(function(e,t,n){"use strict"
var r={},i=function(){this.propagationStopped=!0},o=function(){this.defaultPrevented=!0}
r._emit=r._dispatchEvent=function(e,t){this._eventRegistry||(this._eventRegistry={}),this._defaultHandlers||(this._defaultHandlers={})
var n=this._eventRegistry[e]||[],r=this._defaultHandlers[e]
if(n.length||r){"object"==typeof t&&t||(t={}),t.type||(t.type=e),t.stopPropagation||(t.stopPropagation=i),t.preventDefault||(t.preventDefault=o),n=n.slice()
for(var s=0;s<n.length&&(n[s](t,this),!t.propagationStopped);s++);return r&&!t.defaultPrevented?r(t,this):void 0}},r._signal=function(e,t){var n=(this._eventRegistry||{})[e]
if(n){n=n.slice()
for(var r=0;r<n.length;r++)n[r](t,this)}},r.once=function(e,t){var n=this
if(this.addEventListener(e,(function r(){n.removeEventListener(e,r),t.apply(null,arguments)})),!t)return new Promise((function(e){t=e}))},r.setDefaultHandler=function(e,t){var n=this._defaultHandlers
if(n||(n=this._defaultHandlers={_disabled_:{}}),n[e]){var r=n[e],i=n._disabled_[e]
i||(n._disabled_[e]=i=[]),i.push(r)
var o=i.indexOf(t);-1!=o&&i.splice(o,1)}n[e]=t},r.removeDefaultHandler=function(e,t){var n=this._defaultHandlers
if(n){var r=n._disabled_[e]
if(n[e]==t)r&&this.setDefaultHandler(e,r.pop())
else if(r){var i=r.indexOf(t);-1!=i&&r.splice(i,1)}}},r.on=r.addEventListener=function(e,t,n){this._eventRegistry=this._eventRegistry||{}
var r=this._eventRegistry[e]
return r||(r=this._eventRegistry[e]=[]),-1==r.indexOf(t)&&r[n?"unshift":"push"](t),t},r.off=r.removeListener=r.removeEventListener=function(e,t){this._eventRegistry=this._eventRegistry||{}
var n=this._eventRegistry[e]
if(n){var r=n.indexOf(t);-1!==r&&n.splice(r,1)}},r.removeAllListeners=function(e){this._eventRegistry&&(this._eventRegistry[e]=[])},t.EventEmitter=r})),ace.define("ace/anchor",[],(function(e,t,n){"use strict"
var r=e("./lib/oop"),i=e("./lib/event_emitter").EventEmitter,o=t.Anchor=function(e,t,n){this.$onChange=this.onChange.bind(this),this.attach(e),void 0===n?this.setPosition(t.row,t.column):this.setPosition(t,n)};(function(){function e(e,t,n){var r=n?e.column<=t.column:e.column<t.column
return e.row<t.row||e.row==t.row&&r}r.implement(this,i),this.getPosition=function(){return this.$clipPositionToDocument(this.row,this.column)},this.getDocument=function(){return this.document},this.$insertRight=!1,this.onChange=function(t){if(!(t.start.row==t.end.row&&t.start.row!=this.row||t.start.row>this.row)){var n=function(t,n,r){var i="insert"==t.action,o=(i?1:-1)*(t.end.row-t.start.row),s=(i?1:-1)*(t.end.column-t.start.column),a=t.start,c=i?a:t.end
if(e(n,a,r))return{row:n.row,column:n.column}
if(e(c,n,!r))return{row:n.row+o,column:n.column+(n.row==c.row?s:0)}
return{row:a.row,column:a.column}}(t,{row:this.row,column:this.column},this.$insertRight)
this.setPosition(n.row,n.column,!0)}},this.setPosition=function(e,t,n){var r
if(r=n?{row:e,column:t}:this.$clipPositionToDocument(e,t),this.row!=r.row||this.column!=r.column){var i={row:this.row,column:this.column}
this.row=r.row,this.column=r.column,this._signal("change",{old:i,value:r})}},this.detach=function(){this.document.removeEventListener("change",this.$onChange)},this.attach=function(e){this.document=e||this.document,this.document.on("change",this.$onChange)},this.$clipPositionToDocument=function(e,t){var n={}
return e>=this.document.getLength()?(n.row=Math.max(0,this.document.getLength()-1),n.column=this.document.getLine(n.row).length):e<0?(n.row=0,n.column=0):(n.row=e,n.column=Math.min(this.document.getLine(n.row).length,Math.max(0,t))),t<0&&(n.column=0),n}}).call(o.prototype)})),ace.define("ace/document",[],(function(e,t,n){"use strict"
var r=e("./lib/oop"),i=e("./apply_delta").applyDelta,o=e("./lib/event_emitter").EventEmitter,s=e("./range").Range,a=e("./anchor").Anchor,c=function(e){this.$lines=[""],0===e.length?this.$lines=[""]:Array.isArray(e)?this.insertMergedLines({row:0,column:0},e):this.insert({row:0,column:0},e)};(function(){r.implement(this,o),this.setValue=function(e){var t=this.getLength()-1
this.remove(new s(0,0,t,this.getLine(t).length)),this.insert({row:0,column:0},e)},this.getValue=function(){return this.getAllLines().join(this.getNewLineCharacter())},this.createAnchor=function(e,t){return new a(this,e,t)},0==="aaa".split(/a/).length?this.$split=function(e){return e.replace(/\r\n|\r/g,"\n").split("\n")}:this.$split=function(e){return e.split(/\r\n|\r|\n/)},this.$detectNewLine=function(e){var t=e.match(/^.*?(\r\n|\r|\n)/m)
this.$autoNewLine=t?t[1]:"\n",this._signal("changeNewLineMode")},this.getNewLineCharacter=function(){switch(this.$newLineMode){case"windows":return"\r\n"
case"unix":return"\n"
default:return this.$autoNewLine||"\n"}},this.$autoNewLine="",this.$newLineMode="auto",this.setNewLineMode=function(e){this.$newLineMode!==e&&(this.$newLineMode=e,this._signal("changeNewLineMode"))},this.getNewLineMode=function(){return this.$newLineMode},this.isNewLine=function(e){return"\r\n"==e||"\r"==e||"\n"==e},this.getLine=function(e){return this.$lines[e]||""},this.getLines=function(e,t){return this.$lines.slice(e,t+1)},this.getAllLines=function(){return this.getLines(0,this.getLength())},this.getLength=function(){return this.$lines.length},this.getTextRange=function(e){return this.getLinesForRange(e).join(this.getNewLineCharacter())},this.getLinesForRange=function(e){var t
if(e.start.row===e.end.row)t=[this.getLine(e.start.row).substring(e.start.column,e.end.column)]
else{(t=this.getLines(e.start.row,e.end.row))[0]=(t[0]||"").substring(e.start.column)
var n=t.length-1
e.end.row-e.start.row==n&&(t[n]=t[n].substring(0,e.end.column))}return t},this.insertLines=function(e,t){return console.warn("Use of document.insertLines is deprecated. Use the insertFullLines method instead."),this.insertFullLines(e,t)},this.removeLines=function(e,t){return console.warn("Use of document.removeLines is deprecated. Use the removeFullLines method instead."),this.removeFullLines(e,t)},this.insertNewLine=function(e){return console.warn("Use of document.insertNewLine is deprecated. Use insertMergedLines(position, ['', '']) instead."),this.insertMergedLines(e,["",""])},this.insert=function(e,t){return this.getLength()<=1&&this.$detectNewLine(t),this.insertMergedLines(e,this.$split(t))},this.insertInLine=function(e,t){var n=this.clippedPos(e.row,e.column),r=this.pos(e.row,e.column+t.length)
return this.applyDelta({start:n,end:r,action:"insert",lines:[t]},!0),this.clonePos(r)},this.clippedPos=function(e,t){var n=this.getLength()
void 0===e?e=n:e<0?e=0:e>=n&&(e=n-1,t=void 0)
var r=this.getLine(e)
return null==t&&(t=r.length),{row:e,column:t=Math.min(Math.max(t,0),r.length)}},this.clonePos=function(e){return{row:e.row,column:e.column}},this.pos=function(e,t){return{row:e,column:t}},this.$clipPosition=function(e){var t=this.getLength()
return e.row>=t?(e.row=Math.max(0,t-1),e.column=this.getLine(t-1).length):(e.row=Math.max(0,e.row),e.column=Math.min(Math.max(e.column,0),this.getLine(e.row).length)),e},this.insertFullLines=function(e,t){var n=0;(e=Math.min(Math.max(e,0),this.getLength()))<this.getLength()?(t=t.concat([""]),n=0):(t=[""].concat(t),e--,n=this.$lines[e].length),this.insertMergedLines({row:e,column:n},t)},this.insertMergedLines=function(e,t){var n=this.clippedPos(e.row,e.column),r={row:n.row+t.length-1,column:(1==t.length?n.column:0)+t[t.length-1].length}
return this.applyDelta({start:n,end:r,action:"insert",lines:t}),this.clonePos(r)},this.remove=function(e){var t=this.clippedPos(e.start.row,e.start.column),n=this.clippedPos(e.end.row,e.end.column)
return this.applyDelta({start:t,end:n,action:"remove",lines:this.getLinesForRange({start:t,end:n})}),this.clonePos(t)}
this.removeInLine=function(e,t,n){var r=this.clippedPos(e,t),i=this.clippedPos(e,n)
return this.applyDelta({start:r,end:i,action:"remove",lines:this.getLinesForRange({start:r,end:i})},!0),this.clonePos(r)},this.removeFullLines=function(e,t){e=Math.min(Math.max(0,e),this.getLength()-1)
var n=(t=Math.min(Math.max(0,t),this.getLength()-1))==this.getLength()-1&&e>0,r=t<this.getLength()-1,i=n?e-1:e,o=n?this.getLine(i).length:0,a=r?t+1:t,c=r?0:this.getLine(a).length,u=new s(i,o,a,c),l=this.$lines.slice(e,t+1)
return this.applyDelta({start:u.start,end:u.end,action:"remove",lines:this.getLinesForRange(u)}),l},this.removeNewLine=function(e){e<this.getLength()-1&&e>=0&&this.applyDelta({start:this.pos(e,this.getLine(e).length),end:this.pos(e+1,0),action:"remove",lines:["",""]})},this.replace=function(e,t){return e instanceof s||(e=s.fromPoints(e.start,e.end)),0===t.length&&e.isEmpty()?e.start:t==this.getTextRange(e)?e.end:(this.remove(e),t?this.insert(e.start,t):e.start)},this.applyDeltas=function(e){for(var t=0;t<e.length;t++)this.applyDelta(e[t])},this.revertDeltas=function(e){for(var t=e.length-1;t>=0;t--)this.revertDelta(e[t])},this.applyDelta=function(e,t){var n="insert"==e.action;(n?e.lines.length<=1&&!e.lines[0]:!s.comparePoints(e.start,e.end))||(n&&e.lines.length>2e4?this.$splitAndapplyLargeDelta(e,2e4):(i(this.$lines,e,t),this._signal("change",e)))},this.$splitAndapplyLargeDelta=function(e,t){for(var n=e.lines,r=n.length-t+1,i=e.start.row,o=e.start.column,s=0,a=0;s<r;s=a){a+=t-1
var c=n.slice(s,a)
c.push(""),this.applyDelta({start:this.pos(i+s,o),end:this.pos(i+a,o=0),action:e.action,lines:c},!0)}e.lines=n.slice(s),e.start.row=i+s,e.start.column=o,this.applyDelta(e,!0)},this.revertDelta=function(e){this.applyDelta({start:this.clonePos(e.start),end:this.clonePos(e.end),action:"insert"==e.action?"remove":"insert",lines:e.lines.slice()})},this.indexToPosition=function(e,t){for(var n=this.$lines||this.getAllLines(),r=this.getNewLineCharacter().length,i=t||0,o=n.length;i<o;i++)if((e-=n[i].length+r)<0)return{row:i,column:e+n[i].length+r}
return{row:o-1,column:e+n[o-1].length+r}},this.positionToIndex=function(e,t){for(var n=this.$lines||this.getAllLines(),r=this.getNewLineCharacter().length,i=0,o=Math.min(e.row,n.length),s=t||0;s<o;++s)i+=n[s].length+r
return i+e.column}}).call(c.prototype),t.Document=c})),ace.define("ace/lib/lang",[],(function(e,t,n){"use strict"
t.last=function(e){return e[e.length-1]},t.stringReverse=function(e){return e.split("").reverse().join("")},t.stringRepeat=function(e,t){for(var n="";t>0;)1&t&&(n+=e),(t>>=1)&&(e+=e)
return n}
var r=/^\s\s*/,i=/\s\s*$/
t.stringTrimLeft=function(e){return e.replace(r,"")},t.stringTrimRight=function(e){return e.replace(i,"")},t.copyObject=function(e){var t={}
for(var n in e)t[n]=e[n]
return t},t.copyArray=function(e){for(var t=[],n=0,r=e.length;n<r;n++)e[n]&&"object"==typeof e[n]?t[n]=this.copyObject(e[n]):t[n]=e[n]
return t},t.deepCopy=function e(t){if("object"!=typeof t||!t)return t
var n
if(Array.isArray(t)){n=[]
for(var r=0;r<t.length;r++)n[r]=e(t[r])
return n}if("[object Object]"!==Object.prototype.toString.call(t))return t
for(var r in n={},t)n[r]=e(t[r])
return n},t.arrayToMap=function(e){for(var t={},n=0;n<e.length;n++)t[e[n]]=1
return t},t.createMap=function(e){var t=Object.create(null)
for(var n in e)t[n]=e[n]
return t},t.arrayRemove=function(e,t){for(var n=0;n<=e.length;n++)t===e[n]&&e.splice(n,1)},t.escapeRegExp=function(e){return e.replace(/([.*+?^${}()|[\]\/\\])/g,"\\$1")},t.escapeHTML=function(e){return(""+e).replace(/&/g,"&#38;").replace(/"/g,"&#34;").replace(/'/g,"&#39;").replace(/</g,"&#60;")},t.getMatchOffsets=function(e,t){var n=[]
return e.replace(t,(function(e){n.push({offset:arguments[arguments.length-2],length:e.length})})),n},t.deferredCall=function(e){var t=null,n=function(){t=null,e()},r=function(e){return r.cancel(),t=setTimeout(n,e||0),r}
return r.schedule=r,r.call=function(){return this.cancel(),e(),r},r.cancel=function(){return clearTimeout(t),t=null,r},r.isPending=function(){return t},r},t.delayedCall=function(e,t){var n=null,r=function(){n=null,e()},i=function(e){null==n&&(n=setTimeout(r,e||t))}
return i.delay=function(e){n&&clearTimeout(n),n=setTimeout(r,e||t)},i.schedule=i,i.call=function(){this.cancel(),e()},i.cancel=function(){n&&clearTimeout(n),n=null},i.isPending=function(){return n},i}})),ace.define("ace/worker/mirror",[],(function(e,t,n){"use strict"
e("../range").Range
var r=e("../document").Document,i=e("../lib/lang"),o=t.Mirror=function(e){this.sender=e
var t=this.doc=new r(""),n=this.deferredUpdate=i.delayedCall(this.onUpdate.bind(this)),o=this
e.on("change",(function(e){var r=e.data
if(r[0].start)t.applyDeltas(r)
else for(var i=0;i<r.length;i+=2){if(Array.isArray(r[i+1]))var s={action:"insert",start:r[i],lines:r[i+1]}
else s={action:"remove",start:r[i],end:r[i+1]}
t.applyDelta(s,!0)}if(o.$timeout)return n.schedule(o.$timeout)
o.onUpdate()}))};(function(){this.$timeout=500,this.setTimeout=function(e){this.$timeout=e},this.setValue=function(e){this.doc.setValue(e),this.deferredUpdate.schedule(this.$timeout)},this.getValue=function(e){this.sender.callback(this.doc.getValue(),e)},this.onUpdate=function(){},this.isPending=function(){return this.deferredUpdate.isPending()}}).call(o.prototype)})),ace.define("ace/mode/javascript/jshint",[],(function(e,t,n){n.exports=function t(n,r,i){var o="function"==typeof e&&e
function s(a,c){if(!r[a]){if(!n[a]){var u="function"==typeof e&&e
if(!c&&u)return u(a,!0)
if(o)return o(a,!0)
var l=new Error("Cannot find module '"+a+"'")
throw l.code="MODULE_NOT_FOUND",l}var f=r[a]={exports:{}}
n[a][0].call(f.exports,(function(e){var t=n[a][1][e]
return s(t||e)}),f,f.exports,t,n,r,i)}return r[a].exports}for(var a=0;a<i.length;a++)s(i[a])
return s(i[0])}({"/node_modules/browserify/node_modules/events/events.js":[function(e,t,n){function r(){this._events=this._events||{},this._maxListeners=this._maxListeners||void 0}function i(e){return"function"==typeof e}function o(e){return"object"==typeof e&&null!==e}function s(e){return void 0===e}t.exports=r,r.EventEmitter=r,r.prototype._events=void 0,r.prototype._maxListeners=void 0,r.defaultMaxListeners=10,r.prototype.setMaxListeners=function(e){if("number"!=typeof e||e<0||isNaN(e))throw TypeError("n must be a positive number")
return this._maxListeners=e,this},r.prototype.emit=function(e){var t,n,r,a,c,u
if(this._events||(this._events={}),"error"===e&&(!this._events.error||o(this._events.error)&&!this._events.error.length)){if((t=arguments[1])instanceof Error)throw t
throw TypeError('Uncaught, unspecified "error" event.')}if(s(n=this._events[e]))return!1
if(i(n))switch(arguments.length){case 1:n.call(this)
break
case 2:n.call(this,arguments[1])
break
case 3:n.call(this,arguments[1],arguments[2])
break
default:for(r=arguments.length,a=new Array(r-1),c=1;c<r;c++)a[c-1]=arguments[c]
n.apply(this,a)}else if(o(n)){for(r=arguments.length,a=new Array(r-1),c=1;c<r;c++)a[c-1]=arguments[c]
for(r=(u=n.slice()).length,c=0;c<r;c++)u[c].apply(this,a)}return!0},r.prototype.addListener=function(e,t){var n
if(!i(t))throw TypeError("listener must be a function");(this._events||(this._events={}),this._events.newListener&&this.emit("newListener",e,i(t.listener)?t.listener:t),this._events[e]?o(this._events[e])?this._events[e].push(t):this._events[e]=[this._events[e],t]:this._events[e]=t,o(this._events[e])&&!this._events[e].warned)&&((n=s(this._maxListeners)?r.defaultMaxListeners:this._maxListeners)&&n>0&&this._events[e].length>n&&(this._events[e].warned=!0,console.error("(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.",this._events[e].length),"function"==typeof console.trace&&console.trace()))
return this},r.prototype.on=r.prototype.addListener,r.prototype.once=function(e,t){if(!i(t))throw TypeError("listener must be a function")
var n=!1
function r(){this.removeListener(e,r),n||(n=!0,t.apply(this,arguments))}return r.listener=t,this.on(e,r),this},r.prototype.removeListener=function(e,t){var n,r,s,a
if(!i(t))throw TypeError("listener must be a function")
if(!this._events||!this._events[e])return this
if(s=(n=this._events[e]).length,r=-1,n===t||i(n.listener)&&n.listener===t)delete this._events[e],this._events.removeListener&&this.emit("removeListener",e,t)
else if(o(n)){for(a=s;a-- >0;)if(n[a]===t||n[a].listener&&n[a].listener===t){r=a
break}if(r<0)return this
1===n.length?(n.length=0,delete this._events[e]):n.splice(r,1),this._events.removeListener&&this.emit("removeListener",e,t)}return this},r.prototype.removeAllListeners=function(e){var t,n
if(!this._events)return this
if(!this._events.removeListener)return 0===arguments.length?this._events={}:this._events[e]&&delete this._events[e],this
if(0===arguments.length){for(t in this._events)"removeListener"!==t&&this.removeAllListeners(t)
return this.removeAllListeners("removeListener"),this._events={},this}if(i(n=this._events[e]))this.removeListener(e,n)
else for(;n.length;)this.removeListener(e,n[n.length-1])
return delete this._events[e],this},r.prototype.listeners=function(e){return this._events&&this._events[e]?i(this._events[e])?[this._events[e]]:this._events[e].slice():[]},r.listenerCount=function(e,t){return e._events&&e._events[t]?i(e._events[t])?1:e._events[t].length:0}},{}],"/node_modules/jshint/data/ascii-identifier-data.js":[function(e,t,n){for(var r=[],i=0;i<128;i++)r[i]=36===i||i>=65&&i<=90||95===i||i>=97&&i<=122
var o=[]
for(i=0;i<128;i++)o[i]=r[i]||i>=48&&i<=57
t.exports={asciiIdentifierStartTable:r,asciiIdentifierPartTable:o}},{}],"/node_modules/jshint/lodash.js":[function(e,t,n){(function(e){(function(){var r,i="[object Arguments]",o="[object Array]",s="[object Boolean]",a="[object Date]",c="[object Error]",u="[object Function]",l="[object Map]",f="[object Number]",h="[object Object]",p="[object RegExp]",d="[object Set]",m="[object String]",v="[object WeakMap]",g="[object ArrayBuffer]",k="[object Float32Array]",b="[object Float64Array]",y="[object Int8Array]",x="[object Int16Array]",E="[object Int32Array]",w="[object Uint8Array]",S="[object Uint8ClampedArray]",W="[object Uint16Array]",j="[object Uint32Array]",L=/\.|\[(?:[^[\]]+|(["'])(?:(?!\1)[^\n\\]|\\.)*?)\1\]/,_=/^\w*$/,A=/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g,M=/[.*+?^${}()|[\]\/\\]/g,O=RegExp(M.source),T=/\\(\\)?/g,G=/\w*$/,V=/^\[object .+?Constructor\]$/,P={}
P[k]=P[b]=P[y]=P[x]=P[E]=P[w]=P[S]=P[W]=P[j]=!0,P[i]=P[o]=P[g]=P[s]=P[a]=P[c]=P[u]=P[l]=P[f]=P[h]=P[p]=P[d]=P[m]=P[v]=!1
var C={}
C[i]=C[o]=C[g]=C[s]=C[a]=C[k]=C[b]=C[y]=C[x]=C[E]=C[f]=C[h]=C[p]=C[m]=C[w]=C[S]=C[W]=C[j]=!0,C[c]=C[u]=C[l]=C[d]=C[v]=!1
var F={function:!0,object:!0},R=F[typeof n]&&n&&!n.nodeType&&n,I=F[typeof t]&&t&&!t.nodeType&&t,U=R&&I&&"object"==typeof e&&e&&e.Object&&e,D=F[typeof self]&&self&&self.Object&&self,q=F[typeof window]&&window&&window.Object&&window,$=I&&I.exports===R&&R,B=U||q!==(this&&this.window)&&q||D||this
function N(e,t,n){if(t!=t)return function(e,t,n){var r=e.length,i=t+(n?0:-1)
for(;n?i--:++i<r;){var o=e[i]
if(o!=o)return i}return-1}(e,n)
for(var r=n-1,i=e.length;++r<i;)if(e[r]===t)return r
return-1}function H(e){return"function"==typeof e||!1}function z(e){return"string"==typeof e?e:null==e?"":e+""}function J(e){return!!e&&"object"==typeof e}var X=Array.prototype,Z=Object.prototype,Q=Function.prototype.toString,Y=Z.hasOwnProperty,K=Z.toString,ee=RegExp("^"+Ot(K).replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$"),te=xt(te=B.ArrayBuffer)&&te,ne=xt(ne=te&&new te(0).slice)&&ne,re=Math.floor,ie=xt(ie=Object.getOwnPropertySymbols)&&ie,oe=xt(oe=Object.getPrototypeOf)&&oe,se=X.push,ae=xt(Object.preventExtensions=Object.preventExtensions)&&ae,ce=Z.propertyIsEnumerable,ue=xt(ue=B.Uint8Array)&&ue,le=function(){try{var e=xt(e=B.Float64Array)&&e,t=new e(new te(10),0,1)&&e}catch(n){}return t}(),fe=function(){var e={1:0},t=ae&&xt(t=Object.assign)&&t
try{t(ae(e),"xo")}catch(n){}return!e[1]&&t}(),he=xt(he=Array.isArray)&&he,pe=xt(pe=Object.keys)&&pe,de=Math.max,me=Math.min,ve=Number.NEGATIVE_INFINITY,ge=Math.pow(2,32)-1,ke=ge-1,be=ge>>>1,ye=le?le.BYTES_PER_ELEMENT:0,xe=Math.pow(2,53)-1
function Ee(){}var we=Ee.support={}
function Se(e,t){var n=-1,r=e.length
for(t||(t=Array(r));++n<r;)t[n]=e[n]
return t}function We(e,t){for(var n=-1,r=e.length;++n<r&&!1!==t(e[n],n,e););return e}function je(e,t){for(var n=-1,r=e.length,i=-1,o=[];++n<r;){var s=e[n]
t(s,n,e)&&(o[++i]=s)}return o}function Le(e,t){for(var n=-1,r=e.length,i=Array(r);++n<r;)i[n]=t(e[n],n,e)
return i}function _e(e,t){for(var n=-1,r=e.length;++n<r;)if(t(e[n],n,e))return!0
return!1}(function(e){var t=function(){this.x=e},n=[]
for(var r in t.prototype={valueOf:e,y:e},new t)n.push(r)
we.funcDecomp=/\bthis\b/.test((function(){return this})),we.funcNames="string"==typeof Function.name
try{we.nonEnumArgs=!ce.call(arguments,1)}catch(i){we.nonEnumArgs=!0}})(1,0)
var Ae=fe||function(e,t){return null==t?e:Me(t,Ye(t),Me(t,Lt(t),e))}
function Me(e,t,n){n||(n={})
for(var r=-1,i=t.length;++r<i;){var o=t[r]
n[o]=e[o]}return n}function Oe(e,t,n){var i,o,s,a,c,u=typeof e
return"function"==u?t===r?e:Ne(e,t,n):null==e?Vt:"object"==u?function(e){var t=Lt(e),n=t.length
if(!n)return Gt(!0)
if(1==n){var i=t[0],o=e[i]
if(rt(o))return function(e){return null!=e&&(e[i]===o&&(o!==r||i in st(e)))}}var s=Array(n),a=Array(n)
for(;n--;)o=e[t[n]],s[n]=o,a[n]=rt(o)
return function(e){return null!=e&&function(e,t,n,i,o){var s=-1,a=t.length,c=!o
for(;++s<a;)if(c&&i[s]?n[s]!==e[t[s]]:!(t[s]in e))return!1
s=-1
for(;++s<a;){var u=t[s],l=e[u],f=n[s]
if(c&&i[s])var h=l!==r||u in e
else(h=o?o(l,f,u):r)===r&&(h=Ue(f,l,o,!0))
if(!h)return!1}return!0}(st(e),t,s,a)}}(e):t===r?Pt(e):(o=t,s=kt(i=e),a=tt(i)&&rt(o),c=i+"",i=at(i),function(e){if(null==e)return!1
var t=c
if(e=st(e),(s||!a)&&!(t in e)){if(null==(e=1==i.length?e:Ie(e,qe(i,0,-1))))return!1
t=lt(i),e=st(e)}return e[t]===o?o!==r||t in e:Ue(o,e[t],null,!0)})}function Te(e,t,n,o,c,l,d){var v
if(n&&(v=c?n(e,o,c):n(e)),v!==r)return v
if(!yt(e))return e
var L=kt(e)
if(L){if(v=function(e){var t=e.length,n=new e.constructor(t)
t&&"string"==typeof e[0]&&Y.call(e,"index")&&(n.index=e.index,n.input=e.input)
return n}(e),!t)return Se(e,v)}else{var _=K.call(e),A=_==u
if(_!=h&&_!=i&&(!A||c))return C[_]?function(e,t,n){var r=e.constructor
switch(t){case g:return He(e)
case s:case a:return new r(+e)
case k:case b:case y:case x:case E:case w:case S:case W:case j:var i=e.buffer
return new r(n?He(i):i,e.byteOffset,e.length)
case f:case m:return new r(e)
case p:var o=new r(e.source,G.exec(e))
o.lastIndex=e.lastIndex}return o}(e,_,t):c?e:{}
if(v=function(e){var t=e.constructor
"function"==typeof t&&t instanceof t||(t=Object)
return new t}(A?{}:e),!t)return Ae(v,e)}l||(l=[]),d||(d=[])
for(var M=l.length;M--;)if(l[M]==e)return d[M]
return l.push(e),d.push(v),(L?We:Re)(e,(function(r,i){v[i]=Te(r,t,n,i,e,l,d)})),v}var Ge,Ve,Pe=(Ge=Re,function(e,t){var n=e?Qe(e):0
if(!nt(n))return Ge(e,t)
for(var r=Ve?n:-1,i=st(e);(Ve?r--:++r<n)&&!1!==t(i[r],r,i););return e})
function Ce(e,t){var n=[]
return Pe(e,(function(e,r,i){t(e,r,i)&&n.push(e)})),n}var Fe=function(e){return function(t,n,r){for(var i=st(t),o=r(t),s=o.length,a=e?s:-1;e?a--:++a<s;){var c=o[a]
if(!1===n(i[c],c,i))break}return t}}()
function Re(e,t){return Fe(e,t,Lt)}function Ie(e,t,n){if(null!=e){n!==r&&n in st(e)&&(t=[n])
for(var i=-1,o=t.length;null!=e&&++i<o;)var s=e=e[t[i]]
return s}}function Ue(e,t,n,r,u,l){if(e===t)return 0!==e||1/e==1/t
var d=typeof e,v=typeof t
return"function"!=d&&"object"!=d&&"function"!=v&&"object"!=v||null==e||null==t?e!=e&&t!=t:function(e,t,n,r,u,l,d){var v=kt(e),g=kt(t),k=o,b=o
v||((k=K.call(e))==i?k=h:k!=h&&(v=St(e)))
g||((b=K.call(t))==i?b=h:b!=h&&(g=St(t)))
var y=k==h,x=b==h,E=k==b
if(E&&!v&&!y)return function(e,t,n){switch(n){case s:case a:return+e==+t
case c:return e.name==t.name&&e.message==t.message
case f:return e!=+e?t!=+t:0==e?1/e==1/t:e==+t
case p:case m:return e==t+""}return!1}(e,t,k)
if(!u){var w=y&&Y.call(e,"__wrapped__"),S=x&&Y.call(t,"__wrapped__")
if(w||S)return n(w?e.value():e,S?t.value():t,r,u,l,d)}if(!E)return!1
l||(l=[]),d||(d=[])
var W=l.length
for(;W--;)if(l[W]==e)return d[W]==t
l.push(e),d.push(t)
var j=(v?Je:Xe)(e,t,n,r,u,l,d)
return l.pop(),d.pop(),j}(e,t,Ue,n,r,u,l)}function De(e){return function(t){return null==t?r:t[e]}}function qe(e,t,n){var i=-1,o=e.length;(t=null==t?0:+t||0)<0&&(t=-t>o?0:o+t),(n=n===r||n>o?o:+n||0)<0&&(n+=o),o=t>n?0:n-t>>>0,t>>>=0
for(var s=Array(o);++i<o;)s[i]=e[i+t]
return s}function $e(e,t){var n
return Pe(e,(function(e,r,i){return!(n=t(e,r,i))})),!!n}function Be(e,t,n){var i=0,o=e?e.length:i
if("number"==typeof t&&t==t&&o<=be){for(;i<o;){var s=i+o>>>1,a=e[s];(n?a<=t:a<t)?i=s+1:o=s}return o}return function(e,t,n,i){t=n(t)
var o=0,s=e?e.length:0,a=t!=t,c=t===r
for(;o<s;){var u=re((o+s)/2),l=n(e[u]),f=l==l
if(a)var h=f||i
else h=c?f&&(i||l!==r):i?l<=t:l<t
h?o=u+1:s=u}return me(s,ke)}(e,t,Vt,n)}function Ne(e,t,n){if("function"!=typeof e)return Vt
if(t===r)return e
switch(n){case 1:return function(n){return e.call(t,n)}
case 3:return function(n,r,i){return e.call(t,n,r,i)}
case 4:return function(n,r,i,o){return e.call(t,n,r,i,o)}
case 5:return function(n,r,i,o,s){return e.call(t,n,r,i,o,s)}}return function(){return e.apply(t,arguments)}}function He(e){return ne.call(e,0)}function ze(e){return vt((function(t,n){var r=-1,i=null==t?0:n.length,o=i>2&&n[i-2],s=i>2&&n[2],a=i>1&&n[i-1]
for("function"==typeof o?(o=Ne(o,a,5),i-=2):i-=(o="function"==typeof a?a:null)?1:0,s&&et(n[0],n[1],s)&&(o=i<3?null:o,i=1);++r<i;){var c=n[r]
c&&e(t,c,o)}return t}))}function Je(e,t,n,i,o,s,a){var c=-1,u=e.length,l=t.length,f=!0
if(u!=l&&!(o&&l>u))return!1
for(;f&&++c<u;){var h=e[c],p=t[c]
if(f=r,i&&(f=o?i(p,h,c):i(h,p,c)),f===r)if(o)for(var d=l;d--&&(p=t[d],!(f=h&&h===p||n(h,p,i,o,s,a))););else f=h&&h===p||n(h,p,i,o,s,a)}return!!f}function Xe(e,t,n,i,o,s,a){var c=Lt(e),u=c.length
if(u!=Lt(t).length&&!o)return!1
for(var l=o,f=-1;++f<u;){var h=c[f],p=o?h in t:Y.call(t,h)
if(p){var d=e[h],m=t[h]
p=r,i&&(p=o?i(m,d,h):i(d,m,h)),p===r&&(p=d&&d===m||n(d,m,i,o,s,a))}if(!p)return!1
l||(l="constructor"==h)}if(!l){var v=e.constructor,g=t.constructor
if(v!=g&&"constructor"in e&&"constructor"in t&&!("function"==typeof v&&v instanceof v&&"function"==typeof g&&g instanceof g))return!1}return!0}function Ze(e,t,n){var r=Ee.callback||Tt
return r=r===Tt?Oe:r,n?r(e,t,n):r}ne||(He=te&&ue?function(e){var t=e.byteLength,n=le?re(t/ye):0,r=n*ye,i=new te(t)
if(n){var o=new le(i,0,n)
o.set(new le(e,0,n))}return t!=r&&(o=new ue(i,r)).set(new ue(e,r)),i}:Gt(null))
var Qe=De("length"),Ye=ie?function(e){return ie(st(e))}:Gt([])
function Ke(e,t){return t=null==t?xe:t,(e=+e)>-1&&e%1==0&&e<t}function et(e,t,n){if(!yt(n))return!1
var r=typeof t
if("number"==r)var i=Qe(n),o=nt(i)&&Ke(t,i)
else o="string"==r&&t in n
if(o){var s=n[t]
return e==e?e===s:s!=s}return!1}function tt(e,t){var n=typeof e
return!!("string"==n&&_.test(e)||"number"==n)||!kt(e)&&(!L.test(e)||null!=t&&e in st(t))}function nt(e){return"number"==typeof e&&e>-1&&e%1==0&&e<=xe}function rt(e){return e==e&&(0===e?1/e>0:!yt(e))}function it(e){var t,n
Ee.support
return!(!J(e)||K.call(e)!=h||!(Y.call(e,"constructor")||"function"!=typeof(t=e.constructor)||t instanceof t))&&(Fe(e,(function(e,t){n=t}),_t),n===r||Y.call(e,n))}function ot(e){for(var t=_t(e),n=t.length,r=n&&e.length,i=Ee.support,o=r&&nt(r)&&(kt(e)||i.nonEnumArgs&&gt(e)),s=-1,a=[];++s<n;){var c=t[s];(o&&Ke(c,r)||Y.call(e,c))&&a.push(c)}return a}function st(e){return yt(e)?e:Object(e)}function at(e){if(kt(e))return e
var t=[]
return z(e).replace(A,(function(e,n,r,i){t.push(r?i.replace(T,"$1"):n||e)})),t}var ct=function(e){return function(t,n,r){return t&&t.length?function(e,t,n){for(var r=e.length,i=n?r:-1;n?i--:++i<r;)if(t(e[i],i,e))return i
return-1}(t,n=Ze(n,r,3),e):-1}}(!0)
function ut(e,t,n){var r=e?e.length:0
if(!r)return-1
if("number"==typeof n)n=n<0?de(r+n,0):n
else if(n){var i=Be(e,t),o=e[i]
return(t==t?t===o:o!=o)?i:-1}return N(e,t,n||0)}function lt(e){var t=e?e.length:0
return t?e[t-1]:r}function ft(e){for(var t=-1,n=(e&&e.length&&function(e){for(var t=-1,n=e.length,r=ve;++t<n;){var i=e[t]
i>r&&(r=i)}return r}(Le(e,Qe)))>>>0,r=Array(n);++t<n;)r[t]=Le(e,De(t))
return r}var ht=vt(ft),pt=function(e,t){return function(n,i,o){return"function"==typeof i&&o===r&&kt(n)?e(n,i):t(n,Ne(i,o,3))}}(We,Pe)
function dt(e,t,n,r){var i=e?Qe(e):0
return nt(i)||(i=(e=Mt(e)).length),!!i&&(n="number"!=typeof n||r&&et(t,n,r)?0:n<0?de(i+n,0):n||0,"string"==typeof e||!kt(e)&&wt(e)?n<i&&e.indexOf(t,n)>-1:function(e,t,n){var r=Ee.indexOf||ut
return r=r===ut?N:r,e?r(e,t,n):r}(e,t,n)>-1)}function mt(e,t,n){var i=kt(e)?_e:$e
return n&&et(e,t,n)&&(t=null),"function"==typeof t&&n===r||(t=Ze(t,n,3)),i(e,t)}function vt(e,t){if("function"!=typeof e)throw new TypeError("Expected a function")
return t=de(t===r?e.length-1:+t||0,0),function(){for(var n=arguments,r=-1,i=de(n.length-t,0),o=Array(i);++r<i;)o[r]=n[t+r]
switch(t){case 0:return e.call(this,o)
case 1:return e.call(this,n[0],o)
case 2:return e.call(this,n[0],n[1],o)}var s=Array(t+1)
for(r=-1;++r<t;)s[r]=n[r]
return s[t]=o,e.apply(this,s)}}function gt(e){return nt(J(e)?e.length:r)&&K.call(e)==i}var kt=he||function(e){return J(e)&&nt(e.length)&&K.call(e)==o}
var bt=H(/x/)||ue&&!H(ue)?function(e){return K.call(e)==u}:H
function yt(e){var t=typeof e
return"function"==t||!!e&&"object"==t}function xt(e){return null!=e&&(K.call(e)==u?ee.test(Q.call(e)):J(e)&&V.test(e))}var Et=oe?function(e){if(!e||K.call(e)!=h)return!1
var t=e.valueOf,n=xt(t)&&(n=oe(t))&&oe(n)
return n?e==n||oe(e)==n:it(e)}:it
function wt(e){return"string"==typeof e||J(e)&&K.call(e)==m}function St(e){return J(e)&&nt(e.length)&&!!P[K.call(e)]}function Wt(e){return Me(e,_t(e))}var jt=ze((function(e,t,n){return n?function(e,t,n){var i=Lt(t)
se.apply(i,Ye(t))
for(var o=-1,s=i.length;++o<s;){var a=i[o],c=e[a],u=n(c,t[a],a,e,t);((u==u?u!==c:c==c)||c===r&&!(a in e))&&(e[a]=u)}return e}(e,t,n):Ae(e,t)}))
var Lt=pe?function(e){if(e)var t=e.constructor,n=e.length
return"function"==typeof t&&t.prototype===e||"function"!=typeof e&&nt(n)?ot(e):yt(e)?pe(e):[]}:ot
function _t(e){if(null==e)return[]
yt(e)||(e=Object(e))
var t=e.length
t=t&&nt(t)&&(kt(e)||we.nonEnumArgs&&gt(e))&&t||0
for(var n=e.constructor,r=-1,i="function"==typeof n&&n.prototype===e,o=Array(t),s=t>0;++r<t;)o[r]=r+""
for(var a in e)s&&Ke(a,t)||"constructor"==a&&(i||!Y.call(e,a))||o.push(a)
return o}var At=ze((function e(t,n,i,o,s){if(!yt(t))return t
var a=nt(n.length)&&(kt(n)||St(n))
if(!a){var c=Lt(n)
se.apply(c,Ye(n))}return We(c||n,(function(u,l){if(c&&(u=n[l=u]),J(u))o||(o=[]),s||(s=[]),function(e,t,n,i,o,s,a){var c=s.length,u=t[n]
for(;c--;)if(s[c]==u)return void(e[n]=a[c])
var l=e[n],f=o?o(l,u,n,e,t):r,h=f===r
h&&(f=u,nt(u.length)&&(kt(u)||St(u))?f=kt(l)?l:Qe(l)?Se(l):[]:Et(u)||gt(u)?f=gt(l)?Wt(l):Et(l)?l:{}:h=!1)
s.push(u),a.push(f),h?e[n]=i(f,u,o,s,a):(f==f?f!==l:l==l)&&(e[n]=f)}(t,n,l,e,i,o,s)
else{var f=t[l],h=i?i(f,u,l,t,n):r,p=h===r
p&&(h=u),!a&&h===r||!p&&(h==h?h===f:f!=f)||(t[l]=h)}})),t}))
function Mt(e){return function(e,t){for(var n=-1,r=t.length,i=Array(r);++n<r;)i[n]=e[t[n]]
return i}(e,Lt(e))}function Ot(e){return(e=z(e))&&O.test(e)?e.replace(M,"\\$&"):e}function Tt(e,t,n){return n&&et(e,t,n)&&(t=null),Oe(e,t)}function Gt(e){return function(){return e}}function Vt(e){return e}function Pt(e){return tt(e)?De(e):function(e){var t=e+""
return e=at(e),function(n){return Ie(n,e,t)}}(e)}Ee.assign=jt,Ee.callback=Tt,Ee.constant=Gt,Ee.forEach=pt,Ee.keys=Lt,Ee.keysIn=_t,Ee.merge=At,Ee.property=Pt,Ee.reject=function(e,t,n){var r=kt(e)?je:Ce
return t=Ze(t,n,3),r(e,(function(e,n,r){return!t(e,n,r)}))},Ee.restParam=vt,Ee.slice=function(e,t,n){var r=e?e.length:0
return r?(n&&"number"!=typeof n&&et(e,t,n)&&(t=0,n=r),qe(e,t,n)):[]},Ee.toPlainObject=Wt,Ee.unzip=ft,Ee.values=Mt,Ee.zip=ht,Ee.each=pt,Ee.extend=jt,Ee.iteratee=Tt,Ee.clone=function(e,t,n,r){return t&&"boolean"!=typeof t&&et(e,t,n)?t=!1:"function"==typeof t&&(r=n,n=t,t=!1),Te(e,t,n="function"==typeof n&&Ne(n,r,1))},Ee.escapeRegExp=Ot,Ee.findLastIndex=ct,Ee.has=function(e,t){if(null==e)return!1
var n=Y.call(e,t)
return n||tt(t)||(e=1==(t=at(t)).length?e:Ie(e,qe(t,0,-1)),t=lt(t),n=null!=e&&Y.call(e,t)),n},Ee.identity=Vt,Ee.includes=dt,Ee.indexOf=ut,Ee.isArguments=gt,Ee.isArray=kt,Ee.isEmpty=function(e){if(null==e)return!0
var t=Qe(e)
return nt(t)&&(kt(e)||wt(e)||gt(e)||J(e)&&bt(e.splice))?!t:!Lt(e).length},Ee.isFunction=bt,Ee.isNative=xt
Ee.isNumber=function(e){return"number"==typeof e||J(e)&&K.call(e)==f},Ee.isObject=yt,Ee.isPlainObject=Et,Ee.isString=wt,Ee.isTypedArray=St,Ee.last=lt,Ee.some=mt,Ee.any=mt,Ee.contains=dt,Ee.include=dt,Ee.VERSION="3.7.0",R&&I?$?(I.exports=Ee)._=Ee:R._=Ee:B._=Ee}).call(this)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],"/node_modules/jshint/src/jshint.js":[function(e,t,n){var r=e("../lodash"),i=e("events"),o=e("./vars.js"),s=e("./messages.js"),a=e("./lex.js").Lexer,c=e("./reg.js"),u=e("./state.js").state,l=e("./style.js"),f=e("./options.js"),h=e("./scope-manager.js"),p=function(){"use strict"
var e,t,n,d,m,v,g,k,b,y,x,E={"<":!0,"<=":!0,"==":!0,"===":!0,"!==":!0,"!=":!0,">":!0,">=":!0,"+":!0,"-":!0,"*":!0,"/":!0,"%":!0},w=["closure","exception","global","label","outer","unused","var"],S=[],W=new i.EventEmitter
function j(e,t){return e=e.trim(),!!/^[+-]W\d{3}$/g.test(e)||(!(-1===f.validNames.indexOf(e)&&"jslint"!==t.type&&!r.has(f.removed,e))||(P("E001",t,e),!1))}function L(e,t){return!!e&&!(!e.identifier||e.value!==t)}function _(e){if(!e.reserved)return!1
var t=e.meta
if(t&&t.isFutureReservedWord&&u.inES5()){if(!t.es5)return!1
if(t.strictOnly&&!u.option.strict&&!u.isStrict())return!1
if(e.isProperty)return!1}return!0}function A(e,t){Object.keys(t).forEach((function(n){r.has(p.blacklist,n)||(e[n]=t[n])}))}function M(){(function(){if(u.option.enforceall){for(var e in f.bool.enforcing)void 0!==u.option[e]||f.noenforceall[e]||(u.option[e]=!0)
for(var t in f.bool.relaxing)void 0===u.option[t]&&(u.option[t]=!1)}})(),u.option.esversion||u.option.moz||(u.option.es3?u.option.esversion=3:u.option.esnext?u.option.esversion=6:u.option.esversion=5),u.inES5()&&A(y,o.ecmaIdentifiers[5]),u.inES6()&&A(y,o.ecmaIdentifiers[6]),u.option.module&&(!0===u.option.strict&&(u.option.strict="global"),u.inES6()||G("W134",u.tokens.next,"module",6)),u.option.couch&&A(y,o.couch),u.option.qunit&&A(y,o.qunit),u.option.rhino&&A(y,o.rhino),u.option.shelljs&&(A(y,o.shelljs),A(y,o.node)),u.option.typed&&A(y,o.typed),u.option.phantom&&(A(y,o.phantom),!0===u.option.strict&&(u.option.strict="global")),u.option.prototypejs&&A(y,o.prototypejs),u.option.node&&(A(y,o.node),A(y,o.typed),!0===u.option.strict&&(u.option.strict="global")),u.option.devel&&A(y,o.devel),u.option.dojo&&A(y,o.dojo),u.option.browser&&(A(y,o.browser),A(y,o.typed)),u.option.browserify&&(A(y,o.browser),A(y,o.typed),A(y,o.browserify),!0===u.option.strict&&(u.option.strict="global")),u.option.nonstandard&&A(y,o.nonstandard),u.option.jasmine&&A(y,o.jasmine),u.option.jquery&&A(y,o.jquery),u.option.mootools&&A(y,o.mootools),u.option.worker&&A(y,o.worker),u.option.wsh&&A(y,o.wsh),u.option.globalstrict&&!1!==u.option.strict&&(u.option.strict="global"),u.option.yui&&A(y,o.yui),u.option.mocha&&A(y,o.mocha)}function O(e,t,n){var r=Math.floor(t/u.lines.length*100),i=s.errors[e].desc
throw{name:"JSHintError",line:t,character:n,message:i+" ("+r+"% scanned).",raw:i,code:e}}function T(){var e=u.ignoredLines
r.isEmpty(e)||(p.errors=r.reject(p.errors,(function(t){return e[t.line]})))}function G(e,t,n,r,i,o){var a,c,l,f,h,d
if(/^W\d{3}$/.test(e)){if(u.ignored[e])return
f=s.warnings[e]}else/E\d{3}/.test(e)?f=s.errors[e]:/I\d{3}/.test(e)&&(f=s.info[e])
return"(end)"===(t=t||u.tokens.next||{}).id&&(t=u.tokens.curr),c=t.line||0,a=t.from||0,(l={id:"(error)",raw:f.desc,code:f.code,evidence:u.lines[c-1]||"",line:c,character:a,scope:p.scope,a:n,b:r,c:i,d:o}).reason=(h=f.desc,d=l,h.replace(/\{([^{}]*)\}/g,(function(e,t){var n=d[t]
return"string"==typeof n||"number"==typeof n?n:e}))),p.errors.push(l),T(),p.errors.length>=u.option.maxerr&&O("E043",c,a),l}function V(e,t,n,r,i,o,s){return G(e,{line:t,from:n},r,i,o,s)}function P(e,t,n,r,i,o){G(e,t,n,r,i,o)}function C(e,t,n,r,i,o,s){return P(e,{line:t,from:n},r,i,o,s)}function F(e,t){var n
return n={id:"(internal)",elem:e,value:t},p.internals.push(n),n}function R(){var e=u.tokens.next,n=e.body.match(/(-\s+)?[^\s,:]+(?:\s*:\s*(-\s+)?[^\s,]+)?/g)||[],i={}
if("globals"===e.type)for(var o in n.forEach((function(t,r){var o=((t=t.split(":"))[0]||"").trim(),s=(t[1]||"").trim()
if("-"!==o&&o.length)"-"===o.charAt(0)?(o=o.slice(1),s=!1,p.blacklist[o]=o,delete y[o]):i[o]="true"===s
else{if(r>0&&r===n.length-1)return
P("E002",e)}})),A(y,i),i)r.has(i,o)&&(t[o]=e)
"exported"===e.type&&n.forEach((function(t,r){if(t.length)u.funct["(scope)"].addExported(t)
else{if(r>0&&r===n.length-1)return
P("E002",e)}})),"members"===e.type&&(b=b||{},n.forEach((function(e){var t=e.charAt(0)
t!==e.charAt(e.length-1)||'"'!==t&&"'"!==t||(e=e.substr(1,e.length-2).replace('\\"','"')),b[e]=!1})))
var s=["maxstatements","maxparams","maxdepth","maxcomplexity","maxerr","maxlen","indent"]
"jshint"!==e.type&&"jslint"!==e.type||(n.forEach((function(t){var n=((t=t.split(":"))[0]||"").trim(),i=(t[1]||"").trim()
if(j(n,e))if(s.indexOf(n)>=0)if("false"!==i){if("number"!=typeof(i=+i)||!isFinite(i)||i<=0||Math.floor(i)!==i)return void P("E032",e,t[1].trim())
u.option[n]=i}else u.option[n]="indent"===n&&4
else{if("validthis"===n)return u.funct["(global)"]?void P("E009"):"true"!==i&&"false"!==i?void P("E002",e):void(u.option.validthis="true"===i)
if("quotmark"!==n)if("shadow"!==n)if("unused"!==n)if("latedef"!==n)if("ignore"!==n)if("strict"!==n){"module"===n&&(Me(u.funct)||P("E055",u.tokens.next,"module"))
var o={es3:3,es5:5,esnext:6}
if(r.has(o,n))switch(i){case"true":u.option.moz=!1,u.option.esversion=o[n]
break
case"false":u.option.moz||(u.option.esversion=5)
break
default:P("E002",e)}else if("esversion"!==n){var a,c=/^([+-])(W\d{3})$/g.exec(n)
if(!c)return"true"===i||"false"===i?("jslint"===e.type?(a=f.renamed[n]||n,u.option[a]="true"===i,void 0!==f.inverted[a]&&(u.option[a]=!u.option[a])):u.option[n]="true"===i,void("newcap"===n&&(u.option["(explicitNewcap)"]=!0))):void P("E002",e)
u.ignored[c[2]]="-"===c[1]}else{switch(i){case"5":u.inES5(!0)&&G("I003")
case"3":case"6":u.option.moz=!1,u.option.esversion=+i
break
case"2015":u.option.moz=!1,u.option.esversion=6
break
default:P("E002",e)}Me(u.funct)||P("E055",u.tokens.next,"esversion")}}else switch(i){case"true":u.option.strict=!0
break
case"false":u.option.strict=!1
break
case"func":case"global":case"implied":u.option.strict=i
break
default:P("E002",e)}else switch(i){case"line":u.ignoredLines[e.line]=!0,T()
break
default:P("E002",e)}else switch(i){case"true":u.option.latedef=!0
break
case"false":u.option.latedef=!1
break
case"nofunc":u.option.latedef="nofunc"
break
default:P("E002",e)}else switch(i){case"true":u.option.unused=!0
break
case"false":u.option.unused=!1
break
case"vars":case"strict":u.option.unused=i
break
default:P("E002",e)}else switch(i){case"true":u.option.shadow=!0
break
case"outer":u.option.shadow="outer"
break
case"false":case"inner":u.option.shadow="inner"
break
default:P("E002",e)}else switch(i){case"true":case"false":u.option.quotmark="true"===i
break
case"double":case"single":u.option.quotmark=i
break
default:P("E002",e)}}})),M())}function I(e){var t,n=e||0,r=v.length
if(n<r)return v[n]
for(;r<=n;)(t=v[r])||(t=v[r]=g.token()),r+=1
return t||"(end)"!==u.tokens.next.id?t:u.tokens.next}function U(){var e,t=0
do{e=I(t++)}while("(endline)"===e.id)
return e}function D(e,t){switch(u.tokens.curr.id){case"(number)":"."===u.tokens.next.id&&G("W005",u.tokens.curr)
break
case"-":"-"!==u.tokens.next.id&&"--"!==u.tokens.next.id||G("W006")
break
case"+":"+"!==u.tokens.next.id&&"++"!==u.tokens.next.id||G("W007")}for(e&&u.tokens.next.id!==e&&(t?"(end)"===u.tokens.next.id?P("E019",t,t.id):P("E020",u.tokens.next,e,t.id,t.line,u.tokens.next.value):"(identifier)"===u.tokens.next.type&&u.tokens.next.value===e||G("W116",u.tokens.next,e,u.tokens.next.value)),u.tokens.prev=u.tokens.curr,u.tokens.curr=u.tokens.next;;){if(u.tokens.next=v.shift()||g.token(),u.tokens.next||O("E041",u.tokens.curr.line),"(end)"===u.tokens.next.id||"(error)"===u.tokens.next.id)return
if(u.tokens.next.check&&u.tokens.next.check(),u.tokens.next.isSpecial)"falls through"===u.tokens.next.type?u.tokens.curr.caseFallsThrough=!0:R()
else if("(endline)"!==u.tokens.next.id)break}}function q(e){return e.infix||!e.identifier&&!e.template&&!!e.led}function $(){var e=u.tokens.curr,t=u.tokens.next
return";"===t.id||"}"===t.id||":"===t.id||!!(q(t)===q(e)||"yield"===e.id&&u.inMoz())&&e.line!==N(t)}function B(e,t){var n,i=!1,o=!1,s=!1
if(u.nameStack.push(),t||"let"!==u.tokens.next.value||"("!==I(0).value||(u.inMoz()||G("W118",u.tokens.next,"let expressions"),s=!0,u.funct["(scope)"].stack(),D("let"),D("("),u.tokens.prev.fud(),D(")")),"(end)"===u.tokens.next.id&&P("E006",u.tokens.curr),u.option.asi&&u.tokens.prev.line!==N(u.tokens.curr)&&r.contains(["]",")"],u.tokens.prev.id)&&r.contains(["[","("],u.tokens.curr.id)&&G("W014",u.tokens.curr,u.tokens.curr.id),D(),t&&(u.funct["(verb)"]=u.tokens.curr.value,u.tokens.curr.beginsStmt=!0),!0===t&&u.tokens.curr.fud)n=u.tokens.curr.fud()
else for(u.tokens.curr.nud?n=u.tokens.curr.nud():P("E030",u.tokens.curr,u.tokens.curr.id);(e<u.tokens.next.lbp||"(template)"===u.tokens.next.type)&&!$();)i="Array"===u.tokens.curr.value,o="Object"===u.tokens.curr.value,n&&(n.value||n.first&&n.first.value)&&("new"!==n.value||n.first&&n.first.value&&"."===n.first.value)&&(i=!1,n.value!==u.tokens.curr.value&&(o=!1)),D(),i&&"("===u.tokens.curr.id&&")"===u.tokens.next.id&&G("W009",u.tokens.curr),o&&"("===u.tokens.curr.id&&")"===u.tokens.next.id&&G("W010",u.tokens.curr),n&&u.tokens.curr.led?n=u.tokens.curr.led(n):P("E033",u.tokens.curr,u.tokens.curr.id)
return s&&u.funct["(scope)"].unstack(),u.nameStack.pop(),n}function N(e){return e.startLine||e.line}function H(e,t){e=e||u.tokens.curr,t=t||u.tokens.next,u.option.laxbreak||e.line===N(t)||G("W014",t,t.value)}function z(e){(e=e||u.tokens.curr).line!==N(u.tokens.next)&&G("E022",e,e.value)}function J(e,t){e.line!==N(t)&&(u.option.laxcomma||(X.first&&(G("I001"),X.first=!1),G("W014",e,t.value)))}function X(e){if((e=e||{}).peek?J(u.tokens.prev,u.tokens.curr):(J(u.tokens.curr,u.tokens.next),D(",")),u.tokens.next.identifier&&(!e.property||!u.inES5()))switch(u.tokens.next.value){case"break":case"case":case"catch":case"continue":case"default":case"do":case"else":case"finally":case"for":case"if":case"in":case"instanceof":case"return":case"switch":case"throw":case"try":case"var":case"let":case"while":case"with":return P("E024",u.tokens.next,u.tokens.next.value),!1}if("(punctuator)"===u.tokens.next.type)switch(u.tokens.next.value){case"}":case"]":case",":if(e.allowTrailing)return!0
case")":return P("E024",u.tokens.next,u.tokens.next.value),!1}return!0}function Z(e,t){var n=u.syntax[e]
return n&&"object"==typeof n||(u.syntax[e]=n={id:e,lbp:t,value:e}),n}function Q(e){var t=Z(e,0)
return t.delim=!0,t}function Y(e,t){var n=Q(e)
return n.identifier=n.reserved=!0,n.fud=t,n}function K(e,t){var n=Y(e,t)
return n.block=!0,n}function ee(e){var t=e.id.charAt(0)
return(t>="a"&&t<="z"||t>="A"&&t<="Z")&&(e.identifier=e.reserved=!0),e}function te(e,t){var n=Z(e,150)
return ee(n),n.nud="function"==typeof t?t:function(){return this.arity="unary",this.right=B(150),"++"!==this.id&&"--"!==this.id||(u.option.plusplus?G("W016",this,this.id):!this.right||this.right.identifier&&!_(this.right)||"."===this.right.id||"["===this.right.id||G("W017",this),this.right&&this.right.isMetaProperty?P("E031",this):this.right&&this.right.identifier&&u.funct["(scope)"].block.modify(this.right.value,this)),this},n}function ne(e,t){var n=Q(e)
return n.type=e,n.nud=t,n}function re(e,t){var n=ne(e,t)
return n.identifier=!0,n.reserved=!0,n}function ie(e,t){var n=ne(e,t&&t.nud||function(){return this})
return(t=t||{}).isFutureReservedWord=!0,n.value=e,n.identifier=!0,n.reserved=!0,n.meta=t,n}function oe(e,t){return re(e,(function(){return"function"==typeof t&&t(this),this}))}function se(e,t,n,r){var i=Z(e,n)
return ee(i),i.infix=!0,i.led=function(i){return r||H(u.tokens.prev,u.tokens.curr),"in"!==e&&"instanceof"!==e||"!"!==i.id||G("W018",i,"!"),"function"==typeof t?t(i,this):(this.left=i,this.right=B(n),this)},i}function ae(e,t){var n=Z(e,100)
return n.led=function(e){H(u.tokens.prev,u.tokens.curr),this.left=e
var n=this.right=B(100)
return L(e,"NaN")||L(n,"NaN")?G("W019",this):t&&t.apply(this,[e,n]),e&&n||O("E041",u.tokens.curr.line),"!"===e.id&&G("W018",e,"!"),"!"===n.id&&G("W018",n,"!"),this},n}function ce(e){return e&&("(number)"===e.type&&0==+e.value||"(string)"===e.type&&""===e.value||"null"===e.type&&!u.option.eqnull||"true"===e.type||"false"===e.type||"undefined"===e.type)}var ue={}
function le(e,t,n){var i
return!n.option.notypeof&&(!(!e||!t)&&(i=n.inES6()?ue.es6:ue.es3,"(identifier)"===t.type&&"typeof"===t.value&&"(string)"===e.type&&!r.contains(i,e.value)))}function fe(e,t){var n=!1
return"this"===e.type&&null===t.funct["(context)"]?n=!0:"(identifier)"===e.type&&(t.option.node&&"global"===e.value?n=!0:!t.option.browser||"window"!==e.value&&"document"!==e.value||(n=!0)),n}function he(e,t,n){var r=n&&n.allowDestructuring
if(t=t||e,u.option.freeze){var i=function(e){var t=["Array","ArrayBuffer","Boolean","Collator","DataView","Date","DateTimeFormat","Error","EvalError","Float32Array","Float64Array","Function","Infinity","Intl","Int16Array","Int32Array","Int8Array","Iterator","Number","NumberFormat","Object","RangeError","ReferenceError","RegExp","StopIteration","String","SyntaxError","TypeError","Uint16Array","Uint32Array","Uint8Array","Uint8ClampedArray","URIError"],n=function e(t){if("object"==typeof t)return"prototype"===t.right?t:e(t.left)}(e)
if(n)return function(e){for(;!e.identifier&&"object"==typeof e.left;)e=e.left
if(e.identifier&&t.indexOf(e.value)>=0)return e.value}(n)}(e)
i&&G("W121",e,i)}return e.identifier&&!e.isMetaProperty&&u.funct["(scope)"].block.reassign(e.value,e),"."===e.id?(e.left&&("arguments"!==e.left.value||u.isStrict())||G("E031",t),u.nameStack.set(u.tokens.prev),!0):"{"===e.id||"["===e.id?(r&&u.tokens.curr.left.destructAssign?u.tokens.curr.left.destructAssign.forEach((function(e){e.id&&u.funct["(scope)"].block.modify(e.id,e.token)})):"{"!==e.id&&e.left&&("arguments"!==e.left.value||u.isStrict())||G("E031",t),"["===e.id&&u.nameStack.set(e.right),!0):e.isMetaProperty?(P("E031",t),!0):e.identifier&&!_(e)?("exception"===u.funct["(scope)"].labeltype(e.value)&&G("W022",e),u.nameStack.set(e),!0):(e===u.syntax.function&&G("W023",u.tokens.curr),!1)}function pe(e,t,n){var r=se(e,"function"==typeof t?t:function(e,t){if(t.left=e,e&&he(e,t,{allowDestructuring:!0}))return t.right=B(10),t
P("E031",t)},n)
return r.exps=!0,r.assign=!0,r}function de(e,t,n){var r=Z(e,n)
return ee(r),r.led="function"==typeof t?t:function(e){return u.option.bitwise&&G("W016",this,this.id),this.left=e,this.right=B(n),this},r}function me(e){return pe(e,(function(e,t){if(u.option.bitwise&&G("W016",t,t.id),e&&he(e,t))return t.right=B(10),t
P("E031",t)}),20)}function ve(e){var t=Z(e,150)
return t.led=function(e){return u.option.plusplus?G("W016",this,this.id):e.identifier&&!_(e)||"."===e.id||"["===e.id||G("W017",this),e.isMetaProperty?P("E031",this):e&&e.identifier&&u.funct["(scope)"].block.modify(e.value,e),this.left=e,this},t}function ge(e,t,n){if(u.tokens.next.identifier){n||D()
var r=u.tokens.curr,i=u.tokens.curr.value
return _(r)?(t&&u.inES5()||e&&"undefined"===i||G("W024",u.tokens.curr,u.tokens.curr.id),i):i}}function ke(e,t){var n=ge(e,t,!1)
if(n)return n
if("..."===u.tokens.next.value){if(u.inES6(!0)||G("W119",u.tokens.next,"spread/rest operator","6"),D(),Je(u.tokens.next,"..."))for(G("E024",u.tokens.next,"...");Je(u.tokens.next,"...");)D()
return u.tokens.next.identifier?ke(e,t):void G("E024",u.tokens.curr,"...")}P("E030",u.tokens.next,u.tokens.next.value),";"!==u.tokens.next.id&&D()}function be(e){var t,n=0
if(";"===u.tokens.next.id&&!e.inBracelessBlock)for(;;){do{t=I(n),n+=1}while("(end)"!==t.id&&"(comment)"===t.id)
if(t.reach)return
if("(endline)"!==t.id){if("function"===t.id){!0===u.option.latedef&&G("W026",t)
break}G("W027",t,t.value,e.value)
break}}}function ye(){var e,t=m,n=u.tokens.next,r=!1
if(";"!==n.id){var i=_(n)
if(i&&n.meta&&n.meta.isFutureReservedWord&&":"===I().id&&(G("W024",n,n.id),i=!1),n.identifier&&!i&&":"===I().id&&(D(),D(":"),r=!0,u.funct["(scope)"].stack(),u.funct["(scope)"].block.addBreakLabel(n.value,{token:u.tokens.curr}),u.tokens.next.labelled||"{"===u.tokens.next.value||G("W028",u.tokens.next,n.value,u.tokens.next.value),u.tokens.next.label=n.value,n=u.tokens.next),"{"!==n.id)return!(e=B(0,!0))||e.identifier&&"function"===e.value||"(punctuator)"===e.type&&e.left&&e.left.identifier&&"function"===e.left.value||u.isStrict()||"global"!==u.option.strict||G("E007"),n.block||(u.option.expr||e&&e.exps?u.option.nonew&&e&&e.left&&"("===e.id&&"new"===e.left.id&&G("W031",n):G("W030",u.tokens.curr),function(){if(";"!==u.tokens.next.id){if(u.tokens.next.isUnclosed)return D()
var e=N(u.tokens.next)===u.tokens.curr.line&&"(end)"!==u.tokens.next.id,t=Je(u.tokens.next,"}")
e&&!t?C("E058",u.tokens.curr.line,u.tokens.curr.character):u.option.asi||(t&&!u.option.lastsemic||!e)&&V("W033",u.tokens.curr.line,u.tokens.curr.character)}else D(";")}()),m=t,r&&u.funct["(scope)"].unstack(),e
we(!0,!0,!1,!1,"case"===u.funct["(verb)"]&&":"===u.tokens.curr.value)}else D(";")}function xe(){for(var e,t=[];!u.tokens.next.reach&&"(end)"!==u.tokens.next.id;)";"===u.tokens.next.id?((!(e=I())||"("!==e.id&&"["!==e.id)&&G("W032"),D(";")):t.push(ye())
return t}function Ee(){for(var e,t,n;"(string)"===u.tokens.next.id;){if("(endline)"===(t=I(0)).id){e=1
do{n=I(e++)}while("(endline)"===n.id)
if(";"===n.id)t=n
else{if("["===n.value||"."===n.value)break
u.option.asi&&"("!==n.value||G("W033",u.tokens.next)}}else{if("."===t.id||"["===t.id)break
";"!==t.id&&G("W033",t)}D()
var r=u.tokens.curr.value;(u.directive[r]||"use strict"===r&&"implied"===u.option.strict)&&G("W034",u.tokens.curr,r),u.directive[r]=!0,";"===t.id&&D(";")}u.isStrict()&&(u.option["(explicitNewcap)"]||(u.option.newcap=!0),u.option.undef=!0)}function we(e,t,n,i,o){var s,a,c,l,f=d,h=m
d=e,c=u.tokens.next
var p=u.funct["(metrics)"]
if(p.nestedBlockDepth+=1,p.verifyMaxNestedBlockDepthPerFunction(),"{"===u.tokens.next.id){if(D("{"),u.funct["(scope)"].stack(),u.tokens.curr.line,"}"!==u.tokens.next.id){for(m+=u.option.indent;!e&&u.tokens.next.from>m;)m+=u.option.indent
if(n){for(l in a={},u.directive)r.has(u.directive,l)&&(a[l]=u.directive[l])
Ee(),u.option.strict&&u.funct["(context)"]["(global)"]&&(a["use strict"]||u.isStrict()||G("E007"))}s=xe(),p.statementCount+=s.length,m-=u.option.indent}D("}",c),n&&(u.funct["(scope)"].validateParams(),a&&(u.directive=a)),u.funct["(scope)"].unstack(),m=h}else if(e)u.funct["(noblockscopedvar)"]="for"!==u.tokens.next.id,u.funct["(scope)"].stack(),t&&!u.option.curly||G("W116",u.tokens.next,"{",u.tokens.next.value),u.tokens.next.inBracelessBlock=!0,m+=u.option.indent,s=[ye()],m-=u.option.indent,u.funct["(scope)"].unstack(),delete u.funct["(noblockscopedvar)"]
else if(n){if(u.funct["(scope)"].stack(),a={},!t||i||u.inMoz()||P("W118",u.tokens.curr,"function closure expressions"),!t)for(l in u.directive)r.has(u.directive,l)&&(a[l]=u.directive[l])
B(10),u.option.strict&&u.funct["(context)"]["(global)"]&&(a["use strict"]||u.isStrict()||G("E007")),u.funct["(scope)"].unstack()}else P("E021",u.tokens.next,"{",u.tokens.next.value)
switch(u.funct["(verb)"]){case"break":case"continue":case"return":case"throw":if(o)break
default:u.funct["(verb)"]=null}return d=f,!e||!u.option.noempty||s&&0!==s.length||G("W035",u.tokens.prev),p.nestedBlockDepth-=1,s}function Se(e){b&&"boolean"!=typeof b[e]&&G("W036",u.tokens.curr,e),"number"==typeof k[e]?k[e]+=1:k[e]=1}ue.legacy=["xml","unknown"],ue.es3=["undefined","boolean","number","string","function","object"],ue.es3=ue.es3.concat(ue.legacy),ue.es6=ue.es3.concat("symbol"),ne("(number)",(function(){return this})),ne("(string)",(function(){return this})),u.syntax["(identifier)"]={type:"(identifier)",lbp:0,identifier:!0,nud:function(){var e=this.value
return"=>"===u.tokens.next.id||u.funct["(comparray)"].check(e)||u.funct["(scope)"].block.use(e,u.tokens.curr),this},led:function(){P("E033",u.tokens.next,u.tokens.next.value)}}
var We={lbp:0,identifier:!1,template:!0}
u.syntax["(template)"]=r.extend({type:"(template)",nud:Oe,led:Oe,noSubst:!1},We),u.syntax["(template middle)"]=r.extend({type:"(template middle)",middle:!0,noSubst:!1},We),u.syntax["(template tail)"]=r.extend({type:"(template tail)",tail:!0,noSubst:!1},We),u.syntax["(no subst template)"]=r.extend({type:"(template)",nud:Oe,led:Oe,noSubst:!0,tail:!0},We),ne("(regexp)",(function(){return this})),Q("(endline)"),Q("(begin)"),Q("(end)").reach=!0,Q("(error)").reach=!0,Q("}").reach=!0,Q(")"),Q("]"),Q('"').reach=!0,Q("'").reach=!0,Q(";"),Q(":").reach=!0,Q("#"),re("else"),re("case").reach=!0,re("catch"),re("default").reach=!0,re("finally"),oe("arguments",(function(e){u.isStrict()&&u.funct["(global)"]&&G("E008",e)})),oe("eval"),oe("false"),oe("Infinity"),oe("null"),oe("this",(function(e){u.isStrict()&&!(u.funct["(statement)"]&&"class"===u.funct["(statement)"].type||u.funct["(context)"]&&"class"===u.funct["(context)"]["(verb)"])&&!u.option.validthis&&(u.funct["(statement)"]&&u.funct["(name)"].charAt(0)>"Z"||u.funct["(global)"])&&G("W040",e)})),oe("true"),oe("undefined")
pe("=","assign",20),pe("+=","assignadd",20),pe("-=","assignsub",20),pe("*=","assignmult",20),pe("/=","assigndiv",20).nud=function(){P("E014")},pe("%=","assignmod",20),me("&="),me("|="),me("^="),me("<<="),me(">>="),me(">>>="),se(",",(function(e,t){var n
if(t.exprs=[e],u.option.nocomma&&G("W127"),!X({peek:!0}))return t
for(;(n=B(10))&&(t.exprs.push(n),","===u.tokens.next.value&&X()););return t}),10,!0),se("?",(function(e,t){return Ve(),t.left=e,t.right=B(10),D(":"),t.else=B(10),t}),30)
function je(e){return e.identifier||"(string)"===e.id||"(number)"===e.id}function Le(e){var t,n=!0
return(t="object"==typeof e?e:ge(!1,!0,n=e))?"object"==typeof t&&("(string)"===t.id||"(identifier)"===t.id?t=t.value:"(number)"===t.id&&(t=t.value.toString())):"(string)"===u.tokens.next.id?(t=u.tokens.next.value,n||D()):"(number)"===u.tokens.next.id&&(t=u.tokens.next.value.toString(),n||D()),"hasOwnProperty"===t&&G("W001"),t}function _e(e,t,n){var i={"(name)":e,"(breakage)":0,"(loopage)":0,"(tokens)":{},"(properties)":{},"(catch)":!1,"(global)":!1,"(line)":null,"(character)":null,"(metrics)":null,"(statement)":null,"(context)":null,"(scope)":null,"(comparray)":null,"(generator)":null,"(arrow)":null,"(params)":null}
return t&&r.extend(i,{"(line)":t.line,"(character)":t.character,"(metrics)":Ge(t)}),r.extend(i,n),i["(context)"]&&(i["(scope)"]=i["(context)"]["(scope)"],i["(comparray)"]=i["(context)"]["(comparray)"]),i}function Ae(e){return"(scope)"in e}function Me(e){return e["(global)"]&&!e["(verb)"]}function Oe(e){var t=this.context,n=this.noSubst,r=this.depth
if(!n)for(;!i();)!u.tokens.next.template||u.tokens.next.depth>r?B(0):D()
return{id:"(template)",type:"(template)",tag:e}
function i(){if(u.tokens.curr.template&&u.tokens.curr.tail&&u.tokens.curr.context===t)return!0
var e=u.tokens.next.template&&u.tokens.next.tail&&u.tokens.next.context===t
return e&&D(),e||u.tokens.next.isUnclosed}}function Te(e){var t,i,o,s,a,c,l,f,h=u.option,p=u.ignored
e&&(o=e.name,s=e.statement,a=e.classExprBinding,c="generator"===e.type,l="arrow"===e.type,f=e.ignoreLoopFunc),u.option=Object.create(u.option),u.ignored=Object.create(u.ignored),u.funct=_e(o||u.nameStack.infer(),u.tokens.next,{"(statement)":s,"(context)":u.funct,"(arrow)":l,"(generator)":c}),t=u.funct,(i=u.tokens.curr).funct=u.funct,n.push(u.funct),u.funct["(scope)"].stack("functionouter")
var d=o||a
d&&u.funct["(scope)"].block.add(d,a?"class":"function",u.tokens.curr,!1),u.funct["(scope)"].stack("functionparams")
var m=function(e){var t,n,i,o=[],s=[],a=!1,c=!1,l=0,f=e&&e.loneArg
if(f&&!0===f.identifier)return u.funct["(scope)"].addParam(f.value,f),{arity:1,params:[f.value]}
if(t=u.tokens.next,e&&e.parsedOpening||D("("),")"!==u.tokens.next.id)for(;;){l++
var h=[]
if(r.contains(["{","["],u.tokens.next.id))for(i in s=Fe())(i=s[i]).id&&(o.push(i.id),h.push([i.id,i.token]))
else if(Je(u.tokens.next,"...")&&(c=!0),n=ke(!0))o.push(n),h.push([n,u.tokens.curr])
else for(;!ze(u.tokens.next,[",",")"]);)D()
if(a&&"="!==u.tokens.next.id&&P("W138",u.tokens.current),"="===u.tokens.next.id&&(u.inES6()||G("W119",u.tokens.next,"default parameters","6"),D("="),a=!0,B(10)),h.forEach(p),","!==u.tokens.next.id)return D(")",t),{arity:l,params:o}
c&&G("W131",u.tokens.next),X()}else D(")")
function p(e){u.funct["(scope)"].addParam.apply(u.funct["(scope)"],e)}}(e)
return m?(u.funct["(params)"]=m.params,u.funct["(metrics)"].arity=m.arity,u.funct["(metrics)"].verifyMaxParametersPerFunction()):u.funct["(metrics)"].arity=0,l&&(u.inES6(!0)||G("W119",u.tokens.curr,"arrow function syntax (=>)","6"),e.loneArg||D("=>")),we(!1,!0,!0,l),!u.option.noyield&&c&&"yielded"!==u.funct["(generator)"]&&G("W124",u.tokens.curr),u.funct["(metrics)"].verifyMaxStatementsPerFunction(),u.funct["(metrics)"].verifyMaxComplexityPerFunction(),u.funct["(unusedOption)"]=u.option.unused,u.option=h,u.ignored=p,u.funct["(last)"]=u.tokens.curr.line,u.funct["(lastcharacter)"]=u.tokens.curr.character,u.funct["(scope)"].unstack(),u.funct["(scope)"].unstack(),u.funct=u.funct["(context)"],f||u.option.loopfunc||!u.funct["(loopage)"]||t["(isCapturing)"]&&G("W083",i),t}function Ge(e){return{statementCount:0,nestedBlockDepth:-1,ComplexityCount:1,arity:0,verifyMaxStatementsPerFunction:function(){u.option.maxstatements&&this.statementCount>u.option.maxstatements&&G("W071",e,this.statementCount)},verifyMaxParametersPerFunction:function(){r.isNumber(u.option.maxparams)&&this.arity>u.option.maxparams&&G("W072",e,this.arity)},verifyMaxNestedBlockDepthPerFunction:function(){u.option.maxdepth&&this.nestedBlockDepth>0&&this.nestedBlockDepth===u.option.maxdepth+1&&G("W073",null,this.nestedBlockDepth)},verifyMaxComplexityPerFunction:function(){var t=u.option.maxcomplexity,n=this.ComplexityCount
t&&n>t&&G("W074",e,n)}}}function Ve(){u.funct["(metrics)"].ComplexityCount+=1}function Pe(e){var t,n
switch(e&&(t=e.id,n=e.paren,","===t&&(e=e.exprs[e.exprs.length-1])&&(t=e.id,n=n||e.paren)),t){case"=":case"+=":case"-=":case"*=":case"%=":case"&=":case"|=":case"^=":case"/=":n||u.option.boss||G("W084")}}function Ce(e){if(u.inES5())for(var t in e)e[t]&&e[t].setterToken&&!e[t].getterToken&&G("W078",e[t].setterToken)}function Fe(e){var t=e&&e.assignment
return u.inES6()||G("W104",u.tokens.curr,t?"destructuring assignment":"destructuring binding","6"),Re(e)}function Re(e){var t,n,r=[],i=e&&e.openingParsed,o=e&&e.assignment,s=o?{assignment:o}:null,a=i?u.tokens.curr:u.tokens.next,c=function(){var e
if(ze(u.tokens.next,["[","{"]))for(var n in t=Re(s))n=t[n],r.push({id:n.id,token:n.token})
else if(Je(u.tokens.next,","))r.push({id:null,token:u.tokens.curr})
else{if(!Je(u.tokens.next,"(")){var i=Je(u.tokens.next,"...")
if(o){var a=i?I(0):u.tokens.next
a.identifier||G("E030",a,a.value)
var l=B(155)
l&&(he(l),l.identifier&&(e=l.value))}else e=ke()
return e&&r.push({id:e,token:u.tokens.curr}),i}D("("),c(),D(")")}return!1}
if(Je(a,"[")){i||D("["),Je(u.tokens.next,"]")&&G("W137",u.tokens.curr)
for(var l=!1;!Je(u.tokens.next,"]");)c()&&!l&&Je(u.tokens.next,",")&&(G("W130",u.tokens.next),l=!0),Je(u.tokens.next,"=")&&(Je(u.tokens.prev,"...")?D("]"):D("="),"undefined"===u.tokens.next.id&&G("W080",u.tokens.prev,u.tokens.prev.value),B(10)),Je(u.tokens.next,"]")||D(",")
D("]")}else if(Je(a,"{")){for(i||D("{"),Je(u.tokens.next,"}")&&G("W137",u.tokens.curr);!Je(u.tokens.next,"}")&&(n=void 0,Je(u.tokens.next,"[")?(D("["),B(10),D("]"),D(":"),c()):"(string)"===u.tokens.next.id||"(number)"===u.tokens.next.id?(D(),D(":"),c()):(n=ke(),Je(u.tokens.next,":")?(D(":"),c()):n&&(o&&he(u.tokens.curr),r.push({id:n,token:u.tokens.curr}))),Je(u.tokens.next,"=")&&(D("="),"undefined"===u.tokens.next.id&&G("W080",u.tokens.prev,u.tokens.prev.value),B(10)),Je(u.tokens.next,"}")||(D(","),!Je(u.tokens.next,"}"))););D("}")}return r}function Ie(e,t){var n=t.first
n&&r.zip(e,Array.isArray(n)?n:[n]).forEach((function(e){var t=e[0],n=e[1]
t&&n?t.first=n:t&&t.first&&!n&&G("W080",t.first,t.first.value)}))}function Ue(e,t,n){var i,o,s,a,c=n&&n.prefix,l=n&&n.inexport,f="let"===e,h="const"===e
for(u.inES6()||G("W104",u.tokens.curr,e,"6"),f&&"("===u.tokens.next.value?(u.inMoz()||G("W118",u.tokens.next,"let block"),D("("),u.funct["(scope)"].stack(),a=!0):u.funct["(noblockscopedvar)"]&&P("E048",u.tokens.curr,h?"Const":"Let"),t.first=[];;){var p=[]
for(var d in r.contains(["{","["],u.tokens.next.value)?(i=Fe(),o=!1):(i=[{id:ke(),token:u.tokens.curr}],o=!0),!c&&h&&"="!==u.tokens.next.id&&G("E012",u.tokens.curr,u.tokens.curr.value),i)i.hasOwnProperty(d)&&(d=i[d],u.funct["(scope)"].block.isGlobal()&&!1===y[d.id]&&G("W079",d.token,d.id),d.id&&!u.funct["(noblockscopedvar)"]&&(u.funct["(scope)"].addlabel(d.id,{type:e,token:d.token}),p.push(d.token),o&&l&&u.funct["(scope)"].setExported(d.token.value,d.token)))
if("="===u.tokens.next.id&&(D("="),c||"undefined"!==u.tokens.next.id||G("W080",u.tokens.prev,u.tokens.prev.value),!c&&"="===I(0).id&&u.tokens.next.identifier&&G("W120",u.tokens.next,u.tokens.next.value),s=B(c?120:10),o?i[0].first=s:Ie(p,s)),t.first=t.first.concat(p),","!==u.tokens.next.id)break
X()}return a&&(D(")"),we(!0,!0),t.block=!0,u.funct["(scope)"].unstack()),t}se("||",(function(e,t){return Ve(),t.left=e,t.right=B(40),t}),40),se("&&","and",50),de("|","bitor",70),de("^","bitxor",80),de("&","bitand",90),ae("==",(function(e,t){switch(!0){case!(u.option.eqnull&&("null"===(e&&e.value)||"null"===(t&&t.value)))&&u.option.eqeqeq:this.from=this.character,G("W116",this,"===","==")
break
case ce(e):G("W041",this,"===",e.value)
break
case ce(t):G("W041",this,"===",t.value)
break
case le(t,e,u):G("W122",this,t.value)
break
case le(e,t,u):G("W122",this,e.value)}return this})),ae("===",(function(e,t){return le(t,e,u)?G("W122",this,t.value):le(e,t,u)&&G("W122",this,e.value),this})),ae("!=",(function(e,t){return!(u.option.eqnull&&("null"===(e&&e.value)||"null"===(t&&t.value)))&&u.option.eqeqeq?(this.from=this.character,G("W116",this,"!==","!=")):ce(e)?G("W041",this,"!==",e.value):ce(t)?G("W041",this,"!==",t.value):le(t,e,u)?G("W122",this,t.value):le(e,t,u)&&G("W122",this,e.value),this})),ae("!==",(function(e,t){return le(t,e,u)?G("W122",this,t.value):le(e,t,u)&&G("W122",this,e.value),this})),ae("<"),ae(">"),ae("<="),ae(">="),de("<<","shiftleft",120),de(">>","shiftright",120),de(">>>","shiftrightunsigned",120),se("in","in",120),se("instanceof","instanceof",120),se("+",(function(e,t){var n
return t.left=e,t.right=n=B(130),e&&n&&"(string)"===e.id&&"(string)"===n.id?(e.value+=n.value,e.character=n.character,!u.option.scripturl&&c.javascriptURL.test(e.value)&&G("W050",e),e):t}),130),te("+","num"),te("+++",(function(){return G("W007"),this.arity="unary",this.right=B(150),this})),se("+++",(function(e){return G("W007"),this.left=e,this.right=B(130),this}),130),se("-","sub",130),te("-","neg"),te("---",(function(){return G("W006"),this.arity="unary",this.right=B(150),this})),se("---",(function(e){return G("W006"),this.left=e,this.right=B(130),this}),130),se("*","mult",140),se("/","div",140),se("%","mod",140),ve("++")
te("++","preinc"),u.syntax["++"].exps=!0,ve("--"),te("--","predec"),u.syntax["--"].exps=!0,te("delete",(function(){var e=B(10)
return e?("."!==e.id&&"["!==e.id&&G("W051"),this.first=e,e.identifier&&!u.isStrict()&&(e.forgiveUndef=!0),this):this})).exps=!0,te("~",(function(){return u.option.bitwise&&G("W016",this,"~"),this.arity="unary",this.right=B(150),this})),te("...",(function(){return u.inES6(!0)||G("W119",this,"spread/rest operator","6"),u.tokens.next.identifier||"(string)"===u.tokens.next.type||ze(u.tokens.next,["[","("])||P("E030",u.tokens.next,u.tokens.next.value),B(150),this})),te("!",(function(){return this.arity="unary",this.right=B(150),this.right||O("E041",this.line||0),!0===E[this.right.id]&&G("W018",this,"!"),this})),te("typeof",(function(){var e=B(150)
return this.first=this.right=e,e||O("E041",this.line||0,this.character||0),e.identifier&&(e.forgiveUndef=!0),this})),te("new",(function(){var e=function(e,t){if(Je(u.tokens.next,".")){var n=u.tokens.curr.id
D(".")
var r=ke()
return u.tokens.curr.isMetaProperty=!0,e!==r?P("E057",u.tokens.prev,n,r):t(),u.tokens.curr}}("target",(function(){u.inES6(!0)||G("W119",u.tokens.prev,"new.target","6")
for(var e,t=u.funct;t&&(e=!t["(global)"],t["(arrow)"]);)t=t["(context)"]
e||G("W136",u.tokens.prev,"new.target")}))
if(e)return e
var t,n=B(155)
if(n&&"function"!==n.id)if(n.identifier)switch(n.new=!0,n.value){case"Number":case"String":case"Boolean":case"Math":case"JSON":G("W053",u.tokens.prev,n.value)
break
case"Symbol":u.inES6()&&G("W053",u.tokens.prev,n.value)
break
case"Function":u.option.evil||G("W054")
break
case"Date":case"RegExp":case"this":break
default:"function"!==n.id&&(t=n.value.substr(0,1),u.option.newcap&&(t<"A"||t>"Z")&&!u.funct["(scope)"].isPredefined(n.value)&&G("W055",u.tokens.curr))}else"."!==n.id&&"["!==n.id&&"("!==n.id&&G("W056",u.tokens.curr)
else u.option.supernew||G("W057",this)
return"("===u.tokens.next.id||u.option.supernew||G("W058",u.tokens.curr,u.tokens.curr.value),this.first=this.right=n,this})),u.syntax.new.exps=!0,te("void").exps=!0,se(".",(function(e,t){var n=ke(!1,!0)
return"string"==typeof n&&Se(n),t.left=e,t.right=n,n&&"hasOwnProperty"===n&&"="===u.tokens.next.value&&G("W001"),!e||"arguments"!==e.value||"callee"!==n&&"caller"!==n?u.option.evil||!e||"document"!==e.value||"write"!==n&&"writeln"!==n||G("W060",e):u.option.noarg?G("W059",e,n):u.isStrict()&&P("E008"),u.option.evil||"eval"!==n&&"execScript"!==n||fe(e,u)&&G("W061"),t}),160,!0),se("(",(function(e,t){u.option.immed&&e&&!e.immed&&"function"===e.id&&G("W062")
var n=0,r=[]
if(e&&"(identifier)"===e.type&&e.value.match(/^[A-Z]([A-Z0-9_$]*[a-z][A-Za-z0-9_$]*)?$/)&&-1==="Array Number String Boolean Date Object Error Symbol".indexOf(e.value)&&("Math"===e.value?G("W063",e):u.option.newcap&&G("W064",e)),")"!==u.tokens.next.id)for(;r[r.length]=B(10),n+=1,","===u.tokens.next.id;)X()
return D(")"),"object"==typeof e&&(u.inES5()||"parseInt"!==e.value||1!==n||G("W065",u.tokens.curr),u.option.evil||("eval"===e.value||"Function"===e.value||"execScript"===e.value?(G("W061",e),r[0]&&"(string)"===[0].id&&F(e,r[0].value)):(!r[0]||"(string)"!==r[0].id||"setTimeout"!==e.value&&"setInterval"!==e.value)&&(!r[0]||"(string)"!==r[0].id||"."!==e.value||"window"!==e.left.value||"setTimeout"!==e.right&&"setInterval"!==e.right)||(G("W066",e),F(e,r[0].value))),e.identifier||"."===e.id||"["===e.id||"=>"===e.id||"("===e.id||"&&"===e.id||"||"===e.id||"?"===e.id||u.inES6()&&e["(name)"]||G("W067",t)),t.left=e,t}),155,!0).exps=!0,te("(",(function(){var e,t,n,r,i,o=u.tokens.next,s=-1,a=1,c=u.tokens.curr,l=u.tokens.prev,f=!u.option.singleGroups
do{"("===o.value?a+=1:")"===o.value&&(a-=1),e=o,o=I(s+=1)}while((0!==a||")"!==e.value)&&";"!==o.value&&"(end)"!==o.type)
if("function"===u.tokens.next.id&&(n=u.tokens.next.immed=!0),"=>"===o.value)return Te({type:"arrow",parsedOpening:!0})
var h,p=[]
if(")"!==u.tokens.next.id)for(;p.push(B(10)),","===u.tokens.next.id;)u.option.nocomma&&G("W127"),X()
return D(")",this),u.option.immed&&p[0]&&"function"===p[0].id&&"("!==u.tokens.next.id&&"."!==u.tokens.next.id&&"["!==u.tokens.next.id&&G("W068",this),p.length?(p.length>1?((t=Object.create(u.syntax[","])).exprs=p,r=p[0],i=p[p.length-1],f||(f=l.assign||l.delim)):(t=r=i=p[0],f||(f=c.beginsStmt&&("{"===t.id||n||Ae(t))||n&&(!$()||"}"!==u.tokens.prev.id)||Ae(t)&&!$()||"{"===t.id&&"=>"===l.id||"(number)"===t.type&&Je(o,".")&&/^\d+$/.test(t.value))),t&&(!f&&(r.left||r.right||t.exprs)&&(f=!(!(h=l).left&&"unary"!==h.arity)&&r.lbp<=l.lbp||!$()&&i.lbp<u.tokens.next.lbp),f||G("W126",c),t.paren=!0),t):void 0})),Z("=>",42).led=function(e){return H(u.tokens.prev,u.tokens.curr),this.left=e,this.right=Te({type:"arrow",loneArg:e}),this},se("[",(function(e,t){var n,r=B(10)
return r&&"(string)"===r.type&&(u.option.evil||"eval"!==r.value&&"execScript"!==r.value||fe(e,u)&&G("W061"),Se(r.value),!u.option.sub&&c.identifier.test(r.value)&&((n=u.syntax[r.value])&&_(n)||G("W069",u.tokens.prev,r.value))),D("]",t),r&&"hasOwnProperty"===r.value&&"="===u.tokens.next.value&&G("W001"),t.left=e,t.right=r,t}),160,!0),te("[",(function(){var e=$e()
if(e.isCompArray)return u.option.esnext||u.inMoz()||G("W118",u.tokens.curr,"array comprehension"),function(){var e={exps:!0}
u.funct["(comparray)"].stack()
var t=!1
return"for"!==u.tokens.next.value&&(t=!0,u.inMoz()||G("W116",u.tokens.next,"for",u.tokens.next.value),u.funct["(comparray)"].setState("use"),e.right=B(10)),D("for"),"each"===u.tokens.next.value&&(D("each"),u.inMoz()||G("W118",u.tokens.curr,"for each")),D("("),u.funct["(comparray)"].setState("define"),e.left=B(130),r.contains(["in","of"],u.tokens.next.value)?D():P("E045",u.tokens.curr),u.funct["(comparray)"].setState("generate"),B(10),D(")"),"if"===u.tokens.next.value&&(D("if"),D("("),u.funct["(comparray)"].setState("filter"),e.filter=B(10),D(")")),t||(u.funct["(comparray)"].setState("use"),e.right=B(10)),D("]"),u.funct["(comparray)"].unstack(),e}()
if(e.isDestAssign)return this.destructAssign=Fe({openingParsed:!0,assignment:!0}),this
var t=u.tokens.curr.line!==N(u.tokens.next)
for(this.first=[],t&&(m+=u.option.indent,u.tokens.next.from===m+u.option.indent&&(m+=u.option.indent));"(end)"!==u.tokens.next.id;){for(;","===u.tokens.next.id;){if(!u.option.elision){if(u.inES5()){G("W128")
do{D(",")}while(","===u.tokens.next.id)
continue}G("W070")}D(",")}if("]"===u.tokens.next.id)break
if(this.first.push(B(10)),","!==u.tokens.next.id)break
if(X({allowTrailing:!0}),"]"===u.tokens.next.id&&!u.inES5()){G("W070",u.tokens.curr)
break}}return t&&(m-=u.option.indent),D("]",this),this})),function(e){e.nud=function(){var e,t,n,r,i,o=!1,s=Object.create(null)
if((e=u.tokens.curr.line!==N(u.tokens.next))&&(m+=u.option.indent,u.tokens.next.from===m+u.option.indent&&(m+=u.option.indent)),$e().isDestAssign)return this.destructAssign=Fe({openingParsed:!0,assignment:!0}),this
for(;"}"!==u.tokens.next.id;){if(i=u.tokens.next.value,!u.tokens.next.identifier||","!==U().id&&"}"!==U().id)if(":"===I().id||"get"!==i&&"set"!==i){if("*"===u.tokens.next.value&&"(punctuator)"===u.tokens.next.type?(u.inES6()||G("W104",u.tokens.next,"generator functions","6"),D("*"),o=!0):o=!1,"["===u.tokens.next.id)t=He(),u.nameStack.set(t)
else if(u.nameStack.set(u.tokens.next),Be(s,t=Le(),u.tokens.next),"string"!=typeof t)break
"("===u.tokens.next.value?(u.inES6()||G("W104",u.tokens.curr,"concise methods","6"),Te({type:o?"generator":null})):(D(":"),B(10))}else D(i),u.inES5()||P("E034"),(t=Le())||u.inES6()||P("E035"),t&&Ne(i,s,t,u.tokens.curr),r=u.tokens.next,n=Te()["(params)"],"get"===i&&t&&n?G("W076",r,n[0],t):"set"!==i||!t||n&&1===n.length||G("W077",r,t)
else u.inES6()||G("W104",u.tokens.next,"object short notation","6"),Be(s,t=Le(!0),u.tokens.next),B(10)
if(Se(t),","!==u.tokens.next.id)break
X({allowTrailing:!0,property:!0}),","===u.tokens.next.id?G("W070",u.tokens.curr):"}"!==u.tokens.next.id||u.inES5()||G("W070",u.tokens.curr)}return e&&(m-=u.option.indent),D("}",this),Ce(s),this},e.fud=function(){P("E036",u.tokens.curr)}}(Q("{")),Y("const",(function(e){return Ue("const",this,e)})).exps=!0,Y("let",(function(e){return Ue("let",this,e)})).exps=!0
var De=Y("var",(function(e){var t,n,i,s=e&&e.prefix,a=e&&e.inexport,c=e&&e.implied,l=!(e&&e.ignore)
for(this.first=[];;){var f=[]
for(var h in r.contains(["{","["],u.tokens.next.value)?(t=Fe(),n=!1):(t=[{id:ke(),token:u.tokens.curr}],n=!0),s&&c||!l||!u.option.varstmt||G("W132",this),this.first=this.first.concat(f),t)t.hasOwnProperty(h)&&(h=t[h],!c&&u.funct["(global)"]&&(!1===y[h.id]?G("W079",h.token,h.id):!1===u.option.futurehostile&&(!u.inES5()&&!1===o.ecmaIdentifiers[5][h.id]||!u.inES6()&&!1===o.ecmaIdentifiers[6][h.id])&&G("W129",h.token,h.id)),h.id&&("for"===c?(u.funct["(scope)"].has(h.id)||l&&G("W088",h.token,h.id),u.funct["(scope)"].block.use(h.id,h.token)):(u.funct["(scope)"].addlabel(h.id,{type:"var",token:h.token}),n&&a&&u.funct["(scope)"].setExported(h.id,h.token)),f.push(h.token)))
if("="===u.tokens.next.id&&(u.nameStack.set(u.tokens.curr),D("="),s||!l||u.funct["(loopage)"]||"undefined"!==u.tokens.next.id||G("W080",u.tokens.prev,u.tokens.prev.value),"="===I(0).id&&u.tokens.next.identifier&&(!s&&l&&!u.funct["(params)"]||-1===u.funct["(params)"].indexOf(u.tokens.next.value))&&G("W120",u.tokens.next,u.tokens.next.value),i=B(s?120:10),n?t[0].first=i:Ie(f,i)),","!==u.tokens.next.id)break
X()}return this}))
function qe(e){return u.inES6()||G("W104",u.tokens.curr,"class","6"),e?(this.name=ke(),u.funct["(scope)"].addlabel(this.name,{type:"class",token:u.tokens.curr})):u.tokens.next.identifier&&"extends"!==u.tokens.next.value?(this.name=ke(),this.namedExpr=!0):this.name=u.nameStack.infer(),function(e){var t=u.inClassBody
"extends"===u.tokens.next.value&&(D("extends"),e.heritage=B(10))
u.inClassBody=!0,D("{"),e.body=function(e){for(var t,n,r,i,o,s=Object.create(null),a=Object.create(null),c=0;"}"!==u.tokens.next.id;++c)if(n=!1,r=!1,i=null,";"!==(t=u.tokens.next).id){if("*"===t.id&&(r=!0,D("*"),t=u.tokens.next),"["===t.id)t=He(),o=!0
else{if(!je(t)){G("W052",u.tokens.next,u.tokens.next.value||u.tokens.next.type),D()
continue}D(),o=!1,t.identifier&&"static"===t.value&&(Je(u.tokens.next,"*")&&(r=!0,D("*")),(je(u.tokens.next)||"["===u.tokens.next.id)&&(o="["===u.tokens.next.id,n=!0,t=u.tokens.next,"["===u.tokens.next.id?t=He():D())),!t.identifier||"get"!==t.value&&"set"!==t.value||(je(u.tokens.next)||"["===u.tokens.next.id)&&(o="["===u.tokens.next.id,i=t,t=u.tokens.next,"["===u.tokens.next.id?t=He():D())}if(!Je(u.tokens.next,"(")){for(P("E054",u.tokens.next,u.tokens.next.value);"}"!==u.tokens.next.id&&!Je(u.tokens.next,"(");)D()
"("!==u.tokens.next.value&&Te({statement:e})}if(o||(i?Ne(i.value,n?a:s,t.value,t,!0,n):("constructor"===t.value?u.nameStack.set(e):u.nameStack.set(t),Be(n?a:s,t.value,t,!0,n))),i&&"constructor"===t.value)P("E049",t,"get"===i.value?"class getter method":"class setter method","constructor")
else"prototype"===t.value&&P("E049",t,"class method","prototype")
Le(t),Te({statement:e,type:r?"generator":null,classExprBinding:e.namedExpr?e.name:null})}else G("W032"),D(";")
Ce(s)}(e),D("}"),u.inClassBody=t}(this),this}De.exps=!0,K("class",(function(){return qe.call(this,!0)})),K("function",(function(e){var t=e&&e.inexport,n=!1
"*"===u.tokens.next.value&&(D("*"),u.inES6({strict:!0})?n=!0:G("W119",u.tokens.curr,"function*","6")),d&&G("W082",u.tokens.curr)
var r=ge()
return u.funct["(scope)"].addlabel(r,{type:"function",token:u.tokens.curr}),void 0===r?G("W025"):t&&u.funct["(scope)"].setExported(r,u.tokens.prev),Te({name:r,statement:this,type:n?"generator":null,ignoreLoopFunc:d}),"("===u.tokens.next.id&&u.tokens.next.line===u.tokens.curr.line&&P("E039"),this})),te("function",(function(){var e=!1
return"*"===u.tokens.next.value&&(u.inES6()||G("W119",u.tokens.curr,"function*","6"),D("*"),e=!0),Te({name:ge(),type:e?"generator":null}),this})),K("if",(function(){var e=u.tokens.next
Ve(),u.condition=!0,D("(")
var t=B(0)
Pe(t)
var n=null
u.option.forin&&u.forinifcheckneeded&&(u.forinifcheckneeded=!1,n=u.forinifchecks[u.forinifchecks.length-1],"(punctuator)"===t.type&&"!"===t.value?n.type="(negative)":n.type="(positive)"),D(")",e),u.condition=!1
var r=we(!0,!0)
return n&&"(negative)"===n.type&&r&&r[0]&&"(identifier)"===r[0].type&&"continue"===r[0].value&&(n.type="(negative-with-continue)"),"else"===u.tokens.next.id&&(D("else"),"if"===u.tokens.next.id||"switch"===u.tokens.next.id?ye():we(!0,!0)),this})),K("try",(function(){var e
function t(){if(D("catch"),D("("),u.funct["(scope)"].stack("catchparams"),ze(u.tokens.next,["[","{"])){var e=Fe()
r.each(e,(function(e){e.id&&u.funct["(scope)"].addParam(e.id,e,"exception")}))}else"(identifier)"!==u.tokens.next.type?G("E030",u.tokens.next,u.tokens.next.value):u.funct["(scope)"].addParam(ke(),u.tokens.curr,"exception")
"if"===u.tokens.next.value&&(u.inMoz()||G("W118",u.tokens.curr,"catch filter"),D("if"),B(0)),D(")"),we(!1),u.funct["(scope)"].unstack()}for(we(!0);"catch"===u.tokens.next.id;)Ve(),e&&!u.inMoz()&&G("W118",u.tokens.next,"multiple catch blocks"),t(),e=!0
return"finally"===u.tokens.next.id?(D("finally"),void we(!0)):(e||P("E021",u.tokens.next,"catch",u.tokens.next.value),this)})),K("while",(function(){var e=u.tokens.next
return u.funct["(breakage)"]+=1,u.funct["(loopage)"]+=1,Ve(),D("("),Pe(B(0)),D(")",e),we(!0,!0),u.funct["(breakage)"]-=1,u.funct["(loopage)"]-=1,this})).labelled=!0,K("with",(function(){var e=u.tokens.next
return u.isStrict()?P("E010",u.tokens.curr):u.option.withstmt||G("W085",u.tokens.curr),D("("),B(0),D(")",e),we(!0,!0),this})),K("switch",(function(){var e=u.tokens.next,t=!1,n=!1
for(u.funct["(breakage)"]+=1,D("("),Pe(B(0)),D(")",e),e=u.tokens.next,D("{"),u.tokens.next.from===m&&(n=!0),n||(m+=u.option.indent),this.cases=[];;)switch(u.tokens.next.id){case"case":switch(u.funct["(verb)"]){case"yield":case"break":case"case":case"continue":case"return":case"switch":case"throw":break
default:u.tokens.curr.caseFallsThrough||G("W086",u.tokens.curr,"case")}D("case"),this.cases.push(B(0)),Ve(),t=!0,D(":"),u.funct["(verb)"]="case"
break
case"default":switch(u.funct["(verb)"]){case"yield":case"break":case"continue":case"return":case"throw":break
default:this.cases.length&&(u.tokens.curr.caseFallsThrough||G("W086",u.tokens.curr,"default"))}D("default"),t=!0,D(":")
break
case"}":return n||(m-=u.option.indent),D("}",e),u.funct["(breakage)"]-=1,void(u.funct["(verb)"]=void 0)
case"(end)":return void P("E023",u.tokens.next,"}")
default:if(m+=u.option.indent,t)switch(u.tokens.curr.id){case",":return void P("E040")
case":":t=!1,xe()
break
default:return void P("E025",u.tokens.curr)}else{if(":"!==u.tokens.curr.id)return void P("E021",u.tokens.next,"case",u.tokens.next.value)
D(":"),P("E024",u.tokens.curr,":"),xe()}m-=u.option.indent}return this})).labelled=!0,Y("debugger",(function(){return u.option.debug||G("W087",this),this})).exps=!0,function(){var e=Y("do",(function(){u.funct["(breakage)"]+=1,u.funct["(loopage)"]+=1,Ve(),this.first=we(!0,!0),D("while")
var e=u.tokens.next
return D("("),Pe(B(0)),D(")",e),u.funct["(breakage)"]-=1,u.funct["(loopage)"]-=1,this}))
e.labelled=!0,e.exps=!0}(),K("for",(function(){var e,t,n=u.tokens.next,i=!1,o=null
"each"===n.value&&(o=n,D("each"),u.inMoz()||G("W118",u.tokens.curr,"for each")),Ve(),D("(")
var s,a,c=0,l=["in","of"],f=0
ze(u.tokens.next,["{","["])&&++f
do{if(t=I(c),++c,ze(t,["{","["])?++f:ze(t,["}","]"])&&--f,f<0)break
0===f&&(!s&&Je(t,",")?s=t:!a&&Je(t,"=")&&(a=t))}while(f>0||!r.contains(l,t.value)&&";"!==t.value&&"(end)"!==t.type)
if(r.contains(l,t.value)){u.inES6()||"of"!==t.value||G("W104",t,"for of","6")
var h=!(a||s)
if(a&&P("W133",s,t.value,"initializer is forbidden"),s&&P("W133",s,t.value,"more than one ForBinding"),"var"===u.tokens.next.id?(D("var"),u.tokens.curr.fud({prefix:!0})):"let"===u.tokens.next.id||"const"===u.tokens.next.id?(D(u.tokens.next.id),i=!0,u.funct["(scope)"].stack(),u.tokens.curr.fud({prefix:!0})):Object.create(De).fud({prefix:!0,implied:"for",ignore:!h}),D(t.value),B(20),D(")",n),"in"===t.value&&u.option.forin&&(u.forinifcheckneeded=!0,void 0===u.forinifchecks&&(u.forinifchecks=[]),u.forinifchecks.push({type:"(none)"})),u.funct["(breakage)"]+=1,u.funct["(loopage)"]+=1,e=we(!0,!0),"in"===t.value&&u.option.forin){if(u.forinifchecks&&u.forinifchecks.length>0){var p=u.forinifchecks.pop();(e&&e.length>0&&("object"!=typeof e[0]||"if"!==e[0].value)||"(positive)"===p.type&&e.length>1||"(negative)"===p.type)&&G("W089",this)}u.forinifcheckneeded=!1}u.funct["(breakage)"]-=1,u.funct["(loopage)"]-=1}else{if(o&&P("E045",o),";"!==u.tokens.next.id)if("var"===u.tokens.next.id)D("var"),u.tokens.curr.fud()
else if("let"===u.tokens.next.id)D("let"),i=!0,u.funct["(scope)"].stack(),u.tokens.curr.fud()
else for(;B(0,"for"),","===u.tokens.next.id;)s()
if(z(u.tokens.curr),D(";"),u.funct["(loopage)"]+=1,";"!==u.tokens.next.id&&Pe(B(0)),z(u.tokens.curr),D(";"),";"===u.tokens.next.id&&P("E021",u.tokens.next,")",";"),")"!==u.tokens.next.id)for(;B(0,"for"),","===u.tokens.next.id;)s()
D(")",n),u.funct["(breakage)"]+=1,we(!0,!0),u.funct["(breakage)"]-=1,u.funct["(loopage)"]-=1}return i&&u.funct["(scope)"].unstack(),this})).labelled=!0,Y("break",(function(){var e=u.tokens.next.value
return u.option.asi||z(this),";"===u.tokens.next.id||u.tokens.next.reach||u.tokens.curr.line!==N(u.tokens.next)?0===u.funct["(breakage)"]&&G("W052",u.tokens.next,this.value):(u.funct["(scope)"].funct.hasBreakLabel(e)||G("W090",u.tokens.next,e),this.first=u.tokens.next,D()),be(this),this})).exps=!0,Y("continue",(function(){var e=u.tokens.next.value
return 0===u.funct["(breakage)"]&&G("W052",u.tokens.next,this.value),u.funct["(loopage)"]||G("W052",u.tokens.next,this.value),u.option.asi||z(this),";"===u.tokens.next.id||u.tokens.next.reach||u.tokens.curr.line===N(u.tokens.next)&&(u.funct["(scope)"].funct.hasBreakLabel(e)||G("W090",u.tokens.next,e),this.first=u.tokens.next,D()),be(this),this})).exps=!0,Y("return",(function(){return this.line===N(u.tokens.next)?";"===u.tokens.next.id||u.tokens.next.reach||(this.first=B(0),!this.first||"(punctuator)"!==this.first.type||"="!==this.first.value||this.first.paren||u.option.boss||V("W093",this.first.line,this.first.character)):"(punctuator)"===u.tokens.next.type&&["[","{","+","-"].indexOf(u.tokens.next.value)>-1&&z(this),be(this),this})).exps=!0,function(e){e.exps=!0,e.lbp=25}(te("yield",(function(){var e=u.tokens.prev
u.inES6(!0)&&!u.funct["(generator)"]?"(catch)"===u.funct["(name)"]&&u.funct["(context)"]["(generator)"]||P("E046",u.tokens.curr,"yield"):u.inES6()||G("W104",u.tokens.curr,"yield","6"),u.funct["(generator)"]="yielded"
var t=!1
return"*"===u.tokens.next.value&&(t=!0,D("*")),this.line!==N(u.tokens.next)&&u.inMoz()?u.option.asi||z(this):((t||";"!==u.tokens.next.id&&!u.option.asi&&!u.tokens.next.reach&&u.tokens.next.nud)&&(H(u.tokens.curr,u.tokens.next),this.first=B(10),"(punctuator)"!==this.first.type||"="!==this.first.value||this.first.paren||u.option.boss||V("W093",this.first.line,this.first.character)),u.inMoz()&&")"!==u.tokens.next.id&&(e.lbp>30||!e.assign&&!$()||"yield"===e.id)&&P("E050",this)),this}))),Y("throw",(function(){return z(this),this.first=B(20),be(this),this})).exps=!0,Y("import",(function(){if(u.inES6()||G("W119",u.tokens.curr,"import","6"),"(string)"===u.tokens.next.type)return D("(string)"),this
if(u.tokens.next.identifier){if(this.name=ke(),u.funct["(scope)"].addlabel(this.name,{type:"const",token:u.tokens.curr}),","!==u.tokens.next.value)return D("from"),D("(string)"),this
D(",")}if("*"===u.tokens.next.id)D("*"),D("as"),u.tokens.next.identifier&&(this.name=ke(),u.funct["(scope)"].addlabel(this.name,{type:"const",token:u.tokens.curr}))
else for(D("{");;){if("}"===u.tokens.next.value){D("}")
break}var e
if("default"===u.tokens.next.type?(e="default",D("default")):e=ke(),"as"===u.tokens.next.value&&(D("as"),e=ke()),u.funct["(scope)"].addlabel(e,{type:"const",token:u.tokens.curr}),","!==u.tokens.next.value){if("}"===u.tokens.next.value){D("}")
break}P("E024",u.tokens.next,u.tokens.next.value)
break}D(",")}return D("from"),D("(string)"),this})).exps=!0,Y("export",(function(){var e,t,n=!0
if(u.inES6()||(G("W119",u.tokens.curr,"export","6"),n=!1),u.funct["(scope)"].block.isGlobal()||(P("E053",u.tokens.curr),n=!1),"*"===u.tokens.next.value)return D("*"),D("from"),D("(string)"),this
if("default"===u.tokens.next.type){u.nameStack.set(u.tokens.next),D("default")
var r=u.tokens.next.id
return"function"!==r&&"class"!==r||(this.block=!0),e=I(),B(10),t=e.value,this.block&&(u.funct["(scope)"].addlabel(t,{type:r,token:e}),u.funct["(scope)"].setExported(t,e)),this}if("{"===u.tokens.next.value){D("{")
for(var i=[];;){if(u.tokens.next.identifier||P("E030",u.tokens.next,u.tokens.next.value),D(),i.push(u.tokens.curr),"as"===u.tokens.next.value&&(D("as"),u.tokens.next.identifier||P("E030",u.tokens.next,u.tokens.next.value),D()),","!==u.tokens.next.value){if("}"===u.tokens.next.value){D("}")
break}P("E024",u.tokens.next,u.tokens.next.value)
break}D(",")}return"from"===u.tokens.next.value?(D("from"),D("(string)")):n&&i.forEach((function(e){u.funct["(scope)"].setExported(e.value,e)})),this}if("var"===u.tokens.next.id)D("var"),u.tokens.curr.fud({inexport:!0})
else if("let"===u.tokens.next.id)D("let"),u.tokens.curr.fud({inexport:!0})
else if("const"===u.tokens.next.id)D("const"),u.tokens.curr.fud({inexport:!0})
else if("function"===u.tokens.next.id)this.block=!0,D("function"),u.syntax.function.fud({inexport:!0})
else if("class"===u.tokens.next.id){this.block=!0,D("class")
var o=u.tokens.next
u.syntax.class.fud(),u.funct["(scope)"].setExported(o.value,o)}else P("E024",u.tokens.next,u.tokens.next.value)
return this})).exps=!0,ie("abstract"),ie("boolean"),ie("byte"),ie("char"),ie("class",{es5:!0,nud:qe}),ie("double"),ie("enum",{es5:!0}),ie("export",{es5:!0}),ie("extends",{es5:!0}),ie("final"),ie("float")
ie("goto"),ie("implements",{es5:!0,strictOnly:!0}),ie("import",{es5:!0}),ie("int"),ie("interface",{es5:!0,strictOnly:!0}),ie("long"),ie("native"),ie("package",{es5:!0,strictOnly:!0}),ie("private",{es5:!0,strictOnly:!0}),ie("protected",{es5:!0,strictOnly:!0}),ie("public",{es5:!0,strictOnly:!0}),ie("short"),ie("static",{es5:!0,strictOnly:!0}),ie("super",{es5:!0}),ie("synchronized"),ie("transient"),ie("volatile")
var $e=function(){var e,t,n,r=-1,i=0,o={}
ze(u.tokens.curr,["[","{"])&&(i+=1)
do{if(n=-1===r?u.tokens.curr:e,e=-1===r?u.tokens.next:I(r),t=I(r+1),r+=1,ze(e,["[","{"])?i+=1:ze(e,["]","}"])&&(i-=1),1===i&&e.identifier&&"for"===e.value&&!Je(n,".")){o.isCompArray=!0,o.notJson=!0
break}if(0===i&&ze(e,["}","]"])){if("="===t.value){o.isDestAssign=!0,o.notJson=!0
break}if("."===t.value){o.notJson=!0
break}}Je(e,";")&&(o.isBlock=!0,o.notJson=!0)}while(i>0&&"(end)"!==e.id)
return o}
function Be(e,t,n,r,i){var o=["key","class method","static class method"]
o=o[(r||!1)+(i||!1)],n.identifier&&(t=n.value),e[t]&&"__proto__"!==t?G("W075",u.tokens.next,o,t):e[t]=Object.create(null),e[t].basic=!0,e[t].basictkn=n}function Ne(e,t,n,r,i,o){var s="get"===e?"getterToken":"setterToken",a=""
i?(o&&(a+="static "),a+=e+"ter method"):a="key",u.tokens.curr.accessorType=e,u.nameStack.set(r),t[n]?(t[n].basic||t[n][s])&&"__proto__"!==n&&G("W075",u.tokens.next,a,n):t[n]=Object.create(null),t[n][s]=r}function He(){D("["),u.inES6()||G("W119",u.tokens.curr,"computed property names","6")
var e=B(10)
return D("]"),e}function ze(e,t){return"(punctuator)"===e.type&&r.contains(t,e.value)}function Je(e,t){return"(punctuator)"===e.type&&e.value===t}function Xe(){var e=$e()
e.notJson?(!u.inES6()&&e.isDestAssign&&G("W104",u.tokens.curr,"destructuring assignment","6"),xe()):(u.option.laxbreak=!0,u.jsonMode=!0,Qe())}var Ze=function(){var e,t=function(){this.mode="use",this.variables=[]},n=[]
function i(t){return 0===e.variables.filter((function(e){if(e.value===t&&!e.undef)return!0===e.unused&&(e.unused=!1),t})).length}return{stack:function(){e=new t,n.push(e)},unstack:function(){e.variables.filter((function(e){e.unused&&G("W098",e.token,e.raw_text||e.value),e.undef&&u.funct["(scope)"].block.use(e.value,e.token)})),n.splice(-1,1),e=n[n.length-1]},setState:function(t){r.contains(["use","define","generate","filter"],t)&&(e.mode=t)},check:function(t){if(e)return e&&"use"===e.mode?(i(t)&&e.variables.push({funct:u.funct,token:u.tokens.curr,value:t,undef:!0,unused:!1}),!0):e&&"define"===e.mode?(function(t){return 0!==e.variables.filter((function(e){if(e.value===t)return e.undef=!1,t})).length}(t)||e.variables.push({funct:u.funct,token:u.tokens.curr,value:t,undef:!1,unused:!0}),!0):e&&"generate"===e.mode?(u.funct["(scope)"].block.use(t,u.tokens.curr),!0):!(!e||"filter"!==e.mode)&&(i(t)&&u.funct["(scope)"].block.use(t,u.tokens.curr),!0)}}}
function Qe(){switch(u.tokens.next.id){case"{":(function(){var e={},t=u.tokens.next
if(D("{"),"}"!==u.tokens.next.id)for(;;){if("(end)"===u.tokens.next.id)P("E026",u.tokens.next,t.line)
else{if("}"===u.tokens.next.id){G("W094",u.tokens.curr)
break}","===u.tokens.next.id?P("E028",u.tokens.next):"(string)"!==u.tokens.next.id&&G("W095",u.tokens.next,u.tokens.next.value)}if(!0===e[u.tokens.next.value]?G("W075",u.tokens.next,"key",u.tokens.next.value):"__proto__"===u.tokens.next.value&&!u.option.proto||"__iterator__"===u.tokens.next.value&&!u.option.iterator?G("W096",u.tokens.next,u.tokens.next.value):e[u.tokens.next.value]=!0,D(),D(":"),Qe(),","!==u.tokens.next.id)break
D(",")}D("}")})()
break
case"[":(function(){var e=u.tokens.next
if(D("["),"]"!==u.tokens.next.id)for(;;){if("(end)"===u.tokens.next.id)P("E027",u.tokens.next,e.line)
else{if("]"===u.tokens.next.id){G("W094",u.tokens.curr)
break}","===u.tokens.next.id&&P("E028",u.tokens.next)}if(Qe(),","!==u.tokens.next.id)break
D(",")}D("]")})()
break
case"true":case"false":case"null":case"(number)":case"(string)":D()
break
case"-":D("-"),D("(number)")
break
default:P("E003",u.tokens.next)}}var Ye=function(e){return e.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")},Ke=function(i,s,c){var l,f,E,w,L,_,T={},F={}
s=r.clone(s),u.reset(),s&&s.scope?p.scope=s.scope:(p.errors=[],p.undefs=[],p.internals=[],p.blacklist={},p.scope="(main)"),A(y=Object.create(null),o.ecmaIdentifiers[3]),A(y,o.reservedVars),A(y,c||{}),t=Object.create(null)
var R=Object.create(null)
function I(e,t){e&&(Array.isArray(e)||"object"!=typeof e||(e=Object.keys(e)),e.forEach(t))}if(s)for(I(s.predef||null,(function(e){var t,n
"-"===e[0]?(t=e.slice(1),p.blacklist[t]=t,delete y[t]):(n=Object.getOwnPropertyDescriptor(s.predef,e),y[e]=!!n&&n.value)})),I(s.exported||null,(function(e){R[e]=!0})),delete s.predef,delete s.exported,_=Object.keys(s),E=0;E<_.length;E++)if(/^-W\d{3}$/g.test(_[E]))F[_[E].slice(1)]=!0
else{var U=_[E]
T[U]=s[U],("esversion"===U&&5===s[U]||"es5"===U&&s[U])&&G("I003"),"newcap"===_[E]&&!1===s[U]&&(T["(explicitNewcap)"]=!0)}u.option=T,u.ignored=F,u.option.indent=u.option.indent||4,u.option.maxerr=u.option.maxerr||50,m=1
var q,$=h(u,y,R,t)
if($.on("warning",(function(e){G.apply(null,[e.code,e.token].concat(e.data))})),$.on("error",(function(e){P.apply(null,[e.code,e.token].concat(e.data))})),u.funct=_e("(global)",null,{"(global)":!0,"(scope)":$,"(comparray)":Ze(),"(metrics)":Ge(u.tokens.next)}),n=[u.funct],x=[],null,k={},b=null,d=!1,v=[],q=i,"[object String]"!==Object.prototype.toString.call(q)&&!Array.isArray(i))return C("E004",0),!1
for(var B in e={get isJSON(){return u.jsonMode},getOption:function(e){return u.option[e]||null},getCache:function(e){return u.cache[e]},setCache:function(e,t){u.cache[e]=t},warn:function(e,t){V.apply(null,[e,t.line,t.char].concat(t.data))},on:function(e,t){e.split(" ").forEach(function(e){W.on(e,t)}.bind(this))}},W.removeAllListeners(),(S||[]).forEach((function(t){t(e)})),u.tokens.prev=u.tokens.curr=u.tokens.next=u.syntax["(begin)"],s&&s.ignoreDelimiters&&(Array.isArray(s.ignoreDelimiters)||(s.ignoreDelimiters=[s.ignoreDelimiters]),s.ignoreDelimiters.forEach((function(e){e.start&&e.end&&(w=Ye(e.start)+"[\\s\\S]*?"+Ye(e.end),L=new RegExp(w,"ig"),i=i.replace(L,(function(e){return e.replace(/./g," ")})))}))),(g=new a(i)).on("warning",(function(e){V.apply(null,[e.code,e.line,e.character].concat(e.data))})),g.on("error",(function(e){C.apply(null,[e.code,e.line,e.character].concat(e.data))})),g.on("fatal",(function(e){O("E041",e.line,e.from)})),g.on("Identifier",(function(e){W.emit("Identifier",e)})),g.on("String",(function(e){W.emit("String",e)})),g.on("Number",(function(e){W.emit("Number",e)})),g.start(),s)r.has(s,B)&&j(B,u.tokens.curr)
M(),A(y,c||{}),X.first=!0
try{switch(D(),u.tokens.next.id){case"{":case"[":Xe()
break
default:Ee(),u.directive["use strict"]&&"global"!==u.option.strict&&G("W097",u.tokens.prev),xe()}"(end)"!==u.tokens.next.id&&O("E041",u.tokens.curr.line),u.funct["(scope)"].unstack()}catch(H){if(!H||"JSHintError"!==H.name)throw H
var N=u.tokens.next||{}
p.errors.push({scope:"(main)",raw:H.raw,code:H.code,reason:H.message,line:H.line||N.line,character:H.character||N.from},null)}if("(main)"===p.scope)for(s=s||{},l=0;l<p.internals.length;l+=1)f=p.internals[l],s.scope=f.elem,Ke(f.value,s,c)
return 0===p.errors.length}
return Ke.addModule=function(e){S.push(e)},Ke.addModule(l.register),Ke.data=function(){var e,t,r,i,o,s,a={functions:[],options:u.option}
Ke.errors.length&&(a.errors=Ke.errors),u.jsonMode&&(a.json=!0)
var c=u.funct["(scope)"].getImpliedGlobals()
for(c.length>0&&(a.implieds=c),x.length>0&&(a.urls=x),(s=u.funct["(scope)"].getUsedOrDefinedGlobals()).length>0&&(a.globals=s),r=1;r<n.length;r+=1){for(t=n[r],e={},i=0;i<w.length;i+=1)e[w[i]]=[]
for(i=0;i<w.length;i+=1)0===e[w[i]].length&&delete e[w[i]]
e.name=t["(name)"],e.param=t["(params)"],e.line=t["(line)"],e.character=t["(character)"],e.last=t["(last)"],e.lastcharacter=t["(lastcharacter)"],e.metrics={complexity:t["(metrics)"].ComplexityCount,parameters:t["(metrics)"].arity,statements:t["(metrics)"].statementCount},a.functions.push(e)}var l=u.funct["(scope)"].getUnuseds()
for(o in l.length>0&&(a.unused=l),k)if("number"==typeof k[o]){a.member=k
break}return a},Ke.jshint=Ke,Ke}()
"object"==typeof n&&n&&(n.JSHINT=p)},{"../lodash":"/node_modules/jshint/lodash.js","./lex.js":"/node_modules/jshint/src/lex.js","./messages.js":"/node_modules/jshint/src/messages.js","./options.js":"/node_modules/jshint/src/options.js","./reg.js":"/node_modules/jshint/src/reg.js","./scope-manager.js":"/node_modules/jshint/src/scope-manager.js","./state.js":"/node_modules/jshint/src/state.js","./style.js":"/node_modules/jshint/src/style.js","./vars.js":"/node_modules/jshint/src/vars.js",events:"/node_modules/browserify/node_modules/events/events.js"}],"/node_modules/jshint/src/lex.js":[function(e,t,n){"use strict"
var r=e("../lodash"),i=e("events"),o=e("./reg.js"),s=e("./state.js").state,a=e("../data/ascii-identifier-data.js"),c=a.asciiIdentifierStartTable,u=a.asciiIdentifierPartTable,l=1,f=2,h=3,p=4,d=5,m=6,v=7,g=8,k=9,b=10,y=11,x=12,E=13,w={Block:1,Template:2}
function S(e){var t=e
"string"==typeof t&&(t=t.replace(/\r\n/g,"\n").replace(/\r/g,"\n").split("\n")),t[0]&&"#!"===t[0].substr(0,2)&&(-1!==t[0].indexOf("node")&&(s.option.node=!0),t[0]=""),this.emitter=new i.EventEmitter,this.source=e,this.setLines(t),this.prereg=!0,this.line=0,this.char=1,this.from=1,this.input="",this.inComment=!1,this.context=[],this.templateStarts=[]
for(var n=0;n<s.option.indent;n+=1)s.tab+=" "
this.ignoreLinterErrors=!1}S.prototype={_lines:[],inContext:function(e){return this.context.length>0&&this.context[this.context.length-1].type===e},pushContext:function(e){this.context.push({type:e})},popContext:function(){return this.context.pop()},isContext:function(e){return this.context.length>0&&this.context[this.context.length-1]===e},currentContext:function(){return this.context.length>0&&this.context[this.context.length-1]},getLines:function(){return this._lines=s.lines,this._lines},setLines:function(e){this._lines=e,s.lines=this._lines},peek:function(e){return this.input.charAt(e||0)},skip:function(e){e=e||1,this.char+=e,this.input=this.input.slice(e)},on:function(e,t){e.split(" ").forEach(function(e){this.emitter.on(e,t)}.bind(this))},trigger:function(){this.emitter.emit.apply(this.emitter,Array.prototype.slice.call(arguments))},triggerAsync:function(e,t,n,r){n.push(function(){r()&&this.trigger(e,t)}.bind(this))},scanPunctuator:function(){var e,t,n,r=this.peek()
switch(r){case".":if(/^[0-9]$/.test(this.peek(1)))return null
if("."===this.peek(1)&&"."===this.peek(2))return{type:f,value:"..."}
case"(":case")":case";":case",":case"[":case"]":case":":case"~":case"?":return{type:f,value:r}
case"{":return this.pushContext(w.Block),{type:f,value:r}
case"}":return this.inContext(w.Block)&&this.popContext(),{type:f,value:r}
case"#":return{type:f,value:r}
case"":return null}return e=this.peek(1),t=this.peek(2),n=this.peek(3),">"===r&&">"===e&&">"===t&&"="===n?{type:f,value:">>>="}:"="===r&&"="===e&&"="===t?{type:f,value:"==="}:"!"===r&&"="===e&&"="===t?{type:f,value:"!=="}:">"===r&&">"===e&&">"===t?{type:f,value:">>>"}:"<"===r&&"<"===e&&"="===t?{type:f,value:"<<="}:">"===r&&">"===e&&"="===t?{type:f,value:">>="}:"="===r&&">"===e||r===e&&"+-<>&|".indexOf(r)>=0?{type:f,value:r+e}:"<>=!+-*%&|^".indexOf(r)>=0?"="===e?{type:f,value:r+e}:{type:f,value:r}:"/"===r?"="===e?{type:f,value:"/="}:{type:f,value:"/"}:null},scanComments:function(){var e=this.peek(),t=this.peek(1),n=this.input.substr(2),r=this.line,i=this.char,s=this
function a(e,t,n){var r=!1,i=e+t,a="plain"
return(n=n||{}).isMultiline&&(i+="*/"),t=t.replace(/\n/g," "),"/*"===e&&o.fallsThrough.test(t)&&(r=!0,a="falls through"),["jshint","jslint","members","member","globals","global","exported"].forEach((function(n){if(!r&&("//"!==e||"jshint"===n)&&(" "===t.charAt(n.length)&&t.substr(0,n.length)===n&&(r=!0,e+=n,t=t.substr(n.length)),r||" "!==t.charAt(0)||" "!==t.charAt(n.length+1)||t.substr(1,n.length)!==n||(r=!0,e=e+" "+n,t=t.substr(n.length+1)),r))switch(n){case"member":a="members"
break
case"global":a="globals"
break
default:var i=t.split(":").map((function(e){return e.replace(/^\s+/,"").replace(/\s+$/,"")}))
if(2===i.length)switch(i[0]){case"ignore":switch(i[1]){case"start":s.ignoringLinterErrors=!0,r=!1
break
case"end":s.ignoringLinterErrors=!1,r=!1}}a=n}})),{type:d,commentType:a,value:i,body:t,isSpecial:r,isMultiline:n.isMultiline||!1,isMalformed:n.isMalformed||!1}}if("*"===e&&"/"===t)return this.trigger("error",{code:"E018",line:r,character:i}),this.skip(2),null
if("/"!==e||"*"!==t&&"/"!==t)return null
if("/"===t)return this.skip(this.input.length),a("//",n)
var c=""
if("*"===t){for(this.inComment=!0,this.skip(2);"*"!==this.peek()||"/"!==this.peek(1);)if(""===this.peek()){if(c+="\n",!this.nextLine())return this.trigger("error",{code:"E017",line:r,character:i}),this.inComment=!1,a("/*",c,{isMultiline:!0,isMalformed:!0})}else c+=this.peek(),this.skip()
return this.skip(2),this.inComment=!1,a("/*",c,{isMultiline:!0})}},scanKeyword:function(){var e=/^[a-zA-Z_$][a-zA-Z0-9_$]*/.exec(this.input)
return e&&["if","in","do","var","for","new","try","let","this","else","case","void","with","enum","while","break","catch","throw","const","yield","class","super","return","typeof","delete","switch","export","import","default","finally","extends","function","continue","debugger","instanceof"].indexOf(e[0])>=0?{type:m,value:e[0]}:null},scanIdentifier:function(){var e,t,n="",r=0
function i(e){return e>256}function o(e){return/^[0-9a-fA-F]$/.test(e)}var s=function(){if(r+=1,"u"!==this.peek(r))return null
var e,t=this.peek(r+1),n=this.peek(r+2),s=this.peek(r+3),a=this.peek(r+4)
return o(t)&&o(n)&&o(s)&&o(a)?(e=parseInt(t+n+s+a,16),u[e]||i(e)?(r+=5,"\\u"+t+n+s+a):null):null}.bind(this),a=function(){var e=this.peek(r),t=e.charCodeAt(0)
return 92===t?s():t<128?c[t]?(r+=1,e):null:function(e){return e>256}(t)?(r+=1,e):null}.bind(this),f=function(){var e=this.peek(r),t=e.charCodeAt(0)
return 92===t?s():t<128?u[t]?(r+=1,e):null:i(t)?(r+=1,e):null}.bind(this)
if(null===(t=a()))return null
for(n=t;null!==(t=f());)n+=t
switch(n){case"true":case"false":e=g
break
case"null":e=v
break
default:e=l}return{type:e,value:function(e){return e.replace(/\\u([0-9a-fA-F]{4})/g,(function(e,t){return String.fromCharCode(parseInt(t,16))}))}(n),text:n,tokenLength:n.length}},scanNumericLiteral:function(){var e=0,t="",n=this.input.length,r=this.peek(e),i=c,o=10,a=!1
function c(e){return/^[0-9]$/.test(e)}function u(e){return/^[0-7]$/.test(e)}function l(e){return"$"===e||"_"===e||"\\"===e||e>="a"&&e<="z"||e>="A"&&e<="Z"}if("."!==r&&!c(r))return null
if("."!==r){for(t=this.peek(e),e+=1,r=this.peek(e),"0"===t&&("x"!==r&&"X"!==r||(i=function(e){return/^[0-9a-fA-F]$/.test(e)},o=16,e+=1,t+=r),"o"!==r&&"O"!==r||(i=u,o=8,s.inES6(!0)||this.trigger("warning",{code:"W119",line:this.line,character:this.char,data:["Octal integer literal","6"]}),e+=1,t+=r),"b"!==r&&"B"!==r||(i=function(e){return/^[01]$/.test(e)},o=2,s.inES6(!0)||this.trigger("warning",{code:"W119",line:this.line,character:this.char,data:["Binary integer literal","6"]}),e+=1,t+=r),u(r)&&(i=u,o=8,a=!0,!1,e+=1,t+=r),!u(r)&&c(r)&&(e+=1,t+=r));e<n;){if(r=this.peek(e),a&&c(r))!0
else if(!i(r))break
t+=r,e+=1}if(i!==c)return!a&&t.length<=2?{type:h,value:t,isMalformed:!0}:e<n&&l(r=this.peek(e))?null:{type:h,value:t,base:o,isLegacy:a,isMalformed:!1}}if("."===r)for(t+=r,e+=1;e<n&&c(r=this.peek(e));)t+=r,e+=1
if("e"===r||"E"===r){if(t+=r,e+=1,"+"!==(r=this.peek(e))&&"-"!==r||(t+=this.peek(e),e+=1),!c(r=this.peek(e)))return null
for(t+=r,e+=1;e<n&&c(r=this.peek(e));)t+=r,e+=1}return e<n&&l(r=this.peek(e))?null:{type:h,value:t,base:o,isMalformed:!isFinite(t)}},scanEscapeSequence:function(e){var t=!1,n=1
this.skip()
var r=this.peek()
switch(r){case"'":this.triggerAsync("warning",{code:"W114",line:this.line,character:this.char,data:["\\'"]},e,(function(){return s.jsonMode}))
break
case"b":r="\\b"
break
case"f":r="\\f"
break
case"n":r="\\n"
break
case"r":r="\\r"
break
case"t":r="\\t"
break
case"0":r="\\0"
var i=parseInt(this.peek(1),10)
this.triggerAsync("warning",{code:"W115",line:this.line,character:this.char},e,(function(){return i>=0&&i<=7&&s.isStrict()}))
break
case"u":var o=this.input.substr(1,4),a=parseInt(o,16)
isNaN(a)&&this.trigger("warning",{code:"W052",line:this.line,character:this.char,data:["u"+o]}),r=String.fromCharCode(a),n=5
break
case"v":this.triggerAsync("warning",{code:"W114",line:this.line,character:this.char,data:["\\v"]},e,(function(){return s.jsonMode})),r="\v"
break
case"x":var c=parseInt(this.input.substr(1,2),16)
this.triggerAsync("warning",{code:"W114",line:this.line,character:this.char,data:["\\x-"]},e,(function(){return s.jsonMode})),r=String.fromCharCode(c),n=3
break
case"\\":r="\\\\"
break
case'"':r='\\"'
break
case"/":break
case"":t=!0,r=""}return{char:r,jump:n,allowNewLine:t}},scanTemplateLiteral:function(e){var t,n,r="",i=this.line,o=this.char,a=this.templateStarts.length
if(!s.inES6(!0))return null
if("`"===this.peek())t=b,this.templateStarts.push({line:this.line,char:this.char}),a=this.templateStarts.length,this.skip(1),this.pushContext(w.Template)
else{if(!this.inContext(w.Template)||"}"!==this.peek())return null
t=y}for(;"`"!==this.peek();){for(;""===(n=this.peek());)if(r+="\n",!this.nextLine()){var c=this.templateStarts.pop()
return this.trigger("error",{code:"E052",line:c.line,character:c.char}),{type:t,value:r,startLine:i,startChar:o,isUnclosed:!0,depth:a,context:this.popContext()}}if("$"===n&&"{"===this.peek(1))return r+="${",this.skip(2),{type:t,value:r,startLine:i,startChar:o,isUnclosed:!1,depth:a,context:this.currentContext()}
if("\\"===n){var u=this.scanEscapeSequence(e)
r+=u.char,this.skip(u.jump)}else"`"!==n&&(r+=n,this.skip(1))}return t=t===b?E:x,this.skip(1),this.templateStarts.pop(),{type:t,value:r,startLine:i,startChar:o,isUnclosed:!1,depth:a,context:this.popContext()}},scanStringLiteral:function(e){var t=this.peek()
if('"'!==t&&"'"!==t)return null
this.triggerAsync("warning",{code:"W108",line:this.line,character:this.char},e,(function(){return s.jsonMode&&'"'!==t}))
var n="",r=this.line,i=this.char,o=!1
for(this.skip();this.peek()!==t;)if(""===this.peek()){if(o?(o=!1,this.triggerAsync("warning",{code:"W043",line:this.line,character:this.char},e,(function(){return!s.option.multistr})),this.triggerAsync("warning",{code:"W042",line:this.line,character:this.char},e,(function(){return s.jsonMode&&s.option.multistr}))):this.trigger("warning",{code:"W112",line:this.line,character:this.char}),!this.nextLine())return this.trigger("error",{code:"E029",line:r,character:i}),{type:p,value:n,startLine:r,startChar:i,isUnclosed:!0,quote:t}}else{o=!1
var a=this.peek(),c=1
if(a<" "&&this.trigger("warning",{code:"W113",line:this.line,character:this.char,data:["<non-printable>"]}),"\\"===a){var u=this.scanEscapeSequence(e)
a=u.char,c=u.jump,o=u.allowNewLine}n+=a,this.skip(c)}return this.skip(),{type:p,value:n,startLine:r,startChar:i,isUnclosed:!1,quote:t}},scanRegExp:function(){var e,t=0,n=this.input.length,r=this.peek(),i=r,o="",s=[],a=!1,c=!1,u=function(){r<" "&&(a=!0,this.trigger("warning",{code:"W048",line:this.line,character:this.char})),"<"===r&&(a=!0,this.trigger("warning",{code:"W049",line:this.line,character:this.char,data:[r]}))}.bind(this)
if(!this.prereg||"/"!==r)return null
for(t+=1,e=!1;t<n;)if(i+=r=this.peek(t),o+=r,c)"]"===r&&("\\"===this.peek(t-1)&&"\\"!==this.peek(t-2)||(c=!1)),"\\"===r&&(t+=1,o+=r=this.peek(t),i+=r,u()),t+=1
else{if("\\"===r){if(t+=1,o+=r=this.peek(t),i+=r,u(),"/"===r){t+=1
continue}if("["===r){t+=1
continue}}if("["!==r){if("/"===r){o=o.substr(0,o.length-1),e=!0,t+=1
break}t+=1}else c=!0,t+=1}if(!e)return this.trigger("error",{code:"E015",line:this.line,character:this.from}),void this.trigger("fatal",{line:this.line,from:this.from})
for(;t<n&&(r=this.peek(t),/[gim]/.test(r));)s.push(r),i+=r,t+=1
try{new RegExp(o,s.join(""))}catch(l){a=!0,this.trigger("error",{code:"E016",line:this.line,character:this.char,data:[l.message]})}return{type:k,value:i,flags:s,isMalformed:a}},scanNonBreakingSpaces:function(){return s.option.nonbsp?this.input.search(/(\u00A0)/):-1},scanUnsafeChars:function(){return this.input.search(o.unsafeChars)},next:function(e){if(this.from=this.char,/\s/.test(this.peek()))for(this.char;/\s/.test(this.peek());)this.from+=1,this.skip()
var t=this.scanComments()||this.scanStringLiteral(e)||this.scanTemplateLiteral(e)
return t||((t=this.scanRegExp()||this.scanPunctuator()||this.scanKeyword()||this.scanIdentifier()||this.scanNumericLiteral())?(this.skip(t.tokenLength||t.value.length),t):null)},nextLine:function(){var e
if(this.line>=this.getLines().length)return!1
this.input=this.getLines()[this.line],this.line+=1,this.char=1,this.from=1
var t=this.input.trim(),n=function(){return r.some(arguments,(function(e){return 0===t.indexOf(e)}))};(!0===this.ignoringLinterErrors&&(n("/*","//")||this.inComment&&function(){return r.some(arguments,(function(e){return-1!==t.indexOf(e,t.length-e.length)}))}("*/")||(this.input="")),(e=this.scanNonBreakingSpaces())>=0&&this.trigger("warning",{code:"W125",line:this.line,character:e+1}),this.input=this.input.replace(/\t/g,s.tab),(e=this.scanUnsafeChars())>=0&&this.trigger("warning",{code:"W100",line:this.line,character:e}),!this.ignoringLinterErrors&&s.option.maxlen&&s.option.maxlen<this.input.length)&&((!(this.inComment||n.call(t,"//")||n.call(t,"/*"))||!o.maxlenException.test(t))&&this.trigger("warning",{code:"W101",line:this.line,character:this.input.length}))
return!0},start:function(){this.nextLine()},token:function(){var e,t,n=(e=[],{push:function(t){e.push(t)},check:function(){for(var t=0;t<e.length;++t)e[t]()
e.splice(0,e.length)}})
for(var i=function(e,t,i,o){var a
if("(endline)"!==e&&"(end)"!==e&&(this.prereg=!1),"(punctuator)"===e){switch(t){case".":case")":case"~":case"#":case"]":case"++":case"--":this.prereg=!1
break
default:this.prereg=!0}a=Object.create(s.syntax[t]||s.syntax["(error)"])}return"(identifier)"===e&&("return"!==t&&"case"!==t&&"typeof"!==t||(this.prereg=!0),r.has(s.syntax,t)&&(function(e,t){if(!e.reserved)return!1
var n=e.meta
if(n&&n.isFutureReservedWord&&s.inES5()){if(!n.es5)return!1
if(n.strictOnly&&!s.option.strict&&!s.isStrict())return!1
if(t)return!1}return!0}(a=Object.create(s.syntax[t]||s.syntax["(error)"]),i&&"(identifier)"===e)||(a=null))),a||(a=Object.create(s.syntax[e])),a.identifier="(identifier)"===e,a.type=a.type||e,a.value=t,a.line=this.line,a.character=this.char,a.from=this.from,a.identifier&&o&&(a.raw_text=o.text||o.value),o&&o.startLine&&o.startLine!==this.line&&(a.startLine=o.startLine),o&&o.context&&(a.context=o.context),o&&o.depth&&(a.depth=o.depth),o&&o.isUnclosed&&(a.isUnclosed=o.isUnclosed),i&&a.identifier&&(a.isProperty=i),a.check=n.check,a}.bind(this);;){if(!this.input.length)return this.nextLine()?i("(endline)",""):this.exhausted?null:(this.exhausted=!0,i("(end)",""))
if(t=this.next(n))switch(t.type){case p:return this.triggerAsync("String",{line:this.line,char:this.char,from:this.from,startLine:t.startLine,startChar:t.startChar,value:t.value,quote:t.quote},n,(function(){return!0})),i("(string)",t.value,null,t)
case b:return this.trigger("TemplateHead",{line:this.line,char:this.char,from:this.from,startLine:t.startLine,startChar:t.startChar,value:t.value}),i("(template)",t.value,null,t)
case y:return this.trigger("TemplateMiddle",{line:this.line,char:this.char,from:this.from,startLine:t.startLine,startChar:t.startChar,value:t.value}),i("(template middle)",t.value,null,t)
case x:return this.trigger("TemplateTail",{line:this.line,char:this.char,from:this.from,startLine:t.startLine,startChar:t.startChar,value:t.value}),i("(template tail)",t.value,null,t)
case E:return this.trigger("NoSubstTemplate",{line:this.line,char:this.char,from:this.from,startLine:t.startLine,startChar:t.startChar,value:t.value}),i("(no subst template)",t.value,null,t)
case l:this.triggerAsync("Identifier",{line:this.line,char:this.char,from:this.form,name:t.value,raw_name:t.text,isProperty:"."===s.tokens.curr.id},n,(function(){return!0}))
case m:case v:case g:return i("(identifier)",t.value,"."===s.tokens.curr.id,t)
case h:return t.isMalformed&&this.trigger("warning",{code:"W045",line:this.line,character:this.char,data:[t.value]}),this.triggerAsync("warning",{code:"W114",line:this.line,character:this.char,data:["0x-"]},n,(function(){return 16===t.base&&s.jsonMode})),this.triggerAsync("warning",{code:"W115",line:this.line,character:this.char},n,(function(){return s.isStrict()&&8===t.base&&t.isLegacy})),this.trigger("Number",{line:this.line,char:this.char,from:this.from,value:t.value,base:t.base,isMalformed:t.malformed}),i("(number)",t.value)
case k:return i("(regexp)",t.value)
case d:if(s.tokens.curr.comment=!0,t.isSpecial)return{id:"(comment)",value:t.value,body:t.body,type:t.commentType,isSpecial:t.isSpecial,line:this.line,character:this.char,from:this.from}
break
case"":break
default:return i("(punctuator)",t.value)}else this.input.length&&(this.trigger("error",{code:"E024",line:this.line,character:this.char,data:[this.peek()]}),this.input="")}}},n.Lexer=S,n.Context=w},{"../data/ascii-identifier-data.js":"/node_modules/jshint/data/ascii-identifier-data.js","../lodash":"/node_modules/jshint/lodash.js","./reg.js":"/node_modules/jshint/src/reg.js","./state.js":"/node_modules/jshint/src/state.js",events:"/node_modules/browserify/node_modules/events/events.js"}],"/node_modules/jshint/src/messages.js":[function(e,t,n){"use strict"
var r=e("../lodash")
n.errors={},n.warnings={},n.info={},r.each({E001:"Bad option: '{a}'.",E002:"Bad option value.",E003:"Expected a JSON value.",E004:"Input is neither a string nor an array of strings.",E005:"Input is empty.",E006:"Unexpected early end of program.",E007:'Missing "use strict" statement.',E008:"Strict violation.",E009:"Option 'validthis' can't be used in a global scope.",E010:"'with' is not allowed in strict mode.",E011:"'{a}' has already been declared.",E012:"const '{a}' is initialized to 'undefined'.",E013:"Attempting to override '{a}' which is a constant.",E014:"A regular expression literal can be confused with '/='.",E015:"Unclosed regular expression.",E016:"Invalid regular expression.",E017:"Unclosed comment.",E018:"Unbegun comment.",E019:"Unmatched '{a}'.",E020:"Expected '{a}' to match '{b}' from line {c} and instead saw '{d}'.",E021:"Expected '{a}' and instead saw '{b}'.",E022:"Line breaking error '{a}'.",E023:"Missing '{a}'.",E024:"Unexpected '{a}'.",E025:"Missing ':' on a case clause.",E026:"Missing '}' to match '{' from line {a}.",E027:"Missing ']' to match '[' from line {a}.",E028:"Illegal comma.",E029:"Unclosed string.",E030:"Expected an identifier and instead saw '{a}'.",E031:"Bad assignment.",E032:"Expected a small integer or 'false' and instead saw '{a}'.",E033:"Expected an operator and instead saw '{a}'.",E034:"get/set are ES5 features.",E035:"Missing property name.",E036:"Expected to see a statement and instead saw a block.",E037:null,E038:null,E039:"Function declarations are not invocable. Wrap the whole function invocation in parens.",E040:"Each value should have its own case label.",E041:"Unrecoverable syntax error.",E042:"Stopping.",E043:"Too many errors.",E044:null,E045:"Invalid for each loop.",E046:"A yield statement shall be within a generator function (with syntax: `function*`)",E047:null,E048:"{a} declaration not directly within block.",E049:"A {a} cannot be named '{b}'.",E050:"Mozilla requires the yield expression to be parenthesized here.",E051:null,E052:"Unclosed template literal.",E053:"Export declaration must be in global scope.",E054:"Class properties must be methods. Expected '(' but instead saw '{a}'.",E055:"The '{a}' option cannot be set after any executable code.",E056:"'{a}' was used before it was declared, which is illegal for '{b}' variables.",E057:"Invalid meta property: '{a}.{b}'.",E058:"Missing semicolon."},(function(e,t){n.errors[t]={code:t,desc:e}})),r.each({W001:"'hasOwnProperty' is a really bad name.",W002:"Value of '{a}' may be overwritten in IE 8 and earlier.",W003:"'{a}' was used before it was defined.",W004:"'{a}' is already defined.",W005:"A dot following a number can be confused with a decimal point.",W006:"Confusing minuses.",W007:"Confusing plusses.",W008:"A leading decimal point can be confused with a dot: '{a}'.",W009:"The array literal notation [] is preferable.",W010:"The object literal notation {} is preferable.",W011:null,W012:null,W013:null,W014:"Bad line breaking before '{a}'.",W015:null,W016:"Unexpected use of '{a}'.",W017:"Bad operand.",W018:"Confusing use of '{a}'.",W019:"Use the isNaN function to compare with NaN.",W020:"Read only.",W021:"Reassignment of '{a}', which is is a {b}. Use 'var' or 'let' to declare bindings that may change.",W022:"Do not assign to the exception parameter.",W023:"Expected an identifier in an assignment and instead saw a function invocation.",W024:"Expected an identifier and instead saw '{a}' (a reserved word).",W025:"Missing name in function declaration.",W026:"Inner functions should be listed at the top of the outer function.",W027:"Unreachable '{a}' after '{b}'.",W028:"Label '{a}' on {b} statement.",W030:"Expected an assignment or function call and instead saw an expression.",W031:"Do not use 'new' for side effects.",W032:"Unnecessary semicolon.",W033:"Missing semicolon.",W034:'Unnecessary directive "{a}".',W035:"Empty block.",W036:"Unexpected /*member '{a}'.",W037:"'{a}' is a statement label.",W038:"'{a}' used out of scope.",W039:"'{a}' is not allowed.",W040:"Possible strict violation.",W041:"Use '{a}' to compare with '{b}'.",W042:"Avoid EOL escaping.",W043:"Bad escaping of EOL. Use option multistr if needed.",W044:"Bad or unnecessary escaping.",W045:"Bad number '{a}'.",W046:"Don't use extra leading zeros '{a}'.",W047:"A trailing decimal point can be confused with a dot: '{a}'.",W048:"Unexpected control character in regular expression.",W049:"Unexpected escaped character '{a}' in regular expression.",W050:"JavaScript URL.",W051:"Variables should not be deleted.",W052:"Unexpected '{a}'.",W053:"Do not use {a} as a constructor.",W054:"The Function constructor is a form of eval.",W055:"A constructor name should start with an uppercase letter.",W056:"Bad constructor.",W057:"Weird construction. Is 'new' necessary?",W058:"Missing '()' invoking a constructor.",W059:"Avoid arguments.{a}.",W060:"document.write can be a form of eval.",W061:"eval can be harmful.",W062:"Wrap an immediate function invocation in parens to assist the reader in understanding that the expression is the result of a function, and not the function itself.",W063:"Math is not a function.",W064:"Missing 'new' prefix when invoking a constructor.",W065:"Missing radix parameter.",W066:"Implied eval. Consider passing a function instead of a string.",W067:"Bad invocation.",W068:"Wrapping non-IIFE function literals in parens is unnecessary.",W069:"['{a}'] is better written in dot notation.",W070:"Extra comma. (it breaks older versions of IE)",W071:"This function has too many statements. ({a})",W072:"This function has too many parameters. ({a})",W073:"Blocks are nested too deeply. ({a})",W074:"This function's cyclomatic complexity is too high. ({a})",W075:"Duplicate {a} '{b}'.",W076:"Unexpected parameter '{a}' in get {b} function.",W077:"Expected a single parameter in set {a} function.",W078:"Setter is defined without getter.",W079:"Redefinition of '{a}'.",W080:"It's not necessary to initialize '{a}' to 'undefined'.",W081:null,W082:"Function declarations should not be placed in blocks. Use a function expression or move the statement to the top of the outer function.",W083:"Don't make functions within a loop.",W084:"Assignment in conditional expression",W085:"Don't use 'with'.",W086:"Expected a 'break' statement before '{a}'.",W087:"Forgotten 'debugger' statement?",W088:"Creating global 'for' variable. Should be 'for (var {a} ...'.",W089:"The body of a for in should be wrapped in an if statement to filter unwanted properties from the prototype.",W090:"'{a}' is not a statement label.",W091:null,W093:"Did you mean to return a conditional instead of an assignment?",W094:"Unexpected comma.",W095:"Expected a string and instead saw {a}.",W096:"The '{a}' key may produce unexpected results.",W097:'Use the function form of "use strict".',W098:"'{a}' is defined but never used.",W099:null,W100:"This character may get silently deleted by one or more browsers.",W101:"Line is too long.",W102:null,W103:"The '{a}' property is deprecated.",W104:"'{a}' is available in ES{b} (use 'esversion: {b}') or Mozilla JS extensions (use moz).",W105:"Unexpected {a} in '{b}'.",W106:"Identifier '{a}' is not in camel case.",W107:"Script URL.",W108:"Strings must use doublequote.",W109:"Strings must use singlequote.",W110:"Mixed double and single quotes.",W112:"Unclosed string.",W113:"Control character in string: {a}.",W114:"Avoid {a}.",W115:"Octal literals are not allowed in strict mode.",W116:"Expected '{a}' and instead saw '{b}'.",W117:"'{a}' is not defined.",W118:"'{a}' is only available in Mozilla JavaScript extensions (use moz option).",W119:"'{a}' is only available in ES{b} (use 'esversion: {b}').",W120:"You might be leaking a variable ({a}) here.",W121:"Extending prototype of native object: '{a}'.",W122:"Invalid typeof value '{a}'",W123:"'{a}' is already defined in outer scope.",W124:"A generator function shall contain a yield statement.",W125:"This line contains non-breaking spaces: http://jshint.com/doc/options/#nonbsp",W126:"Unnecessary grouping operator.",W127:"Unexpected use of a comma operator.",W128:"Empty array elements require elision=true.",W129:"'{a}' is defined in a future version of JavaScript. Use a different variable name to avoid migration issues.",W130:"Invalid element after rest element.",W131:"Invalid parameter after rest parameter.",W132:"`var` declarations are forbidden. Use `let` or `const` instead.",W133:"Invalid for-{a} loop left-hand-side: {b}.",W134:"The '{a}' option is only available when linting ECMAScript {b} code.",W135:"{a} may not be supported by non-browser environments.",W136:"'{a}' must be in function scope.",W137:"Empty destructuring.",W138:"Regular parameters should not come after default parameters."},(function(e,t){n.warnings[t]={code:t,desc:e}})),r.each({I001:"Comma warnings can be turned off with 'laxcomma'.",I002:null,I003:"ES5 option is now set per default"},(function(e,t){n.info[t]={code:t,desc:e}}))},{"../lodash":"/node_modules/jshint/lodash.js"}],"/node_modules/jshint/src/name-stack.js":[function(e,t,n){"use strict"
function r(){this._stack=[]}Object.defineProperty(r.prototype,"length",{get:function(){return this._stack.length}}),r.prototype.push=function(){this._stack.push(null)},r.prototype.pop=function(){this._stack.pop()},r.prototype.set=function(e){this._stack[this.length-1]=e},r.prototype.infer=function(){var e,t=this._stack[this.length-1],n=""
return t&&"class"!==t.type||(t=this._stack[this.length-2]),t?"(string)"!==(e=t.type)&&"(number)"!==e&&"(identifier)"!==e&&"default"!==e?"(expression)":(t.accessorType&&(n=t.accessorType+" "),n+t.value):"(empty)"},t.exports=r},{}],"/node_modules/jshint/src/options.js":[function(e,t,n){"use strict"
n.bool={enforcing:{bitwise:!0,freeze:!0,camelcase:!0,curly:!0,eqeqeq:!0,futurehostile:!0,notypeof:!0,es3:!0,es5:!0,forin:!0,funcscope:!0,immed:!0,iterator:!0,newcap:!0,noarg:!0,nocomma:!0,noempty:!0,nonbsp:!0,nonew:!0,undef:!0,singleGroups:!1,varstmt:!1,enforceall:!1},relaxing:{asi:!0,multistr:!0,debug:!0,boss:!0,evil:!0,globalstrict:!0,plusplus:!0,proto:!0,scripturl:!0,sub:!0,supernew:!0,laxbreak:!0,laxcomma:!0,validthis:!0,withstmt:!0,moz:!0,noyield:!0,eqnull:!0,lastsemic:!0,loopfunc:!0,expr:!0,esnext:!0,elision:!0},environments:{mootools:!0,couch:!0,jasmine:!0,jquery:!0,node:!0,qunit:!0,rhino:!0,shelljs:!0,prototypejs:!0,yui:!0,mocha:!0,module:!0,wsh:!0,worker:!0,nonstandard:!0,browser:!0,browserify:!0,devel:!0,dojo:!0,typed:!0,phantom:!0},obsolete:{onecase:!0,regexp:!0,regexdash:!0}},n.val={maxlen:!1,indent:!1,maxerr:!1,predef:!1,globals:!1,quotmark:!1,scope:!1,maxstatements:!1,maxdepth:!1,maxparams:!1,maxcomplexity:!1,shadow:!1,strict:!0,unused:!0,latedef:!1,ignore:!1,ignoreDelimiters:!1,esversion:5},n.inverted={bitwise:!0,forin:!0,newcap:!0,plusplus:!0,regexp:!0,undef:!0,eqeqeq:!0,strict:!0},n.validNames=Object.keys(n.val).concat(Object.keys(n.bool.relaxing)).concat(Object.keys(n.bool.enforcing)).concat(Object.keys(n.bool.obsolete)).concat(Object.keys(n.bool.environments)),n.renamed={eqeq:"eqeqeq",windows:"wsh",sloppy:"strict"},n.removed={nomen:!0,onevar:!0,passfail:!0,white:!0,gcl:!0,smarttabs:!0,trailing:!0},n.noenforceall={varstmt:!0,strict:!0}},{}],"/node_modules/jshint/src/reg.js":[function(e,t,n){"use strict"
n.unsafeString=/@cc|<\/?|script|\]\s*\]|<\s*!|&lt/i,n.unsafeChars=/[\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/,n.needEsc=/[\u0000-\u001f&<"\/\\\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/,n.needEscGlobal=/[\u0000-\u001f&<"\/\\\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,n.starSlash=/\*\//,n.identifier=/^([a-zA-Z_$][a-zA-Z0-9_$]*)$/,n.javascriptURL=/^(?:javascript|jscript|ecmascript|vbscript|livescript)\s*:/i,n.fallsThrough=/^\s*falls?\sthrough\s*$/,n.maxlenException=/^(?:(?:\/\/|\/\*|\*) ?)?[^ ]+$/},{}],"/node_modules/jshint/src/scope-manager.js":[function(e,t,n){"use strict"
var r=e("../lodash"),i=e("events"),o={}
t.exports=function(e,t,n,s){var a,c=[]
function u(e){a={"(labels)":Object.create(null),"(usages)":Object.create(null),"(breakLabels)":Object.create(null),"(parent)":a,"(type)":e,"(params)":"functionparams"===e||"catchparams"===e?[]:null},c.push(a)}u("global"),a["(predefined)"]=t
var l=a,f=Object.create(null),h=Object.create(null),p=[],d=new i.EventEmitter
function m(e,t){d.emit("warning",{code:e,token:t,data:r.slice(arguments,2)})}function v(e,t){d.emit("warning",{code:e,token:t,data:r.slice(arguments,2)})}function g(e){a["(usages)"][e]||(a["(usages)"][e]={"(modified)":[],"(reassigned)":[],"(tokens)":[]})}var k=function(t){return void 0===t&&(t=e.option.unused),!0===t&&(t="last-param"),t},b=function(e,t,n,r){var i=t.line,o=t.from,s=t.raw_text||e,a={vars:["var"],"last-param":["var","param"],strict:["var","param","last-param"]};(r=k(r))&&a[r]&&-1!==a[r].indexOf(n)&&m("W098",{line:i,from:o},s),(r||"var"===n)&&p.push({name:e,line:i,character:o})}
function y(){if("functionparams"!==a["(type)"]){var t=a["(labels)"]
for(var n in t)t[n]&&"exception"!==t[n]["(type)"]&&t[n]["(unused)"]&&b(n,t[n]["(token)"],"var")}else(function(){var t=a["(params)"]
if(!t)return
var n,r=t.pop()
for(;r;){var i=a["(labels)"][r]
if(n=k(e.funct["(unusedOption)"]),"undefined"===r)return
if(i["(unused)"])b(r,i["(token)"],"param",e.funct["(unusedOption)"])
else if("last-param"===n)return
r=t.pop()}})()}function x(e){for(var t=c.length-1;t>=0;--t){var n=c[t]["(labels)"]
if(n[e])return n}}function E(t,n){if("outer"===e.option.shadow)for(var r="global"===l["(type)"],i="functionparams"===a["(type)"],o=!r,s=0;s<c.length;s++){var u=c[s]
i||c[s+1]!==l||(o=!1),o&&u["(labels)"][t]&&m("W123",n,t),u["(breakLabels)"][t]&&m("W123",n,t)}}function w(t,n,r){e.option.latedef&&(!0===e.option.latedef&&"function"===t||"function"!==t)&&m("W003",r,n)}var S={on:function(e,t){e.split(" ").forEach((function(e){d.on(e,t)}))},isPredefined:function(e){return!this.has(e)&&r.has(c[0]["(predefined)"],e)},stack:function(e){var t=a
u(e),e||"functionparams"!==t["(type)"]||(a["(isFuncBody)"]=!0,a["(context)"]=l,l=a)},unstack:function(){var t,n,i=c.length>1?c[c.length-2]:null,u=a===l,p="functionparams"===a["(type)"],d="functionouter"===a["(type)"],g=a["(usages)"],k=a["(labels)"],x=Object.keys(g)
for(g.__proto__&&-1===x.indexOf("__proto__")&&x.push("__proto__"),t=0;t<x.length;t++){var E=x[t],w=g[E],S=k[E]
if(S){var W=S["(type)"]
if(S["(useOutsideOfScope)"]&&!e.option.funcscope){var j=w["(tokens)"]
if(j)for(n=0;n<j.length;n++)S["(function)"]===j[n]["(function)"]&&v("W038",j[n],E)}if(a["(labels)"][E]["(unused)"]=!1,"const"===W&&w["(modified)"])for(n=0;n<w["(modified)"].length;n++)v("E013",w["(modified)"][n],E)
if(("function"===W||"class"===W)&&w["(reassigned)"])for(n=0;n<w["(reassigned)"].length;n++)v("W021",w["(reassigned)"][n],E,W)}else if(d&&(e.funct["(isCapturing)"]=!0),i)if(i["(usages)"][E]){var L=i["(usages)"][E]
L["(modified)"]=L["(modified)"].concat(w["(modified)"]),L["(tokens)"]=L["(tokens)"].concat(w["(tokens)"]),L["(reassigned)"]=L["(reassigned)"].concat(w["(reassigned)"]),L["(onlyUsedSubFunction)"]=!1}else i["(usages)"][E]=w,u&&(i["(usages)"][E]["(onlyUsedSubFunction)"]=!0)
else if("boolean"==typeof a["(predefined)"][E]){if(delete s[E],f[E]=o,!1===a["(predefined)"][E]&&w["(reassigned)"])for(n=0;n<w["(reassigned)"].length;n++)m("W020",w["(reassigned)"][n])}else if(w["(tokens)"])for(n=0;n<w["(tokens)"].length;n++){var _=w["(tokens)"][n]
_.forgiveUndef||(e.option.undef&&!_.ignoreUndef&&m("W117",_,E),h[E]?h[E].line.push(_.line):h[E]={name:E,line:[_.line]})}}if(i||Object.keys(s).forEach((function(e){b(e,s[e],"var")})),i&&!u&&!p&&!d){var A=Object.keys(k)
for(t=0;t<A.length;t++){var M=A[t]
k[M]["(blockscoped)"]||"exception"===k[M]["(type)"]||this.funct.has(M,{excludeCurrent:!0})||(i["(labels)"][M]=k[M],"global"!==l["(type)"]&&(i["(labels)"][M]["(useOutsideOfScope)"]=!0),delete k[M])}}y(),c.pop(),u&&(l=c[r.findLastIndex(c,(function(e){return e["(isFuncBody)"]||"global"===e["(type)"]}))]),a=i},addParam:function(t,n,i){if("exception"===(i=i||"param")){var o=this.funct.labeltype(t)
o&&"exception"!==o&&(e.option.node||m("W002",e.tokens.next,t))}(r.has(a["(labels)"],t)?a["(labels)"][t].duplicated=!0:(E(t,n),a["(labels)"][t]={"(type)":i,"(token)":n,"(unused)":!0},a["(params)"].push(t)),r.has(a["(usages)"],t))&&(a["(usages)"][t]["(onlyUsedSubFunction)"]?w(i,t,n):m("E056",n,t,i))},validateParams:function(){if("global"!==l["(type)"]){var t=e.isStrict(),n=l["(parent)"]
n["(params)"]&&n["(params)"].forEach((function(r){var i=n["(labels)"][r]
i&&i.duplicated&&(t?m("E011",i["(token)"],r):!0!==e.option.shadow&&m("W004",i["(token)"],r))}))}},getUsedOrDefinedGlobals:function(){var e=Object.keys(f)
return f.__proto__===o&&-1===e.indexOf("__proto__")&&e.push("__proto__"),e},getImpliedGlobals:function(){var e=r.values(h)
return h.__proto__&&(e.some((function(e){return"__proto__"===e.name}))||e.push(h.__proto__)),e},getUnuseds:function(){return p},has:function(e){return Boolean(x(e))},labeltype:function(e){var t=x(e)
return t?t[e]["(type)"]:null},addExported:function(e){var t=c[0]["(labels)"]
if(r.has(s,e))delete s[e]
else if(r.has(t,e))t[e]["(unused)"]=!1
else{for(var i=1;i<c.length;i++){var o=c[i]
if(o["(type)"])break
if(r.has(o["(labels)"],e)&&!o["(labels)"][e]["(blockscoped)"])return void(o["(labels)"][e]["(unused)"]=!1)}n[e]=!0}},setExported:function(e,t){this.block.use(e,t)},addlabel:function(t,i){var s=i.type,u=i.token,h="let"===s||"const"===s||"class"===s,p="global"===(h?a:l)["(type)"]&&r.has(n,t)
if(E(t,u),h){var d=a["(labels)"][t]
if(d||a!==l||"global"===a["(type)"]||(d=!!l["(parent)"]["(labels)"][t]),!d&&a["(usages)"][t])a["(usages)"][t]["(onlyUsedSubFunction)"]?w(s,t,u):m("E056",u,t,s)
d?m("E011",u,t):"outer"===e.option.shadow&&S.funct.has(t)&&m("W004",u,t),S.block.add(t,s,u,!p)}else{var v=S.funct.has(t)
!v&&function(e){for(var t=c.length-1;t>=0;t--){var n=c[t]
if(n["(usages)"][e])return n["(usages)"][e]
if(n===l)break}return!1}(t)&&w(s,t,u),S.funct.has(t,{onlyBlockscoped:!0})?m("E011",u,t):!0!==e.option.shadow&&v&&"__proto__"!==t&&"global"!==l["(type)"]&&m("W004",u,t),S.funct.add(t,s,u,!p),"global"===l["(type)"]&&(f[t]=o)}},funct:{labeltype:function(e,t){for(var n=t&&t.onlyBlockscoped,r=t&&t.excludeParams,i=c.length-(t&&t.excludeCurrent?2:1);i>=0;i--){var o=c[i]
if(o["(labels)"][e]&&(!n||o["(labels)"][e]["(blockscoped)"]))return o["(labels)"][e]["(type)"]
var s=r?c[i-1]:o
if(s&&"functionparams"===s["(type)"])return null}return null},hasBreakLabel:function(e){for(var t=c.length-1;t>=0;t--){var n=c[t]
if(n["(breakLabels)"][e])return!0
if("functionparams"===n["(type)"])return!1}return!1},has:function(e,t){return Boolean(this.labeltype(e,t))},add:function(e,t,n,r){a["(labels)"][e]={"(type)":t,"(token)":n,"(blockscoped)":!1,"(function)":l,"(unused)":r}}},block:{isGlobal:function(){return"global"===a["(type)"]},use:function(t,n){var r=l["(parent)"]
r&&r["(labels)"][t]&&"param"===r["(labels)"][t]["(type)"]&&(S.funct.has(t,{excludeParams:!0,onlyBlockscoped:!0})||(r["(labels)"][t]["(unused)"]=!1)),n&&(e.ignored.W117||!1===e.option.undef)&&(n.ignoreUndef=!0),g(t),n&&(n["(function)"]=l,a["(usages)"][t]["(tokens)"].push(n))},reassign:function(e,t){this.modify(e,t),a["(usages)"][e]["(reassigned)"].push(t)},modify:function(e,t){g(e),a["(usages)"][e]["(modified)"].push(t)},add:function(e,t,n,r){a["(labels)"][e]={"(type)":t,"(token)":n,"(blockscoped)":!0,"(unused)":r}},addBreakLabel:function(t,n){var r=n.token
S.funct.hasBreakLabel(t)?m("E011",r,t):"outer"===e.option.shadow&&(S.funct.has(t)?m("W004",r,t):E(t,r)),a["(breakLabels)"][t]=r}}}
return S}},{"../lodash":"/node_modules/jshint/lodash.js",events:"/node_modules/browserify/node_modules/events/events.js"}],"/node_modules/jshint/src/state.js":[function(e,t,n){"use strict"
var r=e("./name-stack.js"),i={syntax:{},isStrict:function(){return this.directive["use strict"]||this.inClassBody||this.option.module||"implied"===this.option.strict},inMoz:function(){return this.option.moz},inES6:function(){return this.option.moz||this.option.esversion>=6},inES5:function(e){return e?!(this.option.esversion&&5!==this.option.esversion||this.option.moz):!this.option.esversion||this.option.esversion>=5||this.option.moz},reset:function(){this.tokens={prev:null,next:null,curr:null},this.option={},this.funct=null,this.ignored={},this.directive={},this.jsonMode=!1,this.jsonWarnings=[],this.lines=[],this.tab="",this.cache={},this.ignoredLines={},this.forinifcheckneeded=!1,this.nameStack=new r,this.inClassBody=!1}}
n.state=i},{"./name-stack.js":"/node_modules/jshint/src/name-stack.js"}],"/node_modules/jshint/src/style.js":[function(e,t,n){"use strict"
n.register=function(e){e.on("Identifier",(function(t){e.getOption("proto")||"__proto__"===t.name&&e.warn("W103",{line:t.line,char:t.char,data:[t.name,"6"]})})),e.on("Identifier",(function(t){e.getOption("iterator")||"__iterator__"===t.name&&e.warn("W103",{line:t.line,char:t.char,data:[t.name]})})),e.on("Identifier",(function(t){e.getOption("camelcase")&&t.name.replace(/^_+|_+$/g,"").indexOf("_")>-1&&!t.name.match(/^[A-Z0-9_]*$/)&&e.warn("W106",{line:t.line,char:t.from,data:[t.name]})})),e.on("String",(function(t){var n,r=e.getOption("quotmark")
r&&("single"===r&&"'"!==t.quote&&(n="W109"),"double"===r&&'"'!==t.quote&&(n="W108"),!0===r&&(e.getCache("quotmark")||e.setCache("quotmark",t.quote),e.getCache("quotmark")!==t.quote&&(n="W110")),n&&e.warn(n,{line:t.line,char:t.char}))})),e.on("Number",(function(t){"."===t.value.charAt(0)&&e.warn("W008",{line:t.line,char:t.char,data:[t.value]}),"."===t.value.substr(t.value.length-1)&&e.warn("W047",{line:t.line,char:t.char,data:[t.value]}),/^00+/.test(t.value)&&e.warn("W046",{line:t.line,char:t.char,data:[t.value]})})),e.on("String",(function(t){e.getOption("scripturl")||/^(?:javascript|jscript|ecmascript|vbscript|livescript)\s*:/i.test(t.value)&&e.warn("W107",{line:t.line,char:t.char})}))}},{}],"/node_modules/jshint/src/vars.js":[function(e,t,n){"use strict"
n.reservedVars={arguments:!1,NaN:!1},n.ecmaIdentifiers={3:{Array:!1,Boolean:!1,Date:!1,decodeURI:!1,decodeURIComponent:!1,encodeURI:!1,encodeURIComponent:!1,Error:!1,eval:!1,EvalError:!1,Function:!1,hasOwnProperty:!1,isFinite:!1,isNaN:!1,Math:!1,Number:!1,Object:!1,parseInt:!1,parseFloat:!1,RangeError:!1,ReferenceError:!1,RegExp:!1,String:!1,SyntaxError:!1,TypeError:!1,URIError:!1},5:{JSON:!1},6:{Map:!1,Promise:!1,Proxy:!1,Reflect:!1,Set:!1,Symbol:!1,WeakMap:!1,WeakSet:!1}},n.browser={Audio:!1,Blob:!1,addEventListener:!1,applicationCache:!1,atob:!1,blur:!1,btoa:!1,cancelAnimationFrame:!1,CanvasGradient:!1,CanvasPattern:!1,CanvasRenderingContext2D:!1,CSS:!1,clearInterval:!1,clearTimeout:!1,close:!1,closed:!1,Comment:!1,CustomEvent:!1,DOMParser:!1,defaultStatus:!1,Document:!1,document:!1,DocumentFragment:!1,Element:!1,ElementTimeControl:!1,Event:!1,event:!1,fetch:!1,FileReader:!1,FormData:!1,focus:!1,frames:!1,getComputedStyle:!1,HTMLElement:!1,HTMLAnchorElement:!1,HTMLBaseElement:!1,HTMLBlockquoteElement:!1,HTMLBodyElement:!1,HTMLBRElement:!1,HTMLButtonElement:!1,HTMLCanvasElement:!1,HTMLCollection:!1,HTMLDirectoryElement:!1,HTMLDivElement:!1,HTMLDListElement:!1,HTMLFieldSetElement:!1,HTMLFontElement:!1,HTMLFormElement:!1,HTMLFrameElement:!1,HTMLFrameSetElement:!1,HTMLHeadElement:!1,HTMLHeadingElement:!1,HTMLHRElement:!1,HTMLHtmlElement:!1,HTMLIFrameElement:!1,HTMLImageElement:!1,HTMLInputElement:!1,HTMLIsIndexElement:!1,HTMLLabelElement:!1,HTMLLayerElement:!1,HTMLLegendElement:!1,HTMLLIElement:!1,HTMLLinkElement:!1,HTMLMapElement:!1,HTMLMenuElement:!1,HTMLMetaElement:!1,HTMLModElement:!1,HTMLObjectElement:!1,HTMLOListElement:!1,HTMLOptGroupElement:!1,HTMLOptionElement:!1,HTMLParagraphElement:!1,HTMLParamElement:!1,HTMLPreElement:!1,HTMLQuoteElement:!1,HTMLScriptElement:!1,HTMLSelectElement:!1,HTMLStyleElement:!1,HTMLTableCaptionElement:!1,HTMLTableCellElement:!1,HTMLTableColElement:!1,HTMLTableElement:!1,HTMLTableRowElement:!1,HTMLTableSectionElement:!1,HTMLTemplateElement:!1,HTMLTextAreaElement:!1,HTMLTitleElement:!1,HTMLUListElement:!1,HTMLVideoElement:!1,history:!1,Image:!1,Intl:!1,length:!1,localStorage:!1,location:!1,matchMedia:!1,MessageChannel:!1,MessageEvent:!1,MessagePort:!1,MouseEvent:!1,moveBy:!1,moveTo:!1,MutationObserver:!1,name:!1,Node:!1,NodeFilter:!1,NodeList:!1,Notification:!1,navigator:!1,onbeforeunload:!0,onblur:!0,onerror:!0,onfocus:!0,onload:!0,onresize:!0,onunload:!0,open:!1,openDatabase:!1,opener:!1,Option:!1,parent:!1,performance:!1,print:!1,Range:!1,requestAnimationFrame:!1,removeEventListener:!1,resizeBy:!1,resizeTo:!1,screen:!1,scroll:!1,scrollBy:!1,scrollTo:!1,sessionStorage:!1,setInterval:!1,setTimeout:!1,SharedWorker:!1,status:!1,SVGAElement:!1,SVGAltGlyphDefElement:!1,SVGAltGlyphElement:!1,SVGAltGlyphItemElement:!1,SVGAngle:!1,SVGAnimateColorElement:!1,SVGAnimateElement:!1,SVGAnimateMotionElement:!1,SVGAnimateTransformElement:!1,SVGAnimatedAngle:!1,SVGAnimatedBoolean:!1,SVGAnimatedEnumeration:!1,SVGAnimatedInteger:!1,SVGAnimatedLength:!1,SVGAnimatedLengthList:!1,SVGAnimatedNumber:!1,SVGAnimatedNumberList:!1,SVGAnimatedPathData:!1,SVGAnimatedPoints:!1,SVGAnimatedPreserveAspectRatio:!1,SVGAnimatedRect:!1,SVGAnimatedString:!1,SVGAnimatedTransformList:!1,SVGAnimationElement:!1,SVGCSSRule:!1,SVGCircleElement:!1,SVGClipPathElement:!1,SVGColor:!1,SVGColorProfileElement:!1,SVGColorProfileRule:!1,SVGComponentTransferFunctionElement:!1,SVGCursorElement:!1,SVGDefsElement:!1,SVGDescElement:!1,SVGDocument:!1,SVGElement:!1,SVGElementInstance:!1,SVGElementInstanceList:!1,SVGEllipseElement:!1,SVGExternalResourcesRequired:!1,SVGFEBlendElement:!1,SVGFEColorMatrixElement:!1,SVGFEComponentTransferElement:!1,SVGFECompositeElement:!1,SVGFEConvolveMatrixElement:!1,SVGFEDiffuseLightingElement:!1,SVGFEDisplacementMapElement:!1,SVGFEDistantLightElement:!1,SVGFEFloodElement:!1,SVGFEFuncAElement:!1,SVGFEFuncBElement:!1,SVGFEFuncGElement:!1,SVGFEFuncRElement:!1,SVGFEGaussianBlurElement:!1,SVGFEImageElement:!1,SVGFEMergeElement:!1,SVGFEMergeNodeElement:!1,SVGFEMorphologyElement:!1,SVGFEOffsetElement:!1,SVGFEPointLightElement:!1,SVGFESpecularLightingElement:!1,SVGFESpotLightElement:!1,SVGFETileElement:!1,SVGFETurbulenceElement:!1,SVGFilterElement:!1,SVGFilterPrimitiveStandardAttributes:!1,SVGFitToViewBox:!1,SVGFontElement:!1,SVGFontFaceElement:!1,SVGFontFaceFormatElement:!1,SVGFontFaceNameElement:!1,SVGFontFaceSrcElement:!1,SVGFontFaceUriElement:!1,SVGForeignObjectElement:!1,SVGGElement:!1,SVGGlyphElement:!1,SVGGlyphRefElement:!1,SVGGradientElement:!1,SVGHKernElement:!1,SVGICCColor:!1,SVGImageElement:!1,SVGLangSpace:!1,SVGLength:!1,SVGLengthList:!1,SVGLineElement:!1,SVGLinearGradientElement:!1,SVGLocatable:!1,SVGMPathElement:!1,SVGMarkerElement:!1,SVGMaskElement:!1,SVGMatrix:!1,SVGMetadataElement:!1,SVGMissingGlyphElement:!1,SVGNumber:!1,SVGNumberList:!1,SVGPaint:!1,SVGPathElement:!1,SVGPathSeg:!1,SVGPathSegArcAbs:!1,SVGPathSegArcRel:!1,SVGPathSegClosePath:!1,SVGPathSegCurvetoCubicAbs:!1,SVGPathSegCurvetoCubicRel:!1,SVGPathSegCurvetoCubicSmoothAbs:!1,SVGPathSegCurvetoCubicSmoothRel:!1,SVGPathSegCurvetoQuadraticAbs:!1,SVGPathSegCurvetoQuadraticRel:!1,SVGPathSegCurvetoQuadraticSmoothAbs:!1,SVGPathSegCurvetoQuadraticSmoothRel:!1,SVGPathSegLinetoAbs:!1,SVGPathSegLinetoHorizontalAbs:!1,SVGPathSegLinetoHorizontalRel:!1,SVGPathSegLinetoRel:!1,SVGPathSegLinetoVerticalAbs:!1,SVGPathSegLinetoVerticalRel:!1,SVGPathSegList:!1,SVGPathSegMovetoAbs:!1,SVGPathSegMovetoRel:!1,SVGPatternElement:!1,SVGPoint:!1,SVGPointList:!1,SVGPolygonElement:!1,SVGPolylineElement:!1,SVGPreserveAspectRatio:!1,SVGRadialGradientElement:!1,SVGRect:!1,SVGRectElement:!1,SVGRenderingIntent:!1,SVGSVGElement:!1,SVGScriptElement:!1,SVGSetElement:!1,SVGStopElement:!1,SVGStringList:!1,SVGStylable:!1,SVGStyleElement:!1,SVGSwitchElement:!1,SVGSymbolElement:!1,SVGTRefElement:!1,SVGTSpanElement:!1,SVGTests:!1,SVGTextContentElement:!1,SVGTextElement:!1,SVGTextPathElement:!1,SVGTextPositioningElement:!1,SVGTitleElement:!1,SVGTransform:!1,SVGTransformList:!1,SVGTransformable:!1,SVGURIReference:!1,SVGUnitTypes:!1,SVGUseElement:!1,SVGVKernElement:!1,SVGViewElement:!1,SVGViewSpec:!1,SVGZoomAndPan:!1,Text:!1,TextDecoder:!1,TextEncoder:!1,TimeEvent:!1,top:!1,URL:!1,WebGLActiveInfo:!1,WebGLBuffer:!1,WebGLContextEvent:!1,WebGLFramebuffer:!1,WebGLProgram:!1,WebGLRenderbuffer:!1,WebGLRenderingContext:!1,WebGLShader:!1,WebGLShaderPrecisionFormat:!1,WebGLTexture:!1,WebGLUniformLocation:!1,WebSocket:!1,window:!1,Window:!1,Worker:!1,XDomainRequest:!1,XMLHttpRequest:!1,XMLSerializer:!1,XPathEvaluator:!1,XPathException:!1,XPathExpression:!1,XPathNamespace:!1,XPathNSResolver:!1,XPathResult:!1},n.devel={alert:!1,confirm:!1,console:!1,Debug:!1,opera:!1,prompt:!1},n.worker={importScripts:!0,postMessage:!0,self:!0,FileReaderSync:!0},n.nonstandard={escape:!1,unescape:!1},n.couch={require:!1,respond:!1,getRow:!1,emit:!1,send:!1,start:!1,sum:!1,log:!1,exports:!1,module:!1,provides:!1},n.node={__filename:!1,__dirname:!1,GLOBAL:!1,global:!1,module:!1,require:!1,Buffer:!0,console:!0,exports:!0,process:!0,setTimeout:!0,clearTimeout:!0,setInterval:!0,clearInterval:!0,setImmediate:!0,clearImmediate:!0},n.browserify={__filename:!1,__dirname:!1,global:!1,module:!1,require:!1,Buffer:!0,exports:!0,process:!0},n.phantom={phantom:!0,require:!0,WebPage:!0,console:!0,exports:!0},n.qunit={asyncTest:!1,deepEqual:!1,equal:!1,expect:!1,module:!1,notDeepEqual:!1,notEqual:!1,notPropEqual:!1,notStrictEqual:!1,ok:!1,propEqual:!1,QUnit:!1,raises:!1,start:!1,stop:!1,strictEqual:!1,test:!1,throws:!1},n.rhino={defineClass:!1,deserialize:!1,gc:!1,help:!1,importClass:!1,importPackage:!1,java:!1,load:!1,loadClass:!1,Packages:!1,print:!1,quit:!1,readFile:!1,readUrl:!1,runCommand:!1,seal:!1,serialize:!1,spawn:!1,sync:!1,toint32:!1,version:!1},n.shelljs={target:!1,echo:!1,exit:!1,cd:!1,pwd:!1,ls:!1,find:!1,cp:!1,rm:!1,mv:!1,mkdir:!1,test:!1,cat:!1,sed:!1,grep:!1,which:!1,dirs:!1,pushd:!1,popd:!1,env:!1,exec:!1,chmod:!1,config:!1,error:!1,tempdir:!1},n.typed={ArrayBuffer:!1,ArrayBufferView:!1,DataView:!1,Float32Array:!1,Float64Array:!1,Int16Array:!1,Int32Array:!1,Int8Array:!1,Uint16Array:!1,Uint32Array:!1,Uint8Array:!1,Uint8ClampedArray:!1},n.wsh={ActiveXObject:!0,Enumerator:!0,GetObject:!0,ScriptEngine:!0,ScriptEngineBuildVersion:!0,ScriptEngineMajorVersion:!0,ScriptEngineMinorVersion:!0,VBArray:!0,WSH:!0,WScript:!0,XDomainRequest:!0},n.dojo={dojo:!1,dijit:!1,dojox:!1,define:!1,require:!1},n.jquery={$:!1,jQuery:!1},n.mootools={$:!1,$$:!1,Asset:!1,Browser:!1,Chain:!1,Class:!1,Color:!1,Cookie:!1,Core:!1,Document:!1,DomReady:!1,DOMEvent:!1,DOMReady:!1,Drag:!1,Element:!1,Elements:!1,Event:!1,Events:!1,Fx:!1,Group:!1,Hash:!1,HtmlTable:!1,IFrame:!1,IframeShim:!1,InputValidator:!1,instanceOf:!1,Keyboard:!1,Locale:!1,Mask:!1,MooTools:!1,Native:!1,Options:!1,OverText:!1,Request:!1,Scroller:!1,Slick:!1,Slider:!1,Sortables:!1,Spinner:!1,Swiff:!1,Tips:!1,Type:!1,typeOf:!1,URI:!1,Window:!1},n.prototypejs={$:!1,$$:!1,$A:!1,$F:!1,$H:!1,$R:!1,$break:!1,$continue:!1,$w:!1,Abstract:!1,Ajax:!1,Class:!1,Enumerable:!1,Element:!1,Event:!1,Field:!1,Form:!1,Hash:!1,Insertion:!1,ObjectRange:!1,PeriodicalExecuter:!1,Position:!1,Prototype:!1,Selector:!1,Template:!1,Toggle:!1,Try:!1,Autocompleter:!1,Builder:!1,Control:!1,Draggable:!1,Draggables:!1,Droppables:!1,Effect:!1,Sortable:!1,SortableObserver:!1,Sound:!1,Scriptaculous:!1},n.yui={YUI:!1,Y:!1,YUI_config:!1},n.mocha={mocha:!1,describe:!1,xdescribe:!1,it:!1,xit:!1,context:!1,xcontext:!1,before:!1,after:!1,beforeEach:!1,afterEach:!1,suite:!1,test:!1,setup:!1,teardown:!1,suiteSetup:!1,suiteTeardown:!1},n.jasmine={jasmine:!1,describe:!1,xdescribe:!1,it:!1,xit:!1,beforeEach:!1,afterEach:!1,setFixtures:!1,loadFixtures:!1,spyOn:!1,expect:!1,runs:!1,waitsFor:!1,waits:!1,beforeAll:!1,afterAll:!1,fail:!1,fdescribe:!1,fit:!1,pending:!1}},{}]},{},["/node_modules/jshint/src/jshint.js"])})),ace.define("ace/mode/javascript_worker",[],(function(require,exports,module){"use strict"
var oop=require("../lib/oop"),Mirror=require("../worker/mirror").Mirror,lint=require("./javascript/jshint").JSHINT
function startRegex(e){return RegExp("^("+e.join("|")+")")}var disabledWarningsRe=startRegex(["Bad for in variable '(.+)'.",'Missing "use strict"']),errorsRe=startRegex(["Unexpected","Expected ","Confusing (plus|minus)","\\{a\\} unterminated regular expression","Unclosed ","Unmatched ","Unbegun comment","Bad invocation","Missing space after","Missing operator at"]),infoRe=startRegex(["Expected an assignment","Bad escapement of EOL","Unexpected comma","Unexpected space","Missing radix parameter.","A leading decimal point can","\\['{a}'\\] is better written in dot notation.","'{a}' used out of scope"]),JavaScriptWorker=exports.JavaScriptWorker=function(e){Mirror.call(this,e),this.setTimeout(500),this.setOptions()}
oop.inherits(JavaScriptWorker,Mirror),function(){this.setOptions=function(e){this.options=e||{esnext:!0,moz:!0,devel:!0,browser:!0,node:!0,laxcomma:!0,laxbreak:!0,lastsemic:!0,onevar:!1,passfail:!1,maxerr:100,expr:!0,multistr:!0,globalstrict:!0},this.doc.getValue()&&this.deferredUpdate.schedule(100)},this.changeOptions=function(e){oop.mixin(this.options,e),this.doc.getValue()&&this.deferredUpdate.schedule(100)},this.isValidJS=function(str){try{eval("throw 0;"+str)}catch(e){if(0===e)return!0}return!1},this.onUpdate=function(){var e=this.doc.getValue()
if(!(e=e.replace(/^#!.*\n/,"\n")))return this.sender.emit("annotate",[])
var t=[],n=this.isValidJS(e)?"warning":"error"
lint(e,this.options,this.options.globals)
for(var r=lint.errors,i=0;i<r.length;i++){var o=r[i]
if(o){var s=o.raw,a="warning"
if("Missing semicolon."==s){var c=o.evidence.substr(o.character)
c=c.charAt(c.search(/\S/)),"error"==n&&c&&/[\w\d{(['"]/.test(c)?(o.reason='Missing ";" before statement',a="error"):a="info"}else{if(disabledWarningsRe.test(s))continue
infoRe.test(s)?a="info":errorsRe.test(s)?(!0,a=n):"'{a}' is not defined."==s?a="warning":"'{a}' is defined but never used."==s&&(a="info")}t.push({row:o.line-1,column:o.character-1,text:o.reason,type:a,raw:s})}}this.sender.emit("annotate",t)}}.call(JavaScriptWorker.prototype)})),ace.define("ace/lib/es5-shim",[],(function(e,t,n){function r(){}Function.prototype.bind||(Function.prototype.bind=function(e){var t=this
if("function"!=typeof t)throw new TypeError("Function.prototype.bind called on incompatible "+t)
var n=h.call(arguments,1),i=function(){if(this instanceof i){var r=t.apply(this,n.concat(h.call(arguments)))
return Object(r)===r?r:this}return t.apply(e,n.concat(h.call(arguments)))}
return t.prototype&&(r.prototype=t.prototype,i.prototype=new r,r.prototype=null),i})
var i,o,s,a,c,u=Function.prototype.call,l=Array.prototype,f=Object.prototype,h=l.slice,p=u.bind(f.toString),d=u.bind(f.hasOwnProperty)
if((c=d(f,"__defineGetter__"))&&(i=u.bind(f.__defineGetter__),o=u.bind(f.__defineSetter__),s=u.bind(f.__lookupGetter__),a=u.bind(f.__lookupSetter__)),2!=[1,2].splice(0).length)if(function(){function e(e){var t=new Array(e+2)
return t[0]=t[1]=0,t}var t,n=[]
if(n.splice.apply(n,e(20)),n.splice.apply(n,e(26)),t=n.length,n.splice(5,0,"XXX"),n.length,t+1==n.length)return!0}()){var m=Array.prototype.splice
Array.prototype.splice=function(e,t){return arguments.length?m.apply(this,[void 0===e?0:e,void 0===t?this.length-e:t].concat(h.call(arguments,2))):[]}}else Array.prototype.splice=function(e,t){var n=this.length
e>0?e>n&&(e=n):null==e?e=0:e<0&&(e=Math.max(n+e,0)),e+t<n||(t=n-e)
var r=this.slice(e,e+t),i=h.call(arguments,2),o=i.length
if(e===n)o&&this.push.apply(this,i)
else{var s=Math.min(t,n-e),a=e+s,c=a+o-s,u=n-a,l=n-s
if(c<a)for(var f=0;f<u;++f)this[c+f]=this[a+f]
else if(c>a)for(f=u;f--;)this[c+f]=this[a+f]
if(o&&e===l)this.length=l,this.push.apply(this,i)
else for(this.length=l+o,f=0;f<o;++f)this[e+f]=i[f]}return r}
Array.isArray||(Array.isArray=function(e){return"[object Array]"==p(e)})
var v,g,k=Object("a"),b="a"!=k[0]||!(0 in k)
if(Array.prototype.forEach||(Array.prototype.forEach=function(e){var t=T(this),n=b&&"[object String]"==p(this)?this.split(""):t,r=arguments[1],i=-1,o=n.length>>>0
if("[object Function]"!=p(e))throw new TypeError
for(;++i<o;)i in n&&e.call(r,n[i],i,t)}),Array.prototype.map||(Array.prototype.map=function(e){var t=T(this),n=b&&"[object String]"==p(this)?this.split(""):t,r=n.length>>>0,i=Array(r),o=arguments[1]
if("[object Function]"!=p(e))throw new TypeError(e+" is not a function")
for(var s=0;s<r;s++)s in n&&(i[s]=e.call(o,n[s],s,t))
return i}),Array.prototype.filter||(Array.prototype.filter=function(e){var t,n=T(this),r=b&&"[object String]"==p(this)?this.split(""):n,i=r.length>>>0,o=[],s=arguments[1]
if("[object Function]"!=p(e))throw new TypeError(e+" is not a function")
for(var a=0;a<i;a++)a in r&&(t=r[a],e.call(s,t,a,n)&&o.push(t))
return o}),Array.prototype.every||(Array.prototype.every=function(e){var t=T(this),n=b&&"[object String]"==p(this)?this.split(""):t,r=n.length>>>0,i=arguments[1]
if("[object Function]"!=p(e))throw new TypeError(e+" is not a function")
for(var o=0;o<r;o++)if(o in n&&!e.call(i,n[o],o,t))return!1
return!0}),Array.prototype.some||(Array.prototype.some=function(e){var t=T(this),n=b&&"[object String]"==p(this)?this.split(""):t,r=n.length>>>0,i=arguments[1]
if("[object Function]"!=p(e))throw new TypeError(e+" is not a function")
for(var o=0;o<r;o++)if(o in n&&e.call(i,n[o],o,t))return!0
return!1}),Array.prototype.reduce||(Array.prototype.reduce=function(e){var t=T(this),n=b&&"[object String]"==p(this)?this.split(""):t,r=n.length>>>0
if("[object Function]"!=p(e))throw new TypeError(e+" is not a function")
if(!r&&1==arguments.length)throw new TypeError("reduce of empty array with no initial value")
var i,o=0
if(arguments.length>=2)i=arguments[1]
else for(;;){if(o in n){i=n[o++]
break}if(++o>=r)throw new TypeError("reduce of empty array with no initial value")}for(;o<r;o++)o in n&&(i=e.call(void 0,i,n[o],o,t))
return i}),Array.prototype.reduceRight||(Array.prototype.reduceRight=function(e){var t=T(this),n=b&&"[object String]"==p(this)?this.split(""):t,r=n.length>>>0
if("[object Function]"!=p(e))throw new TypeError(e+" is not a function")
if(!r&&1==arguments.length)throw new TypeError("reduceRight of empty array with no initial value")
var i,o=r-1
if(arguments.length>=2)i=arguments[1]
else for(;;){if(o in n){i=n[o--]
break}if(--o<0)throw new TypeError("reduceRight of empty array with no initial value")}do{o in this&&(i=e.call(void 0,i,n[o],o,t))}while(o--)
return i}),Array.prototype.indexOf&&-1==[0,1].indexOf(1,2)||(Array.prototype.indexOf=function(e){var t=b&&"[object String]"==p(this)?this.split(""):T(this),n=t.length>>>0
if(!n)return-1
var r=0
for(arguments.length>1&&(r=O(arguments[1])),r=r>=0?r:Math.max(0,n+r);r<n;r++)if(r in t&&t[r]===e)return r
return-1}),Array.prototype.lastIndexOf&&-1==[0,1].lastIndexOf(0,-3)||(Array.prototype.lastIndexOf=function(e){var t=b&&"[object String]"==p(this)?this.split(""):T(this),n=t.length>>>0
if(!n)return-1
var r=n-1
for(arguments.length>1&&(r=Math.min(r,O(arguments[1]))),r=r>=0?r:n-Math.abs(r);r>=0;r--)if(r in t&&e===t[r])return r
return-1}),Object.getPrototypeOf||(Object.getPrototypeOf=function(e){return e.__proto__||(e.constructor?e.constructor.prototype:f)}),!Object.getOwnPropertyDescriptor){Object.getOwnPropertyDescriptor=function(e,t){if("object"!=typeof e&&"function"!=typeof e||null===e)throw new TypeError("Object.getOwnPropertyDescriptor called on a non-object: "+e)
if(d(e,t)){var n
if(n={enumerable:!0,configurable:!0},c){var r=e.__proto__
e.__proto__=f
var i=s(e,t),o=a(e,t)
if(e.__proto__=r,i||o)return i&&(n.get=i),o&&(n.set=o),n}return n.value=e[t],n}}}(Object.getOwnPropertyNames||(Object.getOwnPropertyNames=function(e){return Object.keys(e)}),Object.create)||(v=null===Object.prototype.__proto__?function(){return{__proto__:null}}:function(){var e={}
for(var t in e)e[t]=null
return e.constructor=e.hasOwnProperty=e.propertyIsEnumerable=e.isPrototypeOf=e.toLocaleString=e.toString=e.valueOf=e.__proto__=null,e},Object.create=function(e,t){var n
if(null===e)n=v()
else{if("object"!=typeof e)throw new TypeError("typeof prototype["+typeof e+"] != 'object'")
var r=function(){}
r.prototype=e,(n=new r).__proto__=e}return void 0!==t&&Object.defineProperties(n,t),n})
function y(e){try{return Object.defineProperty(e,"sentinel",{}),"sentinel"in e}catch(t){}}if(Object.defineProperty){var x=y({}),E="undefined"==typeof document||y(document.createElement("div"))
if(!x||!E)var w=Object.defineProperty}if(!Object.defineProperty||w){Object.defineProperty=function(e,t,n){if("object"!=typeof e&&"function"!=typeof e||null===e)throw new TypeError("Object.defineProperty called on non-object: "+e)
if("object"!=typeof n&&"function"!=typeof n||null===n)throw new TypeError("Property description must be an object: "+n)
if(w)try{return w.call(Object,e,t,n)}catch(u){}if(d(n,"value"))if(c&&(s(e,t)||a(e,t))){var r=e.__proto__
e.__proto__=f,delete e[t],e[t]=n.value,e.__proto__=r}else e[t]=n.value
else{if(!c)throw new TypeError("getters & setters can not be defined on this javascript engine")
d(n,"get")&&i(e,t,n.get),d(n,"set")&&o(e,t,n.set)}return e}}Object.defineProperties||(Object.defineProperties=function(e,t){for(var n in t)d(t,n)&&Object.defineProperty(e,n,t[n])
return e}),Object.seal||(Object.seal=function(e){return e}),Object.freeze||(Object.freeze=function(e){return e})
try{Object.freeze((function(){}))}catch(G){Object.freeze=(g=Object.freeze,function(e){return"function"==typeof e?e:g(e)})}if(Object.preventExtensions||(Object.preventExtensions=function(e){return e}),Object.isSealed||(Object.isSealed=function(e){return!1}),Object.isFrozen||(Object.isFrozen=function(e){return!1}),Object.isExtensible||(Object.isExtensible=function(e){if(Object(e)===e)throw new TypeError
for(var t="";d(e,t);)t+="?"
e[t]=!0
var n=d(e,t)
return delete e[t],n}),!Object.keys){var S=!0,W=["toString","toLocaleString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","constructor"],j=W.length
for(var L in{toString:null})S=!1
Object.keys=function(e){if("object"!=typeof e&&"function"!=typeof e||null===e)throw new TypeError("Object.keys called on a non-object")
var t=[]
for(var n in e)d(e,n)&&t.push(n)
if(S)for(var r=0,i=j;r<i;r++){var o=W[r]
d(e,o)&&t.push(o)}return t}}Date.now||(Date.now=function(){return(new Date).getTime()})
var _="\t\n\v\f\r                　\u2028\u2029\ufeff"
if(!String.prototype.trim){_="["+_+"]"
var A=new RegExp("^"+_+_+"*"),M=new RegExp(_+_+"*$")
String.prototype.trim=function(){return String(this).replace(A,"").replace(M,"")}}function O(e){return(e=+e)!=e?e=0:0!==e&&e!==1/0&&e!==-1/0&&(e=(e>0||-1)*Math.floor(Math.abs(e))),e}var T=function(e){if(null==e)throw new TypeError("can't convert "+e+" to object")
return Object(e)}}))

//# sourceMappingURL=worker-javascript-210b09fb73dde8601c7691c968c36536.map