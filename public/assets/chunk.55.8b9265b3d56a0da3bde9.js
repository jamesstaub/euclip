/*! For license information please see chunk.55.8b9265b3d56a0da3bde9.js.LICENSE.txt */
(globalThis.webpackChunk_ember_auto_import_=globalThis.webpackChunk_ember_auto_import_||[]).push([[55],{402:(t,e,i)=>{"use strict"
function n(t,e,i){return e in t?Object.defineProperty(t,e,{value:i,enumerable:!0,configurable:!0,writable:!0}):t[e]=i,t}function s(t,e,i,n){i&&Object.defineProperty(t,e,{enumerable:i.enumerable,configurable:i.configurable,writable:i.writable,value:i.initializer?i.initializer.call(n):void 0})}function r(t,e,i,n,s){var r={}
return Object.keys(n).forEach((function(t){r[t]=n[t]})),r.enumerable=!!r.enumerable,r.configurable=!!r.configurable,("value"in r||r.initializer)&&(r.writable=!0),r=i.slice().reverse().reduce((function(i,n){return n(t,e,i)||i}),r),s&&void 0!==r.initializer&&(r.value=r.initializer?r.initializer.call(s):void 0,r.initializer=void 0),void 0===r.initializer&&(Object.defineProperty(t,e,r),r=null),r}i.d(e,{_:()=>n,a:()=>r,b:()=>s})},154:(t,e,i)=>{"use strict"
i.d(e,{Bq:()=>s,sd:()=>r,zA:()=>n})
const n={A:"a",B:"b",C:"c",D:"d",E:"e",F:"f",G:"g",H:"h",I:"i",J:"j",K:"k",L:"l",M:"m",N:"n",O:"o",P:"p",Q:"q",R:"r",S:"s",T:"t",U:"u",V:"v",W:"w",X:"x",Y:"y",Z:"z","!":"1","@":"2","#":"3",$:"4","%":"5","^":"6","&":"7","*":"8","(":"9",")":"0",_:"-","+":"=","<":",",">":".","?":"/",":":";",'"':"'","~":"`","{":"[","}":"]","|":"\\"},s={"å":"a",b:"b","ç":"c","∂":"d","ƒ":"f","©":"g","˙":"h","∆":"j","˚":"k","¬":"l","µ":"m","ø":"o","π":"p","œ":"q","®":"r","ß":"s","†":"t","√":"v","∑":"w","≈":"x","¥":"y","Ω":"z","¡":"1","™":"2","£":"3","¢":"4","∞":"5","§":"6","¶":"7","•":"8","ª":"9","º":"0","–":"-","≠":"=","≤":",","≥":".","÷":"/","…":";","æ":"'","“":"[","‘":"]","«":"\\"},r={"Å":"a","ı":"b","Î":"d","Ï":"f","˝":"g","Ó":"h","ˆ":"i","Ô":"j","":"k","Ò":"l","Â":"m","˜":"n","Ø":"o","Œ":"q","‰":"r","Í":"s","ˇ":"t","¨":"u","◊":"v","„":"w","˛":"x","Á":"y","¸":"z","⁄":"1","€":"2","‹":"3","›":"4","ﬁ":"5","ﬂ":"6","‡":"7","°":"8","·":"9","‚":"0","—":"-","±":"=","¯":",","˘":".","¿":"/","Ú":";","Æ":"'","`":"`","”":"[","’":"]","»":"\\"}},966:(t,e,i)=>{"use strict"
i.r(e),i.d(e,{default:()=>a})
var n=i(797),s=i(353),r=i(558),o=i(825),a=(i(811),i(596),i(154),i(893),i(866),(0,n.helper)((function(t){let[e,i]=t
return function(t){(0,s.assert)("ember-keyboard: You must pass a function as the second argument to the `if-key` helper","function"==typeof i),(0,s.assert)("ember-keyboard: The `if-key` helper expects to be invoked with a KeyboardEvent",t instanceof KeyboardEvent),(0,r.Z)((0,o.Z)(t.type,e),t)&&i(t)}})))},686:(t,e,i)=>{"use strict"
i.r(e),i.d(e,{default:()=>u})
var n,s,r=i(402),o=i(797),a=i.n(o),l=i(353),h=i(574),c=i(825)
let u=(n=class extends(a()){constructor(){super(...arguments),(0,r.b)(this,"keyboard",s,this),(0,r._)(this,"keyCombo",void 0),(0,r._)(this,"callback",void 0),(0,r._)(this,"keyboardActivated",!0),(0,r._)(this,"keyboardPriority",0),(0,r._)(this,"eventName","keydown"),(0,r._)(this,"keyboardHandlers",void 0)}compute(t,e){let[i,n]=t,{event:s="keydown",activated:r=!0,priority:o=0}=e;(0,l.assert)("ember-keyboard: You must pass a function as the second argument to the `on-key` helper","function"==typeof n),this.keyCombo=i,this.callback=n,this.eventName=s,this.keyboardActivated=r,this.keyboardPriority=o,this.keyboardHandlers={},this.keyboardHandlers[(0,c.Z)(s,i)]=n,this.keyboard.register(this)}willDestroy(){this.keyboard.unregister(this),super.willDestroy(...arguments)}},s=(0,r.a)(n.prototype,"keyboard",[h.inject],{configurable:!0,enumerable:!0,writable:!0,initializer:null}),n)},202:(t,e,i)=>{"use strict"
i.r(e),i.d(e,{default:()=>m})
var n=i(402),s=i(831),r=i.n(s),o=i(574),a=i(219),l=i(341),h=i(825),c=i(558)
i(811),i(596),i(353),i(154),i(893),i(866)
const u=["input","select","textarea"]
let f
var d,p
d=class extends(r()){constructor(t,e){super(t,e),(0,n.b)(this,"keyboard",p,this),(0,n._)(this,"element",void 0),(0,n._)(this,"keyboardPriority",0),(0,n._)(this,"activatedParamValue",!0),(0,n._)(this,"eventName","keydown"),(0,n._)(this,"onlyWhenFocused",!0),(0,n._)(this,"listenerName",void 0),(0,n._)(this,"removeEventListeners",(()=>{this.onlyWhenFocused&&(this.element.removeEventListener("click",this.onFocus,!0),this.element.removeEventListener("focus",this.onFocus,!0),this.element.removeEventListener("focusout",this.onFocusOut,!0))})),this.keyboard.register(this),(0,l.registerDestructor)(this,(()=>{this.removeEventListeners(),this.keyboard.unregister(this)}))}modify(t,e,i){this.element=t,this.removeEventListeners(),this.setupProperties(e,i),this.onlyWhenFocused&&this.addEventListeners()}setupProperties(t,e){let[i,n]=t,{activated:s,event:r,priority:o,onlyWhenFocused:a}=e
this.keyCombo=i,this.callback=n,this.eventName=r||"keydown",this.activatedParamValue="activated"in e?!!s:void 0,this.keyboardPriority=o?parseInt(o,10):0,this.listenerName=(0,h.Z)(this.eventName,this.keyCombo),this.onlyWhenFocused=void 0!==a?a:u.includes(this.element.tagName.toLowerCase())}addEventListeners(){this.element.addEventListener("click",this.onFocus,!0),this.element.addEventListener("focus",this.onFocus,!0),this.element.addEventListener("focusout",this.onFocusOut,!0)}onFocus(){this.isFocused=!0}onFocusOut(){this.isFocused=!1}get keyboardActivated(){return!1!==this.activatedParamValue&&(!this.onlyWhenFocused||this.isFocused)}get keyboardFirstResponder(){return!!this.onlyWhenFocused&&this.isFocused}canHandleKeyboardEvent(t){return(0,c.Z)(this.listenerName,t)}handleKeyboardEvent(t,e){(0,c.Z)(this.listenerName,t)&&(this.callback?this.callback(t,e):this.element.click())}},p=(0,n.a)(d.prototype,"keyboard",[o.inject],{configurable:!0,enumerable:!0,writable:!0,initializer:null}),(0,n.a)(d.prototype,"onFocus",[a.action],Object.getOwnPropertyDescriptor(d.prototype,"onFocus"),d.prototype),(0,n.a)(d.prototype,"onFocusOut",[a.action],Object.getOwnPropertyDescriptor(d.prototype,"onFocusOut"),d.prototype),f=d
var m=f},340:(t,e,i)=>{"use strict"
i.r(e),i.d(e,{default:()=>p})
var n,s=i(402),r=i(574),o=i.n(r),a=i(292),l=i(219),h=i(773),c=i(825),u=i(558)
function f(t,e){let i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:null
if(t.handleKeyboardEvent){if(t.canHandleKeyboardEvent&&!t.canHandleKeyboardEvent(e))return
t.handleKeyboardEvent(e,i)}else{if(!t.keyboardHandlers)throw new Error("A responder registered with the ember-keyboard service must implement either `keyboardHandlers` (property returning a dictionary of listenerNames to handler functions), or `handleKeyboardEvent(event)`)")
Object.keys(t.keyboardHandlers).forEach((n=>{(0,u.Z)(n,e)&&(i?t.keyboardHandlers[n](e,i):t.keyboardHandlers[n](e))}))}}function d(t,e,i,n){return function(t,e){let i=t-e
return(i>0)-(i<0)}(n?n((0,l.get)(t,i)):(0,l.get)(t,i),n?n((0,l.get)(e,i)):(0,l.get)(e,i))}i(811),i(596),i(353),i(154),i(893),i(866)
let p=(n=class extends(o()){get activeResponders(){let{registeredResponders:t}=this
return Array.from(t).filter((t=>t.keyboardActivated))}get sortedResponders(){return this.activeResponders.sort(((t,e)=>function(t,e,i){return d(e,t,i,arguments.length>3&&void 0!==arguments[3]?arguments[3]:null)}(t,e,"keyboardPriority")))}get firstResponders(){return this.sortedResponders.filter((t=>t.keyboardFirstResponder))}get normalResponders(){return this.sortedResponders.filter((t=>!t.keyboardFirstResponder))}constructor(){if(super(...arguments),(0,s._)(this,"registeredResponders",new Set),"undefined"!=typeof FastBoot)return
let t=((0,a.getOwner)(this).resolveRegistration("config:environment")||{}).emberKeyboard||{}
t.disableOnInputFields&&(this._disableOnInput=!0),this._listeners=t.listeners||["keyUp","keyDown","keyPress"],this._listeners=this._listeners.map((t=>t.toLowerCase())),this._listeners.forEach((t=>{document.addEventListener(t,this._respond)}))}willDestroy(){super.willDestroy(...arguments),"undefined"==typeof FastBoot&&this._listeners.forEach((t=>{document.removeEventListener(t,this._respond)}))}_respond(t){if(this._disableOnInput&&t.target){const e=t.composedPath()[0]??t.target,i=e.tagName
if(e.getAttribute&&null!=e.getAttribute("contenteditable")||"TEXTAREA"===i||"INPUT"===i)return}(0,h.run)((()=>{let{firstResponders:e,normalResponders:i}=this
!function(t,e){let{firstResponders:i,normalResponders:n}=e,s=!1,r=!1
const o={stopImmediatePropagation(){s=!0},stopPropagation(){r=!0}}
for(const l of i)if(f(l,t,o),s)break
if(r)return
s=!1
let a=Number.POSITIVE_INFINITY
for(const l of n){const e=Number(l.keyboardPriority)
if(!s||e!==a){if(e<a){if(r)return
s=!1,a=e}f(l,t,o)}}}(t,{firstResponders:e,normalResponders:i})}))}register(t){this.registeredResponders.add(t)}unregister(t){this.registeredResponders.delete(t)}keyDown(){return function(t){return(0,c.Z)("keydown",t)}(...arguments)}keyPress(){return function(t){return(0,c.Z)("keypress",t)}(...arguments)}keyUp(){return function(t){return(0,c.Z)("keyup",t)}(...arguments)}},(0,s.a)(n.prototype,"_respond",[l.action],Object.getOwnPropertyDescriptor(n.prototype,"_respond"),n.prototype),n)},893:(t,e,i)=>{"use strict"
i.d(e,{Z:()=>s})
var n=i(866)
function s(t){if(!(0,n.isNone)(t))switch(t){case 0:return"left"
case 1:return"middle"
case 2:return"right"}}},558:(t,e,i)=>{"use strict"
i.d(e,{Z:()=>l})
var n=i(811),s=i(596),r=i(154),o=i(893)
i(353),i(866)
const a="_all"
function l(t,e){let i,r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:(0,s.Z)()
if(t instanceof n.Z)i=t
else{if("string"!=typeof t)throw new Error("Expected a `string` or `KeyCombo` as `keyComboOrKeyComboString` argument to `isKey`")
i=n.Z.parse(t,r)}return i.type===e.type&&(!!h(i)||!(!c(i,e)||!u(i,e)&&!f(i,e))||d(i,e,r))}function h(t){return t.keyOrCode===a&&!1===t.altKey&&!1===t.ctrlKey&&!1===t.metaKey&&!1===t.shiftKey}function c(t,e){return t.type===e.type&&t.altKey===e.altKey&&t.ctrlKey===e.ctrlKey&&t.metaKey===e.metaKey&&t.shiftKey===e.shiftKey}function u(t,e){return e instanceof KeyboardEvent&&(t.keyOrCode===a||t.keyOrCode===e.code||t.keyOrCode===e.key)}function f(t,e){return e instanceof MouseEvent&&(t.keyOrCode===a||t.keyOrCode===(0,o.Z)(e.button))}function d(t,e,i){return m([],t)&&m(["shift"],e)?e.key===t.keyOrCode:m(["shift"],t)&&m(["shift"],e)?(n=e.key,(r.zA[n]||n)===t.keyOrCode):"Macintosh"===i&&m(["alt"],t)&&m(["alt"],e)?function(t){return r.Bq[t]||t}(e.key)===t.keyOrCode:!("Macintosh"!==i||!m(["shift","alt"],t)||!m(["shift","alt"],e))&&function(t){return r.sd[t]||t}(e.key)===t.keyOrCode
var n}const p=["alt","ctrl","meta","shift","cmd"].filter((t=>"cmd"!=t))
function m(t,e){for(let i of p){if(t.includes(i)&&!e[`${i}Key`])return!1
if(!t.includes(i)&&e[`${i}Key`])return!1}return!0}},811:(t,e,i)=>{"use strict"
i.d(e,{Z:()=>c})
var n=i(402),s=i(596)
i(353)
const r=/^alt$/i,o=/^shift$/i,a=/^ctrl$/i,l=/^meta$/i,h=/^cmd$/i
class c{constructor(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:(0,s.Z)();(0,n._)(this,"type",void 0),(0,n._)(this,"altKey",!1),(0,n._)(this,"ctrlKey",!1),(0,n._)(this,"shiftKey",!1),(0,n._)(this,"metaKey",!1),(0,n._)(this,"keyOrCode",void 0),(0,n._)(this,"platform",void 0),this.platform=t}static parse(t){let e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:(0,s.Z)(),i=new c(e),[n,u]=t.split(":")
return i.type=n,"+"===u?(i.keyOrCode=u,i):(u.split("+").forEach((t=>{r.test(t)?i.altKey=!0:a.test(t)?i.ctrlKey=!0:l.test(t)?i.metaKey=!0:o.test(t)?i.shiftKey=!0:h.test(t)?e.indexOf("Mac")>-1?i.metaKey=!0:i.ctrlKey=!0:i.keyOrCode=t})),i)}createMatchingKeyboardEvent(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{}
return new KeyboardEvent(this.type,Object.assign({key:this.keyOrCode,code:this.keyOrCode,altKey:this.altKey,ctrlKey:this.ctrlKey,metaKey:this.metaKey,shiftKey:this.shiftKey},t))}}},825:(t,e,i)=>{"use strict"
function n(t){if("undefined"==typeof FastBoot)return void 0===t&&(t=navigator.platform),t.indexOf("Mac")>-1?"meta":"ctrl"}function s(t){return t.sort().join("+")}function r(t){let e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[],i=e
"string"==typeof e&&(i=e.split("+")),i.indexOf("cmd")>-1&&(i[i.indexOf("cmd")]=n())
let r=s(i||[])
return""===r&&(r="_all"),`${t}:${r}`}i.d(e,{Z:()=>r})},596:(t,e,i)=>{"use strict"
i.d(e,{Z:()=>r})
var n=i(353)
let s
function r(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:navigator.userAgent
if((0,n.runInDebug)((()=>{s=null})),!s){let e="Unknown OS";-1!=t.indexOf("Win")&&(e="Windows"),-1!=t.indexOf("Mac")&&(e="Macintosh"),-1!=t.indexOf("Linux")&&(e="Linux"),-1!=t.indexOf("Android")&&(e="Android"),-1!=t.indexOf("like Mac")&&(e="iOS"),s=e}return s}},57:function(t){var e
e=function(){return function(t){var e={}
function i(n){if(e[n])return e[n].exports
var s=e[n]={exports:{},id:n,loaded:!1}
return t[n].call(s.exports,s,s.exports,i),s.loaded=!0,s.exports}return i.m=t,i.c=e,i.p="",i(0)}([function(t,e,i){"use strict"
var n,s=(n=i(1))&&n.__esModule?n.default:n
t.exports=s},function(t,e,i){"use strict"
var n=function(t){return t&&t.__esModule?t.default:t},s=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}()
e.colors=function(){return v.colors},e.context=function(){return v.context},e.clock=function(){return v.clock},Object.defineProperty(e,"__esModule",{value:!0})
var r,o=n(i(2)),a=n(i(5)),l=n(i(38)),h=n(i(40)),c=(r=i(39))&&r.__esModule?r:{default:r},u=i(28),f=i(41),d=i(27),p=i(26),m=i(25),g=n(i(42)),O=n(i(29)),v=new(function(){function t(e){for(var i in function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),o)this[i]=o[i]
for(var i in a)this[i]=a[i]
var n={Rack:l},s={Counter:u,Radio:f,Drunk:d,Sequence:p,Matrix:m}
for(var i in s)this[i]=s[i]
for(var i in n)this[i]=n[i]
var r=window.AudioContext||window.webkitAudioContext
for(var i in this._context=e||new r,this.tune=new h,this.note=this.tune.note.bind(this.tune),this.clock=new g(this._context),this.clock.start(),this.Interval=O,this.colors={accent:"#2bb",fill:"#eee",light:"#fff",dark:"#333",mediumLight:"#ccc",mediumDark:"#666"},this.transform=c,this.add=c.add,this.Add={},o)this.Add[i]=c.add.bind(this,i)
var v=document.createElement("style")
v.type="text/css",v.innerHTML="[nexus-ui]{height:5000px;width:5000px}"
var y=document.head
y.insertBefore(v,y.firstElementChild)}return s(t,{context:{get:function(){return this._context},set:function(t){this.clock.stop(),this._context=t,this.clock=new g(this.context),this.clock.start()}}}),t}())
e.default=v},function(t,e,i){"use strict"
t.exports={Position:i(3),Slider:i(14),Toggle:i(15),Button:i(16),TextButton:i(18),RadioButton:i(19),Number:i(20),Select:i(21),Dial:i(22),Piano:i(23),Sequencer:i(24),Pan2D:i(30),Tilt:i(31),Multislider:i(32),Pan:i(33),Envelope:i(34),Spectrogram:i(35),Meter:i(36),Oscilloscope:i(37)}},function(t,e,i){"use strict"
var n,s=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),r=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},o=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},a=i(4),l=i(6),h=i(11),c=(n=i(12))&&n.__esModule?n:{default:n},u=function(t){function e(){o(this,e)
var t=["value"],i={size:[200,200],mode:"absolute",minX:0,maxX:1,stepX:0,x:.5,minY:0,maxY:1,stepY:0,y:.5}
r(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this._x=new h(this.settings.minX,this.settings.maxX,this.settings.stepX,this.settings.x),this._y=new h(this.settings.minY,this.settings.maxY,this.settings.stepY,this.settings.y),this.position={x:new c.Handle(this.settings.mode,"horizontal",[0,this.width],[this.height,0]),y:new c.Handle(this.settings.mode,"vertical",[0,this.width],[this.height,0])},this.position.x.value=this._x.normalized,this.position.y.value=this._y.normalized,this.init(),this.render()}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)}(e,t),s(e,{buildInterface:{value:function(){this.knob=a.create("circle"),this.element.appendChild(this.knob)}},sizeInterface:{value:function(){this.position.x.resize([0,this.width],[this.height,0]),this.position.y.resize([0,this.width],[this.height,0]),this._minDimension=Math.min(this.width,this.height),this.knobRadius={off:5*~~(this._minDimension/100)+5},this.knobRadius.on=2*this.knobRadius.off,this.knob.setAttribute("cx",this.width/2),this.knob.setAttribute("cy",this.height/2),this.knob.setAttribute("r",this.knobRadius.off)}},colorInterface:{value:function(){this.element.style.backgroundColor=this.colors.fill,this.knob.setAttribute("fill",this.colors.accent)}},render:{value:function(){this.clicked?this.knob.setAttribute("r",this.knobRadius.on):this.knob.setAttribute("r",this.knobRadius.off),this.knobCoordinates={x:this._x.normalized*this.width,y:this.height-this._y.normalized*this.height},this.knob.setAttribute("cx",this.knobCoordinates.x),this.knob.setAttribute("cy",this.knobCoordinates.y)}},click:{value:function(){this.position.x.anchor=this.mouse,this.position.y.anchor=this.mouse,this.move()}},move:{value:function(){this.clicked&&(this.position.x.update(this.mouse),this.position.y.update(this.mouse),this._x.updateNormal(this.position.x.value),this._y.updateNormal(this.position.y.value),this.emit("change",{x:this._x.value,y:this._y.value}),this.render())}},release:{value:function(){this.render()}},x:{get:function(){return this._x.value},set:function(t){this._x.update(t),this.emit("change",{x:this._x.value,y:this._y.value}),this.render()}},y:{get:function(){return this._y.value},set:function(t){this._y.update(t),this.emit("change",{x:this._x.value,y:this._y.value}),this.render()}},normalized:{get:function(){return{x:this._x.normalized,y:this._y.normalized}}},minX:{get:function(){return this._x.min},set:function(t){this._x.min=t,this.render()}},minY:{get:function(){return this._y.min},set:function(t){this._y.min=t,this.render()}},maxX:{get:function(){return this._x.max},set:function(t){this._x.max=t,this.render()}},maxY:{get:function(){return this._y.max},set:function(t){this._y.max=t,this.render()}},stepX:{get:function(){return this._x.step},set:function(t){this._x.step=t,this.render()}},stepY:{get:function(){return this._y.step},set:function(t){this._y.step=t,this.render()}},mode:{get:function(){return this.position.x.mode},set:function(t){this.position.x.mode=t,this.position.y.mode=t}}}),e}(l)
t.exports=u},function(t,e,i){"use strict"
var n=i(5)
t.exports={create:function(t){return document.createElementNS("http://www.w3.org/2000/svg",t)},arc:function(t,e,i,s,r){var o=n.toCartesian(i,r),a=n.toCartesian(i,s),l=r-s<=180?"0":"1"
return["M",o.x+t,o.y+e,"A",i,i,0,l,0,a.x+t,a.y+e].join(" ")},radialGradient:function(t,e){var i="gradient"+n.ri(1e11),s=[],r=document.createElementNS("http://www.w3.org/2000/svg","radialGradient")
r.setAttribute("id",i),r.setAttribute("cx","50%"),r.setAttribute("cy","50%"),r.setAttribute("r","50%"),t.appendChild(r)
for(var o=0;o<e;o++){var a=document.createElementNS("http://www.w3.org/2000/svg","stop")
a.setAttribute("id","stop"+o),r.appendChild(a),s.push(a)}return{id:i,stops:s,element:r}}}},function(t,e){"use strict"
e.clip=function(t,e,i){return Math.min(Math.max(t,e),i)},e.normalize=function(t,e,i){return(t-e)/(i-e)},e.scale=function(t,e,i,n,s){return e===i?n:(t-e)*(s-n)/(i-e)+n},e.toPolar=function(t,e){var i=Math.sqrt(t*t+e*e),n=Math.atan2(e,t)
return n<0&&(n+=2*Math.PI),{radius:i,angle:n}},e.toCartesian=function(t,e){return{x:t*Math.cos(e),y:t*Math.sin(e)*-1}},e.prune=function(t,e){return parseFloat(t.toFixed(e))},e.invert=function(t){return e.scale(t,1,0,0,1)},e.mtof=function(t){return 440*Math.pow(2,(t-69)/12)},e.interp=function(t,e,i){return t*(i-e)+e},e.pick=function(){return arguments[~~(Math.random()*arguments.length)]},e.octave=function(t){return Math.pow(2,t)},e.ri=function(t,e){e||(e=t,t=0)
var i=Math.min(t,e),n=Math.max(t,e)
return Math.floor(Math.random()*(n-i)+i)},e.rf=function(t,e){e||(e=t,t=0)
var i=Math.min(t,e),n=Math.max(t,e)
return Math.random()*(n-i)+i},e.cycle=function(t,e,i){return++t>=i&&(t=e),t},e.average=function(t){for(var e=0,i=0;i<t.length;i++)e+=t[i]
return e/t.length},e.distance=function(t,e,i,n){var s=t-i,r=e-n
return Math.sqrt(s*s+r*r)},e.gainToDB=function(t){return 20*Math.log10(t)},e.coin=function(){var t=void 0===arguments[0]?.5:arguments[0]
return e.rf(0,1)<t?1:0}},function(t,e,i){"use strict"
var n=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),s=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},r=i(4),o=i(7),a=i(8),l=i(9),h=i(10),c=i(1).colors,u=function(t){function e(t,i,n){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,e),s(Object.getPrototypeOf(e.prototype),"constructor",this).call(this),this.type=this.constructor.name,this.settings=this.parseSettings(t,i,n),this.mouse={},this.wait=!1,this.colors={}
var r=c()
this.colors.accent=r.accent,this.colors.fill=r.fill,this.colors.light=r.light,this.colors.dark=r.dark,this.colors.mediumLight=r.mediumLight,this.colors.mediumDark=r.mediumDark}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)}(e,t),n(e,{parseSettings:{value:function(t,e,i){e.unshift("target"),i.defaultSize=i.size.splice(0,2),i.size=!1
var n={target:document.body,colors:{},snapWithParent:!0,event:function(){},component:!1}
for(var s in i)n[s]=i[s]
for(var r=0;r<t.length;r++){var l=t[r]
if(a.isObject(l))for(var s in l)n[s]=l[s]
else"function"==typeof l?n.event=l:e.length>=1&&(n[s=e.splice(0,1)[0]]=l)}return this.parent=o.parseElement(n.target),this.parent&&this.parent instanceof HTMLElement&&!n.component&&(this.parent.hasAttribute("nexus-ui")||this.parent.setAttribute("nexus-ui","")),n.size&&Array.isArray(n.size)&&n.snapWithParent?(this.width=n.size[0],this.height=n.size[1],this.parent.style.width=this.width+"px",this.parent.style.height=this.height+"px"):n.snapWithParent&&!n.component?(this.width=parseFloat(window.getComputedStyle(this.parent,null).getPropertyValue("width").replace("px","")),this.height=parseFloat(window.getComputedStyle(this.parent,null).getPropertyValue("height").replace("px","")),5e3==this.width&&(this.width=n.defaultSize[0],this.parent.style.width=this.parent.width=this.width+"px"),5e3==this.height&&(this.height=n.defaultSize[1],this.parent.style.height=this.parent.height=this.height+"px")):(n.size=n.defaultSize,this.width=n.size[0],this.height=n.size[1]),n.event?this.event=this.on("change",n.event):this.event=!1,n}},init:{value:function(){this.buildFrame(),this.buildInterface(),this.sizeInterface(),this.attachListeners(),this.colorInterface(),this.finalTouches()}},buildFrame:{value:function(){this.element=r.create("svg"),this.element.setAttribute("width",this.width),this.element.setAttribute("height",this.height),this.parent.appendChild(this.element)}},buildInterface:{value:function(){}},sizeInterface:{value:function(){}},colorInterface:{value:function(){}},attachListeners:{value:function(){var t=this
this.interactionTarget=this.interactionTarget||this.element,l.exists&&(this.interactionTarget.addEventListener("touchstart",(function(e){return t.preTouch(e)})),this.interactionTarget.addEventListener("touchmove",(function(e){return t.preTouchMove(e)})),this.interactionTarget.addEventListener("touchend",(function(e){return t.preTouchRelease(e)}))),this.boundPreMove=function(e){return t.preMove(e)},this.boundPreRelease=function(e){return t.preRelease(e)},this.interactionTarget.addEventListener("mousedown",(function(e){return t.preClick(e)}))}},finalTouches:{value:function(){this.element.style.cursor="pointer"}},preClick:{value:function(t){this.element instanceof HTMLElement&&(this.width=window.getComputedStyle(this.element,null).getPropertyValue("width").replace("px","")),this.offset=o.findPosition(this.element),this.mouse=o.locateMouse(t,this.offset),this.clicked=!0,this.click(),this.moveEvent=document.addEventListener("mousemove",this.boundPreMove),this.releaseEvent=document.addEventListener("mouseup",this.boundPreRelease),this.emit("click"),t.preventDefault(),t.stopPropagation()}},preMove:{value:function(t){var e=this
this.wait||(this.mouse=o.locateMouse(t,this.offset),this.move(),this.wait=!0,setTimeout((function(){e.wait=!1}),25)),t.preventDefault(),t.stopPropagation()}},preRelease:{value:function(t){this.mouse=o.locateMouse(t,this.offset),this.clicked=!1,this.release(),this.emit("release"),document.removeEventListener("mousemove",this.boundPreMove),document.removeEventListener("mouseup",this.boundPreRelease),t.preventDefault(),t.stopPropagation()}},click:{value:function(){}},move:{value:function(){}},release:{value:function(){}},preTouch:{value:function(t){this.element instanceof HTMLElement&&(this.width=window.getComputedStyle(this.element,null).getPropertyValue("width").replace("px","")),this.offset=o.findPosition(this.element),this.mouse=o.locateTouch(t,this.offset),this.clicked=!0,this.touch(t),this.emit("click"),t.preventDefault(),t.stopPropagation()}},preTouchMove:{value:function(t){this.clicked&&(this.mouse=o.locateTouch(t,this.offset),this.touchMove(),t.preventDefault(),t.stopPropagation())}},preTouchRelease:{value:function(t){this.mouse=o.locateTouch(t,this.offset),this.clicked=!1,this.touchRelease(),this.emit("release"),t.preventDefault(),t.stopPropagation()}},touch:{value:function(){this.click()}},touchMove:{value:function(){this.move()}},touchRelease:{value:function(){this.release()}},resize:{value:function(t,e){this.width=t,this.height=e,this.parent.style.width=this.width+"px",this.parent.style.height=this.height+"px",this.element.setAttribute("width",this.width),this.element.setAttribute("height",this.height),this.sizeInterface()}},empty:{value:function(){for(;this.element.lastChild;)this.element.removeChild(this.element.lastChild)}},destroy:{value:function(){this.empty(),this.parent.removeChild(this.element),this.removeAllListeners(),this.instrument&&delete this.instrument[this.id],this.customDestroy()}},customDestroy:{value:function(){}},colorize:{value:function(t,e){this.colors[t]=e,this.colorInterface()}}}),e}(h)
t.exports=u},function(t,e){"use strict"
e.findPosition=function(t){var e=t.getBoundingClientRect()
return{top:e.top+window.scrollY,left:e.left+window.scrollX}},e.parseElement=function(t){return"string"==typeof t&&(t=document.getElementById(t.replace("#",""))),t instanceof HTMLElement||t instanceof SVGElement?t:"No valid parent argument"},e.locateMouse=function(t,e){return{x:t.pageX-e.left,y:t.pageY-e.top}},e.locateTouch=function(t,e){return{x:!!t.targetTouches.length&&t.targetTouches[0].pageX-e.left,y:!!t.targetTouches.length&&t.targetTouches[0].pageY-e.top}},e.SmartCanvas=function(t){var e=this
this.element=document.createElement("canvas"),this.context=this.element.getContext("2d"),t.appendChild(this.element),this.resize=function(t,i){e.element.width=2*t,e.element.height=2*i,e.element.style.width=t+"px",e.element.style.height=i+"px"}}},function(t,e){"use strict"
e.isObject=function(t){return"object"==typeof t&&!Array.isArray(t)&&null!==t&&t instanceof SVGElement==0&&t instanceof HTMLElement==0},e.setInputFilter=function(t,e){["input","keydown","keyup","mousedown","mouseup","select","contextmenu","drop"].forEach((function(i){t.addEventListener(i,(function(){e(this.value)?(this.oldValue=this.value,this.oldSelectionStart=this.selectionStart,this.oldSelectionEnd=this.selectionEnd):this.hasOwnProperty("oldValue")?(this.value=this.oldValue,this.setSelectionRange(this.oldSelectionStart,this.oldSelectionEnd)):this.value=""}))}))}},function(t,e){"use strict"
e.exists="ontouchstart"in document.documentElement},function(t,e){function i(){this._events=this._events||{},this._maxListeners=this._maxListeners||void 0}function n(t){return"function"==typeof t}function s(t){return"object"==typeof t&&null!==t}function r(t){return void 0===t}t.exports=i,i.EventEmitter=i,i.prototype._events=void 0,i.prototype._maxListeners=void 0,i.defaultMaxListeners=10,i.prototype.setMaxListeners=function(t){if("number"!=typeof t||t<0||isNaN(t))throw TypeError("n must be a positive number")
return this._maxListeners=t,this},i.prototype.emit=function(t){var e,i,o,a,l,h
if(this._events||(this._events={}),"error"===t&&(!this._events.error||s(this._events.error)&&!this._events.error.length)){if((e=arguments[1])instanceof Error)throw e
var c=new Error('Uncaught, unspecified "error" event. ('+e+")")
throw c.context=e,c}if(r(i=this._events[t]))return!1
if(n(i))switch(arguments.length){case 1:i.call(this)
break
case 2:i.call(this,arguments[1])
break
case 3:i.call(this,arguments[1],arguments[2])
break
default:a=Array.prototype.slice.call(arguments,1),i.apply(this,a)}else if(s(i))for(a=Array.prototype.slice.call(arguments,1),o=(h=i.slice()).length,l=0;l<o;l++)h[l].apply(this,a)
return!0},i.prototype.addListener=function(t,e){var o
if(!n(e))throw TypeError("listener must be a function")
return this._events||(this._events={}),this._events.newListener&&this.emit("newListener",t,n(e.listener)?e.listener:e),this._events[t]?s(this._events[t])?this._events[t].push(e):this._events[t]=[this._events[t],e]:this._events[t]=e,s(this._events[t])&&!this._events[t].warned&&(o=r(this._maxListeners)?i.defaultMaxListeners:this._maxListeners)&&o>0&&this._events[t].length>o&&(this._events[t].warned=!0,console.error("(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.",this._events[t].length),"function"==typeof console.trace&&console.trace()),this},i.prototype.on=i.prototype.addListener,i.prototype.once=function(t,e){if(!n(e))throw TypeError("listener must be a function")
var i=!1
function s(){this.removeListener(t,s),i||(i=!0,e.apply(this,arguments))}return s.listener=e,this.on(t,s),this},i.prototype.removeListener=function(t,e){var i,r,o,a
if(!n(e))throw TypeError("listener must be a function")
if(!this._events||!this._events[t])return this
if(o=(i=this._events[t]).length,r=-1,i===e||n(i.listener)&&i.listener===e)delete this._events[t],this._events.removeListener&&this.emit("removeListener",t,e)
else if(s(i)){for(a=o;a-- >0;)if(i[a]===e||i[a].listener&&i[a].listener===e){r=a
break}if(r<0)return this
1===i.length?(i.length=0,delete this._events[t]):i.splice(r,1),this._events.removeListener&&this.emit("removeListener",t,e)}return this},i.prototype.removeAllListeners=function(t){var e,i
if(!this._events)return this
if(!this._events.removeListener)return 0===arguments.length?this._events={}:this._events[t]&&delete this._events[t],this
if(0===arguments.length){for(e in this._events)"removeListener"!==e&&this.removeAllListeners(e)
return this.removeAllListeners("removeListener"),this._events={},this}if(n(i=this._events[t]))this.removeListener(t,i)
else if(i)for(;i.length;)this.removeListener(t,i[i.length-1])
return delete this._events[t],this},i.prototype.listeners=function(t){return this._events&&this._events[t]?n(this._events[t])?[this._events[t]]:this._events[t].slice():[]},i.prototype.listenerCount=function(t){if(this._events){var e=this._events[t]
if(n(e))return 1
if(e)return e.length}return 0},i.listenerCount=function(t,e){return t.listenerCount(e)}},function(t,e,i){"use strict"
var n=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),s=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},r=i(5),o=function(){function t(){var e=void 0===arguments[0]?0:arguments[0],i=void 0===arguments[1]?1:arguments[1],n=void 0===arguments[2]?0:arguments[2],r=void 0===arguments[3]?0:arguments[3]
s(this,t),this.min=e,this.max=i,this.step=n,this.value=r,this.changed=!1,this.oldValue=!1,this.update(this.value)}return n(t,{update:{value:function(t){return this.step?this.value=r.clip(Math.round((t-this.min)/this.step)*this.step+this.min,this.min,this.max):this.value=r.clip(t,this.min,this.max),this.oldValue!==this.value?(this.oldValue=this.value,this.changed=!0):this.changed=!1,this.value}},updateNormal:{value:function(t){return this.value=r.scale(t,0,1,this.min,this.max),this.update(this.value)}},normalized:{get:function(){return r.normalize(this.value,this.min,this.max)}}}),t}()
t.exports=o},function(t,e,i){"use strict"
var n=function(t){return t&&t.__esModule?t.default:t},s=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),r=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}
Object.defineProperty(e,"__esModule",{value:!0})
var o=n(i(5)),a=n(i(13))
e.Handle=function(){function t(){var e=void 0===arguments[0]?"absolute":arguments[0],i=void 0===arguments[1]?"vertical":arguments[1],n=void 0===arguments[2]?[0,100]:arguments[2],s=void 0===arguments[3]?[0,100]:arguments[3]
r(this,t),this.mode=e,this.direction=i,this.previous=0,this.value=0,this.sensitivity=1,this.resize(n,s)}return s(t,{resize:{value:function(t,e){this.boundary={min:{x:t[0],y:e[0]},max:{x:t[1],y:e[1]},center:{x:(t[1]-t[0])/2+t[0],y:(e[1]-e[0])/2+e[0]}}}},anchor:{set:function(t){this._anchor=this.convertPositionToValue(t)},get:function(){return this._anchor}},update:{value:function(t){if("relative"===this.mode){var e=this.convertPositionToValue(t)-this.anchor
Math.abs(e)>.5&&(e=0),this.anchor=t,this.value=this.value+e*this.sensitivity}else this.value=this.convertPositionToValue(t)
this.value=o.clip(this.value,0,1)}},convertPositionToValue:{value:function(t){switch(this.direction){case"radial":var e=o.toPolar(t.x-this.boundary.center.x,t.y-this.boundary.center.y)
return((e=e.angle/(2*Math.PI))-.25+1)%1
case"vertical":return o.scale(t.y,this.boundary.min.y,this.boundary.max.y,0,1)
case"horizontal":return o.scale(t.x,this.boundary.min.x,this.boundary.max.x,0,1)}}}}),t}(),e.Button=function(){function t(){var e=void 0===arguments[0]?"button":arguments[0]
r(this,t),this.mode=e,this.state=new a,this.paintbrush=!1}return s(t,{click:{value:function(){switch(this.mode){case"impulse":this.state.on(),this.timeout&&clearTimeout(this.timeout),this.timeout=setTimeout(this.state.off.bind(this),30),this.emit("change",this.state)
break
case"button":this.turnOn(),this.emit("change",this.state)
break
case"aftertouch":this.position={x:o.clip(this.mouse.x/this.width,0,1),y:o.clip(1-this.mouse.y/this.height,0,1)},this.turnOn(),this.emit("change",{state:this.state,x:this.position.x,y:this.position.y})
break
case"toggle":this.flip(),this.emit("change",this.state)}}},move:{value:function(){"aftertouch"===this.mode&&(this.position={x:o.clip(this.mouse.x/this.width,0,1),y:o.clip(1-this.mouse.y/this.height,0,1)},this.emit("change",{state:this.state,x:this.position.x,y:this.position.y}),this.render())}},release:{value:function(){switch(this.mode){case"button":this.turnOff(),this.emit("change",this.state)
break
case"aftertouch":this.turnOff(),this.position={x:this.mouse.x/this.width,y:1-this.mouse.y/this.height},this.emit("change",{state:this.state,x:this.position.x,y:this.position.y})}}}}),t}()},function(t,e){"use strict"
var i=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),n=function(){function t(e){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this.state=e||!1}return i(t,{flip:{value:function(t){this.state=t||!1===t?t:!this.state}},on:{value:function(){this.state=!0}},off:{value:function(){this.state=!1}}}),t}()
t.exports=n},function(t,e,i){"use strict"
var n,s=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),r=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},o=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},a=i(4),l=i(6),h=i(11),c=(n=i(12))&&n.__esModule?n:{default:n},u=function(t){function e(){o(this,e)
var t=["min","max","value"],i={size:[120,20],mode:"relative",min:0,max:1,step:0,value:0}
r(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this.orientation="vertical",this._value=new h(this.settings.min,this.settings.max,this.settings.step,this.settings.value),this.position=new c.Handle(this.settings.mode,this.orientation,[0,this.width],[this.height,0]),this.position.value=this._value.normalized,this.init(),this.position.direction=this.orientation,this.emit("change",this.value)}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)}(e,t),s(e,{buildInterface:{value:function(){this.bar=a.create("rect"),this.fillbar=a.create("rect"),this.knob=a.create("circle"),this.element.appendChild(this.bar),this.element.appendChild(this.fillbar),this.element.appendChild(this.knob)}},sizeInterface:{value:function(){this.width<this.height?(this.orientation="vertical",this.position.direction="vertical"):(this.orientation="horizontal",this.position.direction="horizontal"),this.position&&this.position.resize([0,this.width],[this.height,0])
var t=void 0,e=void 0,i=void 0,n=void 0,s=void 0,r=void 0
this.knobData={level:0,r:0},"vertical"===this.orientation?(this.thickness=this.width/2,t=this.width/2,e=0,i=this.thickness,n=this.height,this.knobData.r=.8*this.thickness,this.knobData.level=n-this.knobData.r-this.normalized*(n-2*this.knobData.r),s="translate("+-1*this.thickness/2+",0)",r=i/2):(this.thickness=this.height/2,t=0,e=this.height/2,i=this.width,n=this.thickness,this.knobData.r=.8*this.thickness,this.knobData.level=this.normalized*(i-2*this.knobData.r)+this.knobData.r,s="translate(0,"+-1*this.thickness/2+")",r=n/2),this.bar.setAttribute("x",t),this.bar.setAttribute("y",e),this.bar.setAttribute("transform",s),this.bar.setAttribute("rx",r),this.bar.setAttribute("ry",r),this.bar.setAttribute("width",i),this.bar.setAttribute("height",n),"vertical"===this.orientation?(this.fillbar.setAttribute("x",t),this.fillbar.setAttribute("y",this.knobData.level),this.fillbar.setAttribute("width",i),this.fillbar.setAttribute("height",n-this.knobData.level)):(this.fillbar.setAttribute("x",0),this.fillbar.setAttribute("y",e),this.fillbar.setAttribute("width",this.knobData.level),this.fillbar.setAttribute("height",n)),this.fillbar.setAttribute("transform",s),this.fillbar.setAttribute("rx",r),this.fillbar.setAttribute("ry",r),"vertical"===this.orientation?(this.knob.setAttribute("cx",t),this.knob.setAttribute("cy",this.knobData.level)):(this.knob.setAttribute("cx",this.knobData.level),this.knob.setAttribute("cy",e)),this.knob.setAttribute("r",this.knobData.r)}},colorInterface:{value:function(){this.bar.setAttribute("fill",this.colors.fill),this.fillbar.setAttribute("fill",this.colors.accent),this.knob.setAttribute("fill",this.colors.accent)}},render:{value:function(){this.clicked||(this.knobData.r=.75*this.thickness),this.knob.setAttribute("r",this.knobData.r),"vertical"===this.orientation?(this.knobData.level=this.knobData.r+this._value.normalized*(this.height-2*this.knobData.r),this.knob.setAttribute("cy",this.height-this.knobData.level),this.fillbar.setAttribute("y",this.height-this.knobData.level),this.fillbar.setAttribute("height",this.knobData.level)):(this.knobData.level=this._value.normalized*(this.width-2*this.knobData.r)+this.knobData.r,this.knob.setAttribute("cx",this.knobData.level),this.fillbar.setAttribute("x",0),this.fillbar.setAttribute("width",this.knobData.level))}},click:{value:function(){this.knobData.r=.9*this.thickness,this.position.anchor=this.mouse,this.move()}},move:{value:function(){this.clicked&&(this.position.update(this.mouse),this._value.updateNormal(this.position.value),this.emit("change",this._value.value),this.render())}},release:{value:function(){this.render()}},normalized:{get:function(){return this._value.normalized}},value:{get:function(){return this._value.value},set:function(t){this._value.update(t),this.position.value=this._value.normalized,this.emit("change",this._value.value),this.render()}},min:{get:function(){return this._value.min},set:function(t){this._value.min=t}},max:{get:function(){return this._value.max},set:function(t){this._value.max=t}},step:{get:function(){return this._value.step},set:function(t){this._value.step=t}},mode:{get:function(){return this.position.mode},set:function(t){this.position.mode=t}}}),e}(l)
t.exports=u},function(t,e,i){"use strict"
var n=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),s=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},r=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},o=i(4),a=i(13),l=function(t){function e(){r(this,e)
var t=["value"],i={size:[40,20],target:!1,state:!1}
s(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this._state=new a(this.settings.state),this.init()}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)}(e,t),n(e,{buildInterface:{value:function(){this.bar=o.create("rect"),this.knob=o.create("circle"),this.element.appendChild(this.bar),this.element.appendChild(this.knob)}},sizeInterface:{value:function(){this.height<this.width/2?this.knobSize=this.height/2:this.knobSize=this.width/4,this.bar.setAttribute("x",this.width/2-1.5*this.knobSize),this.bar.setAttribute("y",this.height/2-this.knobSize/2),this.bar.setAttribute("rx",this.knobSize/2),this.bar.setAttribute("ry",this.knobSize/2),this.bar.setAttribute("width",3*this.knobSize),this.bar.setAttribute("height",this.knobSize),this.knob.setAttribute("cx",this.width/2-this.knobSize),this.knob.setAttribute("cy",this.height/2),this.knob.setAttribute("r",this.knobSize)}},colorInterface:{value:function(){this.knob.setAttribute("fill",this.colors.accent),this.render()}},render:{value:function(){this.state?(this.knob.setAttribute("cx",this.width/2+this.knobSize),this.bar.setAttribute("fill",this.colors.accent)):(this.knob.setAttribute("cx",this.width/2-this.knobSize),this.bar.setAttribute("fill",this.colors.fill))}},click:{value:function(){this.flip(),this.render(),this.emit("change",this.state)}},state:{get:function(){return this._state.state},set:function(t){this._state.flip(t),this.emit("change",this.state),this.render()}},flip:{value:function(){this._state.flip(),this.render()}}}),e}(i(6))
t.exports=l},function(t,e,i){"use strict"
var n=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),s=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},r=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},o=i(4),a=function(t){function e(){r(this,e)
var t=["mode"],i={size:[80,80],mode:"aftertouch",state:!1}
s(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this.mode=this.settings.mode,this.init(),this.render()}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)}(e,t),n(e,{buildInterface:{value:function(){this.pad=o.create("circle"),this.element.appendChild(this.pad),this.interactionTarget=this.pad,this.defs=o.create("defs"),this.element.appendChild(this.defs),this.gradient=o.radialGradient(this.defs,2),this.gradient.stops[0].setAttribute("offset","30%"),this.gradient.stops[1].setAttribute("offset","100%")}},sizeInterface:{value:function(){this.pad.setAttribute("cx",this.width/2),this.pad.setAttribute("cy",this.height/2),this.pad.setAttribute("r",Math.min(this.width,this.height)/2-this.width/40),this.pad.setAttribute("stroke-width",this.width/20)}},colorInterface:{value:function(){this.gradient.stops[0].setAttribute("stop-color",this.colors.accent),this.gradient.stops[1].setAttribute("stop-color",this.colors.fill),this.render()}},render:{value:function(){this.state?("aftertouch"===this.mode?(this.pad.setAttribute("stroke","url(#"+this.gradient.id+")"),this.gradient.element.setAttribute("cx",100*this.position.x+"%"),this.gradient.element.setAttribute("cy",100*(1-this.position.y)+"%")):this.pad.setAttribute("stroke",this.colors.accent),this.pad.setAttribute("fill",this.colors.accent)):(this.pad.setAttribute("fill",this.colors.fill),this.pad.setAttribute("stroke",this.colors.mediumLight))}}}),e}(i(17))
t.exports=a},function(t,e,i){"use strict"
var n=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),s=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},r=i(4),o=i(5),a=i(13),l=function(t){function e(t,i,n){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,e),s(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,t,i,n),this.mode=this.settings.mode||"button",this.position={x:0,y:0},this._state=new a(this.settings.state)}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)}(e,t),n(e,{buildInterface:{value:function(){this.pad=r.create("circle"),this.pad.setAttribute("fill","#d18"),this.pad.setAttribute("stroke","#d18"),this.pad.setAttribute("stroke-width",4),this.element.appendChild(this.pad),this.interactionTarget=this.pad,this.sizeInterface()}},sizeInterface:{value:function(){this.pad.setAttribute("cx",this.width/2),this.pad.setAttribute("cy",this.height/2),this.pad.setAttribute("r",Math.min(this.width,this.height)/2-2)}},render:{value:function(){this.state?(this.pad.setAttribute("fill",this.colors.accent),this.pad.setAttribute("stroke",this.colors.accent)):(this.pad.setAttribute("fill",this.colors.fill),this.pad.setAttribute("stroke",this.colors.mediumLight))}},down:{value:function(t){switch(this.mode){case"impulse":this.turnOn(),this.timeout&&clearTimeout(this.timeout),this.timeout=setTimeout(this.turnOff.bind(this),30)
break
case"button":this.turnOn()
break
case"aftertouch":this.position={x:o.clip(this.mouse.x/this.width,0,1),y:o.clip(1-this.mouse.y/this.height,0,1)},this.turnOn()
break
case"toggle":this.flip(t)}}},bend:{value:function(t){"aftertouch"===this.mode&&(this.mouse=t||this.mouse,this.position={x:o.clip(this.mouse.x/this.width,0,1),y:o.clip(1-this.mouse.y/this.height,0,1)},this.emit("change",{state:this.state,x:this.position.x,y:this.position.y}),this.render())}},up:{value:function(){switch(this.mode){case"button":this.turnOff()
break
case"aftertouch":this.turnOff(),this.position={x:o.clip(this.mouse.x/this.width,0,1),y:o.clip(1-this.mouse.y/this.height,0,1)}}}},click:{value:function(){this.down()}},move:{value:function(){this.bend()}},release:{value:function(){this.up()}},state:{get:function(){return this._state.state},set:function(t){this._state.flip(t),"aftertouch"===this.mode?this.emit("change",{state:this.state,x:this.position.x,y:this.position.y}):this.emit("change",this.state),this.render()}},flip:{value:function(t){this._state.flip(t),"aftertouch"===this.mode?this.emit("change",{state:this.state,x:this.position.x,y:this.position.y}):this.emit("change",this.state),this.render()}},turnOn:{value:function(t){this._state.on(),!1!==t&&("aftertouch"===this.mode?this.emit("change",{state:this.state,x:this.position.x,y:this.position.y}):this.emit("change",this.state)),this.render()}},turnOff:{value:function(t){this._state.off(),!1!==t&&("aftertouch"===this.mode?this.emit("change",{state:this.state,x:this.position.x,y:this.position.y}):this.emit("change",this.state)),this.render()}}}),e}(i(6))
t.exports=l},function(t,e,i){"use strict"
var n=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),s=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},r=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},o=function(t){function e(){r(this,e)
var t=["value"],i={size:[150,50],state:!1,text:"Play"}
s(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this._text=this.settings.text,this.settings.alternate&&(this.settings.alternateText=this.settings.alternate,console.warn("'alternate' initiator is deprecated. Use 'alternateText' instead.")),this._alternateText=this.settings.alternateText,this.mode=this.settings.alternateText?"toggle":"button",this.init(),this.render(),this.state=this.settings.state}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)}(e,t),n(e,{buildFrame:{value:function(){this.element=document.createElement("div"),this.parent.appendChild(this.element),this.textElement=document.createElement("div"),this.textElement.innerHTML=this._text,this.element.appendChild(this.textElement)}},buildInterface:{value:function(){}},colorInterface:{value:function(){this.element.style.color=this.colors.dark,this.render()}},sizeInterface:{value:function(){var t=this.height/3,e=this.width/(this._text.length+2)
if(t=Math.min(t,e),this.alternateText){var i=this.width/(this.alternateText.length+2)
t=Math.min(t,i)}var n="width: "+this.width+"px;"
n+="height: "+this.height+"px;",n+="padding: "+(this.height-t)/2+"px 0px;",n+="box-sizing: border-box;",n+="text-align: center;",n+="font-family: inherit;",n+="font-weight: 700;",n+="opacity: 1;",n+="font-size:"+t+"px;",this.textElement.style.cssText=n,this.render()}},render:{value:function(){this.state?(this.element.style.backgroundColor=this.colors.accent,this.textElement.style.color=this.colors.fill,this.alternateText?this.textElement.innerHTML=this._alternateText:this.textElement.innerHTML=this._text):(this.element.style.backgroundColor=this.colors.fill,this.textElement.style.color=this.colors.dark,this.textElement.innerHTML=this._text)}},alternateText:{get:function(){return this._alternateText},set:function(t){this.mode=t?"toggle":"button",this._alternateText=t,this.render()}},text:{get:function(){return this._text},set:function(t){this._text=t,this.sizeInterface(),this.render()}}}),e}(i(17))
t.exports=o},function(t,e,i){"use strict"
var n=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),s=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},r=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},o=i(6),a=i(16),l=function(t){function e(){r(this,e)
var t=["value"],i={size:[120,25],numberOfButtons:4,active:-1}
s(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this.buttons=[],this._numberOfButtons=this.settings.numberOfButtons,this.active=this.settings.active,this.init(),this.render()}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)}(e,t),n(e,{buildFrame:{value:function(){this.element=document.createElement("div"),this.parent.appendChild(this.element)}},buildInterface:{value:function(){for(var t=0;t<this._numberOfButtons;t++){var e=document.createElement("span"),i=new a(e,{mode:"toggle",component:!0},this.update.bind(this,t))
this.buttons.push(i),this.element.appendChild(e)}}},sizeInterface:{value:function(){var t
t=this.width>this.height?"horizontal":"vertical"
for(var e=this.width/("vertical"===t?1:this._numberOfButtons),i=this.height/("vertical"===t?this._numberOfButtons:1),n=0;n<this._numberOfButtons;n++)this.buttons[n].resize(e,i)}},colorInterface:{value:function(){for(var t=0;t<this._numberOfButtons;t++)this.buttons[t].colors=this.colors,this.buttons[t].render()}},update:{value:function(t){this.buttons[t].state?this.select(t):this.deselect()}},render:{value:function(){for(var t=0;t<this.buttons.length;t++)t===this.active?this.buttons[t].turnOn(!1):this.buttons[t].turnOff(!1)}},select:{value:function(t){t>=0&&t<this.buttons.length&&(this.active=t,this.emit("change",this.active),this.render())}},deselect:{value:function(){this.active=-1,this.emit("change",this.active),this.render()}},numberOfButtons:{get:function(){return this._numberOfButtons},set:function(t){this._numberOfButtons=t
for(var e=0;e<this.buttons.length;e++)this.buttons[e].destroy()
this.buttons=[],this.empty(),this.buildInterface()}}}),e}(o)
t.exports=l},function(t,e,i){"use strict"
var n=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),s=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},r=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},o=i(6),a=i(11),l=i(5),h=i(8),c=function(t){function e(){r(this,e)
var t=["value"],i={size:[60,30],value:0,min:0,max:2e4,step:1}
s(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this._value=new a(this.settings.min,this.settings.max,this.settings.step,this.settings.value),this.decimalPlaces=2,this.actual=0,this.max=this._value.max,this.min=this._value.min,this.step=this._value.step,this.init(),this.render()}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)}(e,t),n(e,{buildFrame:{value:function(){this.element=document.createElement("input"),this.element.type="text",this.element.addEventListener("blur",function(){this.element.style.backgroundColor=this.colors.fill,this.element.style.color=this.colors.dark,this.element.value!==this.value&&(this.value=parseFloat(this.element.value),this.render())}.bind(this)),h.setInputFilter(this.element,(function(t){return/^-?\d*\.?\d*$/.test(t)})),this.element.addEventListener("keydown",function(t){13===t.which&&(this.element.blur(),this.value=this.element.value,this.emit("change",this.value),this.render())}.bind(this),!0),this.parent.appendChild(this.element)}},sizeInterface:{value:function(){this._minDimension=Math.min(this.width,this.height)
var t="width: "+this.width+"px;"
t+="height: "+this.height+"px;",t+="background-color: #e7e7e7;",t+="color: #333;",t+="font-family: arial;",t+="font-weight: 500;",t+="font-size:"+this._minDimension/2+"px;",t+="border: none;",t+="outline: none;",t+="padding: "+this._minDimension/4+"px "+this._minDimension/4+"px;",t+="box-sizing: border-box;",t+="userSelect: text;",t+="mozUserSelect: text;",t+="webkitUserSelect: text;",this.element.style.cssText+=t,this.element.value=this.value}},colorInterface:{value:function(){this.element.style.backgroundColor=this.colors.fill,this.element.style.color=this.colors.dark}},render:{value:function(){this.element.value=l.prune(this.value,this.decimalPlaces)}},click:{value:function(){this.hasMoved=!1,this.element.readOnly=!0,this.actual=this.value,this.initial={y:this.mouse.y},this.changeFactor=l.invert(this.mouse.x/this.width)}},move:{value:function(){if(this.hasMoved=!0,this.clicked){var t=this.actual-(this.mouse.y-this.initial.y)*(l.clip(this.max-this.min,0,1e3)/200)*Math.pow(this.changeFactor,2)
this.value=t,this.render(),this._value.changed&&this.emit("change",this.value)}}},release:{value:function(){this.hasMoved?document.body.focus():(this.element.readOnly=!1,this.element.focus(),this.element.setSelectionRange(0,this.element.value.length),this.element.style.backgroundColor=this.colors.accent,this.element.style.color=this.colors.light)}},link:{value:function(t){var e=this
this.min=t.min,this.max=t.max,this.step=t.step,t.on("change",(function(t){e.passiveUpdate(t)})),this.on("change",(function(e){t.value=e})),this.value=t.value}},passiveUpdate:{value:function(t){this._value.update(t),this.render()}},value:{get:function(){return this._value.value},set:function(t){this._value.update(t),this.emit("change",this.value),this.render()}},min:{get:function(){return this._value.min},set:function(t){this._value.min=t}},max:{get:function(){return this._value.max},set:function(t){this._value.max=t}},step:{get:function(){return this._value.step},set:function(t){this._value.step=t}}}),e}(o)
t.exports=c},function(t,e,i){"use strict"
var n=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),s=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},r=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},o=function(t){function e(){r(this,e)
var t=["value"],i={size:[100,30],options:["default","options"]}
s(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this._selectedIndex=-1,this._value=!1,this._options=this.settings.options,this.init(),this.render()}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)}(e,t),n(e,{buildFrame:{value:function(){this.element=document.createElement("select"),this.element.style.fontSize=this.height/2+"px",this.element.style.outline="none",this.element.style.highlight="none",this.element.style.width=this.width+"px",this.element.style.height=this.height+"px",this.boundRender=this.render.bind(this),this.element.addEventListener("change",this.boundRender),this.parent.appendChild(this.element)}},attachListeners:{value:function(){}},buildInterface:{value:function(){this.defineOptions()}},colorInterface:{value:function(){this.element.style.backgroundColor=this.colors.fill,this.element.style.color=this.colors.dark,this.element.style.border="solid 0px "+this.colors.mediumLight}},render:{value:function(){this._value=this.element.options[this.element.selectedIndex].text,this._selectedIndex=this.element.selectedIndex,this.emit("change",{value:this._value,index:this._selectedIndex})}},click:{value:function(){}},move:{value:function(){}},release:{value:function(){}},defineOptions:{value:function(t){t&&(this._options=t)
for(var e=this.element.options.length-1;e>=0;e--)this.element.remove(e)
for(e=0;e<this._options.length;e++)this.element.options.add(new Option(this._options[e],e))}},value:{get:function(){return this._value},set:function(t){this._value=t
for(var e=0;e<this.element.options.length;e++)if(t===this.element.options[e].text){this.selectedIndex=e
break}}},selectedIndex:{get:function(){return this._selectedIndex},set:function(t){this._selectedIndex=t,this.element.selectedIndex=t,this.render()}},customDestroy:{value:function(){this.element.removeEventListener("change",this.boundRender)}}}),e}(i(6))
t.exports=o},function(t,e,i){"use strict"
var n,s=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),r=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},o=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},a=i(4),l=i(5),h=i(6),c=i(11),u=(n=i(12))&&n.__esModule?n:{default:n},f=function(t){function e(){o(this,e)
var t=["min","max","value"],i={size:[75,75],interaction:"radial",mode:"relative",min:0,max:1,step:0,value:0}
r(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this.interaction=this.settings.interaction,this._value=new c(this.settings.min,this.settings.max,this.settings.step,this.settings.value),this.position=new u.Handle(this.settings.mode,this.interaction,[0,this.width],[this.height,0]),this.init(),this.value=this._value.value,this.position.value=this._value.normalized,this.previousAngle=!1,this.emit("change",this.value)}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)}(e,t),s(e,{buildInterface:{value:function(){this.background=a.create("circle"),this.screw=a.create("circle"),this.handle=a.create("path"),this.handle2=a.create("path"),this.handleFill=a.create("path"),this.handle2Fill=a.create("path"),this.handleLine=a.create("path"),this.element.appendChild(this.background),this.element.appendChild(this.handle),this.element.appendChild(this.handle2),this.element.appendChild(this.handleFill),this.element.appendChild(this.handle2Fill),this.element.appendChild(this.handleLine),this.element.appendChild(this.screw)}},sizeInterface:{value:function(){this.position.resize([0,this.width],[this.height,0])
var t={x:this.width/2,y:this.height/2},e=Math.min(this.width,this.height)
this.background.setAttribute("cx",t.x),this.background.setAttribute("cy",t.y),this.background.setAttribute("r",e/2-e/40),this.screw.setAttribute("cx",t.x),this.screw.setAttribute("cy",t.y),this.screw.setAttribute("r",e/12)
var i,n=this.value,s={start:1.5*Math.PI,end:l.clip(l.scale(n,0,.5,1.5*Math.PI,.5*Math.PI),.5*Math.PI,1.5*Math.PI)},r={start:2.5*Math.PI,end:l.clip(l.scale(n,.5,1,2.5*Math.PI,1.5*Math.PI),1.5*Math.PI,2.5*Math.PI)},o=a.arc(t.x,t.y,e/2-e/40,s.start,s.end),h=a.arc(t.x,t.y,e/2-e/40,r.start,r.end)
this.handle.setAttribute("d",o),this.handle.setAttribute("stroke-width",e/20),this.handle.setAttribute("fill","none"),this.handle2.setAttribute("d",h),this.handle2.setAttribute("stroke-width",e/20),this.handle2.setAttribute("fill","none"),o+=" L "+t.x+" "+t.y,this.handleFill.setAttribute("d",o),this.handleFill.setAttribute("fill-opacity","0.3"),h+=" L "+t.x+" "+t.y,this.handle2Fill.setAttribute("d",h),this.handle2Fill.setAttribute("fill-opacity","0.3"),i=n<.5?s.end:r.end
var c=t.x+Math.cos(i)*(e/2),u=t.y+Math.sin(i)*(e/2)*-1
this.handleLine.setAttribute("d","M "+t.x+" "+t.y+" L "+c+" "+u),this.handleLine.setAttribute("stroke-width",e/20)}},colorInterface:{value:function(){this.background.setAttribute("fill",this.colors.fill),this.screw.setAttribute("fill",this.colors.accent),this.handle.setAttribute("stroke",this.colors.accent),this.handle2.setAttribute("stroke",this.colors.accent),this.handleFill.setAttribute("fill",this.colors.accent),this.handle2Fill.setAttribute("fill",this.colors.accent),this.handleLine.setAttribute("stroke",this.colors.accent)}},render:{value:function(){var t,e=this._value.normalized,i={x:this.width/2,y:this.height/2},n=Math.min(this.width,this.height),s={start:1.5*Math.PI,end:l.clip(l.scale(e,0,.5,1.5*Math.PI,.5*Math.PI),.5*Math.PI,1.5*Math.PI)},r={start:2.5*Math.PI,end:l.clip(l.scale(e,.5,1,2.5*Math.PI,1.5*Math.PI),1.5*Math.PI,2.5*Math.PI)},o=a.arc(i.x,i.y,n/2-n/40,s.start,s.end),h=a.arc(i.x,i.y,n/2-n/40,r.start,r.end)
this.handle.setAttribute("d",o),this.handle2.setAttribute("d",h),o+=" L "+i.x+" "+i.y,this.handleFill.setAttribute("d",o),h+=" L "+i.x+" "+i.y,this.handle2Fill.setAttribute("d",h),t=e<=.5?s.end:r.end
var c=i.x+Math.cos(t)*(n/2),u=i.y+Math.sin(t)*(n/2)*-1
this.handleLine.setAttribute("d","M "+i.x+" "+i.y+" L "+c+" "+u)}},click:{value:function(){"relative"===this.mode&&(this.previousAngle=!1),this.position.anchor=this.mouse,this.position.value=this._value.normalized,this.move()}},move:{value:function(){if(this.clicked){this.position.update(this.mouse)
var t=this.position.value*Math.PI*2
t<0&&(t+=2*Math.PI),"relative"===this.mode&&!1!==this.previousAngle&&Math.abs(this.previousAngle-t)>2&&(t=this.previousAngle>3?2*Math.PI:0),this.previousAngle=t
var e=t/(2*Math.PI)
this.value=this._value.updateNormal(e),"relative"===this.mode&&(this.position.value=e),this.emit("change",this._value.value),this.render()}}},release:{value:function(){}},value:{get:function(){return this._value.value},set:function(t){this._value.update(t),this.position.value=this._value.normalized,this.emit("change",this._value.value),this.render()}},min:{get:function(){return this._value.min},set:function(t){this._value.min=t}},max:{get:function(){return this._value.max},set:function(t){this._value.max=t}},step:{get:function(){return this._value.step},set:function(t){this._value.step=t}},mode:{get:function(){return this.position.mode},set:function(t){this.position.mode=t}},normalized:{get:function(){return this._value.normalized},set:function(t){this._value.updateNormal(t),this.emit("change",this.value)}}}),e}(h)
t.exports=f},function(t,e,i){"use strict"
var n=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),s=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},r=function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)},o=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},a=i(4),l=i(6),h=i(17),c=i(9),u=function(t){function e(){o(this,e)
var t=["value","note","color"],i={size:[80,80],target:!1,mode:"button",value:0}
s(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this.note=this.settings.note,this.color=this.settings.color,this.colors={w:"#fff",b:"#666"},this.init(),this.render()}return r(e,t),n(e,{buildFrame:{value:function(){this.element=a.create("svg"),this.element.setAttribute("width",this.width),this.element.setAttribute("height",this.height),this.parent.appendChild(this.element)}},buildInterface:{value:function(){var t=this
this.pad=a.create("rect"),this.element.appendChild(this.pad),this.interactionTarget=this.pad,c.exists||(this.click=function(){t.piano.interacting=!0,t.piano.paintbrush=!t.state,t.down(t.piano.paintbrush)},this.pad.addEventListener("mouseover",(function(){t.piano.interacting&&t.down(t.piano.paintbrush)})),this.move=function(){t.piano.interacting&&t.bend()},this.release=function(){t.piano.interacting=!1},this.pad.addEventListener("mouseup",(function(){t.piano.interacting&&t.up()})),this.pad.addEventListener("mouseout",(function(){t.piano.interacting&&t.up()})))}},sizeInterface:{value:function(){this.pad.setAttribute("x",.5),this.pad.setAttribute("y",.5),this.width>2?this.pad.setAttribute("width",this.width-1):this.pad.setAttribute("width",this.width),this.height,this.pad.setAttribute("height",this.height),this.pad.setAttribute("rx",0),this.pad.setAttribute("ry",0)}},render:{value:function(){this.state?this.pad.setAttribute("fill",this.colors.accent):this.pad.setAttribute("fill",this.colors[this.color])}}}),e}(h),f=function(t){function e(){o(this,e)
var t=["value"],i={size:[500,125],lowNote:24,highNote:60,mode:"button"}
s(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this.keyPattern=["w","b","w","b","w","w","b","w","b","w","b","w"],this.paintbrush=!1,this.mode=this.settings.mode,this.range={low:this.settings.lowNote,high:this.settings.highNote},this.range.size=this.range.high-this.range.low+1,this.keys=[],this.toggleTo=!1,this.init(),this.render()}return r(e,t),n(e,{buildFrame:{value:function(){this.element=document.createElement("div"),this.element.style.position="relative",this.element.style.borderRadius="0px",this.element.style.display="block",this.element.style.width="100%",this.element.style.height="100%",this.parent.appendChild(this.element)}},buildInterface:{value:function(){this.keys=[]
for(var t=0;t<this.range.size;t++){var e=document.createElement("span"),i=(t+this.range.low)%this.keyPattern.length,n=new u(e,{component:!0,note:t+this.range.low,color:this.keyPattern[i],mode:this.mode},this.keyChange.bind(this,t+this.range.low))
n.piano=this,c.exists&&(n.pad.index=t,n.preClick=n.preMove=n.preRelease=function(){},n.click=n.move=n.release=function(){},n.preTouch=n.preTouchMove=n.preTouchRelease=function(){},n.touch=n.touchMove=n.touchRelease=function(){}),this.keys.push(n),this.element.appendChild(e)}c.exists&&this.addTouchListeners()}},sizeInterface:{value:function(){for(var t=0,e=[],i=0;i<this.range.size;i++){e.push(t)
var n=(i+this.range.low)%this.keyPattern.length,s=(i+1+this.range.low)%this.keyPattern.length
i+1+this.range.low>=this.range.high||"w"===this.keyPattern[n]&&"w"===this.keyPattern[s]?t+=1:t+=.5}var r=t,o=(this.width-2)/r,a=(this.height-2)/2
for(i=0;i<this.keys.length;i++){var l=this.keys[i].parent
l.style.position="absolute",l.style.left=e[i]*o+1+"px","w"===this.keys[i].color?(l.style.top="1px",this.keys[i].resize(o,2*a)):(l.style.zIndex=1,l.style.top="1px",this.keys[i].resize(o,1.1*a))}}},colorInterface:{value:function(){this.element.style.backgroundColor=this.colors.mediumLight
for(var t=0;t<this.keys.length;t++)this.keys[t].colors={w:this.colors.light,b:this.colors.dark,accent:this.colors.accent,border:this.colors.mediumLight},this.keys[t].colorInterface(),this.keys[t].render()}},keyChange:{value:function(t,e){var i={note:t}
i.state="object"==typeof e?e.state:e,this.emit("change",i)}},render:{value:function(){}},addTouchListeners:{value:function(){this.preClick=this.preMove=this.preRelease=function(){},this.click=this.move=this.release=function(){},this.preTouch=this.preTouchMove=this.preTouchRelease=function(){},this.touch=this.touchMove=this.touchRelease=function(){}
var t={},e=this.keys
function i(t){return{identifier:t.identifier,clientX:t.clientX,clientY:t.clientY}}function n(){var i={}
Object.keys(t).forEach((function(n){var s=t[n],r=document.elementFromPoint(s.clientX,s.clientY),o=r?e[r.index]:null
o?(i[r.index]=n,o.state||o.down()):delete t[n]})),e.forEach((function(t){t.state&&!i[t.pad.index]&&t.up()}))}function s(e){e.preventDefault(),e.stopPropagation()
for(var s=0;s<e.changedTouches.length;s++){var r=e.changedTouches[s]
t[r.identifier]=i(r)}n()}this.element.addEventListener("touchstart",s),this.element.addEventListener("touchmove",s),this.element.addEventListener("touchend",(function(e){e.preventDefault(),e.stopPropagation()
for(var i=0;i<e.changedTouches.length;i++){var s=e.changedTouches[i]
delete t[s.identifier]}n()}))}},setRange:{value:function(t,e){this.range.low=t,this.range.high=e,this.empty(),this.buildInterface()}},toggleKey:{value:function(t,e){this.keys[t-this.range.low].flip(e)}},toggleIndex:{value:function(t,e){this.keys[t].flip(e)}}}),e}(l)
t.exports=f},function(t,e,i){"use strict"
var n=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),s=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},r=function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)},o=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},a=i(4),l=i(7),h=i(6),c=i(17),u=i(25),f=i(28),d=i(29),p=i(9),m=function(t){function e(){o(this,e)
var t=["value"],i={size:[80,80],target:!1,mode:"toggle",value:0,paddingRow:2,paddingColumn:2}
s(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this.index=this.settings.index,this.row=this.settings.row,this.column=this.settings.column,this.matrix=this.settings.matrix,this.paddingRow=this.settings.paddingRow||i.paddingRow,this.paddingColumn=this.settings.paddingColumn||i.paddingColumn,this.interacting=!1,this.paintbrush=!1,this.init(),this.render()}return r(e,t),n(e,{buildFrame:{value:function(){this.element=a.create("svg"),this.element.setAttribute("width",this.width),this.element.setAttribute("height",this.height),this.element.style.top="0px",this.element.style.left="0px",this.element.style.position="absolute",this.parent.appendChild(this.element)}},buildInterface:{value:function(){var t=this
this.pad=a.create("rect"),this.element.appendChild(this.pad),this.interactionTarget=this.pad,p.exists||(this.click=function(){t.matrix.interacting=!0,t.matrix.paintbrush=!t.state,t.down(t.matrix.paintbrush)},this.pad.addEventListener("mouseover",(function(){t.matrix.interacting&&t.down(t.matrix.paintbrush)})),this.move=function(){},this.pad.addEventListener("mousemove",(function(e){t.matrix.interacting&&(t.offset||(t.offset=l.findPosition(t.element)),t.mouse=l.locateMouse(e,t.offset),t.bend())})),this.release=function(){t.matrix.interacting=!1},this.pad.addEventListener("mouseup",(function(){t.matrix.interacting&&t.up()})),this.pad.addEventListener("mouseout",(function(){t.matrix.interacting&&t.up()})))}},sizeInterface:{value:function(){this.pad.setAttribute("x",this.paddingColumn/2),this.pad.setAttribute("y",this.paddingRow/2),this.width>2?this.pad.setAttribute("width",this.width-this.paddingColumn):this.pad.setAttribute("width",this.width),this.height>2?this.pad.setAttribute("height",this.height-this.paddingRow):this.pad.setAttribute("height",this.height),this.pad.setAttribute("fill",this.matrix.colors.fill)}},render:{value:function(){this.state?this.pad.setAttribute("fill",this.matrix.colors.accent):this.pad.setAttribute("fill",this.matrix.colors.fill)}}}),e}(c),g=function(t){function e(){o(this,e)
var t=["value"],i={size:[400,200],mode:"toggle",rows:5,columns:10}
s(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this.active=-1,this.mode=this.settings.mode,this.interval=new d(200,(function(){}),!1),this.matrix=new u(this.settings.rows,this.settings.columns),this.matrix.ui=this,this.stepper=new f(0,this.columns),this.paddingRow=this.settings.paddingRow,this.paddingColumn=this.settings.paddingColumn,this.init()}return r(e,t),n(e,{buildFrame:{value:function(){this.element=document.createElement("div"),this.element.style.position="relative",this.element.style.display="block",this.element.style.width="100%",this.element.style.height="100%",this.parent.appendChild(this.element),p.exists&&this.addTouchListeners()}},buildInterface:{value:function(){this.cells=[]
for(var t=0;t<this.matrix.length;t++){var e=this.matrix.locate(t),i=document.createElement("span")
i.style.position="absolute"
var n=new m(i,{component:!0,index:t,row:e.row,column:e.column,mode:this.mode,matrix:this,paddingRow:this.paddingRow,paddingColumn:this.paddingColumn},this.keyChange.bind(this,t))
p.exists&&(n.pad.index=t,n.preClick=n.preMove=n.preRelease=function(){},n.click=n.move=n.release=function(){},n.preTouch=n.preTouchMove=n.preTouchRelease=function(){},n.touch=n.touchMove=n.touchRelease=function(){}),this.cells.push(n),this.element.appendChild(i)}this.sizeInterface()}},sizeInterface:{value:function(){for(var t=this.width/this.columns,e=this.height/this.rows,i=0;i<this.cells.length;i++){var n=this.cells[i].parent
n.style.left=this.cells[i].column*t+"px",n.style.top=this.cells[i].row*e+"px",this.cells[i].resize(t,e)}}},colorInterface:{value:function(){for(var t=0;t<this.cells.length;t++)this.cells[t].render()}},update:{value:function(){var t=this
this.matrix.iterate((function(e,i,n){t.matrix.pattern[e][i]!==t.cells[n].state&&(t.matrix.pattern[e][i]>0?t.cells[n].turnOn():t.cells[n].turnOff())}))}},keyChange:{value:function(t,e){var i=this.matrix.locate(t)
this.matrix.pattern[i.row][i.column]=e
var n={row:i.row,column:i.column,state:e}
this.emit("change",n)}},render:{value:function(){var t=this
this.stepper.value>=0&&this.matrix.iterate((function(e,i,n){i===t.stepper.value?(t.cells[n].pad.setAttribute("stroke",t.colors.mediumLight),t.cells[n].pad.setAttribute("stroke-width","1"),t.cells[n].pad.setAttribute("stroke-opacity","1")):t.cells[n].pad.setAttribute("stroke","none")}))}},start:{value:function(t){this.interval.event=this.next.bind(this),t&&this.interval.ms(t),this.interval.start()}},stop:{value:function(){this.interval.stop()}},next:{value:function(){this.stepper.next(),this.emit("step",this.matrix.column(this.stepper.value).reverse()),this.render()}},addTouchListeners:{value:function(){var t=this
this.preClick=this.preMove=this.preRelease=function(){},this.click=this.move=this.release=function(){},this.preTouch=this.preTouchMove=this.preTouchRelease=function(){},this.touch=this.touchMove=this.touchRelease=function(){},this.currentElement=!1,this.element.addEventListener("touchstart",(function(e){var i=document.elementFromPoint(e.targetTouches[0].clientX,e.targetTouches[0].clientY),n=t.cells[i.index]
t.paintbrush=!n.state,n.down(t.paintbrush),t.currentElement=i.index,e.preventDefault(),e.stopPropagation()})),this.element.addEventListener("touchmove",(function(e){var i=document.elementFromPoint(e.targetTouches[0].clientX,e.targetTouches[0].clientY),n=t.cells[i.index]
i.index!==t.currentElement?(t.currentElement>=0&&t.cells[t.currentElement].up(),n.down(t.paintbrush)):n.bend(),t.currentElement=i.index,e.preventDefault(),e.stopPropagation()})),this.element.addEventListener("touchend",(function(e){t.cells[t.currentElement].up(),t.interacting=!1,t.currentElement=!1,e.preventDefault(),e.stopPropagation()}))}},rows:{get:function(){return this.matrix.rows},set:function(t){this.matrix.rows=t,this.empty(),this.buildInterface(),this.update()}},columns:{get:function(){return this.matrix.columns},set:function(t){this.matrix.columns=t,this.stepper.max=t,this.empty(),this.buildInterface(),this.update()}}}),e}(h)
t.exports=g},function(t,e,i){"use strict"
var n=function(t){return t&&t.__esModule?t.default:t},s=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),r=n(i(5)),o=n(i(26)),a=function(){function t(e,i){var n=this
!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this.pattern=[],this.create(e,i),this.toggle={cell:function(t,e){return n.pattern[e][t]=!n.pattern[e][t],n.ui&&n.ui.update(),n.pattern[e][t]},all:function(){n.iterate((function(t,e){n.toggle.cell(e,t)})),n.ui&&n.ui.update()},row:function(t){for(var e=0;e<n.columns;e++)n.toggle.cell(e,t)
n.ui&&n.ui.update()},column:function(t){for(var e=0;e<n.rows;e++)n.toggle.cell(t,e)
n.ui&&n.ui.update()}},this.set={cell:function(t,e,i){n.pattern[e][t]=i,n.ui&&n.ui.update()},all:function(t){n.pattern=t,n.ui&&n.ui.update()},row:function(t,e){n.pattern[t]=e,n.ui&&n.ui.update()},column:function(t,e){n.pattern.forEach((function(i,s){n.pattern[s][t]=e[s]})),n.ui&&n.ui.update()}},this.rotate={all:function(t){t||0===t||(t=1),(t%=n.pattern[0].length)<0&&(t=n.pattern[0].length+t)
for(var e=0;e<n.rows;e++){var i=n.pattern[e].splice(n.pattern[e].length-t,t)
n.pattern[e]=i.concat(n.pattern[e])}n.ui&&n.ui.update()},row:function(t,e){e||0===e||(e=1),(e%=n.pattern[0].length)<0&&(e=n.pattern[0].length+e)
var i=n.pattern[t].splice(n.pattern[t].length-e,e)
n.pattern[t]=i.concat(n.pattern[t]),n.ui&&n.ui.update()},column:function(t,e){e||0===e||(e=1),(e%=n.pattern.length)<0&&(e=n.pattern.length+e)
var i=[]
n.pattern.forEach((function(e){i.push(e[t])}))
var s=i.splice(i.length-e,e)
i=s.concat(i),n.pattern.forEach((function(e,n){e[t]=i[n]})),n.ui&&n.ui.update()}},this.populate={all:function(t){var e=new o(t)
n.iterate((function(t,i){n.pattern[t][i]=r.coin(e.next())})),n.ui&&n.ui.update()},row:function(){var t=void 0===arguments[0]?0:arguments[0],e=void 0===arguments[1]?1:arguments[1],i=new o(e)
n.pattern[t].forEach((function(e,s){n.pattern[t][s]=r.coin(i.next())})),n.ui&&n.ui.update()},column:function(){var t=void 0===arguments[0]?0:arguments[0],e=void 0===arguments[1]?1:arguments[1],i=new o(e)
n.pattern.forEach((function(e,s){n.pattern[s][t]=r.coin(i.next())})),n.ui&&n.ui.update()}},this.erase={all:function(){n.set.all(0)},row:function(t){n.set.row(t,0)},column:function(t){n.set.column(t,0)}}}var e,i,n,a
return s(t,{create:{value:function(t,e){var i=this
this.pattern=[]
for(var n=0;n<t;n++){var s=new Array(e)
this.pattern.push(s)}this.iterate((function(t,e){i.pattern[t][e]=!1}))}},iterate:{value:function(t,e){for(var i=0,n=0;n<this.rows;n++){e&&e(n)
for(var s=0;s<this.columns;s++)t(n,s,i),i++}}},formatAsText:{value:function(){var t=this,e=""
return this.iterate((function(i,n){e+=(t.pattern[i][n]?1:0)+" "}),(function(){e+="\n"})),e}},log:{value:function(){console.log(this.formatAsText())}},update:{value:function(t){this.pattern=t||this.pattern}},length:{get:function(){return this.rows*this.columns}},locate:{value:function(t){return{row:~~(t/this.columns),column:t%this.columns}}},indexOf:{value:function(t,e){return e+t*this.columns}},row:{value:(n=function(t){for(var e=[],i=0;i<this.columns;i++)e.push(this.pattern[t]?1:0)
return e},a=function(t){return n.apply(this,arguments)},a.toString=function(){return n.toString()},a)},column:{value:(e=function(t){for(var e=[],i=0;i<this.rows;i++)e.push(this.pattern[i][t]?1:0)
return e},i=function(t){return e.apply(this,arguments)},i.toString=function(){return e.toString()},i)},rows:{get:function(){return this.pattern.length},set:function(t){var e=this,i=this.pattern.slice(0)
this.create(t,this.columns),this.iterate((function(t,n){i[t]&&i[t][n]&&(e.pattern[t][n]=i[t][n])}))}},columns:{get:function(){return this.pattern[0].length},set:function(t){var e=this,i=this.pattern.slice(0)
this.create(this.rows,t),this.iterate((function(t,n){i[t]&&i[t][n]&&(e.pattern[t][n]=i[t][n])}))}}}),t}()
t.exports=a},function(t,e,i){"use strict"
var n=function(t){return t&&t.__esModule?t.default:t},s=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),r=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},o=n(i(5)),a=n(i(27)),l=function(){function t(){var e=void 0===arguments[0]?[0,10,20,30]:arguments[0],i=void 0===arguments[1]?"up":arguments[1],n=void 0!==arguments[2]&&arguments[2]
r(this,t),this.values=e,Array.isArray(this.values)||(this.values=[this.values]),this._mode=i,this.position=n,this.drunkWalk=new a(0,this.values.length-1),this.startValues={up:0,down:this.values.length-1,drunk:~~(this.values.length/2),random:o.ri(this.values.length)},!1!==this.position?this.next=this[this._mode]:this.next=this.first}return s(t,{mode:{get:function(){return this._mode},set:function(t){"up"===t||"down"===t||"random"===t||"drunk"===t?(this._mode=t,this.position&&(this.next=this[this._mode])):console.error("The only modes currently allowed are: up, down, random, drunk")}},value:{get:function(){return this.values[this.position]},set:function(t){this.position=this.values.indexOf(t)}},first:{value:function(){return!1!==this.position?(this.next=this[this._mode],this.next()):(this.position=this.startValues[this._mode],this.next=this[this._mode],this.value)}},up:{value:function(){return this.position++,this.position%=this.values.length,this.value}},down:{value:function(){return this.position--,this.position<0&&(this.position=(this.position+this.values.length)%this.values.length),this.value}},random:{value:function(){return this.position=o.ri(0,this.values.length),this.value}},drunk:{value:function(){return this.drunkWalk.max=this.values.length,this.drunkWalk.value=this.position,this.position=this.drunkWalk.next(),this.value}}}),t}()
t.exports=l},function(t,e,i){"use strict"
var n,s=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),r=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},o=(n=i(5))&&n.__esModule?n.default:n,a=function(){function t(){var e=void 0===arguments[0]?0:arguments[0],i=void 0===arguments[1]?9:arguments[1],n=void 0===arguments[2]?0:arguments[2],s=void 0===arguments[3]?1:arguments[3],o=void 0!==arguments[4]&&arguments[4]
r(this,t),this.min=e,this.max=i,this.value=n,this.increment=s,this.loop=o}return s(t,{next:{value:function(){return this.value+=o.pick(-1*this.increment,this.increment),this.value>this.max&&(this.loop?this.value=this.min:this.value=this.max-this.increment),this.value<this.min&&(this.loop?this.value=this.max:this.value=this.min+this.increment),this.value}}}),t}()
t.exports=a},function(t,e,i){"use strict"
var n=function(t){return t&&t.__esModule?t.default:t},s=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),r=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},o=n(i(5)),a=n(i(27)),l=function(){function t(){var e=void 0===arguments[0]?0:arguments[0],i=void 0===arguments[1]?10:arguments[1],n=void 0===arguments[2]?"up":arguments[2],s=void 0!==arguments[3]&&arguments[3]
r(this,t),this.min=e,this.max=i,this.value=s,this.mode=n,this.drunkWalk=new a(this.min,this.max),!1!==this.value?this.next=this[this._mode]:this.next=this.first}return s(t,{mode:{set:function(t){"up"===t||"down"===t||"random"===t||"drunk"===t?(this._mode=t,this.value&&(this.next=this[this._mode])):console.error("The only modes currently allowed are: up, down, random, drunk")},get:function(){return this._mode}},first:{value:function(){return!1!==this.value?(this.next=this[this._mode],this.next()):(this.startValues={up:this.min,down:this.max,drunk:~~o.average(this.min,this.max),random:o.ri(this.min,this.max)},this.value=this.startValues[this._mode],this.next=this[this._mode],this.value)}},up:{value:function(){return this.value++,this.value>=this.max&&(this.value=this.min),this.value}},down:{value:function(){return this.value--,this.value<this.min&&(this.value=this.max),this.value}},random:{value:function(){return this.value=o.ri(this.min,this.max),this.value}},drunk:{value:function(){return this.drunkWalk.min=this.min,this.drunkWalk.max=this.max,this.drunkWalk.value=this.value,this.value=this.drunkWalk.next(),this.value}}}),t}()
t.exports=l},function(t,e,i){"use strict"
var n=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),s=i(1).clock,r=function(){function t(e,i,n){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this.rate=e,this.on=n,this.clock=s(),this.pattern=[1],this.index=0,this.event=i||function(){},this.on&&this.start()}return n(t,{_event:{value:function(t){this.event(t),this.index++}},stop:{value:function(){this.on=!1,this.interval.clear()}},start:{value:function(){this.on=!0,this.interval=this.clock.callbackAtTime(this._event.bind(this),this.clock.context.currentTime).repeat(this.rate/1e3).tolerance({early:.1,late:1})}},ms:{value:function(t){if(this.on){var e=t/this.rate
this.rate=t,this.clock.timeStretch(this.clock.context.currentTime,[this.interval],e)}else this.rate=t}}}),t}()
t.exports=r},function(t,e,i){"use strict"
var n,s=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),r=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},o=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},a=i(4),l=i(5),h=i(6),c=i(11),u=(n=i(12))&&n.__esModule?n:{default:n},f=function(t){function e(){o(this,e)
var t=["range"],i={size:[200,200],range:.5,mode:"absolute",speakers:[[.5,.2],[.75,.25],[.8,.5],[.75,.75],[.5,.8],[.25,.75],[.2,.5],[.25,.25]]}
r(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this.value={x:new c(0,1,0,.5),y:new c(0,1,0,.5)},this.mode=this.settings.mode,this.position={x:new u.Handle(this.mode,"horizontal",[0,this.width],[this.height,0]),y:new u.Handle(this.mode,"vertical",[0,this.width],[this.height,0])},this.position.x.value=this.value.x.normalized,this.position.y.value=this.value.y.normalized,this.speakers=this.settings.speakers,this.range=this.settings.range,this.levels=[],this.init(),this.calculateLevels(),this.render()}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)}(e,t),s(e,{buildInterface:{value:function(){this.knob=a.create("circle"),this.element.appendChild(this.knob),this.speakerElements=[]
for(var t=0;t<this.speakers.length;t++){var e=a.create("circle")
this.element.appendChild(e),this.speakerElements.push(e)}}},sizeInterface:{value:function(){this._minDimension=Math.min(this.width,this.height),this.knobRadius={off:3*~~(this._minDimension/100)+5},this.knobRadius.on=2*this.knobRadius.off,this.knob.setAttribute("cx",this.width/2),this.knob.setAttribute("cy",this.height/2),this.knob.setAttribute("r",this.knobRadius.off)
for(var t=0;t<this.speakers.length;t++){var e=this.speakerElements[t],i=this.speakers[t]
e.setAttribute("cx",i[0]*this.width),e.setAttribute("cy",i[1]*this.height),e.setAttribute("r",this._minDimension/20+5),e.setAttribute("fill-opacity","0")}this.position.x.resize([0,this.width],[this.height,0]),this.position.y.resize([0,this.width],[this.height,0]),this.calculateLevels(),this.render()}},colorInterface:{value:function(){this.element.style.backgroundColor=this.colors.fill,this.knob.setAttribute("fill",this.colors.mediumLight)
for(var t=0;t<this.speakers.length;t++){var e=this.speakerElements[t]
e.setAttribute("fill",this.colors.accent),e.setAttribute("stroke",this.colors.accent)}}},render:{value:function(){this.knobCoordinates={x:this.value.x.normalized*this.width,y:this.height-this.value.y.normalized*this.height},this.knob.setAttribute("cx",this.knobCoordinates.x),this.knob.setAttribute("cy",this.knobCoordinates.y)}},click:{value:function(){this.position.x.anchor=this.mouse,this.position.y.anchor=this.mouse,this.move()}},move:{value:function(){this.clicked&&(this.position.x.update(this.mouse),this.position.y.update(this.mouse),this.calculateLevels(),this.emit("change",this.levels),this.render())}},release:{value:function(){this.render()}},normalized:{get:function(){return{x:this.value.x.normalized,y:this.value.y.normalized}}},calculateLevels:{value:function(){var t=this
this.value.x.updateNormal(this.position.x.value),this.value.y.updateNormal(this.position.y.value),this.levels=[],this.speakers.forEach((function(e,i){var n=l.distance(e[0]*t.width,e[1]*t.height,t.position.x.value*t.width,(1-t.position.y.value)*t.height),s=l.clip(1-n/(t.range*t.width),0,1)
t.levels.push(s),t.speakerElements[i].setAttribute("fill-opacity",s)}))}},moveSource:{value:function(t,e){var i={x:t*this.width,y:e*this.height}
this.position.x.update(i),this.position.y.update(i),this.calculateLevels(),this.emit("change",this.levels),this.render()}},moveSpeaker:{value:function(t,e,i){this.speakers[t]=[e,i],this.speakerElements[t].setAttribute("cx",e*this.width),this.speakerElements[t].setAttribute("cy",i*this.height),this.calculateLevels(),this.emit("change",this.levels),this.render()}}}),e}(h)
t.exports=f},function(t,e,i){"use strict"
var n=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),s=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},r=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},o=i(5),a=i(4),l=function(t){function e(){r(this,e)
var t=["value"],i={size:[80,80]}
s(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this._active=!0,this.init(),this.boundUpdate=this.update.bind(this),window.DeviceOrientationEvent?this.orientationListener=window.addEventListener("deviceorientation",this.boundUpdate,!1):(this._active=!1,this.colorInterface())}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)}(e,t),n(e,{buildInterface:{value:function(){this.title=a.create("text"),this.circleX=a.create("circle"),this.circleY=a.create("circle"),this.circleZ=a.create("circle"),this.barX=a.create("path"),this.barY=a.create("path"),this.barZ=a.create("path"),this.barX2=a.create("path"),this.barY2=a.create("path"),this.barZ2=a.create("path"),this.barX.setAttribute("opacity","0.8"),this.barY.setAttribute("opacity","0.8"),this.barZ.setAttribute("opacity","0.8"),this.barX2.setAttribute("opacity","0.8"),this.barY2.setAttribute("opacity","0.8"),this.barZ2.setAttribute("opacity","0.8"),this.circleX.setAttribute("cx",3*this.width/12),this.circleX.setAttribute("cy",3*this.height/4),this.circleX.setAttribute("r",this.height/10),this.circleX.setAttribute("opacity","0.4"),this.circleY.setAttribute("cx",6*this.width/12),this.circleY.setAttribute("cy",3*this.height/4),this.circleY.setAttribute("r",this.height/10),this.circleY.setAttribute("opacity","0.4"),this.circleZ.setAttribute("cx",9*this.width/12),this.circleZ.setAttribute("cy",3*this.height/4),this.circleZ.setAttribute("r",this.height/10),this.circleZ.setAttribute("opacity","0.4"),this.barX.setAttribute("stroke-width",Math.round(this.height/30)),this.barY.setAttribute("stroke-width",Math.round(this.height/30)),this.barZ.setAttribute("stroke-width",Math.round(this.height/30)),this.barX.setAttribute("fill","none"),this.barY.setAttribute("fill","none"),this.barZ.setAttribute("fill","none"),this.barX2.setAttribute("stroke-width",Math.round(this.height/30)),this.barY2.setAttribute("stroke-width",Math.round(this.height/30)),this.barZ2.setAttribute("stroke-width",Math.round(this.height/30)),this.barX2.setAttribute("fill","none"),this.barY2.setAttribute("fill","none"),this.barZ2.setAttribute("fill","none"),this.title.setAttribute("x",this.width/2),this.title.setAttribute("y",this.height/3+7),this.title.setAttribute("font-size","15px"),this.title.setAttribute("font-weight","bold"),this.title.setAttribute("letter-spacing","2px"),this.title.setAttribute("opacity","0.7"),this.title.setAttribute("text-anchor","middle"),this.title.textContent="TILT",this.element.appendChild(this.circleX),this.element.appendChild(this.circleY),this.element.appendChild(this.circleZ),this.element.appendChild(this.barX),this.element.appendChild(this.barY),this.element.appendChild(this.barZ),this.element.appendChild(this.barX2),this.element.appendChild(this.barY2),this.element.appendChild(this.barZ2),this.element.appendChild(this.title)}},colorInterface:{value:function(){this._active?(this.element.style.backgroundColor=this.colors.accent,this.circleX.setAttribute("fill",this.colors.light),this.circleY.setAttribute("fill",this.colors.light),this.circleZ.setAttribute("fill",this.colors.light),this.circleX.setAttribute("stroke",this.colors.light),this.circleY.setAttribute("stroke",this.colors.light),this.circleZ.setAttribute("stroke",this.colors.light),this.barX.setAttribute("stroke",this.colors.light),this.barY.setAttribute("stroke",this.colors.light),this.barZ.setAttribute("stroke",this.colors.light),this.barX2.setAttribute("stroke",this.colors.light),this.barY2.setAttribute("stroke",this.colors.light),this.barZ2.setAttribute("stroke",this.colors.light),this.title.setAttribute("fill",this.colors.light)):(this.element.style.backgroundColor=this.colors.fill,this.circleX.setAttribute("fill",this.colors.mediumLight),this.circleY.setAttribute("fill",this.colors.mediumLight),this.circleZ.setAttribute("fill",this.colors.mediumLight),this.circleX.setAttribute("stroke",this.colors.mediumLight),this.circleY.setAttribute("stroke",this.colors.mediumLight),this.circleZ.setAttribute("stroke",this.colors.mediumLight),this.barX.setAttribute("stroke",this.colors.mediumLight),this.barY.setAttribute("stroke",this.colors.mediumLight),this.barZ.setAttribute("stroke",this.colors.mediumLight),this.barX2.setAttribute("stroke",this.colors.mediumLight),this.barY2.setAttribute("stroke",this.colors.mediumLight),this.barZ2.setAttribute("stroke",this.colors.mediumLight),this.title.setAttribute("fill",this.colors.mediumLight))}},update:{value:function(t){if(this._active){var e=t.beta,i=t.gamma,n=t.alpha
i=o.scale(i,-90,90,0,1),e=o.scale(e,-90,90,0,1),n=o.scale(n,0,360,0,1)
var s={start:1.5*Math.PI,end:o.clip(o.scale(i,0,.5,1.5*Math.PI,.5*Math.PI),.5*Math.PI,1.5*Math.PI)},r={start:2.5*Math.PI,end:o.clip(o.scale(i,.5,1,2.5*Math.PI,1.5*Math.PI),1.5*Math.PI,2.5*Math.PI)},l=a.arc(this.circleX.cx.baseVal.value,this.circleX.cy.baseVal.value,this.circleX.r.baseVal.value,s.start,s.end),h=a.arc(this.circleX.cx.baseVal.value,this.circleX.cy.baseVal.value,this.circleX.r.baseVal.value,r.start,r.end)
this.barX.setAttribute("d",l),this.barX2.setAttribute("d",h),s={start:1.5*Math.PI,end:o.clip(o.scale(e,0,.5,1.5*Math.PI,.5*Math.PI),.5*Math.PI,1.5*Math.PI)},r={start:2.5*Math.PI,end:o.clip(o.scale(e,.5,1,2.5*Math.PI,1.5*Math.PI),1.5*Math.PI,2.5*Math.PI)},l=a.arc(this.circleY.cx.baseVal.value,this.circleY.cy.baseVal.value,this.circleY.r.baseVal.value,s.start,s.end),h=a.arc(this.circleY.cx.baseVal.value,this.circleY.cy.baseVal.value,this.circleY.r.baseVal.value,r.start,r.end),this.barY.setAttribute("d",l),this.barY2.setAttribute("d",h),s={start:1.5*Math.PI,end:o.clip(o.scale(n,0,.5,1.5*Math.PI,.5*Math.PI),.5*Math.PI,1.5*Math.PI)},r={start:2.5*Math.PI,end:o.clip(o.scale(n,.5,1,2.5*Math.PI,1.5*Math.PI),1.5*Math.PI,2.5*Math.PI)},l=a.arc(this.circleZ.cx.baseVal.value,this.circleZ.cy.baseVal.value,this.circleZ.r.baseVal.value,s.start,s.end),h=a.arc(this.circleZ.cx.baseVal.value,this.circleZ.cy.baseVal.value,this.circleZ.r.baseVal.value,r.start,r.end),this.barZ.setAttribute("d",l),this.barZ2.setAttribute("d",h),this.emit("change",{x:i,y:e,z:n})}}},click:{value:function(){window.DeviceOrientationEvent&&(this.active=!this.active)}},active:{get:function(){return this._active},set:function(t){this._active=t,this.colorInterface()}},customDestroy:{value:function(){window.removeEventListener("deviceorientation",this.boundUpdate,!1)}}}),e}(i(6))
t.exports=l},function(t,e,i){"use strict"
var n=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),s=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},r=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},o=i(5),a=i(4),l=function(t){function e(){r(this,e)
var t=["value"],i={size:[200,100],numberOfSliders:5,min:0,max:1,step:0,candycane:3,values:[.9,.8,.7,.6,.5,.4,.3,.2,.1],smoothing:0,mode:"bar"}
s(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this._numberOfSliders=this.settings.numberOfSliders,this._min=this.settings.min,this._max=this.settings.max,this._step=this.settings.step,this._mode=this.settings.mode
var n=this.settings.values
this.values=n.length>this._numberOfSliders?n.slice(0,this._numberOfSliders):n.concat(Array(this._numberOfSliders-n.length).fill(0)),this.candycane=this.settings.candycane,this.sliderWidth=this.width/this.values.length,this.smoothing=this.settings.smoothing,this.init(),this.render()}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)}(e,t),n(e,{buildInterface:{value:function(){"line"==this._mode?(this.line=a.create("polyline"),this.line.setAttribute("stroke-width",2),this.line.setAttribute("fill","none"),this.element.appendChild(this.line),this.fill=a.create("polyline"),this.fill.setAttribute("fill-opacity","0.2"),this.element.appendChild(this.fill),this.nodes=[],this.values.forEach(function(t,e){var i=a.create("circle")
i.setAttribute("cx",this.getX(e)),i.setAttribute("cy",this.getY(t)),this.element.appendChild(i),this.nodes.push(i)}.bind(this))):(this.bars=[],this.caps=[],this.values.forEach(function(t,e){var i=a.create("rect"),n=this.getBarX(e),s=this.getY(t)
i.setAttribute("x",n-.1),i.setAttribute("y",s),i.setAttribute("width",this.sliderWidth+.2),i.setAttribute("height",this.height),i.setAttribute("opacity",1-(e%this.candycane+1)/(this.candycane+1)),this.element.appendChild(i),this.bars.push(i)
var r=a.create("rect")
r.setAttribute("x",n-.1),r.setAttribute("y",s),r.setAttribute("width",this.sliderWidth+.2),r.setAttribute("height",5),this.element.appendChild(r),this.caps.push(r)}.bind(this)))}},getBarX:{value:function(t){return this.getX(t)-this.sliderWidth/2}},getX:{value:function(t){return t*this.sliderWidth+this.sliderWidth/2}},getY:{value:function(t){return o.scale(t,this._min,this._max,this.height,0)}},getValueFromY:{value:function(t){var e=o.scale(t,this.height,0,this._min,this._max)
return this.adjustValueToStep(e)}},getIndexFromX:{value:function(t){return o.clip(Math.floor(t/this.width*this.values.length),0,this.values.length-1)}},adjustValueToStep:{value:function(t){if(!this._step)return t
var e=t%this._step
return t-=t%this._step,e>this._step/2&&(t+=this._step),t}},adjustAllValues:{value:function(){this.values.forEach(function(t,e){t=this.adjustValueToStep(t),this.values[e]=o.clip(t,this._min,this._max)}.bind(this))}},getNormalizedValues:{value:function(){this.normalizedValues=[],this.values.forEach(function(t){this.normalizedValues.push(o.scale(t,this._min,this._max,0,1))}.bind(this))}},colorInterface:{value:function(){var t=this
this.element.style.backgroundColor=this.colors.fill,"line"==this._mode?(this.line.setAttribute("stroke",this.colors.accent),this.fill.setAttribute("fill",this.colors.accent),this.nodes.forEach((function(e){e.setAttribute("fill",t.colors.accent)}))):(this.bars.forEach((function(e){e.setAttribute("fill",t.colors.accent)})),this.caps.forEach((function(e){e.setAttribute("fill",t.colors.accent)})))}},sizeInterface:{value:function(){this.sliderWidth=this.width/this.values.length,"line"==this._mode&&this.nodes.forEach(function(t){var e=2+~~(Math.min(this.width,this.height)/50)
e=Math.min(this.sliderWidth,e),t.setAttribute("r",e)}.bind(this)),this.render()}},render:{value:function(){var t,e=this
"line"==this._mode?(t="0 "+e.getY(e.values[0])+", ",e.values.forEach((function(i,n){var s=e.getX(n),r=e.getY(i)
t+=s+" "+r+", ",e.nodes[n].setAttribute("cx",e.getX(n)),e.nodes[n].setAttribute("cy",e.getY(i))})),t+=e.width+" "+e.getY(e.values[e.values.length-1]),e.line.setAttribute("points",t),t+=", "+e.width+" "+e.height+", ",t+="0 "+e.height,e.fill.setAttribute("points",t)):this.values.forEach((function(t,i){e.bars[i].setAttribute("y",e.getY(t)),e.caps[i].setAttribute("y",e.getY(t))}))}},click:{value:function(){this.hasMoved=!1,this.previousSlider=!1,this.move()}},move:{value:function(){if(this.clicked){if(this.mouse.x=o.clip(this.mouse.x,0,this.width),this.mouse.y=o.clip(this.mouse.y,0,this.height),this.hasMoved=!0,this.selectedSlider=this.getIndexFromX(this.mouse.x),this.values[this.selectedSlider]=this.getValueFromY(this.mouse.y),!1!==this.previousSlider){var t=Math.abs(this.previousSlider-this.selectedSlider)
if(t>1)for(var e=Math.min(this.previousSlider,this.selectedSlider),i=Math.max(this.previousSlider,this.selectedSlider),n=this.values[e],s=this.values[i],r=e;r<i;r++)this.values[r]=o.interp((r-e)/t,n,s),this.values[r]=this.adjustValueToStep(this.values[r])}if(this.smoothing>0)for(var a=1;a<=this.smoothing;a++){var l=this.selectedSlider-a,h=this.selectedSlider+a
if(l>=1){var c=l-1>=0?l-1:0,u=l+1
this.values[l]=(this.values[c]+this.values[u])/2,this.values[l]=this.adjustValueToStep(this.values[l])}if(h<this.values.length-1){var f=h-1,d=h+1<this.values.length?h+1:this.values.length-1
this.values[h]=(this.values[f]+this.values[d])/2,this.values[h]=this.adjustValueToStep(this.values[h])}}this.previousSlider=this.selectedSlider,this.emit("change",this.values),this.render()}}},scan:{value:function(){}},update:{value:function(t,e){this.values[t]=this.adjustValueToStep(e),this.emit("change",{index:t,value:e})}},numberOfSliders:{get:function(){return this.values.length}},min:{get:function(){return this._min},set:function(t){this._min=t,this.adjustAllValues(),this.render()}},max:{get:function(){return this._max},set:function(t){this._max=t,this.adjustAllValues(),this.render()}},step:{get:function(){return this._step},set:function(t){this._step=t,this.adjustAllValues(),this.render()}},setSlider:{value:function(t,e){this.values[t]=this.adjustValueToStep(e),this.values[t]=o.clip(this.values[t],this._min,this._max),this.emit("change",{index:t,value:e})}},setAllSliders:{value:function(t){var e=this.values.length,i=t.length
this.values=t,this.adjustAllValues(),e!=i&&(this.empty(),this.buildInterface(),this.colorInterface()),this.sizeInterface()}}}),e}(i(6))
t.exports=l},function(t,e,i){"use strict"
var n,s=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),r=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},o=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},a=i(4),l=i(5),h=i(6),c=i(11),u=(n=i(12))&&n.__esModule?n:{default:n},f=function(t){function e(){o(this,e)
var t=["scale","value"],i={size:[120,20],orientation:"horizontal",mode:"relative",scale:[-1,1],step:0,value:0,hasKnob:!0}
r(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this.orientation=this.settings.orientation,this.mode=this.settings.mode,this.hasKnob=this.settings.hasKnob,this.step=this.settings.step,this._value=new c(this.settings.scale[0],this.settings.scale[1],this.settings.step,this.settings.value),this.init(),this.position=new u.Handle(this.mode,this.orientation,[0,this.width],[this.height,0]),this.position.value=this._value.normalized,this.value=this._value.value,this.emit("change",this.value)}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)}(e,t),s(e,{buildInterface:{value:function(){this.bar=a.create("rect"),this.knob=a.create("circle"),this.element.appendChild(this.bar),this.element.appendChild(this.knob)}},sizeInterface:{value:function(){this.position&&this.position.resize([0,this.width],[this.height,0]),this.width<this.height?this.orientation="vertical":this.orientation="horizontal"
var t=void 0,e=void 0,i=void 0,n=void 0,s=void 0,r=void 0
this.knobData={level:0,r:0},"vertical"===this.orientation?(this.thickness=this.width/2,t=this.width/2,e=0,i=this.thickness,n=this.height,this.knobData.r=.8*this.thickness,this.knobData.level=n-this.knobData.r-this.normalized*(n-2*this.knobData.r),s="translate("+-1*this.thickness/2+",0)",r=i/2):(this.thickness=this.height/2,t=0,e=this.height/2,i=this.width,n=this.thickness,this.knobData.r=.8*this.thickness,this.knobData.level=this.normalized*(i-2*this.knobData.r)+this.knobData.r,s="translate(0,"+-1*this.thickness/2+")",r=n/2),this.bar.setAttribute("x",t),this.bar.setAttribute("y",e),this.bar.setAttribute("transform",s),this.bar.setAttribute("rx",r),this.bar.setAttribute("ry",r),this.bar.setAttribute("width",i),this.bar.setAttribute("height",n),"vertical"===this.orientation?(this.knob.setAttribute("cx",t),this.knob.setAttribute("cy",this.knobData.level)):(this.knob.setAttribute("cx",this.knobData.level),this.knob.setAttribute("cy",e)),this.knob.setAttribute("r",this.knobData.r)}},colorInterface:{value:function(){this.bar.setAttribute("fill",this.colors.fill),this.knob.setAttribute("fill",this.colors.accent),this.hasKnob||this.knob.setAttribute("fill","transparent")}},render:{value:function(){this.clicked||(this.knobData.r=.75*this.thickness),this.knob.setAttribute("r",this.knobData.r),"vertical"===this.orientation?(this.knobData.level=this.knobData.r+this._value.normalized*(this.height-2*this.knobData.r),this.knob.setAttribute("cy",this.height-this.knobData.level)):(this.knobData.level=this._value.normalized*(this.width-2*this.knobData.r)+this.knobData.r,this.knob.setAttribute("cx",this.knobData.level))}},click:{value:function(){this.knobData.r=.9*this.thickness,this.position.anchor=this.mouse,this.move()}},move:{value:function(){this.clicked&&(this.position.update(this.mouse),this.value=this._value.updateNormal(this.position.value),this.emit("change",{value:this.value,L:Math.pow(l.scale(this.value,-1,1,1,0),2),R:Math.pow(l.scale(this.value,-1,1,0,1),2)}))}},release:{value:function(){this.render()}},value:{get:function(){return this._value.value},set:function(t){this._value.update(t),this.position.value=this._value.normalized,this.emit("change",{value:this.value,L:Math.pow(l.scale(this.value,-1,1,1,0),2),R:Math.pow(l.scale(this.value,-1,1,0,1),2)}),this.render()}},normalized:{get:function(){return this._value.normalized}}}),e}(h)
t.exports=f},function(t,e,i){"use strict"
var n=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),s=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},r=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},o=i(5),a=i(4),l=i(6),h=function(t,e){this.x=t.x,this.y=t.y,this.xMin=t.xMin||0,this.xMax=t.xMax||1,this.yMin=t.yMin||0,this.yMax=t.yMax||1,this.envelope=e,this.element=a.create("circle"),this.element.setAttribute("fill",this.envelope.colors.accent),this.envelope.element.appendChild(this.element),this.resize=function(){var t=2+~~(Math.min(this.envelope.width,this.envelope.height)/50)
this.element.setAttribute("r",t)},this.move=function(t,e){if(this.x=t||0===t?t:this.x,this.y=e||0===e?e:this.y,this.envelope.nodes.indexOf(this)>=0){var i=this.envelope.nodes.indexOf(this)-1,n=this.envelope.nodes.indexOf(this)+1,s=this.envelope.nodes[i],r=this.envelope.nodes[n],o=i>=0?s.x:0
o=o<this.xMin?this.xMin:o
var a=n<this.envelope.nodes.length?r.x:1
a=a>this.xMax?this.xMax:a,this.x<o&&(this.x=o),this.x>a&&(this.x=a),this.y<this.yMin&&(this.y=this.yMin),this.y>this.yMax&&(this.y=this.yMax)}this.location=this.getCoordinates(),this.element.setAttribute("cx",this.location.x),this.element.setAttribute("cy",this.location.y)},this.getCoordinates=function(){return{x:this.x*this.envelope.width,y:(1-this.y)*this.envelope.height}},this.move(this.x,this.y,!0),this.resize(),this.destroy=function(){this.envelope.element.removeChild(this.element),this.envelope.nodes.splice(this.envelope.nodes.indexOf(this),1)}},c=function(t){function e(){r(this,e)
var t=["value"],i={size:[300,150],noNewPoints:!1,points:[{x:.1,y:.4},{x:.35,y:.6},{x:.65,y:.2},{x:.9,y:.4}]}
s(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this.points=this.settings.points,this.nodes=[],this.selected=!1,this.init()}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)}(e,t),n(e,{buildInterface:{value:function(){var t=this
this.points.forEach((function(e){var i=new h(e,t)
t.nodes.push(i)})),this.sortPoints(),this.line=a.create("polyline"),this.line.setAttribute("stroke-width",2),this.line.setAttribute("fill","none"),this.element.appendChild(this.line),this.fill=a.create("polyline"),this.fill.setAttribute("fill-opacity","0.2"),this.element.appendChild(this.fill)}},sizeInterface:{value:function(){for(var t=0;t<this.nodes.length;t++)this.nodes[t].resize(),this.nodes[t].move()
this.render()}},colorInterface:{value:function(){var t=this
this.element.style.backgroundColor=this.colors.fill,this.line.setAttribute("stroke",this.colors.accent),this.fill.setAttribute("fill",this.colors.accent),this.nodes.forEach((function(e){e.element.setAttribute("fill",t.colors.accent)}))}},render:{value:function(){this.calculatePath()}},calculatePoints:{value:function(){var t=this
this.points=[],this.nodes.forEach((function(e){t.points.push({x:e.x,y:e.y})}))}},calculatePath:{value:function(){var t="0 "+this.nodes[0].location.y+", "
this.nodes.forEach((function(e){t+=e.location.x+" "+e.location.y+", "})),t+=this.width+" "+this.nodes[this.nodes.length-1].location.y,this.line.setAttribute("points",t),t+=", "+this.width+" "+this.height+", ",t+="0 "+this.height,this.fill.setAttribute("points",t)}},click:{value:function(){this.hasMoved=!1,this.selected=this.findNearestNode(),this.nodes[this.selected].move(this.mouse.x/this.width,1-this.mouse.y/this.height),this.scaleNode(this.selected),this.calculatePoints(),this.emit("change",this.points),this.render()}},move:{value:function(){this.clicked&&(this.mouse.x=o.clip(this.mouse.x,0,this.width),this.hasMoved=!0,this.nodes[this.selected].move(this.mouse.x/this.width,1-this.mouse.y/this.height),this.scaleNode(this.selected),this.calculatePoints(),this.emit("change",this.points),this.render())}},release:{value:function(){this.hasMoved||this.nodes[this.selected].destroy(),this.calculatePoints(),this.emit("change",this.points),this.render(),this.selected=null}},findNearestNode:{value:function(){for(var t=null,e=1e4,i=this.mouse.x/this.width,n=1-this.mouse.y/this.height,s=this.nodes,r=0;r<s.length;r++){var o=Math.sqrt(Math.pow(s[r].x-i,2)+Math.pow(s[r].y-n,2))
o<e&&(e=o,t=r,s[r].x)}return!this.settings.noNewPoints&&e>.07&&(t=this.getIndexFromX(this.mouse.x/this.width),this.nodes.splice(t,0,new h({x:this.mouse.x/this.width,y:1-this.mouse.y/this.height},this)),this.hasMoved=!0),t}},getIndexFromX:{value:function(t){var e=this,i=0
return this.nodes.forEach((function(n,s){e.nodes[s].x<=t&&(i=s+1)})),i}},scaleNode:{value:function(t){var e=o.clip(this.nodes[t].x,0,1),i=o.clip(this.nodes[t].y,0,1)
this.nodes[t].move(e,i)}},sortPoints:{value:function(){this.nodes.sort((function(t,e){return t.x>e.x}))}},addPoint:{value:function(t,e){var i=this.nodes.length
this.sortPoints()
for(var n=0;n<this.nodes.length;n++)if(t<this.nodes[n].x){i=n
break}this.nodes.splice(i,0,new h({x:t,y:e},this)),this.scaleNode(i),this.calculatePoints(),this.emit("change",this.points),this.render()}},scan:{value:function(t){var e=this.getIndexFromX(t),i=e-1
i<0&&(i=0),e>=this.nodes.length&&(e=this.nodes.length-1)
var n=this.nodes[i],s=this.nodes[e],r=o.scale(t,n.x,s.x,0,1),a=o.interp(r,n.y,s.y)
return this.emit("scan",a),a}},movePoint:{value:function(t,e,i){this.nodes[t].move(e,i),this.scaleNode(t),this.calculatePoints(),this.emit("change",this.points),this.render()}},adjustPoint:{value:function(t,e,i){this.nodes[t].move(this.nodes[t].x+e,this.nodes[t].y+i),this.scaleNode(t),this.calculatePoints(),this.emit("change",this.points),this.render()}},destroyPoint:{value:function(t){this.nodes[t].destroy(),this.calculatePoints(),this.emit("change",this.points),this.render()}},setPoints:{value:function(t){for(var e=this;this.nodes.length;)this.nodes[0].destroy()
t.forEach((function(t){e.addPoint(t.x,t.y)})),this.calculatePoints(),this.emit("change",this.points),this.render()}}}),e}(l)
t.exports=c},function(t,e,i){"use strict"
var n=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),s=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},r=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},o=i(7),a=function(t){function e(){r(this,e)
var t=[],i={size:[300,150]}
s(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this.analyser=null,this.bufferLength=0,this.dataArray=null,this.active=!1,this.source=null,this.init()}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)}(e,t),n(e,{buildFrame:{value:function(){this.canvas=new o.SmartCanvas(this.parent),this.element=this.canvas.element}},sizeInterface:{value:function(){this.canvas.resize(this.width,this.height)}},colorInterface:{value:function(){this.canvas.element.style.backgroundColor=this.colors.fill}},render:{value:function(){if(this.active&&requestAnimationFrame(this.render.bind(this)),this.analyser&&this.analyser.getByteFrequencyData(this.dataArray),this.canvas.context.fillStyle=this.colors.fill,this.canvas.context.fillRect(0,0,this.canvas.element.width,this.canvas.element.height),this.source&&this.dataArray)for(var t=this.canvas.element.width/this.bufferLength,e=void 0,i=0,n=this.canvas.element.width/50,s=0;s<this.bufferLength;s+=n)e=Math.max.apply(null,this.dataArray.subarray(s,s+n)),e/=255,e*=this.canvas.element.height,this.canvas.context.fillStyle=this.colors.accent,this.canvas.context.fillRect(i,this.canvas.element.height-e,t*n,e),i+=t*n}},connect:{value:function(t){this.source&&this.disconnect(),this.analyser=t.context.createAnalyser(),this.analyser.fftSize=2048,this.bufferLength=this.analyser.frequencyBinCount,this.dataArray=new Uint8Array(this.bufferLength),this.active=!0,this.source=t,this.source.connect(this.analyser),this.render()}},disconnect:{value:function(){this.source&&this.source.disconnect(this.analyser),this.analyser=null,this.bufferLength=0,this.dataArray=null,this.active=!1,this.source=null}},click:{value:function(){this.active=!this.active&&this.source,this.render()}},customDestroy:{value:function(){this.active=!1}}}),e}(i(6))
t.exports=a},function(t,e,i){"use strict"
var n=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),s=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},r=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},o=i(7),a=i(5),l=function(t){function e(){r(this,e)
var t=[],i={size:[30,100]}
s(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this.channels=2,this.splitter=null,this.analysers=[],this.bufferLength=0,this.dataArray=null,this.active=!1,this.source=null,this.db=-1/0,this.init(),this.meterWidth=this.canvas.element.width/this.channels,this.render()}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)}(e,t),n(e,{buildFrame:{value:function(){this.canvas=new o.SmartCanvas(this.parent),this.element=this.canvas.element}},sizeInterface:{value:function(){this.canvas.resize(this.width,this.height)}},colorInterface:{value:function(){this.canvas.element.style.backgroundColor=this.colors.fill}},render:{value:function(){this.active&&requestAnimationFrame(this.render.bind(this)),this.canvas.context.fillStyle=this.colors.fill,this.canvas.context.fillRect(0,0,this.canvas.element.width,this.canvas.element.height)
for(var t=0;t<this.analysers.length;t++){if(this.source){this.analysers[t].getFloatTimeDomainData(this.dataArray)
for(var e=0,i=0;i<this.dataArray.length;i++)e+=this.dataArray[i]*this.dataArray[i]
e=Math.sqrt(e/this.dataArray.length),this.db=20*Math.log10(e)}else this.db>-200&&this.db!==-1/0?this.db-=1:this.db=-1/0
if(this.db>-70){var n=a.normalize(this.db,-70,5),s=n*n,r=a.scale(s,0,1,this.element.height,0)
this.canvas.context.fillStyle=this.colors.accent,this.canvas.context.fillRect(this.meterWidth*t,r,this.meterWidth,this.canvas.element.height-r)}}}},connect:{value:function(t,e){this.source&&this.disconnect(),this.channels=e||t.channelCount||2,this.splitter=t.context.createChannelSplitter(this.channels),this.analysers=[]
for(var i=0;i<this.channels;i++){var n=t.context.createAnalyser()
n.fftSize=1024,n.smoothingTimeConstant=1,this.splitter.connect(n,i),this.analysers.push(n)}this.bufferLength=this.analysers[0].frequencyBinCount,this.dataArray=new Float32Array(this.bufferLength),this.active=!0,this.meterWidth=this.canvas.element.width/this.channels,this.source=t,this.source.connect(this.splitter),this.render()}},disconnect:{value:function(){this.source&&this.source.disconnect(this.splitter),this.splitter=null,this.analysers=[],this.bufferLength=0,this.dataArray=null,this.active=!1,this.source=null}},click:{value:function(){this.active=!this.active&&this.source,this.render()}},customDestroy:{value:function(){this.active=!1}}}),e}(i(6))
t.exports=l},function(t,e,i){"use strict"
var n=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),s=function t(e,i,n){var s=Object.getOwnPropertyDescriptor(e,i)
if(void 0===s){var r=Object.getPrototypeOf(e)
return null===r?void 0:t(r,i,n)}if("value"in s&&s.writable)return s.value
var o=s.get
return void 0!==o?o.call(n):void 0},r=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},o=i(7),a=function(t){function e(){r(this,e)
var t=[],i={size:[300,150]}
s(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,arguments,t,i),this.analyser=null,this.bufferLength=0,this.dataArray=null,this.active=!1,this.source=null,this.init(),this.render()}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e)
t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(t.__proto__=e)}(e,t),n(e,{buildFrame:{value:function(){this.canvas=new o.SmartCanvas(this.parent),this.element=this.canvas.element}},sizeInterface:{value:function(){this.canvas.resize(this.width,this.height)}},colorInterface:{value:function(){this.canvas.element.style.backgroundColor=this.colors.fill}},render:{value:function(){if(this.active&&requestAnimationFrame(this.render.bind(this)),this.analyser&&this.analyser.getByteTimeDomainData(this.dataArray),this.canvas.context.fillStyle=this.colors.fill,this.canvas.context.fillRect(0,0,this.canvas.element.width,this.canvas.element.height),this.canvas.context.lineWidth=~~(this.height/100+2),this.canvas.context.strokeStyle=this.colors.accent,this.canvas.context.beginPath(),this.source)for(var t=1*this.canvas.element.width/this.bufferLength,e=0,i=0;i<this.bufferLength;i++){var n=this.dataArray[i]/128*this.canvas.element.height/2
0===i?this.canvas.context.moveTo(e,n):this.canvas.context.lineTo(e,n),e+=t}else this.canvas.context.moveTo(0,this.canvas.element.height/2),this.canvas.context.lineTo(this.canvas.element.width,this.canvas.element.height/2)
this.canvas.context.stroke()}},connect:{value:function(t){this.source&&this.disconnect(),this.analyser=t.context.createAnalyser(),this.analyser.fftSize=2048,this.bufferLength=this.analyser.frequencyBinCount,this.dataArray=new Uint8Array(this.bufferLength),this.analyser.getByteTimeDomainData(this.dataArray),this.active=!0,this.source=t,this.source.connect(this.analyser),this.render()}},disconnect:{value:function(){this.source&&this.source.disconnect(this.analyser),this.analyser=null,this.bufferLength=0,this.dataArray=null,this.active=!1,this.source=null}},click:{value:function(){this.active=!this.active&&this.source,this.render()}},customDestroy:{value:function(){this.active=!1}}}),e}(i(6))
t.exports=a},function(t,e,i){"use strict"
var n,s=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),r=(n=i(39))&&n.__esModule?n:{default:n},o=function(t){return t&&t.__esModule?t.default:t}(i(7)),a=i(1).colors,l=function(){function t(e,i){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this.meta={},this.meta.target=e,this.meta.parent=o.parseElement(e),this.meta.colors={},i?(this.meta.attribute=i.attribute||"nexus-ui",this.meta.title=i.name||!1,this.meta.open=i.open||!1):(this.meta.attribute="nexus-ui",this.meta.title=!1,this.meta.open=!1)
var n=a()
this.meta.colors.accent=n.accent,this.meta.colors.fill=n.fill,this.meta.colors.light=n.light,this.meta.colors.dark=n.dark,this.meta.colors.mediumLight=n.mediumLight,this.meta.colors.mediumDark=n.mediumDark,this.buildInterface(),this.colorInterface()}return s(t,{buildInterface:{value:function(){var t=this
for(this.meta.parent.style.boxSizing="border-box",this.meta.parent.style.userSelect="none",this.meta.parent.style.mozUserSelect="none",this.meta.parent.style.webkitUserSelect="none",this.meta.contents=document.createElement("div");this.meta.parent.childNodes.length>0;)this.meta.contents.appendChild(this.meta.parent.childNodes[0])
this.meta.contents.style.padding="0px",this.meta.contents.style.boxSizing="border-box",this.meta.title&&(this.meta.titleBar=document.createElement("div"),this.meta.titleBar.innerHTML=this.meta.title,this.meta.titleBar.style.fontFamily="arial",this.meta.titleBar.style.position="relative",this.meta.titleBar.style.color="#888",this.meta.titleBar.style.padding="7px",this.meta.titleBar.style.fontSize="12px",this.meta.button=document.createElement("div"),this.meta.button.style.position="absolute",this.meta.button.style.top="5px",this.meta.button.style.right="5px",this.meta.button.innerHTML="-",this.meta.button.style.padding="0px 5px 2px",this.meta.button.style.lineHeight="12px",this.meta.button.style.fontSize="15px",this.meta.button.style.cursor="pointer",this.meta.button.addEventListener("mouseover",(function(){t.meta.button.style.backgroundColor=t.meta.colors.mediumDark})),this.meta.button.addEventListener("mouseleave",(function(){t.meta.button.style.backgroundColor=t.meta.colors.mediumLight})),this.meta.button.addEventListener("click",(function(){t.meta.open?t.hide():t.show()})),this.meta.titleBar.appendChild(this.meta.button),this.meta.parent.appendChild(this.meta.titleBar)),this.meta.parent.appendChild(this.meta.contents)
var e=r.section(this.meta.target,this.meta.attribute)
for(var i in e)this[i]=e[i]}},colorInterface:{value:function(){this.meta.title&&(this.meta.button.style.backgroundColor=this.meta.colors.mediumLight,this.meta.button.style.border="solid 0px "+this.meta.colors.fill,this.meta.parent.style.border="solid 1px "+this.meta.colors.mediumLight,this.meta.parent.style.backgroundColor=this.meta.colors.light,this.meta.titleBar.style.backgroundColor=this.meta.colors.fill)}},show:{value:function(){this.meta.contents.style.display="block",this.meta.open=!0}},hide:{value:function(){this.meta.contents.style.display="none",this.meta.open=!1}},colorize:{value:function(t,e){for(var i in this)this[i].colorize&&this[i].colorize(t,e)
this.meta.colors[t]=e,this.colorInterface()}},empty:{value:function(){for(var t in this)this[t].destroy&&this[t].destroy()}}}),t}()
t.exports=l},function(t,e,i){"use strict"
var n=function(t){return t&&t.__esModule?t.default:t}
Object.defineProperty(e,"__esModule",{value:!0})
var s=n(i(7)),r=n(i(2)),o=function(t,e){var i=t.type
return e[i]?e[i]++:e[i]=1,i+e[i]},a=function(t,e,i){i=i||{}
for(var n=0;n<t.attributes.length;n++){var s=t.attributes[n]
i[s.nodeName]=s.nodeValue}e=e[0].toUpperCase()+e.slice(1)
var o=new r[e](t,i)
return o.id=t.id,o}
e.element=a,e.section=function(t,e){e=e||"nexus-ui"
for(var i={},n={},l=s.parseElement(t).getElementsByTagName("*"),h=[],c=0;c<l.length;c++)h.push(l[c])
for(c=0;c<h.length;c++){var u=h[c].getAttribute(e)
if(u){var f=!1
for(var d in r)u.toLowerCase()===d.toLowerCase()&&(f=d)
console.log(f)
var p=a(h[c],f)
p.id?n[p.id]=p:n[o(p,i)]=p}}return n},e.add=function(t,e,i){var n=document.createElement("div")
return i=i||{},(e=e?s.parseElement(e):document.body).appendChild(n),i.target=n,i.size&&(n.style.width=i.size[0]+"px",n.style.height=i.size[1]+"px"),a(n,t,i)}},function(t,e,i){"use strict"
var n,s=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),r=(n=i(5))&&n.__esModule?n.default:n,o=function(){function t(){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this.scale=[],this.mode={output:"frequency",input:"step"},this.etmajor=[261.62558,293.664764,329.627563,349.228241,391.995422,440,493.883301,523.25116],this.root=r.mtof(60),this.createScale(0,2,4,5,7,9,11)}return s(t,{note:{value:function(t,e){return"frequency"===this.mode.output?this.frequency(t,e):"ratio"===this.mode.output?this.ratio(t,e):"MIDI"===this.mode.output?this.MIDI(t,e):this.frequency(t,e)}},frequency:{value:function(t,e){"midi"!==this.mode.input&&"MIDI"!==this.mode.input||(this.stepIn+=60)
var i=Math.floor(t/this.scale.length)
e&&(i+=e)
for(var n=t%this.scale.length;n<0;)n+=this.scale.length
var s=this.scale[n],r=this.root*s
return r*=Math.pow(2,i),Math.floor(1e11*r)/1e11}},ratio:{value:function(t,e){"midi"!==this.mode.input&&"MIDI"!==this.mode.input||(this.stepIn+=60)
var i=Math.floor(t/this.scale.length)
e&&(i+=e)
var n=t%this.scale.length,s=Math.pow(2,i)*this.scale[n]
return Math.floor(1e11*s)/1e11}},MIDI:{value:function(t,e){var i=this.frequency(t,e),n=69+12*Math.log(i/440)/Math.log(2)
return Math.floor(1e9*n)/1e9}},createScale:{value:function(){for(var t=[],e=0;e<arguments.length;e++)t.push(r.mtof(60+arguments[e]))
this.loadScaleFromFrequencies(t)}},createJIScale:{value:function(){this.scale=[]
for(var t=0;t<arguments.length;t++)this.scale.push(arguments[t])}},loadScaleFromFrequencies:{value:function(t){this.scale=[]
for(var e=0;e<t.length;e++)this.scale.push(t[e]/t[0])}},loadScale:{value:function(t){var e=this.scales[t].frequencies
this.loadScaleFromFrequencies(e)}},search:{value:function(t){var e=[]
for(var i in this.scales)-1!==i.toLowerCase().indexOf(t.toLowerCase())&&e.push(i)
return e}},chord:{value:function(t){for(var e=[],i=0;i<t.length;i++)e.push(this.note(t[i]))
return e}}}),t}()
t.exports=o},function(t,e){"use strict"
var i=function(){function t(t,e){for(var i in e){var n=e[i]
n.configurable=!0,n.value&&(n.writable=!0)}Object.defineProperties(t,e)}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),n=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")},s=function(){function t(){for(var e=arguments.length,i=Array(e>1?e-1:0),s=1;s<e;s++)i[s-1]=arguments[s]
var r=void 0===arguments[0]?3:arguments[0]
n(this,t),r<0&&(r=1),this.length=r,this.onVals=i,this.array=new Array(r).fill(0),i.length>0&&this.on.apply(this,i)}return i(t,{select:{value:function(t){return this.array.fill(0),this.array[t]=1,this.array}},flip:{value:function(){for(var t=arguments.length,e=Array(t),i=0;i<t;i++)e[i]=arguments[i]
var n=this.array
return e.length>0?e.forEach((function(t){t>n.length-1?console.warn("Warning: AnonRadio["+t+"] does not exist"):n[t]=n[t]?0:1})):n.forEach((function(t,e,i){i[e]=t?0:1})),n}},on:{value:function(){for(var t=arguments.length,e=Array(t),i=0;i<t;i++)e[i]=arguments[i]
var n=this.array
return e.length>0?e.forEach((function(t){t>n.length-1?console.warn("Warning: AnonRadio["+t+"] exceeds size of object"):(1===n[t]&&console.warn("Warning: AnonRadio["+t+"] was already on."),n[t]=1)})):n.fill(1),n}},off:{value:function(){for(var t=arguments.length,e=Array(t),i=0;i<t;i++)e[i]=arguments[i]
var n=this.array
return e.length>0?e.forEach((function(t){n[t]=0})):n.fill(0),n}}}),t}()
t.exports=s},function(t,e,i){var n=i(43)
t.exports=n,"undefined"!=typeof window&&(window.WAAClock=n)},function(t,e,i){(function(e){var i=function(t,e,i){this.clock=t,this.func=i,this._cleared=!1,this.toleranceLate=t.toleranceLate,this.toleranceEarly=t.toleranceEarly,this._latestTime=null,this._earliestTime=null,this.deadline=null,this.repeatTime=null,this.schedule(e)}
i.prototype.clear=function(){return this.clock._removeEvent(this),this._cleared=!0,this},i.prototype.repeat=function(t){if(0===t)throw new Error("delay cannot be 0")
return this.repeatTime=t,this.clock._hasEvent(this)||this.schedule(this.deadline+this.repeatTime),this},i.prototype.tolerance=function(t){return"number"==typeof t.late&&(this.toleranceLate=t.late),"number"==typeof t.early&&(this.toleranceEarly=t.early),this._refreshEarlyLateDates(),this.clock._hasEvent(this)&&(this.clock._removeEvent(this),this.clock._insertEvent(this)),this},i.prototype.isRepeated=function(){return null!==this.repeatTime},i.prototype.schedule=function(t){this._cleared=!1,this.deadline=t,this._refreshEarlyLateDates(),this.clock.context.currentTime>=this._earliestTime?this._execute():this.clock._hasEvent(this)?(this.clock._removeEvent(this),this.clock._insertEvent(this)):this.clock._insertEvent(this)},i.prototype.timeStretch=function(t,e){this.isRepeated()&&(this.repeatTime=this.repeatTime*e)
var i=t+e*(this.deadline-t)
if(this.isRepeated())for(;this.clock.context.currentTime>=i-this.toleranceEarly;)i+=this.repeatTime
this.schedule(i)},i.prototype._execute=function(){!1!==this.clock._started&&(this.clock._removeEvent(this),this.clock.context.currentTime<this._latestTime?this.func(this):(this.onexpired&&this.onexpired(this),console.warn("event expired")),this.clock._hasEvent(this)||!this.isRepeated()||this._cleared||this.schedule(this.deadline+this.repeatTime))},i.prototype._refreshEarlyLateDates=function(){this._latestTime=this.deadline+this.toleranceLate,this._earliestTime=this.deadline-this.toleranceEarly}
var n=t.exports=function(t,e){e=e||{},this.tickMethod=e.tickMethod||"ScriptProcessorNode",this.toleranceEarly=e.toleranceEarly||.001,this.toleranceLate=e.toleranceLate||.1,this.context=t,this._events=[],this._started=!1}
n.prototype.setTimeout=function(t,e){return this._createEvent(t,this._absTime(e))},n.prototype.callbackAtTime=function(t,e){return this._createEvent(t,e)},n.prototype.timeStretch=function(t,e,i){return e.forEach((function(e){e.timeStretch(t,i)})),e},n.prototype.start=function(){if(!1===this._started){var t=this
if(this._started=!0,this._events=[],"ScriptProcessorNode"===this.tickMethod)this._clockNode=this.context.createScriptProcessor(256,1,1),this._clockNode.connect(this.context.destination),this._clockNode.onaudioprocess=function(){e.nextTick((function(){t._tick()}))}
else if("manual"!==this.tickMethod)throw new Error("invalid tickMethod "+this.tickMethod)}},n.prototype.stop=function(){!0===this._started&&(this._started=!1,this._clockNode.disconnect())},n.prototype._tick=function(){for(var t=this._events.shift();t&&t._earliestTime<=this.context.currentTime;)t._execute(),t=this._events.shift()
t&&this._events.unshift(t)},n.prototype._createEvent=function(t,e){return new i(this,e,t)},n.prototype._insertEvent=function(t){this._events.splice(this._indexByTime(t._earliestTime),0,t)},n.prototype._removeEvent=function(t){var e=this._events.indexOf(t);-1!==e&&this._events.splice(e,1)},n.prototype._hasEvent=function(t){return-1!==this._events.indexOf(t)},n.prototype._indexByTime=function(t){for(var e,i=0,n=this._events.length;i<n;)e=Math.floor((i+n)/2),this._events[e]._earliestTime<t?i=e+1:n=e
return i},n.prototype._absTime=function(t){return t+this.context.currentTime},n.prototype._relTime=function(t){return t-this.context.currentTime}}).call(e,i(44))},function(t,e){var i,n,s=t.exports={}
function r(){throw new Error("setTimeout has not been defined")}function o(){throw new Error("clearTimeout has not been defined")}function a(t){if(i===setTimeout)return setTimeout(t,0)
if((i===r||!i)&&setTimeout)return i=setTimeout,setTimeout(t,0)
try{return i(t,0)}catch(e){try{return i.call(null,t,0)}catch(e){return i.call(this,t,0)}}}!function(){try{i="function"==typeof setTimeout?setTimeout:r}catch(t){i=r}try{n="function"==typeof clearTimeout?clearTimeout:o}catch(t){n=o}}()
var l,h=[],c=!1,u=-1
function f(){c&&l&&(c=!1,l.length?h=l.concat(h):u=-1,h.length&&d())}function d(){if(!c){var t=a(f)
c=!0
for(var e=h.length;e;){for(l=h,h=[];++u<e;)l&&l[u].run()
u=-1,e=h.length}l=null,c=!1,function(t){if(n===clearTimeout)return clearTimeout(t)
if((n===o||!n)&&clearTimeout)return n=clearTimeout,clearTimeout(t)
try{n(t)}catch(e){try{return n.call(null,t)}catch(e){return n.call(this,t)}}}(t)}}function p(t,e){this.fun=t,this.array=e}function m(){}s.nextTick=function(t){var e=new Array(arguments.length-1)
if(arguments.length>1)for(var i=1;i<arguments.length;i++)e[i-1]=arguments[i]
h.push(new p(t,e)),1!==h.length||c||a(d)},p.prototype.run=function(){this.fun.apply(null,this.array)},s.title="browser",s.browser=!0,s.env={},s.argv=[],s.version="",s.versions={},s.on=m,s.addListener=m,s.once=m,s.off=m,s.removeListener=m,s.removeAllListeners=m,s.emit=m,s.prependListener=m,s.prependOnceListener=m,s.listeners=function(t){return[]},s.binding=function(t){throw new Error("process.binding is not supported")},s.cwd=function(){return"/"},s.chdir=function(t){throw new Error("process.chdir is not supported")},s.umask=function(){return 0}}])},t.exports=e()},63:(t,e,i)=>{"use strict"
i.r(e),i.d(e,{ActionTypes:()=>r,Interpreter:()=>fe,InterpreterStatus:()=>ce,Machine:()=>ye,SpecialTargets:()=>o,State:()=>ne,StateNode:()=>ve,actions:()=>s,assign:()=>Qe,createMachine:()=>be,createSchema:()=>Se,doneInvoke:()=>_e,forwardTo:()=>Ae,interpret:()=>pe,mapState:()=>we,matchState:()=>xe,matchesState:()=>M,send:()=>Pe,sendParent:()=>Te,sendUpdate:()=>$e,spawn:()=>de,spawnBehavior:()=>he,t:()=>ke,toActorRef:()=>Ut,toEventObject:()=>it,toObserver:()=>at,toSCXMLEvent:()=>nt})
var n={}
i.r(n),i.d(n,{after:()=>b,assign:()=>y,cancel:()=>O,choose:()=>A,doneState:()=>w,error:()=>T,errorExecution:()=>Q,errorPlatform:()=>P,init:()=>S,invoke:()=>k,log:()=>x,nullEvent:()=>v,pure:()=>_,raise:()=>m,send:()=>g,start:()=>d,stop:()=>p,update:()=>$})
var s={}
i.r(s),i.d(s,{actionTypes:()=>n,after:()=>Ct,assign:()=>At,cancel:()=>Qt,choose:()=>Dt,done:()=>Et,doneInvoke:()=>Mt,error:()=>It,escalate:()=>Zt,forwardTo:()=>Rt,getActionFunction:()=>ct,initEvent:()=>ht,isActionObject:()=>_t,log:()=>St,pure:()=>Wt,raise:()=>pt,resolveActions:()=>Vt,resolveLog:()=>kt,resolveRaise:()=>mt,resolveSend:()=>Ot,resolveStop:()=>$t,respond:()=>wt,send:()=>gt,sendParent:()=>vt,sendTo:()=>yt,sendUpdate:()=>bt,start:()=>Pt,stop:()=>Tt,toActionObject:()=>ut,toActionObjects:()=>ft,toActivityDefinition:()=>dt})
var r,o,a=function(){return a=Object.assign||function(t){for(var e,i=1,n=arguments.length;i<n;i++)for(var s in e=arguments[i])Object.prototype.hasOwnProperty.call(e,s)&&(t[s]=e[s])
return t},a.apply(this,arguments)}
function l(t,e){var i={}
for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&e.indexOf(n)<0&&(i[n]=t[n])
if(null!=t&&"function"==typeof Object.getOwnPropertySymbols){var s=0
for(n=Object.getOwnPropertySymbols(t);s<n.length;s++)e.indexOf(n[s])<0&&Object.prototype.propertyIsEnumerable.call(t,n[s])&&(i[n[s]]=t[n[s]])}return i}function h(t){var e="function"==typeof Symbol&&Symbol.iterator,i=e&&t[e],n=0
if(i)return i.call(t)
if(t&&"number"==typeof t.length)return{next:function(){return t&&n>=t.length&&(t=void 0),{value:t&&t[n++],done:!t}}}
throw new TypeError(e?"Object is not iterable.":"Symbol.iterator is not defined.")}function c(t,e){var i="function"==typeof Symbol&&t[Symbol.iterator]
if(!i)return t
var n,s,r=i.call(t),o=[]
try{for(;(void 0===e||e-- >0)&&!(n=r.next()).done;)o.push(n.value)}catch(t){s={error:t}}finally{try{n&&!n.done&&(i=r.return)&&i.call(r)}finally{if(s)throw s.error}}return o}function u(t,e,i){if(i||2===arguments.length)for(var n,s=0,r=e.length;s<r;s++)!n&&s in e||(n||(n=Array.prototype.slice.call(e,0,s)),n[s]=e[s])
return t.concat(n||Array.prototype.slice.call(e))}!function(t){t.Start="xstate.start",t.Stop="xstate.stop",t.Raise="xstate.raise",t.Send="xstate.send",t.Cancel="xstate.cancel",t.NullEvent="",t.Assign="xstate.assign",t.After="xstate.after",t.DoneState="done.state",t.DoneInvoke="done.invoke",t.Log="xstate.log",t.Init="xstate.init",t.Invoke="xstate.invoke",t.ErrorExecution="error.execution",t.ErrorCommunication="error.communication",t.ErrorPlatform="error.platform",t.ErrorCustom="xstate.error",t.Update="xstate.update",t.Pure="xstate.pure",t.Choose="xstate.choose"}(r||(r={})),function(t){t.Parent="#_parent",t.Internal="#_internal"}(o||(o={}))
var f,d=r.Start,p=r.Stop,m=r.Raise,g=r.Send,O=r.Cancel,v=r.NullEvent,y=r.Assign,b=r.After,w=r.DoneState,x=r.Log,S=r.Init,k=r.Invoke,Q=r.ErrorExecution,P=r.ErrorPlatform,T=r.ErrorCustom,$=r.Update,A=r.Choose,_=r.Pure,C={},E="xstate.guard"
function M(t,e,i){void 0===i&&(i=".")
var n=R(t,i),s=R(e,i)
return H(s)?!!H(n)&&s===n:H(n)?n in s:Object.keys(n).every((function(t){return t in s&&M(n[t],s[t])}))}function I(t){try{return H(t)||"number"==typeof t?"".concat(t):t.type}catch(t){throw new Error("Events must be strings or objects with a string event.type property.")}}function W(t,e){try{return G(t)?t:t.toString().split(e)}catch(e){throw new Error("'".concat(t,"' is not a valid state path."))}}function R(t,e){return"object"==typeof(i=t)&&"value"in i&&"context"in i&&"event"in i&&"_event"in i?t.value:G(t)?Z(t):"string"!=typeof t?t:Z(W(t,e))
var i}function Z(t){if(1===t.length)return t[0]
for(var e={},i=e,n=0;n<t.length-1;n++)n===t.length-2?i[t[n]]=t[n+1]:(i[t[n]]={},i=i[t[n]])
return e}function D(t,e){for(var i={},n=Object.keys(t),s=0;s<n.length;s++){var r=n[s]
i[r]=e(t[r],r,t,s)}return i}function V(t,e,i){var n,s,r={}
try{for(var o=h(Object.keys(t)),a=o.next();!a.done;a=o.next()){var l=a.value,c=t[l]
i(c)&&(r[l]=e(c,l,t))}}catch(t){n={error:t}}finally{try{a&&!a.done&&(s=o.return)&&s.call(o)}finally{if(n)throw n.error}}return r}var X=function(t){return function(e){var i,n,s=e
try{for(var r=h(t),o=r.next();!o.done;o=r.next())s=s[o.value]}catch(t){i={error:t}}finally{try{o&&!o.done&&(n=r.return)&&n.call(r)}finally{if(i)throw i.error}}return s}}
function j(t){return t?H(t)?[[t]]:L(Object.keys(t).map((function(e){var i=t[e]
return"string"==typeof i||i&&Object.keys(i).length?j(t[e]).map((function(t){return[e].concat(t)})):[[e]]}))):[[]]}function L(t){var e
return(e=[]).concat.apply(e,u([],c(t),!1))}function N(t){return G(t)?t:[t]}function U(t){return void 0===t?[]:N(t)}function q(t,e,i){var n,s
if(F(t))return t(e,i.data)
var r={}
try{for(var o=h(Object.keys(t)),a=o.next();!a.done;a=o.next()){var l=a.value,c=t[l]
F(c)?r[l]=c(e,i.data):r[l]=c}}catch(t){n={error:t}}finally{try{a&&!a.done&&(s=o.return)&&s.call(o)}finally{if(n)throw n.error}}return r}function Y(t){return t instanceof Promise||!(null===t||!F(t)&&"object"!=typeof t||!F(t.then))}function z(t,e){return D(t.states,(function(t,i){if(t){var n=(H(e)?void 0:e[i])||(t?t.current:void 0)
if(n)return{current:n,states:z(t,n)}}}))}function B(t,e,i,n){var s=t?i.reduce((function(t,i){var s,r,o=i.assignment,a={state:n,action:i,_event:e},l={}
if(F(o))l=o(t,e.data,a)
else try{for(var c=h(Object.keys(o)),u=c.next();!u.done;u=c.next()){var f=u.value,d=o[f]
l[f]=F(d)?d(t,e.data,a):d}}catch(t){s={error:t}}finally{try{u&&!u.done&&(r=c.return)&&r.call(c)}finally{if(s)throw s.error}}return Object.assign({},t,l)}),t):t
return s}function G(t){return Array.isArray(t)}function F(t){return"function"==typeof t}function H(t){return"string"==typeof t}function K(t,e){if(t)return H(t)?{type:E,name:t,predicate:e?e[t]:void 0}:F(t)?{type:E,name:t.name,predicate:t}:t}var J="function"==typeof Symbol&&Symbol.observable||"@@observable"
function tt(t){return!!t&&"__xstatenode"in t}(f={})[J]=function(){return this},f[Symbol.observable]=function(){return this}
var et=function(){var t=0
return function(){return(++t).toString(16)}}()
function it(t,e){return H(t)||"number"==typeof t?a({type:t},e):t}function nt(t,e){if(!H(t)&&"$$type"in t&&"scxml"===t.$$type)return t
var i=it(t)
return a({name:i.type,data:i,$$type:"scxml",type:"external"},e)}function st(t,e){return N(e).map((function(e){return void 0===e||"string"==typeof e||tt(e)?{target:e,event:t}:a(a({},e),{event:t})}))}function rt(t,e,i,n,s){var r=t.options.guards,o={state:s,cond:e,_event:n}
if(e.type===E)return((null==r?void 0:r[e.name])||e.predicate)(i,n.data,o)
var a=null==r?void 0:r[e.type]
if(!a)throw new Error("Guard '".concat(e.type,"' is not implemented on machine '").concat(t.id,"'."))
return a(i,n.data,o)}function ot(t){return"string"==typeof t?{type:t}:t}function at(t,e,i){var n=function(){},s="object"==typeof t,r=s?t:null
return{next:((s?t.next:t)||n).bind(r),error:((s?t.error:e)||n).bind(r),complete:((s?t.complete:i)||n).bind(r)}}function lt(t,e){return"".concat(t,":invocation[").concat(e,"]")}var ht=nt({type:S})
function ct(t,e){return e&&e[t]||void 0}function ut(t,e){var i
if(H(t)||"number"==typeof t)i=F(n=ct(t,e))?{type:t,exec:n}:n||{type:t,exec:void 0}
else if(F(t))i={type:t.name||t.toString(),exec:t}
else{var n
if(F(n=ct(t.type,e)))i=a(a({},t),{exec:n})
else if(n){var s=n.type||t.type
i=a(a(a({},n),t),{type:s})}else i=t}return i}var ft=function(t,e){return t?(G(t)?t:[t]).map((function(t){return ut(t,e)})):[]}
function dt(t){var e=ut(t)
return a(a({id:H(t)?t:e.id},e),{type:e.type})}function pt(t){return H(t)?{type:m,event:t}:gt(t,{to:o.Internal})}function mt(t){return{type:m,_event:nt(t.event)}}function gt(t,e){return{to:e?e.to:void 0,type:g,event:F(t)?t:it(t),delay:e?e.delay:void 0,id:e&&void 0!==e.id?e.id:F(t)?t.name:I(t)}}function Ot(t,e,i,n){var s,r={_event:i},o=nt(F(t.event)?t.event(e,i.data,r):t.event)
if(H(t.delay)){var l=n&&n[t.delay]
s=F(l)?l(e,i.data,r):l}else s=F(t.delay)?t.delay(e,i.data,r):t.delay
var h=F(t.to)?t.to(e,i.data,r):t.to
return a(a({},t),{to:h,_event:o,event:o.data,delay:s})}function vt(t,e){return gt(t,a(a({},e),{to:o.Parent}))}function yt(t,e,i){return gt(e,a(a({},i),{to:t}))}function bt(){return vt($)}function wt(t,e){return gt(t,a(a({},e),{to:function(t,e,i){return i._event.origin}}))}var xt=function(t,e){return{context:t,event:e}}
function St(t,e){return void 0===t&&(t=xt),{type:x,label:e,expr:t}}var kt=function(t,e,i){return a(a({},t),{value:H(t.expr)?t.expr:t.expr(e,i.data,{_event:i})})},Qt=function(t){return{type:O,sendId:t}}
function Pt(t){var e=dt(t)
return{type:r.Start,activity:e,exec:void 0}}function Tt(t){var e=F(t)?t:dt(t)
return{type:r.Stop,activity:e,exec:void 0}}function $t(t,e,i){var n=F(t.activity)?t.activity(e,i.data):t.activity,s="string"==typeof n?{id:n}:n
return{type:r.Stop,activity:s}}var At=function(t){return{type:y,assignment:t}}
function _t(t){return"object"==typeof t&&"type"in t}function Ct(t,e){var i=e?"#".concat(e):""
return"".concat(r.After,"(").concat(t,")").concat(i)}function Et(t,e){var i="".concat(r.DoneState,".").concat(t)
return{type:i,data:e,toString:function(){return i}}}function Mt(t,e){var i="".concat(r.DoneInvoke,".").concat(t)
return{type:i,data:e,toString:function(){return i}}}function It(t,e){var i="".concat(r.ErrorPlatform,".").concat(t)
return{type:i,data:e,toString:function(){return i}}}function Wt(t){return{type:r.Pure,get:t}}function Rt(t,e){return gt((function(t,e){return e}),a(a({},e),{to:t}))}function Zt(t,e){return vt((function(e,i,n){return{type:T,data:F(t)?t(e,i,n):t}}),a(a({},e),{to:o.Parent}))}function Dt(t){return{type:r.Choose,conds:t}}function Vt(t,e,i,n,s,r,l){void 0===l&&(l=!1)
var f=l?[]:function(t){var e,i,n=[]
try{for(var s=h(t),r=s.next();!r.done;r=s.next())for(var o=r.value,a=0;a<o.length;)o[a].type!==y?a++:(n.push(o[a]),o.splice(a,1))}catch(t){e={error:t}}finally{try{r&&!r.done&&(i=s.return)&&i.call(s)}finally{if(e)throw e.error}}return n}(s),d=f.length?B(i,n,f,e):i,O=l?[i]:void 0,v=[]
function b(s){var h
switch(s.type){case m:return mt(s)
case g:var f=Ot(s,d,n,t.options.delays)
return r&&f.to!==o.Internal&&v.push(f),f
case x:var b=kt(s,d,n)
return null==r||r(b,d,n),b
case A:if(!(Q=null===(h=s.conds.find((function(i){var s=K(i.cond,t.options.guards)
return!s||rt(t,s,d,n,r?void 0:e)})))||void 0===h?void 0:h.actions))return[]
var w=c(Vt(t,e,d,n,[ft(U(Q),t.options.actions)],r,l),2),S=w[0],k=w[1]
return d=k,null==O||O.push(d),S
case _:var Q
if(!(Q=s.get(d,n.data)))return[]
var P=c(Vt(t,e,d,n,[ft(U(Q),t.options.actions)],r,l),2),T=P[0],$=P[1]
return d=$,null==O||O.push(d),T
case p:return b=$t(s,d,n),null==r||r(b,i,n),b
case y:d=B(d,n,[s],r?void 0:e),null==O||O.push(d)
break
default:var C=ut(s,t.options.actions),E=C.exec
if(r)r(C,d,n)
else if(E&&O){var M=O.length-1
C=a(a({},C),{exec:function(t){for(var e=[],i=1;i<arguments.length;i++)e[i-1]=arguments[i]
E.apply(void 0,u([O[M]],c(e),!1))}})}return C}}var w=L(s.map((function(t){var e,i,s=[]
try{for(var o=h(t),a=o.next();!a.done;a=o.next()){var l=b(a.value)
l&&(s=s.concat(l))}}catch(t){e={error:t}}finally{try{a&&!a.done&&(i=o.return)&&i.call(o)}finally{if(e)throw e.error}}return v.forEach((function(t){r(t,d,n)})),v.length=0,s})))
return[w,d]}var Xt=[],jt=function(t,e){Xt.push(t)
var i=e(t)
return Xt.pop(),i}
function Lt(t){var e
return(e={id:t,send:function(){},subscribe:function(){return{unsubscribe:function(){}}},getSnapshot:function(){},toJSON:function(){return{id:t}}})[J]=function(){return this},e}function Nt(t,e,i){var n=Lt(e)
if(n.deferred=!0,tt(t)){var s=n.state=jt(void 0,(function(){return(i?t.withContext(i):t).initialState}))
n.getSnapshot=function(){return s}}return n}function Ut(t){var e
return a(((e={subscribe:function(){return{unsubscribe:function(){}}},id:"anonymous",getSnapshot:function(){}})[J]=function(){return this},e),t)}var qt=function(t){return"atomic"===t.type||"final"===t.type}
function Yt(t){return Object.keys(t.states).map((function(e){return t.states[e]}))}function zt(t){return Yt(t).filter((function(t){return"history"!==t.type}))}function Bt(t){var e=[t]
return qt(t)?e:e.concat(L(zt(t).map(Bt)))}function Gt(t,e){var i,n,s,r,o,a,l,c,u=Ht(new Set(t)),f=new Set(e)
try{for(var d=h(f),p=d.next();!p.done;p=d.next())for(var m=(k=p.value).parent;m&&!f.has(m);)f.add(m),m=m.parent}catch(t){i={error:t}}finally{try{p&&!p.done&&(n=d.return)&&n.call(d)}finally{if(i)throw i.error}}var g=Ht(f)
try{for(var O=h(f),v=O.next();!v.done;v=O.next())if("compound"!==(k=v.value).type||g.get(k)&&g.get(k).length){if("parallel"===k.type)try{for(var y=(o=void 0,h(zt(k))),b=y.next();!b.done;b=y.next()){var w=b.value
f.has(w)||(f.add(w),u.get(w)?u.get(w).forEach((function(t){return f.add(t)})):w.initialStateNodes.forEach((function(t){return f.add(t)})))}}catch(t){o={error:t}}finally{try{b&&!b.done&&(a=y.return)&&a.call(y)}finally{if(o)throw o.error}}}else u.get(k)?u.get(k).forEach((function(t){return f.add(t)})):k.initialStateNodes.forEach((function(t){return f.add(t)}))}catch(t){s={error:t}}finally{try{v&&!v.done&&(r=O.return)&&r.call(O)}finally{if(s)throw s.error}}try{for(var x=h(f),S=x.next();!S.done;S=x.next()){var k
for(m=(k=S.value).parent;m&&!f.has(m);)f.add(m),m=m.parent}}catch(t){l={error:t}}finally{try{S&&!S.done&&(c=x.return)&&c.call(x)}finally{if(l)throw l.error}}return f}function Ft(t,e){var i=e.get(t)
if(!i)return{}
if("compound"===t.type){var n=i[0]
if(!n)return{}
if(qt(n))return n.key}var s={}
return i.forEach((function(t){s[t.key]=Ft(t,e)})),s}function Ht(t){var e,i,n=new Map
try{for(var s=h(t),r=s.next();!r.done;r=s.next()){var o=r.value
n.has(o)||n.set(o,[]),o.parent&&(n.has(o.parent)||n.set(o.parent,[]),n.get(o.parent).push(o))}}catch(t){e={error:t}}finally{try{r&&!r.done&&(i=s.return)&&i.call(s)}finally{if(e)throw e.error}}return n}function Kt(t,e){return Ft(t,Ht(Gt([t],e)))}function Jt(t,e){return Array.isArray(t)?t.some((function(t){return t===e})):t instanceof Set&&t.has(e)}function te(t,e){return"compound"===e.type?zt(e).some((function(e){return"final"===e.type&&Jt(t,e)})):"parallel"===e.type&&zt(e).every((function(e){return te(t,e)}))}function ee(t){return new Set(L(t.map((function(t){return t.tags}))))}function ie(t,e){if(t===e)return!0
if(void 0===t||void 0===e)return!1
if(H(t)||H(e))return t===e
var i=Object.keys(t),n=Object.keys(e)
return i.length===n.length&&i.every((function(i){return ie(t[i],e[i])}))}var ne=function(){function t(t){var e,i,n=this
this.actions=[],this.activities=C,this.meta={},this.events=[],this.value=t.value,this.context=t.context,this._event=t._event,this._sessionid=t._sessionid,this.event=this._event.data,this.historyValue=t.historyValue,this.history=t.history,this.actions=t.actions||[],this.activities=t.activities||C,this.meta=(void 0===(i=t.configuration)&&(i=[]),i.reduce((function(t,e){return void 0!==e.meta&&(t[e.id]=e.meta),t}),{})),this.events=t.events||[],this.matches=this.matches.bind(this),this.toStrings=this.toStrings.bind(this),this.configuration=t.configuration,this.transitions=t.transitions,this.children=t.children,this.done=!!t.done,this.tags=null!==(e=Array.isArray(t.tags)?new Set(t.tags):t.tags)&&void 0!==e?e:new Set,this.machine=t.machine,Object.defineProperty(this,"nextEvents",{get:function(){return function(t){return u([],c(new Set(L(u([],c(t.map((function(t){return t.ownEvents}))),!1)))),!1)}(n.configuration)}})}return t.from=function(e,i){return e instanceof t?e.context!==i?new t({value:e.value,context:i,_event:e._event,_sessionid:null,historyValue:e.historyValue,history:e.history,actions:[],activities:e.activities,meta:{},events:[],configuration:[],transitions:[],children:{}}):e:new t({value:e,context:i,_event:ht,_sessionid:null,historyValue:void 0,history:void 0,actions:[],activities:void 0,meta:void 0,events:[],configuration:[],transitions:[],children:{}})},t.create=function(e){return new t(e)},t.inert=function(e,i){if(e instanceof t){if(!e.actions.length)return e
var n=ht
return new t({value:e.value,context:i,_event:n,_sessionid:null,historyValue:e.historyValue,history:e.history,activities:e.activities,configuration:e.configuration,transitions:[],children:{}})}return t.from(e,i)},t.prototype.toStrings=function(t,e){var i=this
if(void 0===t&&(t=this.value),void 0===e&&(e="."),H(t))return[t]
var n=Object.keys(t)
return n.concat.apply(n,u([],c(n.map((function(n){return i.toStrings(t[n],e).map((function(t){return n+e+t}))}))),!1))},t.prototype.toJSON=function(){var t=this
t.configuration,t.transitions
var e=t.tags
t.machine
var i=l(t,["configuration","transitions","tags","machine"])
return a(a({},i),{tags:Array.from(e)})},t.prototype.matches=function(t){return M(t,this.value)},t.prototype.hasTag=function(t){return this.tags.has(t)},t.prototype.can=function(t){var e
this.machine
var i=null===(e=this.machine)||void 0===e?void 0:e.getTransitionData(this,t)
return!!(null==i?void 0:i.transitions.length)&&i.transitions.some((function(t){return void 0!==t.target||t.actions.length}))},t}(),se={deferEvents:!1},re=function(){function t(t){this.processingEvent=!1,this.queue=[],this.initialized=!1,this.options=a(a({},se),t)}return t.prototype.initialize=function(t){if(this.initialized=!0,t){if(!this.options.deferEvents)return void this.schedule(t)
this.process(t)}this.flushEvents()},t.prototype.schedule=function(t){if(this.initialized&&!this.processingEvent){if(0!==this.queue.length)throw new Error("Event queue should be empty when it is not processing events")
this.process(t),this.flushEvents()}else this.queue.push(t)},t.prototype.clear=function(){this.queue=[]},t.prototype.flushEvents=function(){for(var t=this.queue.shift();t;)this.process(t),t=this.queue.shift()},t.prototype.process=function(t){this.processingEvent=!0
try{t()}catch(t){throw this.clear(),t}finally{this.processingEvent=!1}},t}(),oe=new Map,ae=0
function le(){return"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:void 0}function he(t,e){void 0===e&&(e={})
var i=t.initialState,n=new Set,s=[],r=!1,o=Ut({id:e.id,send:function(e){s.push(e),function(){if(!r){for(r=!0;s.length>0;){var e=s.shift()
i=t.transition(i,e,a),n.forEach((function(t){return t.next(i)}))}r=!1}}()},getSnapshot:function(){return i},subscribe:function(t,e,s){var r=at(t,e,s)
return n.add(r),r.next(i),{unsubscribe:function(){n.delete(r)}}}}),a={parent:e.parent,self:o,id:e.id||"anonymous",observers:n}
return i=t.start?t.start(a):i,o}var ce,ue={sync:!1,autoForward:!1}
!function(t){t[t.NotStarted=0]="NotStarted",t[t.Running=1]="Running",t[t.Stopped=2]="Stopped"}(ce||(ce={}))
var fe=function(){function t(e,i){void 0===i&&(i=t.defaultOptions)
var n=this
this.machine=e,this.delayedEventsMap={},this.listeners=new Set,this.contextListeners=new Set,this.stopListeners=new Set,this.doneListeners=new Set,this.eventListeners=new Set,this.sendListeners=new Set,this.initialized=!1,this.status=ce.NotStarted,this.children=new Map,this.forwardTo=new Set,this._outgoingQueue=[],this.init=this.start,this.send=function(t,e){if(G(t))return n.batch(t),n.state
var i=nt(it(t,e))
if(n.status===ce.Stopped)return n.state
if(n.status!==ce.Running&&!n.options.deferEvents)throw new Error('Event "'.concat(i.name,'" was sent to uninitialized service "').concat(n.machine.id,'". Make sure .start() is called for this service, or set { deferEvents: true } in the service options.\nEvent: ').concat(JSON.stringify(i.data)))
return n.scheduler.schedule((function(){n.forward(i)
var t=n._nextState(i)
n.update(t,i)})),n._state},this.sendTo=function(t,e,i){var s,r=n.parent&&(e===o.Parent||n.parent.id===e),l=r?n.parent:H(e)?n.children.get(e)||function(t){return oe.get(t)}(e):(s=e)&&"function"==typeof s.send?e:void 0
if(l)if("machine"in l){if(n.status!==ce.Stopped||n.parent!==l||n.state.done){var h=a(a({},t),{name:t.name===T?"".concat(It(n.id)):t.name,origin:n.sessionId})
!i&&n.machine.config.predictableActionArguments?n._outgoingQueue.push([l,h]):l.send(h)}}else!i&&n.machine.config.predictableActionArguments?n._outgoingQueue.push([l,t.data]):l.send(t.data)
else if(!r)throw new Error("Unable to send event to child '".concat(e,"' from service '").concat(n.id,"'."))},this._exec=function(t,e,i,s){void 0===s&&(s=n.machine.options.actions)
var o=t.exec||ct(t.type,s),a=F(o)?o:o?o.exec:t.exec
if(a)try{return a(e,i.data,n.machine.config.predictableActionArguments?{action:t,_event:i}:{action:t,state:n.state,_event:i})}catch(t){throw n.parent&&n.parent.send({type:"xstate.error",data:t}),t}switch(t.type){case g:var l=t
if("number"==typeof l.delay)return void n.defer(l)
l.to?n.sendTo(l._event,l.to,i===ht):n.send(l._event)
break
case O:n.cancel(t.sendId)
break
case d:if(n.status!==ce.Running)return
var h=t.activity
if(!n.machine.config.predictableActionArguments&&!n.state.activities[h.id||h.type])break
if(h.type===r.Invoke){var c=ot(h.src),u=n.machine.options.services?n.machine.options.services[c.type]:void 0,f=h.id,m=h.data,v="autoForward"in h?h.autoForward:!!h.forward
if(!u)return
var y=m?q(m,e,i):void 0
if("string"==typeof u)return
var b=F(u)?u(e,i.data,{data:y,src:c,meta:h.meta}):u
if(!b)return
var w=void 0
tt(b)&&(b=y?b.withContext(y):b,w={autoForward:v}),n.spawn(b,f,w)}else n.spawnActivity(h)
break
case p:n.stopChild(t.activity.id)
break
case x:var S=t.label,k=t.value
S?n.logger(S,k):n.logger(k)}}
var s=a(a({},t.defaultOptions),i),l=s.clock,h=s.logger,c=s.parent,u=s.id,f=void 0!==u?u:e.id
this.id=f,this.logger=h,this.clock=l,this.parent=c,this.options=s,this.scheduler=new re({deferEvents:this.options.deferEvents}),this.sessionId="x:".concat(ae++)}return Object.defineProperty(t.prototype,"initialState",{get:function(){var t=this
return this._initialState?this._initialState:jt(this,(function(){return t._initialState=t.machine.initialState,t._initialState}))},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"state",{get:function(){return this._state},enumerable:!1,configurable:!0}),t.prototype.execute=function(t,e){var i,n
try{for(var s=h(t.actions),r=s.next();!r.done;r=s.next()){var o=r.value
this.exec(o,t,e)}}catch(t){i={error:t}}finally{try{r&&!r.done&&(n=s.return)&&n.call(s)}finally{if(i)throw i.error}}},t.prototype.update=function(t,e){var i,n,s,r,o,a,l,c,u=this
if(t._sessionid=this.sessionId,this._state=t,this.machine.config.predictableActionArguments&&e!==ht||!this.options.execute)for(var f=void 0;f=this._outgoingQueue.shift();)f[0].send(f[1])
else this.execute(this.state)
if(this.children.forEach((function(t){u.state.children[t.id]=t})),this.devTools&&this.devTools.send(e.data,t),t.event)try{for(var d=h(this.eventListeners),p=d.next();!p.done;p=d.next())(0,p.value)(t.event)}catch(t){i={error:t}}finally{try{p&&!p.done&&(n=d.return)&&n.call(d)}finally{if(i)throw i.error}}try{for(var m=h(this.listeners),g=m.next();!g.done;g=m.next())(0,g.value)(t,t.event)}catch(t){s={error:t}}finally{try{g&&!g.done&&(r=m.return)&&r.call(m)}finally{if(s)throw s.error}}try{for(var O=h(this.contextListeners),v=O.next();!v.done;v=O.next())(0,v.value)(this.state.context,this.state.history?this.state.history.context:void 0)}catch(t){o={error:t}}finally{try{v&&!v.done&&(a=O.return)&&a.call(O)}finally{if(o)throw o.error}}if(this.state.done){var y=t.configuration.find((function(t){return"final"===t.type&&t.parent===u.machine})),b=y&&y.doneData?q(y.doneData,t.context,e):void 0
try{for(var w=h(this.doneListeners),x=w.next();!x.done;x=w.next())(0,x.value)(Mt(this.id,b))}catch(t){l={error:t}}finally{try{x&&!x.done&&(c=w.return)&&c.call(w)}finally{if(l)throw l.error}}this._stop(),this._stopChildren()}},t.prototype.onTransition=function(t){return this.listeners.add(t),this.status===ce.Running&&t(this.state,this.state.event),this},t.prototype.subscribe=function(t,e,i){var n=this,s=at(t,e,i)
this.listeners.add(s.next),this.status!==ce.NotStarted&&s.next(this.state)
var r=function(){n.doneListeners.delete(r),n.stopListeners.delete(r),s.complete()}
return this.status===ce.Stopped?s.complete():(this.onDone(r),this.onStop(r)),{unsubscribe:function(){n.listeners.delete(s.next),n.doneListeners.delete(r),n.stopListeners.delete(r)}}},t.prototype.onEvent=function(t){return this.eventListeners.add(t),this},t.prototype.onSend=function(t){return this.sendListeners.add(t),this},t.prototype.onChange=function(t){return this.contextListeners.add(t),this},t.prototype.onStop=function(t){return this.stopListeners.add(t),this},t.prototype.onDone=function(t){return this.doneListeners.add(t),this},t.prototype.off=function(t){return this.listeners.delete(t),this.eventListeners.delete(t),this.sendListeners.delete(t),this.stopListeners.delete(t),this.doneListeners.delete(t),this.contextListeners.delete(t),this},t.prototype.start=function(t){var e,i=this
if(this.status===ce.Running)return this
this.machine._init(),e=this.sessionId,oe.set(e,this),this.initialized=!0,this.status=ce.Running
var n=void 0===t?this.initialState:jt(this,(function(){return"object"==typeof(e=t)&&null!==e&&"value"in e&&"_event"in e?i.machine.resolveState(t):i.machine.resolveState(ne.from(t,i.machine.context))
var e}))
return this.options.devTools&&this.attachDev(),this.scheduler.initialize((function(){i.update(n,ht)})),this},t.prototype._stopChildren=function(){this.children.forEach((function(t){F(t.stop)&&t.stop()})),this.children.clear()},t.prototype._stop=function(){var t,e,i,n,s,r,o,a,l,c
try{for(var u=h(this.listeners),f=u.next();!f.done;f=u.next()){var d=f.value
this.listeners.delete(d)}}catch(e){t={error:e}}finally{try{f&&!f.done&&(e=u.return)&&e.call(u)}finally{if(t)throw t.error}}try{for(var p=h(this.stopListeners),m=p.next();!m.done;m=p.next())(d=m.value)(),this.stopListeners.delete(d)}catch(t){i={error:t}}finally{try{m&&!m.done&&(n=p.return)&&n.call(p)}finally{if(i)throw i.error}}try{for(var g=h(this.contextListeners),O=g.next();!O.done;O=g.next())d=O.value,this.contextListeners.delete(d)}catch(t){s={error:t}}finally{try{O&&!O.done&&(r=g.return)&&r.call(g)}finally{if(s)throw s.error}}try{for(var v=h(this.doneListeners),y=v.next();!y.done;y=v.next())d=y.value,this.doneListeners.delete(d)}catch(t){o={error:t}}finally{try{y&&!y.done&&(a=v.return)&&a.call(v)}finally{if(o)throw o.error}}if(!this.initialized)return this
this.initialized=!1,this.status=ce.Stopped,this._initialState=void 0
try{for(var b=h(Object.keys(this.delayedEventsMap)),w=b.next();!w.done;w=b.next()){var x=w.value
this.clock.clearTimeout(this.delayedEventsMap[x])}}catch(t){l={error:t}}finally{try{w&&!w.done&&(c=b.return)&&c.call(b)}finally{if(l)throw l.error}}this.scheduler.clear(),this.scheduler=new re({deferEvents:this.options.deferEvents})},t.prototype.stop=function(){var t=this,e=this.scheduler
return this._stop(),e.schedule((function(){var e,i=nt({type:"xstate.stop"}),n=jt(t,(function(){var e=L(u([],c(t.state.configuration),!1).sort((function(t,e){return e.order-t.order})).map((function(e){return ft(e.onExit,t.machine.options.actions)}))),n=c(Vt(t.machine,t.state,t.state.context,i,[e],t.machine.config.predictableActionArguments?t._exec:void 0,t.machine.config.predictableActionArguments||t.machine.config.preserveActionOrder),2),s=n[0],r=n[1],a=new ne({value:t.state.value,context:r,_event:i,_sessionid:t.sessionId,historyValue:void 0,history:t.state,actions:s.filter((function(t){return t.type!==m&&(t.type!==g||!!t.to&&t.to!==o.Internal)})),activities:{},events:[],configuration:[],transitions:[],children:{},done:t.state.done,tags:t.state.tags,machine:t.machine})
return a.changed=!0,a}))
t.update(n,i),t._stopChildren(),e=t.sessionId,oe.delete(e)})),this},t.prototype.batch=function(t){var e=this
if(this.status===ce.NotStarted&&this.options.deferEvents);else if(this.status!==ce.Running)throw new Error("".concat(t.length,' event(s) were sent to uninitialized service "').concat(this.machine.id,'". Make sure .start() is called for this service, or set { deferEvents: true } in the service options.'))
if(t.length){var i=!!this.machine.config.predictableActionArguments&&this._exec
this.scheduler.schedule((function(){var n,s,r=e.state,o=!1,l=[],f=function(t){var n=nt(t)
e.forward(n),r=jt(e,(function(){return e.machine.transition(r,n,void 0,i||void 0)})),l.push.apply(l,u([],c(e.machine.config.predictableActionArguments?r.actions:r.actions.map((function(t){return function(t,e){var i=t.exec
return a(a({},t),{exec:void 0!==i?function(){return i(e.context,e.event,{action:t,state:e,_event:e._event})}:void 0})}(t,r)}))),!1)),o=o||!!r.changed}
try{for(var d=h(t),p=d.next();!p.done;p=d.next())f(p.value)}catch(t){n={error:t}}finally{try{p&&!p.done&&(s=d.return)&&s.call(d)}finally{if(n)throw n.error}}r.changed=o,r.actions=l,e.update(r,nt(t[t.length-1]))}))}},t.prototype.sender=function(t){return this.send.bind(this,t)},t.prototype._nextState=function(t,e){var i=this
void 0===e&&(e=!!this.machine.config.predictableActionArguments&&this._exec)
var n=nt(t)
if(0===n.name.indexOf(P)&&!this.state.nextEvents.some((function(t){return 0===t.indexOf(P)})))throw n.data.data
return jt(this,(function(){return i.machine.transition(i.state,n,void 0,e||void 0)}))},t.prototype.nextState=function(t){return this._nextState(t,!1)},t.prototype.forward=function(t){var e,i
try{for(var n=h(this.forwardTo),s=n.next();!s.done;s=n.next()){var r=s.value,o=this.children.get(r)
if(!o)throw new Error("Unable to forward event '".concat(t,"' from interpreter '").concat(this.id,"' to nonexistant child '").concat(r,"'."))
o.send(t)}}catch(t){e={error:t}}finally{try{s&&!s.done&&(i=n.return)&&i.call(n)}finally{if(e)throw e.error}}},t.prototype.defer=function(t){var e=this
this.delayedEventsMap[t.id]=this.clock.setTimeout((function(){t.to?e.sendTo(t._event,t.to,!0):e.send(t._event)}),t.delay)},t.prototype.cancel=function(t){this.clock.clearTimeout(this.delayedEventsMap[t]),delete this.delayedEventsMap[t]},t.prototype.exec=function(t,e,i){void 0===i&&(i=this.machine.options.actions),this._exec(t,e.context,e._event,i)},t.prototype.removeChild=function(t){var e
this.children.delete(t),this.forwardTo.delete(t),null===(e=this.state)||void 0===e||delete e.children[t]},t.prototype.stopChild=function(t){var e=this.children.get(t)
e&&(this.removeChild(t),F(e.stop)&&e.stop())},t.prototype.spawn=function(t,e,i){if(this.status!==ce.Running)return Nt(t,e)
if(Y(t))return this.spawnPromise(Promise.resolve(t),e)
if(F(t))return this.spawnCallback(t,e)
if(function(t){try{return"function"==typeof t.send}catch(t){return!1}}(s=t)&&"id"in s)return this.spawnActor(t,e)
if(function(t){try{return"subscribe"in t&&F(t.subscribe)}catch(t){return!1}}(t))return this.spawnObservable(t,e)
if(tt(t))return this.spawnMachine(t,a(a({},i),{id:e}))
if(null!==(n=t)&&"object"==typeof n&&"transition"in n&&"function"==typeof n.transition)return this.spawnBehavior(t,e)
throw new Error('Unable to spawn entity "'.concat(e,'" of type "').concat(typeof t,'".'))
var n,s},t.prototype.spawnMachine=function(e,i){var n=this
void 0===i&&(i={})
var s=new t(e,a(a({},this.options),{parent:this,id:i.id||e.id})),r=a(a({},ue),i)
r.sync&&s.onTransition((function(t){n.send($,{state:t,id:s.id})}))
var o=s
return this.children.set(s.id,o),r.autoForward&&this.forwardTo.add(s.id),s.onDone((function(t){n.removeChild(s.id),n.send(nt(t,{origin:s.id}))})).start(),o},t.prototype.spawnBehavior=function(t,e){var i=he(t,{id:e,parent:this})
return this.children.set(e,i),i},t.prototype.spawnPromise=function(t,e){var i,n,s=this,r=!1
t.then((function(t){r||(n=t,s.removeChild(e),s.send(nt(Mt(e,t),{origin:e})))}),(function(t){if(!r){s.removeChild(e)
var i=It(e,t)
try{s.send(nt(i,{origin:e}))}catch(t){s.devTools&&s.devTools.send(i,s.state),s.machine.strict&&s.stop()}}}))
var o=((i={id:e,send:function(){},subscribe:function(e,i,n){var s=at(e,i,n),r=!1
return t.then((function(t){r||(s.next(t),r||s.complete())}),(function(t){r||s.error(t)})),{unsubscribe:function(){return r=!0}}},stop:function(){r=!0},toJSON:function(){return{id:e}},getSnapshot:function(){return n}})[J]=function(){return this},i)
return this.children.set(e,o),o},t.prototype.spawnCallback=function(t,e){var i,n,s,r=this,o=!1,a=new Set,l=new Set
try{s=t((function(t){n=t,l.forEach((function(e){return e(t)})),o||r.send(nt(t,{origin:e}))}),(function(t){a.add(t)}))}catch(t){this.send(It(e,t))}if(Y(s))return this.spawnPromise(s,e)
var h=((i={id:e,send:function(t){return a.forEach((function(e){return e(t)}))},subscribe:function(t){var e=at(t)
return l.add(e.next),{unsubscribe:function(){l.delete(e.next)}}},stop:function(){o=!0,F(s)&&s()},toJSON:function(){return{id:e}},getSnapshot:function(){return n}})[J]=function(){return this},i)
return this.children.set(e,h),h},t.prototype.spawnObservable=function(t,e){var i,n,s=this,r=t.subscribe((function(t){n=t,s.send(nt(t,{origin:e}))}),(function(t){s.removeChild(e),s.send(nt(It(e,t),{origin:e}))}),(function(){s.removeChild(e),s.send(nt(Mt(e),{origin:e}))})),o=((i={id:e,send:function(){},subscribe:function(e,i,n){return t.subscribe(e,i,n)},stop:function(){return r.unsubscribe()},getSnapshot:function(){return n},toJSON:function(){return{id:e}}})[J]=function(){return this},i)
return this.children.set(e,o),o},t.prototype.spawnActor=function(t,e){return this.children.set(e,t),t},t.prototype.spawnActivity=function(t){var e=this.machine.options&&this.machine.options.activities?this.machine.options.activities[t.type]:void 0
if(e){var i=e(this.state.context,t)
this.spawnEffect(t.id,i)}},t.prototype.spawnEffect=function(t,e){var i
this.children.set(t,((i={id:t,send:function(){},subscribe:function(){return{unsubscribe:function(){}}},stop:e||void 0,getSnapshot:function(){},toJSON:function(){return{id:t}}})[J]=function(){return this},i))},t.prototype.attachDev=function(){var t=le()
if(this.options.devTools&&t){if(t.__REDUX_DEVTOOLS_EXTENSION__){var e="object"==typeof this.options.devTools?this.options.devTools:void 0
this.devTools=t.__REDUX_DEVTOOLS_EXTENSION__.connect(a(a({name:this.id,autoPause:!0,stateSanitizer:function(t){return{value:t.value,context:t.context,actions:t.actions}}},e),{features:a({jump:!1,skip:!1},e?e.features:void 0)}),this.machine),this.devTools.init(this.state)}!function(t){if(le()){var e=function(){var t=le()
if(t&&"__xstate__"in t)return t.__xstate__}()
e&&e.register(t)}}(this)}},t.prototype.toJSON=function(){return{id:this.id}},t.prototype[J]=function(){return this},t.prototype.getSnapshot=function(){return this.status===ce.NotStarted?this.initialState:this._state},t.defaultOptions={execute:!0,deferEvents:!0,clock:{setTimeout:function(t,e){return setTimeout(t,e)},clearTimeout:function(t){return clearTimeout(t)}},logger:console.log.bind(console),devTools:!1},t.interpret=pe,t}()
function de(t,e){var i,n=function(t){return H(t)?a(a({},ue),{name:t}):a(a(a({},ue),{name:et()}),t)}(e)
return(i=Xt[Xt.length-1])?i.spawn(t,n.name,n):Nt(t,n.name)}function pe(t,e){return new fe(t,e)}function me(t){return a(a({type:k},t),{toJSON:function(){t.onDone,t.onError
var e,i=l(t,["onDone","onError"])
return a(a({},i),{type:k,src:(e=t.src,"string"==typeof e?{type:e,toString:function(){return e}}:e)})}})}var ge={},Oe=function(t){return"#"===t[0]},ve=function(){function t(e,i,n,s){void 0===n&&(n="context"in e?e.context:void 0)
var r,o=this
this.config=e,this._context=n,this.order=-1,this.__xstatenode=!0,this.__cache={events:void 0,relativeValue:new Map,initialStateValue:void 0,initialState:void 0,on:void 0,transitions:void 0,candidates:{},delayedTransitions:void 0},this.idMap={},this.tags=[],this.options=Object.assign({actions:{},guards:{},services:{},activities:{},delays:{}},i),this.parent=null==s?void 0:s.parent,this.key=this.config.key||(null==s?void 0:s.key)||this.config.id||"(machine)",this.machine=this.parent?this.parent.machine:this,this.path=this.parent?this.parent.path.concat(this.key):[],this.delimiter=this.config.delimiter||(this.parent?this.parent.delimiter:"."),this.id=this.config.id||u([this.machine.key],c(this.path),!1).join(this.delimiter),this.version=this.parent?this.parent.version:this.config.version,this.type=this.config.type||(this.config.parallel?"parallel":this.config.states&&Object.keys(this.config.states).length?"compound":this.config.history?"history":"atomic"),this.schema=this.parent?this.machine.schema:null!==(r=this.config.schema)&&void 0!==r?r:{},this.description=this.config.description,this.initial=this.config.initial,this.states=this.config.states?D(this.config.states,(function(e,i){var n,s=new t(e,{},void 0,{parent:o,key:i})
return Object.assign(o.idMap,a(((n={})[s.id]=s,n),s.idMap)),s})):ge
var l=0
!function t(e){var i,n
e.order=l++
try{for(var s=h(Yt(e)),r=s.next();!r.done;r=s.next())t(r.value)}catch(t){i={error:t}}finally{try{r&&!r.done&&(n=s.return)&&n.call(s)}finally{if(i)throw i.error}}}(this),this.history=!0===this.config.history?"shallow":this.config.history||!1,this._transient=!!this.config.always||!!this.config.on&&(Array.isArray(this.config.on)?this.config.on.some((function(t){return""===t.event})):""in this.config.on),this.strict=!!this.config.strict,this.onEntry=U(this.config.entry||this.config.onEntry).map((function(t){return ut(t)})),this.onExit=U(this.config.exit||this.config.onExit).map((function(t){return ut(t)})),this.meta=this.config.meta,this.doneData="final"===this.type?this.config.data:void 0,this.invoke=U(this.config.invoke).map((function(t,e){var i,n
if(tt(t)){var s=lt(o.id,e)
return o.machine.options.services=a(((i={})[s]=t,i),o.machine.options.services),me({src:s,id:s})}if(H(t.src))return s=t.id||lt(o.id,e),me(a(a({},t),{id:s,src:t.src}))
if(tt(t.src)||F(t.src))return s=t.id||lt(o.id,e),o.machine.options.services=a(((n={})[s]=t.src,n),o.machine.options.services),me(a(a({id:s},t),{src:s}))
var r=t.src
return me(a(a({id:lt(o.id,e)},t),{src:r}))})),this.activities=U(this.config.activities).concat(this.invoke).map((function(t){return dt(t)})),this.transition=this.transition.bind(this),this.tags=U(this.config.tags)}return t.prototype._init=function(){this.__cache.transitions||Bt(this).forEach((function(t){return t.on}))},t.prototype.withConfig=function(e,i){var n=this.options,s=n.actions,r=n.activities,o=n.guards,l=n.services,h=n.delays
return new t(this.config,{actions:a(a({},s),e.actions),activities:a(a({},r),e.activities),guards:a(a({},o),e.guards),services:a(a({},l),e.services),delays:a(a({},h),e.delays)},null!=i?i:this.context)},t.prototype.withContext=function(e){return new t(this.config,this.options,e)},Object.defineProperty(t.prototype,"context",{get:function(){return F(this._context)?this._context():this._context},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"definition",{get:function(){return{id:this.id,key:this.key,version:this.version,context:this.context,type:this.type,initial:this.initial,history:this.history,states:D(this.states,(function(t){return t.definition})),on:this.on,transitions:this.transitions,entry:this.onEntry,exit:this.onExit,activities:this.activities||[],meta:this.meta,order:this.order||-1,data:this.doneData,invoke:this.invoke,description:this.description,tags:this.tags}},enumerable:!1,configurable:!0}),t.prototype.toJSON=function(){return this.definition},Object.defineProperty(t.prototype,"on",{get:function(){if(this.__cache.on)return this.__cache.on
var t=this.transitions
return this.__cache.on=t.reduce((function(t,e){return t[e.eventType]=t[e.eventType]||[],t[e.eventType].push(e),t}),{})},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"after",{get:function(){return this.__cache.delayedTransitions||(this.__cache.delayedTransitions=this.getDelayedTransitions(),this.__cache.delayedTransitions)},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"transitions",{get:function(){return this.__cache.transitions||(this.__cache.transitions=this.formatTransitions(),this.__cache.transitions)},enumerable:!1,configurable:!0}),t.prototype.getCandidates=function(t){if(this.__cache.candidates[t])return this.__cache.candidates[t]
var e=""===t,i=this.transitions.filter((function(i){var n=i.eventType===t
return e?n:n||"*"===i.eventType}))
return this.__cache.candidates[t]=i,i},t.prototype.getDelayedTransitions=function(){var t=this,e=this.config.after
if(!e)return[]
var i=function(e,i){var n=Ct(F(e)?"".concat(t.id,":delay[").concat(i,"]"):e,t.id)
return t.onEntry.push(gt(n,{delay:e})),t.onExit.push(Qt(n)),n}
return(G(e)?e.map((function(t,e){var n=i(t.delay,e)
return a(a({},t),{event:n})})):L(Object.keys(e).map((function(t,n){var s=e[t],r=H(s)?{target:s}:s,o=isNaN(+t)?t:+t,l=i(o,n)
return U(r).map((function(t){return a(a({},t),{event:l,delay:o})}))})))).map((function(e){var i=e.delay
return a(a({},t.formatTransition(e)),{delay:i})}))},t.prototype.getStateNodes=function(t){var e,i=this
if(!t)return[]
var n=t instanceof ne?t.value:R(t,this.delimiter)
if(H(n)){var s=this.getStateNode(n).initial
return void 0!==s?this.getStateNodes(((e={})[n]=s,e)):[this,this.states[n]]}var r=Object.keys(n),o=[this]
return o.push.apply(o,u([],c(L(r.map((function(t){return i.getStateNode(t).getStateNodes(n[t])})))),!1)),o},t.prototype.handles=function(t){var e=I(t)
return this.events.includes(e)},t.prototype.resolveState=function(t){var e=t instanceof ne?t:ne.create(t),i=Array.from(Gt([],this.getStateNodes(e.value)))
return new ne(a(a({},e),{value:this.resolve(e.value),configuration:i,done:te(i,this),tags:ee(i),machine:this.machine}))},t.prototype.transitionLeafNode=function(t,e,i){var n=this.getStateNode(t).next(e,i)
return n&&n.transitions.length?n:this.next(e,i)},t.prototype.transitionCompoundNode=function(t,e,i){var n=Object.keys(t),s=this.getStateNode(n[0])._transition(t[n[0]],e,i)
return s&&s.transitions.length?s:this.next(e,i)},t.prototype.transitionParallelNode=function(t,e,i){var n,s,r={}
try{for(var o=h(Object.keys(t)),a=o.next();!a.done;a=o.next()){var l=a.value,c=t[l]
if(c){var u=this.getStateNode(l)._transition(c,e,i)
u&&(r[l]=u)}}}catch(t){n={error:t}}finally{try{a&&!a.done&&(s=o.return)&&s.call(o)}finally{if(n)throw n.error}}var f=Object.keys(r).map((function(t){return r[t]})),d=L(f.map((function(t){return t.transitions})))
if(!f.some((function(t){return t.transitions.length>0})))return this.next(e,i)
var p=L(f.map((function(t){return t.entrySet}))),m=L(Object.keys(r).map((function(t){return r[t].configuration})))
return{transitions:d,entrySet:p,exitSet:L(f.map((function(t){return t.exitSet}))),configuration:m,source:e,actions:L(Object.keys(r).map((function(t){return r[t].actions})))}},t.prototype._transition=function(t,e,i){return H(t)?this.transitionLeafNode(t,e,i):1===Object.keys(t).length?this.transitionCompoundNode(t,e,i):this.transitionParallelNode(t,e,i)},t.prototype.getTransitionData=function(t,e){return this._transition(t.value,t,nt(e))},t.prototype.next=function(t,e){var i,n,s,r=this,o=e.name,a=[],l=[]
try{for(var f=h(this.getCandidates(o)),d=f.next();!d.done;d=f.next()){var p=d.value,m=p.cond,g=p.in,O=t.context,v=!g||(H(g)&&Oe(g)?t.matches(R(this.getStateNodeById(g).path,this.delimiter)):M(R(g,this.delimiter),X(this.path.slice(0,-2))(t.value))),y=!1
try{y=!m||rt(this.machine,m,O,e,t)}catch(t){throw new Error("Unable to evaluate guard '".concat(m.name||m.type,"' in transition for event '").concat(o,"' in state node '").concat(this.id,"':\n").concat(t.message))}if(y&&v){void 0!==p.target&&(l=p.target),a.push.apply(a,u([],c(p.actions),!1)),s=p
break}}}catch(t){i={error:t}}finally{try{d&&!d.done&&(n=f.return)&&n.call(f)}finally{if(i)throw i.error}}if(s){if(!l.length)return{transitions:[s],entrySet:[],exitSet:[],configuration:t.value?[this]:[],source:t,actions:a}
var b=L(l.map((function(e){return r.getRelativeStateNodes(e,t.historyValue)}))),w=!!s.internal,x=[]
return w||l.forEach((function(t){x.push.apply(x,u([],c(r.getExternalReentryNodes(t)),!1))})),{transitions:[s],entrySet:x,exitSet:w?[]:[this],configuration:b,source:t,actions:a}}},t.prototype.getExternalReentryNodes=function(t){for(var e=[],i=c(t.order>this.order?[t,this]:[this,t],2),n=i[0],s=i[1];n&&n!==s;)e.push(n),n=n.parent
return n!==s?[]:(e.push(s),e)},t.prototype.getActions=function(t,e,i,n,s,r,a){var l,f,d,p,O=this,v=Gt([],r?this.getStateNodes(r.value):[this])
try{for(var y=h(t),b=y.next();!b.done;b=y.next())Jt(v,S=b.value)&&!Jt(i.entrySet,S.parent)||i.entrySet.push(S)}catch(t){l={error:t}}finally{try{b&&!b.done&&(f=y.return)&&f.call(y)}finally{if(l)throw l.error}}try{for(var w=h(v),x=w.next();!x.done;x=w.next()){var S
Jt(t,S=x.value)&&!Jt(i.exitSet,S.parent)||i.exitSet.push(S)}}catch(t){d={error:t}}finally{try{x&&!x.done&&(p=w.return)&&p.call(w)}finally{if(d)throw d.error}}var k=L(i.entrySet.map((function(t){var e=[]
if("final"!==t.type)return e
var r=t.parent
if(!r.parent)return e
e.push(Et(t.id,t.doneData),Et(r.id,t.doneData?q(t.doneData,n,s):void 0))
var o=r.parent
return"parallel"===o.type&&zt(o).every((function(t){return te(i.configuration,t)}))&&e.push(Et(o.id)),e})))
i.exitSet.sort((function(t,e){return e.order-t.order})),i.entrySet.sort((function(t,e){return t.order-e.order}))
var Q=new Set(i.entrySet),P=new Set(i.exitSet),T=Array.from(Q).map((function(t){var e=t.onEntry,i=t.activities.map((function(t){return Pt(t)}))
return ft(a?u(u([],c(e),!1),c(i),!1):u(u([],c(i),!1),c(e),!1),O.machine.options.actions)})).concat([k.map(pt)]),$=Array.from(P).map((function(t){return ft(u(u([],c(t.onExit),!1),c(t.activities.map((function(t){return Tt(t)}))),!1),O.machine.options.actions)})).concat([ft(i.actions,this.machine.options.actions)]).concat(T)
if(e){var A=ft(L(u([],c(t),!1).sort((function(t,e){return e.order-t.order})).map((function(t){return t.onExit}))),this.machine.options.actions).filter((function(t){return t.type!==m&&(t.type!==g||!!t.to&&t.to!==o.Internal)}))
return $.concat([A])}return $},t.prototype.transition=function(t,e,i,n){void 0===t&&(t=this.initialState)
var s,r,o=nt(e)
if(t instanceof ne)s=void 0===i?t:this.resolveState(ne.from(t,i))
else{var a=H(t)?this.resolve(Z(this.getResolvedPath(t))):this.resolve(t),l=null!=i?i:this.machine.context
s=this.resolveState(ne.from(a,l))}if(this.strict&&!this.events.includes(o.name)&&(r=o.name,!/^(done|error)\./.test(r)))throw new Error("Machine '".concat(this.id,"' does not accept event '").concat(o.name,"'"))
var h=this._transition(s.value,s,o)||{transitions:[],configuration:[],entrySet:[],exitSet:[],source:s,actions:[]},f=Gt([],this.getStateNodes(s.value)),d=h.configuration.length?Gt(f,h.configuration):f
return h.configuration=u([],c(d),!1),this.resolveTransition(h,s,s.context,n,o)},t.prototype.resolveRaisedTransition=function(t,e,i,n){var s,r=t.actions
return(t=this.transition(t,e,void 0,n))._event=i,t.event=i.data,(s=t.actions).unshift.apply(s,u([],c(r),!1)),t},t.prototype.resolveTransition=function(t,e,i,n,s){var r,l,u,f,O=this
void 0===s&&(s=ht)
var y=t.configuration,b=!e||t.transitions.length>0,w=b?t.configuration:e?e.configuration:[],x=te(w,this),S=b?Kt(this.machine,y):void 0,Q=e?e.historyValue?e.historyValue:t.source?this.machine.historyValue(e.value):void 0:void 0,P=this.getActions(new Set(w),x,t,i,s,e,n),T=e?a({},e.activities):{}
try{for(var A=h(P),_=A.next();!_.done;_=A.next()){var C=_.value
try{for(var E=(u=void 0,h(C)),M=E.next();!M.done;M=E.next()){var I=M.value
I.type===d?T[I.activity.id||I.activity.type]=I:I.type===p&&(T[I.activity.id||I.activity.type]=!1)}}catch(t){u={error:t}}finally{try{M&&!M.done&&(f=E.return)&&f.call(E)}finally{if(u)throw u.error}}}}catch(t){r={error:t}}finally{try{_&&!_.done&&(l=A.return)&&l.call(A)}finally{if(r)throw r.error}}var W,R,Z=c(Vt(this,e,i,s,P,n,this.machine.config.predictableActionArguments||this.machine.config.preserveActionOrder),2),D=Z[0],V=Z[1],X=c(function(t,e){var i,n,s=c([[],[]],2),r=s[0],o=s[1]
try{for(var a=h(t),l=a.next();!l.done;l=a.next()){var u=l.value
e(u)?r.push(u):o.push(u)}}catch(t){i={error:t}}finally{try{l&&!l.done&&(n=a.return)&&n.call(a)}finally{if(i)throw i.error}}return[r,o]}(D,(function(t){return t.type===m||t.type===g&&t.to===o.Internal})),2),j=X[0],L=X[1],N=D.filter((function(t){var e
return t.type===d&&(null===(e=t.activity)||void 0===e?void 0:e.type)===k})),U=N.reduce((function(t,e){return t[e.activity.id]=function(t,e,i,n){var s,r=ot(t.src),o=null===(s=null==e?void 0:e.options.services)||void 0===s?void 0:s[r.type],a=t.data?q(t.data,i,n):void 0,l=o?Nt(o,t.id,a):Lt(t.id)
return l.meta=t,l}(e.activity,O.machine,V,s),t}),e?a({},e.children):{}),Y=new ne({value:S||e.value,context:V,_event:s,_sessionid:e?e._sessionid:null,historyValue:S?Q?(W=Q,R=S,{current:R,states:z(W,R)}):void 0:e?e.historyValue:void 0,history:!S||t.source?e:void 0,actions:S?L:[],activities:S?T:e?e.activities:{},events:[],configuration:w,transitions:t.transitions,children:U,done:x,tags:ee(w),machine:this}),B=i!==V
Y.changed=s.name===$||B
var G=Y.history
G&&delete G.history
var F=!x&&(this._transient||y.some((function(t){return t._transient})))
if(!(b||F&&""!==s.name))return Y
var H=Y
if(!x)for(F&&(H=this.resolveRaisedTransition(H,{type:v},s,n));j.length;){var K=j.shift()
H=this.resolveRaisedTransition(H,K._event,s,n)}var J=H.changed||(G?!!H.actions.length||B||typeof G.value!=typeof H.value||!ie(H.value,G.value):void 0)
return H.changed=J,H.history=G,H},t.prototype.getStateNode=function(t){if(Oe(t))return this.machine.getStateNodeById(t)
if(!this.states)throw new Error("Unable to retrieve child state '".concat(t,"' from '").concat(this.id,"'; no child states exist."))
var e=this.states[t]
if(!e)throw new Error("Child state '".concat(t,"' does not exist on '").concat(this.id,"'"))
return e},t.prototype.getStateNodeById=function(t){var e=Oe(t)?t.slice("#".length):t
if(e===this.id)return this
var i=this.machine.idMap[e]
if(!i)throw new Error("Child state node '#".concat(e,"' does not exist on machine '").concat(this.id,"'"))
return i},t.prototype.getStateNodeByPath=function(t){if("string"==typeof t&&Oe(t))try{return this.getStateNodeById(t.slice(1))}catch(t){}for(var e=W(t,this.delimiter).slice(),i=this;e.length;){var n=e.shift()
if(!n.length)break
i=i.getStateNode(n)}return i},t.prototype.resolve=function(t){var e,i=this
if(!t)return this.initialStateValue||ge
switch(this.type){case"parallel":return D(this.initialStateValue,(function(e,n){return e?i.getStateNode(n).resolve(t[n]||e):ge}))
case"compound":if(H(t)){var n=this.getStateNode(t)
return"parallel"===n.type||"compound"===n.type?((e={})[t]=n.initialStateValue,e):t}return Object.keys(t).length?D(t,(function(t,e){return t?i.getStateNode(e).resolve(t):ge})):this.initialStateValue||{}
default:return t||ge}},t.prototype.getResolvedPath=function(t){if(Oe(t)){var e=this.machine.idMap[t.slice("#".length)]
if(!e)throw new Error("Unable to find state node '".concat(t,"'"))
return e.path}return W(t,this.delimiter)},Object.defineProperty(t.prototype,"initialStateValue",{get:function(){var t,e
if(this.__cache.initialStateValue)return this.__cache.initialStateValue
if("parallel"===this.type)e=V(this.states,(function(t){return t.initialStateValue||ge}),(function(t){return!("history"===t.type)}))
else if(void 0!==this.initial){if(!this.states[this.initial])throw new Error("Initial state '".concat(this.initial,"' not found on '").concat(this.key,"'"))
e=qt(this.states[this.initial])?this.initial:((t={})[this.initial]=this.states[this.initial].initialStateValue,t)}else e={}
return this.__cache.initialStateValue=e,this.__cache.initialStateValue},enumerable:!1,configurable:!0}),t.prototype.getInitialState=function(t,e){this._init()
var i=this.getStateNodes(t)
return this.resolveTransition({configuration:i,entrySet:u([],c(i),!1),exitSet:[],transitions:[],source:void 0,actions:[]},void 0,null!=e?e:this.machine.context,void 0)},Object.defineProperty(t.prototype,"initialState",{get:function(){var t=this.initialStateValue
if(!t)throw new Error("Cannot retrieve initial state from simple state '".concat(this.id,"'."))
return this.getInitialState(t)},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"target",{get:function(){var t
if("history"===this.type){var e=this.config
t=H(e.target)&&Oe(e.target)?Z(this.machine.getStateNodeById(e.target).path.slice(this.path.length-1)):e.target}return t},enumerable:!1,configurable:!0}),t.prototype.getRelativeStateNodes=function(t,e,i){return void 0===i&&(i=!0),i?"history"===t.type?t.resolveHistory(e):t.initialStateNodes:[t]},Object.defineProperty(t.prototype,"initialStateNodes",{get:function(){var t=this
return qt(this)?[this]:"compound"!==this.type||this.initial?L(j(this.initialStateValue).map((function(e){return t.getFromRelativePath(e)}))):[this]},enumerable:!1,configurable:!0}),t.prototype.getFromRelativePath=function(t){if(!t.length)return[this]
var e=c(t),i=e[0],n=e.slice(1)
if(!this.states)throw new Error("Cannot retrieve subPath '".concat(i,"' from node with no states"))
var s=this.getStateNode(i)
if("history"===s.type)return s.resolveHistory()
if(!this.states[i])throw new Error("Child state '".concat(i,"' does not exist on '").concat(this.id,"'"))
return this.states[i].getFromRelativePath(n)},t.prototype.historyValue=function(t){if(Object.keys(this.states).length)return{current:t||this.initialStateValue,states:V(this.states,(function(e,i){if(!t)return e.historyValue()
var n=H(t)?void 0:t[i]
return e.historyValue(n||e.initialStateValue)}),(function(t){return!t.history}))}},t.prototype.resolveHistory=function(t){var e=this
if("history"!==this.type)return[this]
var i=this.parent
if(!t){var n=this.target
return n?L(j(n).map((function(t){return i.getFromRelativePath(t)}))):i.initialStateNodes}var s,r=(s=i.path,function(t){var e,i,n=t
try{for(var r=h(s),o=r.next();!o.done;o=r.next()){var a=o.value
n=n.states[a]}}catch(t){e={error:t}}finally{try{o&&!o.done&&(i=r.return)&&i.call(r)}finally{if(e)throw e.error}}return n})(t).current
return H(r)?[i.getStateNode(r)]:L(j(r).map((function(t){return"deep"===e.history?i.getFromRelativePath(t):[i.states[t[0]]]})))},Object.defineProperty(t.prototype,"stateIds",{get:function(){var t=this,e=L(Object.keys(this.states).map((function(e){return t.states[e].stateIds})))
return[this.id].concat(e)},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"events",{get:function(){var t,e,i,n
if(this.__cache.events)return this.__cache.events
var s=this.states,r=new Set(this.ownEvents)
if(s)try{for(var o=h(Object.keys(s)),a=o.next();!a.done;a=o.next()){var l=s[a.value]
if(l.states)try{for(var c=(i=void 0,h(l.events)),u=c.next();!u.done;u=c.next()){var f=u.value
r.add("".concat(f))}}catch(t){i={error:t}}finally{try{u&&!u.done&&(n=c.return)&&n.call(c)}finally{if(i)throw i.error}}}}catch(e){t={error:e}}finally{try{a&&!a.done&&(e=o.return)&&e.call(o)}finally{if(t)throw t.error}}return this.__cache.events=Array.from(r)},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"ownEvents",{get:function(){var t=new Set(this.transitions.filter((function(t){return!(!t.target&&!t.actions.length&&t.internal)})).map((function(t){return t.eventType})))
return Array.from(t)},enumerable:!1,configurable:!0}),t.prototype.resolveTarget=function(t){var e=this
if(void 0!==t)return t.map((function(t){if(!H(t))return t
var i=t[0]===e.delimiter
if(i&&!e.parent)return e.getStateNodeByPath(t.slice(1))
var n=i?e.key+t:t
if(!e.parent)return e.getStateNodeByPath(n)
try{return e.parent.getStateNodeByPath(n)}catch(t){throw new Error("Invalid transition definition for state node '".concat(e.id,"':\n").concat(t.message))}}))},t.prototype.formatTransition=function(t){var e=this,i=function(t){if(void 0!==t&&""!==t)return U(t)}(t.target),n="internal"in t?t.internal:!i||i.some((function(t){return H(t)&&t[0]===e.delimiter})),s=this.machine.options.guards,r=this.resolveTarget(i),o=a(a({},t),{actions:ft(U(t.actions)),cond:K(t.cond,s),target:r,source:this,internal:n,eventType:t.event,toJSON:function(){return a(a({},o),{target:o.target?o.target.map((function(t){return"#".concat(t.id)})):void 0,source:"#".concat(e.id)})}})
return o},t.prototype.formatTransitions=function(){var t,e,i,n=this
if(this.config.on)if(Array.isArray(this.config.on))i=this.config.on
else{var s=this.config.on,r=s["*"],o=void 0===r?[]:r,a=l(s,["*"])
i=L(Object.keys(a).map((function(t){return st(t,a[t])})).concat(st("*",o)))}else i=[]
var f=this.config.always?st("",this.config.always):[],d=this.config.onDone?st(String(Et(this.id)),this.config.onDone):[],p=L(this.invoke.map((function(t){var e=[]
return t.onDone&&e.push.apply(e,u([],c(st(String(Mt(t.id)),t.onDone)),!1)),t.onError&&e.push.apply(e,u([],c(st(String(It(t.id)),t.onError)),!1)),e}))),m=this.after,g=L(u(u(u(u([],c(d),!1),c(p),!1),c(i),!1),c(f),!1).map((function(t){return U(t).map((function(t){return n.formatTransition(t)}))})))
try{for(var O=h(m),v=O.next();!v.done;v=O.next()){var y=v.value
g.push(y)}}catch(e){t={error:e}}finally{try{v&&!v.done&&(e=O.return)&&e.call(O)}finally{if(t)throw t.error}}return g},t}()
function ye(t,e,i){return void 0===i&&(i=t.context),new ve(t,e,i)}function be(t,e){return new ve(t,e)}function we(t,e){var i,n,s
try{for(var r=h(Object.keys(t)),o=r.next();!o.done;o=r.next()){var a=o.value
M(a,e)&&(!s||e.length>s.length)&&(s=a)}}catch(t){i={error:t}}finally{try{o&&!o.done&&(n=r.return)&&n.call(r)}finally{if(i)throw i.error}}return t[s]}function xe(t,e,i){var n,s,r=ne.from(t,t instanceof ne?t.context:void 0)
try{for(var o=h(e),a=o.next();!a.done;a=o.next()){var l=c(a.value,2),u=l[0],f=l[1]
if(r.matches(u))return f(r)}}catch(t){n={error:t}}finally{try{a&&!a.done&&(s=o.return)&&s.call(o)}finally{if(n)throw n.error}}return i(r)}function Se(t){return t}var ke=Se,Qe=At,Pe=gt,Te=vt,$e=bt,Ae=Rt,_e=Mt},526:(t,e,i)=>{"use strict"
Object.defineProperty(e,"__esModule",{value:!0})
var n=i(40),s=i(642),r=i(729)
class o{constructor(t,e,i){this.state=t,this.pos=e,this.explicit=i,this.abortListeners=[]}tokenBefore(t){let e=r.syntaxTree(this.state).resolveInner(this.pos,-1)
for(;e&&t.indexOf(e.name)<0;)e=e.parent
return e?{from:e.from,to:this.pos,text:this.state.sliceDoc(e.from,this.pos),type:e.type}:null}matchBefore(t){let e=this.state.doc.lineAt(this.pos),i=Math.max(e.from,this.pos-250),n=e.text.slice(i-e.from,this.pos-e.from),s=n.search(u(t,!1))
return s<0?null:{from:i+s,to:this.pos,text:n.slice(s)}}get aborted(){return null==this.abortListeners}addEventListener(t,e){"abort"==t&&this.abortListeners&&this.abortListeners.push(e)}}function a(t){let e=Object.keys(t).join(""),i=/\w/.test(e)
return i&&(e=e.replace(/\w/g,"")),`[${i?"\\w":""}${e.replace(/[^\w\s]/g,"\\$&")}]`}function l(t){let e=t.map((t=>"string"==typeof t?{label:t}:t)),[i,n]=e.every((t=>/^\w+$/.test(t.label)))?[/\w*$/,/\w+$/]:function(t){let e=Object.create(null),i=Object.create(null)
for(let{label:s}of t){e[s[0]]=!0
for(let t=1;t<s.length;t++)i[s[t]]=!0}let n=a(e)+a(i)+"*$"
return[new RegExp("^"+n),new RegExp(n)]}(e)
return t=>{let s=t.matchBefore(n)
return s||t.explicit?{from:s?s.from:t.pos,options:e,validFor:i}:null}}class h{constructor(t,e,i){this.completion=t,this.source=e,this.match=i}}function c(t){return t.selection.main.head}function u(t,e){var i
let{source:n}=t,s=e&&"^"!=n[0],r="$"!=n[n.length-1]
return s||r?new RegExp(`${s?"^":""}(?:${n})${r?"$":""}`,null!==(i=t.flags)&&void 0!==i?i:t.ignoreCase?"i":""):t}const f=n.Annotation.define()
function d(t,e,i,s){return Object.assign(Object.assign({},t.changeByRange((r=>{if(r==t.selection.main)return{changes:{from:i,to:s,insert:e},range:n.EditorSelection.cursor(i+e.length)}
let o=s-i
return!r.empty||o&&t.sliceDoc(r.from-o,r.from)!=t.sliceDoc(i,s)?{range:r}:{changes:{from:r.from-o,to:r.from,insert:e},range:n.EditorSelection.cursor(r.from-o+e.length)}}))),{userEvent:"input.complete"})}function p(t,e){const i=e.completion.apply||e.completion.label
let n=e.source
"string"==typeof i?t.dispatch(Object.assign(Object.assign({},d(t.state,i,n.from,n.to)),{annotations:f.of(e.completion)})):i(t,e.completion,n.from,n.to)}const m=new WeakMap
function g(t){if(!Array.isArray(t))return t
let e=m.get(t)
return e||m.set(t,e=l(t)),e}class O{constructor(t){this.pattern=t,this.chars=[],this.folded=[],this.any=[],this.precise=[],this.byWord=[]
for(let e=0;e<t.length;){let i=n.codePointAt(t,e),s=n.codePointSize(i)
this.chars.push(i)
let r=t.slice(e,e+s),o=r.toUpperCase()
this.folded.push(n.codePointAt(o==r?r.toLowerCase():o,0)),e+=s}this.astral=t.length!=this.chars.length}match(t){if(0==this.pattern.length)return[0]
if(t.length<this.pattern.length)return null
let{chars:e,folded:i,any:s,precise:r,byWord:o}=this
if(1==e.length){let s=n.codePointAt(t,0)
return s==e[0]?[0,0,n.codePointSize(s)]:s==i[0]?[-200,0,n.codePointSize(s)]:null}let a=t.indexOf(this.pattern)
if(0==a)return[0,0,this.pattern.length]
let l=e.length,h=0
if(a<0){for(let r=0,o=Math.min(t.length,200);r<o&&h<l;){let o=n.codePointAt(t,r)
o!=e[h]&&o!=i[h]||(s[h++]=r),r+=n.codePointSize(o)}if(h<l)return null}let c=0,u=0,f=!1,d=0,p=-1,m=-1,g=/[a-z]/.test(t),O=!0
for(let v=0,y=Math.min(t.length,200),b=0;v<y&&u<l;){let s=n.codePointAt(t,v)
a<0&&(c<l&&s==e[c]&&(r[c++]=v),d<l&&(s==e[d]||s==i[d]?(0==d&&(p=v),m=v+1,d++):d=0))
let h,y=s<255?s>=48&&s<=57||s>=97&&s<=122?2:s>=65&&s<=90?1:0:(h=n.fromCodePoint(s))!=h.toLowerCase()?1:h!=h.toUpperCase()?2:0;(!v||1==y&&g||0==b&&0!=y)&&(e[u]==s||i[u]==s&&(f=!0)?o[u++]=v:o.length&&(O=!1)),b=y,v+=n.codePointSize(s)}return u==l&&0==o[0]&&O?this.result((f?-200:0)-100,o,t):d==l&&0==p?[-200-t.length,0,m]:a>-1?[-700-t.length,a,a+this.pattern.length]:d==l?[-900-t.length,p,m]:u==l?this.result((f?-200:0)-100-700+(O?0:-1100),o,t):2==e.length?null:this.result((s[0]?-700:0)-200-1100,s,t)}result(t,e,i){let s=[t-i.length],r=1
for(let o of e){let t=o+(this.astral?n.codePointSize(n.codePointAt(i,o)):1)
r>1&&s[r-1]==o?s[r-1]=t:(s[r++]=o,s[r++]=t)}return s}}const v=n.Facet.define({combine:t=>n.combineConfig(t,{activateOnTyping:!0,selectOnOpen:!0,override:null,closeOnBlur:!0,maxRenderedOptions:100,defaultKeymap:!0,tooltipClass:()=>"",optionClass:()=>"",aboveCursor:!1,icons:!0,addToOptions:[],compareCompletions:(t,e)=>t.label.localeCompare(e.label),interactionDelay:75},{defaultKeymap:(t,e)=>t&&e,closeOnBlur:(t,e)=>t&&e,icons:(t,e)=>t&&e,tooltipClass:(t,e)=>i=>y(t(i),e(i)),optionClass:(t,e)=>i=>y(t(i),e(i)),addToOptions:(t,e)=>t.concat(e)})})
function y(t,e){return t?e?t+" "+e:t:e}function b(t,e,i){if(t<=i)return{from:0,to:t}
if(e<0&&(e=0),e<=t>>1){let t=Math.floor(e/i)
return{from:t*i,to:(t+1)*i}}let n=Math.floor((t-e)/i)
return{from:t-(n+1)*i,to:t-n*i}}class w{constructor(t,e){this.view=t,this.stateField=e,this.info=null,this.placeInfo={read:()=>this.measureInfo(),write:t=>this.positionInfo(t),key:this},this.space=null,this.currentClass=""
let i=t.state.field(e),{options:n,selected:s}=i.open,r=t.state.facet(v)
this.optionContent=function(t){let e=t.addToOptions.slice()
return t.icons&&e.push({render(t){let e=document.createElement("div")
return e.classList.add("cm-completionIcon"),t.type&&e.classList.add(...t.type.split(/\s+/g).map((t=>"cm-completionIcon-"+t))),e.setAttribute("aria-hidden","true"),e},position:20}),e.push({render(t,e,i){let n=document.createElement("span")
n.className="cm-completionLabel"
let{label:s}=t,r=0
for(let o=1;o<i.length;){let t=i[o++],e=i[o++]
t>r&&n.appendChild(document.createTextNode(s.slice(r,t)))
let a=n.appendChild(document.createElement("span"))
a.appendChild(document.createTextNode(s.slice(t,e))),a.className="cm-completionMatchedText",r=e}return r<s.length&&n.appendChild(document.createTextNode(s.slice(r))),n},position:50},{render(t){if(!t.detail)return null
let e=document.createElement("span")
return e.className="cm-completionDetail",e.textContent=t.detail,e},position:80}),e.sort(((t,e)=>t.position-e.position)).map((t=>t.render))}(r),this.optionClass=r.optionClass,this.tooltipClass=r.tooltipClass,this.range=b(n.length,s,r.maxRenderedOptions),this.dom=document.createElement("div"),this.dom.className="cm-tooltip-autocomplete",this.updateTooltipClass(t.state),this.dom.addEventListener("mousedown",(e=>{for(let i,s=e.target;s&&s!=this.dom;s=s.parentNode)if("LI"==s.nodeName&&(i=/-(\d+)$/.exec(s.id))&&+i[1]<n.length)return p(t,n[+i[1]]),void e.preventDefault()})),this.list=this.dom.appendChild(this.createListBox(n,i.id,this.range)),this.list.addEventListener("scroll",(()=>{this.info&&this.view.requestMeasure(this.placeInfo)}))}mount(){this.updateSel()}update(t){var e,i,n
let s=t.state.field(this.stateField),r=t.startState.field(this.stateField)
this.updateTooltipClass(t.state),s!=r&&(this.updateSel(),(null===(e=s.open)||void 0===e?void 0:e.disabled)!=(null===(i=r.open)||void 0===i?void 0:i.disabled)&&this.dom.classList.toggle("cm-tooltip-autocomplete-disabled",!!(null===(n=s.open)||void 0===n?void 0:n.disabled)))}updateTooltipClass(t){let e=this.tooltipClass(t)
if(e!=this.currentClass){for(let t of this.currentClass.split(" "))t&&this.dom.classList.remove(t)
for(let t of e.split(" "))t&&this.dom.classList.add(t)
this.currentClass=e}}positioned(t){this.space=t,this.info&&this.view.requestMeasure(this.placeInfo)}updateSel(){let t=this.view.state.field(this.stateField),e=t.open
if((e.selected>-1&&e.selected<this.range.from||e.selected>=this.range.to)&&(this.range=b(e.options.length,e.selected,this.view.state.facet(v).maxRenderedOptions),this.list.remove(),this.list=this.dom.appendChild(this.createListBox(e.options,t.id,this.range)),this.list.addEventListener("scroll",(()=>{this.info&&this.view.requestMeasure(this.placeInfo)}))),this.updateSelectedOption(e.selected)){this.info&&(this.info.remove(),this.info=null)
let{completion:i}=e.options[e.selected],{info:n}=i
if(!n)return
let r="string"==typeof n?document.createTextNode(n):n(i)
if(!r)return
"then"in r?r.then((e=>{e&&this.view.state.field(this.stateField,!1)==t&&this.addInfoPane(e)})).catch((t=>s.logException(this.view.state,t,"completion info"))):this.addInfoPane(r)}}addInfoPane(t){let e=this.info=document.createElement("div")
e.className="cm-tooltip cm-completionInfo",e.appendChild(t),this.dom.appendChild(e),this.view.requestMeasure(this.placeInfo)}updateSelectedOption(t){let e=null
for(let i=this.list.firstChild,n=this.range.from;i;i=i.nextSibling,n++)n==t?i.hasAttribute("aria-selected")||(i.setAttribute("aria-selected","true"),e=i):i.hasAttribute("aria-selected")&&i.removeAttribute("aria-selected")
return e&&function(t,e){let i=t.getBoundingClientRect(),n=e.getBoundingClientRect()
n.top<i.top?t.scrollTop-=i.top-n.top:n.bottom>i.bottom&&(t.scrollTop+=n.bottom-i.bottom)}(this.list,e),e}measureInfo(){let t=this.dom.querySelector("[aria-selected]")
if(!t||!this.info)return null
let e=this.dom.getBoundingClientRect(),i=this.info.getBoundingClientRect(),n=t.getBoundingClientRect(),r=this.space
if(!r){let t=this.dom.ownerDocument.defaultView||window
r={left:0,top:0,right:t.innerWidth,bottom:t.innerHeight}}if(n.top>Math.min(r.bottom,e.bottom)-10||n.bottom<Math.max(r.top,e.top)+10)return null
let o,a=this.view.textDirection==s.Direction.RTL,l=a,h=!1,c="",u="",f=e.left-r.left,d=r.right-e.right
if(l&&f<Math.min(i.width,d)?l=!1:!l&&d<Math.min(i.width,f)&&(l=!0),i.width<=(l?f:d))c=Math.max(r.top,Math.min(n.top,r.bottom-i.height))-e.top+"px",o=Math.min(400,l?f:d)+"px"
else{h=!0,o=Math.min(400,(a?e.right:r.right-e.left)-30)+"px"
let t=r.bottom-e.bottom
t>=i.height||t>e.top?c=n.bottom-e.top+"px":u=e.bottom-n.top+"px"}return{top:c,bottom:u,maxWidth:o,class:h?a?"left-narrow":"right-narrow":l?"left":"right"}}positionInfo(t){this.info&&(t?(this.info.style.top=t.top,this.info.style.bottom=t.bottom,this.info.style.maxWidth=t.maxWidth,this.info.className="cm-tooltip cm-completionInfo cm-completionInfo-"+t.class):this.info.style.top="-1e6px")}createListBox(t,e,i){const n=document.createElement("ul")
n.id=e,n.setAttribute("role","listbox"),n.setAttribute("aria-expanded","true"),n.setAttribute("aria-label",this.view.state.phrase("Completions"))
for(let s=i.from;s<i.to;s++){let{completion:i,match:r}=t[s]
const o=n.appendChild(document.createElement("li"))
o.id=e+"-"+s,o.setAttribute("role","option")
let a=this.optionClass(i)
a&&(o.className=a)
for(let t of this.optionContent){let e=t(i,this.view.state,r)
e&&o.appendChild(e)}}return i.from&&n.classList.add("cm-completionListIncompleteTop"),i.to<t.length&&n.classList.add("cm-completionListIncompleteBottom"),n}}function x(t){return 100*(t.boost||0)+(t.apply?10:0)+(t.info?5:0)+(t.type?1:0)}class S{constructor(t,e,i,n,s,r){this.options=t,this.attrs=e,this.tooltip=i,this.timestamp=n,this.selected=s,this.disabled=r}setSelected(t,e){return t==this.selected||t>=this.options.length?this:new S(this.options,P(e,t),this.tooltip,this.timestamp,t,this.disabled)}static build(t,e,i,n,s){let r=function(t,e){let i=[],n=0
for(let a of t)if(a.hasResult())if(!1===a.result.filter){let t=a.result.getMatch
for(let e of a.result.options){let s=[1e9-n++]
if(t)for(let i of t(e))s.push(i)
i.push(new h(e,a,s))}}else{let t,n=new O(e.sliceDoc(a.from,a.to))
for(let e of a.result.options)(t=n.match(e.label))&&(null!=e.boost&&(t[0]+=e.boost),i.push(new h(e,a,t)))}let s=[],r=null,o=e.facet(v).compareCompletions
for(let a of i.sort(((t,e)=>e.match[0]-t.match[0]||o(t.completion,e.completion))))!r||r.label!=a.completion.label||r.detail!=a.completion.detail||null!=r.type&&null!=a.completion.type&&r.type!=a.completion.type||r.apply!=a.completion.apply?s.push(a):x(a.completion)>x(r)&&(s[s.length-1]=a),r=a.completion
return s}(t,e)
if(!r.length)return n&&t.some((t=>1==t.state))?new S(n.options,n.attrs,n.tooltip,n.timestamp,n.selected,!0):null
let o=e.facet(v).selectOnOpen?0:-1
if(n&&n.selected!=o&&-1!=n.selected){let t=n.options[n.selected].completion
for(let e=0;e<r.length;e++)if(r[e].completion==t){o=e
break}}return new S(r,P(i,o),{pos:t.reduce(((t,e)=>e.hasResult()?Math.min(t,e.from):t),1e8),create:(a=W,t=>new w(t,a)),above:s.aboveCursor},n?n.timestamp:Date.now(),o,!1)
var a}map(t){return new S(this.options,this.attrs,Object.assign(Object.assign({},this.tooltip),{pos:t.mapPos(this.tooltip.pos)}),this.timestamp,this.selected,this.disabled)}}class k{constructor(t,e,i){this.active=t,this.id=e,this.open=i}static start(){return new k(T,"cm-ac-"+Math.floor(2e6*Math.random()).toString(36),null)}update(t){let{state:e}=t,i=e.facet(v),n=(i.override||e.languageDataAt("autocomplete",c(e)).map(g)).map((e=>(this.active.find((t=>t.source==e))||new A(e,this.active.some((t=>0!=t.state))?1:0)).update(t,i)))
n.length==this.active.length&&n.every(((t,e)=>t==this.active[e]))&&(n=this.active)
let s=this.open
s&&t.docChanged&&(s=s.map(t.changes)),t.selection||n.some((e=>e.hasResult()&&t.changes.touchesRange(e.from,e.to)))||!function(t,e){if(t==e)return!0
for(let i=0,n=0;;){for(;i<t.length&&!t[i].hasResult;)i++
for(;n<e.length&&!e[n].hasResult;)n++
let s=i==t.length,r=n==e.length
if(s||r)return s==r
if(t[i++].result!=e[n++].result)return!1}}(n,this.active)?s=S.build(n,e,this.id,s,i):s&&s.disabled&&!n.some((t=>1==t.state))&&(s=null),!s&&n.every((t=>1!=t.state))&&n.some((t=>t.hasResult()))&&(n=n.map((t=>t.hasResult()?new A(t.source,0):t)))
for(let r of t.effects)r.is(I)&&(s=s&&s.setSelected(r.value,this.id))
return n==this.active&&s==this.open?this:new k(n,this.id,s)}get tooltip(){return this.open?this.open.tooltip:null}get attrs(){return this.open?this.open.attrs:Q}}const Q={"aria-autocomplete":"list"}
function P(t,e){let i={"aria-autocomplete":"list","aria-haspopup":"listbox","aria-controls":t}
return e>-1&&(i["aria-activedescendant"]=t+"-"+e),i}const T=[]
function $(t){return t.isUserEvent("input.type")?"input":t.isUserEvent("delete.backward")?"delete":null}class A{constructor(t,e,i=-1){this.source=t,this.state=e,this.explicitPos=i}hasResult(){return!1}update(t,e){let i=$(t),n=this
i?n=n.handleUserEvent(t,i,e):t.docChanged?n=n.handleChange(t):t.selection&&0!=n.state&&(n=new A(n.source,0))
for(let s of t.effects)if(s.is(C))n=new A(n.source,1,s.value?c(t.state):-1)
else if(s.is(E))n=new A(n.source,0)
else if(s.is(M))for(let t of s.value)t.source==n.source&&(n=t)
return n}handleUserEvent(t,e,i){return"delete"!=e&&i.activateOnTyping?new A(this.source,1):this.map(t.changes)}handleChange(t){return t.changes.touchesRange(c(t.startState))?new A(this.source,0):this.map(t.changes)}map(t){return t.empty||this.explicitPos<0?this:new A(this.source,this.state,t.mapPos(this.explicitPos))}}class _ extends A{constructor(t,e,i,n,s){super(t,2,e),this.result=i,this.from=n,this.to=s}hasResult(){return!0}handleUserEvent(t,e,i){var n
let s=t.changes.mapPos(this.from),r=t.changes.mapPos(this.to,1),a=c(t.state)
if((this.explicitPos<0?a<=s:a<this.from)||a>r||"delete"==e&&c(t.startState)==this.from)return new A(this.source,"input"==e&&i.activateOnTyping?1:0)
let l,h=this.explicitPos<0?-1:t.changes.mapPos(this.explicitPos)
return function(t,e,i,n){if(!t)return!1
let s=e.sliceDoc(i,n)
return"function"==typeof t?t(s,i,n,e):u(t,!0).test(s)}(this.result.validFor,t.state,s,r)?new _(this.source,h,this.result,s,r):this.result.update&&(l=this.result.update(this.result,s,r,new o(t.state,a,h>=0)))?new _(this.source,h,l,l.from,null!==(n=l.to)&&void 0!==n?n:c(t.state)):new A(this.source,1,h)}handleChange(t){return t.changes.touchesRange(this.from,this.to)?new A(this.source,0):this.map(t.changes)}map(t){return t.empty?this:new _(this.source,this.explicitPos<0?-1:t.mapPos(this.explicitPos),this.result,t.mapPos(this.from),t.mapPos(this.to,1))}}const C=n.StateEffect.define(),E=n.StateEffect.define(),M=n.StateEffect.define({map:(t,e)=>t.map((t=>t.map(e)))}),I=n.StateEffect.define(),W=n.StateField.define({create:()=>k.start(),update:(t,e)=>t.update(e),provide:t=>[s.showTooltip.from(t,(t=>t.tooltip)),s.EditorView.contentAttributes.from(t,(t=>t.attrs))]})
function R(t,e="option"){return i=>{let n=i.state.field(W,!1)
if(!n||!n.open||n.open.disabled||Date.now()-n.open.timestamp<i.state.facet(v).interactionDelay)return!1
let r,o=1
"page"==e&&(r=s.getTooltip(i,n.open.tooltip))&&(o=Math.max(2,Math.floor(r.dom.offsetHeight/r.dom.querySelector("li").offsetHeight)-1))
let{length:a}=n.open.options,l=n.open.selected>-1?n.open.selected+o*(t?1:-1):t?0:a-1
return l<0?l="page"==e?0:a-1:l>=a&&(l="page"==e?a-1:0),i.dispatch({effects:I.of(l)}),!0}}const Z=t=>{let e=t.state.field(W,!1)
return!(t.state.readOnly||!e||!e.open||e.open.selected<0||Date.now()-e.open.timestamp<t.state.facet(v).interactionDelay||(e.open.disabled||p(t,e.open.options[e.open.selected]),0))},D=t=>!!t.state.field(W,!1)&&(t.dispatch({effects:C.of(!0)}),!0),V=t=>{let e=t.state.field(W,!1)
return!(!e||!e.active.some((t=>0!=t.state))||(t.dispatch({effects:E.of(null)}),0))}
class X{constructor(t,e){this.active=t,this.context=e,this.time=Date.now(),this.updates=[],this.done=void 0}}const j=s.ViewPlugin.fromClass(class{constructor(t){this.view=t,this.debounceUpdate=-1,this.running=[],this.debounceAccept=-1,this.composing=0
for(let e of t.state.field(W).active)1==e.state&&this.startQuery(e)}update(t){let e=t.state.field(W)
if(!t.selectionSet&&!t.docChanged&&t.startState.field(W)==e)return
let i=t.transactions.some((t=>(t.selection||t.docChanged)&&!$(t)))
for(let n=0;n<this.running.length;n++){let e=this.running[n]
if(i||e.updates.length+t.transactions.length>50&&Date.now()-e.time>1e3){for(let i of e.context.abortListeners)try{i()}catch(t){s.logException(this.view.state,t)}e.context.abortListeners=null,this.running.splice(n--,1)}else e.updates.push(...t.transactions)}if(this.debounceUpdate>-1&&clearTimeout(this.debounceUpdate),this.debounceUpdate=e.active.some((t=>1==t.state&&!this.running.some((e=>e.active.source==t.source))))?setTimeout((()=>this.startUpdate()),50):-1,0!=this.composing)for(let n of t.transactions)"input"==$(n)?this.composing=2:2==this.composing&&n.selection&&(this.composing=3)}startUpdate(){this.debounceUpdate=-1
let{state:t}=this.view,e=t.field(W)
for(let i of e.active)1!=i.state||this.running.some((t=>t.active.source==i.source))||this.startQuery(i)}startQuery(t){let{state:e}=this.view,i=c(e),n=new o(e,i,t.explicitPos==i),r=new X(t,n)
this.running.push(r),Promise.resolve(t.source(n)).then((t=>{r.context.aborted||(r.done=t||null,this.scheduleAccept())}),(t=>{this.view.dispatch({effects:E.of(null)}),s.logException(this.view.state,t)}))}scheduleAccept(){this.running.every((t=>void 0!==t.done))?this.accept():this.debounceAccept<0&&(this.debounceAccept=setTimeout((()=>this.accept()),50))}accept(){var t
this.debounceAccept>-1&&clearTimeout(this.debounceAccept),this.debounceAccept=-1
let e=[],i=this.view.state.facet(v)
for(let n=0;n<this.running.length;n++){let s=this.running[n]
if(void 0===s.done)continue
if(this.running.splice(n--,1),s.done){let n=new _(s.active.source,s.active.explicitPos,s.done,s.done.from,null!==(t=s.done.to)&&void 0!==t?t:c(s.updates.length?s.updates[0].startState:this.view.state))
for(let t of s.updates)n=n.update(t,i)
if(n.hasResult()){e.push(n)
continue}}let r=this.view.state.field(W).active.find((t=>t.source==s.active.source))
if(r&&1==r.state)if(null==s.done){let t=new A(s.active.source,0)
for(let e of s.updates)t=t.update(e,i)
1!=t.state&&e.push(t)}else this.startQuery(r)}e.length&&this.view.dispatch({effects:M.of(e)})}},{eventHandlers:{blur(){let t=this.view.state.field(W,!1)
t&&t.tooltip&&this.view.state.facet(v).closeOnBlur&&this.view.dispatch({effects:E.of(null)})},compositionstart(){this.composing=1},compositionend(){3==this.composing&&setTimeout((()=>this.view.dispatch({effects:C.of(!1)})),20),this.composing=0}}}),L=s.EditorView.baseTheme({".cm-tooltip.cm-tooltip-autocomplete":{"& > ul":{fontFamily:"monospace",whiteSpace:"nowrap",overflow:"hidden auto",maxWidth_fallback:"700px",maxWidth:"min(700px, 95vw)",minWidth:"250px",maxHeight:"10em",height:"100%",listStyle:"none",margin:0,padding:0,"& > li":{overflowX:"hidden",textOverflow:"ellipsis",cursor:"pointer",padding:"1px 3px",lineHeight:1.2}}},"&light .cm-tooltip-autocomplete ul li[aria-selected]":{background:"#17c",color:"white"},"&light .cm-tooltip-autocomplete-disabled ul li[aria-selected]":{background:"#777"},"&dark .cm-tooltip-autocomplete ul li[aria-selected]":{background:"#347",color:"white"},"&dark .cm-tooltip-autocomplete-disabled ul li[aria-selected]":{background:"#444"},".cm-completionListIncompleteTop:before, .cm-completionListIncompleteBottom:after":{content:'"···"',opacity:.5,display:"block",textAlign:"center"},".cm-tooltip.cm-completionInfo":{position:"absolute",padding:"3px 9px",width:"max-content",maxWidth:"400px",boxSizing:"border-box"},".cm-completionInfo.cm-completionInfo-left":{right:"100%"},".cm-completionInfo.cm-completionInfo-right":{left:"100%"},".cm-completionInfo.cm-completionInfo-left-narrow":{right:"30px"},".cm-completionInfo.cm-completionInfo-right-narrow":{left:"30px"},"&light .cm-snippetField":{backgroundColor:"#00000022"},"&dark .cm-snippetField":{backgroundColor:"#ffffff22"},".cm-snippetFieldPosition":{verticalAlign:"text-top",width:0,height:"1.15em",display:"inline-block",margin:"0 -0.7px -.7em",borderLeft:"1.4px dotted #888"},".cm-completionMatchedText":{textDecoration:"underline"},".cm-completionDetail":{marginLeft:"0.5em",fontStyle:"italic"},".cm-completionIcon":{fontSize:"90%",width:".8em",display:"inline-block",textAlign:"center",paddingRight:".6em",opacity:"0.6",boxSizing:"content-box"},".cm-completionIcon-function, .cm-completionIcon-method":{"&:after":{content:"'ƒ'"}},".cm-completionIcon-class":{"&:after":{content:"'○'"}},".cm-completionIcon-interface":{"&:after":{content:"'◌'"}},".cm-completionIcon-variable":{"&:after":{content:"'𝑥'"}},".cm-completionIcon-constant":{"&:after":{content:"'𝐶'"}},".cm-completionIcon-type":{"&:after":{content:"'𝑡'"}},".cm-completionIcon-enum":{"&:after":{content:"'∪'"}},".cm-completionIcon-property":{"&:after":{content:"'□'"}},".cm-completionIcon-keyword":{"&:after":{content:"'🔑︎'"}},".cm-completionIcon-namespace":{"&:after":{content:"'▢'"}},".cm-completionIcon-text":{"&:after":{content:"'abc'",fontSize:"50%",verticalAlign:"middle"}}})
class N{constructor(t,e,i,n){this.field=t,this.line=e,this.from=i,this.to=n}}class U{constructor(t,e,i){this.field=t,this.from=e,this.to=i}map(t){let e=t.mapPos(this.from,-1,n.MapMode.TrackDel),i=t.mapPos(this.to,1,n.MapMode.TrackDel)
return null==e||null==i?null:new U(this.field,e,i)}}class q{constructor(t,e){this.lines=t,this.fieldPositions=e}instantiate(t,e){let i=[],n=[e],s=t.doc.lineAt(e),o=/^\s*/.exec(s.text)[0]
for(let l of this.lines){if(i.length){let i=o,s=/^\t*/.exec(l)[0].length
for(let e=0;e<s;e++)i+=t.facet(r.indentUnit)
n.push(e+i.length-s),l=i+l.slice(s)}i.push(l),e+=l.length+1}let a=this.fieldPositions.map((t=>new U(t.field,n[t.line]+t.from,n[t.line]+t.to)))
return{text:i,ranges:a}}static parse(t){let e,i=[],n=[],s=[]
for(let r of t.split(/\r\n?|\n/)){for(;e=/[#$]\{(?:(\d+)(?::([^}]*))?|([^}]*))\}/.exec(r);){let t=e[1]?+e[1]:null,o=e[2]||e[3]||"",a=-1
for(let e=0;e<i.length;e++)(null!=t?i[e].seq==t:o&&i[e].name==o)&&(a=e)
if(a<0){let e=0
for(;e<i.length&&(null==t||null!=i[e].seq&&i[e].seq<t);)e++
i.splice(e,0,{seq:t,name:o}),a=e
for(let t of s)t.field>=a&&t.field++}s.push(new N(a,n.length,e.index,e.index+o.length)),r=r.slice(0,e.index)+o+r.slice(e.index+e[0].length)}for(let t;t=/\\([{}])/.exec(r);){r=r.slice(0,t.index)+t[1]+r.slice(t.index+t[0].length)
for(let e of s)e.line==n.length&&e.from>t.index&&(e.from--,e.to--)}n.push(r)}return new q(n,s)}}let Y=s.Decoration.widget({widget:new class extends s.WidgetType{toDOM(){let t=document.createElement("span")
return t.className="cm-snippetFieldPosition",t}ignoreEvent(){return!1}}}),z=s.Decoration.mark({class:"cm-snippetField"})
class B{constructor(t,e){this.ranges=t,this.active=e,this.deco=s.Decoration.set(t.map((t=>(t.from==t.to?Y:z).range(t.from,t.to))))}map(t){let e=[]
for(let i of this.ranges){let n=i.map(t)
if(!n)return null
e.push(n)}return new B(e,this.active)}selectionInsideField(t){return t.ranges.every((t=>this.ranges.some((e=>e.field==this.active&&e.from<=t.from&&e.to>=t.to))))}}const G=n.StateEffect.define({map:(t,e)=>t&&t.map(e)}),F=n.StateEffect.define(),H=n.StateField.define({create:()=>null,update(t,e){for(let i of e.effects){if(i.is(G))return i.value
if(i.is(F)&&t)return new B(t.ranges,i.value)}return t&&e.docChanged&&(t=t.map(e.changes)),t&&e.selection&&!t.selectionInsideField(e.selection)&&(t=null),t},provide:t=>s.EditorView.decorations.from(t,(t=>t?t.deco:s.Decoration.none))})
function K(t,e){return n.EditorSelection.create(t.filter((t=>t.field==e)).map((t=>n.EditorSelection.range(t.from,t.to))))}function J(t){let e=q.parse(t)
return(t,i,s,r)=>{let{text:o,ranges:a}=e.instantiate(t.state,s),l={changes:{from:s,to:r,insert:n.Text.of(o)},scrollIntoView:!0}
if(a.length&&(l.selection=K(a,0)),a.length>1){let e=new B(a,0),i=l.effects=[G.of(e)]
void 0===t.state.field(H,!1)&&i.push(n.StateEffect.appendConfig.of([H,ot,at,L]))}t.dispatch(t.state.update(l))}}function tt(t){return({state:e,dispatch:i})=>{let n=e.field(H,!1)
if(!n||t<0&&0==n.active)return!1
let s=n.active+t,r=t>0&&!n.ranges.some((e=>e.field==s+t))
return i(e.update({selection:K(n.ranges,s),effects:G.of(r?null:new B(n.ranges,s))})),!0}}const et=({state:t,dispatch:e})=>!!t.field(H,!1)&&(e(t.update({effects:G.of(null)})),!0),it=tt(1),nt=tt(-1),st=[{key:"Tab",run:it,shift:nt},{key:"Escape",run:et}],rt=n.Facet.define({combine:t=>t.length?t[0]:st}),ot=n.Prec.highest(s.keymap.compute([rt],(t=>t.facet(rt)))),at=s.EditorView.domEventHandlers({mousedown(t,e){let i,n=e.state.field(H,!1)
if(!n||null==(i=e.posAtCoords({x:t.clientX,y:t.clientY})))return!1
let s=n.ranges.find((t=>t.from<=i&&t.to>=i))
return!(!s||s.field==n.active||(e.dispatch({selection:K(n.ranges,s.field),effects:G.of(n.ranges.some((t=>t.field>s.field))?new B(n.ranges,s.field):null)}),0))}})
function lt(t,e){return new RegExp(e(t.source),t.unicode?"u":"")}const ht=Object.create(null)
function ct(t,e,i,n,s){for(let r=t.iterLines(),o=0;!r.next().done;){let t,{value:a}=r
for(e.lastIndex=0;t=e.exec(a);)if(!n[t[0]]&&o+t.index!=s&&(i.push({type:"text",label:t[0]}),n[t[0]]=!0,i.length>=2e3))return
o+=a.length+1}}function ut(t,e,i,n,s){let r=t.length>=1e3,o=r&&e.get(t)
if(o)return o
let a=[],l=Object.create(null)
if(t.children){let r=0
for(let o of t.children){if(o.length>=1e3)for(let t of ut(o,e,i,n-r,s-r))l[t.label]||(l[t.label]=!0,a.push(t))
else ct(o,i,a,l,s-r)
r+=o.length+1}}else ct(t,i,a,l,s)
return r&&a.length<2e3&&e.set(t,a),a}const ft={brackets:["(","[","{","'",'"'],before:")]}:;>",stringPrefixes:[]},dt=n.StateEffect.define({map(t,e){let i=e.mapPos(t,-1,n.MapMode.TrackAfter)
return null==i?void 0:i}}),pt=n.StateEffect.define({map:(t,e)=>e.mapPos(t)}),mt=new class extends n.RangeValue{}
mt.startSide=1,mt.endSide=-1
const gt=n.StateField.define({create:()=>n.RangeSet.empty,update(t,e){if(e.selection){let i=e.state.doc.lineAt(e.selection.main.head).from,s=e.startState.doc.lineAt(e.startState.selection.main.head).from
i!=e.changes.mapPos(s,-1)&&(t=n.RangeSet.empty)}t=t.map(e.changes)
for(let i of e.effects)i.is(dt)?t=t.update({add:[mt.range(i.value,i.value+1)]}):i.is(pt)&&(t=t.update({filter:t=>t!=i.value}))
return t}}),Ot="()[]{}<>"
function vt(t){for(let e=0;e<Ot.length;e+=2)if(Ot.charCodeAt(e)==t)return Ot.charAt(e+1)
return n.fromCodePoint(t<128?t:t+1)}function yt(t,e){return t.languageDataAt("closeBrackets",e)[0]||ft}const bt="object"==typeof navigator&&/Android\b/.test(navigator.userAgent),wt=s.EditorView.inputHandler.of(((t,e,i,s)=>{if((bt?t.composing:t.compositionStarted)||t.state.readOnly)return!1
let r=t.state.selection.main
if(s.length>2||2==s.length&&1==n.codePointSize(n.codePointAt(s,0))||e!=r.from||i!=r.to)return!1
let o=kt(t.state,s)
return!!o&&(t.dispatch(o),!0)})),xt=({state:t,dispatch:e})=>{if(t.readOnly)return!1
let i=yt(t,t.selection.main.head).brackets||ft.brackets,s=null,r=t.changeByRange((e=>{if(e.empty){let s=function(t,e){let i=t.sliceString(e-2,e)
return n.codePointSize(n.codePointAt(i,0))==i.length?i:i.slice(1)}(t.doc,e.head)
for(let r of i)if(r==s&&Pt(t.doc,e.head)==vt(n.codePointAt(r,0)))return{changes:{from:e.head-r.length,to:e.head+r.length},range:n.EditorSelection.cursor(e.head-r.length)}}return{range:s=e}}))
return s||e(t.update(r,{scrollIntoView:!0,userEvent:"delete.backward"})),!s},St=[{key:"Backspace",run:xt}]
function kt(t,e){let i=yt(t,t.selection.main.head),s=i.brackets||ft.brackets
for(let r of s){let o=vt(n.codePointAt(r,0))
if(e==r)return o==r?At(t,r,s.indexOf(r+r+r)>-1,i):Tt(t,r,o,i.before||ft.before)
if(e==o&&Qt(t,t.selection.main.from))return $t(t,0,o)}return null}function Qt(t,e){let i=!1
return t.field(gt).between(0,t.doc.length,(t=>{t==e&&(i=!0)})),i}function Pt(t,e){let i=t.sliceString(e,e+2)
return i.slice(0,n.codePointSize(n.codePointAt(i,0)))}function Tt(t,e,i,s){let r=null,o=t.changeByRange((o=>{if(!o.empty)return{changes:[{insert:e,from:o.from},{insert:i,from:o.to}],effects:dt.of(o.to+e.length),range:n.EditorSelection.range(o.anchor+e.length,o.head+e.length)}
let a=Pt(t.doc,o.head)
return!a||/\s/.test(a)||s.indexOf(a)>-1?{changes:{insert:e+i,from:o.head},effects:dt.of(o.head+e.length),range:n.EditorSelection.cursor(o.head+e.length)}:{range:r=o}}))
return r?null:t.update(o,{scrollIntoView:!0,userEvent:"input.type"})}function $t(t,e,i){let s=null,r=t.selection.ranges.map((e=>e.empty&&Pt(t.doc,e.head)==i?n.EditorSelection.cursor(e.head+i.length):s=e))
return s?null:t.update({selection:n.EditorSelection.create(r,t.selection.mainIndex),scrollIntoView:!0,effects:t.selection.ranges.map((({from:t})=>pt.of(t)))})}function At(t,e,i,s){let o=s.stringPrefixes||ft.stringPrefixes,a=null,l=t.changeByRange((s=>{if(!s.empty)return{changes:[{insert:e,from:s.from},{insert:e,from:s.to}],effects:dt.of(s.to+e.length),range:n.EditorSelection.range(s.anchor+e.length,s.head+e.length)}
let l,h=s.head,c=Pt(t.doc,h)
if(c==e){if(_t(t,h))return{changes:{insert:e+e,from:h},effects:dt.of(h+e.length),range:n.EditorSelection.cursor(h+e.length)}
if(Qt(t,h)){let s=i&&t.sliceDoc(h,h+3*e.length)==e+e+e
return{range:n.EditorSelection.cursor(h+e.length*(s?3:1)),effects:pt.of(h)}}}else{if(i&&t.sliceDoc(h-2*e.length,h)==e+e&&(l=Ct(t,h-2*e.length,o))>-1&&_t(t,l))return{changes:{insert:e+e+e+e,from:h},effects:dt.of(h+e.length),range:n.EditorSelection.cursor(h+e.length)}
if(t.charCategorizer(h)(c)!=n.CharCategory.Word&&Ct(t,h,o)>-1&&!function(t,e,i,n){let s=r.syntaxTree(t).resolveInner(e,-1),o=n.reduce(((t,e)=>Math.max(t,e.length)),0)
for(let r=0;r<5;r++){let r=t.sliceDoc(s.from,Math.min(s.to,s.from+i.length+o)),a=r.indexOf(i)
if(!a||a>-1&&n.indexOf(r.slice(0,a))>-1){let e=s.firstChild
for(;e&&e.from==s.from&&e.to-e.from>i.length+a;){if(t.sliceDoc(e.to-i.length,e.to)==i)return!1
e=e.firstChild}return!0}let l=s.to==e&&s.parent
if(!l)break
s=l}return!1}(t,h,e,o))return{changes:{insert:e+e,from:h},effects:dt.of(h+e.length),range:n.EditorSelection.cursor(h+e.length)}}return{range:a=s}}))
return a?null:t.update(l,{scrollIntoView:!0,userEvent:"input.type"})}function _t(t,e){let i=r.syntaxTree(t).resolveInner(e+1)
return i.parent&&i.from==e}function Ct(t,e,i){let s=t.charCategorizer(e)
if(s(t.sliceDoc(e-1,e))!=n.CharCategory.Word)return e
for(let r of i){let i=e-r.length
if(t.sliceDoc(i,e)==r&&s(t.sliceDoc(i-1,i))!=n.CharCategory.Word)return i}return-1}const Et=[{key:"Ctrl-Space",run:D},{key:"Escape",run:V},{key:"ArrowDown",run:R(!0)},{key:"ArrowUp",run:R(!1)},{key:"PageDown",run:R(!0,"page")},{key:"PageUp",run:R(!1,"page")},{key:"Enter",run:Z}],Mt=n.Prec.highest(s.keymap.computeN([v],(t=>t.facet(v).defaultKeymap?[Et]:[]))),It=new WeakMap
e.CompletionContext=o,e.acceptCompletion=Z,e.autocompletion=function(t={}){return[W,v.of(t),j,Mt,L]},e.clearSnippet=et,e.closeBrackets=function(){return[wt,gt]},e.closeBracketsKeymap=St,e.closeCompletion=V,e.completeAnyWord=t=>{let e=t.state.languageDataAt("wordChars",t.pos).join(""),i=function(t){let e=t.replace(/[\\[.+*?(){|^$]/g,"\\$&")
try{return new RegExp(`[\\p{Alphabetic}\\p{Number}_${e}]+`,"ug")}catch(t){return new RegExp(`[w${e}]`,"g")}}(e),n=t.matchBefore(lt(i,(t=>t+"$")))
if(!n&&!t.explicit)return null
let s=n?n.from:t.pos,r=ut(t.state.doc,function(t){return ht[t]||(ht[t]=new WeakMap)}(e),i,5e4,s)
return{from:s,options:r,validFor:lt(i,(t=>"^"+t))}},e.completeFromList=l,e.completionKeymap=Et,e.completionStatus=function(t){let e=t.field(W,!1)
return e&&e.active.some((t=>1==t.state))?"pending":e&&e.active.some((t=>0!=t.state))?"active":null},e.currentCompletions=function(t){var e
let i=null===(e=t.field(W,!1))||void 0===e?void 0:e.open
if(!i||i.disabled)return[]
let n=It.get(i.options)
return n||It.set(i.options,n=i.options.map((t=>t.completion))),n},e.deleteBracketPair=xt,e.ifIn=function(t,e){return i=>{for(let n=r.syntaxTree(i.state).resolveInner(i.pos,-1);n;n=n.parent)if(t.indexOf(n.name)>-1)return e(i)
return null}},e.ifNotIn=function(t,e){return i=>{for(let e=r.syntaxTree(i.state).resolveInner(i.pos,-1);e;e=e.parent)if(t.indexOf(e.name)>-1)return null
return e(i)}},e.insertBracket=kt,e.insertCompletionText=d,e.moveCompletionSelection=R,e.nextSnippetField=it,e.pickedCompletion=f,e.prevSnippetField=nt,e.selectedCompletion=function(t){var e
let i=null===(e=t.field(W,!1))||void 0===e?void 0:e.open
return i&&!i.disabled&&i.selected>=0?i.options[i.selected].completion:null},e.selectedCompletionIndex=function(t){var e
let i=null===(e=t.field(W,!1))||void 0===e?void 0:e.open
return i&&!i.disabled&&i.selected>=0?i.selected:null},e.setSelectedCompletion=function(t){return I.of(t)},e.snippet=J,e.snippetCompletion=function(t,e){return Object.assign(Object.assign({},e),{apply:J(t)})},e.snippetKeymap=rt,e.startCompletion=D},561:(t,e,i)=>{"use strict"
Object.defineProperty(e,"__esModule",{value:!0})
var n=i(40),s=i(642),r=i(729),o=i(897)
const a=t=>{let e=g(t.state)
return e.line?h(t):!!e.block&&m(t)}
function l(t,e){return({state:i,dispatch:n})=>{if(i.readOnly)return!1
let s=t(e,i)
return!!s&&(n(i.update(s)),!0)}}const h=l(v,0),c=l(v,1),u=l(v,2),f=l(O,0),d=l(O,1),p=l(O,2),m=l(((t,e)=>O(t,e,function(t){let e=[]
for(let i of t.selection.ranges){let n=t.doc.lineAt(i.from),s=i.to<=n.to?n:t.doc.lineAt(i.to),r=e.length-1
r>=0&&e[r].to>n.from?e[r].to=s.to:e.push({from:n.from,to:s.to})}return e}(e))),0)
function g(t,e=t.selection.main.head){let i=t.languageDataAt("commentTokens",e)
return i.length?i[0]:{}}function O(t,e,i=e.selection.ranges){let n=i.map((t=>g(e,t.from).block))
if(!n.every((t=>t)))return null
let s=i.map(((t,i)=>function(t,{open:e,close:i},n,s){let r,o,a=t.sliceDoc(n-50,n),l=t.sliceDoc(s,s+50),h=/\s*$/.exec(a)[0].length,c=/^\s*/.exec(l)[0].length,u=a.length-h
if(a.slice(u-e.length,u)==e&&l.slice(c,c+i.length)==i)return{open:{pos:n-h,margin:h&&1},close:{pos:s+c,margin:c&&1}}
s-n<=100?r=o=t.sliceDoc(n,s):(r=t.sliceDoc(n,n+50),o=t.sliceDoc(s-50,s))
let f=/^\s*/.exec(r)[0].length,d=/\s*$/.exec(o)[0].length,p=o.length-d-i.length
return r.slice(f,f+e.length)==e&&o.slice(p,p+i.length)==i?{open:{pos:n+f+e.length,margin:/\s/.test(r.charAt(f+e.length))?1:0},close:{pos:s-d-i.length,margin:/\s/.test(o.charAt(p-1))?1:0}}:null}(e,n[i],t.from,t.to)))
if(2!=t&&!s.every((t=>t)))return{changes:e.changes(i.map(((t,e)=>s[e]?[]:[{from:t.from,insert:n[e].open+" "},{from:t.to,insert:" "+n[e].close}])))}
if(1!=t&&s.some((t=>t))){let t=[]
for(let e,i=0;i<s.length;i++)if(e=s[i]){let s=n[i],{open:r,close:o}=e
t.push({from:r.pos-s.open.length,to:r.pos+r.margin},{from:o.pos-o.margin,to:o.pos+s.close.length})}return{changes:t}}return null}function v(t,e,i=e.selection.ranges){let n=[],s=-1
for(let{from:r,to:o}of i){let t=n.length,i=1e9
for(let a=r;a<=o;){let t=e.doc.lineAt(a)
if(t.from>s&&(r==o||o>t.from)){s=t.from
let r=g(e,a).line
if(!r)continue
let o=/^\s*/.exec(t.text)[0].length,l=o==t.length,h=t.text.slice(o,o+r.length)==r?o:-1
o<t.text.length&&o<i&&(i=o),n.push({line:t,comment:h,token:r,indent:o,empty:l,single:!1})}a=t.to+1}if(i<1e9)for(let e=t;e<n.length;e++)n[e].indent<n[e].line.text.length&&(n[e].indent=i)
n.length==t+1&&(n[t].single=!0)}if(2!=t&&n.some((t=>t.comment<0&&(!t.empty||t.single)))){let t=[]
for(let{line:e,token:s,indent:r,empty:o,single:a}of n)!a&&o||t.push({from:e.from+r,insert:s+" "})
let i=e.changes(t)
return{changes:i,selection:e.selection.map(i,1)}}if(1!=t&&n.some((t=>t.comment>=0))){let t=[]
for(let{line:e,comment:i,token:s}of n)if(i>=0){let n=e.from+i,r=n+s.length
" "==e.text[r-e.from]&&r++,t.push({from:n,to:r})}return{changes:t}}return null}const y=n.Annotation.define(),b=n.Annotation.define(),w=n.Facet.define(),x=n.Facet.define({combine:t=>n.combineConfig(t,{minDepth:100,newGroupDelay:500},{minDepth:Math.max,newGroupDelay:Math.min})}),S=n.StateField.define({create:()=>L.empty,update(t,e){let i=e.state.facet(x),s=e.annotation(y)
if(s){let r=e.docChanged?n.EditorSelection.single(function(t){let e=0
return t.iterChangedRanges(((t,i)=>e=i)),e}(e.changes)):void 0,o=M.fromTransaction(e,r),a=s.side,l=0==a?t.undone:t.done
return l=o?I(l,l.length,i.minDepth,o):Z(l,e.startState.selection),new L(0==a?s.rest:l,0==a?l:s.rest)}let r=e.annotation(b)
if("full"!=r&&"before"!=r||(t=t.isolate()),!1===e.annotation(n.Transaction.addToHistory))return e.changes.empty?t:t.addMapping(e.changes.desc)
let o=M.fromTransaction(e),a=e.annotation(n.Transaction.time),l=e.annotation(n.Transaction.userEvent)
return o?t=t.addChanges(o,a,l,i.newGroupDelay,i.minDepth):e.selection&&(t=t.addSelection(e.startState.selection,a,l,i.newGroupDelay)),"full"!=r&&"after"!=r||(t=t.isolate()),t},toJSON:t=>({done:t.done.map((t=>t.toJSON())),undone:t.undone.map((t=>t.toJSON()))}),fromJSON:t=>new L(t.done.map(M.fromJSON),t.undone.map(M.fromJSON))}),k=S
function Q(t,e){return function({state:i,dispatch:n}){if(!e&&i.readOnly)return!1
let s=i.field(S,!1)
if(!s)return!1
let r=s.pop(t,i,e)
return!!r&&(n(r),!0)}}const P=Q(0,!1),T=Q(1,!1),$=Q(0,!0),A=Q(1,!0)
function _(t){return function(e){let i=e.field(S,!1)
if(!i)return 0
let n=0==t?i.done:i.undone
return n.length-(n.length&&!n[0].changes?1:0)}}const C=_(0),E=_(1)
class M{constructor(t,e,i,n,s){this.changes=t,this.effects=e,this.mapped=i,this.startSelection=n,this.selectionsAfter=s}setSelAfter(t){return new M(this.changes,this.effects,this.mapped,this.startSelection,t)}toJSON(){var t,e,i
return{changes:null===(t=this.changes)||void 0===t?void 0:t.toJSON(),mapped:null===(e=this.mapped)||void 0===e?void 0:e.toJSON(),startSelection:null===(i=this.startSelection)||void 0===i?void 0:i.toJSON(),selectionsAfter:this.selectionsAfter.map((t=>t.toJSON()))}}static fromJSON(t){return new M(t.changes&&n.ChangeSet.fromJSON(t.changes),[],t.mapped&&n.ChangeDesc.fromJSON(t.mapped),t.startSelection&&n.EditorSelection.fromJSON(t.startSelection),t.selectionsAfter.map(n.EditorSelection.fromJSON))}static fromTransaction(t,e){let i=R
for(let n of t.startState.facet(w)){let e=n(t)
e.length&&(i=i.concat(e))}return!i.length&&t.changes.empty?null:new M(t.changes.invert(t.startState.doc),i,void 0,e||t.startState.selection,R)}static selection(t){return new M(void 0,R,void 0,void 0,t)}}function I(t,e,i,n){let s=e+1>i+20?e-i-1:0,r=t.slice(s,e)
return r.push(n),r}function W(t,e){return t.length?e.length?t.concat(e):t:e}const R=[]
function Z(t,e){if(t.length){let i=t[t.length-1],n=i.selectionsAfter.slice(Math.max(0,i.selectionsAfter.length-200))
return n.length&&n[n.length-1].eq(e)?t:(n.push(e),I(t,t.length-1,1e9,i.setSelAfter(n)))}return[M.selection([e])]}function D(t){let e=t[t.length-1],i=t.slice()
return i[t.length-1]=e.setSelAfter(e.selectionsAfter.slice(0,e.selectionsAfter.length-1)),i}function V(t,e){if(!t.length)return t
let i=t.length,n=R
for(;i;){let s=X(t[i-1],e,n)
if(s.changes&&!s.changes.empty||s.effects.length){let e=t.slice(0,i)
return e[i-1]=s,e}e=s.mapped,i--,n=s.selectionsAfter}return n.length?[M.selection(n)]:R}function X(t,e,i){let s=W(t.selectionsAfter.length?t.selectionsAfter.map((t=>t.map(e))):R,i)
if(!t.changes)return M.selection(s)
let r=t.changes.map(e),o=e.mapDesc(t.changes,!0),a=t.mapped?t.mapped.composeDesc(o):o
return new M(r,n.StateEffect.mapEffects(t.effects,e),a,t.startSelection.map(o),s)}const j=/^(input\.type|delete)($|\.)/
class L{constructor(t,e,i=0,n){this.done=t,this.undone=e,this.prevTime=i,this.prevUserEvent=n}isolate(){return this.prevTime?new L(this.done,this.undone):this}addChanges(t,e,i,n,s){let r=this.done,o=r[r.length-1]
return r=o&&o.changes&&!o.changes.empty&&t.changes&&(!i||j.test(i))&&(!o.selectionsAfter.length&&e-this.prevTime<n&&function(t,e){let i=[],n=!1
return t.iterChangedRanges(((t,e)=>i.push(t,e))),e.iterChangedRanges(((t,e,s,r)=>{for(let o=0;o<i.length;){let t=i[o++],e=i[o++]
r>=t&&s<=e&&(n=!0)}})),n}(o.changes,t.changes)||"input.type.compose"==i)?I(r,r.length-1,s,new M(t.changes.compose(o.changes),W(t.effects,o.effects),o.mapped,o.startSelection,R)):I(r,r.length,s,t),new L(r,R,e,i)}addSelection(t,e,i,n){let s=this.done.length?this.done[this.done.length-1].selectionsAfter:R
return s.length>0&&e-this.prevTime<n&&i==this.prevUserEvent&&i&&/^select($|\.)/.test(i)&&(r=s[s.length-1],o=t,r.ranges.length==o.ranges.length&&0===r.ranges.filter(((t,e)=>t.empty!=o.ranges[e].empty)).length)?this:new L(Z(this.done,t),this.undone,e,i)
var r,o}addMapping(t){return new L(V(this.done,t),V(this.undone,t),this.prevTime,this.prevUserEvent)}pop(t,e,i){let n=0==t?this.done:this.undone
if(0==n.length)return null
let s=n[n.length-1]
if(i&&s.selectionsAfter.length)return e.update({selection:s.selectionsAfter[s.selectionsAfter.length-1],annotations:y.of({side:t,rest:D(n)}),userEvent:0==t?"select.undo":"select.redo",scrollIntoView:!0})
if(s.changes){let i=1==n.length?R:n.slice(0,n.length-1)
return s.mapped&&(i=V(i,s.mapped)),e.update({changes:s.changes,selection:s.startSelection,effects:s.effects,annotations:y.of({side:t,rest:i}),filter:!1,userEvent:0==t?"undo":"redo",scrollIntoView:!0})}return null}}L.empty=new L(R,R)
const N=[{key:"Mod-z",run:P,preventDefault:!0},{key:"Mod-y",mac:"Mod-Shift-z",run:T,preventDefault:!0},{linux:"Ctrl-Shift-z",run:T,preventDefault:!0},{key:"Mod-u",run:$,preventDefault:!0},{key:"Alt-u",mac:"Mod-Shift-u",run:A,preventDefault:!0}]
function U(t,e){return n.EditorSelection.create(t.ranges.map(e),t.mainIndex)}function q(t,e){return t.update({selection:e,scrollIntoView:!0,userEvent:"select"})}function Y({state:t,dispatch:e},i){let n=U(t.selection,i)
return!n.eq(t.selection)&&(e(q(t,n)),!0)}function z(t,e){return n.EditorSelection.cursor(e?t.to:t.from)}function B(t,e){return Y(t,(i=>i.empty?t.moveByChar(i,e):z(i,e)))}function G(t){return t.textDirectionAt(t.state.selection.main.head)==s.Direction.LTR}const F=t=>B(t,!G(t)),H=t=>B(t,G(t))
function K(t,e){return Y(t,(i=>i.empty?t.moveByGroup(i,e):z(i,e)))}const J=t=>K(t,!G(t)),tt=t=>K(t,G(t))
function et(t,e,i){let s=t.state.charCategorizer(e.from)
return t.moveByChar(e,i,(r=>{let o=n.CharCategory.Space,a=e.from,l=!1,h=!1,c=!1,u=e=>{if(l)return!1
a+=i?e.length:-e.length
let r,u=s(e)
if(o==n.CharCategory.Space&&(o=u),o!=u)return!1
if(o==n.CharCategory.Word)if(e.toLowerCase()==e){if(!i&&h)return!1
c=!0}else if(c){if(i)return!1
l=!0}else{if(h&&i&&s(r=t.state.sliceDoc(a,a+1))==n.CharCategory.Word&&r.toLowerCase()==r)return!1
h=!0}return!0}
return u(r),u}))}function it(t,e){return Y(t,(i=>i.empty?et(t,i,e):z(i,e)))}function nt(t,e,i){if(e.type.prop(i))return!0
let n=e.to-e.from
return n&&(n>2||/[^\s,.;:]/.test(t.sliceDoc(e.from,e.to)))||e.firstChild}function st(t,e,i){let s,a,l=r.syntaxTree(t).resolveInner(e.head),h=i?o.NodeProp.closedBy:o.NodeProp.openedBy
for(let n=e.head;;){let e=i?l.childAfter(n):l.childBefore(n)
if(!e)break
nt(t,e,h)?l=e:n=i?e.to:e.from}return a=l.type.prop(h)&&(s=i?r.matchBrackets(t,l.from,1):r.matchBrackets(t,l.to,-1))&&s.matched?i?s.end.to:s.end.from:i?l.to:l.from,n.EditorSelection.cursor(a,i?-1:1)}const rt=t=>Y(t,(e=>st(t.state,e,!G(t)))),ot=t=>Y(t,(e=>st(t.state,e,G(t))))
function at(t,e){return Y(t,(i=>{if(!i.empty)return z(i,e)
let n=t.moveVertically(i,e)
return n.head!=i.head?n:t.moveToLineBoundary(i,e)}))}const lt=t=>at(t,!1),ht=t=>at(t,!0)
function ct(t){return Math.max(t.defaultLineHeight,Math.min(t.dom.clientHeight,innerHeight)-5)}function ut(t,e){let{state:i}=t,n=U(i.selection,(i=>i.empty?t.moveVertically(i,e,ct(t)):z(i,e)))
if(n.eq(i.selection))return!1
let r,o=t.coordsAtPos(i.selection.main.head),a=t.scrollDOM.getBoundingClientRect()
return o&&o.top>a.top&&o.bottom<a.bottom&&o.top-a.top<=t.scrollDOM.scrollHeight-t.scrollDOM.scrollTop-t.scrollDOM.clientHeight&&(r=s.EditorView.scrollIntoView(n.main.head,{y:"start",yMargin:o.top-a.top})),t.dispatch(q(i,n),{effects:r}),!0}const ft=t=>ut(t,!1),dt=t=>ut(t,!0)
function pt(t,e,i){let s=t.lineBlockAt(e.head),r=t.moveToLineBoundary(e,i)
if(r.head==e.head&&r.head!=(i?s.to:s.from)&&(r=t.moveToLineBoundary(e,i,!1)),!i&&r.head==s.from&&s.length){let i=/^\s*/.exec(t.state.sliceDoc(s.from,Math.min(s.from+100,s.to)))[0].length
i&&e.head!=s.from+i&&(r=n.EditorSelection.cursor(s.from+i))}return r}const mt=t=>Y(t,(e=>pt(t,e,!0))),gt=t=>Y(t,(e=>pt(t,e,!1))),Ot=t=>Y(t,(e=>pt(t,e,!G(t)))),vt=t=>Y(t,(e=>pt(t,e,G(t)))),yt=t=>Y(t,(e=>n.EditorSelection.cursor(t.lineBlockAt(e.head).from,1))),bt=t=>Y(t,(e=>n.EditorSelection.cursor(t.lineBlockAt(e.head).to,-1)))
function wt(t,e,i){let s=!1,o=U(t.selection,(e=>{let o=r.matchBrackets(t,e.head,-1)||r.matchBrackets(t,e.head,1)||e.head>0&&r.matchBrackets(t,e.head-1,1)||e.head<t.doc.length&&r.matchBrackets(t,e.head+1,-1)
if(!o||!o.end)return e
s=!0
let a=o.start.from==e.head?o.end.to:o.end.from
return i?n.EditorSelection.range(e.anchor,a):n.EditorSelection.cursor(a)}))
return!!s&&(e(q(t,o)),!0)}const xt=({state:t,dispatch:e})=>wt(t,e,!1)
function St(t,e){let i=U(t.state.selection,(t=>{let i=e(t)
return n.EditorSelection.range(t.anchor,i.head,i.goalColumn)}))
return!i.eq(t.state.selection)&&(t.dispatch(q(t.state,i)),!0)}function kt(t,e){return St(t,(i=>t.moveByChar(i,e)))}const Qt=t=>kt(t,!G(t)),Pt=t=>kt(t,G(t))
function Tt(t,e){return St(t,(i=>t.moveByGroup(i,e)))}const $t=t=>Tt(t,!G(t)),At=t=>Tt(t,G(t))
function _t(t,e){return St(t,(i=>et(t,i,e)))}const Ct=t=>St(t,(e=>st(t.state,e,!G(t)))),Et=t=>St(t,(e=>st(t.state,e,G(t))))
function Mt(t,e){return St(t,(i=>t.moveVertically(i,e)))}const It=t=>Mt(t,!1),Wt=t=>Mt(t,!0)
function Rt(t,e){return St(t,(i=>t.moveVertically(i,e,ct(t))))}const Zt=t=>Rt(t,!1),Dt=t=>Rt(t,!0),Vt=t=>St(t,(e=>pt(t,e,!0))),Xt=t=>St(t,(e=>pt(t,e,!1))),jt=t=>St(t,(e=>pt(t,e,!G(t)))),Lt=t=>St(t,(e=>pt(t,e,G(t)))),Nt=t=>St(t,(e=>n.EditorSelection.cursor(t.lineBlockAt(e.head).from))),Ut=t=>St(t,(e=>n.EditorSelection.cursor(t.lineBlockAt(e.head).to))),qt=({state:t,dispatch:e})=>(e(q(t,{anchor:0})),!0),Yt=({state:t,dispatch:e})=>(e(q(t,{anchor:t.doc.length})),!0),zt=({state:t,dispatch:e})=>(e(q(t,{anchor:t.selection.main.anchor,head:0})),!0),Bt=({state:t,dispatch:e})=>(e(q(t,{anchor:t.selection.main.anchor,head:t.doc.length})),!0),Gt=({state:t,dispatch:e})=>(e(t.update({selection:{anchor:0,head:t.doc.length},userEvent:"select"})),!0),Ft=({state:t,dispatch:e})=>{let i=ue(t).map((({from:e,to:i})=>n.EditorSelection.range(e,Math.min(i+1,t.doc.length))))
return e(t.update({selection:n.EditorSelection.create(i),userEvent:"select"})),!0},Ht=({state:t,dispatch:e})=>{let i=U(t.selection,(e=>{var i
let s=r.syntaxTree(t).resolveInner(e.head,1)
for(;!(s.from<e.from&&s.to>=e.to||s.to>e.to&&s.from<=e.from)&&(null===(i=s.parent)||void 0===i?void 0:i.parent);)s=s.parent
return n.EditorSelection.range(s.to,s.from)}))
return e(q(t,i)),!0},Kt=({state:t,dispatch:e})=>{let i=t.selection,s=null
return i.ranges.length>1?s=n.EditorSelection.create([i.main]):i.main.empty||(s=n.EditorSelection.create([n.EditorSelection.cursor(i.main.head)])),!!s&&(e(q(t,s)),!0)}
function Jt(t,e){if(t.state.readOnly)return!1
let i="delete.selection",{state:r}=t,o=r.changeByRange((s=>{let{from:r,to:o}=s
if(r==o){let n=e(r)
n<r?(i="delete.backward",n=te(t,n,!1)):n>r&&(i="delete.forward",n=te(t,n,!0)),r=Math.min(r,n),o=Math.max(o,n)}else r=te(t,r,!1),o=te(t,o,!0)
return r==o?{range:s}:{changes:{from:r,to:o},range:n.EditorSelection.cursor(r)}}))
return!o.changes.empty&&(t.dispatch(r.update(o,{scrollIntoView:!0,userEvent:i,effects:"delete.selection"==i?s.EditorView.announce.of(r.phrase("Selection deleted")):void 0})),!0)}function te(t,e,i){if(t instanceof s.EditorView)for(let n of t.state.facet(s.EditorView.atomicRanges).map((e=>e(t))))n.between(e,e,((t,n)=>{t<e&&n>e&&(e=i?n:t)}))
return e}const ee=(t,e)=>Jt(t,(i=>{let s,o,{state:a}=t,l=a.doc.lineAt(i)
if(!e&&i>l.from&&i<l.from+200&&!/[^ \t]/.test(s=l.text.slice(0,i-l.from))){if("\t"==s[s.length-1])return i-1
let t=n.countColumn(s,a.tabSize)%r.getIndentUnit(a)||r.getIndentUnit(a)
for(let e=0;e<t&&" "==s[s.length-1-e];e++)i--
o=i}else o=n.findClusterBreak(l.text,i-l.from,e,e)+l.from,o==i&&l.number!=(e?a.doc.lines:1)&&(o+=e?1:-1)
return o})),ie=t=>ee(t,!1),ne=t=>ee(t,!0),se=(t,e)=>Jt(t,(i=>{let s=i,{state:r}=t,o=r.doc.lineAt(s),a=r.charCategorizer(s)
for(let t=null;;){if(s==(e?o.to:o.from)){s==i&&o.number!=(e?r.doc.lines:1)&&(s+=e?1:-1)
break}let l=n.findClusterBreak(o.text,s-o.from,e)+o.from,h=o.text.slice(Math.min(s,l)-o.from,Math.max(s,l)-o.from),c=a(h)
if(null!=t&&c!=t)break
" "==h&&s==i||(t=c),s=l}return s})),re=t=>se(t,!1),oe=t=>se(t,!0),ae=t=>Jt(t,(e=>{let i=t.lineBlockAt(e).to
return e<i?i:Math.min(t.state.doc.length,e+1)})),le=t=>Jt(t,(e=>{let i=t.lineBlockAt(e).from
return e>i?i:Math.max(0,e-1)})),he=({state:t,dispatch:e})=>{if(t.readOnly)return!1
let i=t.changeByRange((t=>({changes:{from:t.from,to:t.to,insert:n.Text.of(["",""])},range:n.EditorSelection.cursor(t.from)})))
return e(t.update(i,{scrollIntoView:!0,userEvent:"input"})),!0},ce=({state:t,dispatch:e})=>{if(t.readOnly)return!1
let i=t.changeByRange((e=>{if(!e.empty||0==e.from||e.from==t.doc.length)return{range:e}
let i=e.from,s=t.doc.lineAt(i),r=i==s.from?i-1:n.findClusterBreak(s.text,i-s.from,!1)+s.from,o=i==s.to?i+1:n.findClusterBreak(s.text,i-s.from,!0)+s.from
return{changes:{from:r,to:o,insert:t.doc.slice(i,o).append(t.doc.slice(r,i))},range:n.EditorSelection.cursor(o)}}))
return!i.changes.empty&&(e(t.update(i,{scrollIntoView:!0,userEvent:"move.character"})),!0)}
function ue(t){let e=[],i=-1
for(let n of t.selection.ranges){let s=t.doc.lineAt(n.from),r=t.doc.lineAt(n.to)
if(n.empty||n.to!=r.from||(r=t.doc.lineAt(n.to-1)),i>=s.number){let t=e[e.length-1]
t.to=r.to,t.ranges.push(n)}else e.push({from:s.from,to:r.to,ranges:[n]})
i=r.number+1}return e}function fe(t,e,i){if(t.readOnly)return!1
let s=[],r=[]
for(let o of ue(t)){if(i?o.to==t.doc.length:0==o.from)continue
let e=t.doc.lineAt(i?o.to+1:o.from-1),a=e.length+1
if(i){s.push({from:o.to,to:e.to},{from:o.from,insert:e.text+t.lineBreak})
for(let e of o.ranges)r.push(n.EditorSelection.range(Math.min(t.doc.length,e.anchor+a),Math.min(t.doc.length,e.head+a)))}else{s.push({from:e.from,to:o.from},{from:o.to,insert:t.lineBreak+e.text})
for(let t of o.ranges)r.push(n.EditorSelection.range(t.anchor-a,t.head-a))}}return!!s.length&&(e(t.update({changes:s,scrollIntoView:!0,selection:n.EditorSelection.create(r,t.selection.mainIndex),userEvent:"move.line"})),!0)}const de=({state:t,dispatch:e})=>fe(t,e,!1),pe=({state:t,dispatch:e})=>fe(t,e,!0)
function me(t,e,i){if(t.readOnly)return!1
let n=[]
for(let s of ue(t))i?n.push({from:s.from,insert:t.doc.slice(s.from,s.to)+t.lineBreak}):n.push({from:s.to,insert:t.lineBreak+t.doc.slice(s.from,s.to)})
return e(t.update({changes:n,scrollIntoView:!0,userEvent:"input.copyline"})),!0}const ge=({state:t,dispatch:e})=>me(t,e,!1),Oe=({state:t,dispatch:e})=>me(t,e,!0),ve=t=>{if(t.state.readOnly)return!1
let{state:e}=t,i=e.changes(ue(e).map((({from:t,to:i})=>(t>0?t--:i<e.doc.length&&i++,{from:t,to:i})))),n=U(e.selection,(e=>t.moveVertically(e,!0))).map(i)
return t.dispatch({changes:i,selection:n,scrollIntoView:!0,userEvent:"delete.line"}),!0},ye=we(!1),be=we(!0)
function we(t){return({state:e,dispatch:i})=>{if(e.readOnly)return!1
let s=e.changeByRange((i=>{let{from:s,to:a}=i,l=e.doc.lineAt(s),h=!t&&s==a&&function(t,e){if(/\(\)|\[\]|\{\}/.test(t.sliceDoc(e-1,e+1)))return{from:e,to:e}
let i,n=r.syntaxTree(t).resolveInner(e),s=n.childBefore(e),a=n.childAfter(e)
return s&&a&&s.to<=e&&a.from>=e&&(i=s.type.prop(o.NodeProp.closedBy))&&i.indexOf(a.name)>-1&&t.doc.lineAt(s.to).from==t.doc.lineAt(a.from).from?{from:s.to,to:a.from}:null}(e,s)
t&&(s=a=(a<=l.to?l:e.doc.lineAt(a)).to)
let c=new r.IndentContext(e,{simulateBreak:s,simulateDoubleBreak:!!h}),u=r.getIndentation(c,s)
for(null==u&&(u=/^\s*/.exec(e.doc.lineAt(s).text)[0].length);a<l.to&&/\s/.test(l.text[a-l.from]);)a++
h?({from:s,to:a}=h):s>l.from&&s<l.from+100&&!/\S/.test(l.text.slice(0,s))&&(s=l.from)
let f=["",r.indentString(e,u)]
return h&&f.push(r.indentString(e,c.lineIndent(l.from,-1))),{changes:{from:s,to:a,insert:n.Text.of(f)},range:n.EditorSelection.cursor(s+1+f[1].length)}}))
return i(e.update(s,{scrollIntoView:!0,userEvent:"input"})),!0}}function xe(t,e){let i=-1
return t.changeByRange((s=>{let r=[]
for(let n=s.from;n<=s.to;){let o=t.doc.lineAt(n)
o.number>i&&(s.empty||s.to>o.from)&&(e(o,r,s),i=o.number),n=o.to+1}let o=t.changes(r)
return{changes:r,range:n.EditorSelection.range(o.mapPos(s.anchor,1),o.mapPos(s.head,1))}}))}const Se=({state:t,dispatch:e})=>{if(t.readOnly)return!1
let i=Object.create(null),n=new r.IndentContext(t,{overrideIndentation:t=>{let e=i[t]
return null==e?-1:e}}),s=xe(t,((e,s,o)=>{let a=r.getIndentation(n,e.from)
if(null==a)return;/\S/.test(e.text)||(a=0)
let l=/^\s*/.exec(e.text)[0],h=r.indentString(t,a);(l!=h||o.from<e.from+l.length)&&(i[e.from]=a,s.push({from:e.from,to:e.from+l.length,insert:h}))}))
return s.changes.empty||e(t.update(s,{userEvent:"indent"})),!0},ke=({state:t,dispatch:e})=>!t.readOnly&&(e(t.update(xe(t,((e,i)=>{i.push({from:e.from,insert:t.facet(r.indentUnit)})})),{userEvent:"input.indent"})),!0),Qe=({state:t,dispatch:e})=>!t.readOnly&&(e(t.update(xe(t,((e,i)=>{let s=/^\s*/.exec(e.text)[0]
if(!s)return
let o=n.countColumn(s,t.tabSize),a=0,l=r.indentString(t,Math.max(0,o-r.getIndentUnit(t)))
for(;a<s.length&&a<l.length&&s.charCodeAt(a)==l.charCodeAt(a);)a++
i.push({from:e.from+a,to:e.from+s.length,insert:l.slice(a)})})),{userEvent:"delete.dedent"})),!0),Pe=[{key:"Ctrl-b",run:F,shift:Qt,preventDefault:!0},{key:"Ctrl-f",run:H,shift:Pt},{key:"Ctrl-p",run:lt,shift:It},{key:"Ctrl-n",run:ht,shift:Wt},{key:"Ctrl-a",run:yt,shift:Nt},{key:"Ctrl-e",run:bt,shift:Ut},{key:"Ctrl-d",run:ne},{key:"Ctrl-h",run:ie},{key:"Ctrl-k",run:ae},{key:"Ctrl-Alt-h",run:re},{key:"Ctrl-o",run:he},{key:"Ctrl-t",run:ce},{key:"Ctrl-v",run:dt}],Te=[{key:"ArrowLeft",run:F,shift:Qt,preventDefault:!0},{key:"Mod-ArrowLeft",mac:"Alt-ArrowLeft",run:J,shift:$t,preventDefault:!0},{mac:"Cmd-ArrowLeft",run:Ot,shift:jt,preventDefault:!0},{key:"ArrowRight",run:H,shift:Pt,preventDefault:!0},{key:"Mod-ArrowRight",mac:"Alt-ArrowRight",run:tt,shift:At,preventDefault:!0},{mac:"Cmd-ArrowRight",run:vt,shift:Lt,preventDefault:!0},{key:"ArrowUp",run:lt,shift:It,preventDefault:!0},{mac:"Cmd-ArrowUp",run:qt,shift:zt},{mac:"Ctrl-ArrowUp",run:ft,shift:Zt},{key:"ArrowDown",run:ht,shift:Wt,preventDefault:!0},{mac:"Cmd-ArrowDown",run:Yt,shift:Bt},{mac:"Ctrl-ArrowDown",run:dt,shift:Dt},{key:"PageUp",run:ft,shift:Zt},{key:"PageDown",run:dt,shift:Dt},{key:"Home",run:gt,shift:Xt,preventDefault:!0},{key:"Mod-Home",run:qt,shift:zt},{key:"End",run:mt,shift:Vt,preventDefault:!0},{key:"Mod-End",run:Yt,shift:Bt},{key:"Enter",run:ye},{key:"Mod-a",run:Gt},{key:"Backspace",run:ie,shift:ie},{key:"Delete",run:ne},{key:"Mod-Backspace",mac:"Alt-Backspace",run:re},{key:"Mod-Delete",mac:"Alt-Delete",run:oe},{mac:"Mod-Backspace",run:le},{mac:"Mod-Delete",run:ae}].concat(Pe.map((t=>({mac:t.key,run:t.run,shift:t.shift})))),$e=[{key:"Alt-ArrowLeft",mac:"Ctrl-ArrowLeft",run:rt,shift:Ct},{key:"Alt-ArrowRight",mac:"Ctrl-ArrowRight",run:ot,shift:Et},{key:"Alt-ArrowUp",run:de},{key:"Shift-Alt-ArrowUp",run:ge},{key:"Alt-ArrowDown",run:pe},{key:"Shift-Alt-ArrowDown",run:Oe},{key:"Escape",run:Kt},{key:"Mod-Enter",run:be},{key:"Alt-l",mac:"Ctrl-l",run:Ft},{key:"Mod-i",run:Ht,preventDefault:!0},{key:"Mod-[",run:Qe},{key:"Mod-]",run:ke},{key:"Mod-Alt-\\",run:Se},{key:"Shift-Mod-k",run:ve},{key:"Shift-Mod-\\",run:xt},{key:"Mod-/",run:a},{key:"Alt-A",run:f}].concat(Te),Ae={key:"Tab",run:ke,shift:Qe}
e.blockComment=d,e.blockUncomment=p,e.copyLineDown=Oe,e.copyLineUp=ge,e.cursorCharBackward=t=>B(t,!1),e.cursorCharForward=t=>B(t,!0),e.cursorCharLeft=F,e.cursorCharRight=H,e.cursorDocEnd=Yt,e.cursorDocStart=qt,e.cursorGroupBackward=t=>K(t,!1),e.cursorGroupForward=t=>K(t,!0),e.cursorGroupLeft=J,e.cursorGroupRight=tt,e.cursorLineBoundaryBackward=gt,e.cursorLineBoundaryForward=mt,e.cursorLineBoundaryLeft=Ot,e.cursorLineBoundaryRight=vt,e.cursorLineDown=ht,e.cursorLineEnd=bt,e.cursorLineStart=yt,e.cursorLineUp=lt,e.cursorMatchingBracket=xt,e.cursorPageDown=dt,e.cursorPageUp=ft,e.cursorSubwordBackward=t=>it(t,!1),e.cursorSubwordForward=t=>it(t,!0),e.cursorSyntaxLeft=rt,e.cursorSyntaxRight=ot,e.defaultKeymap=$e,e.deleteCharBackward=ie,e.deleteCharForward=ne,e.deleteGroupBackward=re,e.deleteGroupForward=oe,e.deleteLine=ve,e.deleteToLineEnd=ae,e.deleteToLineStart=le,e.deleteTrailingWhitespace=({state:t,dispatch:e})=>{if(t.readOnly)return!1
let i=[]
for(let n=0,s="",r=t.doc.iter();;){if(r.next(),r.lineBreak||r.done){let t=s.search(/\s+$/)
if(t>-1&&i.push({from:n-(s.length-t),to:n}),r.done)break
s=""}else s=r.value
n+=r.value.length}return!!i.length&&(e(t.update({changes:i,userEvent:"delete"})),!0)},e.emacsStyleKeymap=Pe,e.history=function(t={}){return[S,x.of(t),s.EditorView.domEventHandlers({beforeinput(t,e){let i="historyUndo"==t.inputType?P:"historyRedo"==t.inputType?T:null
return!!i&&(t.preventDefault(),i(e))}})]},e.historyField=k,e.historyKeymap=N,e.indentLess=Qe,e.indentMore=ke,e.indentSelection=Se,e.indentWithTab=Ae,e.insertBlankLine=be,e.insertNewline=({state:t,dispatch:e})=>(e(t.update(t.replaceSelection(t.lineBreak),{scrollIntoView:!0,userEvent:"input"})),!0),e.insertNewlineAndIndent=ye,e.insertTab=({state:t,dispatch:e})=>t.selection.ranges.some((t=>!t.empty))?ke({state:t,dispatch:e}):(e(t.update(t.replaceSelection("\t"),{scrollIntoView:!0,userEvent:"input"})),!0),e.invertedEffects=w,e.isolateHistory=b,e.lineComment=c,e.lineUncomment=u,e.moveLineDown=pe,e.moveLineUp=de,e.redo=T,e.redoDepth=E,e.redoSelection=A,e.selectAll=Gt,e.selectCharBackward=t=>kt(t,!1),e.selectCharForward=t=>kt(t,!0),e.selectCharLeft=Qt,e.selectCharRight=Pt,e.selectDocEnd=Bt,e.selectDocStart=zt,e.selectGroupBackward=t=>Tt(t,!1),e.selectGroupForward=t=>Tt(t,!0),e.selectGroupLeft=$t,e.selectGroupRight=At,e.selectLine=Ft,e.selectLineBoundaryBackward=Xt,e.selectLineBoundaryForward=Vt,e.selectLineBoundaryLeft=jt,e.selectLineBoundaryRight=Lt,e.selectLineDown=Wt,e.selectLineEnd=Ut,e.selectLineStart=Nt,e.selectLineUp=It,e.selectMatchingBracket=({state:t,dispatch:e})=>wt(t,e,!0),e.selectPageDown=Dt,e.selectPageUp=Zt,e.selectParentSyntax=Ht,e.selectSubwordBackward=t=>_t(t,!1),e.selectSubwordForward=t=>_t(t,!0),e.selectSyntaxLeft=Ct,e.selectSyntaxRight=Et,e.simplifySelection=Kt,e.splitLine=he,e.standardKeymap=Te,e.toggleBlockComment=f,e.toggleBlockCommentByLine=m,e.toggleComment=a,e.toggleLineComment=h,e.transposeChars=ce,e.undo=P,e.undoDepth=C,e.undoSelection=$},956:(t,e,i)=>{"use strict"
Object.defineProperty(e,"__esModule",{value:!0})
var n=i(88),s=i(729),r=i(40),o=i(642),a=i(526),l=i(897)
const h=[a.snippetCompletion("function ${name}(${params}) {\n\t${}\n}",{label:"function",detail:"definition",type:"keyword"}),a.snippetCompletion("for (let ${index} = 0; ${index} < ${bound}; ${index}++) {\n\t${}\n}",{label:"for",detail:"loop",type:"keyword"}),a.snippetCompletion("for (let ${name} of ${collection}) {\n\t${}\n}",{label:"for",detail:"of loop",type:"keyword"}),a.snippetCompletion("do {\n\t${}\n} while (${})",{label:"do",detail:"loop",type:"keyword"}),a.snippetCompletion("while (${}) {\n\t${}\n}",{label:"while",detail:"loop",type:"keyword"}),a.snippetCompletion("try {\n\t${}\n} catch (${error}) {\n\t${}\n}",{label:"try",detail:"/ catch block",type:"keyword"}),a.snippetCompletion("if (${}) {\n\t${}\n}",{label:"if",detail:"block",type:"keyword"}),a.snippetCompletion("if (${}) {\n\t${}\n} else {\n\t${}\n}",{label:"if",detail:"/ else block",type:"keyword"}),a.snippetCompletion("class ${name} {\n\tconstructor(${params}) {\n\t\t${}\n\t}\n}",{label:"class",detail:"definition",type:"keyword"}),a.snippetCompletion('import {${names}} from "${module}"\n${}',{label:"import",detail:"named",type:"keyword"}),a.snippetCompletion('import ${name} from "${module}"\n${}',{label:"import",detail:"default",type:"keyword"})],c=new l.NodeWeakMap,u=new Set(["Script","Block","FunctionExpression","FunctionDeclaration","ArrowFunction","MethodDeclaration","ForStatement"])
function f(t){return(e,i)=>{let n=e.node.getChild("VariableDefinition")
return n&&i(n,t),!0}}const d=["FunctionDeclaration"],p={FunctionDeclaration:f("function"),ClassDeclaration:f("class"),ClassExpression:()=>!0,EnumDeclaration:f("constant"),TypeAliasDeclaration:f("type"),NamespaceDeclaration:f("namespace"),VariableDefinition(t,e){t.matchContext(d)||e(t,"variable")},TypeDefinition(t,e){e(t,"type")},__proto__:null}
function m(t,e){let i=c.get(e)
if(i)return i
let n=[],s=!0
function r(e,i){let s=t.sliceString(e.from,e.to)
n.push({label:s,type:i})}return e.cursor(l.IterMode.IncludeAnonymous).iterate((e=>{if(s)s=!1
else if(e.name){let t=p[e.name]
if(t&&t(e,r)||u.has(e.name))return!1}else if(e.to-e.from>8192){for(let i of m(t,e.node))n.push(i)
return!1}})),c.set(e,n),n}const g=/^[\w$\xa1-\uffff][\w$\d\xa1-\uffff]*$/,O=["TemplateString","String","RegExp","LineComment","BlockComment","VariableDefinition","TypeDefinition","Label","PropertyDefinition","PropertyName","PrivatePropertyDefinition","PrivatePropertyName"]
function v(t){let e=s.syntaxTree(t.state).resolveInner(t.pos,-1)
if(O.indexOf(e.name)>-1)return null
let i="VariableName"==e.name||e.to-e.from<20&&g.test(t.state.sliceDoc(e.from,e.to))
if(!i&&!t.explicit)return null
let n=[]
for(let s=e;s;s=s.parent)u.has(s.name)&&(n=n.concat(m(t.state.doc,s)))
return{options:n,from:i?e.from:t.pos,validFor:g}}function y(t,e,i){var n
let s=[]
for(;;){let r,o=e.firstChild
if("VariableName"==(null==o?void 0:o.name))return s.push(t(o)),{path:s.reverse(),name:i}
if("MemberExpression"!=(null==o?void 0:o.name)||"PropertyName"!=(null===(n=r=o.lastChild)||void 0===n?void 0:n.name))return null
s.push(t(r)),e=o}}function b(t){let e=e=>t.state.doc.sliceString(e.from,e.to),i=s.syntaxTree(t.state).resolveInner(t.pos,-1)
return"PropertyName"==i.name?y(e,i.parent,e(i)):O.indexOf(i.name)>-1?null:"VariableName"==i.name||i.to-i.from<20&&g.test(e(i))?{path:[],name:e(i)}:"."!=i.name&&"?."!=i.name||"MemberExpression"!=i.parent.name?"MemberExpression"==i.name?y(e,i,""):t.explicit?{path:[],name:""}:null:y(e,i.parent,"")}const w=s.LRLanguage.define({name:"javascript",parser:n.parser.configure({props:[s.indentNodeProp.add({IfStatement:s.continuedIndent({except:/^\s*({|else\b)/}),TryStatement:s.continuedIndent({except:/^\s*({|catch\b|finally\b)/}),LabeledStatement:s.flatIndent,SwitchBody:t=>{let e=t.textAfter,i=/^\s*\}/.test(e),n=/^\s*(case|default)\b/.test(e)
return t.baseIndent+(i?0:n?1:2)*t.unit},Block:s.delimitedIndent({closing:"}"}),ArrowFunction:t=>t.baseIndent+t.unit,"TemplateString BlockComment":()=>null,"Statement Property":s.continuedIndent({except:/^{/}),JSXElement(t){let e=/^\s*<\//.test(t.textAfter)
return t.lineIndent(t.node.from)+(e?0:t.unit)},JSXEscape(t){let e=/\s*\}/.test(t.textAfter)
return t.lineIndent(t.node.from)+(e?0:t.unit)},"JSXOpenTag JSXSelfClosingTag":t=>t.column(t.node.from)+t.unit}),s.foldNodeProp.add({"Block ClassBody SwitchBody EnumBody ObjectExpression ArrayExpression":s.foldInside,BlockComment:t=>({from:t.from+2,to:t.to-2})})]}),languageData:{closeBrackets:{brackets:["(","[","{","'",'"',"`"]},commentTokens:{line:"//",block:{open:"/*",close:"*/"}},indentOnInput:/^\s*(?:case |default:|\{|\}|<\/)$/,wordChars:"$"}}),x=w.configure({dialect:"ts"},"typescript"),S=w.configure({dialect:"jsx"}),k=w.configure({dialect:"jsx ts"},"typescript"),Q="break case const continue default delete export extends false finally in instanceof let new return static super switch this throw true typeof var yield".split(" ").map((t=>({label:t,type:"keyword"})))
function P(t,e,i=t.length){for(let n=null==e?void 0:e.firstChild;n;n=n.nextSibling)if("JSXIdentifier"==n.name||"JSXBuiltin"==n.name||"JSXNamespacedName"==n.name||"JSXMemberExpression"==n.name)return t.sliceString(n.from,Math.min(n.to,i))
return""}const T="object"==typeof navigator&&/Android\b/.test(navigator.userAgent),$=o.EditorView.inputHandler.of(((t,e,i,n)=>{if((T?t.composing:t.compositionStarted)||t.state.readOnly||e!=i||">"!=n&&"/"!=n||!w.isActiveAt(t.state,e,-1))return!1
let{state:o}=t,a=o.changeByRange((t=>{var e,i
let a,{head:l}=t,h=s.syntaxTree(o).resolveInner(l,-1)
if("JSXStartTag"==h.name&&(h=h.parent),">"==n&&"JSXFragmentTag"==h.name)return{range:r.EditorSelection.cursor(l+1),changes:{from:l,insert:"><>"}}
if("/"==n&&"JSXFragmentTag"==h.name){let t=h.parent,i=null==t?void 0:t.parent
if(t.from==l-1&&"JSXEndTag"!=(null===(e=i.lastChild)||void 0===e?void 0:e.name)&&(a=P(o.doc,null==i?void 0:i.firstChild,l))){let t=`/${a}>`
return{range:r.EditorSelection.cursor(l+t.length),changes:{from:l,insert:t}}}}else if(">"==n){let t=function(t){for(;;){if("JSXOpenTag"==t.name||"JSXSelfClosingTag"==t.name||"JSXFragmentTag"==t.name)return t
if(!t.parent)return null
t=t.parent}}(h)
if(t&&"JSXEndTag"!=(null===(i=t.lastChild)||void 0===i?void 0:i.name)&&"</"!=o.sliceDoc(l,l+2)&&(a=P(o.doc,t,l)))return{range:r.EditorSelection.cursor(l+1),changes:{from:l,insert:`></${a}>`}}}return{range:t}}))
return!a.changes.empty&&(t.dispatch(a,{userEvent:"input.type",scrollIntoView:!0}),!0)}))
function A(t,e,i,n){return i.line(t+n.line).from+e+(1==t?n.col-1:-1)}function _(t,e,i){let n=A(t.line,t.column,e,i),s={from:n,to:null!=t.endLine&&1!=t.endColumn?A(t.endLine,t.endColumn,e,i):n,message:t.message,source:t.ruleId?"eslint:"+t.ruleId:"eslint",severity:1==t.severity?"warning":"error"}
if(t.fix){let{range:e,text:r}=t.fix,o=e[0]+i.pos-n,a=e[1]+i.pos-n
s.actions=[{name:"fix",apply(t,e){t.dispatch({changes:{from:e+o,to:e+a,insert:r},scrollIntoView:!0})}}]}return s}e.autoCloseTags=$,e.completionPath=b,e.esLint=function(t,e){return e||(e={parserOptions:{ecmaVersion:2019,sourceType:"module"},env:{browser:!0,node:!0,es6:!0,es2015:!0,es2017:!0,es2020:!0},rules:{}},t.getRules().forEach(((t,i)=>{t.meta.docs.recommended&&(e.rules[i]=2)}))),i=>{let{state:n}=i,s=[]
for(let{from:r,to:o}of w.findRegions(n)){let i=n.doc.lineAt(r),a={line:i.number-1,col:r-i.from,pos:r}
for(let l of t.verify(n.sliceDoc(r,o),e))s.push(_(l,n.doc,a))}return s}},e.javascript=function(t={}){let e=t.jsx?t.typescript?k:S:t.typescript?x:w
return new s.LanguageSupport(e,[w.data.of({autocomplete:a.ifNotIn(O,a.completeFromList(h.concat(Q)))}),w.data.of({autocomplete:v}),t.jsx?$:[]])},e.javascriptLanguage=w,e.jsxLanguage=S,e.localCompletionSource=v,e.scopeCompletionSource=function(t){let e=new Map
return i=>{let n=b(i)
if(!n)return null
let s=t
for(let t of n.path)if(s=s[t],!s)return null
let r=e.get(s)
return r||e.set(s,r=function(t,e){let i=[],n=new Set
for(let s=0;;s++){for(let o of(Object.getOwnPropertyNames||Object.keys)(t)){if(n.has(o))continue
let r
n.add(o)
try{r=t[o]}catch(t){continue}i.push({label:o,type:"function"==typeof r?/^[A-Z]/.test(o)?"class":e?"function":"method":e?"variable":"property",boost:-s})}let r=Object.getPrototypeOf(t)
if(!r)return i
t=r}}(s,!n.path.length)),{from:i.pos-n.name.length,options:r,validFor:g}}},e.snippets=h,e.tsxLanguage=k,e.typescriptLanguage=x},729:(t,e,i)=>{"use strict"
Object.defineProperty(e,"__esModule",{value:!0})
var n,s=i(897),r=i(40),o=i(642),a=i(48),l=i(223)
const h=new s.NodeProp
function c(t){return r.Facet.define({combine:t?e=>e.concat(t):void 0})}class u{constructor(t,e,i=[],n=""){this.data=t,this.name=n,r.EditorState.prototype.hasOwnProperty("tree")||Object.defineProperty(r.EditorState.prototype,"tree",{get(){return p(this)}}),this.parser=e,this.extension=[k.of(this),r.EditorState.languageData.of(((t,e,i)=>t.facet(f(t,e,i))))].concat(i)}isActiveAt(t,e,i=-1){return f(t,e,i)==this.data}findRegions(t){let e=t.facet(k)
if((null==e?void 0:e.data)==this.data)return[{from:0,to:t.doc.length}]
if(!e||!e.allowsNesting)return[]
let i=[],n=(t,e)=>{if(t.prop(h)==this.data)return void i.push({from:e,to:e+t.length})
let r=t.prop(s.NodeProp.mounted)
if(r){if(r.tree.prop(h)==this.data){if(r.overlay)for(let t of r.overlay)i.push({from:t.from+e,to:t.to+e})
else i.push({from:e,to:e+t.length})
return}if(r.overlay){let t=i.length
if(n(r.tree,r.overlay[0].from+e),i.length>t)return}}for(let i=0;i<t.children.length;i++){let r=t.children[i]
r instanceof s.Tree&&n(r,t.positions[i]+e)}}
return n(p(t),0),i}get allowsNesting(){return!0}}function f(t,e,i){let n=t.facet(k)
if(!n)return null
let r=n.data
if(n.allowsNesting)for(let o=p(t).topNode;o;o=o.enter(e,i,s.IterMode.ExcludeBuffers))r=o.type.prop(h)||r
return r}u.setState=r.StateEffect.define()
class d extends u{constructor(t,e,i){super(t,e,[],i),this.parser=e}static define(t){let e=c(t.languageData)
return new d(e,t.parser.configure({props:[h.add((t=>t.isTop?e:void 0))]}),t.name)}configure(t,e){return new d(this.data,this.parser.configure(t),e||this.name)}get allowsNesting(){return this.parser.hasWrappers()}}function p(t){let e=t.field(u.state,!1)
return e?e.tree:s.Tree.empty}function m(t,e,i=50){var n
let s=null===(n=t.field(u.state,!1))||void 0===n?void 0:n.context
if(!s)return null
let r=s.viewport
s.updateViewport({from:0,to:e})
let o=s.isDone(e)||s.work(i,e)?s.tree:null
return s.updateViewport(r),o}class g{constructor(t,e=t.length){this.doc=t,this.length=e,this.cursorPos=0,this.string="",this.cursor=t.iter()}syncTo(t){return this.string=this.cursor.next(t-this.cursorPos).value,this.cursorPos=t+this.string.length,this.cursorPos-this.string.length}chunk(t){return this.syncTo(t),this.string}get lineChunks(){return!0}read(t,e){let i=this.cursorPos-this.string.length
return t<i||e>=this.cursorPos?this.doc.sliceString(t,e):this.string.slice(t-i,e-i)}}let O=null
class v{constructor(t,e,i=[],n,s,r,o,a){this.parser=t,this.state=e,this.fragments=i,this.tree=n,this.treeLen=s,this.viewport=r,this.skipped=o,this.scheduleOn=a,this.parse=null,this.tempSkipped=[]}static create(t,e,i){return new v(t,e,[],s.Tree.empty,0,i,[],null)}startParse(){return this.parser.startParse(new g(this.state.doc),this.fragments)}work(t,e){return null!=e&&e>=this.state.doc.length&&(e=void 0),this.tree!=s.Tree.empty&&this.isDone(null!=e?e:this.state.doc.length)?(this.takeTree(),!0):this.withContext((()=>{var i
if("number"==typeof t){let e=Date.now()+t
t=()=>Date.now()>e}for(this.parse||(this.parse=this.startParse()),null!=e&&(null==this.parse.stoppedAt||this.parse.stoppedAt>e)&&e<this.state.doc.length&&this.parse.stopAt(e);;){let n=this.parse.advance()
if(n){if(this.fragments=this.withoutTempSkipped(s.TreeFragment.addTree(n,this.fragments,null!=this.parse.stoppedAt)),this.treeLen=null!==(i=this.parse.stoppedAt)&&void 0!==i?i:this.state.doc.length,this.tree=n,this.parse=null,!(this.treeLen<(null!=e?e:this.state.doc.length)))return!0
this.parse=this.startParse()}if(t())return!1}}))}takeTree(){let t,e
this.parse&&(t=this.parse.parsedPos)>=this.treeLen&&((null==this.parse.stoppedAt||this.parse.stoppedAt>t)&&this.parse.stopAt(t),this.withContext((()=>{for(;!(e=this.parse.advance()););})),this.treeLen=t,this.tree=e,this.fragments=this.withoutTempSkipped(s.TreeFragment.addTree(this.tree,this.fragments,!0)),this.parse=null)}withContext(t){let e=O
O=this
try{return t()}finally{O=e}}withoutTempSkipped(t){for(let e;e=this.tempSkipped.pop();)t=y(t,e.from,e.to)
return t}changes(t,e){let{fragments:i,tree:n,treeLen:r,viewport:o,skipped:a}=this
if(this.takeTree(),!t.empty){let e=[]
if(t.iterChangedRanges(((t,i,n,s)=>e.push({fromA:t,toA:i,fromB:n,toB:s}))),i=s.TreeFragment.applyChanges(i,e),n=s.Tree.empty,r=0,o={from:t.mapPos(o.from,-1),to:t.mapPos(o.to,1)},this.skipped.length){a=[]
for(let e of this.skipped){let i=t.mapPos(e.from,1),n=t.mapPos(e.to,-1)
i<n&&a.push({from:i,to:n})}}}return new v(this.parser,e,i,n,r,o,a,this.scheduleOn)}updateViewport(t){if(this.viewport.from==t.from&&this.viewport.to==t.to)return!1
this.viewport=t
let e=this.skipped.length
for(let i=0;i<this.skipped.length;i++){let{from:e,to:n}=this.skipped[i]
e<t.to&&n>t.from&&(this.fragments=y(this.fragments,e,n),this.skipped.splice(i--,1))}return!(this.skipped.length>=e||(this.reset(),0))}reset(){this.parse&&(this.takeTree(),this.parse=null)}skipUntilInView(t,e){this.skipped.push({from:t,to:e})}static getSkippingParser(t){return new class extends s.Parser{createParse(e,i,n){let r=n[0].from,o=n[n.length-1].to
return{parsedPos:r,advance(){let e=O
if(e){for(let t of n)e.tempSkipped.push(t)
t&&(e.scheduleOn=e.scheduleOn?Promise.all([e.scheduleOn,t]):t)}return this.parsedPos=o,new s.Tree(s.NodeType.none,[],[],o-r)},stoppedAt:null,stopAt(){}}}}}isDone(t){t=Math.min(t,this.state.doc.length)
let e=this.fragments
return this.treeLen>=t&&e.length&&0==e[0].from&&e[0].to>=t}static get(){return O}}function y(t,e,i){return s.TreeFragment.applyChanges(t,[{fromA:e,toA:i,fromB:e,toB:i}])}class b{constructor(t){this.context=t,this.tree=t.tree}apply(t){if(!t.docChanged&&this.tree==this.context.tree)return this
let e=this.context.changes(t.changes,t.state),i=this.context.treeLen==t.startState.doc.length?void 0:Math.max(t.changes.mapPos(this.context.treeLen),e.viewport.to)
return e.work(20,i)||e.takeTree(),new b(e)}static init(t){let e=Math.min(3e3,t.doc.length),i=v.create(t.facet(k).parser,t,{from:0,to:e})
return i.work(20,e)||i.takeTree(),new b(i)}}u.state=r.StateField.define({create:b.init,update(t,e){for(let i of e.effects)if(i.is(u.setState))return i.value
return e.startState.facet(k)!=e.state.facet(k)?b.init(e.state):t.apply(e)}})
let w=t=>{let e=setTimeout((()=>t()),500)
return()=>clearTimeout(e)}
"undefined"!=typeof requestIdleCallback&&(w=t=>{let e=-1,i=setTimeout((()=>{e=requestIdleCallback(t,{timeout:400})}),100)
return()=>e<0?clearTimeout(i):cancelIdleCallback(e)})
const x="undefined"!=typeof navigator&&(null===(n=navigator.scheduling)||void 0===n?void 0:n.isInputPending)?()=>navigator.scheduling.isInputPending():null,S=o.ViewPlugin.fromClass(class{constructor(t){this.view=t,this.working=null,this.workScheduled=0,this.chunkEnd=-1,this.chunkBudget=-1,this.work=this.work.bind(this),this.scheduleWork()}update(t){let e=this.view.state.field(u.state).context;(e.updateViewport(t.view.viewport)||this.view.viewport.to>e.treeLen)&&this.scheduleWork(),t.docChanged&&(this.view.hasFocus&&(this.chunkBudget+=50),this.scheduleWork()),this.checkAsyncSchedule(e)}scheduleWork(){if(this.working)return
let{state:t}=this.view,e=t.field(u.state)
e.tree==e.context.tree&&e.context.isDone(t.doc.length)||(this.working=w(this.work))}work(t){this.working=null
let e=Date.now()
if(this.chunkEnd<e&&(this.chunkEnd<0||this.view.hasFocus)&&(this.chunkEnd=e+3e4,this.chunkBudget=3e3),this.chunkBudget<=0)return
let{state:i,viewport:{to:n}}=this.view,s=i.field(u.state)
if(s.tree==s.context.tree&&s.context.isDone(n+1e5))return
let r=Date.now()+Math.min(this.chunkBudget,100,t&&!x?Math.max(25,t.timeRemaining()-5):1e9),o=s.context.treeLen<n&&i.doc.length>n+1e3,a=s.context.work((()=>x&&x()||Date.now()>r),n+(o?0:1e5))
this.chunkBudget-=Date.now()-e,(a||this.chunkBudget<=0)&&(s.context.takeTree(),this.view.dispatch({effects:u.setState.of(new b(s.context))})),this.chunkBudget>0&&(!a||o)&&this.scheduleWork(),this.checkAsyncSchedule(s.context)}checkAsyncSchedule(t){t.scheduleOn&&(this.workScheduled++,t.scheduleOn.then((()=>this.scheduleWork())).catch((t=>o.logException(this.view.state,t))).then((()=>this.workScheduled--)),t.scheduleOn=null)}destroy(){this.working&&this.working()}isWorking(){return!!(this.working||this.workScheduled>0)}},{eventHandlers:{focus(){this.scheduleWork()}}}),k=r.Facet.define({combine:t=>t.length?t[0]:null,enables:t=>[u.state,S,o.EditorView.contentAttributes.compute([t],(e=>{let i=e.facet(t)
return i&&i.name?{"data-language":i.name}:{}}))]})
class Q{constructor(t,e,i,n,s,r){this.name=t,this.alias=e,this.extensions=i,this.filename=n,this.loadFunc=s,this.support=r,this.loading=null}load(){return this.loading||(this.loading=this.loadFunc().then((t=>this.support=t),(t=>{throw this.loading=null,t})))}static of(t){let{load:e,support:i}=t
if(!e){if(!i)throw new RangeError("Must pass either 'load' or 'support' to LanguageDescription.of")
e=()=>Promise.resolve(i)}return new Q(t.name,(t.alias||[]).concat(t.name).map((t=>t.toLowerCase())),t.extensions||[],t.filename,e,i)}static matchFilename(t,e){for(let n of t)if(n.filename&&n.filename.test(e))return n
let i=/\.([^.]+)$/.exec(e)
if(i)for(let n of t)if(n.extensions.indexOf(i[1])>-1)return n
return null}static matchLanguageName(t,e,i=!0){e=e.toLowerCase()
for(let n of t)if(n.alias.some((t=>t==e)))return n
if(i)for(let n of t)for(let t of n.alias){let i=e.indexOf(t)
if(i>-1&&(t.length>2||!/\w/.test(e[i-1])&&!/\w/.test(e[i+t.length])))return n}return null}}const P=r.Facet.define(),T=r.Facet.define({combine:t=>{if(!t.length)return"  "
if(!/^(?: +|\t+)$/.test(t[0]))throw new Error("Invalid indent unit: "+JSON.stringify(t[0]))
return t[0]}})
function $(t){let e=t.facet(T)
return 9==e.charCodeAt(0)?t.tabSize*e.length:e.length}function A(t,e){let i="",n=t.tabSize
if(9==t.facet(T).charCodeAt(0))for(;e>=n;)i+="\t",e-=n
for(let s=0;s<e;s++)i+=" "
return i}function _(t,e){t instanceof r.EditorState&&(t=new C(t))
for(let n of t.state.facet(P)){let i=n(t,e)
if(void 0!==i)return i}let i=p(t.state)
return i?function(t,e,i){return I(e.resolveInner(i).enterUnfinishedNodesBefore(i),i,t)}(t,i,e):null}class C{constructor(t,e={}){this.state=t,this.options=e,this.unit=$(t)}lineAt(t,e=1){let i=this.state.doc.lineAt(t),{simulateBreak:n,simulateDoubleBreak:s}=this.options
return null!=n&&n>=i.from&&n<=i.to?s&&n==t?{text:"",from:t}:(e<0?n<t:n<=t)?{text:i.text.slice(n-i.from),from:n}:{text:i.text.slice(0,n-i.from),from:i.from}:i}textAfterPos(t,e=1){if(this.options.simulateDoubleBreak&&t==this.options.simulateBreak)return""
let{text:i,from:n}=this.lineAt(t,e)
return i.slice(t-n,Math.min(i.length,t+100-n))}column(t,e=1){let{text:i,from:n}=this.lineAt(t,e),s=this.countColumn(i,t-n),r=this.options.overrideIndentation?this.options.overrideIndentation(n):-1
return r>-1&&(s+=r-this.countColumn(i,i.search(/\S|$/))),s}countColumn(t,e=t.length){return r.countColumn(t,this.state.tabSize,e)}lineIndent(t,e=1){let{text:i,from:n}=this.lineAt(t,e),s=this.options.overrideIndentation
if(s){let t=s(n)
if(t>-1)return t}return this.countColumn(i,i.search(/\S|$/))}get simulatedBreak(){return this.options.simulateBreak||null}}const E=new s.NodeProp
function M(t){let e=t.type.prop(E)
if(e)return e
let i,n=t.firstChild
if(n&&(i=n.type.prop(s.NodeProp.closedBy))){let e=t.lastChild,n=e&&i.indexOf(e.name)>-1
return t=>D(t,!0,1,void 0,n&&!function(t){return t.pos==t.options.simulateBreak&&t.options.simulateDoubleBreak}(t)?e.from:void 0)}return null==t.parent?W:null}function I(t,e,i){for(;t;t=t.parent){let n=M(t)
if(n)return n(R.create(i,e,t))}return null}function W(){return 0}class R extends C{constructor(t,e,i){super(t.state,t.options),this.base=t,this.pos=e,this.node=i}static create(t,e,i){return new R(t,e,i)}get textAfter(){return this.textAfterPos(this.pos)}get baseIndent(){let t=this.state.doc.lineAt(this.node.from)
for(;;){let e=this.node.resolve(t.from)
for(;e.parent&&e.parent.from==e.from;)e=e.parent
if(Z(e,this.node))break
t=this.state.doc.lineAt(e.from)}return this.lineIndent(t.from)}continue(){let t=this.node.parent
return t?I(t,this.pos,this.base):0}}function Z(t,e){for(let i=e;i;i=i.parent)if(t==i)return!0
return!1}function D(t,e,i,n,s){let r=t.textAfter,o=r.match(/^\s*/)[0].length,a=n&&r.slice(o,o+n.length)==n||s==t.pos+o,l=e?function(t){let e=t.node,i=e.childAfter(e.from),n=e.lastChild
if(!i)return null
let s=t.options.simulateBreak,r=t.state.doc.lineAt(i.from),o=null==s||s<=r.from?r.to:Math.min(r.to,s)
for(let a=i.to;;){let t=e.childAfter(a)
if(!t||t==n)return null
if(!t.type.isSkipped)return t.from<o?i:null
a=t.to}}(t):null
return l?a?t.column(l.from):t.column(l.to):t.baseIndent+(a?0:t.unit*i)}const V=r.Facet.define(),X=new s.NodeProp
function j(t){let e=t.lastChild
return e&&e.to==t.to&&e.type.isError}function L(t,e,i){for(let n of t.facet(V)){let s=n(t,e,i)
if(s)return s}return function(t,e,i){let n=p(t)
if(n.length<i)return null
let s=null
for(let r=n.resolveInner(i,1);r;r=r.parent){if(r.to<=i||r.from>i)continue
if(s&&r.from<e)break
let o=r.type.prop(X)
if(o&&(r.to<n.length-50||n.length==t.doc.length||!j(r))){let n=o(r,t)
n&&n.from<=i&&n.from>=e&&n.to>i&&(s=n)}}return s}(t,e,i)}function N(t,e){let i=e.mapPos(t.from,1),n=e.mapPos(t.to,-1)
return i>=n?void 0:{from:i,to:n}}const U=r.StateEffect.define({map:N}),q=r.StateEffect.define({map:N})
function Y(t){let e=[]
for(let{head:i}of t.state.selection.ranges)e.some((t=>t.from<=i&&t.to>=i))||e.push(t.lineBlockAt(i))
return e}const z=r.StateField.define({create:()=>o.Decoration.none,update(t,e){t=t.map(e.changes)
for(let i of e.effects)i.is(U)&&!G(t,i.value.from,i.value.to)?t=t.update({add:[ot.range(i.value.from,i.value.to)]}):i.is(q)&&(t=t.update({filter:(t,e)=>i.value.from!=t||i.value.to!=e,filterFrom:i.value.from,filterTo:i.value.to}))
if(e.selection){let i=!1,{head:n}=e.selection.main
t.between(n,n,((t,e)=>{t<n&&e>n&&(i=!0)})),i&&(t=t.update({filterFrom:n,filterTo:n,filter:(t,e)=>e<=n||t>=n}))}return t},provide:t=>o.EditorView.decorations.from(t),toJSON(t,e){let i=[]
return t.between(0,e.doc.length,((t,e)=>{i.push(t,e)})),i},fromJSON(t){if(!Array.isArray(t)||t.length%2)throw new RangeError("Invalid JSON for fold state")
let e=[]
for(let i=0;i<t.length;){let n=t[i++],s=t[i++]
if("number"!=typeof n||"number"!=typeof s)throw new RangeError("Invalid JSON for fold state")
e.push(ot.range(n,s))}return o.Decoration.set(e,!0)}})
function B(t,e,i){var n
let s=null
return null===(n=t.field(z,!1))||void 0===n||n.between(e,i,((t,e)=>{(!s||s.from>t)&&(s={from:t,to:e})})),s}function G(t,e,i){let n=!1
return t.between(e,e,((t,s)=>{t==e&&s==i&&(n=!0)})),n}function F(t,e){return t.field(z,!1)?e:e.concat(r.StateEffect.appendConfig.of(rt()))}const H=t=>{for(let e of Y(t)){let i=L(t.state,e.from,e.to)
if(i)return t.dispatch({effects:F(t.state,[U.of(i),J(t,i)])}),!0}return!1},K=t=>{if(!t.state.field(z,!1))return!1
let e=[]
for(let i of Y(t)){let n=B(t.state,i.from,i.to)
n&&e.push(q.of(n),J(t,n,!1))}return e.length&&t.dispatch({effects:e}),e.length>0}
function J(t,e,i=!0){let n=t.state.doc.lineAt(e.from).number,s=t.state.doc.lineAt(e.to).number
return o.EditorView.announce.of(`${t.state.phrase(i?"Folded lines":"Unfolded lines")} ${n} ${t.state.phrase("to")} ${s}.`)}const tt=t=>{let{state:e}=t,i=[]
for(let n=0;n<e.doc.length;){let s=t.lineBlockAt(n),r=L(e,s.from,s.to)
r&&i.push(U.of(r)),n=(r?t.lineBlockAt(r.to):s).to+1}return i.length&&t.dispatch({effects:F(t.state,i)}),!!i.length},et=t=>{let e=t.state.field(z,!1)
if(!e||!e.size)return!1
let i=[]
return e.between(0,t.state.doc.length,((t,e)=>{i.push(q.of({from:t,to:e}))})),t.dispatch({effects:i}),!0},it=[{key:"Ctrl-Shift-[",mac:"Cmd-Alt-[",run:H},{key:"Ctrl-Shift-]",mac:"Cmd-Alt-]",run:K},{key:"Ctrl-Alt-[",run:tt},{key:"Ctrl-Alt-]",run:et}],nt={placeholderDOM:null,placeholderText:"…"},st=r.Facet.define({combine:t=>r.combineConfig(t,nt)})
function rt(t){let e=[z,ht]
return t&&e.push(st.of(t)),e}const ot=o.Decoration.replace({widget:new class extends o.WidgetType{toDOM(t){let{state:e}=t,i=e.facet(st),n=e=>{let i=t.lineBlockAt(t.posAtDOM(e.target)),n=B(t.state,i.from,i.to)
n&&t.dispatch({effects:q.of(n)}),e.preventDefault()}
if(i.placeholderDOM)return i.placeholderDOM(t,n)
let s=document.createElement("span")
return s.textContent=i.placeholderText,s.setAttribute("aria-label",e.phrase("folded code")),s.title=e.phrase("unfold"),s.className="cm-foldPlaceholder",s.onclick=n,s}}}),at={openText:"⌄",closedText:"›",markerDOM:null,domEventHandlers:{},foldingChanged:()=>!1}
class lt extends o.GutterMarker{constructor(t,e){super(),this.config=t,this.open=e}eq(t){return this.config==t.config&&this.open==t.open}toDOM(t){if(this.config.markerDOM)return this.config.markerDOM(this.open)
let e=document.createElement("span")
return e.textContent=this.open?this.config.openText:this.config.closedText,e.title=t.state.phrase(this.open?"Fold line":"Unfold line"),e}}const ht=o.EditorView.baseTheme({".cm-foldPlaceholder":{backgroundColor:"#eee",border:"1px solid #ddd",color:"#888",borderRadius:".2em",margin:"0 1px",padding:"0 1px",cursor:"pointer"},".cm-foldGutter span":{padding:"0 1px",cursor:"pointer"}})
class ct{constructor(t,e){let i
function n(t){let e=l.StyleModule.newName()
return(i||(i=Object.create(null)))["."+e]=t,e}this.specs=t
const s="string"==typeof e.all?e.all:e.all?n(e.all):void 0,r=e.scope
this.scope=r instanceof u?t=>t.prop(h)==r.data:r?t=>t==r:void 0,this.style=a.tagHighlighter(t.map((t=>({tag:t.tag,class:t.class||n(Object.assign({},t,{tag:null}))}))),{all:s}).style,this.module=i?new l.StyleModule(i):null,this.themeType=e.themeType}static define(t,e){return new ct(t,e||{})}}const ut=r.Facet.define(),ft=r.Facet.define({combine:t=>t.length?[t[0]]:null})
function dt(t){let e=t.facet(ut)
return e.length?e:t.facet(ft)}const pt=r.Prec.high(o.ViewPlugin.fromClass(class{constructor(t){this.markCache=Object.create(null),this.tree=p(t.state),this.decorations=this.buildDeco(t,dt(t.state))}update(t){let e=p(t.state),i=dt(t.state),n=i!=dt(t.startState)
e.length<t.view.viewport.to&&!n&&e.type==this.tree.type?this.decorations=this.decorations.map(t.changes):(e!=this.tree||t.viewportChanged||n)&&(this.tree=e,this.decorations=this.buildDeco(t.view,i))}buildDeco(t,e){if(!e||!this.tree.length)return o.Decoration.none
let i=new r.RangeSetBuilder
for(let{from:n,to:s}of t.visibleRanges)a.highlightTree(this.tree,e,((t,e,n)=>{i.add(t,e,this.markCache[n]||(this.markCache[n]=o.Decoration.mark({class:n})))}),n,s)
return i.finish()}},{decorations:t=>t.decorations})),mt=ct.define([{tag:a.tags.meta,color:"#404740"},{tag:a.tags.link,textDecoration:"underline"},{tag:a.tags.heading,textDecoration:"underline",fontWeight:"bold"},{tag:a.tags.emphasis,fontStyle:"italic"},{tag:a.tags.strong,fontWeight:"bold"},{tag:a.tags.strikethrough,textDecoration:"line-through"},{tag:a.tags.keyword,color:"#708"},{tag:[a.tags.atom,a.tags.bool,a.tags.url,a.tags.contentSeparator,a.tags.labelName],color:"#219"},{tag:[a.tags.literal,a.tags.inserted],color:"#164"},{tag:[a.tags.string,a.tags.deleted],color:"#a11"},{tag:[a.tags.regexp,a.tags.escape,a.tags.special(a.tags.string)],color:"#e40"},{tag:a.tags.definition(a.tags.variableName),color:"#00f"},{tag:a.tags.local(a.tags.variableName),color:"#30a"},{tag:[a.tags.typeName,a.tags.namespace],color:"#085"},{tag:a.tags.className,color:"#167"},{tag:[a.tags.special(a.tags.variableName),a.tags.macroName],color:"#256"},{tag:a.tags.definition(a.tags.propertyName),color:"#00c"},{tag:a.tags.comment,color:"#940"},{tag:a.tags.invalid,color:"#f00"}]),gt=o.EditorView.baseTheme({"&.cm-focused .cm-matchingBracket":{backgroundColor:"#328c8252"},"&.cm-focused .cm-nonmatchingBracket":{backgroundColor:"#bb555544"}}),Ot="()[]{}",vt=r.Facet.define({combine:t=>r.combineConfig(t,{afterCursor:!0,brackets:Ot,maxScanDistance:1e4,renderMatch:wt})}),yt=o.Decoration.mark({class:"cm-matchingBracket"}),bt=o.Decoration.mark({class:"cm-nonmatchingBracket"})
function wt(t){let e=[],i=t.matched?yt:bt
return e.push(i.range(t.start.from,t.start.to)),t.end&&e.push(i.range(t.end.from,t.end.to)),e}const xt=[r.StateField.define({create:()=>o.Decoration.none,update(t,e){if(!e.docChanged&&!e.selection)return t
let i=[],n=e.state.facet(vt)
for(let s of e.state.selection.ranges){if(!s.empty)continue
let t=kt(e.state,s.head,-1,n)||s.head>0&&kt(e.state,s.head-1,1,n)||n.afterCursor&&(kt(e.state,s.head,1,n)||s.head<e.state.doc.length&&kt(e.state,s.head+1,-1,n))
t&&(i=i.concat(n.renderMatch(t,e.state)))}return o.Decoration.set(i,!0)},provide:t=>o.EditorView.decorations.from(t)}),gt]
function St(t,e,i){let n=t.prop(e<0?s.NodeProp.openedBy:s.NodeProp.closedBy)
if(n)return n
if(1==t.name.length){let n=i.indexOf(t.name)
if(n>-1&&n%2==(e<0?1:0))return[i[n+e]]}return null}function kt(t,e,i,n={}){let s=n.maxScanDistance||1e4,r=n.brackets||Ot,o=p(t),a=o.resolveInner(e,i)
for(let l=a;l;l=l.parent){let t=St(l.type,i,r)
if(t&&l.from<l.to)return Qt(0,0,i,l,t,r)}return function(t,e,i,n,s,r,o){let a=i<0?t.sliceDoc(e-1,e):t.sliceDoc(e,e+1),l=o.indexOf(a)
if(l<0||l%2==0!=i>0)return null
let h={from:i<0?e-1:e,to:i>0?e+1:e},c=t.doc.iterRange(e,i>0?t.doc.length:0),u=0
for(let f=0;!c.next().done&&f<=r;){let t=c.value
i<0&&(f+=t.length)
let r=e+f*i
for(let e=i>0?0:t.length-1,a=i>0?t.length:-1;e!=a;e+=i){let a=o.indexOf(t[e])
if(!(a<0||n.resolveInner(r+e,1).type!=s))if(a%2==0==i>0)u++
else{if(1==u)return{start:h,end:{from:r+e,to:r+e+1},matched:a>>1==l>>1}
u--}}i>0&&(f+=t.length)}return c.done?{start:h,matched:!1}:null}(t,e,i,o,a.type,s,r)}function Qt(t,e,i,n,s,r){let o=n.parent,a={from:n.from,to:n.to},l=0,h=null==o?void 0:o.cursor()
if(h&&(i<0?h.childBefore(n.from):h.childAfter(n.to)))do{if(i<0?h.to<=n.from:h.from>=n.to){if(0==l&&s.indexOf(h.type.name)>-1&&h.from<h.to)return{start:a,end:{from:h.from,to:h.to},matched:!0}
if(St(h.type,i,r))l++
else if(St(h.type,-i,r)){if(0==l)return{start:a,end:h.from==h.to?void 0:{from:h.from,to:h.to},matched:!1}
l--}}}while(i<0?h.prevSibling():h.nextSibling())
return{start:a,matched:!1}}function Pt(t,e,i,n=0,s=0){null==e&&-1==(e=t.search(/[^\s\u00a0]/))&&(e=t.length)
let r=s
for(let o=n;o<e;o++)9==t.charCodeAt(o)?r+=i-r%i:r++
return r}class Tt{constructor(t,e,i){this.string=t,this.tabSize=e,this.indentUnit=i,this.pos=0,this.start=0,this.lastColumnPos=0,this.lastColumnValue=0}eol(){return this.pos>=this.string.length}sol(){return 0==this.pos}peek(){return this.string.charAt(this.pos)||void 0}next(){if(this.pos<this.string.length)return this.string.charAt(this.pos++)}eat(t){let e,i=this.string.charAt(this.pos)
if(e="string"==typeof t?i==t:i&&(t instanceof RegExp?t.test(i):t(i)),e)return++this.pos,i}eatWhile(t){let e=this.pos
for(;this.eat(t););return this.pos>e}eatSpace(){let t=this.pos
for(;/[\s\u00a0]/.test(this.string.charAt(this.pos));)++this.pos
return this.pos>t}skipToEnd(){this.pos=this.string.length}skipTo(t){let e=this.string.indexOf(t,this.pos)
if(e>-1)return this.pos=e,!0}backUp(t){this.pos-=t}column(){return this.lastColumnPos<this.start&&(this.lastColumnValue=Pt(this.string,this.start,this.tabSize,this.lastColumnPos,this.lastColumnValue),this.lastColumnPos=this.start),this.lastColumnValue}indentation(){return Pt(this.string,null,this.tabSize)}match(t,e,i){if("string"==typeof t){let n=t=>i?t.toLowerCase():t
return n(this.string.substr(this.pos,t.length))==n(t)?(!1!==e&&(this.pos+=t.length),!0):null}{let i=this.string.slice(this.pos).match(t)
return i&&i.index>0?null:(i&&!1!==e&&(this.pos+=i[0].length),i)}}current(){return this.string.slice(this.start,this.pos)}}function $t(t){if("object"!=typeof t)return t
let e={}
for(let i in t){let n=t[i]
e[i]=n instanceof Array?n.slice():n}return e}class At extends u{constructor(t){let e,i=c(t.languageData),n={name:(r=t).name||"",token:r.token,blankLine:r.blankLine||(()=>{}),startState:r.startState||(()=>!0),copyState:r.copyState||$t,indent:r.indent||(()=>null),languageData:r.languageData||{},tokenTable:r.tokenTable||It}
var r
super(i,new class extends s.Parser{createParse(t,i,n){return new Et(e,t,i,n)}},[P.of(((t,e)=>this.getIndent(t,e)))],t.name),this.topNode=function(t){let e=s.NodeType.define({id:Wt.length,name:"Document",props:[h.add((()=>t))]})
return Wt.push(e),e}(i),e=this,this.streamParser=n,this.stateAfter=new s.NodeProp({perNode:!0}),this.tokenTable=t.tokenTable?new Vt(n.tokenTable):Xt}static define(t){return new At(t)}getIndent(t,e){let i=p(t.state),n=i.resolve(e)
for(;n&&n.type!=this.topNode;)n=n.parent
if(!n)return null
let s,r,o=_t(this,i,0,n.from,e)
if(o?(r=o.state,s=o.pos+1):(r=this.streamParser.startState(t.unit),s=0),e-s>1e4)return null
for(;s<e;){let i=t.state.doc.lineAt(s),n=Math.min(e,i.to)
if(i.length){let e=new Tt(i.text,t.state.tabSize,t.unit)
for(;e.pos<n-i.from;)Mt(this.streamParser.token,e,r)}else this.streamParser.blankLine(r,t.unit)
if(n==e)break
s=i.to+1}let{text:a}=t.lineAt(e)
return this.streamParser.indent(r,/^\s*(.*)/.exec(a)[1],t)}get allowsNesting(){return!1}}function _t(t,e,i,n,r){let o=i>=n&&i+e.length<=r&&e.prop(t.stateAfter)
if(o)return{state:t.streamParser.copyState(o),pos:i+e.length}
for(let a=e.children.length-1;a>=0;a--){let o=e.children[a],l=i+e.positions[a],h=o instanceof s.Tree&&l<r&&_t(t,o,l,n,r)
if(h)return h}return null}function Ct(t,e,i,n,r){if(r&&i<=0&&n>=e.length)return e
r||e.type!=t.topNode||(r=!0)
for(let o=e.children.length-1;o>=0;o--){let a,l=e.positions[o],h=e.children[o]
if(l<n&&h instanceof s.Tree){if(!(a=Ct(t,h,i-l,n-l,r)))break
return r?new s.Tree(e.type,e.children.slice(0,o).concat(a),e.positions.slice(0,o+1),l+a.length):a}}return null}class Et{constructor(t,e,i,n){this.lang=t,this.input=e,this.fragments=i,this.ranges=n,this.stoppedAt=null,this.chunks=[],this.chunkPos=[],this.chunk=[],this.chunkReused=void 0,this.rangeIndex=0,this.to=n[n.length-1].to
let r=v.get(),o=n[0].from,{state:a,tree:l}=function(t,e,i,n){for(let s of e){let e,n=s.from+(s.openStart?25:0),r=s.to-(s.openEnd?25:0),o=n<=i&&r>i&&_t(t,s.tree,0-s.offset,i,r)
if(o&&(e=Ct(t,s.tree,i+s.offset,o.pos+s.offset,!1)))return{state:o.state,tree:e}}return{state:t.streamParser.startState(n?$(n):4),tree:s.Tree.empty}}(t,i,o,null==r?void 0:r.state)
this.state=a,this.parsedPos=this.chunkStart=o+l.length
for(let s=0;s<l.children.length;s++)this.chunks.push(l.children[s]),this.chunkPos.push(l.positions[s])
r&&this.parsedPos<r.viewport.from-1e5&&(this.state=this.lang.streamParser.startState($(r.state)),r.skipUntilInView(this.parsedPos,r.viewport.from),this.parsedPos=r.viewport.from),this.moveRangeIndex()}advance(){let t=v.get(),e=null==this.stoppedAt?this.to:Math.min(this.to,this.stoppedAt),i=Math.min(e,this.chunkStart+2048)
for(t&&(i=Math.min(i,t.viewport.to));this.parsedPos<i;)this.parseLine(t)
return this.chunkStart<this.parsedPos&&this.finishChunk(),this.parsedPos>=e?this.finish():t&&this.parsedPos>=t.viewport.to?(t.skipUntilInView(this.parsedPos,e),this.finish()):null}stopAt(t){this.stoppedAt=t}lineAfter(t){let e=this.input.chunk(t)
if(this.input.lineChunks)"\n"==e&&(e="")
else{let t=e.indexOf("\n")
t>-1&&(e=e.slice(0,t))}return t+e.length<=this.to?e:e.slice(0,this.to-t)}nextLine(){let t=this.parsedPos,e=this.lineAfter(t),i=t+e.length
for(let n=this.rangeIndex;;){let t=this.ranges[n].to
if(t>=i)break
if(e=e.slice(0,t-(i-e.length)),n++,n==this.ranges.length)break
let s=this.ranges[n].from,r=this.lineAfter(s)
e+=r,i=s+r.length}return{line:e,end:i}}skipGapsTo(t,e,i){for(;;){let n=this.ranges[this.rangeIndex].to,s=t+e
if(i>0?n>s:n>=s)break
e+=this.ranges[++this.rangeIndex].from-n}return e}moveRangeIndex(){for(;this.ranges[this.rangeIndex].to<this.parsedPos;)this.rangeIndex++}emitToken(t,e,i,n,s){if(this.ranges.length>1){e+=s=this.skipGapsTo(e,s,1)
let t=this.chunk.length
i+=s=this.skipGapsTo(i,s,-1),n+=this.chunk.length-t}return this.chunk.push(t,e,i,n),s}parseLine(t){let{line:e,end:i}=this.nextLine(),n=0,{streamParser:s}=this.lang,r=new Tt(e,t?t.state.tabSize:4,t?$(t.state):2)
if(r.eol())s.blankLine(this.state,r.indentUnit)
else for(;!r.eol();){let t=Mt(s.token,r,this.state)
if(t&&(n=this.emitToken(this.lang.tokenTable.resolve(t),this.parsedPos+r.start,this.parsedPos+r.pos,4,n)),r.start>1e4)break}this.parsedPos=i,this.moveRangeIndex(),this.parsedPos<this.to&&this.parsedPos++}finishChunk(){let t=s.Tree.build({buffer:this.chunk,start:this.chunkStart,length:this.parsedPos-this.chunkStart,nodeSet:Rt,topID:0,maxBufferLength:2048,reused:this.chunkReused})
t=new s.Tree(t.type,t.children,t.positions,t.length,[[this.lang.stateAfter,this.lang.streamParser.copyState(this.state)]]),this.chunks.push(t),this.chunkPos.push(this.chunkStart-this.ranges[0].from),this.chunk=[],this.chunkReused=void 0,this.chunkStart=this.parsedPos}finish(){return new s.Tree(this.lang.topNode,this.chunks,this.chunkPos,this.parsedPos-this.ranges[0].from).balance()}}function Mt(t,e,i){e.start=e.pos
for(let n=0;n<10;n++){let n=t(e,i)
if(e.pos>e.start)return n}throw new Error("Stream parser failed to advance stream.")}const It=Object.create(null),Wt=[s.NodeType.none],Rt=new s.NodeSet(Wt),Zt=[],Dt=Object.create(null)
for(let[Nt,Ut]of[["variable","variableName"],["variable-2","variableName.special"],["string-2","string.special"],["def","variableName.definition"],["tag","tagName"],["attribute","attributeName"],["type","typeName"],["builtin","variableName.standard"],["qualifier","modifier"],["error","invalid"],["header","heading"],["property","propertyName"]])Dt[Nt]=Lt(It,Ut)
class Vt{constructor(t){this.extra=t,this.table=Object.assign(Object.create(null),Dt)}resolve(t){return t?this.table[t]||(this.table[t]=Lt(this.extra,t)):0}}const Xt=new Vt(It)
function jt(t,e){Zt.indexOf(t)>-1||(Zt.push(t),console.warn(e))}function Lt(t,e){let i=null
for(let s of e.split(".")){let e=t[s]||a.tags[s]
e?"function"==typeof e?i?i=e(i):jt(s,`Modifier ${s} used at start of tag`):i?jt(s,`Tag ${s} used as modifier`):i=e:jt(s,`Unknown highlighting tag ${s}`)}if(!i)return 0
let n=e.replace(/ /g,"_"),r=s.NodeType.define({id:Wt.length,name:n,props:[a.styleTags({[n]:i})]})
return Wt.push(r),r.id}e.HighlightStyle=ct,e.IndentContext=C,e.LRLanguage=d,e.Language=u,e.LanguageDescription=Q,e.LanguageSupport=class{constructor(t,e=[]){this.language=t,this.support=e,this.extension=[t,e]}},e.ParseContext=v,e.StreamLanguage=At,e.StringStream=Tt,e.TreeIndentContext=R,e.bracketMatching=function(t={}){return[vt.of(t),xt]},e.codeFolding=rt,e.continuedIndent=function({except:t,units:e=1}={}){return i=>{let n=t&&t.test(i.textAfter)
return i.baseIndent+(n?0:e*i.unit)}},e.defaultHighlightStyle=mt,e.defineLanguageFacet=c,e.delimitedIndent=function({closing:t,align:e=!0,units:i=1}){return n=>D(n,e,i,t)},e.ensureSyntaxTree=m,e.flatIndent=t=>t.baseIndent,e.foldAll=tt,e.foldCode=H,e.foldEffect=U,e.foldGutter=function(t={}){let e=Object.assign(Object.assign({},at),t),i=new lt(e,!0),n=new lt(e,!1),s=o.ViewPlugin.fromClass(class{constructor(t){this.from=t.viewport.from,this.markers=this.buildMarkers(t)}update(t){(t.docChanged||t.viewportChanged||t.startState.facet(k)!=t.state.facet(k)||t.startState.field(z,!1)!=t.state.field(z,!1)||p(t.startState)!=p(t.state)||e.foldingChanged(t))&&(this.markers=this.buildMarkers(t.view))}buildMarkers(t){let e=new r.RangeSetBuilder
for(let s of t.viewportLineBlocks){let r=B(t.state,s.from,s.to)?n:L(t.state,s.from,s.to)?i:null
r&&e.add(s.from,s.from,r)}return e.finish()}}),{domEventHandlers:a}=e
return[s,o.gutter({class:"cm-foldGutter",markers(t){var e
return(null===(e=t.plugin(s))||void 0===e?void 0:e.markers)||r.RangeSet.empty},initialSpacer:()=>new lt(e,!1),domEventHandlers:Object.assign(Object.assign({},a),{click:(t,e,i)=>{if(a.click&&a.click(t,e,i))return!0
let n=B(t.state,e.from,e.to)
if(n)return t.dispatch({effects:q.of(n)}),!0
let s=L(t.state,e.from,e.to)
return!!s&&(t.dispatch({effects:U.of(s)}),!0)}})}),rt()]},e.foldInside=function(t){let e=t.firstChild,i=t.lastChild
return e&&e.to<i.from?{from:e.to,to:i.type.isError?t.to:i.from}:null},e.foldKeymap=it,e.foldNodeProp=X,e.foldService=V,e.foldState=z,e.foldable=L,e.foldedRanges=function(t){return t.field(z,!1)||r.RangeSet.empty},e.forceParsing=function(t,e=t.viewport.to,i=100){let n=m(t.state,e,i)
return n!=p(t.state)&&t.dispatch({}),!!n},e.getIndentUnit=$,e.getIndentation=_,e.highlightingFor=function(t,e,i){let n=dt(t),s=null
if(n)for(let r of n)if(!r.scope||i&&r.scope(i)){let t=r.style(e)
t&&(s=s?s+" "+t:t)}return s},e.indentNodeProp=E,e.indentOnInput=function(){return r.EditorState.transactionFilter.of((t=>{if(!t.docChanged||!t.isUserEvent("input.type")&&!t.isUserEvent("input.complete"))return t
let e=t.startState.languageDataAt("indentOnInput",t.startState.selection.main.head)
if(!e.length)return t
let i=t.newDoc,{head:n}=t.newSelection.main,s=i.lineAt(n)
if(n>s.from+200)return t
let r=i.sliceString(s.from,n)
if(!e.some((t=>t.test(r))))return t
let{state:o}=t,a=-1,l=[]
for(let{head:h}of o.selection.ranges){let t=o.doc.lineAt(h)
if(t.from==a)continue
a=t.from
let e=_(o,t.from)
if(null==e)continue
let i=/^\s*/.exec(t.text)[0],n=A(o,e)
i!=n&&l.push({from:t.from,to:t.from+i.length,insert:n})}return l.length?[t,{changes:l,sequential:!0}]:t}))},e.indentRange=function(t,e,i){let n=Object.create(null),s=new C(t,{overrideIndentation:t=>{var e
return null!==(e=n[t])&&void 0!==e?e:-1}}),r=[]
for(let o=e;o<=i;){let e=t.doc.lineAt(o)
o=e.to+1
let i=_(s,e.from)
if(null==i)continue;/\S/.test(e.text)||(i=0)
let a=/^\s*/.exec(e.text)[0],l=A(t,i)
a!=l&&(n[e.from]=i,r.push({from:e.from,to:e.from+a.length,insert:l}))}return t.changes(r)},e.indentService=P,e.indentString=A,e.indentUnit=T,e.language=k,e.languageDataProp=h,e.matchBrackets=kt,e.syntaxHighlighting=function(t,e){let i,n=[pt]
return t instanceof ct&&(t.module&&n.push(o.EditorView.styleModule.of(t.module)),i=t.themeType),(null==e?void 0:e.fallback)?n.push(ft.of(t)):i?n.push(ut.computeN([o.EditorView.darkTheme],(e=>e.facet(o.EditorView.darkTheme)==("dark"==i)?[t]:[]))):n.push(ut.of(t)),n},e.syntaxParserRunning=function(t){var e
return(null===(e=t.plugin(S))||void 0===e?void 0:e.isWorking())||!1},e.syntaxTree=p,e.syntaxTreeAvailable=function(t,e=t.doc.length){var i
return(null===(i=t.field(u.state,!1))||void 0===i?void 0:i.context.isDone(e))||!1},e.unfoldAll=et,e.unfoldCode=K,e.unfoldEffect=q},426:(t,e,i)=>{"use strict"
Object.defineProperty(e,"__esModule",{value:!0})
var n=i(642),s=i(40)
var r=function(t){return t&&"object"==typeof t&&"default"in t?t:{default:t}}(i(513))
class o{constructor(t,e,i){this.from=t,this.to=e,this.diagnostic=i}}class a{constructor(t,e,i){this.diagnostics=t,this.panel=e,this.selected=i}static init(t,e,i){let s=t,r=i.facet(k).markerFilter
r&&(s=r(s))
let o=n.Decoration.set(s.map((t=>t.from==t.to||t.from==t.to-1&&i.doc.lineAt(t.from).to==t.from?n.Decoration.widget({widget:new T(t),diagnostic:t}).range(t.from):n.Decoration.mark({attributes:{class:"cm-lintRange cm-lintRange-"+t.severity},diagnostic:t}).range(t.from,t.to))),!0)
return new a(o,e,l(o))}}function l(t,e=null,i=0){let n=null
return t.between(i,1e9,((t,i,{spec:s})=>{if(!e||s.diagnostic==e)return n=new o(t,i,s.diagnostic),!1})),n}function h(t,e){return!(!t.effects.some((t=>t.is(f)))&&!t.changes.touchesRange(e.pos))}function c(t,e){return t.field(m,!1)?e:e.concat(s.StateEffect.appendConfig.of([m,n.EditorView.decorations.compute([m],(t=>{let{selected:e,panel:i}=t.field(m)
return e&&i&&e.from!=e.to?n.Decoration.set([g.range(e.from,e.to)]):n.Decoration.none})),n.hoverTooltip(O,{hideOn:h}),E]))}function u(t,e){return{effects:c(t,[f.of(e)])}}const f=s.StateEffect.define(),d=s.StateEffect.define(),p=s.StateEffect.define(),m=s.StateField.define({create:()=>new a(n.Decoration.none,null,null),update(t,e){if(e.docChanged){let i=t.diagnostics.map(e.changes),n=null
if(t.selected){let s=e.changes.mapPos(t.selected.from,1)
n=l(i,t.selected.diagnostic,s)||l(i,null,s)}t=new a(i,t.panel,n)}for(let i of e.effects)i.is(f)?t=a.init(i.value,t.panel,e.state):i.is(d)?t=new a(t.diagnostics,i.value?A.open:null,t.selected):i.is(p)&&(t=new a(t.diagnostics,t.panel,i.value))
return t},provide:t=>[n.showPanel.from(t,(t=>t.panel)),n.EditorView.decorations.from(t,(t=>t.diagnostics))]}),g=n.Decoration.mark({class:"cm-lintRange cm-lintRange-active"})
function O(t,e,i){let{diagnostics:n}=t.state.field(m),s=[],r=2e8,o=0
n.between(e-(i<0?1:0),e+(i>0?1:0),((t,n,{spec:a})=>{e>=t&&e<=n&&(t==n||(e>t||i>0)&&(e<n||i<0))&&(s.push(a.diagnostic),r=Math.min(t,r),o=Math.max(n,o))}))
let a=t.state.facet(k).tooltipFilter
return a&&(s=a(s)),s.length?{pos:r,end:o,above:t.state.doc.lineAt(r).to<o,create:()=>({dom:v(t,s)})}:null}function v(t,e){return r.default("ul",{class:"cm-tooltip-lint"},e.map((e=>P(t,e,!1))))}const y=t=>{let e=t.state.field(m,!1)
e&&e.panel||t.dispatch({effects:c(t.state,[d.of(!0)])})
let i=n.getPanel(t,A.open)
return i&&i.dom.querySelector(".cm-panel-lint ul").focus(),!0},b=t=>{let e=t.state.field(m,!1)
return!(!e||!e.panel||(t.dispatch({effects:d.of(!1)}),0))},w=t=>{let e=t.state.field(m,!1)
if(!e)return!1
let i=t.state.selection.main,n=e.diagnostics.iter(i.to+1)
return!(!n.value&&(n=e.diagnostics.iter(0),!n.value||n.from==i.from&&n.to==i.to)||(t.dispatch({selection:{anchor:n.from,head:n.to},scrollIntoView:!0}),0))},x=[{key:"Mod-Shift-m",run:y,preventDefault:!0},{key:"F8",run:w}],S=n.ViewPlugin.fromClass(class{constructor(t){this.view=t,this.timeout=-1,this.set=!0
let{delay:e}=t.state.facet(k)
this.lintTime=Date.now()+e,this.run=this.run.bind(this),this.timeout=setTimeout(this.run,e)}run(){let t=Date.now()
if(t<this.lintTime-10)setTimeout(this.run,this.lintTime-t)
else{this.set=!1
let{state:t}=this.view,{sources:e}=t.facet(k)
Promise.all(e.map((t=>Promise.resolve(t(this.view))))).then((e=>{let i=e.reduce(((t,e)=>t.concat(e)))
this.view.state.doc==t.doc&&this.view.dispatch(u(this.view.state,i))}),(t=>{n.logException(this.view.state,t)}))}}update(t){let e=t.state.facet(k);(t.docChanged||e!=t.startState.facet(k))&&(this.lintTime=Date.now()+e.delay,this.set||(this.set=!0,this.timeout=setTimeout(this.run,e.delay)))}force(){this.set&&(this.lintTime=Date.now(),this.run())}destroy(){clearTimeout(this.timeout)}}),k=s.Facet.define({combine:t=>Object.assign({sources:t.map((t=>t.source))},s.combineConfig(t.map((t=>t.config)),{delay:750,markerFilter:null,tooltipFilter:null})),enables:S})
function Q(t){let e=[]
if(t)t:for(let{name:i}of t){for(let t=0;t<i.length;t++){let n=i[t]
if(/[a-zA-Z]/.test(n)&&!e.some((t=>t.toLowerCase()==n.toLowerCase()))){e.push(n)
continue t}}e.push("")}return e}function P(t,e,i){var n
let s=i?Q(e.actions):[]
return r.default("li",{class:"cm-diagnostic cm-diagnostic-"+e.severity},r.default("span",{class:"cm-diagnosticText"},e.renderMessage?e.renderMessage():e.message),null===(n=e.actions)||void 0===n?void 0:n.map(((i,n)=>{let o=n=>{n.preventDefault()
let s=l(t.state.field(m).diagnostics,e)
s&&i.apply(t,s.from,s.to)},{name:a}=i,h=s[n]?a.indexOf(s[n]):-1,c=h<0?a:[a.slice(0,h),r.default("u",a.slice(h,h+1)),a.slice(h+1)]
return r.default("button",{type:"button",class:"cm-diagnosticAction",onclick:o,onmousedown:o,"aria-label":` Action: ${a}${h<0?"":` (access key "${s[n]})"`}.`},c)})),e.source&&r.default("div",{class:"cm-diagnosticSource"},e.source))}class T extends n.WidgetType{constructor(t){super(),this.diagnostic=t}eq(t){return t.diagnostic==this.diagnostic}toDOM(){return r.default("span",{class:"cm-lintPoint cm-lintPoint-"+this.diagnostic.severity})}}class ${constructor(t,e){this.diagnostic=e,this.id="item_"+Math.floor(4294967295*Math.random()).toString(16),this.dom=P(t,e,!0),this.dom.id=this.id,this.dom.setAttribute("role","option")}}class A{constructor(t){this.view=t,this.items=[],this.list=r.default("ul",{tabIndex:0,role:"listbox","aria-label":this.view.state.phrase("Diagnostics"),onkeydown:e=>{if(27==e.keyCode)b(this.view),this.view.focus()
else if(38==e.keyCode||33==e.keyCode)this.moveSelection((this.selectedIndex-1+this.items.length)%this.items.length)
else if(40==e.keyCode||34==e.keyCode)this.moveSelection((this.selectedIndex+1)%this.items.length)
else if(36==e.keyCode)this.moveSelection(0)
else if(35==e.keyCode)this.moveSelection(this.items.length-1)
else if(13==e.keyCode)this.view.focus()
else{if(!(e.keyCode>=65&&e.keyCode<=90&&this.selectedIndex>=0))return
{let{diagnostic:i}=this.items[this.selectedIndex],n=Q(i.actions)
for(let s=0;s<n.length;s++)if(n[s].toUpperCase().charCodeAt(0)==e.keyCode){let e=l(this.view.state.field(m).diagnostics,i)
e&&i.actions[s].apply(t,e.from,e.to)}}}e.preventDefault()},onclick:t=>{for(let e=0;e<this.items.length;e++)this.items[e].dom.contains(t.target)&&this.moveSelection(e)}}),this.dom=r.default("div",{class:"cm-panel-lint"},this.list,r.default("button",{type:"button",name:"close","aria-label":this.view.state.phrase("close"),onclick:()=>b(this.view)},"×")),this.update()}get selectedIndex(){let t=this.view.state.field(m).selected
if(!t)return-1
for(let e=0;e<this.items.length;e++)if(this.items[e].diagnostic==t.diagnostic)return e
return-1}update(){let{diagnostics:t,selected:e}=this.view.state.field(m),i=0,n=!1,s=null
for(t.between(0,this.view.state.doc.length,((t,r,{spec:o})=>{let a,l=-1
for(let e=i;e<this.items.length;e++)if(this.items[e].diagnostic==o.diagnostic){l=e
break}l<0?(a=new $(this.view,o.diagnostic),this.items.splice(i,0,a),n=!0):(a=this.items[l],l>i&&(this.items.splice(i,l-i),n=!0)),e&&a.diagnostic==e.diagnostic?a.dom.hasAttribute("aria-selected")||(a.dom.setAttribute("aria-selected","true"),s=a):a.dom.hasAttribute("aria-selected")&&a.dom.removeAttribute("aria-selected"),i++}));i<this.items.length&&!(1==this.items.length&&this.items[0].diagnostic.from<0);)n=!0,this.items.pop()
0==this.items.length&&(this.items.push(new $(this.view,{from:-1,to:-1,severity:"info",message:this.view.state.phrase("No diagnostics")})),n=!0),s?(this.list.setAttribute("aria-activedescendant",s.id),this.view.requestMeasure({key:this,read:()=>({sel:s.dom.getBoundingClientRect(),panel:this.list.getBoundingClientRect()}),write:({sel:t,panel:e})=>{t.top<e.top?this.list.scrollTop-=e.top-t.top:t.bottom>e.bottom&&(this.list.scrollTop+=t.bottom-e.bottom)}})):this.selectedIndex<0&&this.list.removeAttribute("aria-activedescendant"),n&&this.sync()}sync(){let t=this.list.firstChild
function e(){let e=t
t=e.nextSibling,e.remove()}for(let i of this.items)if(i.dom.parentNode==this.list){for(;t!=i.dom;)e()
t=i.dom.nextSibling}else this.list.insertBefore(i.dom,t)
for(;t;)e()}moveSelection(t){if(this.selectedIndex<0)return
let e=l(this.view.state.field(m).diagnostics,this.items[t].diagnostic)
e&&this.view.dispatch({selection:{anchor:e.from,head:e.to},scrollIntoView:!0,effects:p.of(e)})}static open(t){return new A(t)}}function _(t,e='viewBox="0 0 40 40"'){return`url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" ${e}>${encodeURIComponent(t)}</svg>')`}function C(t){return _(`<path d="m0 2.5 l2 -1.5 l1 0 l2 1.5 l1 0" stroke="${t}" fill="none" stroke-width=".7"/>`,'width="6" height="3"')}const E=n.EditorView.baseTheme({".cm-diagnostic":{padding:"3px 6px 3px 8px",marginLeft:"-1px",display:"block",whiteSpace:"pre-wrap"},".cm-diagnostic-error":{borderLeft:"5px solid #d11"},".cm-diagnostic-warning":{borderLeft:"5px solid orange"},".cm-diagnostic-info":{borderLeft:"5px solid #999"},".cm-diagnosticAction":{font:"inherit",border:"none",padding:"2px 4px",backgroundColor:"#444",color:"white",borderRadius:"3px",marginLeft:"8px"},".cm-diagnosticSource":{fontSize:"70%",opacity:.7},".cm-lintRange":{backgroundPosition:"left bottom",backgroundRepeat:"repeat-x",paddingBottom:"0.7px"},".cm-lintRange-error":{backgroundImage:C("#d11")},".cm-lintRange-warning":{backgroundImage:C("orange")},".cm-lintRange-info":{backgroundImage:C("#999")},".cm-lintRange-active":{backgroundColor:"#ffdd9980"},".cm-tooltip-lint":{padding:0,margin:0},".cm-lintPoint":{position:"relative","&:after":{content:'""',position:"absolute",bottom:0,left:"-2px",borderLeft:"3px solid transparent",borderRight:"3px solid transparent",borderBottom:"4px solid #d11"}},".cm-lintPoint-warning":{"&:after":{borderBottomColor:"orange"}},".cm-lintPoint-info":{"&:after":{borderBottomColor:"#999"}},".cm-panel.cm-panel-lint":{position:"relative","& ul":{maxHeight:"100px",overflowY:"auto","& [aria-selected]":{backgroundColor:"#ddd","& u":{textDecoration:"underline"}},"&:focus [aria-selected]":{background_fallback:"#bdf",backgroundColor:"Highlight",color_fallback:"white",color:"HighlightText"},"& u":{textDecoration:"none"},padding:0,margin:0},"& [name=close]":{position:"absolute",top:"0",right:"2px",background:"inherit",border:"none",font:"inherit",padding:0,margin:0}}})
class M extends n.GutterMarker{constructor(t){super(),this.diagnostics=t,this.severity=t.reduce(((t,e)=>{let i=e.severity
return"error"==i||"warning"==i&&"info"==t?i:t}),"info")}toDOM(t){let e=document.createElement("div")
e.className="cm-lint-marker cm-lint-marker-"+this.severity
let i=this.diagnostics,n=t.state.facet(X).tooltipFilter
return n&&(i=n(i)),i.length&&(e.onmouseover=()=>function(t,e,i){function n(){let n=t.elementAtHeight(e.getBoundingClientRect().top+5-t.documentTop)
t.coordsAtPos(n.from)&&t.dispatch({effects:Z.of({pos:n.from,above:!1,create:()=>({dom:v(t,i),getCoords:()=>e.getBoundingClientRect()})})}),e.onmouseout=e.onmousemove=null,function(t,e){let i=n=>{let s=e.getBoundingClientRect()
if(!(n.clientX>s.left-10&&n.clientX<s.right+10&&n.clientY>s.top-10&&n.clientY<s.bottom+10)){for(let t=n.target;t;t=t.parentNode)if(1==t.nodeType&&t.classList.contains("cm-tooltip-lint"))return
window.removeEventListener("mousemove",i),t.state.field(D)&&t.dispatch({effects:Z.of(null)})}}
window.addEventListener("mousemove",i)}(t,e)}let{hoverTime:s}=t.state.facet(X),r=setTimeout(n,s)
e.onmouseout=()=>{clearTimeout(r),e.onmouseout=e.onmousemove=null},e.onmousemove=()=>{clearTimeout(r),r=setTimeout(n,s)}}(t,e,i)),e}}function I(t,e){let i=Object.create(null)
for(let s of e){let e=t.lineAt(s.from);(i[e.from]||(i[e.from]=[])).push(s)}let n=[]
for(let s in i)n.push(new M(i[s]).range(+s))
return s.RangeSet.of(n,!0)}const W=n.gutter({class:"cm-gutter-lint",markers:t=>t.state.field(R)}),R=s.StateField.define({create:()=>s.RangeSet.empty,update(t,e){t=t.map(e.changes)
let i=e.state.facet(X).markerFilter
for(let n of e.effects)if(n.is(f)){let s=n.value
i&&(s=i(s||[])),t=I(e.state.doc,s.slice(0))}return t}}),Z=s.StateEffect.define(),D=s.StateField.define({create:()=>null,update:(t,e)=>(t&&e.docChanged&&(t=h(e,t)?null:Object.assign(Object.assign({},t),{pos:e.changes.mapPos(t.pos)})),e.effects.reduce(((t,e)=>e.is(Z)?e.value:t),t)),provide:t=>n.showTooltip.from(t)}),V=n.EditorView.baseTheme({".cm-gutter-lint":{width:"1.4em","& .cm-gutterElement":{padding:".2em"}},".cm-lint-marker":{width:"1em",height:"1em"},".cm-lint-marker-info":{content:_('<path fill="#aaf" stroke="#77e" stroke-width="6" stroke-linejoin="round" d="M5 5L35 5L35 35L5 35Z"/>')},".cm-lint-marker-warning":{content:_('<path fill="#fe8" stroke="#fd7" stroke-width="6" stroke-linejoin="round" d="M20 6L37 35L3 35Z"/>')},".cm-lint-marker-error":{content:_('<circle cx="20" cy="20" r="15" fill="#f87" stroke="#f43" stroke-width="6"/>')}}),X=s.Facet.define({combine:t=>s.combineConfig(t,{hoverTime:300,markerFilter:null,tooltipFilter:null})})
e.closeLintPanel=b,e.diagnosticCount=function(t){let e=t.field(m,!1)
return e?e.diagnostics.size:0},e.forEachDiagnostic=function(t,e){let i=t.field(m,!1)
if(i&&i.diagnostics.size)for(let n=s.RangeSet.iter([i.diagnostics]);n.value;n.next())e(n.value.spec.diagnostic,n.from,n.to)},e.forceLinting=function(t){let e=t.plugin(S)
e&&e.force()},e.lintGutter=function(t={}){return[X.of(t),R,W,V,D]},e.lintKeymap=x,e.linter=function(t,e={}){return k.of({source:t,config:e})},e.nextDiagnostic=w,e.openLintPanel=y,e.setDiagnostics=u,e.setDiagnosticsEffect=f},502:(t,e,i)=>{"use strict"
Object.defineProperty(e,"__esModule",{value:!0})
var n=i(642),s=i(40)
var r=function(t){return t&&"object"==typeof t&&"default"in t?t:{default:t}}(i(513))
const o="function"==typeof String.prototype.normalize?t=>t.normalize("NFKD"):t=>t
class a{constructor(t,e,i=0,n=t.length,s,r){this.test=r,this.value={from:0,to:0},this.done=!1,this.matches=[],this.buffer="",this.bufferPos=0,this.iter=t.iterRange(i,n),this.bufferStart=i,this.normalize=s?t=>s(o(t)):o,this.query=this.normalize(e)}peek(){if(this.bufferPos==this.buffer.length){if(this.bufferStart+=this.buffer.length,this.iter.next(),this.iter.done)return-1
this.bufferPos=0,this.buffer=this.iter.value}return s.codePointAt(this.buffer,this.bufferPos)}next(){for(;this.matches.length;)this.matches.pop()
return this.nextOverlapping()}nextOverlapping(){for(;;){let t=this.peek()
if(t<0)return this.done=!0,this
let e=s.fromCodePoint(t),i=this.bufferStart+this.bufferPos
this.bufferPos+=s.codePointSize(t)
let n=this.normalize(e)
for(let s=0,r=i;;s++){let t=n.charCodeAt(s),o=this.match(t,r)
if(o)return this.value=o,this
if(s==n.length-1)break
r==i&&s<e.length&&e.charCodeAt(s)==t&&r++}}}match(t,e){let i=null
for(let n=0;n<this.matches.length;n+=2){let s=this.matches[n],r=!1
this.query.charCodeAt(s)==t&&(s==this.query.length-1?i={from:this.matches[n+1],to:e+1}:(this.matches[n]++,r=!0)),r||(this.matches.splice(n,2),n-=2)}return this.query.charCodeAt(0)==t&&(1==this.query.length?i={from:e,to:e+1}:this.matches.push(1,e)),i&&this.test&&!this.test(i.from,i.to,this.buffer,this.bufferPos)&&(i=null),i}}"undefined"!=typeof Symbol&&(a.prototype[Symbol.iterator]=function(){return this})
const l={from:-1,to:-1,match:/.*/.exec("")},h="gm"+(null==/x/.unicode?"":"u")
class c{constructor(t,e,i,n=0,s=t.length){if(this.text=t,this.to=s,this.curLine="",this.done=!1,this.value=l,/\\[sWDnr]|\n|\r|\[\^/.test(e))return new d(t,e,i,n,s)
this.re=new RegExp(e,h+((null==i?void 0:i.ignoreCase)?"i":"")),this.test=null==i?void 0:i.test,this.iter=t.iter()
let r=t.lineAt(n)
this.curLineStart=r.from,this.matchPos=p(t,n),this.getLine(this.curLineStart)}getLine(t){this.iter.next(t),this.iter.lineBreak?this.curLine="":(this.curLine=this.iter.value,this.curLineStart+this.curLine.length>this.to&&(this.curLine=this.curLine.slice(0,this.to-this.curLineStart)),this.iter.next())}nextLine(){this.curLineStart=this.curLineStart+this.curLine.length+1,this.curLineStart>this.to?this.curLine="":this.getLine(0)}next(){for(let t=this.matchPos-this.curLineStart;;){this.re.lastIndex=t
let e=this.matchPos<=this.to&&this.re.exec(this.curLine)
if(e){let i=this.curLineStart+e.index,n=i+e[0].length
if(this.matchPos=p(this.text,n+(i==n?1:0)),i==this.curLineStart+this.curLine.length&&this.nextLine(),(i<n||i>this.value.to)&&(!this.test||this.test(i,n,e)))return this.value={from:i,to:n,match:e},this
t=this.matchPos-this.curLineStart}else{if(!(this.curLineStart+this.curLine.length<this.to))return this.done=!0,this
this.nextLine(),t=0}}}}const u=new WeakMap
class f{constructor(t,e){this.from=t,this.text=e}get to(){return this.from+this.text.length}static get(t,e,i){let n=u.get(t)
if(!n||n.from>=i||n.to<=e){let n=new f(e,t.sliceString(e,i))
return u.set(t,n),n}if(n.from==e&&n.to==i)return n
let{text:s,from:r}=n
return r>e&&(s=t.sliceString(e,r)+s,r=e),n.to<i&&(s+=t.sliceString(n.to,i)),u.set(t,new f(r,s)),new f(e,s.slice(e-r,i-r))}}class d{constructor(t,e,i,n,s){this.text=t,this.to=s,this.done=!1,this.value=l,this.matchPos=p(t,n),this.re=new RegExp(e,h+((null==i?void 0:i.ignoreCase)?"i":"")),this.test=null==i?void 0:i.test,this.flat=f.get(t,n,this.chunkEnd(n+5e3))}chunkEnd(t){return t>=this.to?this.to:this.text.lineAt(t).to}next(){for(;;){let t=this.re.lastIndex=this.matchPos-this.flat.from,e=this.re.exec(this.flat.text)
if(e&&!e[0]&&e.index==t&&(this.re.lastIndex=t+1,e=this.re.exec(this.flat.text)),e){let t=this.flat.from+e.index,i=t+e[0].length
if((this.flat.to>=this.to||e.index+e[0].length<=this.flat.text.length-10)&&(!this.test||this.test(t,i,e)))return this.value={from:t,to:i,match:e},this.matchPos=p(this.text,i+(t==i?1:0)),this}if(this.flat.to==this.to)return this.done=!0,this
this.flat=f.get(this.text,this.flat.from,this.chunkEnd(this.flat.from+2*this.flat.text.length))}}}function p(t,e){if(e>=t.length)return e
let i,n=t.lineAt(e)
for(;e<n.to&&(i=n.text.charCodeAt(e-n.from))>=56320&&i<57344;)e++
return e}function m(t){let e=r.default("input",{class:"cm-textfield",name:"line"})
function i(){let i=/^([+-])?(\d+)?(:\d+)?(%)?$/.exec(e.value)
if(!i)return
let{state:n}=t,r=n.doc.lineAt(n.selection.main.head),[,o,a,l,h]=i,c=l?+l.slice(1):0,u=a?+a:r.number
if(a&&h){let t=u/100
o&&(t=t*("-"==o?-1:1)+r.number/n.doc.lines),u=Math.round(n.doc.lines*t)}else a&&o&&(u=u*("-"==o?-1:1)+r.number)
let f=n.doc.line(Math.max(1,Math.min(n.doc.lines,u)))
t.dispatch({effects:g.of(!1),selection:s.EditorSelection.cursor(f.from+Math.max(0,Math.min(c,f.length))),scrollIntoView:!0}),t.focus()}return{dom:r.default("form",{class:"cm-gotoLine",onkeydown:e=>{27==e.keyCode?(e.preventDefault(),t.dispatch({effects:g.of(!1)}),t.focus()):13==e.keyCode&&(e.preventDefault(),i())},onsubmit:t=>{t.preventDefault(),i()}},r.default("label",t.state.phrase("Go to line"),": ",e)," ",r.default("button",{class:"cm-button",type:"submit"},t.state.phrase("go")))}}"undefined"!=typeof Symbol&&(c.prototype[Symbol.iterator]=d.prototype[Symbol.iterator]=function(){return this})
const g=s.StateEffect.define(),O=s.StateField.define({create:()=>!0,update(t,e){for(let i of e.effects)i.is(g)&&(t=i.value)
return t},provide:t=>n.showPanel.from(t,(t=>t?m:null))}),v=t=>{let e=n.getPanel(t,m)
if(!e){let i=[g.of(!0)]
null==t.state.field(O,!1)&&i.push(s.StateEffect.appendConfig.of([O,y])),t.dispatch({effects:i}),e=n.getPanel(t,m)}return e&&e.dom.querySelector("input").focus(),!0},y=n.EditorView.baseTheme({".cm-panel.cm-gotoLine":{padding:"2px 6px 4px","& label":{fontSize:"80%"}}}),b={highlightWordAroundCursor:!1,minSelectionLength:1,maxMatches:100,wholeWords:!1},w=s.Facet.define({combine:t=>s.combineConfig(t,b,{highlightWordAroundCursor:(t,e)=>t||e,minSelectionLength:Math.min,maxMatches:Math.min})}),x=n.Decoration.mark({class:"cm-selectionMatch"}),S=n.Decoration.mark({class:"cm-selectionMatch cm-selectionMatch-main"})
function k(t,e,i,n){return!(0!=i&&t(e.sliceDoc(i-1,i))==s.CharCategory.Word||n!=e.doc.length&&t(e.sliceDoc(n,n+1))==s.CharCategory.Word)}function Q(t,e,i,n){return t(e.sliceDoc(i,i+1))==s.CharCategory.Word&&t(e.sliceDoc(n-1,n))==s.CharCategory.Word}const P=n.ViewPlugin.fromClass(class{constructor(t){this.decorations=this.getDeco(t)}update(t){(t.selectionSet||t.docChanged||t.viewportChanged)&&(this.decorations=this.getDeco(t.view))}getDeco(t){let e=t.state.facet(w),{state:i}=t,s=i.selection
if(s.ranges.length>1)return n.Decoration.none
let r,o=s.main,l=null
if(o.empty){if(!e.highlightWordAroundCursor)return n.Decoration.none
let t=i.wordAt(o.head)
if(!t)return n.Decoration.none
l=i.charCategorizer(o.head),r=i.sliceDoc(t.from,t.to)}else{let t=o.to-o.from
if(t<e.minSelectionLength||t>200)return n.Decoration.none
if(e.wholeWords){if(r=i.sliceDoc(o.from,o.to),l=i.charCategorizer(o.head),!k(l,i,o.from,o.to)||!Q(l,i,o.from,o.to))return n.Decoration.none}else if(r=i.sliceDoc(o.from,o.to).trim(),!r)return n.Decoration.none}let h=[]
for(let c of t.visibleRanges){let t=new a(i.doc,r,c.from,c.to)
for(;!t.next().done;){let{from:s,to:r}=t.value
if((!l||k(l,i,s,r))&&(o.empty&&s<=o.from&&r>=o.to?h.push(S.range(s,r)):(s>=o.to||r<=o.from)&&h.push(x.range(s,r)),h.length>e.maxMatches))return n.Decoration.none}}return n.Decoration.set(h)}},{decorations:t=>t.decorations}),T=n.EditorView.baseTheme({".cm-selectionMatch":{backgroundColor:"#99ff7780"},".cm-searchMatch .cm-selectionMatch":{backgroundColor:"transparent"}}),$=({state:t,dispatch:e})=>{let{ranges:i}=t.selection
if(i.some((t=>t.from===t.to)))return(({state:t,dispatch:e})=>{let{selection:i}=t,n=s.EditorSelection.create(i.ranges.map((e=>t.wordAt(e.head)||s.EditorSelection.cursor(e.head))),i.mainIndex)
return!n.eq(i)&&(e(t.update({selection:n})),!0)})({state:t,dispatch:e})
let r=t.sliceDoc(i[0].from,i[0].to)
if(t.selection.ranges.some((e=>t.sliceDoc(e.from,e.to)!=r)))return!1
let o=function(t,e){let{main:i,ranges:n}=t.selection,s=t.wordAt(i.head),r=s&&s.from==i.from&&s.to==i.to
for(let o=!1,l=new a(t.doc,e,n[n.length-1].to);;){if(l.next(),!l.done){if(o&&n.some((t=>t.from==l.value.from)))continue
if(r){let e=t.wordAt(l.value.from)
if(!e||e.from!=l.value.from||e.to!=l.value.to)continue}return l.value}if(o)return null
l=new a(t.doc,e,0,Math.max(0,n[n.length-1].from-1)),o=!0}}(t,r)
return!!o&&(e(t.update({selection:t.selection.addRange(s.EditorSelection.range(o.from,o.to),!1),effects:n.EditorView.scrollIntoView(o.to)})),!0)},A=s.Facet.define({combine:t=>s.combineConfig(t,{top:!1,caseSensitive:!1,literal:!1,wholeWord:!1,createPanel:t=>new st(t)})})
class _{constructor(t){this.search=t.search,this.caseSensitive=!!t.caseSensitive,this.literal=!!t.literal,this.regexp=!!t.regexp,this.replace=t.replace||"",this.valid=!!this.search&&(!this.regexp||function(t){try{return new RegExp(t,h),!0}catch(t){return!1}}(this.search)),this.unquoted=this.unquote(this.search),this.wholeWord=!!t.wholeWord}unquote(t){return this.literal?t:t.replace(/\\([nrt\\])/g,((t,e)=>"n"==e?"\n":"r"==e?"\r":"t"==e?"\t":"\\"))}eq(t){return this.search==t.search&&this.replace==t.replace&&this.caseSensitive==t.caseSensitive&&this.regexp==t.regexp&&this.wholeWord==t.wholeWord}create(){return this.regexp?new D(this):new M(this)}getCursor(t,e=0,i){let n=t.doc?t:s.EditorState.create({doc:t})
return null==i&&(i=n.doc.length),this.regexp?I(this,n,e,i):E(this,n,e,i)}}class C{constructor(t){this.spec=t}}function E(t,e,i,n){return new a(e.doc,t.unquoted,i,n,t.caseSensitive?void 0:t=>t.toLowerCase(),t.wholeWord?function(t,e){return(i,n,r,o)=>((o>i||o+r.length<n)&&(o=Math.max(0,i-2),r=t.sliceString(o,Math.min(t.length,n+2))),!(e(W(r,i-o))==s.CharCategory.Word&&e(R(r,i-o))==s.CharCategory.Word||e(R(r,n-o))==s.CharCategory.Word&&e(W(r,n-o))==s.CharCategory.Word))}(e.doc,e.charCategorizer(e.selection.main.head)):void 0)}class M extends C{constructor(t){super(t)}nextMatch(t,e,i){let n=E(this.spec,t,i,t.doc.length).nextOverlapping()
return n.done&&(n=E(this.spec,t,0,e).nextOverlapping()),n.done?null:n.value}prevMatchInRange(t,e,i){for(let n=i;;){let i=Math.max(e,n-1e4-this.spec.unquoted.length),s=E(this.spec,t,i,n),r=null
for(;!s.nextOverlapping().done;)r=s.value
if(r)return r
if(i==e)return null
n-=1e4}}prevMatch(t,e,i){return this.prevMatchInRange(t,0,e)||this.prevMatchInRange(t,i,t.doc.length)}getReplacement(t){return this.spec.unquote(this.spec.replace)}matchAll(t,e){let i=E(this.spec,t,0,t.doc.length),n=[]
for(;!i.next().done;){if(n.length>=e)return null
n.push(i.value)}return n}highlight(t,e,i,n){let s=E(this.spec,t,Math.max(0,e-this.spec.unquoted.length),Math.min(i+this.spec.unquoted.length,t.doc.length))
for(;!s.next().done;)n(s.value.from,s.value.to)}}function I(t,e,i,n){return new c(e.doc,t.search,{ignoreCase:!t.caseSensitive,test:t.wholeWord?Z(e.charCategorizer(e.selection.main.head)):void 0},i,n)}function W(t,e){return t.slice(s.findClusterBreak(t,e,!1),e)}function R(t,e){return t.slice(e,s.findClusterBreak(t,e))}function Z(t){return(e,i,n)=>!n[0].length||(t(W(n.input,n.index))!=s.CharCategory.Word||t(R(n.input,n.index))!=s.CharCategory.Word)&&(t(R(n.input,n.index+n[0].length))!=s.CharCategory.Word||t(W(n.input,n.index+n[0].length))!=s.CharCategory.Word)}class D extends C{nextMatch(t,e,i){let n=I(this.spec,t,i,t.doc.length).next()
return n.done&&(n=I(this.spec,t,0,e).next()),n.done?null:n.value}prevMatchInRange(t,e,i){for(let n=1;;n++){let s=Math.max(e,i-1e4*n),r=I(this.spec,t,s,i),o=null
for(;!r.next().done;)o=r.value
if(o&&(s==e||o.from>s+10))return o
if(s==e)return null}}prevMatch(t,e,i){return this.prevMatchInRange(t,0,e)||this.prevMatchInRange(t,i,t.doc.length)}getReplacement(t){return this.spec.unquote(this.spec.replace.replace(/\$([$&\d+])/g,((e,i)=>"$"==i?"$":"&"==i?t.match[0]:"0"!=i&&+i<t.match.length?t.match[i]:e)))}matchAll(t,e){let i=I(this.spec,t,0,t.doc.length),n=[]
for(;!i.next().done;){if(n.length>=e)return null
n.push(i.value)}return n}highlight(t,e,i,n){let s=I(this.spec,t,Math.max(0,e-250),Math.min(i+250,t.doc.length))
for(;!s.next().done;)n(s.value.from,s.value.to)}}const V=s.StateEffect.define(),X=s.StateEffect.define(),j=s.StateField.define({create:t=>new L(tt(t).create(),null),update(t,e){for(let i of e.effects)i.is(V)?t=new L(i.value.create(),t.panel):i.is(X)&&(t=new L(t.query,i.value?J:null))
return t},provide:t=>n.showPanel.from(t,(t=>t.panel))})
class L{constructor(t,e){this.query=t,this.panel=e}}const N=n.Decoration.mark({class:"cm-searchMatch"}),U=n.Decoration.mark({class:"cm-searchMatch cm-searchMatch-selected"}),q=n.ViewPlugin.fromClass(class{constructor(t){this.view=t,this.decorations=this.highlight(t.state.field(j))}update(t){let e=t.state.field(j);(e!=t.startState.field(j)||t.docChanged||t.selectionSet||t.viewportChanged)&&(this.decorations=this.highlight(e))}highlight({query:t,panel:e}){if(!e||!t.spec.valid)return n.Decoration.none
let{view:i}=this,r=new s.RangeSetBuilder
for(let n=0,s=i.visibleRanges,o=s.length;n<o;n++){let{from:e,to:a}=s[n]
for(;n<o-1&&a>s[n+1].from-500;)a=s[++n].to
t.highlight(i.state,e,a,((t,e)=>{let n=i.state.selection.ranges.some((i=>i.from==t&&i.to==e))
r.add(t,e,n?U:N)}))}return r.finish()}},{decorations:t=>t.decorations})
function Y(t){return e=>{let i=e.state.field(j,!1)
return i&&i.query.spec.valid?t(e,i):et(e)}}const z=Y(((t,{query:e})=>{let{to:i}=t.state.selection.main,n=e.nextMatch(t.state,i,i)
return!!n&&(t.dispatch({selection:{anchor:n.from,head:n.to},scrollIntoView:!0,effects:at(t,n),userEvent:"select.search"}),!0)})),B=Y(((t,{query:e})=>{let{state:i}=t,{from:n}=i.selection.main,s=e.prevMatch(i,n,n)
return!!s&&(t.dispatch({selection:{anchor:s.from,head:s.to},scrollIntoView:!0,effects:at(t,s),userEvent:"select.search"}),!0)})),G=Y(((t,{query:e})=>{let i=e.matchAll(t.state,1e3)
return!(!i||!i.length||(t.dispatch({selection:s.EditorSelection.create(i.map((t=>s.EditorSelection.range(t.from,t.to)))),userEvent:"select.search.matches"}),0))})),F=({state:t,dispatch:e})=>{let i=t.selection
if(i.ranges.length>1||i.main.empty)return!1
let{from:n,to:r}=i.main,o=[],l=0
for(let h=new a(t.doc,t.sliceDoc(n,r));!h.next().done;){if(o.length>1e3)return!1
h.value.from==n&&(l=o.length),o.push(s.EditorSelection.range(h.value.from,h.value.to))}return e(t.update({selection:s.EditorSelection.create(o,l),userEvent:"select.search.matches"})),!0},H=Y(((t,{query:e})=>{let{state:i}=t,{from:s,to:r}=i.selection.main
if(i.readOnly)return!1
let o=e.nextMatch(i,s,s)
if(!o)return!1
let a,l,h=[],c=[]
if(o.from==s&&o.to==r&&(l=i.toText(e.getReplacement(o)),h.push({from:o.from,to:o.to,insert:l}),o=e.nextMatch(i,o.from,o.to),c.push(n.EditorView.announce.of(i.phrase("replaced match on line $",i.doc.lineAt(s).number)+"."))),o){let e=0==h.length||h[0].from>=o.to?0:o.to-o.from-l.length
a={anchor:o.from-e,head:o.to-e},c.push(at(t,o))}return t.dispatch({changes:h,selection:a,scrollIntoView:!!a,effects:c,userEvent:"input.replace"}),!0})),K=Y(((t,{query:e})=>{if(t.state.readOnly)return!1
let i=e.matchAll(t.state,1e9).map((t=>{let{from:i,to:n}=t
return{from:i,to:n,insert:e.getReplacement(t)}}))
if(!i.length)return!1
let s=t.state.phrase("replaced $ matches",i.length)+"."
return t.dispatch({changes:i,effects:n.EditorView.announce.of(s),userEvent:"input.replace.all"}),!0}))
function J(t){return t.state.facet(A).createPanel(t)}function tt(t,e){var i,n,s,r
let o=t.selection.main,a=o.empty||o.to>o.from+100?"":t.sliceDoc(o.from,o.to)
if(e&&!a)return e
let l=t.facet(A)
return new _({search:(null!==(i=null==e?void 0:e.literal)&&void 0!==i?i:l.literal)?a:a.replace(/\n/g,"\\n"),caseSensitive:null!==(n=null==e?void 0:e.caseSensitive)&&void 0!==n?n:l.caseSensitive,literal:null!==(s=null==e?void 0:e.literal)&&void 0!==s?s:l.literal,wholeWord:null!==(r=null==e?void 0:e.wholeWord)&&void 0!==r?r:l.wholeWord})}const et=t=>{let e=t.state.field(j,!1)
if(e&&e.panel){let i=n.getPanel(t,J)
if(!i)return!1
let s=i.dom.querySelector("[main-field]")
if(s&&s!=t.root.activeElement){let i=tt(t.state,e.query.spec)
i.valid&&t.dispatch({effects:V.of(i)}),s.focus(),s.select()}}else t.dispatch({effects:[X.of(!0),e?V.of(tt(t.state,e.query.spec)):s.StateEffect.appendConfig.of(ht)]})
return!0},it=t=>{let e=t.state.field(j,!1)
if(!e||!e.panel)return!1
let i=n.getPanel(t,J)
return i&&i.dom.contains(t.root.activeElement)&&t.focus(),t.dispatch({effects:X.of(!1)}),!0},nt=[{key:"Mod-f",run:et,scope:"editor search-panel"},{key:"F3",run:z,shift:B,scope:"editor search-panel",preventDefault:!0},{key:"Mod-g",run:z,shift:B,scope:"editor search-panel",preventDefault:!0},{key:"Escape",run:it,scope:"editor search-panel"},{key:"Mod-Shift-l",run:F},{key:"Alt-g",run:v},{key:"Mod-d",run:$,preventDefault:!0}]
class st{constructor(t){this.view=t
let e=this.query=t.state.field(j).query.spec
function i(t,e,i){return r.default("button",{class:"cm-button",name:t,onclick:e,type:"button"},i)}this.commit=this.commit.bind(this),this.searchField=r.default("input",{value:e.search,placeholder:rt(t,"Find"),"aria-label":rt(t,"Find"),class:"cm-textfield",name:"search",form:"","main-field":"true",onchange:this.commit,onkeyup:this.commit}),this.replaceField=r.default("input",{value:e.replace,placeholder:rt(t,"Replace"),"aria-label":rt(t,"Replace"),class:"cm-textfield",name:"replace",form:"",onchange:this.commit,onkeyup:this.commit}),this.caseField=r.default("input",{type:"checkbox",name:"case",form:"",checked:e.caseSensitive,onchange:this.commit}),this.reField=r.default("input",{type:"checkbox",name:"re",form:"",checked:e.regexp,onchange:this.commit}),this.wordField=r.default("input",{type:"checkbox",name:"word",form:"",checked:e.wholeWord,onchange:this.commit}),this.dom=r.default("div",{onkeydown:t=>this.keydown(t),class:"cm-search"},[this.searchField,i("next",(()=>z(t)),[rt(t,"next")]),i("prev",(()=>B(t)),[rt(t,"previous")]),i("select",(()=>G(t)),[rt(t,"all")]),r.default("label",null,[this.caseField,rt(t,"match case")]),r.default("label",null,[this.reField,rt(t,"regexp")]),r.default("label",null,[this.wordField,rt(t,"by word")]),...t.state.readOnly?[]:[r.default("br"),this.replaceField,i("replace",(()=>H(t)),[rt(t,"replace")]),i("replaceAll",(()=>K(t)),[rt(t,"replace all")])],r.default("button",{name:"close",onclick:()=>it(t),"aria-label":rt(t,"close"),type:"button"},["×"])])}commit(){let t=new _({search:this.searchField.value,caseSensitive:this.caseField.checked,regexp:this.reField.checked,wholeWord:this.wordField.checked,replace:this.replaceField.value})
t.eq(this.query)||(this.query=t,this.view.dispatch({effects:V.of(t)}))}keydown(t){n.runScopeHandlers(this.view,t,"search-panel")?t.preventDefault():13==t.keyCode&&t.target==this.searchField?(t.preventDefault(),(t.shiftKey?B:z)(this.view)):13==t.keyCode&&t.target==this.replaceField&&(t.preventDefault(),H(this.view))}update(t){for(let e of t.transactions)for(let t of e.effects)t.is(V)&&!t.value.eq(this.query)&&this.setQuery(t.value)}setQuery(t){this.query=t,this.searchField.value=t.search,this.replaceField.value=t.replace,this.caseField.checked=t.caseSensitive,this.reField.checked=t.regexp,this.wordField.checked=t.wholeWord}mount(){this.searchField.select()}get pos(){return 80}get top(){return this.view.state.facet(A).top}}function rt(t,e){return t.state.phrase(e)}const ot=/[\s\.,:;?!]/
function at(t,{from:e,to:i}){let s=t.state.doc.lineAt(e),r=t.state.doc.lineAt(i).to,o=Math.max(s.from,e-30),a=Math.min(r,i+30),l=t.state.sliceDoc(o,a)
if(o!=s.from)for(let n=0;n<30;n++)if(!ot.test(l[n+1])&&ot.test(l[n])){l=l.slice(n)
break}if(a!=r)for(let n=l.length-1;n>l.length-30;n--)if(!ot.test(l[n-1])&&ot.test(l[n])){l=l.slice(0,n)
break}return n.EditorView.announce.of(`${t.state.phrase("current match")}. ${l} ${t.state.phrase("on line")} ${s.number}.`)}const lt=n.EditorView.baseTheme({".cm-panel.cm-search":{padding:"2px 6px 4px",position:"relative","& [name=close]":{position:"absolute",top:"0",right:"4px",backgroundColor:"inherit",border:"none",font:"inherit",padding:0,margin:0},"& input, & button, & label":{margin:".2em .6em .2em 0"},"& input[type=checkbox]":{marginRight:".2em"},"& label":{fontSize:"80%",whiteSpace:"pre"}},"&light .cm-searchMatch":{backgroundColor:"#ffff0054"},"&dark .cm-searchMatch":{backgroundColor:"#00ffff8a"},"&light .cm-searchMatch-selected":{backgroundColor:"#ff6a0054"},"&dark .cm-searchMatch-selected":{backgroundColor:"#ff00ff8a"}}),ht=[j,s.Prec.lowest(q),lt]
e.RegExpCursor=c,e.SearchCursor=a,e.SearchQuery=_,e.closeSearchPanel=it,e.findNext=z,e.findPrevious=B,e.getSearchQuery=function(t){let e=t.field(j,!1)
return e?e.query.spec:tt(t)},e.gotoLine=v,e.highlightSelectionMatches=function(t){let e=[T,P]
return t&&e.push(w.of(t)),e},e.openSearchPanel=et,e.replaceAll=K,e.replaceNext=H,e.search=function(t){return t?[A.of(t),ht]:ht},e.searchKeymap=nt,e.searchPanelOpen=function(t){var e
return null!=(null===(e=t.field(j,!1))||void 0===e?void 0:e.panel)},e.selectMatches=G,e.selectNextOccurrence=$,e.selectSelectionMatches=F,e.setSearchQuery=V},40:(t,e)=>{"use strict"
Object.defineProperty(e,"__esModule",{value:!0})
class i{constructor(){}lineAt(t){if(t<0||t>this.length)throw new RangeError(`Invalid position ${t} in document of length ${this.length}`)
return this.lineInner(t,!1,1,0)}line(t){if(t<1||t>this.lines)throw new RangeError(`Invalid line number ${t} in ${this.lines}-line document`)
return this.lineInner(t,!0,1,0)}replace(t,e,i){let n=[]
return this.decompose(0,t,n,2),i.length&&i.decompose(0,i.length,n,3),this.decompose(e,this.length,n,1),s.from(n,this.length-(e-t)+i.length)}append(t){return this.replace(this.length,this.length,t)}slice(t,e=this.length){let i=[]
return this.decompose(t,e,i,0),s.from(i,e-t)}eq(t){if(t==this)return!0
if(t.length!=this.length||t.lines!=this.lines)return!1
let e=this.scanIdentical(t,1),i=this.length-this.scanIdentical(t,-1),n=new a(this),s=new a(t)
for(let r=e,o=e;;){if(n.next(r),s.next(r),r=0,n.lineBreak!=s.lineBreak||n.done!=s.done||n.value!=s.value)return!1
if(o+=n.value.length,n.done||o>=i)return!0}}iter(t=1){return new a(this,t)}iterRange(t,e=this.length){return new l(this,t,e)}iterLines(t,e){let i
if(null==t)i=this.iter()
else{null==e&&(e=this.lines+1)
let n=this.line(t).from
i=this.iterRange(n,Math.max(n,e==this.lines+1?this.length:e<=1?0:this.line(e-1).to))}return new h(i)}toString(){return this.sliceString(0)}toJSON(){let t=[]
return this.flatten(t),t}static of(t){if(0==t.length)throw new RangeError("A document must have at least one line")
return 1!=t.length||t[0]?t.length<=32?new n(t):s.from(n.split(t,[])):i.empty}}class n extends i{constructor(t,e=function(t){let e=-1
for(let i of t)e+=i.length+1
return e}(t)){super(),this.text=t,this.length=e}get lines(){return this.text.length}get children(){return null}lineInner(t,e,i,n){for(let s=0;;s++){let r=this.text[s],o=n+r.length
if((e?i:o)>=t)return new c(n,o,i,r)
n=o+1,i++}}decompose(t,e,i,s){let a=t<=0&&e>=this.length?this:new n(o(this.text,t,e),Math.min(e,this.length)-Math.max(0,t))
if(1&s){let t=i.pop(),e=r(a.text,t.text.slice(),0,a.length)
if(e.length<=32)i.push(new n(e,t.length+a.length))
else{let t=e.length>>1
i.push(new n(e.slice(0,t)),new n(e.slice(t)))}}else i.push(a)}replace(t,e,i){if(!(i instanceof n))return super.replace(t,e,i)
let a=r(this.text,r(i.text,o(this.text,0,t)),e),l=this.length+i.length-(e-t)
return a.length<=32?new n(a,l):s.from(n.split(a,[]),l)}sliceString(t,e=this.length,i="\n"){let n=""
for(let s=0,r=0;s<=e&&r<this.text.length;r++){let o=this.text[r],a=s+o.length
s>t&&r&&(n+=i),t<a&&e>s&&(n+=o.slice(Math.max(0,t-s),e-s)),s=a+1}return n}flatten(t){for(let e of this.text)t.push(e)}scanIdentical(){return 0}static split(t,e){let i=[],s=-1
for(let r of t)i.push(r),s+=r.length+1,32==i.length&&(e.push(new n(i,s)),i=[],s=-1)
return s>-1&&e.push(new n(i,s)),e}}class s extends i{constructor(t,e){super(),this.children=t,this.length=e,this.lines=0
for(let i of t)this.lines+=i.lines}lineInner(t,e,i,n){for(let s=0;;s++){let r=this.children[s],o=n+r.length,a=i+r.lines-1
if((e?a:o)>=t)return r.lineInner(t,e,i,n)
n=o+1,i=a+1}}decompose(t,e,i,n){for(let s=0,r=0;r<=e&&s<this.children.length;s++){let o=this.children[s],a=r+o.length
if(t<=a&&e>=r){let s=n&((r<=t?1:0)|(a>=e?2:0))
r>=t&&a<=e&&!s?i.push(o):o.decompose(t-r,e-r,i,s)}r=a+1}}replace(t,e,i){if(i.lines<this.lines)for(let n=0,r=0;n<this.children.length;n++){let o=this.children[n],a=r+o.length
if(t>=r&&e<=a){let l=o.replace(t-r,e-r,i),h=this.lines-o.lines+l.lines
if(l.lines<h>>4&&l.lines>h>>6){let r=this.children.slice()
return r[n]=l,new s(r,this.length-(e-t)+i.length)}return super.replace(r,a,l)}r=a+1}return super.replace(t,e,i)}sliceString(t,e=this.length,i="\n"){let n=""
for(let s=0,r=0;s<this.children.length&&r<=e;s++){let o=this.children[s],a=r+o.length
r>t&&s&&(n+=i),t<a&&e>r&&(n+=o.sliceString(t-r,e-r,i)),r=a+1}return n}flatten(t){for(let e of this.children)e.flatten(t)}scanIdentical(t,e){if(!(t instanceof s))return 0
let i=0,[n,r,o,a]=e>0?[0,0,this.children.length,t.children.length]:[this.children.length-1,t.children.length-1,-1,-1]
for(;;n+=e,r+=e){if(n==o||r==a)return i
let s=this.children[n],l=t.children[r]
if(s!=l)return i+s.scanIdentical(l,e)
i+=s.length+1}}static from(t,e=t.reduce(((t,e)=>t+e.length+1),-1)){let i=0
for(let n of t)i+=n.lines
if(i<32){let i=[]
for(let e of t)e.flatten(i)
return new n(i,e)}let r=Math.max(32,i>>5),o=r<<1,a=r>>1,l=[],h=0,c=-1,u=[]
function f(t){let e
if(t.lines>o&&t instanceof s)for(let i of t.children)f(i)
else t.lines>a&&(h>a||!h)?(d(),l.push(t)):t instanceof n&&h&&(e=u[u.length-1])instanceof n&&t.lines+e.lines<=32?(h+=t.lines,c+=t.length+1,u[u.length-1]=new n(e.text.concat(t.text),e.length+1+t.length)):(h+t.lines>r&&d(),h+=t.lines,c+=t.length+1,u.push(t))}function d(){0!=h&&(l.push(1==u.length?u[0]:s.from(u,c)),c=-1,h=u.length=0)}for(let n of t)f(n)
return d(),1==l.length?l[0]:new s(l,e)}}function r(t,e,i=0,n=1e9){for(let s=0,r=0,o=!0;r<t.length&&s<=n;r++){let a=t[r],l=s+a.length
l>=i&&(l>n&&(a=a.slice(0,n-s)),s<i&&(a=a.slice(i-s)),o?(e[e.length-1]+=a,o=!1):e.push(a)),s=l+1}return e}function o(t,e,i){return r(t,[""],e,i)}i.empty=new n([""],0)
class a{constructor(t,e=1){this.dir=e,this.done=!1,this.lineBreak=!1,this.value="",this.nodes=[t],this.offsets=[e>0?1:(t instanceof n?t.text.length:t.children.length)<<1]}nextInner(t,e){for(this.done=this.lineBreak=!1;;){let i=this.nodes.length-1,s=this.nodes[i],r=this.offsets[i],o=r>>1,a=s instanceof n?s.text.length:s.children.length
if(o==(e>0?a:0)){if(0==i)return this.done=!0,this.value="",this
e>0&&this.offsets[i-1]++,this.nodes.pop(),this.offsets.pop()}else if((1&r)==(e>0?0:1)){if(this.offsets[i]+=e,0==t)return this.lineBreak=!0,this.value="\n",this
t--}else if(s instanceof n){let n=s.text[o+(e<0?-1:0)]
if(this.offsets[i]+=e,n.length>Math.max(0,t))return this.value=0==t?n:e>0?n.slice(t):n.slice(0,n.length-t),this
t-=n.length}else{let r=s.children[o+(e<0?-1:0)]
t>r.length?(t-=r.length,this.offsets[i]+=e):(e<0&&this.offsets[i]--,this.nodes.push(r),this.offsets.push(e>0?1:(r instanceof n?r.text.length:r.children.length)<<1))}}}next(t=0){return t<0&&(this.nextInner(-t,-this.dir),t=this.value.length),this.nextInner(t,this.dir)}}class l{constructor(t,e,i){this.value="",this.done=!1,this.cursor=new a(t,e>i?-1:1),this.pos=e>i?t.length:0,this.from=Math.min(e,i),this.to=Math.max(e,i)}nextInner(t,e){if(e<0?this.pos<=this.from:this.pos>=this.to)return this.value="",this.done=!0,this
t+=Math.max(0,e<0?this.pos-this.to:this.from-this.pos)
let i=e<0?this.pos-this.from:this.to-this.pos
t>i&&(t=i),i-=t
let{value:n}=this.cursor.next(t)
return this.pos+=(n.length+t)*e,this.value=n.length<=i?n:e<0?n.slice(n.length-i):n.slice(0,i),this.done=!this.value,this}next(t=0){return t<0?t=Math.max(t,this.from-this.pos):t>0&&(t=Math.min(t,this.to-this.pos)),this.nextInner(t,this.cursor.dir)}get lineBreak(){return this.cursor.lineBreak&&""!=this.value}}class h{constructor(t){this.inner=t,this.afterBreak=!0,this.value="",this.done=!1}next(t=0){let{done:e,lineBreak:i,value:n}=this.inner.next(t)
return e?(this.done=!0,this.value=""):i?this.afterBreak?this.value="":(this.afterBreak=!0,this.next()):(this.value=n,this.afterBreak=!1),this}get lineBreak(){return!1}}"undefined"!=typeof Symbol&&(i.prototype[Symbol.iterator]=function(){return this.iter()},a.prototype[Symbol.iterator]=l.prototype[Symbol.iterator]=h.prototype[Symbol.iterator]=function(){return this})
class c{constructor(t,e,i,n){this.from=t,this.to=e,this.number=i,this.text=n}get length(){return this.to-this.from}}let u="lc,34,7n,7,7b,19,,,,2,,2,,,20,b,1c,l,g,,2t,7,2,6,2,2,,4,z,,u,r,2j,b,1m,9,9,,o,4,,9,,3,,5,17,3,3b,f,,w,1j,,,,4,8,4,,3,7,a,2,t,,1m,,,,2,4,8,,9,,a,2,q,,2,2,1l,,4,2,4,2,2,3,3,,u,2,3,,b,2,1l,,4,5,,2,4,,k,2,m,6,,,1m,,,2,,4,8,,7,3,a,2,u,,1n,,,,c,,9,,14,,3,,1l,3,5,3,,4,7,2,b,2,t,,1m,,2,,2,,3,,5,2,7,2,b,2,s,2,1l,2,,,2,4,8,,9,,a,2,t,,20,,4,,2,3,,,8,,29,,2,7,c,8,2q,,2,9,b,6,22,2,r,,,,,,1j,e,,5,,2,5,b,,10,9,,2u,4,,6,,2,2,2,p,2,4,3,g,4,d,,2,2,6,,f,,jj,3,qa,3,t,3,t,2,u,2,1s,2,,7,8,,2,b,9,,19,3,3b,2,y,,3a,3,4,2,9,,6,3,63,2,2,,1m,,,7,,,,,2,8,6,a,2,,1c,h,1r,4,1c,7,,,5,,14,9,c,2,w,4,2,2,,3,1k,,,2,3,,,3,1m,8,2,2,48,3,,d,,7,4,,6,,3,2,5i,1m,,5,ek,,5f,x,2da,3,3x,,2o,w,fe,6,2x,2,n9w,4,,a,w,2,28,2,7k,,3,,4,,p,2,5,,47,2,q,i,d,,12,8,p,b,1a,3,1c,,2,4,2,2,13,,1v,6,2,2,2,2,c,,8,,1b,,1f,,,3,2,2,5,2,,,16,2,8,,6m,,2,,4,,fn4,,kh,g,g,g,a6,2,gt,,6a,,45,5,1ae,3,,2,5,4,14,3,4,,4l,2,fx,4,ar,2,49,b,4w,,1i,f,1k,3,1d,4,2,2,1x,3,10,5,,8,1q,,c,2,1g,9,a,4,2,,2n,3,2,,,2,6,,4g,,3,8,l,2,1l,2,,,,,m,,e,7,3,5,5f,8,2,3,,,n,,29,,2,6,,,2,,,2,,2,6j,,2,4,6,2,,2,r,2,2d,8,2,,,2,2y,,,,2,6,,,2t,3,2,4,,5,77,9,,2,6t,,a,2,,,4,,40,4,2,2,4,,w,a,14,6,2,4,8,,9,6,2,3,1a,d,,2,ba,7,,6,,,2a,m,2,7,,2,,2,3e,6,3,,,2,,7,,,20,2,3,,,,9n,2,f0b,5,1n,7,t4,,1r,4,29,,f5k,2,43q,,,3,4,5,8,8,2,7,u,4,44,3,1iz,1j,4,1e,8,,e,,m,5,,f,11s,7,,h,2,7,,2,,5,79,7,c5,4,15s,7,31,7,240,5,gx7k,2o,3k,6o".split(",").map((t=>t?parseInt(t,36):1))
for(let Wt=1;Wt<u.length;Wt++)u[Wt]+=u[Wt-1]
function f(t){for(let e=1;e<u.length;e+=2)if(u[e]>t)return u[e-1]<=t
return!1}function d(t){return t>=127462&&t<=127487}function p(t,e,i=!0,n=!0){return(i?m:g)(t,e,n)}function m(t,e,i){if(e==t.length)return e
e&&O(t.charCodeAt(e))&&v(t.charCodeAt(e-1))&&e--
let n=y(t,e)
for(e+=b(n);e<t.length;){let s=y(t,e)
if(8205==n||8205==s||i&&f(s))e+=b(s),n=s
else{if(!d(s))break
{let i=0,n=e-2
for(;n>=0&&d(y(t,n));)i++,n-=2
if(i%2==0)break
e+=2}}}return e}function g(t,e,i){for(;e>0;){let n=m(t,e-2,i)
if(n<e)return n
e--}return 0}function O(t){return t>=56320&&t<57344}function v(t){return t>=55296&&t<56320}function y(t,e){let i=t.charCodeAt(e)
if(!v(i)||e+1==t.length)return i
let n=t.charCodeAt(e+1)
return O(n)?n-56320+(i-55296<<10)+65536:i}function b(t){return t<65536?1:2}const w=/\r\n?|\n/
var x
e.MapMode=void 0,(x=e.MapMode||(e.MapMode={}))[x.Simple=0]="Simple",x[x.TrackDel=1]="TrackDel",x[x.TrackBefore=2]="TrackBefore",x[x.TrackAfter=3]="TrackAfter"
class S{constructor(t){this.sections=t}get length(){let t=0
for(let e=0;e<this.sections.length;e+=2)t+=this.sections[e]
return t}get newLength(){let t=0
for(let e=0;e<this.sections.length;e+=2){let i=this.sections[e+1]
t+=i<0?this.sections[e]:i}return t}get empty(){return 0==this.sections.length||2==this.sections.length&&this.sections[1]<0}iterGaps(t){for(let e=0,i=0,n=0;e<this.sections.length;){let s=this.sections[e++],r=this.sections[e++]
r<0?(t(i,n,s),n+=s):n+=r,i+=s}}iterChangedRanges(t,e=!1){T(this,t,e)}get invertedDesc(){let t=[]
for(let e=0;e<this.sections.length;){let i=this.sections[e++],n=this.sections[e++]
n<0?t.push(i,n):t.push(n,i)}return new S(t)}composeDesc(t){return this.empty?t:t.empty?this:A(this,t)}mapDesc(t,e=!1){return t.empty?this:$(this,t,e)}mapPos(t,i=-1,n=e.MapMode.Simple){let s=0,r=0
for(let o=0;o<this.sections.length;){let a=this.sections[o++],l=this.sections[o++],h=s+a
if(l<0){if(h>t)return r+(t-s)
r+=a}else{if(n!=e.MapMode.Simple&&h>=t&&(n==e.MapMode.TrackDel&&s<t&&h>t||n==e.MapMode.TrackBefore&&s<t||n==e.MapMode.TrackAfter&&h>t))return null
if(h>t||h==t&&i<0&&!a)return t==s||i<0?r:r+l
r+=l}s=h}if(t>s)throw new RangeError(`Position ${t} is out of range for changeset of length ${s}`)
return r}touchesRange(t,e=t){for(let i=0,n=0;i<this.sections.length&&n<=e;){let s=n+this.sections[i++]
if(this.sections[i++]>=0&&n<=e&&s>=t)return!(n<t&&s>e)||"cover"
n=s}return!1}toString(){let t=""
for(let e=0;e<this.sections.length;){let i=this.sections[e++],n=this.sections[e++]
t+=(t?" ":"")+i+(n>=0?":"+n:"")}return t}toJSON(){return this.sections}static fromJSON(t){if(!Array.isArray(t)||t.length%2||t.some((t=>"number"!=typeof t)))throw new RangeError("Invalid JSON representation of ChangeDesc")
return new S(t)}static create(t){return new S(t)}}class k extends S{constructor(t,e){super(t),this.inserted=e}apply(t){if(this.length!=t.length)throw new RangeError("Applying change set to a document with the wrong length")
return T(this,((e,i,n,s,r)=>t=t.replace(n,n+(i-e),r)),!1),t}mapDesc(t,e=!1){return $(this,t,e,!0)}invert(t){let e=this.sections.slice(),n=[]
for(let s=0,r=0;s<e.length;s+=2){let o=e[s],a=e[s+1]
if(a>=0){e[s]=a,e[s+1]=o
let l=s>>1
for(;n.length<l;)n.push(i.empty)
n.push(o?t.slice(r,r+o):i.empty)}r+=o}return new k(e,n)}compose(t){return this.empty?t:t.empty?this:A(this,t,!0)}map(t,e=!1){return t.empty?this:$(this,t,e,!0)}iterChanges(t,e=!1){T(this,t,e)}get desc(){return S.create(this.sections)}filter(t){let e=[],i=[],n=[],s=new _(this)
t:for(let r=0,o=0;;){let a=r==t.length?1e9:t[r++]
for(;o<a||o==a&&0==s.len;){if(s.done)break t
let t=Math.min(s.len,a-o)
Q(n,t,-1)
let r=-1==s.ins?-1:0==s.off?s.ins:0
Q(e,t,r),r>0&&P(i,e,s.text),s.forward(t),o+=t}let l=t[r++]
for(;o<l;){if(s.done)break t
let t=Math.min(s.len,l-o)
Q(e,t,-1),Q(n,t,-1==s.ins?-1:0==s.off?s.ins:0),s.forward(t),o+=t}}return{changes:new k(e,i),filtered:S.create(n)}}toJSON(){let t=[]
for(let e=0;e<this.sections.length;e+=2){let i=this.sections[e],n=this.sections[e+1]
n<0?t.push(i):0==n?t.push([i]):t.push([i].concat(this.inserted[e>>1].toJSON()))}return t}static of(t,e,n){let s=[],r=[],o=0,a=null
function l(t=!1){if(!t&&!s.length)return
o<e&&Q(s,e-o,-1)
let i=new k(s,r)
a=a?a.compose(i.map(a)):i,s=[],r=[],o=0}return function t(h){if(Array.isArray(h))for(let e of h)t(e)
else if(h instanceof k){if(h.length!=e)throw new RangeError(`Mismatched change set length (got ${h.length}, expected ${e})`)
l(),a=a?a.compose(h.map(a)):h}else{let{from:t,to:a=t,insert:c}=h
if(t>a||t<0||a>e)throw new RangeError(`Invalid change range ${t} to ${a} (in doc of length ${e})`)
let u=c?"string"==typeof c?i.of(c.split(n||w)):c:i.empty,f=u.length
if(t==a&&0==f)return
t<o&&l(),t>o&&Q(s,t-o,-1),Q(s,a-t,f),P(r,s,u),o=a}}(t),l(!a),a}static empty(t){return new k(t?[t,-1]:[],[])}static fromJSON(t){if(!Array.isArray(t))throw new RangeError("Invalid JSON representation of ChangeSet")
let e=[],n=[]
for(let s=0;s<t.length;s++){let r=t[s]
if("number"==typeof r)e.push(r,-1)
else{if(!Array.isArray(r)||"number"!=typeof r[0]||r.some(((t,e)=>e&&"string"!=typeof t)))throw new RangeError("Invalid JSON representation of ChangeSet")
if(1==r.length)e.push(r[0],0)
else{for(;n.length<s;)n.push(i.empty)
n[s]=i.of(r.slice(1)),e.push(r[0],n[s].length)}}}return new k(e,n)}static createSet(t,e){return new k(t,e)}}function Q(t,e,i,n=!1){if(0==e&&i<=0)return
let s=t.length-2
s>=0&&i<=0&&i==t[s+1]?t[s]+=e:0==e&&0==t[s]?t[s+1]+=i:n?(t[s]+=e,t[s+1]+=i):t.push(e,i)}function P(t,e,n){if(0==n.length)return
let s=e.length-2>>1
if(s<t.length)t[t.length-1]=t[t.length-1].append(n)
else{for(;t.length<s;)t.push(i.empty)
t.push(n)}}function T(t,e,n){let s=t.inserted
for(let r=0,o=0,a=0;a<t.sections.length;){let l=t.sections[a++],h=t.sections[a++]
if(h<0)r+=l,o+=l
else{let c=r,u=o,f=i.empty
for(;c+=l,u+=h,h&&s&&(f=f.append(s[a-2>>1])),!(n||a==t.sections.length||t.sections[a+1]<0);)l=t.sections[a++],h=t.sections[a++]
e(r,c,o,u,f),r=c,o=u}}}function $(t,e,i,n=!1){let s=[],r=n?[]:null,o=new _(t),a=new _(e)
for(let l=-1;;)if(-1==o.ins&&-1==a.ins){let t=Math.min(o.len,a.len)
Q(s,t,-1),o.forward(t),a.forward(t)}else if(a.ins>=0&&(o.ins<0||l==o.i||0==o.off&&(a.len<o.len||a.len==o.len&&!i))){let t=a.len
for(Q(s,a.ins,-1);t;){let e=Math.min(o.len,t)
o.ins>=0&&l<o.i&&o.len<=e&&(Q(s,0,o.ins),r&&P(r,s,o.text),l=o.i),o.forward(e),t-=e}a.next()}else{if(!(o.ins>=0)){if(o.done&&a.done)return r?k.createSet(s,r):S.create(s)
throw new Error("Mismatched change set lengths")}{let t=0,e=o.len
for(;e;)if(-1==a.ins){let i=Math.min(e,a.len)
t+=i,e-=i,a.forward(i)}else{if(!(0==a.ins&&a.len<e))break
e-=a.len,a.next()}Q(s,t,l<o.i?o.ins:0),r&&l<o.i&&P(r,s,o.text),l=o.i,o.forward(o.len-e)}}}function A(t,e,i=!1){let n=[],s=i?[]:null,r=new _(t),o=new _(e)
for(let a=!1;;){if(r.done&&o.done)return s?k.createSet(n,s):S.create(n)
if(0==r.ins)Q(n,r.len,0,a),r.next()
else if(0!=o.len||o.done){if(r.done||o.done)throw new Error("Mismatched change set lengths")
{let t=Math.min(r.len2,o.len),e=n.length
if(-1==r.ins){let e=-1==o.ins?-1:o.off?0:o.ins
Q(n,t,e,a),s&&e&&P(s,n,o.text)}else-1==o.ins?(Q(n,r.off?0:r.len,t,a),s&&P(s,n,r.textBit(t))):(Q(n,r.off?0:r.len,o.off?0:o.ins,a),s&&!o.off&&P(s,n,o.text))
a=(r.ins>t||o.ins>=0&&o.len>t)&&(a||n.length>e),r.forward2(t),o.forward(t)}}else Q(n,0,o.ins,a),s&&P(s,n,o.text),o.next()}}class _{constructor(t){this.set=t,this.i=0,this.next()}next(){let{sections:t}=this.set
this.i<t.length?(this.len=t[this.i++],this.ins=t[this.i++]):(this.len=0,this.ins=-2),this.off=0}get done(){return-2==this.ins}get len2(){return this.ins<0?this.len:this.ins}get text(){let{inserted:t}=this.set,e=this.i-2>>1
return e>=t.length?i.empty:t[e]}textBit(t){let{inserted:e}=this.set,n=this.i-2>>1
return n>=e.length&&!t?i.empty:e[n].slice(this.off,null==t?void 0:this.off+t)}forward(t){t==this.len?this.next():(this.len-=t,this.off+=t)}forward2(t){-1==this.ins?this.forward(t):t==this.ins?this.next():(this.ins-=t,this.off+=t)}}class C{constructor(t,e,i){this.from=t,this.to=e,this.flags=i}get anchor(){return 16&this.flags?this.to:this.from}get head(){return 16&this.flags?this.from:this.to}get empty(){return this.from==this.to}get assoc(){return 4&this.flags?-1:8&this.flags?1:0}get bidiLevel(){let t=3&this.flags
return 3==t?null:t}get goalColumn(){let t=this.flags>>5
return 33554431==t?void 0:t}map(t,e=-1){let i,n
return this.empty?i=n=t.mapPos(this.from,e):(i=t.mapPos(this.from,1),n=t.mapPos(this.to,-1)),i==this.from&&n==this.to?this:new C(i,n,this.flags)}extend(t,e=t){if(t<=this.anchor&&e>=this.anchor)return E.range(t,e)
let i=Math.abs(t-this.anchor)>Math.abs(e-this.anchor)?t:e
return E.range(this.anchor,i)}eq(t){return this.anchor==t.anchor&&this.head==t.head}toJSON(){return{anchor:this.anchor,head:this.head}}static fromJSON(t){if(!t||"number"!=typeof t.anchor||"number"!=typeof t.head)throw new RangeError("Invalid JSON representation for SelectionRange")
return E.range(t.anchor,t.head)}static create(t,e,i){return new C(t,e,i)}}class E{constructor(t,e){this.ranges=t,this.mainIndex=e}map(t,e=-1){return t.empty?this:E.create(this.ranges.map((i=>i.map(t,e))),this.mainIndex)}eq(t){if(this.ranges.length!=t.ranges.length||this.mainIndex!=t.mainIndex)return!1
for(let e=0;e<this.ranges.length;e++)if(!this.ranges[e].eq(t.ranges[e]))return!1
return!0}get main(){return this.ranges[this.mainIndex]}asSingle(){return 1==this.ranges.length?this:new E([this.main],0)}addRange(t,e=!0){return E.create([t].concat(this.ranges),e?0:this.mainIndex+1)}replaceRange(t,e=this.mainIndex){let i=this.ranges.slice()
return i[e]=t,E.create(i,this.mainIndex)}toJSON(){return{ranges:this.ranges.map((t=>t.toJSON())),main:this.mainIndex}}static fromJSON(t){if(!t||!Array.isArray(t.ranges)||"number"!=typeof t.main||t.main>=t.ranges.length)throw new RangeError("Invalid JSON representation for EditorSelection")
return new E(t.ranges.map((t=>C.fromJSON(t))),t.main)}static single(t,e=t){return new E([E.range(t,e)],0)}static create(t,e=0){if(0==t.length)throw new RangeError("A selection needs at least one range")
for(let i=0,n=0;n<t.length;n++){let s=t[n]
if(s.empty?s.from<=i:s.from<i)return E.normalized(t.slice(),e)
i=s.to}return new E(t,e)}static cursor(t,e=0,i,n){return C.create(t,t,(0==e?0:e<0?4:8)|(null==i?3:Math.min(2,i))|(null!=n?n:33554431)<<5)}static range(t,e,i){let n=(null!=i?i:33554431)<<5
return e<t?C.create(e,t,24|n):C.create(t,e,n|(e>t?4:0))}static normalized(t,e=0){let i=t[e]
t.sort(((t,e)=>t.from-e.from)),e=t.indexOf(i)
for(let n=1;n<t.length;n++){let i=t[n],s=t[n-1]
if(i.empty?i.from<=s.to:i.from<s.to){let r=s.from,o=Math.max(i.to,s.to)
n<=e&&e--,t.splice(--n,2,i.anchor>i.head?E.range(o,r):E.range(r,o))}}return new E(t,e)}}function M(t,e){for(let i of t.ranges)if(i.to>e)throw new RangeError("Selection points outside of document")}let I=0
class W{constructor(t,e,i,n,s){this.combine=t,this.compareInput=e,this.compare=i,this.isStatic=n,this.id=I++,this.default=t([]),this.extensions="function"==typeof s?s(this):s}static define(t={}){return new W(t.combine||(t=>t),t.compareInput||((t,e)=>t===e),t.compare||(t.combine?(t,e)=>t===e:R),!!t.static,t.enables)}of(t){return new Z([],this,0,t)}compute(t,e){if(this.isStatic)throw new Error("Can't compute a static facet")
return new Z(t,this,1,e)}computeN(t,e){if(this.isStatic)throw new Error("Can't compute a static facet")
return new Z(t,this,2,e)}from(t,e){return e||(e=t=>t),this.compute([t],(i=>e(i.field(t))))}}function R(t,e){return t==e||t.length==e.length&&t.every(((t,i)=>t===e[i]))}class Z{constructor(t,e,i,n){this.dependencies=t,this.facet=e,this.type=i,this.value=n,this.id=I++}dynamicSlot(t){var e
let i=this.value,n=this.facet.compareInput,s=this.id,r=t[s]>>1,o=2==this.type,a=!1,l=!1,h=[]
for(let c of this.dependencies)"doc"==c?a=!0:"selection"==c?l=!0:0==(1&(null!==(e=t[c.id])&&void 0!==e?e:1))&&h.push(t[c.id])
return{create:t=>(t.values[r]=i(t),1),update(t,e){if(a&&e.docChanged||l&&(e.docChanged||e.selection)||V(t,h)){let e=i(t)
if(o?!D(e,t.values[r],n):!n(e,t.values[r]))return t.values[r]=e,1}return 0},reconfigure:(t,e)=>{let a,l=e.config.address[s]
if(null!=l){let s=F(e,l)
if(this.dependencies.every((i=>i instanceof W?e.facet(i)===t.facet(i):!(i instanceof L)||e.field(i,!1)==t.field(i,!1)))||(o?D(a=i(t),s,n):n(a=i(t),s)))return t.values[r]=s,0}else a=i(t)
return t.values[r]=a,1}}}}function D(t,e,i){if(t.length!=e.length)return!1
for(let n=0;n<t.length;n++)if(!i(t[n],e[n]))return!1
return!0}function V(t,e){let i=!1
for(let n of e)1&G(t,n)&&(i=!0)
return i}function X(t,e,i){let n=i.map((e=>t[e.id])),s=i.map((t=>t.type)),r=n.filter((t=>!(1&t))),o=t[e.id]>>1
function a(t){let i=[]
for(let e=0;e<n.length;e++){let r=F(t,n[e])
if(2==s[e])for(let t of r)i.push(t)
else i.push(r)}return e.combine(i)}return{create(t){for(let e of n)G(t,e)
return t.values[o]=a(t),1},update(t,i){if(!V(t,r))return 0
let n=a(t)
return e.compare(n,t.values[o])?0:(t.values[o]=n,1)},reconfigure(t,s){let r=V(t,n),l=s.config.facets[e.id],h=s.facet(e)
if(l&&!r&&R(i,l))return t.values[o]=h,0
let c=a(t)
return e.compare(c,h)?(t.values[o]=h,0):(t.values[o]=c,1)}}}const j=W.define({static:!0})
class L{constructor(t,e,i,n,s){this.id=t,this.createF=e,this.updateF=i,this.compareF=n,this.spec=s,this.provides=void 0}static define(t){let e=new L(I++,t.create,t.update,t.compare||((t,e)=>t===e),t)
return t.provide&&(e.provides=t.provide(e)),e}create(t){let e=t.facet(j).find((t=>t.field==this))
return((null==e?void 0:e.create)||this.createF)(t)}slot(t){let e=t[this.id]>>1
return{create:t=>(t.values[e]=this.create(t),1),update:(t,i)=>{let n=t.values[e],s=this.updateF(n,i)
return this.compareF(n,s)?0:(t.values[e]=s,1)},reconfigure:(t,i)=>null!=i.config.address[this.id]?(t.values[e]=i.field(this),0):(t.values[e]=this.create(t),1)}}init(t){return[this,j.of({field:this,create:t})]}get extension(){return this}}function N(t){return e=>new q(e,t)}const U={highest:N(0),high:N(1),default:N(2),low:N(3),lowest:N(4)}
class q{constructor(t,e){this.inner=t,this.prec=e}}class Y{of(t){return new z(this,t)}reconfigure(t){return Y.reconfigure.of({compartment:this,extension:t})}get(t){return t.config.compartments.get(this)}}class z{constructor(t,e){this.compartment=t,this.inner=e}}class B{constructor(t,e,i,n,s,r){for(this.base=t,this.compartments=e,this.dynamicSlots=i,this.address=n,this.staticValues=s,this.facets=r,this.statusTemplate=[];this.statusTemplate.length<i.length;)this.statusTemplate.push(0)}staticFacet(t){let e=this.address[t.id]
return null==e?t.default:this.staticValues[e>>1]}static resolve(t,e,i){let n=[],s=Object.create(null),r=new Map
for(let u of function(t,e,i){let n=[[],[],[],[],[]],s=new Map
return function t(r,o){let a=s.get(r)
if(null!=a){if(a<=o)return
let t=n[a].indexOf(r)
t>-1&&n[a].splice(t,1),r instanceof z&&i.delete(r.compartment)}if(s.set(r,o),Array.isArray(r))for(let e of r)t(e,o)
else if(r instanceof z){if(i.has(r.compartment))throw new RangeError("Duplicate use of compartment in extensions")
let n=e.get(r.compartment)||r.inner
i.set(r.compartment,n),t(n,o)}else if(r instanceof q)t(r.inner,r.prec)
else if(r instanceof L)n[o].push(r),r.provides&&t(r.provides,o)
else if(r instanceof Z)n[o].push(r),r.facet.extensions&&t(r.facet.extensions,2)
else{let e=r.extension
if(!e)throw new Error(`Unrecognized extension value in extension set (${r}). This sometimes happens because multiple instances of @codemirror/state are loaded, breaking instanceof checks.`)
t(e,o)}}(t,2),n.reduce(((t,e)=>t.concat(e)))}(t,e,r))u instanceof L?n.push(u):(s[u.facet.id]||(s[u.facet.id]=[])).push(u)
let o=Object.create(null),a=[],l=[]
for(let u of n)o[u.id]=l.length<<1,l.push((t=>u.slot(t)))
let h=null==i?void 0:i.config.facets
for(let u in s){let t=s[u],e=t[0].facet,n=h&&h[u]||[]
if(t.every((t=>0==t.type)))if(o[e.id]=a.length<<1|1,R(n,t))a.push(i.facet(e))
else{let n=e.combine(t.map((t=>t.value)))
a.push(i&&e.compare(n,i.facet(e))?i.facet(e):n)}else{for(let e of t)0==e.type?(o[e.id]=a.length<<1|1,a.push(e.value)):(o[e.id]=l.length<<1,l.push((t=>e.dynamicSlot(t))))
o[e.id]=l.length<<1,l.push((i=>X(i,e,t)))}}let c=l.map((t=>t(o)))
return new B(t,r,c,o,a,s)}}function G(t,e){if(1&e)return 2
let i=e>>1,n=t.status[i]
if(4==n)throw new Error("Cyclic dependency between fields and/or facets")
if(2&n)return n
t.status[i]=4
let s=t.computeSlot(t,t.config.dynamicSlots[i])
return t.status[i]=2|s}function F(t,e){return 1&e?t.config.staticValues[e>>1]:t.values[e>>1]}const H=W.define(),K=W.define({combine:t=>t.some((t=>t)),static:!0}),J=W.define({combine:t=>t.length?t[0]:void 0,static:!0}),tt=W.define(),et=W.define(),it=W.define(),nt=W.define({combine:t=>!!t.length&&t[0]})
class st{constructor(t,e){this.type=t,this.value=e}static define(){return new rt}}class rt{of(t){return new st(this,t)}}class ot{constructor(t){this.map=t}of(t){return new at(this,t)}}class at{constructor(t,e){this.type=t,this.value=e}map(t){let e=this.type.map(this.value,t)
return void 0===e?void 0:e==this.value?this:new at(this.type,e)}is(t){return this.type==t}static define(t={}){return new ot(t.map||(t=>t))}static mapEffects(t,e){if(!t.length)return t
let i=[]
for(let n of t){let t=n.map(e)
t&&i.push(t)}return i}}at.reconfigure=at.define(),at.appendConfig=at.define()
class lt{constructor(t,e,i,n,s,r){this.startState=t,this.changes=e,this.selection=i,this.effects=n,this.annotations=s,this.scrollIntoView=r,this._doc=null,this._state=null,i&&M(i,e.newLength),s.some((t=>t.type==lt.time))||(this.annotations=s.concat(lt.time.of(Date.now())))}static create(t,e,i,n,s,r){return new lt(t,e,i,n,s,r)}get newDoc(){return this._doc||(this._doc=this.changes.apply(this.startState.doc))}get newSelection(){return this.selection||this.startState.selection.map(this.changes)}get state(){return this._state||this.startState.applyTransaction(this),this._state}annotation(t){for(let e of this.annotations)if(e.type==t)return e.value}get docChanged(){return!this.changes.empty}get reconfigured(){return this.startState.config!=this.state.config}isUserEvent(t){let e=this.annotation(lt.userEvent)
return!(!e||!(e==t||e.length>t.length&&e.slice(0,t.length)==t&&"."==e[t.length]))}}function ht(t,e){let i=[]
for(let n=0,s=0;;){let r,o
if(n<t.length&&(s==e.length||e[s]>=t[n]))r=t[n++],o=t[n++]
else{if(!(s<e.length))return i
r=e[s++],o=e[s++]}!i.length||i[i.length-1]<r?i.push(r,o):i[i.length-1]<o&&(i[i.length-1]=o)}}function ct(t,e,i){var n
let s,r,o
return i?(s=e.changes,r=k.empty(e.changes.length),o=t.changes.compose(e.changes)):(s=e.changes.map(t.changes),r=t.changes.mapDesc(e.changes,!0),o=t.changes.compose(s)),{changes:o,selection:e.selection?e.selection.map(r):null===(n=t.selection)||void 0===n?void 0:n.map(s),effects:at.mapEffects(t.effects,s).concat(at.mapEffects(e.effects,r)),annotations:t.annotations.length?t.annotations.concat(e.annotations):e.annotations,scrollIntoView:t.scrollIntoView||e.scrollIntoView}}function ut(t,e,i){let n=e.selection,s=pt(e.annotations)
return e.userEvent&&(s=s.concat(lt.userEvent.of(e.userEvent))),{changes:e.changes instanceof k?e.changes:k.of(e.changes||[],i,t.facet(J)),selection:n&&(n instanceof E?n:E.single(n.anchor,n.head)),effects:pt(e.effects),annotations:s,scrollIntoView:!!e.scrollIntoView}}function ft(t,e,i){let n=ut(t,e.length?e[0]:{},t.doc.length)
e.length&&!1===e[0].filter&&(i=!1)
for(let r=1;r<e.length;r++){!1===e[r].filter&&(i=!1)
let s=!!e[r].sequential
n=ct(n,ut(t,e[r],s?n.changes.newLength:t.doc.length),s)}let s=lt.create(t,n.changes,n.selection,n.effects,n.annotations,n.scrollIntoView)
return function(t){let e=t.startState,i=e.facet(it),n=t
for(let s=i.length-1;s>=0;s--){let r=i[s](t)
r&&Object.keys(r).length&&(n=ct(n,ut(e,r,t.changes.newLength),!0))}return n==t?t:lt.create(e,t.changes,t.selection,n.effects,n.annotations,n.scrollIntoView)}(i?function(t){let e=t.startState,i=!0
for(let s of e.facet(tt)){let e=s(t)
if(!1===e){i=!1
break}Array.isArray(e)&&(i=!0===i?e:ht(i,e))}if(!0!==i){let n,s
if(!1===i)s=t.changes.invertedDesc,n=k.empty(e.doc.length)
else{let e=t.changes.filter(i)
n=e.changes,s=e.filtered.mapDesc(e.changes).invertedDesc}t=lt.create(e,n,t.selection&&t.selection.map(s),at.mapEffects(t.effects,s),t.annotations,t.scrollIntoView)}let n=e.facet(et)
for(let s=n.length-1;s>=0;s--){let i=n[s](t)
t=i instanceof lt?i:Array.isArray(i)&&1==i.length&&i[0]instanceof lt?i[0]:ft(e,pt(i),!1)}return t}(s):s)}lt.time=st.define(),lt.userEvent=st.define(),lt.addToHistory=st.define(),lt.remote=st.define()
const dt=[]
function pt(t){return null==t?dt:Array.isArray(t)?t:[t]}var mt
e.CharCategory=void 0,(mt=e.CharCategory||(e.CharCategory={}))[mt.Word=0]="Word",mt[mt.Space=1]="Space",mt[mt.Other=2]="Other"
const gt=/[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/
let Ot
try{Ot=new RegExp("[\\p{Alphabetic}\\p{Number}_]","u")}catch(t){}class vt{constructor(t,e,i,n,s,r){this.config=t,this.doc=e,this.selection=i,this.values=n,this.status=t.statusTemplate.slice(),this.computeSlot=s,r&&(r._state=this)
for(let o=0;o<this.config.dynamicSlots.length;o++)G(this,o<<1)
this.computeSlot=null}field(t,e=!0){let i=this.config.address[t.id]
if(null!=i)return G(this,i),F(this,i)
if(e)throw new RangeError("Field is not present in this state")}update(...t){return ft(this,t,!0)}applyTransaction(t){let e,i=this.config,{base:n,compartments:s}=i
for(let r of t.effects)r.is(Y.reconfigure)?(i&&(s=new Map,i.compartments.forEach(((t,e)=>s.set(e,t))),i=null),s.set(r.value.compartment,r.value.extension)):r.is(at.reconfigure)?(i=null,n=r.value):r.is(at.appendConfig)&&(i=null,n=pt(n).concat(r.value))
i?e=t.startState.values.slice():(i=B.resolve(n,s,this),e=new vt(i,this.doc,this.selection,i.dynamicSlots.map((()=>null)),((t,e)=>e.reconfigure(t,this)),null).values),new vt(i,t.newDoc,t.newSelection,e,((e,i)=>i.update(e,t)),t)}replaceSelection(t){return"string"==typeof t&&(t=this.toText(t)),this.changeByRange((e=>({changes:{from:e.from,to:e.to,insert:t},range:E.cursor(e.from+t.length)})))}changeByRange(t){let e=this.selection,i=t(e.ranges[0]),n=this.changes(i.changes),s=[i.range],r=pt(i.effects)
for(let o=1;o<e.ranges.length;o++){let i=t(e.ranges[o]),a=this.changes(i.changes),l=a.map(n)
for(let t=0;t<o;t++)s[t]=s[t].map(l)
let h=n.mapDesc(a,!0)
s.push(i.range.map(h)),n=n.compose(l),r=at.mapEffects(r,l).concat(at.mapEffects(pt(i.effects),h))}return{changes:n,selection:E.create(s,e.mainIndex),effects:r}}changes(t=[]){return t instanceof k?t:k.of(t,this.doc.length,this.facet(vt.lineSeparator))}toText(t){return i.of(t.split(this.facet(vt.lineSeparator)||w))}sliceDoc(t=0,e=this.doc.length){return this.doc.sliceString(t,e,this.lineBreak)}facet(t){let e=this.config.address[t.id]
return null==e?t.default:(G(this,e),F(this,e))}toJSON(t){let e={doc:this.sliceDoc(),selection:this.selection.toJSON()}
if(t)for(let i in t){let n=t[i]
n instanceof L&&null!=this.config.address[n.id]&&(e[i]=n.spec.toJSON(this.field(t[i]),this))}return e}static fromJSON(t,e={},i){if(!t||"string"!=typeof t.doc)throw new RangeError("Invalid JSON representation for EditorState")
let n=[]
if(i)for(let s in i)if(Object.prototype.hasOwnProperty.call(t,s)){let e=i[s],r=t[s]
n.push(e.init((t=>e.spec.fromJSON(r,t))))}return vt.create({doc:t.doc,selection:E.fromJSON(t.selection),extensions:e.extensions?n.concat([e.extensions]):n})}static create(t={}){let e=B.resolve(t.extensions||[],new Map),n=t.doc instanceof i?t.doc:i.of((t.doc||"").split(e.staticFacet(vt.lineSeparator)||w)),s=t.selection?t.selection instanceof E?t.selection:E.single(t.selection.anchor,t.selection.head):E.single(0)
return M(s,n.length),e.staticFacet(K)||(s=s.asSingle()),new vt(e,n,s,e.dynamicSlots.map((()=>null)),((t,e)=>e.create(t)),null)}get tabSize(){return this.facet(vt.tabSize)}get lineBreak(){return this.facet(vt.lineSeparator)||"\n"}get readOnly(){return this.facet(nt)}phrase(t,...e){for(let i of this.facet(vt.phrases))if(Object.prototype.hasOwnProperty.call(i,t)){t=i[t]
break}return e.length&&(t=t.replace(/\$(\$|\d*)/g,((t,i)=>{if("$"==i)return"$"
let n=+(i||1)
return!n||n>e.length?t:e[n-1]}))),t}languageDataAt(t,e,i=-1){let n=[]
for(let s of this.facet(H))for(let r of s(this,e,i))Object.prototype.hasOwnProperty.call(r,t)&&n.push(r[t])
return n}charCategorizer(t){return i=this.languageDataAt("wordChars",t).join(""),t=>{if(!/\S/.test(t))return e.CharCategory.Space
if(function(t){if(Ot)return Ot.test(t)
for(let e=0;e<t.length;e++){let i=t[e]
if(/\w/.test(i)||i>""&&(i.toUpperCase()!=i.toLowerCase()||gt.test(i)))return!0}return!1}(t))return e.CharCategory.Word
for(let n=0;n<i.length;n++)if(t.indexOf(i[n])>-1)return e.CharCategory.Word
return e.CharCategory.Other}
var i}wordAt(t){let{text:i,from:n,length:s}=this.doc.lineAt(t),r=this.charCategorizer(t),o=t-n,a=t-n
for(;o>0;){let t=p(i,o,!1)
if(r(i.slice(t,o))!=e.CharCategory.Word)break
o=t}for(;a<s;){let t=p(i,a)
if(r(i.slice(a,t))!=e.CharCategory.Word)break
a=t}return o==a?null:E.range(o+n,a+n)}}vt.allowMultipleSelections=K,vt.tabSize=W.define({combine:t=>t.length?t[0]:4}),vt.lineSeparator=J,vt.readOnly=nt,vt.phrases=W.define({compare(t,e){let i=Object.keys(t),n=Object.keys(e)
return i.length==n.length&&i.every((i=>t[i]==e[i]))}}),vt.languageData=H,vt.changeFilter=tt,vt.transactionFilter=et,vt.transactionExtender=it,Y.reconfigure=at.define()
class yt{eq(t){return this==t}range(t,e=t){return bt.create(t,e,this)}}yt.prototype.startSide=yt.prototype.endSide=0,yt.prototype.point=!1,yt.prototype.mapMode=e.MapMode.TrackDel
class bt{constructor(t,e,i){this.from=t,this.to=e,this.value=i}static create(t,e,i){return new bt(t,e,i)}}function wt(t,e){return t.from-e.from||t.value.startSide-e.value.startSide}class xt{constructor(t,e,i,n){this.from=t,this.to=e,this.value=i,this.maxPoint=n}get length(){return this.to[this.to.length-1]}findIndex(t,e,i,n=0){let s=i?this.to:this.from
for(let r=n,o=s.length;;){if(r==o)return r
let n=r+o>>1,a=s[n]-t||(i?this.value[n].endSide:this.value[n].startSide)-e
if(n==r)return a>=0?r:o
a>=0?o=n:r=n+1}}between(t,e,i,n){for(let s=this.findIndex(e,-1e9,!0),r=this.findIndex(i,1e9,!1,s);s<r;s++)if(!1===n(this.from[s]+t,this.to[s]+t,this.value[s]))return!1}map(t,e){let i=[],n=[],s=[],r=-1,o=-1
for(let a=0;a<this.value.length;a++){let l,h,c=this.value[a],u=this.from[a]+t,f=this.to[a]+t
if(u==f){let t=e.mapPos(u,c.startSide,c.mapMode)
if(null==t)continue
if(l=h=t,c.startSide!=c.endSide&&(h=e.mapPos(u,c.endSide),h<l))continue}else if(l=e.mapPos(u,c.startSide),h=e.mapPos(f,c.endSide),l>h||l==h&&c.startSide>0&&c.endSide<=0)continue;(h-l||c.endSide-c.startSide)<0||(r<0&&(r=l),c.point&&(o=Math.max(o,h-l)),i.push(c),n.push(l-r),s.push(h-r))}return{mapped:i.length?new xt(n,s,i,o):null,pos:r}}}class St{constructor(t,e,i,n){this.chunkPos=t,this.chunk=e,this.nextLayer=i,this.maxPoint=n}static create(t,e,i,n){return new St(t,e,i,n)}get length(){let t=this.chunk.length-1
return t<0?0:Math.max(this.chunkEnd(t),this.nextLayer.length)}get size(){if(this.isEmpty)return 0
let t=this.nextLayer.size
for(let e of this.chunk)t+=e.value.length
return t}chunkEnd(t){return this.chunkPos[t]+this.chunk[t].length}update(t){let{add:e=[],sort:i=!1,filterFrom:n=0,filterTo:s=this.length}=t,r=t.filter
if(0==e.length&&!r)return this
if(i&&(e=e.slice().sort(wt)),this.isEmpty)return e.length?St.of(e):this
let o=new Pt(this,null,-1).goto(0),a=0,l=[],h=new kt
for(;o.value||a<e.length;)if(a<e.length&&(o.from-e[a].from||o.startSide-e[a].value.startSide)>=0){let t=e[a++]
h.addInner(t.from,t.to,t.value)||l.push(t)}else 1==o.rangeIndex&&o.chunkIndex<this.chunk.length&&(a==e.length||this.chunkEnd(o.chunkIndex)<e[a].from)&&(!r||n>this.chunkEnd(o.chunkIndex)||s<this.chunkPos[o.chunkIndex])&&h.addChunk(this.chunkPos[o.chunkIndex],this.chunk[o.chunkIndex])?o.nextChunk():((!r||n>o.to||s<o.from||r(o.from,o.to,o.value))&&(h.addInner(o.from,o.to,o.value)||l.push(bt.create(o.from,o.to,o.value))),o.next())
return h.finishInner(this.nextLayer.isEmpty&&!l.length?St.empty:this.nextLayer.update({add:l,filter:r,filterFrom:n,filterTo:s}))}map(t){if(t.empty||this.isEmpty)return this
let e=[],i=[],n=-1
for(let r=0;r<this.chunk.length;r++){let s=this.chunkPos[r],o=this.chunk[r],a=t.touchesRange(s,s+o.length)
if(!1===a)n=Math.max(n,o.maxPoint),e.push(o),i.push(t.mapPos(s))
else if(!0===a){let{mapped:r,pos:a}=o.map(s,t)
r&&(n=Math.max(n,r.maxPoint),e.push(r),i.push(a))}}let s=this.nextLayer.map(t)
return 0==e.length?s:new St(i,e,s||St.empty,n)}between(t,e,i){if(!this.isEmpty){for(let n=0;n<this.chunk.length;n++){let s=this.chunkPos[n],r=this.chunk[n]
if(e>=s&&t<=s+r.length&&!1===r.between(s,t-s,e-s,i))return}this.nextLayer.between(t,e,i)}}iter(t=0){return Tt.from([this]).goto(t)}get isEmpty(){return this.nextLayer==this}static iter(t,e=0){return Tt.from(t).goto(e)}static compare(t,e,i,n,s=-1){let r=t.filter((t=>t.maxPoint>0||!t.isEmpty&&t.maxPoint>=s)),o=e.filter((t=>t.maxPoint>0||!t.isEmpty&&t.maxPoint>=s)),a=Qt(r,o,i),l=new At(r,a,s),h=new At(o,a,s)
i.iterGaps(((t,e,i)=>_t(l,t,h,e,i,n))),i.empty&&0==i.length&&_t(l,0,h,0,0,n)}static eq(t,e,i=0,n){null==n&&(n=999999999)
let s=t.filter((t=>!t.isEmpty&&e.indexOf(t)<0)),r=e.filter((e=>!e.isEmpty&&t.indexOf(e)<0))
if(s.length!=r.length)return!1
if(!s.length)return!0
let o=Qt(s,r),a=new At(s,o,0).goto(i),l=new At(r,o,0).goto(i)
for(;;){if(a.to!=l.to||!Ct(a.active,l.active)||a.point&&(!l.point||!a.point.eq(l.point)))return!1
if(a.to>n)return!0
a.next(),l.next()}}static spans(t,e,i,n,s=-1){let r=new At(t,null,s).goto(e),o=e,a=r.openStart
for(;;){let t=Math.min(r.to,i)
if(r.point){let i=r.activeForPoint(r.to),s=r.pointFrom<e?i.length+1:Math.min(i.length,a)
n.point(o,t,r.point,i,s,r.pointRank),a=Math.min(r.openEnd(t),i.length)}else t>o&&(n.span(o,t,r.active,a),a=r.openEnd(t))
if(r.to>i)return a+(r.point&&r.to>i?1:0)
o=r.to,r.next()}}static of(t,e=!1){let i=new kt
for(let n of t instanceof bt?[t]:e?function(t){if(t.length>1)for(let e=t[0],i=1;i<t.length;i++){let n=t[i]
if(wt(e,n)>0)return t.slice().sort(wt)
e=n}return t}(t):t)i.add(n.from,n.to,n.value)
return i.finish()}}St.empty=new St([],[],null,-1),St.empty.nextLayer=St.empty
class kt{constructor(){this.chunks=[],this.chunkPos=[],this.chunkStart=-1,this.last=null,this.lastFrom=-1e9,this.lastTo=-1e9,this.from=[],this.to=[],this.value=[],this.maxPoint=-1,this.setMaxPoint=-1,this.nextLayer=null}finishChunk(t){this.chunks.push(new xt(this.from,this.to,this.value,this.maxPoint)),this.chunkPos.push(this.chunkStart),this.chunkStart=-1,this.setMaxPoint=Math.max(this.setMaxPoint,this.maxPoint),this.maxPoint=-1,t&&(this.from=[],this.to=[],this.value=[])}add(t,e,i){this.addInner(t,e,i)||(this.nextLayer||(this.nextLayer=new kt)).add(t,e,i)}addInner(t,e,i){let n=t-this.lastTo||i.startSide-this.last.endSide
if(n<=0&&(t-this.lastFrom||i.startSide-this.last.startSide)<0)throw new Error("Ranges must be added sorted by `from` position and `startSide`")
return!(n<0||(250==this.from.length&&this.finishChunk(!0),this.chunkStart<0&&(this.chunkStart=t),this.from.push(t-this.chunkStart),this.to.push(e-this.chunkStart),this.last=i,this.lastFrom=t,this.lastTo=e,this.value.push(i),i.point&&(this.maxPoint=Math.max(this.maxPoint,e-t)),0))}addChunk(t,e){if((t-this.lastTo||e.value[0].startSide-this.last.endSide)<0)return!1
this.from.length&&this.finishChunk(!0),this.setMaxPoint=Math.max(this.setMaxPoint,e.maxPoint),this.chunks.push(e),this.chunkPos.push(t)
let i=e.value.length-1
return this.last=e.value[i],this.lastFrom=e.from[i]+t,this.lastTo=e.to[i]+t,!0}finish(){return this.finishInner(St.empty)}finishInner(t){if(this.from.length&&this.finishChunk(!1),0==this.chunks.length)return t
let e=St.create(this.chunkPos,this.chunks,this.nextLayer?this.nextLayer.finishInner(t):t,this.setMaxPoint)
return this.from=null,e}}function Qt(t,e,i){let n=new Map
for(let r of t)for(let t=0;t<r.chunk.length;t++)r.chunk[t].maxPoint<=0&&n.set(r.chunk[t],r.chunkPos[t])
let s=new Set
for(let r of e)for(let t=0;t<r.chunk.length;t++){let e=n.get(r.chunk[t])
null==e||(i?i.mapPos(e):e)!=r.chunkPos[t]||(null==i?void 0:i.touchesRange(e,e+r.chunk[t].length))||s.add(r.chunk[t])}return s}class Pt{constructor(t,e,i,n=0){this.layer=t,this.skip=e,this.minPoint=i,this.rank=n}get startSide(){return this.value?this.value.startSide:0}get endSide(){return this.value?this.value.endSide:0}goto(t,e=-1e9){return this.chunkIndex=this.rangeIndex=0,this.gotoInner(t,e,!1),this}gotoInner(t,e,i){for(;this.chunkIndex<this.layer.chunk.length;){let e=this.layer.chunk[this.chunkIndex]
if(!(this.skip&&this.skip.has(e)||this.layer.chunkEnd(this.chunkIndex)<t||e.maxPoint<this.minPoint))break
this.chunkIndex++,i=!1}if(this.chunkIndex<this.layer.chunk.length){let n=this.layer.chunk[this.chunkIndex].findIndex(t-this.layer.chunkPos[this.chunkIndex],e,!0);(!i||this.rangeIndex<n)&&this.setRangeIndex(n)}this.next()}forward(t,e){(this.to-t||this.endSide-e)<0&&this.gotoInner(t,e,!0)}next(){for(;;){if(this.chunkIndex==this.layer.chunk.length){this.from=this.to=1e9,this.value=null
break}{let t=this.layer.chunkPos[this.chunkIndex],e=this.layer.chunk[this.chunkIndex],i=t+e.from[this.rangeIndex]
if(this.from=i,this.to=t+e.to[this.rangeIndex],this.value=e.value[this.rangeIndex],this.setRangeIndex(this.rangeIndex+1),this.minPoint<0||this.value.point&&this.to-this.from>=this.minPoint)break}}}setRangeIndex(t){if(t==this.layer.chunk[this.chunkIndex].value.length){if(this.chunkIndex++,this.skip)for(;this.chunkIndex<this.layer.chunk.length&&this.skip.has(this.layer.chunk[this.chunkIndex]);)this.chunkIndex++
this.rangeIndex=0}else this.rangeIndex=t}nextChunk(){this.chunkIndex++,this.rangeIndex=0,this.next()}compare(t){return this.from-t.from||this.startSide-t.startSide||this.rank-t.rank||this.to-t.to||this.endSide-t.endSide}}class Tt{constructor(t){this.heap=t}static from(t,e=null,i=-1){let n=[]
for(let s=0;s<t.length;s++)for(let r=t[s];!r.isEmpty;r=r.nextLayer)r.maxPoint>=i&&n.push(new Pt(r,e,i,s))
return 1==n.length?n[0]:new Tt(n)}get startSide(){return this.value?this.value.startSide:0}goto(t,e=-1e9){for(let i of this.heap)i.goto(t,e)
for(let i=this.heap.length>>1;i>=0;i--)$t(this.heap,i)
return this.next(),this}forward(t,e){for(let i of this.heap)i.forward(t,e)
for(let i=this.heap.length>>1;i>=0;i--)$t(this.heap,i);(this.to-t||this.value.endSide-e)<0&&this.next()}next(){if(0==this.heap.length)this.from=this.to=1e9,this.value=null,this.rank=-1
else{let t=this.heap[0]
this.from=t.from,this.to=t.to,this.value=t.value,this.rank=t.rank,t.value&&t.next(),$t(this.heap,0)}}}function $t(t,e){for(let i=t[e];;){let n=1+(e<<1)
if(n>=t.length)break
let s=t[n]
if(n+1<t.length&&s.compare(t[n+1])>=0&&(s=t[n+1],n++),i.compare(s)<0)break
t[n]=i,t[e]=s,e=n}}class At{constructor(t,e,i){this.minPoint=i,this.active=[],this.activeTo=[],this.activeRank=[],this.minActive=-1,this.point=null,this.pointFrom=0,this.pointRank=0,this.to=-1e9,this.endSide=0,this.openStart=-1,this.cursor=Tt.from(t,e,i)}goto(t,e=-1e9){return this.cursor.goto(t,e),this.active.length=this.activeTo.length=this.activeRank.length=0,this.minActive=-1,this.to=t,this.endSide=e,this.openStart=-1,this.next(),this}forward(t,e){for(;this.minActive>-1&&(this.activeTo[this.minActive]-t||this.active[this.minActive].endSide-e)<0;)this.removeActive(this.minActive)
this.cursor.forward(t,e)}removeActive(t){Et(this.active,t),Et(this.activeTo,t),Et(this.activeRank,t),this.minActive=It(this.active,this.activeTo)}addActive(t){let e=0,{value:i,to:n,rank:s}=this.cursor
for(;e<this.activeRank.length&&this.activeRank[e]<=s;)e++
Mt(this.active,e,i),Mt(this.activeTo,e,n),Mt(this.activeRank,e,s),t&&Mt(t,e,this.cursor.from),this.minActive=It(this.active,this.activeTo)}next(){let t=this.to,e=this.point
this.point=null
let i=this.openStart<0?[]:null
for(;;){let n=this.minActive
if(n>-1&&(this.activeTo[n]-this.cursor.from||this.active[n].endSide-this.cursor.startSide)<0){if(this.activeTo[n]>t){this.to=this.activeTo[n],this.endSide=this.active[n].endSide
break}this.removeActive(n),i&&Et(i,n)}else{if(!this.cursor.value){this.to=this.endSide=1e9
break}if(this.cursor.from>t){this.to=this.cursor.from,this.endSide=this.cursor.startSide
break}{let t=this.cursor.value
if(t.point){if(!(e&&this.cursor.to==this.to&&this.cursor.from<this.cursor.to)){this.point=t,this.pointFrom=this.cursor.from,this.pointRank=this.cursor.rank,this.to=this.cursor.to,this.endSide=t.endSide,this.cursor.next(),this.forward(this.to,this.endSide)
break}this.cursor.next()}else this.addActive(i),this.cursor.next()}}}if(i){this.openStart=0
for(let e=i.length-1;e>=0&&i[e]<t;e--)this.openStart++}}activeForPoint(t){if(!this.active.length)return this.active
let e=[]
for(let i=this.active.length-1;i>=0&&!(this.activeRank[i]<this.pointRank);i--)(this.activeTo[i]>t||this.activeTo[i]==t&&this.active[i].endSide>=this.point.endSide)&&e.push(this.active[i])
return e.reverse()}openEnd(t){let e=0
for(let i=this.activeTo.length-1;i>=0&&this.activeTo[i]>t;i--)e++
return e}}function _t(t,e,i,n,s,r){t.goto(e),i.goto(n)
let o=n+s,a=n,l=n-e
for(;;){let e=t.to+l-i.to||t.endSide-i.endSide,n=e<0?t.to+l:i.to,s=Math.min(n,o)
if(t.point||i.point?t.point&&i.point&&(t.point==i.point||t.point.eq(i.point))&&Ct(t.activeForPoint(t.to+l),i.activeForPoint(i.to))||r.comparePoint(a,s,t.point,i.point):s>a&&!Ct(t.active,i.active)&&r.compareRange(a,s,t.active,i.active),n>o)break
a=n,e<=0&&t.next(),e>=0&&i.next()}}function Ct(t,e){if(t.length!=e.length)return!1
for(let i=0;i<t.length;i++)if(t[i]!=e[i]&&!t[i].eq(e[i]))return!1
return!0}function Et(t,e){for(let i=e,n=t.length-1;i<n;i++)t[i]=t[i+1]
t.pop()}function Mt(t,e,i){for(let n=t.length-1;n>=e;n--)t[n+1]=t[n]
t[e]=i}function It(t,e){let i=-1,n=1e9
for(let s=0;s<e.length;s++)(e[s]-n||t[s].endSide-t[i].endSide)<0&&(i=s,n=e[s])
return i}e.Annotation=st,e.AnnotationType=rt,e.ChangeDesc=S,e.ChangeSet=k,e.Compartment=Y,e.EditorSelection=E,e.EditorState=vt,e.Facet=W,e.Line=c,e.Prec=U,e.Range=bt,e.RangeSet=St,e.RangeSetBuilder=kt,e.RangeValue=yt,e.SelectionRange=C,e.StateEffect=at,e.StateEffectType=ot,e.StateField=L,e.Text=i,e.Transaction=lt,e.codePointAt=y,e.codePointSize=b,e.combineConfig=function(t,e,i={}){let n={}
for(let s of t)for(let t of Object.keys(s)){let e=s[t],r=n[t]
if(void 0===r)n[t]=e
else if(r===e||void 0===e);else{if(!Object.hasOwnProperty.call(i,t))throw new Error("Config merge conflict for field "+t)
n[t]=i[t](r,e)}}for(let s in e)void 0===n[s]&&(n[s]=e[s])
return n},e.countColumn=function(t,e,i=t.length){let n=0
for(let s=0;s<i;)9==t.charCodeAt(s)?(n+=e-n%e,s++):(n++,s=p(t,s))
return n},e.findClusterBreak=p,e.findColumn=function(t,e,i,n){for(let s=0,r=0;;){if(r>=e)return s
if(s==t.length)break
r+=9==t.charCodeAt(s)?i-r%i:1,s=p(t,s)}return!0===n?-1:t.length},e.fromCodePoint=function(t){return t<=65535?String.fromCharCode(t):(t-=65536,String.fromCharCode(55296+(t>>10),56320+(1023&t)))}},642:(t,e,i)=>{"use strict"
Object.defineProperty(e,"__esModule",{value:!0})
var n=i(40),s=i(223),r=i(691)
function o(t){let e
return e=11==t.nodeType?t.getSelection?t:t.ownerDocument:t,e.getSelection()}function a(t,e){return!!e&&(t==e||t.contains(1!=e.nodeType?e.parentNode:e))}function l(t,e){if(!e.anchorNode)return!1
try{return a(t,e.anchorNode)}catch(t){return!1}}function h(t){return 3==t.nodeType?w(t,0,t.nodeValue.length).getClientRects():1==t.nodeType?t.getClientRects():[]}function c(t,e,i,n){return!!i&&(f(t,e,i,n,-1)||f(t,e,i,n,1))}function u(t){for(var e=0;;e++)if(!(t=t.previousSibling))return e}function f(t,e,i,n,s){for(;;){if(t==i&&e==n)return!0
if(e==(s<0?0:d(t))){if("DIV"==t.nodeName)return!1
let i=t.parentNode
if(!i||1!=i.nodeType)return!1
e=u(t)+(s<0?0:1),t=i}else{if(1!=t.nodeType)return!1
if(1==(t=t.childNodes[e+(s<0?-1:0)]).nodeType&&"false"==t.contentEditable)return!1
e=s<0?d(t):0}}}function d(t){return 3==t.nodeType?t.nodeValue.length:t.childNodes.length}const p={left:0,right:0,top:0,bottom:0}
function m(t,e){let i=e?t.left:t.right
return{left:i,right:i,top:t.top,bottom:t.bottom}}function g(t){return{left:0,right:t.innerWidth,top:0,bottom:t.innerHeight}}class O{constructor(){this.anchorNode=null,this.anchorOffset=0,this.focusNode=null,this.focusOffset=0}eq(t){return this.anchorNode==t.anchorNode&&this.anchorOffset==t.anchorOffset&&this.focusNode==t.focusNode&&this.focusOffset==t.focusOffset}setRange(t){this.set(t.anchorNode,t.anchorOffset,t.focusNode,t.focusOffset)}set(t,e,i,n){this.anchorNode=t,this.anchorOffset=e,this.focusNode=i,this.focusOffset=n}}let v,y=null
function b(t){if(t.setActive)return t.setActive()
if(y)return t.focus(y)
let e=[]
for(let i=t;i&&(e.push(i,i.scrollTop,i.scrollLeft),i!=i.ownerDocument);i=i.parentNode);if(t.focus(null==y?{get preventScroll(){return y={preventScroll:!0},!0}}:void 0),!y){y=!1
for(let t=0;t<e.length;){let i=e[t++],n=e[t++],s=e[t++]
i.scrollTop!=n&&(i.scrollTop=n),i.scrollLeft!=s&&(i.scrollLeft=s)}}}function w(t,e,i=e){let n=v||(v=document.createRange())
return n.setEnd(t,i),n.setStart(t,e),n}function x(t,e,i){let n={key:e,code:e,keyCode:i,which:i,cancelable:!0},s=new KeyboardEvent("keydown",n)
s.synthetic=!0,t.dispatchEvent(s)
let r=new KeyboardEvent("keyup",n)
return r.synthetic=!0,t.dispatchEvent(r),s.defaultPrevented||r.defaultPrevented}function S(t){for(;t.attributes.length;)t.removeAttributeNode(t.attributes[0])}class k{constructor(t,e,i=!0){this.node=t,this.offset=e,this.precise=i}static before(t,e){return new k(t.parentNode,u(t),e)}static after(t,e){return new k(t.parentNode,u(t)+1,e)}}const Q=[]
class P{constructor(){this.parent=null,this.dom=null,this.dirty=2}get editorView(){if(!this.parent)throw new Error("Accessing view in orphan content view")
return this.parent.editorView}get overrideDOMText(){return null}get posAtStart(){return this.parent?this.parent.posBefore(this):0}get posAtEnd(){return this.posAtStart+this.length}posBefore(t){let e=this.posAtStart
for(let i of this.children){if(i==t)return e
e+=i.length+i.breakAfter}throw new RangeError("Invalid child in posBefore")}posAfter(t){return this.posBefore(t)+t.length}coordsAt(t,e){return null}sync(t){if(2&this.dirty){let e,i=this.dom,n=null
for(let s of this.children){if(s.dirty){if(!s.dom&&(e=n?n.nextSibling:i.firstChild)){let t=P.get(e);(!t||!t.parent&&t.canReuseDOM(s))&&s.reuseDOM(e)}s.sync(t),s.dirty=0}if(e=n?n.nextSibling:i.firstChild,t&&!t.written&&t.node==i&&e!=s.dom&&(t.written=!0),s.dom.parentNode==i)for(;e&&e!=s.dom;)e=T(e)
else i.insertBefore(s.dom,e)
n=s.dom}for(e=n?n.nextSibling:i.firstChild,e&&t&&t.node==i&&(t.written=!0);e;)e=T(e)}else if(1&this.dirty)for(let e of this.children)e.dirty&&(e.sync(t),e.dirty=0)}reuseDOM(t){}localPosFromDOM(t,e){let i
if(t==this.dom)i=this.dom.childNodes[e]
else{let n=0==d(t)?0:0==e?-1:1
for(;;){let e=t.parentNode
if(e==this.dom)break
0==n&&e.firstChild!=e.lastChild&&(n=t==e.firstChild?-1:1),t=e}i=n<0?t:t.nextSibling}if(i==this.dom.firstChild)return 0
for(;i&&!P.get(i);)i=i.nextSibling
if(!i)return this.length
for(let n=0,s=0;;n++){let t=this.children[n]
if(t.dom==i)return s
s+=t.length+t.breakAfter}}domBoundsAround(t,e,i=0){let n=-1,s=-1,r=-1,o=-1
for(let a=0,l=i,h=i;a<this.children.length;a++){let i=this.children[a],c=l+i.length
if(l<t&&c>e)return i.domBoundsAround(t,e,l)
if(c>=t&&-1==n&&(n=a,s=l),l>e&&i.dom.parentNode==this.dom){r=a,o=h
break}h=c,l=c+i.breakAfter}return{from:s,to:o<0?i+this.length:o,startDOM:(n?this.children[n-1].dom.nextSibling:null)||this.dom.firstChild,endDOM:r<this.children.length&&r>=0?this.children[r].dom:null}}markDirty(t=!1){this.dirty|=2,this.markParentsDirty(t)}markParentsDirty(t){for(let e=this.parent;e;e=e.parent){if(t&&(e.dirty|=2),1&e.dirty)return
e.dirty|=1,t=!1}}setParent(t){this.parent!=t&&(this.parent=t,this.dirty&&this.markParentsDirty(!0))}setDOM(t){this.dom&&(this.dom.cmView=null),this.dom=t,t.cmView=this}get rootView(){for(let t=this;;){let e=t.parent
if(!e)return t
t=e}}replaceChildren(t,e,i=Q){this.markDirty()
for(let n=t;n<e;n++){let t=this.children[n]
t.parent==this&&t.destroy()}this.children.splice(t,e-t,...i)
for(let n=0;n<i.length;n++)i[n].setParent(this)}ignoreMutation(t){return!1}ignoreEvent(t){return!1}childCursor(t=this.length){return new $(this.children,t,this.children.length)}childPos(t,e=1){return this.childCursor().findPos(t,e)}toString(){let t=this.constructor.name.replace("View","")
return t+(this.children.length?"("+this.children.join()+")":this.length?"["+("Text"==t?this.text:this.length)+"]":"")+(this.breakAfter?"#":"")}static get(t){return t.cmView}get isEditable(){return!0}merge(t,e,i,n,s,r){return!1}become(t){return!1}canReuseDOM(t){return t.constructor==this.constructor}getSide(){return 0}destroy(){this.parent=null}}function T(t){let e=t.nextSibling
return t.parentNode.removeChild(t),e}P.prototype.breakAfter=0
class ${constructor(t,e,i){this.children=t,this.pos=e,this.i=i,this.off=0}findPos(t,e=1){for(;;){if(t>this.pos||t==this.pos&&(e>0||0==this.i||this.children[this.i-1].breakAfter))return this.off=t-this.pos,this
let i=this.children[--this.i]
this.pos-=i.length+i.breakAfter}}}function A(t,e,i,n,s,r,o,a,l){let{children:h}=t,c=h.length?h[e]:null,u=r.length?r[r.length-1]:null,f=u?u.breakAfter:o
if(!(e==n&&c&&!o&&!f&&r.length<2&&c.merge(i,s,r.length?u:null,0==i,a,l))){if(n<h.length){let t=h[n]
t&&s<t.length?(e==n&&(t=t.split(s),s=0),!f&&u&&t.merge(0,s,u,!0,0,l)?r[r.length-1]=t:(s&&t.merge(0,s,null,!1,0,l),r.push(t))):(null==t?void 0:t.breakAfter)&&(u?u.breakAfter=1:o=1),n++}for(c&&(c.breakAfter=o,i>0&&(!o&&r.length&&c.merge(i,c.length,r[0],!1,a,0)?c.breakAfter=r.shift().breakAfter:(i<c.length||c.children.length&&0==c.children[c.children.length-1].length)&&c.merge(i,c.length,null,!1,a,0),e++));e<n&&r.length;)if(h[n-1].become(r[r.length-1]))n--,r.pop(),l=r.length?0:a
else{if(!h[e].become(r[0]))break
e++,r.shift(),a=r.length?0:l}!r.length&&e&&n<h.length&&!h[e-1].breakAfter&&h[n].merge(0,0,h[e-1],!1,a,l)&&e--,(e<n||r.length)&&t.replaceChildren(e,n,r)}}function _(t,e,i,n,s,r){let o=t.childCursor(),{i:a,off:l}=o.findPos(i,1),{i:h,off:c}=o.findPos(e,-1),u=e-i
for(let f of n)u+=f.length
t.length+=u,A(t,h,c,a,l,n,0,s,r)}let C="undefined"!=typeof navigator?navigator:{userAgent:"",vendor:"",platform:""},E="undefined"!=typeof document?document:{documentElement:{style:{}}}
const M=/Edge\/(\d+)/.exec(C.userAgent),I=/MSIE \d/.test(C.userAgent),W=/Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(C.userAgent),R=!!(I||W||M),Z=!R&&/gecko\/(\d+)/i.test(C.userAgent),D=!R&&/Chrome\/(\d+)/.exec(C.userAgent),V="webkitFontSmoothing"in E.documentElement.style,X=!R&&/Apple Computer/.test(C.vendor),j=X&&(/Mobile\/\w+/.test(C.userAgent)||C.maxTouchPoints>2)
var L,N={mac:j||/Mac/.test(C.platform),windows:/Win/.test(C.platform),linux:/Linux|X11/.test(C.platform),ie:R,ie_version:I?E.documentMode||6:W?+W[1]:M?+M[1]:0,gecko:Z,gecko_version:Z?+(/Firefox\/(\d+)/.exec(C.userAgent)||[0,0])[1]:0,chrome:!!D,chrome_version:D?+D[1]:0,ios:j,android:/Android\b/.test(C.userAgent),webkit:V,safari:X,webkit_version:V?+(/\bAppleWebKit\/(\d+)/.exec(navigator.userAgent)||[0,0])[1]:0,tabSize:null!=E.documentElement.style.tabSize?"tab-size":"-moz-tab-size"}
class U extends P{constructor(t){super(),this.text=t}get length(){return this.text.length}createDOM(t){this.setDOM(t||document.createTextNode(this.text))}sync(t){this.dom||this.createDOM(),this.dom.nodeValue!=this.text&&(t&&t.node==this.dom&&(t.written=!0),this.dom.nodeValue=this.text)}reuseDOM(t){3==t.nodeType&&this.createDOM(t)}merge(t,e,i){return(!i||i instanceof U&&!(this.length-(e-t)+i.length>256))&&(this.text=this.text.slice(0,t)+(i?i.text:"")+this.text.slice(e),this.markDirty(),!0)}split(t){let e=new U(this.text.slice(t))
return this.text=this.text.slice(0,t),this.markDirty(),e}localPosFromDOM(t,e){return t==this.dom?e:e?this.text.length:0}domAtPos(t){return new k(this.dom,t)}domBoundsAround(t,e,i){return{from:i,to:i+this.length,startDOM:this.dom,endDOM:this.dom.nextSibling}}coordsAt(t,e){return Y(this.dom,t,e)}}class q extends P{constructor(t,e=[],i=0){super(),this.mark=t,this.children=e,this.length=i
for(let n of e)n.setParent(this)}setAttrs(t){if(S(t),this.mark.class&&(t.className=this.mark.class),this.mark.attrs)for(let e in this.mark.attrs)t.setAttribute(e,this.mark.attrs[e])
return t}reuseDOM(t){t.nodeName==this.mark.tagName.toUpperCase()&&(this.setDOM(t),this.dirty|=6)}sync(t){this.dom?4&this.dirty&&this.setAttrs(this.dom):this.setDOM(this.setAttrs(document.createElement(this.mark.tagName))),super.sync(t)}merge(t,e,i,n,s,r){return!(i&&(!(i instanceof q&&i.mark.eq(this.mark))||t&&s<=0||e<this.length&&r<=0)||(_(this,t,e,i?i.children:[],s-1,r-1),this.markDirty(),0))}split(t){let e=[],i=0,n=-1,s=0
for(let o of this.children){let r=i+o.length
r>t&&e.push(i<t?o.split(t-i):o),n<0&&i>=t&&(n=s),i=r,s++}let r=this.length-t
return this.length=t,n>-1&&(this.children.length=n,this.markDirty()),new q(this.mark,e,r)}domAtPos(t){return K(this,t)}coordsAt(t,e){return tt(this,t,e)}}function Y(t,e,i){let n=t.nodeValue.length
e>n&&(e=n)
let s=e,r=e,o=0
0==e&&i<0||e==n&&i>=0?N.chrome||N.gecko||(e?(s--,o=1):r<n&&(r++,o=-1)):i<0?s--:r<n&&r++
let a=w(t,s,r).getClientRects()
if(!a.length)return p
let l=a[(o?o<0:i>=0)?0:a.length-1]
return N.safari&&!o&&0==l.width&&(l=Array.prototype.find.call(a,(t=>t.width))||l),o?m(l,o<0):l||null}class z extends P{constructor(t,e,i){super(),this.widget=t,this.length=e,this.side=i,this.prevWidget=null}static create(t,e,i){return new(t.customView||z)(t,e,i)}split(t){let e=z.create(this.widget,this.length-t,this.side)
return this.length-=t,e}sync(){this.dom&&this.widget.updateDOM(this.dom)||(this.dom&&this.prevWidget&&this.prevWidget.destroy(this.dom),this.prevWidget=null,this.setDOM(this.widget.toDOM(this.editorView)),this.dom.contentEditable="false")}getSide(){return this.side}merge(t,e,i,n,s,r){return!(i&&(!(i instanceof z&&this.widget.compare(i.widget))||t>0&&s<=0||e<this.length&&r<=0)||(this.length=t+(i?i.length:0)+(this.length-e),0))}become(t){return t.length==this.length&&t instanceof z&&t.side==this.side&&this.widget.constructor==t.widget.constructor&&(this.widget.eq(t.widget)||this.markDirty(!0),this.dom&&!this.prevWidget&&(this.prevWidget=this.widget),this.widget=t.widget,!0)}ignoreMutation(){return!0}ignoreEvent(t){return this.widget.ignoreEvent(t)}get overrideDOMText(){if(0==this.length)return n.Text.empty
let t=this
for(;t.parent;)t=t.parent
let e=t.editorView,i=e&&e.state.doc,s=this.posAtStart
return i?i.slice(s,s+this.length):n.Text.empty}domAtPos(t){return 0==t?k.before(this.dom):k.after(this.dom,t==this.length)}domBoundsAround(){return null}coordsAt(t,e){let i=this.dom.getClientRects(),n=null
if(!i.length)return p
for(let s=t>0?i.length-1:0;n=i[s],!(t>0?0==s:s==i.length-1||n.top<n.bottom);s+=t>0?-1:1);return this.length?n:m(n,this.side>0)}get isEditable(){return!1}destroy(){super.destroy(),this.dom&&this.widget.destroy(this.dom)}}class B extends z{domAtPos(t){let{topView:e,text:i}=this.widget
return e?G(t,0,e,i,((t,e)=>t.domAtPos(e)),(t=>new k(i,Math.min(t,i.nodeValue.length)))):new k(i,Math.min(t,i.nodeValue.length))}sync(){this.setDOM(this.widget.toDOM())}localPosFromDOM(t,e){let{topView:i,text:n}=this.widget
return i?F(t,e,i,n):Math.min(e,this.length)}ignoreMutation(){return!1}get overrideDOMText(){return null}coordsAt(t,e){let{topView:i,text:n}=this.widget
return i?G(t,e,i,n,((t,e,i)=>t.coordsAt(e,i)),((t,e)=>Y(n,t,e))):Y(n,t,e)}destroy(){var t
super.destroy(),null===(t=this.widget.topView)||void 0===t||t.destroy()}get isEditable(){return!0}canReuseDOM(){return!0}}function G(t,e,i,n,s,r){if(i instanceof q){for(let o=i.dom.firstChild;o;o=o.nextSibling){let i=P.get(o)
if(!i)return r(t,e)
let l=a(o,n),h=i.length+(l?n.nodeValue.length:0)
if(t<h||t==h&&i.getSide()<=0)return l?G(t,e,i,n,s,r):s(i,t,e)
t-=h}return s(i,i.length,-1)}return i.dom==n?r(t,e):s(i,t,e)}function F(t,e,i,n){if(i instanceof q)for(let s of i.children){let i=0,r=a(s.dom,n)
if(a(s.dom,t))return i+(r?F(t,e,s,n):s.localPosFromDOM(t,e))
i+=r?n.nodeValue.length:s.length}else if(i.dom==n)return Math.min(e,n.nodeValue.length)
return i.localPosFromDOM(t,e)}class H extends P{constructor(t){super(),this.side=t}get length(){return 0}merge(){return!1}become(t){return t instanceof H&&t.side==this.side}split(){return new H(this.side)}sync(){if(!this.dom){let t=document.createElement("img")
t.className="cm-widgetBuffer",t.setAttribute("aria-hidden","true"),this.setDOM(t)}}getSide(){return this.side}domAtPos(t){return k.before(this.dom)}localPosFromDOM(){return 0}domBoundsAround(){return null}coordsAt(t){let e=this.dom.getBoundingClientRect(),i=function(t,e){let i=t.parent,n=i?i.children.indexOf(t):-1
for(;i&&n>=0;)if(e<0?n>0:n<i.children.length){let t=i.children[n+e]
if(t instanceof U){let i=t.coordsAt(e<0?t.length:0,e)
if(i)return i}n+=e}else{if(!(i instanceof q&&i.parent)){let t=i.dom.lastChild
if(t&&"BR"==t.nodeName)return t.getClientRects()[0]
break}n=i.parent.children.indexOf(i)+(e<0?0:1),i=i.parent}}(this,this.side>0?-1:1)
return i&&i.top<e.bottom&&i.bottom>e.top?{left:e.left,right:e.right,top:i.top,bottom:i.bottom}:e}get overrideDOMText(){return n.Text.empty}}function K(t,e){let i=t.dom,{children:n}=t,s=0
for(let r=0;s<n.length;s++){let t=n[s],o=r+t.length
if(!(o==r&&t.getSide()<=0)){if(e>r&&e<o&&t.dom.parentNode==i)return t.domAtPos(e-r)
if(e<=r)break
r=o}}for(let r=s;r>0;r--){let t=n[r-1]
if(t.dom.parentNode==i)return t.domAtPos(t.length)}for(let r=s;r<n.length;r++){let t=n[r]
if(t.dom.parentNode==i)return t.domAtPos(0)}return new k(i,0)}function J(t,e,i){let n,{children:s}=t
i>0&&e instanceof q&&s.length&&(n=s[s.length-1])instanceof q&&n.mark.eq(e.mark)?J(n,e.children[0],i-1):(s.push(e),e.setParent(t)),t.length+=e.length}function tt(t,e,i){let n=null,s=-1,r=null,o=-1
!function t(e,i){for(let a=0,l=0;a<e.children.length&&l<=i;a++){let h=e.children[a],c=l+h.length
c>=i&&(h.children.length?t(h,i-l):!r&&(c>i||l==c&&h.getSide()>0)?(r=h,o=i-l):(l<i||l==c&&h.getSide()<0)&&(n=h,s=i-l)),l=c}}(t,e)
let a=(i<0?n:r)||n||r
return a?a.coordsAt(Math.max(0,a==n?s:o),i):function(t){let e=t.dom.lastChild
if(!e)return t.dom.getBoundingClientRect()
let i=h(e)
return i[i.length-1]||null}(t)}function et(t,e){for(let i in t)"class"==i&&e.class?e.class+=" "+t.class:"style"==i&&e.style?e.style+=";"+t.style:e[i]=t[i]
return e}function it(t,e){if(t==e)return!0
if(!t||!e)return!1
let i=Object.keys(t),n=Object.keys(e)
if(i.length!=n.length)return!1
for(let s of i)if(-1==n.indexOf(s)||t[s]!==e[s])return!1
return!0}function nt(t,e,i){let n=null
if(e)for(let s in e)i&&s in i||t.removeAttribute(n=s)
if(i)for(let s in i)e&&e[s]==i[s]||t.setAttribute(n=s,i[s])
return!!n}U.prototype.children=z.prototype.children=H.prototype.children=Q
class st{eq(t){return!1}updateDOM(t){return!1}compare(t){return this==t||this.constructor==t.constructor&&this.eq(t)}get estimatedHeight(){return-1}ignoreEvent(t){return!0}get customView(){return null}destroy(t){}}e.BlockType=void 0,(L=e.BlockType||(e.BlockType={}))[L.Text=0]="Text",L[L.WidgetBefore=1]="WidgetBefore",L[L.WidgetAfter=2]="WidgetAfter",L[L.WidgetRange=3]="WidgetRange"
class rt extends n.RangeValue{constructor(t,e,i,n){super(),this.startSide=t,this.endSide=e,this.widget=i,this.spec=n}get heightRelevant(){return!1}static mark(t){return new ot(t)}static widget(t){let e=t.side||0,i=!!t.block
return e+=i?e>0?3e8:-4e8:e>0?1e8:-1e8,new lt(t,e,e,i,t.widget||null,!1)}static replace(t){let e,i,n=!!t.block
if(t.isBlockGap)e=-5e8,i=4e8
else{let{start:s,end:r}=ht(t,n)
e=(s?n?-3e8:-1:5e8)-1,i=1+(r?n?2e8:1:-6e8)}return new lt(t,e,i,n,t.widget||null,!0)}static line(t){return new at(t)}static set(t,e=!1){return n.RangeSet.of(t,e)}hasHeight(){return!!this.widget&&this.widget.estimatedHeight>-1}}rt.none=n.RangeSet.empty
class ot extends rt{constructor(t){let{start:e,end:i}=ht(t)
super(e?-1:5e8,i?1:-6e8,null,t),this.tagName=t.tagName||"span",this.class=t.class||"",this.attrs=t.attributes||null}eq(t){return this==t||t instanceof ot&&this.tagName==t.tagName&&this.class==t.class&&it(this.attrs,t.attrs)}range(t,e=t){if(t>=e)throw new RangeError("Mark decorations may not be empty")
return super.range(t,e)}}ot.prototype.point=!1
class at extends rt{constructor(t){super(-2e8,-2e8,null,t)}eq(t){return t instanceof at&&it(this.spec.attributes,t.spec.attributes)}range(t,e=t){if(e!=t)throw new RangeError("Line decoration ranges must be zero-length")
return super.range(t,e)}}at.prototype.mapMode=n.MapMode.TrackBefore,at.prototype.point=!0
class lt extends rt{constructor(t,e,i,s,r,o){super(e,i,r,t),this.block=s,this.isReplace=o,this.mapMode=s?e<=0?n.MapMode.TrackBefore:n.MapMode.TrackAfter:n.MapMode.TrackDel}get type(){return this.startSide<this.endSide?e.BlockType.WidgetRange:this.startSide<=0?e.BlockType.WidgetBefore:e.BlockType.WidgetAfter}get heightRelevant(){return this.block||!!this.widget&&this.widget.estimatedHeight>=5}eq(t){return t instanceof lt&&((e=this.widget)==(i=t.widget)||!!(e&&i&&e.compare(i)))&&this.block==t.block&&this.startSide==t.startSide&&this.endSide==t.endSide
var e,i}range(t,e=t){if(this.isReplace&&(t>e||t==e&&this.startSide>0&&this.endSide<=0))throw new RangeError("Invalid range for replacement decoration")
if(!this.isReplace&&e!=t)throw new RangeError("Widget decorations can only have zero-length ranges")
return super.range(t,e)}}function ht(t,e=!1){let{inclusiveStart:i,inclusiveEnd:n}=t
return null==i&&(i=t.inclusive),null==n&&(n=t.inclusive),{start:null!=i?i:e,end:null!=n?n:e}}function ct(t,e,i,n=0){let s=i.length-1
s>=0&&i[s]+n>=t?i[s]=Math.max(i[s],e):i.push(t,e)}lt.prototype.point=!0
class ut extends P{constructor(){super(...arguments),this.children=[],this.length=0,this.prevAttrs=void 0,this.attrs=null,this.breakAfter=0}merge(t,e,i,n,s,r){if(i){if(!(i instanceof ut))return!1
this.dom||i.transferDOM(this)}return n&&this.setDeco(i?i.attrs:null),_(this,t,e,i?i.children:[],s,r),!0}split(t){let e=new ut
if(e.breakAfter=this.breakAfter,0==this.length)return e
let{i:i,off:n}=this.childPos(t)
n&&(e.append(this.children[i].split(n),0),this.children[i].merge(n,this.children[i].length,null,!1,0,0),i++)
for(let s=i;s<this.children.length;s++)e.append(this.children[s],0)
for(;i>0&&0==this.children[i-1].length;)this.children[--i].destroy()
return this.children.length=i,this.markDirty(),this.length=t,e}transferDOM(t){this.dom&&(this.markDirty(),t.setDOM(this.dom),t.prevAttrs=void 0===this.prevAttrs?this.attrs:this.prevAttrs,this.prevAttrs=void 0,this.dom=null)}setDeco(t){it(this.attrs,t)||(this.dom&&(this.prevAttrs=this.attrs,this.markDirty()),this.attrs=t)}append(t,e){J(this,t,e)}addLineDeco(t){let e=t.spec.attributes,i=t.spec.class
e&&(this.attrs=et(e,this.attrs||{})),i&&(this.attrs=et({class:i},this.attrs||{}))}domAtPos(t){return K(this,t)}reuseDOM(t){"DIV"==t.nodeName&&(this.setDOM(t),this.dirty|=6)}sync(t){var e
this.dom?4&this.dirty&&(S(this.dom),this.dom.className="cm-line",this.prevAttrs=this.attrs?null:void 0):(this.setDOM(document.createElement("div")),this.dom.className="cm-line",this.prevAttrs=this.attrs?null:void 0),void 0!==this.prevAttrs&&(nt(this.dom,this.prevAttrs,this.attrs),this.dom.classList.add("cm-line"),this.prevAttrs=void 0),super.sync(t)
let i=this.dom.lastChild
for(;i&&P.get(i)instanceof q;)i=i.lastChild
if(!(i&&this.length&&("BR"==i.nodeName||0!=(null===(e=P.get(i))||void 0===e?void 0:e.isEditable)||N.ios&&this.children.some((t=>t instanceof U))))){let t=document.createElement("BR")
t.cmIgnore=!0,this.dom.appendChild(t)}}measureTextSize(){if(0==this.children.length||this.length>20)return null
let t=0
for(let e of this.children){if(!(e instanceof U)||/[^ -~]/.test(e.text))return null
let i=h(e.dom)
if(1!=i.length)return null
t+=i[0].width}return t?{lineHeight:this.dom.getBoundingClientRect().height,charWidth:t/this.length}:null}coordsAt(t,e){return tt(this,t,e)}become(t){return!1}get type(){return e.BlockType.Text}static find(t,e){for(let i=0,n=0;i<t.children.length;i++){let s=t.children[i],r=n+s.length
if(r>=e){if(s instanceof ut)return s
if(r>e)break}n=r+s.breakAfter}return null}}class ft extends P{constructor(t,e,i){super(),this.widget=t,this.length=e,this.type=i,this.breakAfter=0,this.prevWidget=null}merge(t,e,i,n,s,r){return!(i&&(!(i instanceof ft&&this.widget.compare(i.widget))||t>0&&s<=0||e<this.length&&r<=0)||(this.length=t+(i?i.length:0)+(this.length-e),0))}domAtPos(t){return 0==t?k.before(this.dom):k.after(this.dom,t==this.length)}split(t){let e=this.length-t
this.length=t
let i=new ft(this.widget,e,this.type)
return i.breakAfter=this.breakAfter,i}get children(){return Q}sync(){this.dom&&this.widget.updateDOM(this.dom)||(this.dom&&this.prevWidget&&this.prevWidget.destroy(this.dom),this.prevWidget=null,this.setDOM(this.widget.toDOM(this.editorView)),this.dom.contentEditable="false")}get overrideDOMText(){return this.parent?this.parent.view.state.doc.slice(this.posAtStart,this.posAtEnd):n.Text.empty}domBoundsAround(){return null}become(t){return t instanceof ft&&t.type==this.type&&t.widget.constructor==this.widget.constructor&&(t.widget.eq(this.widget)||this.markDirty(!0),this.dom&&!this.prevWidget&&(this.prevWidget=this.widget),this.widget=t.widget,this.length=t.length,this.breakAfter=t.breakAfter,!0)}ignoreMutation(){return!0}ignoreEvent(t){return this.widget.ignoreEvent(t)}destroy(){super.destroy(),this.dom&&this.widget.destroy(this.dom)}}class dt{constructor(t,e,i,n){this.doc=t,this.pos=e,this.end=i,this.disallowBlockEffectsFor=n,this.content=[],this.curLine=null,this.breakAtStart=0,this.pendingBuffer=0,this.bufferMarks=[],this.atCursorPos=!0,this.openStart=-1,this.openEnd=-1,this.text="",this.textOff=0,this.cursor=t.iter(),this.skip=e}posCovered(){if(0==this.content.length)return!this.breakAtStart&&this.doc.lineAt(this.pos).from!=this.pos
let t=this.content[this.content.length-1]
return!(t.breakAfter||t instanceof ft&&t.type==e.BlockType.WidgetBefore)}getLine(){return this.curLine||(this.content.push(this.curLine=new ut),this.atCursorPos=!0),this.curLine}flushBuffer(t=this.bufferMarks){this.pendingBuffer&&(this.curLine.append(pt(new H(-1),t),t.length),this.pendingBuffer=0)}addBlockWidget(t){this.flushBuffer(),this.curLine=null,this.content.push(t)}finish(t){this.pendingBuffer&&t<=this.bufferMarks.length?this.flushBuffer():this.pendingBuffer=0,this.posCovered()||this.getLine()}buildText(t,e,i){for(;t>0;){if(this.textOff==this.text.length){let{value:e,lineBreak:i,done:n}=this.cursor.next(this.skip)
if(this.skip=0,n)throw new Error("Ran out of text content when drawing inline views")
if(i){this.posCovered()||this.getLine(),this.content.length?this.content[this.content.length-1].breakAfter=1:this.breakAtStart=1,this.flushBuffer(),this.curLine=null,this.atCursorPos=!0,t--
continue}this.text=e,this.textOff=0}let n=Math.min(this.text.length-this.textOff,t,512)
this.flushBuffer(e.slice(e.length-i)),this.getLine().append(pt(new U(this.text.slice(this.textOff,this.textOff+n)),e),i),this.atCursorPos=!0,this.textOff+=n,t-=n,i=0}}span(t,e,i,n){this.buildText(e-t,i,n),this.pos=e,this.openStart<0&&(this.openStart=n)}point(t,i,n,s,r,o){if(this.disallowBlockEffectsFor[o]&&n instanceof lt){if(n.block)throw new RangeError("Block decorations may not be specified via plugins")
if(i>this.doc.lineAt(this.pos).to)throw new RangeError("Decorations that replace line breaks may not be specified via plugins")}let a=i-t
if(n instanceof lt)if(n.block){let{type:t}=n
t!=e.BlockType.WidgetAfter||this.posCovered()||this.getLine(),this.addBlockWidget(new ft(n.widget||new mt("div"),a,t))}else{let e=z.create(n.widget||new mt("span"),a,a?0:n.startSide),o=this.atCursorPos&&!e.isEditable&&r<=s.length&&(t<i||n.startSide>0),l=!e.isEditable&&(t<i||r>s.length||n.startSide<=0),h=this.getLine()
2!=this.pendingBuffer||o||(this.pendingBuffer=0),this.flushBuffer(s),o&&(h.append(pt(new H(1),s),r),r=s.length+Math.max(0,r-s.length)),h.append(pt(e,s),r),this.atCursorPos=l,this.pendingBuffer=l?t<i||r>s.length?1:2:0,this.pendingBuffer&&(this.bufferMarks=s.slice())}else this.doc.lineAt(this.pos).from==this.pos&&this.getLine().addLineDeco(n)
a&&(this.textOff+a<=this.text.length?this.textOff+=a:(this.skip+=a-(this.text.length-this.textOff),this.text="",this.textOff=0),this.pos=i),this.openStart<0&&(this.openStart=r)}static build(t,e,i,s,r){let o=new dt(t,e,i,r)
return o.openEnd=n.RangeSet.spans(s,e,i,o),o.openStart<0&&(o.openStart=o.openEnd),o.finish(o.openEnd),o}}function pt(t,e){for(let i of e)t=new q(i,[t],t.length)
return t}class mt extends st{constructor(t){super(),this.tag=t}eq(t){return t.tag==this.tag}toDOM(){return document.createElement(this.tag)}updateDOM(t){return t.nodeName.toLowerCase()==this.tag}}const gt=n.Facet.define(),Ot=n.Facet.define(),vt=n.Facet.define(),yt=n.Facet.define(),bt=n.Facet.define(),wt=n.Facet.define(),xt=n.Facet.define({combine:t=>t.some((t=>t))}),St=n.Facet.define({combine:t=>t.some((t=>t))})
class kt{constructor(t,e="nearest",i="nearest",n=5,s=5){this.range=t,this.y=e,this.x=i,this.yMargin=n,this.xMargin=s}map(t){return t.empty?this:new kt(this.range.map(t),this.y,this.x,this.yMargin,this.xMargin)}}const Qt=n.StateEffect.define({map:(t,e)=>t.map(e)})
function Pt(t,e,i){let n=t.facet(yt)
n.length?n[0](e):window.onerror?window.onerror(String(e),i,void 0,void 0,e):i?console.error(i+":",e):console.error(e)}const Tt=n.Facet.define({combine:t=>!t.length||t[0]})
let $t=0
const At=n.Facet.define()
class _t{constructor(t,e,i,n){this.id=t,this.create=e,this.domEventHandlers=i,this.extension=n(this)}static define(t,e){const{eventHandlers:i,provide:n,decorations:s}=e||{}
return new _t($t++,t,i,(t=>{let e=[At.of(t)]
return s&&e.push(It.of((e=>{let i=e.plugin(t)
return i?s(i):rt.none}))),n&&e.push(n(t)),e}))}static fromClass(t,e){return _t.define((e=>new t(e)),e)}}class Ct{constructor(t){this.spec=t,this.mustUpdate=null,this.value=null}update(t){if(this.value){if(this.mustUpdate){let i=this.mustUpdate
if(this.mustUpdate=null,this.value.update)try{this.value.update(i)}catch(e){if(Pt(i.state,e,"CodeMirror plugin crashed"),this.value.destroy)try{this.value.destroy()}catch(t){}this.deactivate()}}}else if(this.spec)try{this.value=this.spec.create(t)}catch(e){Pt(t.state,e,"CodeMirror plugin crashed"),this.deactivate()}return this}destroy(t){var e
if(null===(e=this.value)||void 0===e?void 0:e.destroy)try{this.value.destroy()}catch(e){Pt(t.state,e,"CodeMirror plugin crashed")}}deactivate(){this.spec=this.value=null}}const Et=n.Facet.define(),Mt=n.Facet.define(),It=n.Facet.define(),Wt=n.Facet.define(),Rt=n.Facet.define(),Zt=n.Facet.define()
class Dt{constructor(t,e,i,n){this.fromA=t,this.toA=e,this.fromB=i,this.toB=n}join(t){return new Dt(Math.min(this.fromA,t.fromA),Math.max(this.toA,t.toA),Math.min(this.fromB,t.fromB),Math.max(this.toB,t.toB))}addToSet(t){let e=t.length,i=this
for(;e>0;e--){let n=t[e-1]
if(!(n.fromA>i.toA)){if(n.toA<i.fromA)break
i=i.join(n),t.splice(e-1,1)}}return t.splice(e,0,i),t}static extendWithRanges(t,e){if(0==e.length)return t
let i=[]
for(let n=0,s=0,r=0,o=0;;n++){let a=n==t.length?null:t[n],l=r-o,h=a?a.fromB:1e9
for(;s<e.length&&e[s]<h;){let t=e[s],n=e[s+1],r=Math.max(o,t),a=Math.min(h,n)
if(r<=a&&new Dt(r+l,a+l,r,a).addToSet(i),n>h)break
s+=2}if(!a)return i
new Dt(a.fromA,a.toA,a.fromB,a.toB).addToSet(i),r=a.toA,o=a.toB}}}class Vt{constructor(t,e,i){this.view=t,this.state=e,this.transactions=i,this.flags=0,this.startState=t.state,this.changes=n.ChangeSet.empty(this.startState.doc.length)
for(let n of i)this.changes=this.changes.compose(n.changes)
let s=[]
this.changes.iterChangedRanges(((t,e,i,n)=>s.push(new Dt(t,e,i,n)))),this.changedRanges=s
let r=t.hasFocus
r!=t.inputState.notifiedFocused&&(t.inputState.notifiedFocused=r,this.flags|=1)}static create(t,e,i){return new Vt(t,e,i)}get viewportChanged(){return(4&this.flags)>0}get heightChanged(){return(2&this.flags)>0}get geometryChanged(){return this.docChanged||(10&this.flags)>0}get focusChanged(){return(1&this.flags)>0}get docChanged(){return!this.changes.empty}get selectionSet(){return this.transactions.some((t=>t.selection))}get empty(){return 0==this.flags&&0==this.transactions.length}}var Xt
e.Direction=void 0,(Xt=e.Direction||(e.Direction={}))[Xt.LTR=0]="LTR",Xt[Xt.RTL=1]="RTL"
const jt=e.Direction.LTR,Lt=e.Direction.RTL
function Nt(t){let e=[]
for(let i=0;i<t.length;i++)e.push(1<<+t[i])
return e}const Ut=Nt("88888888888888888888888888888888888666888888787833333333337888888000000000000000000000000008888880000000000000000000000000088888888888888888888888888888888888887866668888088888663380888308888800000000000000000000000800000000000000000000000000000008"),qt=Nt("4444448826627288999999999992222222222222222222222222222222222222222222222229999999999999999999994444444444644222822222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222999999949999999229989999223333333333"),Yt=Object.create(null),zt=[]
for(let ys of["()","[]","{}"]){let t=ys.charCodeAt(0),e=ys.charCodeAt(1)
Yt[t]=e,Yt[e]=-t}const Bt=/[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac\ufb50-\ufdff]/
class Gt{constructor(t,e,i){this.from=t,this.to=e,this.level=i}get dir(){return this.level%2?Lt:jt}side(t,e){return this.dir==e==t?this.to:this.from}static find(t,e,i,n){let s=-1
for(let r=0;r<t.length;r++){let o=t[r]
if(o.from<=e&&o.to>=e){if(o.level==i)return r;(s<0||(0!=n?n<0?o.from<e:o.to>e:t[s].level>o.level))&&(s=r)}}if(s<0)throw new RangeError("Index out of range")
return s}}const Ft=[]
function Ht(t,e){let i=t.length,n=e==jt?1:2,s=e==jt?2:1
if(!t||1==n&&!Bt.test(t))return Kt(i)
for(let a=0,l=n,h=n;a<i;a++){let e=(r=t.charCodeAt(a))<=247?Ut[r]:1424<=r&&r<=1524?2:1536<=r&&r<=1785?qt[r-1536]:1774<=r&&r<=2220?4:8192<=r&&r<=8203?256:64336<=r&&r<=65023?4:8204==r?256:1
512==e?e=l:8==e&&4==h&&(e=16),Ft[a]=4==e?2:e,7&e&&(h=e),l=e}var r
for(let a=0,l=n,h=n;a<i;a++){let t=Ft[a]
if(128==t)a<i-1&&l==Ft[a+1]&&24&l?t=Ft[a]=l:Ft[a]=256
else if(64==t){let t=a+1
for(;t<i&&64==Ft[t];)t++
let e=a&&8==l||t<i&&8==Ft[t]?1==h?1:8:256
for(let i=a;i<t;i++)Ft[i]=e
a=t-1}else 8==t&&1==h&&(Ft[a]=1)
l=t,7&t&&(h=t)}for(let a,l,h,c=0,u=0,f=0;c<i;c++)if(l=Yt[a=t.charCodeAt(c)])if(l<0){for(let t=u-3;t>=0;t-=3)if(zt[t+1]==-l){let e=zt[t+2],i=2&e?n:4&e?1&e?s:n:0
i&&(Ft[c]=Ft[zt[t]]=i),u=t
break}}else{if(189==zt.length)break
zt[u++]=c,zt[u++]=a,zt[u++]=f}else if(2==(h=Ft[c])||1==h){let t=h==n
f=t?0:1
for(let e=u-3;e>=0;e-=3){let i=zt[e+2]
if(2&i)break
if(t)zt[e+2]|=2
else{if(4&i)break
zt[e+2]|=4}}}for(let a=0;a<i;a++)if(256==Ft[a]){let t=a+1
for(;t<i&&256==Ft[t];)t++
let e=1==(a?Ft[a-1]:n),s=e==(1==(t<i?Ft[t]:n))?e?1:2:n
for(let i=a;i<t;i++)Ft[i]=s
a=t-1}let o=[]
if(1==n)for(let a=0;a<i;){let t=a,e=1!=Ft[a++]
for(;a<i&&e==(1!=Ft[a]);)a++
if(e)for(let i=a;i>t;){let e=i,n=2!=Ft[--i]
for(;i>t&&n==(2!=Ft[i-1]);)i--
o.push(new Gt(i,e,n?2:1))}else o.push(new Gt(t,a,0))}else for(let a=0;a<i;){let t=a,e=2==Ft[a++]
for(;a<i&&e==(2==Ft[a]);)a++
o.push(new Gt(t,a,e?1:2))}return o}function Kt(t){return[new Gt(0,t,0)]}let Jt=""
function te(t,e,i,s,r){var o
let a=s.head-t.from,l=-1
if(0==a){if(!r||!t.length)return null
e[0].level!=i&&(a=e[0].side(!1,i),l=0)}else if(a==t.length){if(r)return null
let t=e[e.length-1]
t.level!=i&&(a=t.side(!0,i),l=e.length-1)}l<0&&(l=Gt.find(e,a,null!==(o=s.bidiLevel)&&void 0!==o?o:-1,s.assoc))
let h=e[l]
a==h.side(r,i)&&(h=e[l+=r?1:-1],a=h.side(!r,i))
let c=r==(h.dir==i),u=n.findClusterBreak(t.text,a,c)
if(Jt=t.text.slice(Math.min(a,u),Math.max(a,u)),u!=h.side(r,i))return n.EditorSelection.cursor(u+t.from,c?-1:1,h.level)
let f=l==(r?e.length-1:0)?null:e[l+(r?1:-1)]
return f||h.level==i?f&&f.level<h.level?n.EditorSelection.cursor(f.side(!r,i)+t.from,r?1:-1,f.level):n.EditorSelection.cursor(u+t.from,r?-1:1,h.level):n.EditorSelection.cursor(r?t.to:t.from,r?-1:1,i)}const ee="￿"
class ie{constructor(t,e){this.points=t,this.text="",this.lineSeparator=e.facet(n.EditorState.lineSeparator)}append(t){this.text+=t}lineBreak(){this.text+=ee}readRange(t,e){if(!t)return this
let i=t.parentNode
for(let n=t;;){this.findPointBefore(i,n),this.readNode(n)
let t=n.nextSibling
if(t==e)break
let s=P.get(n),r=P.get(t);(s&&r?s.breakAfter:(s?s.breakAfter:ne(n))||ne(t)&&("BR"!=n.nodeName||n.cmIgnore))&&this.lineBreak(),n=t}return this.findPointBefore(i,e),this}readTextNode(t){let e=t.nodeValue
for(let i of this.points)i.node==t&&(i.pos=this.text.length+Math.min(i.offset,e.length))
for(let i=0,n=this.lineSeparator?null:/\r\n?|\n/g;;){let s,r=-1,o=1
if(this.lineSeparator?(r=e.indexOf(this.lineSeparator,i),o=this.lineSeparator.length):(s=n.exec(e))&&(r=s.index,o=s[0].length),this.append(e.slice(i,r<0?e.length:r)),r<0)break
if(this.lineBreak(),o>1)for(let e of this.points)e.node==t&&e.pos>this.text.length&&(e.pos-=o-1)
i=r+o}}readNode(t){if(t.cmIgnore)return
let e=P.get(t),i=e&&e.overrideDOMText
if(null!=i){this.findPointInside(t,i.length)
for(let t=i.iter();!t.next().done;)t.lineBreak?this.lineBreak():this.append(t.value)}else 3==t.nodeType?this.readTextNode(t):"BR"==t.nodeName?t.nextSibling&&this.lineBreak():1==t.nodeType&&this.readRange(t.firstChild,null)}findPointBefore(t,e){for(let i of this.points)i.node==t&&t.childNodes[i.offset]==e&&(i.pos=this.text.length)}findPointInside(t,e){for(let i of this.points)(3==t.nodeType?i.node==t:t.contains(i.node))&&(i.pos=this.text.length+Math.min(e,i.offset))}}function ne(t){return 1==t.nodeType&&/^(DIV|P|LI|UL|OL|BLOCKQUOTE|DD|DT|H\d|SECTION|PRE)$/.test(t.nodeName)}class se{constructor(t,e){this.node=t,this.offset=e,this.pos=-1}}class re extends P{constructor(t){super(),this.view=t,this.compositionDeco=rt.none,this.decorations=[],this.dynamicDecorationMap=[],this.minWidth=0,this.minWidthFrom=0,this.minWidthTo=0,this.impreciseAnchor=null,this.impreciseHead=null,this.forceSelection=!1,this.lastUpdate=Date.now(),this.setDOM(t.contentDOM),this.children=[new ut],this.children[0].setParent(this),this.updateDeco(),this.updateInner([new Dt(0,0,0,t.state.doc.length)],0)}get editorView(){return this.view}get length(){return this.view.state.doc.length}update(t){let e=t.changedRanges
this.minWidth>0&&e.length&&(e.every((({fromA:t,toA:e})=>e<this.minWidthFrom||t>this.minWidthTo))?(this.minWidthFrom=t.changes.mapPos(this.minWidthFrom,1),this.minWidthTo=t.changes.mapPos(this.minWidthTo,1)):this.minWidth=this.minWidthFrom=this.minWidthTo=0),this.view.inputState.composing<0?this.compositionDeco=rt.none:(t.transactions.length||this.dirty)&&(this.compositionDeco=function(t,e){let i=ae(t)
if(!i)return rt.none
let{from:n,to:s,node:r,text:o}=i,a=e.mapPos(n,1),l=Math.max(a,e.mapPos(s,-1)),{state:h}=t,c=3==r.nodeType?r.nodeValue:new ie([],h).readRange(r.firstChild,null).text
if(l-a<c.length)if(h.doc.sliceString(a,Math.min(h.doc.length,a+c.length),ee)==c)l=a+c.length
else{if(h.doc.sliceString(Math.max(0,l-c.length),l,ee)!=c)return rt.none
a=l-c.length}else if(h.doc.sliceString(a,l,ee)!=c)return rt.none
let u=P.get(r)
return u instanceof B?u=u.widget.topView:u&&(u.parent=null),rt.set(rt.replace({widget:new le(r,o,u),inclusive:!0}).range(a,l))}(this.view,t.changes)),(N.ie||N.chrome)&&!this.compositionDeco.size&&t&&t.state.doc.lines!=t.startState.doc.lines&&(this.forceSelection=!0)
let i=function(t,e,i){let s=new ce
return n.RangeSet.compare(t,e,i,s),s.changes}(this.decorations,this.updateDeco(),t.changes)
return e=Dt.extendWithRanges(e,i),(0!=this.dirty||0!=e.length)&&(this.updateInner(e,t.startState.doc.length),t.transactions.length&&(this.lastUpdate=Date.now()),!0)}updateInner(t,e){this.view.viewState.mustMeasureContent=!0,this.updateChildren(t,e)
let{observer:i}=this.view
i.ignore((()=>{this.dom.style.height=this.view.viewState.contentHeight+"px",this.dom.style.flexBasis=this.minWidth?this.minWidth+"px":""
let t=N.chrome||N.ios?{node:i.selectionRange.focusNode,written:!1}:void 0
this.sync(t),this.dirty=0,t&&(t.written||i.selectionRange.focusNode!=t.node)&&(this.forceSelection=!0),this.dom.style.height=""}))
let n=[]
if(this.view.viewport.from||this.view.viewport.to<this.view.state.doc.length)for(let s of this.children)s instanceof ft&&s.widget instanceof oe&&n.push(s.dom)
i.updateGaps(n)}updateChildren(t,e){let i=this.childCursor(e)
for(let n=t.length-1;;n--){let e=n>=0?t[n]:null
if(!e)break
let{fromA:s,toA:r,fromB:o,toB:a}=e,{content:l,breakAtStart:h,openStart:c,openEnd:u}=dt.build(this.view.state.doc,o,a,this.decorations,this.dynamicDecorationMap),{i:f,off:d}=i.findPos(r,1),{i:p,off:m}=i.findPos(s,-1)
A(this,p,m,f,d,l,h,c,u)}}updateSelection(t=!1,e=!1){if(!t&&this.view.observer.selectionRange.focusNode||this.view.observer.readSelectionRange(),!e&&!this.mayControlSelection())return
let i=this.forceSelection
this.forceSelection=!1
let n=this.view.state.selection.main,s=this.domAtPos(n.anchor),r=n.empty?s:this.domAtPos(n.head)
if(N.gecko&&n.empty&&1==(a=s).node.nodeType&&a.node.firstChild&&(0==a.offset||"false"==a.node.childNodes[a.offset-1].contentEditable)&&(a.offset==a.node.childNodes.length||"false"==a.node.childNodes[a.offset].contentEditable)){let t=document.createTextNode("")
this.view.observer.ignore((()=>s.node.insertBefore(t,s.node.childNodes[s.offset]||null))),s=r=new k(t,0),i=!0}var a
let l=this.view.observer.selectionRange
!i&&l.focusNode&&c(s.node,s.offset,l.anchorNode,l.anchorOffset)&&c(r.node,r.offset,l.focusNode,l.focusOffset)||(this.view.observer.ignore((()=>{N.android&&N.chrome&&this.dom.contains(l.focusNode)&&function(t,e){for(let i=t;i&&i!=e;i=i.assignedSlot||i.parentNode)if(1==i.nodeType&&"false"==i.contentEditable)return!0
return!1}(l.focusNode,this.dom)&&(this.dom.blur(),this.dom.focus({preventScroll:!0}))
let t=o(this.view.root)
if(t)if(n.empty){if(N.gecko){let t=(e=s.node,i=s.offset,1!=e.nodeType?0:(i&&"false"==e.childNodes[i-1].contentEditable?1:0)|(i<e.childNodes.length&&"false"==e.childNodes[i].contentEditable?2:0))
if(t&&3!=t){let e=he(s.node,s.offset,1==t?1:-1)
e&&(s=new k(e,1==t?0:e.nodeValue.length))}}t.collapse(s.node,s.offset),null!=n.bidiLevel&&null!=l.cursorBidiLevel&&(l.cursorBidiLevel=n.bidiLevel)}else if(t.extend){t.collapse(s.node,s.offset)
try{t.extend(r.node,r.offset)}catch(t){}}else{let e=document.createRange()
n.anchor>n.head&&([s,r]=[r,s]),e.setEnd(r.node,r.offset),e.setStart(s.node,s.offset),t.removeAllRanges(),t.addRange(e)}var e,i})),this.view.observer.setSelectionRange(s,r)),this.impreciseAnchor=s.precise?null:new k(l.anchorNode,l.anchorOffset),this.impreciseHead=r.precise?null:new k(l.focusNode,l.focusOffset)}enforceCursorAssoc(){if(this.compositionDeco.size)return
let{view:t}=this,e=t.state.selection.main,i=o(t.root),{anchorNode:n,anchorOffset:s}=t.observer.selectionRange
if(!(i&&e.empty&&e.assoc&&i.modify))return
let r=ut.find(this,e.head)
if(!r)return
let a=r.posAtStart
if(e.head==a||e.head==a+r.length)return
let l=this.coordsAt(e.head,-1),h=this.coordsAt(e.head,1)
if(!l||!h||l.bottom>h.top)return
let c=this.domAtPos(e.head+e.assoc)
i.collapse(c.node,c.offset),i.modify("move",e.assoc<0?"forward":"backward","lineboundary"),t.observer.readSelectionRange()
let u=t.observer.selectionRange
t.docView.posFromDOM(u.anchorNode,u.anchorOffset)!=e.from&&i.collapse(n,s)}mayControlSelection(){let t=this.view.root.activeElement
return t==this.dom||l(this.dom,this.view.observer.selectionRange)&&!(t&&this.dom.contains(t))}nearest(t){for(let e=t;e;){let t=P.get(e)
if(t&&t.rootView==this)return t
e=e.parentNode}return null}posFromDOM(t,e){let i=this.nearest(t)
if(!i)throw new RangeError("Trying to find position for a DOM position outside of the document")
return i.localPosFromDOM(t,e)+i.posAtStart}domAtPos(t){let{i:e,off:i}=this.childCursor().findPos(t,-1)
for(;e<this.children.length-1;){let t=this.children[e]
if(i<t.length||t instanceof ut)break
e++,i=0}return this.children[e].domAtPos(i)}coordsAt(t,i){for(let n=this.length,s=this.children.length-1;;s--){let r=this.children[s],o=n-r.breakAfter-r.length
if(t>o||t==o&&r.type!=e.BlockType.WidgetBefore&&r.type!=e.BlockType.WidgetAfter&&(!s||2==i||this.children[s-1].breakAfter||this.children[s-1].type==e.BlockType.WidgetBefore&&i>-2))return r.coordsAt(t-o,i)
n=o}}measureVisibleLineHeights(t){let i=[],{from:n,to:s}=t,r=this.view.contentDOM.clientWidth,o=r>Math.max(this.view.scrollDOM.clientWidth,this.minWidth)+1,a=-1,l=this.view.textDirection==e.Direction.LTR
for(let e=0,c=0;c<this.children.length;c++){let t=this.children[c],u=e+t.length
if(u>s)break
if(e>=n){let n=t.dom.getBoundingClientRect()
if(i.push(n.height),o){let i=t.dom.lastChild,s=i?h(i):[]
if(s.length){let t=s[s.length-1],i=l?t.right-n.left:n.right-t.left
i>a&&(a=i,this.minWidth=r,this.minWidthFrom=e,this.minWidthTo=u)}}}e=u+t.breakAfter}return i}textDirectionAt(t){let{i:i}=this.childPos(t,1)
return"rtl"==getComputedStyle(this.children[i].dom).direction?e.Direction.RTL:e.Direction.LTR}measureTextSize(){for(let n of this.children)if(n instanceof ut){let t=n.measureTextSize()
if(t)return t}let t,e,i=document.createElement("div")
return i.className="cm-line",i.style.width="99999px",i.textContent="abc def ghi jkl mno pqr stu",this.view.observer.ignore((()=>{this.dom.appendChild(i)
let n=h(i.firstChild)[0]
t=i.getBoundingClientRect().height,e=n?n.width/27:7,i.remove()})),{lineHeight:t,charWidth:e}}childCursor(t=this.length){let e=this.children.length
return e&&(t-=this.children[--e].length),new $(this.children,t,e)}computeBlockGapDeco(){let t=[],e=this.view.viewState
for(let i=0,n=0;;n++){let s=n==e.viewports.length?null:e.viewports[n],r=s?s.from-1:this.length
if(r>i){let n=e.lineBlockAt(r).bottom-e.lineBlockAt(i).top
t.push(rt.replace({widget:new oe(n),block:!0,inclusive:!0,isBlockGap:!0}).range(i,r))}if(!s)break
i=s.to+1}return rt.set(t)}updateDeco(){let t=this.view.state.facet(It).map(((t,e)=>(this.dynamicDecorationMap[e]="function"==typeof t)?t(this.view):t))
for(let e=t.length;e<t.length+3;e++)this.dynamicDecorationMap[e]=!1
return this.decorations=[...t,this.compositionDeco,this.computeBlockGapDeco(),this.view.viewState.lineGapDeco]}scrollIntoView(t){let i,{range:n}=t,s=this.coordsAt(n.head,n.empty?n.assoc:n.head>n.anchor?-1:1)
if(!s)return
!n.empty&&(i=this.coordsAt(n.anchor,n.anchor>n.head?-1:1))&&(s={left:Math.min(s.left,i.left),top:Math.min(s.top,i.top),right:Math.max(s.right,i.right),bottom:Math.max(s.bottom,i.bottom)})
let r=0,o=0,a=0,l=0
for(let e of this.view.state.facet(Rt).map((t=>t(this.view))))if(e){let{left:t,right:i,top:n,bottom:s}=e
null!=t&&(r=Math.max(r,t)),null!=i&&(o=Math.max(o,i)),null!=n&&(a=Math.max(a,n)),null!=s&&(l=Math.max(l,s))}let h={left:s.left-r,top:s.top-a,right:s.right+o,bottom:s.bottom+l}
!function(t,e,i,n,s,r,o,a){let l=t.ownerDocument,h=l.defaultView||window
for(let c=t;c;)if(1==c.nodeType){let t,u=c==l.body
if(u)t=g(h)
else{if(c.scrollHeight<=c.clientHeight&&c.scrollWidth<=c.clientWidth){c=c.assignedSlot||c.parentNode
continue}let e=c.getBoundingClientRect()
t={left:e.left,right:e.left+c.clientWidth,top:e.top,bottom:e.top+c.clientHeight}}let f=0,d=0
if("nearest"==s)e.top<t.top?(d=-(t.top-e.top+o),i>0&&e.bottom>t.bottom+d&&(d=e.bottom-t.bottom+d+o)):e.bottom>t.bottom&&(d=e.bottom-t.bottom+o,i<0&&e.top-d<t.top&&(d=-(t.top+d-e.top+o)))
else{let n=e.bottom-e.top,r=t.bottom-t.top
d=("center"==s&&n<=r?e.top+n/2-r/2:"start"==s||"center"==s&&i<0?e.top-o:e.bottom-r+o)-t.top}if("nearest"==n?e.left<t.left?(f=-(t.left-e.left+r),i>0&&e.right>t.right+f&&(f=e.right-t.right+f+r)):e.right>t.right&&(f=e.right-t.right+r,i<0&&e.left<t.left+f&&(f=-(t.left+f-e.left+r))):f=("center"==n?e.left+(e.right-e.left)/2-(t.right-t.left)/2:"start"==n==a?e.left-r:e.right-(t.right-t.left)+r)-t.left,f||d)if(u)h.scrollBy(f,d)
else{let t=0,i=0
if(d){let t=c.scrollTop
c.scrollTop+=d,i=c.scrollTop-t}if(f){let e=c.scrollLeft
c.scrollLeft+=f,t=c.scrollLeft-e}e={left:e.left-t,top:e.top-i,right:e.right-t,bottom:e.bottom-i},t&&Math.abs(t-f)<1&&(n="nearest"),i&&Math.abs(i-d)<1&&(s="nearest")}if(u)break
c=c.assignedSlot||c.parentNode}else{if(11!=c.nodeType)break
c=c.host}}(this.view.scrollDOM,h,n.head<n.anchor?-1:1,t.x,t.y,t.xMargin,t.yMargin,this.view.textDirection==e.Direction.LTR)}}class oe extends st{constructor(t){super(),this.height=t}toDOM(){let t=document.createElement("div")
return this.updateDOM(t),t}eq(t){return t.height==this.height}updateDOM(t){return t.style.height=this.height+"px",!0}get estimatedHeight(){return this.height}}function ae(t){let e=t.observer.selectionRange,i=e.focusNode&&he(e.focusNode,e.focusOffset,0)
if(!i)return null
let n=t.docView.nearest(i)
if(!n)return null
if(n instanceof ut){let t=i
for(;t.parentNode!=n.dom;)t=t.parentNode
let e=t.previousSibling
for(;e&&!P.get(e);)e=e.previousSibling
let s=e?P.get(e).posAtEnd:n.posAtStart
return{from:s,to:s,node:t,text:i}}{for(;;){let{parent:t}=n
if(!t)return null
if(t instanceof ut)break
n=t}let t=n.posAtStart
return{from:t,to:t+n.length,node:n.dom,text:i}}}class le extends st{constructor(t,e,i){super(),this.top=t,this.text=e,this.topView=i}eq(t){return this.top==t.top&&this.text==t.text}toDOM(){return this.top}ignoreEvent(){return!1}get customView(){return B}}function he(t,e,i){for(;;){if(3==t.nodeType)return t
if(1==t.nodeType&&e>0&&i<=0)e=d(t=t.childNodes[e-1])
else{if(!(1==t.nodeType&&e<t.childNodes.length&&i>=0))return null
t=t.childNodes[e],e=0}}}class ce{constructor(){this.changes=[]}compareRange(t,e){ct(t,e,this.changes)}comparePoint(t,e){ct(t,e,this.changes)}}function ue(t,e){return e.left>t?e.left-t:Math.max(0,t-e.right)}function fe(t,e){return e.top>t?e.top-t:Math.max(0,t-e.bottom)}function de(t,e){return t.top<e.bottom-1&&t.bottom>e.top+1}function pe(t,e){return e<t.top?{top:e,left:t.left,right:t.right,bottom:t.bottom}:t}function me(t,e){return e>t.bottom?{top:t.top,left:t.left,right:t.right,bottom:e}:t}function ge(t,e,i){let n,s,r,o,a,l,c,u,f=!1
for(let p=t.firstChild;p;p=p.nextSibling){let t=h(p)
for(let h=0;h<t.length;h++){let d=t[h]
s&&de(s,d)&&(d=pe(me(d,s.bottom),s.top))
let m=ue(e,d),g=fe(i,d)
if(0==m&&0==g)return 3==p.nodeType?Oe(p,e,i):ge(p,e,i);(!n||o>g||o==g&&r>m)&&(n=p,s=d,r=m,o=g,f=!m||(m>0?h<t.length-1:h>0)),0==m?i>d.bottom&&(!c||c.bottom<d.bottom)?(a=p,c=d):i<d.top&&(!u||u.top>d.top)&&(l=p,u=d):c&&de(c,d)?c=me(c,d.bottom):u&&de(u,d)&&(u=pe(u,d.top))}}if(c&&c.bottom>=i?(n=a,s=c):u&&u.top<=i&&(n=l,s=u),!n)return{node:t,offset:0}
let d=Math.max(s.left,Math.min(s.right,e))
return 3==n.nodeType?Oe(n,d,i):f&&"false"!=n.contentEditable?ge(n,d,i):{node:t,offset:Array.prototype.indexOf.call(t.childNodes,n)+(e>=(s.left+s.right)/2?1:0)}}function Oe(t,e,i){let n=t.nodeValue.length,s=-1,r=1e9,o=0
for(let a=0;a<n;a++){let n=w(t,a,a+1).getClientRects()
for(let l=0;l<n.length;l++){let h=n[l]
if(h.top==h.bottom)continue
o||(o=e-h.left)
let c=(h.top>i?h.top-i:i-h.bottom)-1
if(h.left-1<=e&&h.right+1>=e&&c<r){let i=e>=(h.left+h.right)/2,n=i
if((N.chrome||N.gecko)&&w(t,a).getBoundingClientRect().left==h.right&&(n=!i),c<=0)return{node:t,offset:a+(n?1:0)}
s=a+(n?1:0),r=c}}}return{node:t,offset:s>-1?s:o>0?t.nodeValue.length:0}}function ve(t,{x:i,y:n},s,r=-1){var o
let a,l=t.contentDOM.getBoundingClientRect(),h=l.top+t.viewState.paddingTop,{docHeight:c}=t.viewState,u=n-h
if(u<0)return 0
if(u>c)return t.state.doc.length
for(let v=t.defaultLineHeight/2,y=!1;a=t.elementAtHeight(u),a.type!=e.BlockType.Text;)for(;u=r>0?a.bottom+v:a.top-v,!(u>=0&&u<=c);){if(y)return s?null:0
y=!0,r=-r}n=h+u
let f=a.from
if(f<t.viewport.from)return 0==t.viewport.from?0:s?null:ye(t,l,a,i,n)
if(f>t.viewport.to)return t.viewport.to==t.state.doc.length?t.state.doc.length:s?null:ye(t,l,a,i,n)
let d=t.dom.ownerDocument,p=t.root.elementFromPoint?t.root:d,m=p.elementFromPoint(i,n)
m&&!t.contentDOM.contains(m)&&(m=null),m||(i=Math.max(l.left+1,Math.min(l.right-1,i)),m=p.elementFromPoint(i,n),m&&!t.contentDOM.contains(m)&&(m=null))
let g,O=-1
if(m&&0!=(null===(o=t.docView.nearest(m))||void 0===o?void 0:o.isEditable))if(d.caretPositionFromPoint){let t=d.caretPositionFromPoint(i,n)
t&&({offsetNode:g,offset:O}=t)}else if(d.caretRangeFromPoint){let e=d.caretRangeFromPoint(i,n)
e&&(({startContainer:g,startOffset:O}=e),(!t.contentDOM.contains(g)||N.safari&&function(t,e,i){let n
if(3!=t.nodeType||e!=(n=t.nodeValue.length))return!1
for(let s=t.nextSibling;s;s=s.nextSibling)if(1!=s.nodeType||"BR"!=s.nodeName)return!1
return w(t,n-1,n).getBoundingClientRect().left>i}(g,O,i)||N.chrome&&function(t,e,i){if(0!=e)return!1
for(let n=t;;){let t=n.parentNode
if(!t||1!=t.nodeType||t.firstChild!=n)return!1
if(t.classList.contains("cm-line"))break
n=t}return i-(1==t.nodeType?t.getBoundingClientRect():w(t,0,Math.max(t.nodeValue.length,1)).getBoundingClientRect()).left>5}(g,O,i))&&(g=void 0))}if(!g||!t.docView.dom.contains(g)){let e=ut.find(t.docView,f)
if(!e)return u>a.top+a.height/2?a.to:a.from;({node:g,offset:O}=ge(e.dom,i,n))}return t.docView.posFromDOM(g,O)}function ye(t,e,i,s,r){let o=Math.round((s-e.left)*t.defaultCharacterWidth)
t.lineWrapping&&i.height>1.5*t.defaultLineHeight&&(o+=Math.floor((r-i.top)/t.defaultLineHeight)*t.viewState.heightOracle.lineLength)
let a=t.state.sliceDoc(i.from,i.to)
return i.from+n.findColumn(a,o,t.state.tabSize)}function be(t,e,i,s){let r=t.state.doc.lineAt(e.head),o=t.bidiSpans(r),a=t.textDirectionAt(r.from)
for(let l=e,h=null;;){let e=te(r,o,a,l,i),c=Jt
if(!e){if(r.number==(i?t.state.doc.lines:1))return l
c="\n",r=t.state.doc.line(r.number+(i?1:-1)),o=t.bidiSpans(r),e=n.EditorSelection.cursor(i?r.from:r.to)}if(h){if(!h(c))return l}else{if(!s)return e
h=s(c)}l=e}}function we(t,e,i){let s=t.state.facet(Wt).map((e=>e(t)))
for(;;){let t=!1
for(let r of s)r.between(i.from-1,i.from+1,((s,r,o)=>{i.from>s&&i.from<r&&(i=e.head>i.from?n.EditorSelection.cursor(s,1):n.EditorSelection.cursor(r,-1),t=!0)}))
if(!t)return i}}class xe{constructor(t){this.lastKeyCode=0,this.lastKeyTime=0,this.lastTouchTime=0,this.lastFocusTime=0,this.lastScrollTop=0,this.lastScrollLeft=0,this.chromeScrollHack=-1,this.pendingIOSKey=void 0,this.lastSelectionOrigin=null,this.lastSelectionTime=0,this.lastEscPress=0,this.lastContextMenu=0,this.scrollHandlers=[],this.registeredEvents=[],this.customHandlers=[],this.composing=-1,this.compositionFirstChange=null,this.compositionEndedAt=0,this.mouseSelection=null
let e=(e,i)=>{this.ignoreDuringComposition(i)||"keydown"==i.type&&this.keydown(t,i)||(this.mustFlushObserver(i)&&t.observer.forceFlush(),this.runCustomHandlers(i.type,t,i)?i.preventDefault():e(t,i))}
for(let i in Ae){let n=Ae[i]
t.contentDOM.addEventListener(i,(i=>{$e(t,i)&&e(n,i)}),_e[i]),this.registeredEvents.push(i)}t.scrollDOM.addEventListener("mousedown",(i=>{i.target==t.scrollDOM&&e(Ae.mousedown,i)})),N.chrome&&102==N.chrome_version&&t.scrollDOM.addEventListener("wheel",(()=>{this.chromeScrollHack<0?t.contentDOM.style.pointerEvents="none":window.clearTimeout(this.chromeScrollHack),this.chromeScrollHack=setTimeout((()=>{this.chromeScrollHack=-1,t.contentDOM.style.pointerEvents=""}),100)}),{passive:!0}),this.notifiedFocused=t.hasFocus,N.safari&&t.contentDOM.addEventListener("input",(()=>null))}setSelectionOrigin(t){this.lastSelectionOrigin=t,this.lastSelectionTime=Date.now()}ensureHandlers(t,e){var i
let n
this.customHandlers=[]
for(let s of e)if(n=null===(i=s.update(t).spec)||void 0===i?void 0:i.domEventHandlers){this.customHandlers.push({plugin:s.value,handlers:n})
for(let e in n)this.registeredEvents.indexOf(e)<0&&"scroll"!=e&&(this.registeredEvents.push(e),t.contentDOM.addEventListener(e,(i=>{$e(t,i)&&this.runCustomHandlers(e,t,i)&&i.preventDefault()})))}}runCustomHandlers(t,e,i){for(let n of this.customHandlers){let s=n.handlers[t]
if(s)try{if(s.call(n.plugin,i,e)||i.defaultPrevented)return!0}catch(t){Pt(e.state,t)}}return!1}runScrollHandlers(t,e){this.lastScrollTop=t.scrollDOM.scrollTop,this.lastScrollLeft=t.scrollDOM.scrollLeft
for(let i of this.customHandlers){let n=i.handlers.scroll
if(n)try{n.call(i.plugin,e,t)}catch(e){Pt(t.state,e)}}}keydown(t,e){if(this.lastKeyCode=e.keyCode,this.lastKeyTime=Date.now(),9==e.keyCode&&Date.now()<this.lastEscPress+2e3)return!0
if(N.android&&N.chrome&&!e.synthetic&&(13==e.keyCode||8==e.keyCode))return t.observer.delayAndroidKey(e.key,e.keyCode),!0
let i
return!(!N.ios||e.synthetic||e.altKey||e.metaKey||!((i=Se.find((t=>t.keyCode==e.keyCode)))&&!e.ctrlKey||ke.indexOf(e.key)>-1&&e.ctrlKey&&!e.shiftKey)||(this.pendingIOSKey=i||e,setTimeout((()=>this.flushIOSKey(t)),250),0))}flushIOSKey(t){let e=this.pendingIOSKey
return!!e&&(this.pendingIOSKey=void 0,x(t.contentDOM,e.key,e.keyCode))}ignoreDuringComposition(t){return!!/^key/.test(t.type)&&(this.composing>0||!!(N.safari&&!N.ios&&Date.now()-this.compositionEndedAt<100)&&(this.compositionEndedAt=0,!0))}mustFlushObserver(t){return"keydown"==t.type&&229!=t.keyCode}startMouseSelection(t){this.mouseSelection&&this.mouseSelection.destroy(),this.mouseSelection=t}update(t){this.mouseSelection&&this.mouseSelection.update(t),t.transactions.length&&(this.lastKeyCode=this.lastSelectionTime=0)}destroy(){this.mouseSelection&&this.mouseSelection.destroy()}}const Se=[{key:"Backspace",keyCode:8,inputType:"deleteContentBackward"},{key:"Enter",keyCode:13,inputType:"insertParagraph"},{key:"Delete",keyCode:46,inputType:"deleteContentForward"}],ke="dthko",Qe=[16,17,18,20,91,92,224,225]
function Pe(t){return.7*t+8}class Te{constructor(t,e,i,s){this.view=t,this.style=i,this.mustSelect=s,this.scrollSpeed={x:0,y:0},this.scrolling=-1,this.lastEvent=e,this.scrollParent=function(t){let e=t.ownerDocument
for(let i=t.parentNode;i&&i!=e.body;)if(1==i.nodeType){if(i.scrollHeight>i.clientHeight||i.scrollWidth>i.clientWidth)return i
i=i.assignedSlot||i.parentNode}else{if(11!=i.nodeType)break
i=i.host}return null}(t.contentDOM)
let r=t.contentDOM.ownerDocument
r.addEventListener("mousemove",this.move=this.move.bind(this)),r.addEventListener("mouseup",this.up=this.up.bind(this)),this.extend=e.shiftKey,this.multiple=t.state.facet(n.EditorState.allowMultipleSelections)&&function(t,e){let i=t.state.facet(gt)
return i.length?i[0](e):N.mac?e.metaKey:e.ctrlKey}(t,e),this.dragMove=function(t,e){let i=t.state.facet(Ot)
return i.length?i[0](e):N.mac?!e.altKey:!e.ctrlKey}(t,e),this.dragging=!(!function(t,e){let{main:i}=t.state.selection
if(i.empty)return!1
let n=o(t.root)
if(!n||0==n.rangeCount)return!0
let s=n.getRangeAt(0).getClientRects()
for(let r=0;r<s.length;r++){let t=s[r]
if(t.left<=e.clientX&&t.right>=e.clientX&&t.top<=e.clientY&&t.bottom>=e.clientY)return!0}return!1}(t,e)||1!=Le(e))&&null,!1===this.dragging&&(e.preventDefault(),this.select(e))}move(t){var e
if(0==t.buttons)return this.destroy()
if(!1!==this.dragging)return
this.select(this.lastEvent=t)
let i=0,n=0,s=(null===(e=this.scrollParent)||void 0===e?void 0:e.getBoundingClientRect())||{left:0,top:0,right:this.view.win.innerWidth,bottom:this.view.win.innerHeight}
t.clientX<=s.left?i=-Pe(s.left-t.clientX):t.clientX>=s.right&&(i=Pe(t.clientX-s.right)),t.clientY<=s.top?n=-Pe(s.top-t.clientY):t.clientY>=s.bottom&&(n=Pe(t.clientY-s.bottom)),this.setScrollSpeed(i,n)}up(t){null==this.dragging&&this.select(this.lastEvent),this.dragging||t.preventDefault(),this.destroy()}destroy(){this.setScrollSpeed(0,0)
let t=this.view.contentDOM.ownerDocument
t.removeEventListener("mousemove",this.move),t.removeEventListener("mouseup",this.up),this.view.inputState.mouseSelection=null}setScrollSpeed(t,e){this.scrollSpeed={x:t,y:e},t||e?this.scrolling<0&&(this.scrolling=setInterval((()=>this.scroll()),50)):this.scrolling>-1&&(clearInterval(this.scrolling),this.scrolling=-1)}scroll(){this.scrollParent?(this.scrollParent.scrollLeft+=this.scrollSpeed.x,this.scrollParent.scrollTop+=this.scrollSpeed.y):this.view.win.scrollBy(this.scrollSpeed.x,this.scrollSpeed.y),!1===this.dragging&&this.select(this.lastEvent)}select(t){let e=this.style.get(t,this.extend,this.multiple)
!this.mustSelect&&e.eq(this.view.state.selection)&&e.main.assoc==this.view.state.selection.main.assoc||this.view.dispatch({selection:e,userEvent:"select.pointer"}),this.mustSelect=!1}update(t){t.docChanged&&this.dragging&&(this.dragging=this.dragging.map(t.changes)),this.style.update(t)&&setTimeout((()=>this.select(this.lastEvent)),20)}}function $e(t,e){if(!e.bubbles)return!0
if(e.defaultPrevented)return!1
for(let i,n=e.target;n!=t.contentDOM;n=n.parentNode)if(!n||11==n.nodeType||(i=P.get(n))&&i.ignoreEvent(e))return!1
return!0}const Ae=Object.create(null),_e=Object.create(null),Ce=N.ie&&N.ie_version<15||N.ios&&N.webkit_version<604
function Ee(t,e){let i,{state:s}=t,r=1,o=s.toText(e),a=o.lines==s.selection.ranges.length
if(null!=Ue&&s.selection.ranges.every((t=>t.empty))&&Ue==o.toString()){let t=-1
i=s.changeByRange((i=>{let l=s.doc.lineAt(i.from)
if(l.from==t)return{range:i}
t=l.from
let h=s.toText((a?o.line(r++).text:e)+s.lineBreak)
return{changes:{from:l.from,insert:h},range:n.EditorSelection.cursor(i.from+h.length)}}))}else i=a?s.changeByRange((t=>{let e=o.line(r++)
return{changes:{from:t.from,to:t.to,insert:e.text},range:n.EditorSelection.cursor(t.from+e.length)}})):s.replaceSelection(o)
t.dispatch(i,{userEvent:"input.paste",scrollIntoView:!0})}function Me(t,e,i,s){if(1==s)return n.EditorSelection.cursor(e,i)
if(2==s)return function(t,e,i=1){let s=t.charCategorizer(e),r=t.doc.lineAt(e),o=e-r.from
if(0==r.length)return n.EditorSelection.cursor(e)
0==o?i=1:o==r.length&&(i=-1)
let a=o,l=o
i<0?a=n.findClusterBreak(r.text,o,!1):l=n.findClusterBreak(r.text,o)
let h=s(r.text.slice(a,l))
for(;a>0;){let t=n.findClusterBreak(r.text,a,!1)
if(s(r.text.slice(t,a))!=h)break
a=t}for(;l<r.length;){let t=n.findClusterBreak(r.text,l)
if(s(r.text.slice(l,t))!=h)break
l=t}return n.EditorSelection.range(a+r.from,l+r.from)}(t.state,e,i)
{let i=ut.find(t.docView,e),s=t.state.doc.lineAt(i?i.posAtEnd:e),r=i?i.posAtStart:s.from,o=i?i.posAtEnd:s.to
return o<t.state.doc.length&&o==s.to&&o++,n.EditorSelection.range(r,o)}}Ae.keydown=(t,e)=>{t.inputState.setSelectionOrigin("select"),27==e.keyCode?t.inputState.lastEscPress=Date.now():Qe.indexOf(e.keyCode)<0&&(t.inputState.lastEscPress=0)},Ae.touchstart=(t,e)=>{t.inputState.lastTouchTime=Date.now(),t.inputState.setSelectionOrigin("select.pointer")},Ae.touchmove=t=>{t.inputState.setSelectionOrigin("select.pointer")},_e.touchstart=_e.touchmove={passive:!0},Ae.mousedown=(t,e)=>{if(t.observer.flush(),t.inputState.lastTouchTime>Date.now()-2e3)return
let i=null
for(let n of t.state.facet(vt))if(i=n(t,e),i)break
if(i||0!=e.button||(i=function(t,e){let i=Ze(t,e),s=Le(e),r=t.state.selection
return{update(t){t.docChanged&&(i.pos=t.changes.mapPos(i.pos),r=r.map(t.changes))},get(e,o,a){let l=Ze(t,e),h=Me(t,l.pos,l.bias,s)
if(i.pos!=l.pos&&!o){let e=Me(t,i.pos,i.bias,s),r=Math.min(e.from,h.from),o=Math.max(e.to,h.to)
h=r<h.from?n.EditorSelection.range(r,o):n.EditorSelection.range(o,r)}return o?r.replaceRange(r.main.extend(h.from,h.to)):a&&r.ranges.length>1&&r.ranges.some((t=>t.eq(h)))?function(t,e){for(let i=0;;i++)if(t.ranges[i].eq(e))return n.EditorSelection.create(t.ranges.slice(0,i).concat(t.ranges.slice(i+1)),t.mainIndex==i?0:t.mainIndex-(t.mainIndex>i?1:0))}(r,h):a?r.addRange(h):n.EditorSelection.create([h])}}}(t,e)),i){let n=t.root.activeElement!=t.contentDOM
n&&t.observer.ignore((()=>b(t.contentDOM))),t.inputState.startMouseSelection(new Te(t,e,i,n))}}
let Ie=(t,e)=>t>=e.top&&t<=e.bottom,We=(t,e,i)=>Ie(e,i)&&t>=i.left&&t<=i.right
function Re(t,e,i,n){let s=ut.find(t.docView,e)
if(!s)return 1
let r=e-s.posAtStart
if(0==r)return 1
if(r==s.length)return-1
let o=s.coordsAt(r,-1)
if(o&&We(i,n,o))return-1
let a=s.coordsAt(r,1)
return a&&We(i,n,a)?1:o&&Ie(n,o)?-1:1}function Ze(t,e){let i=t.posAtCoords({x:e.clientX,y:e.clientY},!1)
return{pos:i,bias:Re(t,i,e.clientX,e.clientY)}}const De=N.ie&&N.ie_version<=11
let Ve=null,Xe=0,je=0
function Le(t){if(!De)return t.detail
let e=Ve,i=je
return Ve=t,je=Date.now(),Xe=!e||i>Date.now()-400&&Math.abs(e.clientX-t.clientX)<2&&Math.abs(e.clientY-t.clientY)<2?(Xe+1)%3:1}function Ne(t,e,i,n){if(!i)return
let s=t.posAtCoords({x:e.clientX,y:e.clientY},!1)
e.preventDefault()
let{mouseSelection:r}=t.inputState,o=n&&r&&r.dragging&&r.dragMove?{from:r.dragging.from,to:r.dragging.to}:null,a={from:s,insert:i},l=t.state.changes(o?[o,a]:a)
t.focus(),t.dispatch({changes:l,selection:{anchor:l.mapPos(s,-1),head:l.mapPos(s,1)},userEvent:o?"move.drop":"input.drop"})}Ae.dragstart=(t,e)=>{let{selection:{main:i}}=t.state,{mouseSelection:n}=t.inputState
n&&(n.dragging=i),e.dataTransfer&&(e.dataTransfer.setData("Text",t.state.sliceDoc(i.from,i.to)),e.dataTransfer.effectAllowed="copyMove")},Ae.drop=(t,e)=>{if(!e.dataTransfer)return
if(t.state.readOnly)return e.preventDefault()
let i=e.dataTransfer.files
if(i&&i.length){e.preventDefault()
let n=Array(i.length),s=0,r=()=>{++s==i.length&&Ne(t,e,n.filter((t=>null!=t)).join(t.state.lineBreak),!1)}
for(let t=0;t<i.length;t++){let e=new FileReader
e.onerror=r,e.onload=()=>{/[\x00-\x08\x0e-\x1f]{2}/.test(e.result)||(n[t]=e.result),r()},e.readAsText(i[t])}}else Ne(t,e,e.dataTransfer.getData("Text"),!0)},Ae.paste=(t,e)=>{if(t.state.readOnly)return e.preventDefault()
t.observer.flush()
let i=Ce?null:e.clipboardData
i?(Ee(t,i.getData("text/plain")),e.preventDefault()):function(t){let e=t.dom.parentNode
if(!e)return
let i=e.appendChild(document.createElement("textarea"))
i.style.cssText="position: fixed; left: -10000px; top: 10px",i.focus(),setTimeout((()=>{t.focus(),i.remove(),Ee(t,i.value)}),50)}(t)}
let Ue=null
function qe(t){setTimeout((()=>{t.hasFocus!=t.inputState.notifiedFocused&&t.update([])}),10)}Ae.copy=Ae.cut=(t,e)=>{let{text:i,ranges:n,linewise:s}=function(t){let e=[],i=[],n=!1
for(let s of t.selection.ranges)s.empty||(e.push(t.sliceDoc(s.from,s.to)),i.push(s))
if(!e.length){let s=-1
for(let{from:n}of t.selection.ranges){let r=t.doc.lineAt(n)
r.number>s&&(e.push(r.text),i.push({from:r.from,to:Math.min(t.doc.length,r.to+1)})),s=r.number}n=!0}return{text:e.join(t.lineBreak),ranges:i,linewise:n}}(t.state)
if(!i&&!s)return
Ue=s?i:null
let r=Ce?null:e.clipboardData
r?(e.preventDefault(),r.clearData(),r.setData("text/plain",i)):function(t,e){let i=t.dom.parentNode
if(!i)return
let n=i.appendChild(document.createElement("textarea"))
n.style.cssText="position: fixed; left: -10000px; top: 10px",n.value=e,n.focus(),n.selectionEnd=e.length,n.selectionStart=0,setTimeout((()=>{n.remove(),t.focus()}),50)}(t,i),"cut"!=e.type||t.state.readOnly||t.dispatch({changes:n,scrollIntoView:!0,userEvent:"delete.cut"})},Ae.focus=t=>{t.inputState.lastFocusTime=Date.now(),t.scrollDOM.scrollTop||!t.inputState.lastScrollTop&&!t.inputState.lastScrollLeft||(t.scrollDOM.scrollTop=t.inputState.lastScrollTop,t.scrollDOM.scrollLeft=t.inputState.lastScrollLeft),qe(t)},Ae.blur=t=>{t.observer.clearSelectionRange(),qe(t)},Ae.compositionstart=Ae.compositionupdate=t=>{null==t.inputState.compositionFirstChange&&(t.inputState.compositionFirstChange=!0),t.inputState.composing<0&&(t.inputState.composing=0)},Ae.compositionend=t=>{t.inputState.composing=-1,t.inputState.compositionEndedAt=Date.now(),t.inputState.compositionFirstChange=null,N.chrome&&N.android&&t.observer.flushSoon(),setTimeout((()=>{t.inputState.composing<0&&t.docView.compositionDeco.size&&t.update([])}),50)},Ae.contextmenu=t=>{t.inputState.lastContextMenu=Date.now()},Ae.beforeinput=(t,e)=>{var i
let n
if(N.chrome&&N.android&&(n=Se.find((t=>t.inputType==e.inputType)))&&(t.observer.delayAndroidKey(n.key,n.keyCode),"Backspace"==n.key||"Delete"==n.key)){let e=(null===(i=window.visualViewport)||void 0===i?void 0:i.height)||0
setTimeout((()=>{var i;((null===(i=window.visualViewport)||void 0===i?void 0:i.height)||0)>e+10&&t.hasFocus&&(t.contentDOM.blur(),t.focus())}),100)}}
const Ye=["pre-wrap","normal","pre-line","break-spaces"]
class ze{constructor(t){this.lineWrapping=t,this.doc=n.Text.empty,this.heightSamples={},this.lineHeight=14,this.charWidth=7,this.lineLength=30,this.heightChanged=!1}heightForGap(t,e){let i=this.doc.lineAt(e).number-this.doc.lineAt(t).number+1
return this.lineWrapping&&(i+=Math.ceil((e-t-i*this.lineLength*.5)/this.lineLength)),this.lineHeight*i}heightForLine(t){return this.lineWrapping?(1+Math.max(0,Math.ceil((t-this.lineLength)/(this.lineLength-5))))*this.lineHeight:this.lineHeight}setDoc(t){return this.doc=t,this}mustRefreshForWrapping(t){return Ye.indexOf(t)>-1!=this.lineWrapping}mustRefreshForHeights(t){let e=!1
for(let i=0;i<t.length;i++){let n=t[i]
n<0?i++:this.heightSamples[Math.floor(10*n)]||(e=!0,this.heightSamples[Math.floor(10*n)]=!0)}return e}refresh(t,e,i,n,s){let r=Ye.indexOf(t)>-1,o=Math.round(e)!=Math.round(this.lineHeight)||this.lineWrapping!=r
if(this.lineWrapping=r,this.lineHeight=e,this.charWidth=i,this.lineLength=n,o){this.heightSamples={}
for(let t=0;t<s.length;t++){let e=s[t]
e<0?t++:this.heightSamples[Math.floor(10*e)]=!0}}return o}}class Be{constructor(t,e){this.from=t,this.heights=e,this.index=0}get more(){return this.index<this.heights.length}}class Ge{constructor(t,e,i,n,s){this.from=t,this.length=e,this.top=i,this.height=n,this.type=s}get to(){return this.from+this.length}get bottom(){return this.top+this.height}join(t){let e=(Array.isArray(this.type)?this.type:[this]).concat(Array.isArray(t.type)?t.type:[t])
return new Ge(this.from,this.length+t.length,this.top,this.height+t.height,e)}}var Fe
!function(t){t[t.ByPos=0]="ByPos",t[t.ByHeight=1]="ByHeight",t[t.ByPosNoHeight=2]="ByPosNoHeight"}(Fe||(Fe={}))
const He=.001
class Ke{constructor(t,e,i=2){this.length=t,this.height=e,this.flags=i}get outdated(){return(2&this.flags)>0}set outdated(t){this.flags=(t?2:0)|-3&this.flags}setHeight(t,e){this.height!=e&&(Math.abs(this.height-e)>He&&(t.heightChanged=!0),this.height=e)}replace(t,e,i){return Ke.of(i)}decomposeLeft(t,e){e.push(this)}decomposeRight(t,e){e.push(this)}applyChanges(t,e,i,n){let s=this
for(let r=n.length-1;r>=0;r--){let{fromA:o,toA:a,fromB:l,toB:h}=n[r],c=s.lineAt(o,Fe.ByPosNoHeight,e,0,0),u=c.to>=a?c:s.lineAt(a,Fe.ByPosNoHeight,e,0,0)
for(h+=u.to-a,a=u.to;r>0&&c.from<=n[r-1].toA;)o=n[r-1].fromA,l=n[r-1].fromB,r--,o<c.from&&(c=s.lineAt(o,Fe.ByPosNoHeight,e,0,0))
l+=c.from-o,o=c.from
let f=si.build(i,t,l,h)
s=s.replace(o,a,f)}return s.updateHeight(i,0)}static empty(){return new ti(0,0)}static of(t){if(1==t.length)return t[0]
let e=0,i=t.length,n=0,s=0
for(;;)if(e==i)if(n>2*s){let s=t[e-1]
s.break?t.splice(--e,1,s.left,null,s.right):t.splice(--e,1,s.left,s.right),i+=1+s.break,n-=s.size}else{if(!(s>2*n))break
{let e=t[i]
e.break?t.splice(i,1,e.left,null,e.right):t.splice(i,1,e.left,e.right),i+=2+e.break,s-=e.size}}else if(n<s){let i=t[e++]
i&&(n+=i.size)}else{let e=t[--i]
e&&(s+=e.size)}let r=0
return null==t[e-1]?(r=1,e--):null==t[e]&&(r=1,i++),new ii(Ke.of(t.slice(0,e)),r,Ke.of(t.slice(i)))}}Ke.prototype.size=1
class Je extends Ke{constructor(t,e,i){super(t,e),this.type=i}blockAt(t,e,i,n){return new Ge(n,this.length,i,this.height,this.type)}lineAt(t,e,i,n,s){return this.blockAt(0,i,n,s)}forEachLine(t,e,i,n,s,r){t<=s+this.length&&e>=s&&r(this.blockAt(0,i,n,s))}updateHeight(t,e=0,i=!1,n){return n&&n.from<=e&&n.more&&this.setHeight(t,n.heights[n.index++]),this.outdated=!1,this}toString(){return`block(${this.length})`}}class ti extends Je{constructor(t,i){super(t,i,e.BlockType.Text),this.collapsed=0,this.widgetHeight=0}replace(t,e,i){let n=i[0]
return 1==i.length&&(n instanceof ti||n instanceof ei&&4&n.flags)&&Math.abs(this.length-n.length)<10?(n instanceof ei?n=new ti(n.length,this.height):n.height=this.height,this.outdated||(n.outdated=!1),n):Ke.of(i)}updateHeight(t,e=0,i=!1,n){return n&&n.from<=e&&n.more?this.setHeight(t,n.heights[n.index++]):(i||this.outdated)&&this.setHeight(t,Math.max(this.widgetHeight,t.heightForLine(this.length-this.collapsed))),this.outdated=!1,this}toString(){return`line(${this.length}${this.collapsed?-this.collapsed:""}${this.widgetHeight?":"+this.widgetHeight:""})`}}class ei extends Ke{constructor(t){super(t,0)}lines(t,e){let i=t.lineAt(e).number,n=t.lineAt(e+this.length).number
return{firstLine:i,lastLine:n,lineHeight:this.height/(n-i+1)}}blockAt(t,i,n,s){let{firstLine:r,lastLine:o,lineHeight:a}=this.lines(i,s),l=Math.max(0,Math.min(o-r,Math.floor((t-n)/a))),{from:h,length:c}=i.line(r+l)
return new Ge(h,c,n+a*l,a,e.BlockType.Text)}lineAt(t,i,n,s,r){if(i==Fe.ByHeight)return this.blockAt(t,n,s,r)
if(i==Fe.ByPosNoHeight){let{from:i,to:s}=n.lineAt(t)
return new Ge(i,s-i,0,0,e.BlockType.Text)}let{firstLine:o,lineHeight:a}=this.lines(n,r),{from:l,length:h,number:c}=n.lineAt(t)
return new Ge(l,h,s+a*(c-o),a,e.BlockType.Text)}forEachLine(t,i,n,s,r,o){let{firstLine:a,lineHeight:l}=this.lines(n,r)
for(let h=Math.max(t,r),c=Math.min(r+this.length,i);h<=c;){let i=n.lineAt(h)
h==t&&(s+=l*(i.number-a)),o(new Ge(i.from,i.length,s,l,e.BlockType.Text)),s+=l,h=i.to+1}}replace(t,e,i){let n=this.length-e
if(n>0){let t=i[i.length-1]
t instanceof ei?i[i.length-1]=new ei(t.length+n):i.push(null,new ei(n-1))}if(t>0){let e=i[0]
e instanceof ei?i[0]=new ei(t+e.length):i.unshift(new ei(t-1),null)}return Ke.of(i)}decomposeLeft(t,e){e.push(new ei(t-1),null)}decomposeRight(t,e){e.push(null,new ei(this.length-t-1))}updateHeight(t,e=0,i=!1,n){let s=e+this.length
if(n&&n.from<=e+this.length&&n.more){let i=[],r=Math.max(e,n.from),o=-1,a=t.heightChanged
for(n.from>e&&i.push(new ei(n.from-e-1).updateHeight(t,e));r<=s&&n.more;){let e=t.doc.lineAt(r).length
i.length&&i.push(null)
let s=n.heights[n.index++];-1==o?o=s:Math.abs(s-o)>=He&&(o=-2)
let a=new ti(e,s)
a.outdated=!1,i.push(a),r+=e+1}r<=s&&i.push(null,new ei(s-r).updateHeight(t,r))
let l=Ke.of(i)
return t.heightChanged=a||o<0||Math.abs(l.height-this.height)>=He||Math.abs(o-this.lines(t.doc,e).lineHeight)>=He,l}return(i||this.outdated)&&(this.setHeight(t,t.heightForGap(e,e+this.length)),this.outdated=!1),this}toString(){return`gap(${this.length})`}}class ii extends Ke{constructor(t,e,i){super(t.length+e+i.length,t.height+i.height,e|(t.outdated||i.outdated?2:0)),this.left=t,this.right=i,this.size=t.size+i.size}get break(){return 1&this.flags}blockAt(t,e,i,n){let s=i+this.left.height
return t<s?this.left.blockAt(t,e,i,n):this.right.blockAt(t,e,s,n+this.left.length+this.break)}lineAt(t,e,i,n,s){let r=n+this.left.height,o=s+this.left.length+this.break,a=e==Fe.ByHeight?t<r:t<o,l=a?this.left.lineAt(t,e,i,n,s):this.right.lineAt(t,e,i,r,o)
if(this.break||(a?l.to<o:l.from>o))return l
let h=e==Fe.ByPosNoHeight?Fe.ByPosNoHeight:Fe.ByPos
return a?l.join(this.right.lineAt(o,h,i,r,o)):this.left.lineAt(o,h,i,n,s).join(l)}forEachLine(t,e,i,n,s,r){let o=n+this.left.height,a=s+this.left.length+this.break
if(this.break)t<a&&this.left.forEachLine(t,e,i,n,s,r),e>=a&&this.right.forEachLine(t,e,i,o,a,r)
else{let l=this.lineAt(a,Fe.ByPos,i,n,s)
t<l.from&&this.left.forEachLine(t,l.from-1,i,n,s,r),l.to>=t&&l.from<=e&&r(l),e>l.to&&this.right.forEachLine(l.to+1,e,i,o,a,r)}}replace(t,e,i){let n=this.left.length+this.break
if(e<n)return this.balanced(this.left.replace(t,e,i),this.right)
if(t>this.left.length)return this.balanced(this.left,this.right.replace(t-n,e-n,i))
let s=[]
t>0&&this.decomposeLeft(t,s)
let r=s.length
for(let o of i)s.push(o)
if(t>0&&ni(s,r-1),e<this.length){let t=s.length
this.decomposeRight(e,s),ni(s,t)}return Ke.of(s)}decomposeLeft(t,e){let i=this.left.length
if(t<=i)return this.left.decomposeLeft(t,e)
e.push(this.left),this.break&&(i++,t>=i&&e.push(null)),t>i&&this.right.decomposeLeft(t-i,e)}decomposeRight(t,e){let i=this.left.length,n=i+this.break
if(t>=n)return this.right.decomposeRight(t-n,e)
t<i&&this.left.decomposeRight(t,e),this.break&&t<n&&e.push(null),e.push(this.right)}balanced(t,e){return t.size>2*e.size||e.size>2*t.size?Ke.of(this.break?[t,null,e]:[t,e]):(this.left=t,this.right=e,this.height=t.height+e.height,this.outdated=t.outdated||e.outdated,this.size=t.size+e.size,this.length=t.length+this.break+e.length,this)}updateHeight(t,e=0,i=!1,n){let{left:s,right:r}=this,o=e+s.length+this.break,a=null
return n&&n.from<=e+s.length&&n.more?a=s=s.updateHeight(t,e,i,n):s.updateHeight(t,e,i),n&&n.from<=o+r.length&&n.more?a=r=r.updateHeight(t,o,i,n):r.updateHeight(t,o,i),a?this.balanced(s,r):(this.height=this.left.height+this.right.height,this.outdated=!1,this)}toString(){return this.left+(this.break?" ":"-")+this.right}}function ni(t,e){let i,n
null==t[e]&&(i=t[e-1])instanceof ei&&(n=t[e+1])instanceof ei&&t.splice(e-1,3,new ei(i.length+1+n.length))}class si{constructor(t,e){this.pos=t,this.oracle=e,this.nodes=[],this.lineStart=-1,this.lineEnd=-1,this.covering=null,this.writtenTo=t}get isCovered(){return this.covering&&this.nodes[this.nodes.length-1]==this.covering}span(t,e){if(this.lineStart>-1){let t=Math.min(e,this.lineEnd),i=this.nodes[this.nodes.length-1]
i instanceof ti?i.length+=t-this.pos:(t>this.pos||!this.isCovered)&&this.nodes.push(new ti(t-this.pos,-1)),this.writtenTo=t,e>t&&(this.nodes.push(null),this.writtenTo++,this.lineStart=-1)}this.pos=e}point(t,e,i){if(t<e||i.heightRelevant){let n=i.widget?i.widget.estimatedHeight:0
n<0&&(n=this.oracle.lineHeight)
let s=e-t
i.block?this.addBlock(new Je(s,n,i.type)):(s||n>=5)&&this.addLineDeco(n,s)}else e>t&&this.span(t,e)
this.lineEnd>-1&&this.lineEnd<this.pos&&(this.lineEnd=this.oracle.doc.lineAt(this.pos).to)}enterLine(){if(this.lineStart>-1)return
let{from:t,to:e}=this.oracle.doc.lineAt(this.pos)
this.lineStart=t,this.lineEnd=e,this.writtenTo<t&&((this.writtenTo<t-1||null==this.nodes[this.nodes.length-1])&&this.nodes.push(this.blankContent(this.writtenTo,t-1)),this.nodes.push(null)),this.pos>t&&this.nodes.push(new ti(this.pos-t,-1)),this.writtenTo=this.pos}blankContent(t,e){let i=new ei(e-t)
return this.oracle.doc.lineAt(t).to==e&&(i.flags|=4),i}ensureLine(){this.enterLine()
let t=this.nodes.length?this.nodes[this.nodes.length-1]:null
if(t instanceof ti)return t
let e=new ti(0,-1)
return this.nodes.push(e),e}addBlock(t){this.enterLine(),t.type!=e.BlockType.WidgetAfter||this.isCovered||this.ensureLine(),this.nodes.push(t),this.writtenTo=this.pos=this.pos+t.length,t.type!=e.BlockType.WidgetBefore&&(this.covering=t)}addLineDeco(t,e){let i=this.ensureLine()
i.length+=e,i.collapsed+=e,i.widgetHeight=Math.max(i.widgetHeight,t),this.writtenTo=this.pos=this.pos+e}finish(t){let e=0==this.nodes.length?null:this.nodes[this.nodes.length-1]
!(this.lineStart>-1)||e instanceof ti||this.isCovered?(this.writtenTo<this.pos||null==e)&&this.nodes.push(this.blankContent(this.writtenTo,this.pos)):this.nodes.push(new ti(0,-1))
let i=t
for(let n of this.nodes)n instanceof ti&&n.updateHeight(this.oracle,i),i+=n?n.length:1
return this.nodes}static build(t,e,i,s){let r=new si(i,t)
return n.RangeSet.spans(e,i,s,r,0),r.finish(i)}}class ri{constructor(){this.changes=[]}compareRange(){}comparePoint(t,e,i,n){(t<e||i&&i.heightRelevant||n&&n.heightRelevant)&&ct(t,e,this.changes,5)}}function oi(t,e){let i=t.getBoundingClientRect(),n=t.ownerDocument,s=n.defaultView||window,r=Math.max(0,i.left),o=Math.min(s.innerWidth,i.right),a=Math.max(0,i.top),l=Math.min(s.innerHeight,i.bottom)
for(let h=t.parentNode;h&&h!=n.body;)if(1==h.nodeType){let e=h,i=window.getComputedStyle(e)
if((e.scrollHeight>e.clientHeight||e.scrollWidth>e.clientWidth)&&"visible"!=i.overflow){let i=e.getBoundingClientRect()
r=Math.max(r,i.left),o=Math.min(o,i.right),a=Math.max(a,i.top),l=h==t.parentNode?i.bottom:Math.min(l,i.bottom)}h="absolute"==i.position||"fixed"==i.position?e.offsetParent:e.parentNode}else{if(11!=h.nodeType)break
h=h.host}return{left:r-i.left,right:Math.max(r,o)-i.left,top:a-(i.top+e),bottom:Math.max(a,l)-(i.top+e)}}function ai(t,e){let i=t.getBoundingClientRect()
return{left:0,right:i.right-i.left,top:e,bottom:i.bottom-(i.top+e)}}class li{constructor(t,e,i){this.from=t,this.to=e,this.size=i}static same(t,e){if(t.length!=e.length)return!1
for(let i=0;i<t.length;i++){let n=t[i],s=e[i]
if(n.from!=s.from||n.to!=s.to||n.size!=s.size)return!1}return!0}draw(t){return rt.replace({widget:new hi(this.size,t)}).range(this.from,this.to)}}class hi extends st{constructor(t,e){super(),this.size=t,this.vertical=e}eq(t){return t.size==this.size&&t.vertical==this.vertical}toDOM(){let t=document.createElement("div")
return this.vertical?t.style.height=this.size+"px":(t.style.width=this.size+"px",t.style.height="2px",t.style.display="inline-block"),t}get estimatedHeight(){return this.vertical?this.size:-1}}class ci{constructor(t){this.state=t,this.pixelViewport={left:0,right:window.innerWidth,top:0,bottom:0},this.inView=!0,this.paddingTop=0,this.paddingBottom=0,this.contentDOMWidth=0,this.contentDOMHeight=0,this.editorHeight=0,this.editorWidth=0,this.scaler=mi,this.scrollTarget=null,this.printing=!1,this.mustMeasureContent=!0,this.defaultTextDirection=e.Direction.LTR,this.visibleRanges=[],this.mustEnforceCursorAssoc=!1
let i=t.facet(Mt).some((t=>"function"!=typeof t&&"cm-lineWrapping"==t.class))
this.heightOracle=new ze(i),this.stateDeco=t.facet(It).filter((t=>"function"!=typeof t)),this.heightMap=Ke.empty().applyChanges(this.stateDeco,n.Text.empty,this.heightOracle.setDoc(t.doc),[new Dt(0,0,0,t.doc.length)]),this.viewport=this.getViewport(0,null),this.updateViewportLines(),this.updateForViewport(),this.lineGaps=this.ensureLineGaps([]),this.lineGapDeco=rt.set(this.lineGaps.map((t=>t.draw(!1)))),this.computeVisibleRanges()}updateForViewport(){let t=[this.viewport],{main:e}=this.state.selection
for(let i=0;i<=1;i++){let n=i?e.head:e.anchor
if(!t.some((({from:t,to:e})=>n>=t&&n<=e))){let{from:e,to:i}=this.lineBlockAt(n)
t.push(new ui(e,i))}}this.viewports=t.sort(((t,e)=>t.from-e.from)),this.scaler=this.heightMap.height<=7e6?mi:new gi(this.heightOracle.doc,this.heightMap,this.viewports)}updateViewportLines(){this.viewportLines=[],this.heightMap.forEachLine(this.viewport.from,this.viewport.to,this.state.doc,0,0,(t=>{this.viewportLines.push(1==this.scaler.scale?t:Oi(t,this.scaler))}))}update(t,e=null){this.state=t.state
let i=this.stateDeco
this.stateDeco=this.state.facet(It).filter((t=>"function"!=typeof t))
let s=t.changedRanges,r=Dt.extendWithRanges(s,function(t,e,i){let s=new ri
return n.RangeSet.compare(t,e,i,s,0),s.changes}(i,this.stateDeco,t?t.changes:n.ChangeSet.empty(this.state.doc.length))),o=this.heightMap.height
this.heightMap=this.heightMap.applyChanges(this.stateDeco,t.startState.doc,this.heightOracle.setDoc(this.state.doc),r),this.heightMap.height!=o&&(t.flags|=2)
let a=r.length?this.mapViewport(this.viewport,t.changes):this.viewport;(e&&(e.range.head<a.from||e.range.head>a.to)||!this.viewportIsAppropriate(a))&&(a=this.getViewport(0,e))
let l=!t.changes.empty||2&t.flags||a.from!=this.viewport.from||a.to!=this.viewport.to
this.viewport=a,this.updateForViewport(),l&&this.updateViewportLines(),(this.lineGaps.length||this.viewport.to-this.viewport.from>4e3)&&this.updateLineGaps(this.ensureLineGaps(this.mapLineGaps(this.lineGaps,t.changes))),t.flags|=this.computeVisibleRanges(),e&&(this.scrollTarget=e),!this.mustEnforceCursorAssoc&&t.selectionSet&&t.view.lineWrapping&&t.state.selection.main.empty&&t.state.selection.main.assoc&&!t.state.facet(St)&&(this.mustEnforceCursorAssoc=!0)}measure(t){let i=t.contentDOM,s=window.getComputedStyle(i),r=this.heightOracle,o=s.whiteSpace
this.defaultTextDirection="rtl"==s.direction?e.Direction.RTL:e.Direction.LTR
let a=this.heightOracle.mustRefreshForWrapping(o),l=a||this.mustMeasureContent||this.contentDOMHeight!=i.clientHeight
this.contentDOMHeight=i.clientHeight,this.mustMeasureContent=!1
let h=0,c=0,u=parseInt(s.paddingTop)||0,f=parseInt(s.paddingBottom)||0
this.paddingTop==u&&this.paddingBottom==f||(this.paddingTop=u,this.paddingBottom=f,h|=10),this.editorWidth!=t.scrollDOM.clientWidth&&(r.lineWrapping&&(l=!0),this.editorWidth=t.scrollDOM.clientWidth,h|=8)
let d=(this.printing?ai:oi)(i,this.paddingTop),p=d.top-this.pixelViewport.top,m=d.bottom-this.pixelViewport.bottom
this.pixelViewport=d
let g=this.pixelViewport.bottom>this.pixelViewport.top&&this.pixelViewport.right>this.pixelViewport.left
if(g!=this.inView&&(this.inView=g,g&&(l=!0)),!this.inView&&!this.scrollTarget)return 0
let O=i.clientWidth
if(this.contentDOMWidth==O&&this.editorHeight==t.scrollDOM.clientHeight||(this.contentDOMWidth=O,this.editorHeight=t.scrollDOM.clientHeight,h|=8),l){let e=t.docView.measureVisibleLineHeights(this.viewport)
if(r.mustRefreshForHeights(e)&&(a=!0),a||r.lineWrapping&&Math.abs(O-this.contentDOMWidth)>r.charWidth){let{lineHeight:i,charWidth:n}=t.docView.measureTextSize()
a=i>0&&r.refresh(o,i,n,O/n,e),a&&(t.docView.minWidth=0,h|=8)}p>0&&m>0?c=Math.max(p,m):p<0&&m<0&&(c=Math.min(p,m)),r.heightChanged=!1
for(let i of this.viewports){let s=i.from==this.viewport.from?e:t.docView.measureVisibleLineHeights(i)
this.heightMap=(a?Ke.empty().applyChanges(this.stateDeco,n.Text.empty,this.heightOracle,[new Dt(0,0,0,t.state.doc.length)]):this.heightMap).updateHeight(r,0,a,new Be(i.from,s))}r.heightChanged&&(h|=2)}let v=!this.viewportIsAppropriate(this.viewport,c)||this.scrollTarget&&(this.scrollTarget.range.head<this.viewport.from||this.scrollTarget.range.head>this.viewport.to)
return v&&(this.viewport=this.getViewport(c,this.scrollTarget)),this.updateForViewport(),(2&h||v)&&this.updateViewportLines(),(this.lineGaps.length||this.viewport.to-this.viewport.from>4e3)&&this.updateLineGaps(this.ensureLineGaps(a?[]:this.lineGaps,t)),h|=this.computeVisibleRanges(),this.mustEnforceCursorAssoc&&(this.mustEnforceCursorAssoc=!1,t.docView.enforceCursorAssoc()),h}get visibleTop(){return this.scaler.fromDOM(this.pixelViewport.top)}get visibleBottom(){return this.scaler.fromDOM(this.pixelViewport.bottom)}getViewport(t,e){let i=.5-Math.max(-.5,Math.min(.5,t/1e3/2)),n=this.heightMap,s=this.state.doc,{visibleTop:r,visibleBottom:o}=this,a=new ui(n.lineAt(r-1e3*i,Fe.ByHeight,s,0,0).from,n.lineAt(o+1e3*(1-i),Fe.ByHeight,s,0,0).to)
if(e){let{head:t}=e.range
if(t<a.from||t>a.to){let i,r=Math.min(this.editorHeight,this.pixelViewport.bottom-this.pixelViewport.top),o=n.lineAt(t,Fe.ByPos,s,0,0)
i="center"==e.y?(o.top+o.bottom)/2-r/2:"start"==e.y||"nearest"==e.y&&t<a.from?o.top:o.bottom-r,a=new ui(n.lineAt(i-500,Fe.ByHeight,s,0,0).from,n.lineAt(i+r+500,Fe.ByHeight,s,0,0).to)}}return a}mapViewport(t,e){let i=e.mapPos(t.from,-1),n=e.mapPos(t.to,1)
return new ui(this.heightMap.lineAt(i,Fe.ByPos,this.state.doc,0,0).from,this.heightMap.lineAt(n,Fe.ByPos,this.state.doc,0,0).to)}viewportIsAppropriate({from:t,to:e},i=0){if(!this.inView)return!0
let{top:n}=this.heightMap.lineAt(t,Fe.ByPos,this.state.doc,0,0),{bottom:s}=this.heightMap.lineAt(e,Fe.ByPos,this.state.doc,0,0),{visibleTop:r,visibleBottom:o}=this
return(0==t||n<=r-Math.max(10,Math.min(-i,250)))&&(e==this.state.doc.length||s>=o+Math.max(10,Math.min(i,250)))&&n>r-2e3&&s<o+2e3}mapLineGaps(t,e){if(!t.length||e.empty)return t
let i=[]
for(let n of t)e.touchesRange(n.from,n.to)||i.push(new li(e.mapPos(n.from),e.mapPos(n.to),n.size))
return i}ensureLineGaps(t,i){let s=this.heightOracle.lineWrapping,r=s?1e4:2e3,o=r>>1,a=r<<1
if(this.defaultTextDirection!=e.Direction.LTR&&!s)return[]
let l=[],h=(e,r,a,c)=>{if(r-e<o)return
let u=this.state.selection.main,f=[u.from]
u.empty||f.push(u.to)
for(let t of f)if(t>e&&t<r)return h(e,t-10,a,c),void h(t+10,r,a,c)
let d=function(t,e){for(let i of t)if(e(i))return i}(t,(t=>t.from>=a.from&&t.to<=a.to&&Math.abs(t.from-e)<o&&Math.abs(t.to-r)<o&&!f.some((e=>t.from<e&&t.to>e))))
if(!d){if(r<a.to&&i&&s&&i.visibleRanges.some((t=>t.from<=r&&t.to>=r))){let t=i.moveToLineBoundary(n.EditorSelection.cursor(r),!1,!0).head
t>e&&(r=t)}d=new li(e,r,this.gapSize(a,e,r,c))}l.push(d)}
for(let e of this.viewportLines){if(e.length<a)continue
let t=fi(e.from,e.to,this.stateDeco)
if(t.total<a)continue
let i,n,o=this.scrollTarget?this.scrollTarget.range.head:null
if(s){let s,a,l=r/this.heightOracle.lineLength*this.heightOracle.lineHeight
if(null!=o){let i=pi(t,o),n=((this.visibleBottom-this.visibleTop)/2+l)/e.height
s=i-n,a=i+n}else s=(this.visibleTop-e.top-l)/e.height,a=(this.visibleBottom-e.top+l)/e.height
i=di(t,s),n=di(t,a)}else{let e,s,a=t.total*this.heightOracle.charWidth,l=r*this.heightOracle.charWidth
if(null!=o){let i=pi(t,o),n=((this.pixelViewport.right-this.pixelViewport.left)/2+l)/a
e=i-n,s=i+n}else e=(this.pixelViewport.left-l)/a,s=(this.pixelViewport.right+l)/a
i=di(t,e),n=di(t,s)}i>e.from&&h(e.from,i,e,t),n<e.to&&h(n,e.to,e,t)}return l}gapSize(t,e,i,n){let s=pi(n,i)-pi(n,e)
return this.heightOracle.lineWrapping?t.height*s:n.total*this.heightOracle.charWidth*s}updateLineGaps(t){li.same(t,this.lineGaps)||(this.lineGaps=t,this.lineGapDeco=rt.set(t.map((t=>t.draw(this.heightOracle.lineWrapping)))))}computeVisibleRanges(){let t=this.stateDeco
this.lineGaps.length&&(t=t.concat(this.lineGapDeco))
let e=[]
n.RangeSet.spans(t,this.viewport.from,this.viewport.to,{span(t,i){e.push({from:t,to:i})},point(){}},20)
let i=e.length!=this.visibleRanges.length||this.visibleRanges.some(((t,i)=>t.from!=e[i].from||t.to!=e[i].to))
return this.visibleRanges=e,i?4:0}lineBlockAt(t){return t>=this.viewport.from&&t<=this.viewport.to&&this.viewportLines.find((e=>e.from<=t&&e.to>=t))||Oi(this.heightMap.lineAt(t,Fe.ByPos,this.state.doc,0,0),this.scaler)}lineBlockAtHeight(t){return Oi(this.heightMap.lineAt(this.scaler.fromDOM(t),Fe.ByHeight,this.state.doc,0,0),this.scaler)}elementAtHeight(t){return Oi(this.heightMap.blockAt(this.scaler.fromDOM(t),this.state.doc,0,0),this.scaler)}get docHeight(){return this.scaler.toDOM(this.heightMap.height)}get contentHeight(){return this.docHeight+this.paddingTop+this.paddingBottom}}class ui{constructor(t,e){this.from=t,this.to=e}}function fi(t,e,i){let s=[],r=t,o=0
return n.RangeSet.spans(i,t,e,{span(){},point(t,e){t>r&&(s.push({from:r,to:t}),o+=t-r),r=e}},20),r<e&&(s.push({from:r,to:e}),o+=e-r),{total:o,ranges:s}}function di({total:t,ranges:e},i){if(i<=0)return e[0].from
if(i>=1)return e[e.length-1].to
let n=Math.floor(t*i)
for(let s=0;;s++){let{from:t,to:i}=e[s],r=i-t
if(n<=r)return t+n
n-=r}}function pi(t,e){let i=0
for(let{from:n,to:s}of t.ranges){if(e<=s){i+=e-n
break}i+=s-n}return i/t.total}const mi={toDOM:t=>t,fromDOM:t=>t,scale:1}
class gi{constructor(t,e,i){let n=0,s=0,r=0
this.viewports=i.map((({from:i,to:s})=>{let r=e.lineAt(i,Fe.ByPos,t,0,0).top,o=e.lineAt(s,Fe.ByPos,t,0,0).bottom
return n+=o-r,{from:i,to:s,top:r,bottom:o,domTop:0,domBottom:0}})),this.scale=(7e6-n)/(e.height-n)
for(let o of this.viewports)o.domTop=r+(o.top-s)*this.scale,r=o.domBottom=o.domTop+(o.bottom-o.top),s=o.bottom}toDOM(t){for(let e=0,i=0,n=0;;e++){let s=e<this.viewports.length?this.viewports[e]:null
if(!s||t<s.top)return n+(t-i)*this.scale
if(t<=s.bottom)return s.domTop+(t-s.top)
i=s.bottom,n=s.domBottom}}fromDOM(t){for(let e=0,i=0,n=0;;e++){let s=e<this.viewports.length?this.viewports[e]:null
if(!s||t<s.domTop)return i+(t-n)/this.scale
if(t<=s.domBottom)return s.top+(t-s.domTop)
i=s.bottom,n=s.domBottom}}}function Oi(t,e){if(1==e.scale)return t
let i=e.toDOM(t.top),n=e.toDOM(t.bottom)
return new Ge(t.from,t.length,i,n-i,Array.isArray(t.type)?t.type.map((t=>Oi(t,e))):t.type)}const vi=n.Facet.define({combine:t=>t.join(" ")}),yi=n.Facet.define({combine:t=>t.indexOf(!0)>-1}),bi=s.StyleModule.newName(),wi=s.StyleModule.newName(),xi=s.StyleModule.newName(),Si={"&light":"."+wi,"&dark":"."+xi}
function ki(t,e,i){return new s.StyleModule(e,{finish:e=>/&/.test(e)?e.replace(/&\w*/,(e=>{if("&"==e)return t
if(!i||!i[e])throw new RangeError(`Unsupported selector: ${e}`)
return i[e]})):t+" "+e})}const Qi=ki("."+bi,{"&.cm-editor":{position:"relative !important",boxSizing:"border-box","&.cm-focused":{outline:"1px dotted #212121"},display:"flex !important",flexDirection:"column"},".cm-scroller":{display:"flex !important",alignItems:"flex-start !important",fontFamily:"monospace",lineHeight:1.4,height:"100%",overflowX:"auto",position:"relative",zIndex:0},".cm-content":{margin:0,flexGrow:2,flexShrink:0,display:"block",whiteSpace:"pre",wordWrap:"normal",boxSizing:"border-box",padding:"4px 0",outline:"none","&[contenteditable=true]":{WebkitUserModify:"read-write-plaintext-only"}},".cm-lineWrapping":{whiteSpace_fallback:"pre-wrap",whiteSpace:"break-spaces",wordBreak:"break-word",overflowWrap:"anywhere",flexShrink:1},"&light .cm-content":{caretColor:"black"},"&dark .cm-content":{caretColor:"white"},".cm-line":{display:"block",padding:"0 2px 0 6px"},".cm-layer":{contain:"size style","& > *":{position:"absolute"}},"&light .cm-selectionBackground":{background:"#d9d9d9"},"&dark .cm-selectionBackground":{background:"#222"},"&light.cm-focused .cm-selectionBackground":{background:"#d7d4f0"},"&dark.cm-focused .cm-selectionBackground":{background:"#233"},".cm-cursorLayer":{pointerEvents:"none"},"&.cm-focused .cm-cursorLayer":{animation:"steps(1) cm-blink 1.2s infinite"},"@keyframes cm-blink":{"0%":{},"50%":{opacity:0},"100%":{}},"@keyframes cm-blink2":{"0%":{},"50%":{opacity:0},"100%":{}},".cm-cursor, .cm-dropCursor":{borderLeft:"1.2px solid black",marginLeft:"-0.6px",pointerEvents:"none"},".cm-cursor":{display:"none"},"&dark .cm-cursor":{borderLeftColor:"#444"},"&.cm-focused .cm-cursor":{display:"block"},"&light .cm-activeLine":{backgroundColor:"#cceeff44"},"&dark .cm-activeLine":{backgroundColor:"#99eeff33"},"&light .cm-specialChar":{color:"red"},"&dark .cm-specialChar":{color:"#f78"},".cm-gutters":{flexShrink:0,display:"flex",height:"100%",boxSizing:"border-box",left:0,zIndex:200},"&light .cm-gutters":{backgroundColor:"#f5f5f5",color:"#6c6c6c",borderRight:"1px solid #ddd"},"&dark .cm-gutters":{backgroundColor:"#333338",color:"#ccc"},".cm-gutter":{display:"flex !important",flexDirection:"column",flexShrink:0,boxSizing:"border-box",minHeight:"100%",overflow:"hidden"},".cm-gutterElement":{boxSizing:"border-box"},".cm-lineNumbers .cm-gutterElement":{padding:"0 3px 0 5px",minWidth:"20px",textAlign:"right",whiteSpace:"nowrap"},"&light .cm-activeLineGutter":{backgroundColor:"#e2f2ff"},"&dark .cm-activeLineGutter":{backgroundColor:"#222227"},".cm-panels":{boxSizing:"border-box",position:"sticky",left:0,right:0},"&light .cm-panels":{backgroundColor:"#f5f5f5",color:"black"},"&light .cm-panels-top":{borderBottom:"1px solid #ddd"},"&light .cm-panels-bottom":{borderTop:"1px solid #ddd"},"&dark .cm-panels":{backgroundColor:"#333338",color:"white"},".cm-tab":{display:"inline-block",overflow:"hidden",verticalAlign:"bottom"},".cm-widgetBuffer":{verticalAlign:"text-top",height:"1em",width:0,display:"inline"},".cm-placeholder":{color:"#888",display:"inline-block",verticalAlign:"top"},".cm-highlightSpace:before":{content:"attr(data-display)",position:"absolute",pointerEvents:"none",color:"#888"},".cm-highlightTab":{backgroundImage:'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="20"><path stroke="%23888" stroke-width="1" fill="none" d="M1 10H196L190 5M190 15L196 10M197 4L197 16"/></svg>\')',backgroundSize:"auto 100%",backgroundPosition:"right 90%",backgroundRepeat:"no-repeat"},".cm-trailingSpace":{backgroundColor:"#ff332255"},".cm-button":{verticalAlign:"middle",color:"inherit",fontSize:"70%",padding:".2em 1em",borderRadius:"1px"},"&light .cm-button":{backgroundImage:"linear-gradient(#eff1f5, #d9d9df)",border:"1px solid #888","&:active":{backgroundImage:"linear-gradient(#b4b4b4, #d0d3d6)"}},"&dark .cm-button":{backgroundImage:"linear-gradient(#393939, #111)",border:"1px solid #888","&:active":{backgroundImage:"linear-gradient(#111, #333)"}},".cm-textfield":{verticalAlign:"middle",color:"inherit",fontSize:"70%",border:"1px solid silver",padding:".2em .5em"},"&light .cm-textfield":{backgroundColor:"white"},"&dark .cm-textfield":{border:"1px solid #555",backgroundColor:"inherit"}},Si)
class Pi{constructor(t,e,i,s){this.typeOver=s,this.bounds=null,this.text=""
let{impreciseHead:r,impreciseAnchor:o}=t.docView
if(t.state.readOnly&&e>-1)this.newSel=null
else if(e>-1&&(this.bounds=t.docView.domBoundsAround(e,i,0))){let e=r||o?[]:function(t){let e=[]
if(t.root.activeElement!=t.contentDOM)return e
let{anchorNode:i,anchorOffset:n,focusNode:s,focusOffset:r}=t.observer.selectionRange
return i&&(e.push(new se(i,n)),s==i&&r==n||e.push(new se(s,r))),e}(t),i=new ie(e,t.state)
i.readRange(this.bounds.startDOM,this.bounds.endDOM),this.text=i.text,this.newSel=function(t,e){if(0==t.length)return null
let i=t[0].pos,s=2==t.length?t[1].pos:i
return i>-1&&s>-1?n.EditorSelection.single(i+e,s+e):null}(e,this.bounds.from)}else{let e=t.observer.selectionRange,i=r&&r.node==e.focusNode&&r.offset==e.focusOffset||!a(t.contentDOM,e.focusNode)?t.state.selection.main.head:t.docView.posFromDOM(e.focusNode,e.focusOffset),s=o&&o.node==e.anchorNode&&o.offset==e.anchorOffset||!a(t.contentDOM,e.anchorNode)?t.state.selection.main.anchor:t.docView.posFromDOM(e.anchorNode,e.anchorOffset)
this.newSel=n.EditorSelection.single(s,i)}}}function Ti(t,e){let i,{newSel:s}=e,r=t.state.selection.main
if(e.bounds){let{from:s,to:o}=e.bounds,a=r.from,l=null;(8===t.inputState.lastKeyCode&&t.inputState.lastKeyTime>Date.now()-100||N.android&&e.text.length<o-s)&&(a=r.to,l="end")
let h=function(t,e,i,n){let s=Math.min(t.length,e.length),r=0
for(;r<s&&t.charCodeAt(r)==e.charCodeAt(r);)r++
if(r==s&&t.length==e.length)return null
let o=t.length,a=e.length
for(;o>0&&a>0&&t.charCodeAt(o-1)==e.charCodeAt(a-1);)o--,a--
return"end"==n&&(i-=o+Math.max(0,r-Math.min(o,a))-r),o<r&&t.length<e.length?(r-=i<=r&&i>=o?r-i:0,a=r+(a-o),o=r):a<r&&(r-=i<=r&&i>=a?r-i:0,o=r+(o-a),a=r),{from:r,toA:o,toB:a}}(t.state.doc.sliceString(s,o,ee),e.text,a-s,l)
h&&(N.chrome&&13==t.inputState.lastKeyCode&&h.toB==h.from+2&&"￿￿"==e.text.slice(h.from,h.toB)&&h.toB--,i={from:s+h.from,to:s+h.toA,insert:n.Text.of(e.text.slice(h.from,h.toB).split(ee))})}else!s||t.hasFocus&&t.state.facet(Tt)&&!s.main.eq(r)||(s=null)
if(!i&&!s)return!1
if(!i&&e.typeOver&&!r.empty&&s&&s.main.empty?i={from:r.from,to:r.to,insert:t.state.doc.slice(r.from,r.to)}:i&&i.from>=r.from&&i.to<=r.to&&(i.from!=r.from||i.to!=r.to)&&r.to-r.from-(i.to-i.from)<=4?i={from:r.from,to:r.to,insert:t.state.doc.slice(r.from,i.from).append(i.insert).append(t.state.doc.slice(i.to,r.to))}:(N.mac||N.android)&&i&&i.from==i.to&&i.from==r.head-1&&/^\. ?$/.test(i.insert.toString())?(s&&2==i.insert.length&&(s=n.EditorSelection.single(s.main.anchor-1,s.main.head-1)),i={from:r.from,to:r.to,insert:n.Text.of([" "])}):N.chrome&&i&&i.from==i.to&&i.from==r.head&&"\n "==i.insert.toString()&&t.lineWrapping&&(s&&(s=n.EditorSelection.single(s.main.anchor-1,s.main.head-1)),i={from:r.from,to:r.to,insert:n.Text.of([" "])}),i){let e=t.state
if(N.ios&&t.inputState.flushIOSKey(t))return!0
if(N.android&&(i.from==r.from&&i.to==r.to&&1==i.insert.length&&2==i.insert.lines&&x(t.contentDOM,"Enter",13)||i.from==r.from-1&&i.to==r.to&&0==i.insert.length&&x(t.contentDOM,"Backspace",8)||i.from==r.from&&i.to==r.to+1&&0==i.insert.length&&x(t.contentDOM,"Delete",46)))return!0
let o,a=i.insert.toString()
if(t.state.facet(wt).some((e=>e(t,i.from,i.to,a))))return!0
if(t.inputState.composing>=0&&t.inputState.composing++,i.from>=r.from&&i.to<=r.to&&i.to-i.from>=(r.to-r.from)/3&&(!s||s.main.empty&&s.main.from==i.from+i.insert.length)&&t.inputState.composing<0){let n=r.from<i.from?e.sliceDoc(r.from,i.from):"",s=r.to>i.to?e.sliceDoc(i.to,r.to):""
o=e.replaceSelection(t.state.toText(n+i.insert.sliceString(0,void 0,t.state.lineBreak)+s))}else{let a=e.changes(i),l=s&&!e.selection.main.eq(s.main)&&s.main.to<=a.newLength?s.main:void 0
if(e.selection.ranges.length>1&&t.inputState.composing>=0&&i.to<=r.to&&i.to>=r.to-10){let s=t.state.sliceDoc(i.from,i.to),h=ae(t)||t.state.doc.lineAt(r.head),c=r.to-i.to,u=r.to-r.from
o=e.changeByRange((o=>{if(o.from==r.from&&o.to==r.to)return{changes:a,range:l||o.map(a)}
let f=o.to-c,d=f-s.length
if(o.to-o.from!=u||t.state.sliceDoc(d,f)!=s||h&&o.to>=h.from&&o.from<=h.to)return{range:o}
let p=e.changes({from:d,to:f,insert:i.insert}),m=o.to-r.to
return{changes:p,range:l?n.EditorSelection.range(Math.max(0,l.anchor+m),Math.max(0,l.head+m)):o.map(p)}}))}else o={changes:a,selection:l&&e.selection.replaceRange(l)}}let l="input.type"
return t.composing&&(l+=".compose",t.inputState.compositionFirstChange&&(l+=".start",t.inputState.compositionFirstChange=!1)),t.dispatch(o,{scrollIntoView:!0,userEvent:l}),!0}if(s&&!s.main.eq(r)){let e=!1,i="select"
return t.inputState.lastSelectionTime>Date.now()-50&&("select"==t.inputState.lastSelectionOrigin&&(e=!0),i=t.inputState.lastSelectionOrigin),t.dispatch({selection:s,scrollIntoView:e,userEvent:i}),!0}return!1}const $i={childList:!0,characterData:!0,subtree:!0,attributes:!0,characterDataOldValue:!0},Ai=N.ie&&N.ie_version<=11
class _i{constructor(t){this.view=t,this.active=!1,this.selectionRange=new O,this.selectionChanged=!1,this.delayedFlush=-1,this.resizeTimeout=-1,this.queue=[],this.delayedAndroidKey=null,this.flushingAndroidKey=-1,this.lastChange=0,this.scrollTargets=[],this.intersection=null,this.resizeScroll=null,this.resizeContent=null,this.intersecting=!1,this.gapIntersection=null,this.gaps=[],this.parentCheck=-1,this.dom=t.contentDOM,this.observer=new MutationObserver((e=>{for(let t of e)this.queue.push(t);(N.ie&&N.ie_version<=11||N.ios&&t.composing)&&e.some((t=>"childList"==t.type&&t.removedNodes.length||"characterData"==t.type&&t.oldValue.length>t.target.nodeValue.length))?this.flushSoon():this.flush()})),Ai&&(this.onCharData=t=>{this.queue.push({target:t.target,type:"characterData",oldValue:t.prevValue}),this.flushSoon()}),this.onSelectionChange=this.onSelectionChange.bind(this),this.onResize=this.onResize.bind(this),this.onPrint=this.onPrint.bind(this),this.onScroll=this.onScroll.bind(this),"function"==typeof ResizeObserver&&(this.resizeScroll=new ResizeObserver((()=>{var t;(null===(t=this.view.docView)||void 0===t?void 0:t.lastUpdate)<Date.now()-75&&this.onResize()})),this.resizeScroll.observe(t.scrollDOM),this.resizeContent=new ResizeObserver((()=>this.view.requestMeasure())),this.resizeContent.observe(t.contentDOM)),this.addWindowListeners(this.win=t.win),this.start(),"function"==typeof IntersectionObserver&&(this.intersection=new IntersectionObserver((t=>{this.parentCheck<0&&(this.parentCheck=setTimeout(this.listenForScroll.bind(this),1e3)),t.length>0&&t[t.length-1].intersectionRatio>0!=this.intersecting&&(this.intersecting=!this.intersecting,this.intersecting!=this.view.inView&&this.onScrollChanged(document.createEvent("Event")))}),{}),this.intersection.observe(this.dom),this.gapIntersection=new IntersectionObserver((t=>{t.length>0&&t[t.length-1].intersectionRatio>0&&this.onScrollChanged(document.createEvent("Event"))}),{})),this.listenForScroll(),this.readSelectionRange()}onScrollChanged(t){this.view.inputState.runScrollHandlers(this.view,t),this.intersecting&&this.view.measure()}onScroll(t){this.intersecting&&this.flush(!1),this.onScrollChanged(t)}onResize(){this.resizeTimeout<0&&(this.resizeTimeout=setTimeout((()=>{this.resizeTimeout=-1,this.view.requestMeasure()}),50))}onPrint(){this.view.viewState.printing=!0,this.view.measure(),setTimeout((()=>{this.view.viewState.printing=!1,this.view.requestMeasure()}),500)}updateGaps(t){if(this.gapIntersection&&(t.length!=this.gaps.length||this.gaps.some(((e,i)=>e!=t[i])))){this.gapIntersection.disconnect()
for(let e of t)this.gapIntersection.observe(e)
this.gaps=t}}onSelectionChange(t){let e=this.selectionChanged
if(!this.readSelectionRange()||this.delayedAndroidKey)return
let{view:i}=this,n=this.selectionRange
if(i.state.facet(Tt)?i.root.activeElement!=this.dom:!l(i.dom,n))return
let s=n.anchorNode&&i.docView.nearest(n.anchorNode)
s&&s.ignoreEvent(t)?e||(this.selectionChanged=!1):(N.ie&&N.ie_version<=11||N.android&&N.chrome)&&!i.state.selection.main.empty&&n.focusNode&&c(n.focusNode,n.focusOffset,n.anchorNode,n.anchorOffset)?this.flushSoon():this.flush(!1)}readSelectionRange(){let{view:t}=this,e=N.safari&&11==t.root.nodeType&&function(t){let e=t.activeElement
for(;e&&e.shadowRoot;)e=e.shadowRoot.activeElement
return e}(this.dom.ownerDocument)==this.dom&&function(t){let e=null
function i(t){t.preventDefault(),t.stopImmediatePropagation(),e=t.getTargetRanges()[0]}if(t.contentDOM.addEventListener("beforeinput",i,!0),t.dom.ownerDocument.execCommand("indent"),t.contentDOM.removeEventListener("beforeinput",i,!0),!e)return null
let n=e.startContainer,s=e.startOffset,r=e.endContainer,o=e.endOffset,a=t.docView.domAtPos(t.state.selection.main.anchor)
return c(a.node,a.offset,r,o)&&([n,s,r,o]=[r,o,n,s]),{anchorNode:n,anchorOffset:s,focusNode:r,focusOffset:o}}(this.view)||o(t.root)
if(!e||this.selectionRange.eq(e))return!1
let i=l(this.dom,e)
return i&&!this.selectionChanged&&t.inputState.lastFocusTime>Date.now()-200&&t.inputState.lastTouchTime<Date.now()-300&&function(t,e){let i=e.focusNode,n=e.focusOffset
if(!i||e.anchorNode!=i||e.anchorOffset!=n)return!1
for(;;)if(n){if(1!=i.nodeType)return!1
let t=i.childNodes[n-1]
"false"==t.contentEditable?n--:(i=t,n=d(i))}else{if(i==t)return!0
n=u(i),i=i.parentNode}}(this.dom,e)?(this.view.inputState.lastFocusTime=0,t.docView.updateSelection(),!1):(this.selectionRange.setRange(e),i&&(this.selectionChanged=!0),!0)}setSelectionRange(t,e){this.selectionRange.set(t.node,t.offset,e.node,e.offset),this.selectionChanged=!1}clearSelectionRange(){this.selectionRange.set(null,0,null,0)}listenForScroll(){this.parentCheck=-1
let t=0,e=null
for(let i=this.dom;i;)if(1==i.nodeType)!e&&t<this.scrollTargets.length&&this.scrollTargets[t]==i?t++:e||(e=this.scrollTargets.slice(0,t)),e&&e.push(i),i=i.assignedSlot||i.parentNode
else{if(11!=i.nodeType)break
i=i.host}if(t<this.scrollTargets.length&&!e&&(e=this.scrollTargets.slice(0,t)),e){for(let t of this.scrollTargets)t.removeEventListener("scroll",this.onScroll)
for(let t of this.scrollTargets=e)t.addEventListener("scroll",this.onScroll)}}ignore(t){if(!this.active)return t()
try{return this.stop(),t()}finally{this.start(),this.clear()}}start(){this.active||(this.observer.observe(this.dom,$i),Ai&&this.dom.addEventListener("DOMCharacterDataModified",this.onCharData),this.active=!0)}stop(){this.active&&(this.active=!1,this.observer.disconnect(),Ai&&this.dom.removeEventListener("DOMCharacterDataModified",this.onCharData))}clear(){this.processRecords(),this.queue.length=0,this.selectionChanged=!1}delayAndroidKey(t,e){var i
if(!this.delayedAndroidKey){let t=()=>{let t=this.delayedAndroidKey
t&&(this.clearDelayedAndroidKey(),!this.flush()&&t.force&&x(this.dom,t.key,t.keyCode))}
this.flushingAndroidKey=this.view.win.requestAnimationFrame(t)}this.delayedAndroidKey&&"Enter"!=t||(this.delayedAndroidKey={key:t,keyCode:e,force:this.lastChange<Date.now()-50||!!(null===(i=this.delayedAndroidKey)||void 0===i?void 0:i.force)})}clearDelayedAndroidKey(){this.win.cancelAnimationFrame(this.flushingAndroidKey),this.delayedAndroidKey=null,this.flushingAndroidKey=-1}flushSoon(){this.delayedFlush<0&&(this.delayedFlush=this.view.win.requestAnimationFrame((()=>{this.delayedFlush=-1,this.flush()})))}forceFlush(){this.delayedFlush>=0&&(this.view.win.cancelAnimationFrame(this.delayedFlush),this.delayedFlush=-1),this.flush()}processRecords(){let t=this.queue
for(let s of this.observer.takeRecords())t.push(s)
t.length&&(this.queue=[])
let e=-1,i=-1,n=!1
for(let s of t){let t=this.readMutation(s)
t&&(t.typeOver&&(n=!0),-1==e?({from:e,to:i}=t):(e=Math.min(t.from,e),i=Math.max(t.to,i)))}return{from:e,to:i,typeOver:n}}readChange(){let{from:t,to:e,typeOver:i}=this.processRecords(),n=this.selectionChanged&&l(this.dom,this.selectionRange)
return t<0&&!n?null:(t>-1&&(this.lastChange=Date.now()),this.view.inputState.lastFocusTime=0,this.selectionChanged=!1,new Pi(this.view,t,e,i))}flush(t=!0){if(this.delayedFlush>=0||this.delayedAndroidKey)return!1
t&&this.readSelectionRange()
let e=this.readChange()
if(!e)return!1
let i=this.view.state,n=Ti(this.view,e)
return this.view.state==i&&this.view.update([]),n}readMutation(t){let e=this.view.docView.nearest(t.target)
if(!e||e.ignoreMutation(t))return null
if(e.markDirty("attributes"==t.type),"attributes"==t.type&&(e.dirty|=4),"childList"==t.type){let i=Ci(e,t.previousSibling||t.target.previousSibling,-1),n=Ci(e,t.nextSibling||t.target.nextSibling,1)
return{from:i?e.posAfter(i):e.posAtStart,to:n?e.posBefore(n):e.posAtEnd,typeOver:!1}}return"characterData"==t.type?{from:e.posAtStart,to:e.posAtEnd,typeOver:t.target.nodeValue==t.oldValue}:null}setWindow(t){t!=this.win&&(this.removeWindowListeners(this.win),this.win=t,this.addWindowListeners(this.win))}addWindowListeners(t){t.addEventListener("resize",this.onResize),t.addEventListener("beforeprint",this.onPrint),t.addEventListener("scroll",this.onScroll),t.document.addEventListener("selectionchange",this.onSelectionChange)}removeWindowListeners(t){t.removeEventListener("scroll",this.onScroll),t.removeEventListener("resize",this.onResize),t.removeEventListener("beforeprint",this.onPrint),t.document.removeEventListener("selectionchange",this.onSelectionChange)}destroy(){var t,e,i,n
this.stop(),null===(t=this.intersection)||void 0===t||t.disconnect(),null===(e=this.gapIntersection)||void 0===e||e.disconnect(),null===(i=this.resizeScroll)||void 0===i||i.disconnect(),null===(n=this.resizeContent)||void 0===n||n.disconnect()
for(let s of this.scrollTargets)s.removeEventListener("scroll",this.onScroll)
this.removeWindowListeners(this.win),clearTimeout(this.parentCheck),clearTimeout(this.resizeTimeout),this.win.cancelAnimationFrame(this.delayedFlush),this.win.cancelAnimationFrame(this.flushingAndroidKey)}}function Ci(t,e,i){for(;e;){let n=P.get(e)
if(n&&n.parent==t)return n
let s=e.parentNode
e=s!=t.dom?s:i>0?e.nextSibling:e.previousSibling}return null}class Ei{constructor(t={}){this.plugins=[],this.pluginMap=new Map,this.editorAttrs={},this.contentAttrs={},this.bidiCache=[],this.destroyed=!1,this.updateState=2,this.measureScheduled=-1,this.measureRequests=[],this.contentDOM=document.createElement("div"),this.scrollDOM=document.createElement("div"),this.scrollDOM.tabIndex=-1,this.scrollDOM.className="cm-scroller",this.scrollDOM.appendChild(this.contentDOM),this.announceDOM=document.createElement("div"),this.announceDOM.style.cssText="position: fixed; top: -10000px",this.announceDOM.setAttribute("aria-live","polite"),this.dom=document.createElement("div"),this.dom.appendChild(this.announceDOM),this.dom.appendChild(this.scrollDOM),this._dispatch=t.dispatch||(t=>this.update([t])),this.dispatch=this.dispatch.bind(this),this._root=t.root||function(t){for(;t;){if(t&&(9==t.nodeType||11==t.nodeType&&t.host))return t
t=t.assignedSlot||t.parentNode}return null}(t.parent)||document,this.viewState=new ci(t.state||n.EditorState.create(t)),this.plugins=this.state.facet(At).map((t=>new Ct(t)))
for(let e of this.plugins)e.update(this)
this.observer=new _i(this),this.inputState=new xe(this),this.inputState.ensureHandlers(this,this.plugins),this.docView=new re(this),this.mountStyles(),this.updateAttrs(),this.updateState=0,this.requestMeasure(),t.parent&&t.parent.appendChild(this.dom)}get state(){return this.viewState.state}get viewport(){return this.viewState.viewport}get visibleRanges(){return this.viewState.visibleRanges}get inView(){return this.viewState.inView}get composing(){return this.inputState.composing>0}get compositionStarted(){return this.inputState.composing>=0}get root(){return this._root}get win(){return this.dom.ownerDocument.defaultView||window}dispatch(...t){this._dispatch(1==t.length&&t[0]instanceof n.Transaction?t[0]:this.state.update(...t))}update(t){if(0!=this.updateState)throw new Error("Calls to EditorView.update are not allowed while an update is in progress")
let e,i=!1,s=!1,r=this.state
for(let n of t){if(n.startState!=r)throw new RangeError("Trying to update state with a transaction that doesn't start from the previous state.")
r=n.state}if(this.destroyed)return void(this.viewState.state=r)
let o=this.observer.delayedAndroidKey,a=null
if(o?(this.observer.clearDelayedAndroidKey(),a=this.observer.readChange(),(a&&!this.state.doc.eq(r.doc)||!this.state.selection.eq(r.selection))&&(a=null)):this.observer.clear(),r.facet(n.EditorState.phrases)!=this.state.facet(n.EditorState.phrases))return this.setState(r)
e=Vt.create(this,r,t)
let l=this.viewState.scrollTarget
try{this.updateState=2
for(let e of t){if(l&&(l=l.map(e.changes)),e.scrollIntoView){let{main:t}=e.state.selection
l=new kt(t.empty?t:n.EditorSelection.cursor(t.head,t.head>t.anchor?-1:1))}for(let t of e.effects)t.is(Qt)&&(l=t.value)}this.viewState.update(e,l),this.bidiCache=Wi.update(this.bidiCache,e.changes),e.empty||(this.updatePlugins(e),this.inputState.update(e)),i=this.docView.update(e),this.state.facet(Zt)!=this.styleModules&&this.mountStyles(),s=this.updateAttrs(),this.showAnnouncements(t),this.docView.updateSelection(i,t.some((t=>t.isUserEvent("select.pointer"))))}finally{this.updateState=0}if(e.startState.facet(vi)!=e.state.facet(vi)&&(this.viewState.mustMeasureContent=!0),(i||s||l||this.viewState.mustEnforceCursorAssoc||this.viewState.mustMeasureContent)&&this.requestMeasure(),!e.empty)for(let n of this.state.facet(bt))n(e)
a&&!Ti(this,a)&&o.force&&x(this.contentDOM,o.key,o.keyCode)}setState(t){if(0!=this.updateState)throw new Error("Calls to EditorView.setState are not allowed while an update is in progress")
if(this.destroyed)return void(this.viewState.state=t)
this.updateState=2
let e=this.hasFocus
try{for(let t of this.plugins)t.destroy(this)
this.viewState=new ci(t),this.plugins=t.facet(At).map((t=>new Ct(t))),this.pluginMap.clear()
for(let t of this.plugins)t.update(this)
this.docView=new re(this),this.inputState.ensureHandlers(this,this.plugins),this.mountStyles(),this.updateAttrs(),this.bidiCache=[]}finally{this.updateState=0}e&&this.focus(),this.requestMeasure()}updatePlugins(t){let e=t.startState.facet(At),i=t.state.facet(At)
if(e!=i){let n=[]
for(let s of i){let i=e.indexOf(s)
if(i<0)n.push(new Ct(s))
else{let e=this.plugins[i]
e.mustUpdate=t,n.push(e)}}for(let e of this.plugins)e.mustUpdate!=t&&e.destroy(this)
this.plugins=n,this.pluginMap.clear(),this.inputState.ensureHandlers(this,this.plugins)}else for(let n of this.plugins)n.mustUpdate=t
for(let n=0;n<this.plugins.length;n++)this.plugins[n].update(this)}measure(t=!0){if(this.destroyed)return
this.measureScheduled>-1&&cancelAnimationFrame(this.measureScheduled),this.measureScheduled=0,t&&this.observer.forceFlush()
let e=null,{scrollHeight:i,scrollTop:n,clientHeight:s}=this.scrollDOM,r=n>i-s-4?i:n
try{for(let i=0;;i++){this.updateState=1
let n=this.viewport,s=this.viewState.lineBlockAtHeight(r),o=this.viewState.measure(this)
if(!o&&!this.measureRequests.length&&null==this.viewState.scrollTarget)break
if(i>5){console.warn(this.measureRequests.length?"Measure loop restarted more than 5 times":"Viewport failed to stabilize")
break}let a=[]
4&o||([this.measureRequests,a]=[a,this.measureRequests])
let l=a.map((t=>{try{return t.read(this)}catch(t){return Pt(this.state,t),Ii}})),h=Vt.create(this,this.state,[]),c=!1,u=!1
h.flags|=o,e?e.flags|=o:e=h,this.updateState=2,h.empty||(this.updatePlugins(h),this.inputState.update(h),this.updateAttrs(),c=this.docView.update(h))
for(let e=0;e<a.length;e++)if(l[e]!=Ii)try{let t=a[e]
t.write&&t.write(l[e],this)}catch(t){Pt(this.state,t)}if(this.viewState.editorHeight)if(this.viewState.scrollTarget)this.docView.scrollIntoView(this.viewState.scrollTarget),this.viewState.scrollTarget=null,u=!0
else{let t=this.viewState.lineBlockAt(s.from).top-s.top;(t>1||t<-1)&&(this.scrollDOM.scrollTop+=t,u=!0)}if(c&&this.docView.updateSelection(!0),this.viewport.from==n.from&&this.viewport.to==n.to&&!u&&0==this.measureRequests.length)break}}finally{this.updateState=0,this.measureScheduled=-1}if(e&&!e.empty)for(let o of this.state.facet(bt))o(e)}get themeClasses(){return bi+" "+(this.state.facet(yi)?xi:wi)+" "+this.state.facet(vi)}updateAttrs(){let t=Ri(this,Et,{class:"cm-editor"+(this.hasFocus?" cm-focused ":" ")+this.themeClasses}),e={spellcheck:"false",autocorrect:"off",autocapitalize:"off",translate:"no",contenteditable:this.state.facet(Tt)?"true":"false",class:"cm-content",style:`${N.tabSize}: ${this.state.tabSize}`,role:"textbox","aria-multiline":"true"}
this.state.readOnly&&(e["aria-readonly"]="true"),Ri(this,Mt,e)
let i=this.observer.ignore((()=>{let i=nt(this.contentDOM,this.contentAttrs,e),n=nt(this.dom,this.editorAttrs,t)
return i||n}))
return this.editorAttrs=t,this.contentAttrs=e,i}showAnnouncements(t){let e=!0
for(let i of t)for(let t of i.effects)t.is(Ei.announce)&&(e&&(this.announceDOM.textContent=""),e=!1,this.announceDOM.appendChild(document.createElement("div")).textContent=t.value)}mountStyles(){this.styleModules=this.state.facet(Zt),s.StyleModule.mount(this.root,this.styleModules.concat(Qi).reverse())}readMeasured(){if(2==this.updateState)throw new Error("Reading the editor layout isn't allowed during an update")
0==this.updateState&&this.measureScheduled>-1&&this.measure(!1)}requestMeasure(t){if(this.measureScheduled<0&&(this.measureScheduled=this.win.requestAnimationFrame((()=>this.measure()))),t){if(null!=t.key)for(let e=0;e<this.measureRequests.length;e++)if(this.measureRequests[e].key===t.key)return void(this.measureRequests[e]=t)
this.measureRequests.push(t)}}plugin(t){let e=this.pluginMap.get(t)
return(void 0===e||e&&e.spec!=t)&&this.pluginMap.set(t,e=this.plugins.find((e=>e.spec==t))||null),e&&e.update(this).value}get documentTop(){return this.contentDOM.getBoundingClientRect().top+this.viewState.paddingTop}get documentPadding(){return{top:this.viewState.paddingTop,bottom:this.viewState.paddingBottom}}elementAtHeight(t){return this.readMeasured(),this.viewState.elementAtHeight(t)}lineBlockAtHeight(t){return this.readMeasured(),this.viewState.lineBlockAtHeight(t)}get viewportLineBlocks(){return this.viewState.viewportLines}lineBlockAt(t){return this.viewState.lineBlockAt(t)}get contentHeight(){return this.viewState.contentHeight}moveByChar(t,e,i){return we(this,t,be(this,t,e,i))}moveByGroup(t,e){return we(this,t,be(this,t,e,(e=>function(t,e,i){let s=t.state.charCategorizer(e),r=s(i)
return t=>{let e=s(t)
return r==n.CharCategory.Space&&(r=e),r==e}}(this,t.head,e))))}moveToLineBoundary(t,i,s=!0){return function(t,i,s,r){let o=t.state.doc.lineAt(i.head),a=r&&t.lineWrapping?t.coordsAtPos(i.assoc<0&&i.head>o.from?i.head-1:i.head):null
if(a){let i=t.dom.getBoundingClientRect(),r=t.textDirectionAt(o.from),l=t.posAtCoords({x:s==(r==e.Direction.LTR)?i.right-1:i.left+1,y:(a.top+a.bottom)/2})
if(null!=l)return n.EditorSelection.cursor(l,s?-1:1)}let l=ut.find(t.docView,i.head),h=l?s?l.posAtEnd:l.posAtStart:s?o.to:o.from
return n.EditorSelection.cursor(h,s?-1:1)}(this,t,i,s)}moveVertically(t,e,i){return we(this,t,function(t,e,i,s){let r=e.head,o=i?1:-1
if(r==(i?t.state.doc.length:0))return n.EditorSelection.cursor(r,e.assoc)
let a,l=e.goalColumn,h=t.contentDOM.getBoundingClientRect(),c=t.coordsAtPos(r),u=t.documentTop
if(c)null==l&&(l=c.left-h.left),a=o<0?c.top:c.bottom
else{let e=t.viewState.lineBlockAt(r)
null==l&&(l=Math.min(h.right-h.left,t.defaultCharacterWidth*(r-e.from))),a=(o<0?e.top:e.bottom)+u}let f=h.left+l,d=null!=s?s:t.defaultLineHeight>>1
for(let p=0;;p+=10){let i=a+(d+p)*o,s=ve(t,{x:f,y:i},!1,o)
if(i<h.top||i>h.bottom||(o<0?s<r:s>r))return n.EditorSelection.cursor(s,e.assoc,void 0,l)}}(this,t,e,i))}domAtPos(t){return this.docView.domAtPos(t)}posAtDOM(t,e=0){return this.docView.posFromDOM(t,e)}posAtCoords(t,e=!0){return this.readMeasured(),ve(this,t,e)}coordsAtPos(t,i=1){this.readMeasured()
let n=this.docView.coordsAt(t,i)
if(!n||n.left==n.right)return n
let s=this.state.doc.lineAt(t),r=this.bidiSpans(s)
return m(n,r[Gt.find(r,t-s.from,-1,i)].dir==e.Direction.LTR==i>0)}get defaultCharacterWidth(){return this.viewState.heightOracle.charWidth}get defaultLineHeight(){return this.viewState.heightOracle.lineHeight}get textDirection(){return this.viewState.defaultTextDirection}textDirectionAt(t){return!this.state.facet(xt)||t<this.viewport.from||t>this.viewport.to?this.textDirection:(this.readMeasured(),this.docView.textDirectionAt(t))}get lineWrapping(){return this.viewState.heightOracle.lineWrapping}bidiSpans(t){if(t.length>Mi)return Kt(t.length)
let e=this.textDirectionAt(t.from)
for(let n of this.bidiCache)if(n.from==t.from&&n.dir==e)return n.order
let i=Ht(t.text,e)
return this.bidiCache.push(new Wi(t.from,t.to,e,i)),i}get hasFocus(){var t
return(this.dom.ownerDocument.hasFocus()||N.safari&&(null===(t=this.inputState)||void 0===t?void 0:t.lastContextMenu)>Date.now()-3e4)&&this.root.activeElement==this.contentDOM}focus(){this.observer.ignore((()=>{b(this.contentDOM),this.docView.updateSelection()}))}setRoot(t){this._root!=t&&(this._root=t,this.observer.setWindow((9==t.nodeType?t:t.ownerDocument).defaultView||window),this.mountStyles())}destroy(){for(let t of this.plugins)t.destroy(this)
this.plugins=[],this.inputState.destroy(),this.dom.remove(),this.observer.destroy(),this.measureScheduled>-1&&cancelAnimationFrame(this.measureScheduled),this.destroyed=!0}static scrollIntoView(t,e={}){return Qt.of(new kt("number"==typeof t?n.EditorSelection.cursor(t):t,e.y,e.x,e.yMargin,e.xMargin))}static domEventHandlers(t){return _t.define((()=>({})),{eventHandlers:t})}static theme(t,e){let i=s.StyleModule.newName(),n=[vi.of(i),Zt.of(ki(`.${i}`,t))]
return e&&e.dark&&n.push(yi.of(!0)),n}static baseTheme(t){return n.Prec.lowest(Zt.of(ki("."+bi,t,Si)))}static findFromDOM(t){var e
let i=t.querySelector(".cm-content"),n=i&&P.get(i)||P.get(t)
return(null===(e=null==n?void 0:n.rootView)||void 0===e?void 0:e.view)||null}}Ei.styleModule=Zt,Ei.inputHandler=wt,Ei.perLineTextDirection=xt,Ei.exceptionSink=yt,Ei.updateListener=bt,Ei.editable=Tt,Ei.mouseSelectionStyle=vt,Ei.dragMovesSelection=Ot,Ei.clickAddsSelectionRange=gt,Ei.decorations=It,Ei.atomicRanges=Wt,Ei.scrollMargins=Rt,Ei.darkTheme=yi,Ei.contentAttributes=Mt,Ei.editorAttributes=Et,Ei.lineWrapping=Ei.contentAttributes.of({class:"cm-lineWrapping"}),Ei.announce=n.StateEffect.define()
const Mi=4096,Ii={}
class Wi{constructor(t,e,i,n){this.from=t,this.to=e,this.dir=i,this.order=n}static update(t,i){if(i.empty)return t
let n=[],s=t.length?t[t.length-1].dir:e.Direction.LTR
for(let e=Math.max(0,t.length-10);e<t.length;e++){let r=t[e]
r.dir!=s||i.touchesRange(r.from,r.to)||n.push(new Wi(i.mapPos(r.from,1),i.mapPos(r.to,-1),r.dir,r.order))}return n}}function Ri(t,e,i){for(let n=t.state.facet(e),s=n.length-1;s>=0;s--){let e=n[s],r="function"==typeof e?e(t):e
r&&et(r,i)}return i}const Zi=N.mac?"mac":N.windows?"win":N.linux?"linux":"key"
function Di(t,e,i){return e.altKey&&(t="Alt-"+t),e.ctrlKey&&(t="Ctrl-"+t),e.metaKey&&(t="Meta-"+t),!1!==i&&e.shiftKey&&(t="Shift-"+t),t}const Vi=n.Prec.default(Ei.domEventHandlers({keydown:(t,e)=>Ui(Li(e.state),t,e,"editor")})),Xi=n.Facet.define({enables:Vi}),ji=new WeakMap
function Li(t){let e=t.facet(Xi),i=ji.get(e)
return i||ji.set(e,i=function(t,e=Zi){let i=Object.create(null),n=Object.create(null),s=(t,e)=>{let i=n[t]
if(null==i)n[t]=e
else if(i!=e)throw new Error("Key binding "+t+" is used both as a regular binding and as a multi-stroke prefix")},r=(t,n,r,o)=>{var a,l
let h=i[t]||(i[t]=Object.create(null)),c=n.split(/ (?!$)/).map((t=>function(t,e){const i=t.split(/-(?!$)/)
let n,s,r,o,a=i[i.length-1]
"Space"==a&&(a=" ")
for(let l=0;l<i.length-1;++l){const t=i[l]
if(/^(cmd|meta|m)$/i.test(t))o=!0
else if(/^a(lt)?$/i.test(t))n=!0
else if(/^(c|ctrl|control)$/i.test(t))s=!0
else if(/^s(hift)?$/i.test(t))r=!0
else{if(!/^mod$/i.test(t))throw new Error("Unrecognized modifier name: "+t)
"mac"==e?o=!0:s=!0}}return n&&(a="Alt-"+a),s&&(a="Ctrl-"+a),o&&(a="Meta-"+a),r&&(a="Shift-"+a),a}(t,e)))
for(let e=1;e<c.length;e++){let i=c.slice(0,e).join(" ")
s(i,!0),h[i]||(h[i]={preventDefault:!0,run:[e=>{let n=Ni={view:e,prefix:i,scope:t}
return setTimeout((()=>{Ni==n&&(Ni=null)}),4e3),!0}]})}let u=c.join(" ")
s(u,!1)
let f=h[u]||(h[u]={preventDefault:!1,run:(null===(l=null===(a=h._any)||void 0===a?void 0:a.run)||void 0===l?void 0:l.slice())||[]})
r&&f.run.push(r),o&&(f.preventDefault=!0)}
for(let o of t){let t=o.scope?o.scope.split(" "):["editor"]
if(o.any)for(let e of t){let t=i[e]||(i[e]=Object.create(null))
t._any||(t._any={preventDefault:!1,run:[]})
for(let e in t)t[e].run.push(o.any)}let n=o[e]||o.key
if(n)for(let e of t)r(e,n,o.run,o.preventDefault),o.shift&&r(e,"Shift-"+n,o.shift,o.preventDefault)}return i}(e.reduce(((t,e)=>t.concat(e)),[]))),i}let Ni=null
function Ui(t,e,i,s){let o=r.keyName(e),a=n.codePointAt(o,0),l=n.codePointSize(a)==o.length&&" "!=o,h="",c=!1
Ni&&Ni.view==i&&Ni.scope==s&&(h=Ni.prefix+" ",(c=Qe.indexOf(e.keyCode)<0)&&(Ni=null))
let u,f,d=new Set,p=t=>{if(t){for(let n of t.run)if(!d.has(n)&&(d.add(n),n(i,e)))return!0
t.preventDefault&&(c=!0)}return!1},m=t[s]
if(m){if(p(m[h+Di(o,e,!l)]))return!0
if(l&&(e.altKey||e.metaKey||e.ctrlKey)&&(u=r.base[e.keyCode])&&u!=o){if(p(m[h+Di(u,e,!0)]))return!0
if(e.shiftKey&&(f=r.shift[e.keyCode])!=o&&f!=u&&p(m[h+Di(f,e,!1)]))return!0}else if(l&&e.shiftKey&&p(m[h+Di(o,e,!0)]))return!0
if(p(m._any))return!0}return c}class qi{constructor(t,e,i,n,s){this.className=t,this.left=e,this.top=i,this.width=n,this.height=s}draw(){let t=document.createElement("div")
return t.className=this.className,this.adjust(t),t}update(t,e){return e.className==this.className&&(this.adjust(t),!0)}adjust(t){t.style.left=this.left+"px",t.style.top=this.top+"px",null!=this.width&&(t.style.width=this.width+"px"),t.style.height=this.height+"px"}eq(t){return this.left==t.left&&this.top==t.top&&this.width==t.width&&this.height==t.height&&this.className==t.className}static forRange(t,i,n){if(n.empty){let e=t.coordsAtPos(n.head,n.assoc||1)
if(!e)return[]
let s=Yi(t)
return[new qi(i,e.left-s.left,e.top-s.top,null,e.bottom-e.top)]}return function(t,i,n){if(n.to<=t.viewport.from||n.from>=t.viewport.to)return[]
let s=Math.max(n.from,t.viewport.from),r=Math.min(n.to,t.viewport.to),o=t.textDirection==e.Direction.LTR,a=t.contentDOM,l=a.getBoundingClientRect(),h=Yi(t),c=window.getComputedStyle(a.firstChild),u=l.left+parseInt(c.paddingLeft)+Math.min(0,parseInt(c.textIndent)),f=l.right-parseInt(c.paddingRight),d=Bi(t,s),p=Bi(t,r),m=d.type==e.BlockType.Text?d:null,g=p.type==e.BlockType.Text?p:null
if(t.lineWrapping&&(m&&(m=zi(t,s,m)),g&&(g=zi(t,r,g))),m&&g&&m.from==g.from)return v(y(n.from,n.to,m))
{let i=m?y(n.from,null,m):b(d,!1),s=g?y(null,n.to,g):b(p,!0),r=[]
return(m||d).to<(g||p).from-1?r.push(O(u,i.bottom,f,s.top)):i.bottom<s.top&&t.elementAtHeight((i.bottom+s.top)/2).type==e.BlockType.Text&&(i.bottom=s.top=(i.bottom+s.top)/2),v(i).concat(r).concat(v(s))}function O(t,e,n,s){return new qi(i,t-h.left,e-h.top-.01,n-t,s-e+.01)}function v({top:t,bottom:e,horizontal:i}){let n=[]
for(let s=0;s<i.length;s+=2)n.push(O(i[s],t,i[s+1],e))
return n}function y(i,n,s){let r=1e9,a=-1e9,l=[]
function h(i,n,h,c,d){let p=t.coordsAtPos(i,i==s.to?-2:2),m=t.coordsAtPos(h,h==s.from?2:-2)
r=Math.min(p.top,m.top,r),a=Math.max(p.bottom,m.bottom,a),d==e.Direction.LTR?l.push(o&&n?u:p.left,o&&c?f:m.right):l.push(!o&&c?u:m.left,!o&&n?f:p.right)}let c=null!=i?i:s.from,d=null!=n?n:s.to
for(let e of t.visibleRanges)if(e.to>c&&e.from<d)for(let s=Math.max(e.from,c),r=Math.min(e.to,d);;){let e=t.state.doc.lineAt(s)
for(let o of t.bidiSpans(e)){let t=o.from+e.from,a=o.to+e.from
if(t>=r)break
a>s&&h(Math.max(t,s),null==i&&t<=c,Math.min(a,r),null==n&&a>=d,o.dir)}if(s=e.to+1,s>=r)break}return 0==l.length&&h(c,null==i,d,null==n,t.textDirection),{top:r,bottom:a,horizontal:l}}function b(t,e){let i=l.top+(e?t.top:t.bottom)
return{top:i,bottom:i,horizontal:[]}}}(t,i,n)}}function Yi(t){let i=t.scrollDOM.getBoundingClientRect()
return{left:(t.textDirection==e.Direction.LTR?i.left:i.right-t.scrollDOM.clientWidth)-t.scrollDOM.scrollLeft,top:i.top-t.scrollDOM.scrollTop}}function zi(t,i,s){let r=n.EditorSelection.cursor(i)
return{from:Math.max(s.from,t.moveToLineBoundary(r,!1,!0).from),to:Math.min(s.to,t.moveToLineBoundary(r,!0,!0).from),type:e.BlockType.Text}}function Bi(t,i){let n=t.lineBlockAt(i)
if(Array.isArray(n.type))for(let s of n.type)if(s.to>i||s.to==i&&(s.to==n.to||s.type==e.BlockType.Text))return s
return n}class Gi{constructor(t,e){this.view=t,this.layer=e,this.drawn=[],this.measureReq={read:this.measure.bind(this),write:this.draw.bind(this)},this.dom=t.scrollDOM.appendChild(document.createElement("div")),this.dom.classList.add("cm-layer"),e.above&&this.dom.classList.add("cm-layer-above"),e.class&&this.dom.classList.add(e.class),this.dom.setAttribute("aria-hidden","true"),this.setOrder(t.state),t.requestMeasure(this.measureReq),e.mount&&e.mount(this.dom,t)}update(t){t.startState.facet(Fi)!=t.state.facet(Fi)&&this.setOrder(t.state),(this.layer.update(t,this.dom)||t.geometryChanged)&&t.view.requestMeasure(this.measureReq)}setOrder(t){let e=0,i=t.facet(Fi)
for(;e<i.length&&i[e]!=this.layer;)e++
this.dom.style.zIndex=String((this.layer.above?150:-1)-e)}measure(){return this.layer.markers(this.view)}draw(t){if(t.length!=this.drawn.length||t.some(((t,e)=>{return i=t,n=this.drawn[e],!(i.constructor==n.constructor&&i.eq(n))
var i,n}))){let e=this.dom.firstChild,i=0
for(let n of t)n.update&&e&&n.constructor&&this.drawn[i].constructor&&n.update(e,this.drawn[i])?(e=e.nextSibling,i++):this.dom.insertBefore(n.draw(),e)
for(;e;){let t=e.nextSibling
e.remove(),e=t}this.drawn=t}}destroy(){this.layer.destroy&&this.layer.destroy(this.dom,this.view),this.dom.remove()}}const Fi=n.Facet.define()
function Hi(t){return[_t.define((e=>new Gi(e,t))),Fi.of(t)]}const Ki=!N.ios,Ji=n.Facet.define({combine:t=>n.combineConfig(t,{cursorBlinkRate:1200,drawRangeCursor:!0},{cursorBlinkRate:(t,e)=>Math.min(t,e),drawRangeCursor:(t,e)=>t||e})})
function tn(t){return t.startState.facet(Ji)!=t.startState.facet(Ji)}const en=Hi({above:!0,markers(t){let{state:e}=t,i=e.facet(Ji),s=[]
for(let r of e.selection.ranges){let o=r==e.selection.main
if(r.empty?!o||Ki:i.drawRangeCursor){let e=o?"cm-cursor cm-cursor-primary":"cm-cursor cm-cursor-secondary",i=r.empty?r:n.EditorSelection.cursor(r.head,r.head>r.anchor?-1:1)
for(let n of qi.forRange(t,e,i))s.push(n)}}return s},update(t,e){t.transactions.some((t=>t.scrollIntoView))&&(e.style.animationName="cm-blink"==e.style.animationName?"cm-blink2":"cm-blink")
let i=tn(t)
return i&&nn(t.state,e),t.docChanged||t.selectionSet||i},mount(t,e){nn(e.state,t)},class:"cm-cursorLayer"})
function nn(t,e){e.style.animationDuration=t.facet(Ji).cursorBlinkRate+"ms"}const sn=Hi({above:!1,markers:t=>t.state.selection.ranges.map((e=>e.empty?[]:qi.forRange(t,"cm-selectionBackground",e))).reduce(((t,e)=>t.concat(e))),update:(t,e)=>t.docChanged||t.selectionSet||t.viewportChanged||tn(t),class:"cm-selectionLayer"}),rn={".cm-line":{"& ::selection":{backgroundColor:"transparent !important"},"&::selection":{backgroundColor:"transparent !important"}}}
Ki&&(rn[".cm-line"].caretColor="transparent !important")
const on=n.Prec.highest(Ei.theme(rn)),an=n.StateEffect.define({map:(t,e)=>null==t?null:e.mapPos(t)}),ln=n.StateField.define({create:()=>null,update:(t,e)=>(null!=t&&(t=e.changes.mapPos(t)),e.effects.reduce(((t,e)=>e.is(an)?e.value:t),t))}),hn=_t.fromClass(class{constructor(t){this.view=t,this.cursor=null,this.measureReq={read:this.readPos.bind(this),write:this.drawCursor.bind(this)}}update(t){var e
let i=t.state.field(ln)
null==i?null!=this.cursor&&(null===(e=this.cursor)||void 0===e||e.remove(),this.cursor=null):(this.cursor||(this.cursor=this.view.scrollDOM.appendChild(document.createElement("div")),this.cursor.className="cm-dropCursor"),(t.startState.field(ln)!=i||t.docChanged||t.geometryChanged)&&this.view.requestMeasure(this.measureReq))}readPos(){let t=this.view.state.field(ln),e=null!=t&&this.view.coordsAtPos(t)
if(!e)return null
let i=this.view.scrollDOM.getBoundingClientRect()
return{left:e.left-i.left+this.view.scrollDOM.scrollLeft,top:e.top-i.top+this.view.scrollDOM.scrollTop,height:e.bottom-e.top}}drawCursor(t){this.cursor&&(t?(this.cursor.style.left=t.left+"px",this.cursor.style.top=t.top+"px",this.cursor.style.height=t.height+"px"):this.cursor.style.left="-100000px")}destroy(){this.cursor&&this.cursor.remove()}setDropPos(t){this.view.state.field(ln)!=t&&this.view.dispatch({effects:an.of(t)})}},{eventHandlers:{dragover(t){this.setDropPos(this.view.posAtCoords({x:t.clientX,y:t.clientY}))},dragleave(t){t.target!=this.view.contentDOM&&this.view.contentDOM.contains(t.relatedTarget)||this.setDropPos(null)},dragend(){this.setDropPos(null)},drop(){this.setDropPos(null)}}})
function cn(t,e,i,n,s){e.lastIndex=0
for(let r,o=t.iterRange(i,n),a=i;!o.next().done;a+=o.value.length)if(!o.lineBreak)for(;r=e.exec(o.value);)s(a+r.index,r)}class un{constructor(t){const{regexp:e,decoration:i,decorate:n,boundary:s,maxLength:r=1e3}=t
if(!e.global)throw new RangeError("The regular expression given to MatchDecorator should have its 'g' flag set")
if(this.regexp=e,n)this.addMatch=(t,e,i,s)=>n(s,i,i+t[0].length,t,e)
else if("function"==typeof i)this.addMatch=(t,e,n,s)=>{let r=i(t,e,n)
r&&s(n,n+t[0].length,r)}
else{if(!i)throw new RangeError("Either 'decorate' or 'decoration' should be provided to MatchDecorator")
this.addMatch=(t,e,n,s)=>s(n,n+t[0].length,i)}this.boundary=s,this.maxLength=r}createDeco(t){let e=new n.RangeSetBuilder,i=e.add.bind(e)
for(let{from:n,to:s}of function(t,e){let i=t.visibleRanges
if(1==i.length&&i[0].from==t.viewport.from&&i[0].to==t.viewport.to)return i
let n=[]
for(let{from:s,to:r}of i)s=Math.max(t.state.doc.lineAt(s).from,s-e),r=Math.min(t.state.doc.lineAt(r).to,r+e),n.length&&n[n.length-1].to>=s?n[n.length-1].to=r:n.push({from:s,to:r})
return n}(t,this.maxLength))cn(t.state.doc,this.regexp,n,s,((e,n)=>this.addMatch(n,t,e,i)))
return e.finish()}updateDeco(t,e){let i=1e9,n=-1
return t.docChanged&&t.changes.iterChanges(((e,s,r,o)=>{o>t.view.viewport.from&&r<t.view.viewport.to&&(i=Math.min(r,i),n=Math.max(o,n))})),t.viewportChanged||n-i>1e3?this.createDeco(t.view):n>-1?this.updateRange(t.view,e.map(t.changes),i,n):e}updateRange(t,e,i,n){for(let s of t.visibleRanges){let r=Math.max(s.from,i),o=Math.min(s.to,n)
if(o>r){let i=t.state.doc.lineAt(r),n=i.to<o?t.state.doc.lineAt(o):i,a=Math.max(s.from,i.from),l=Math.min(s.to,n.to)
if(this.boundary){for(;r>i.from;r--)if(this.boundary.test(i.text[r-1-i.from])){a=r
break}for(;o<n.to;o++)if(this.boundary.test(n.text[o-n.from])){l=o
break}}let h,c=[],u=(t,e,i)=>c.push(i.range(t,e))
if(i==n)for(this.regexp.lastIndex=a-i.from;(h=this.regexp.exec(i.text))&&h.index<l-i.from;)this.addMatch(h,t,h.index+i.from,u)
else cn(t.state.doc,this.regexp,a,l,((e,i)=>this.addMatch(i,t,e,u)))
e=e.update({filterFrom:a,filterTo:l,filter:(t,e)=>t<a||e>l,add:c})}}return e}}const fn=null!=/x/.unicode?"gu":"g",dn=new RegExp("[\0-\b\n--­؜​‎‏\u2028\u2029‭‮⁦⁧⁩\ufeff￹-￼]",fn),pn={0:"null",7:"bell",8:"backspace",10:"newline",11:"vertical tab",13:"carriage return",27:"escape",8203:"zero width space",8204:"zero width non-joiner",8205:"zero width joiner",8206:"left-to-right mark",8207:"right-to-left mark",8232:"line separator",8237:"left-to-right override",8238:"right-to-left override",8294:"left-to-right isolate",8295:"right-to-left isolate",8297:"pop directional isolate",8233:"paragraph separator",65279:"zero width no-break space",65532:"object replacement"}
let mn=null
const gn=n.Facet.define({combine(t){let e=n.combineConfig(t,{render:null,specialChars:dn,addSpecialChars:null})
return(e.replaceTabs=!function(){var t
if(null==mn&&"undefined"!=typeof document&&document.body){let e=document.body.style
mn=null!=(null!==(t=e.tabSize)&&void 0!==t?t:e.MozTabSize)}return mn||!1}())&&(e.specialChars=new RegExp("\t|"+e.specialChars.source,fn)),e.addSpecialChars&&(e.specialChars=new RegExp(e.specialChars.source+"|"+e.addSpecialChars.source,fn)),e}})
let On=null
class vn extends st{constructor(t,e){super(),this.options=t,this.code=e}eq(t){return t.code==this.code}toDOM(t){let e=(i=this.code)>=32?"•":10==i?"␤":String.fromCharCode(9216+i)
var i
let n=t.state.phrase("Control character")+" "+(pn[this.code]||"0x"+this.code.toString(16)),s=this.options.render&&this.options.render(this.code,n,e)
if(s)return s
let r=document.createElement("span")
return r.textContent=e,r.title=n,r.setAttribute("aria-label",n),r.className="cm-specialChar",r}ignoreEvent(){return!1}}class yn extends st{constructor(t){super(),this.width=t}eq(t){return t.width==this.width}toDOM(){let t=document.createElement("span")
return t.textContent="\t",t.className="cm-tab",t.style.width=this.width+"px",t}ignoreEvent(){return!1}}const bn=_t.fromClass(class{constructor(){this.height=1e3,this.attrs={style:"padding-bottom: 1000px"}}update(t){let{view:e}=t,i=e.viewState.editorHeight-e.defaultLineHeight-e.documentPadding.top-.5
i!=this.height&&(this.height=i,this.attrs={style:`padding-bottom: ${i}px`})}}),wn=rt.line({class:"cm-activeLine"}),xn=_t.fromClass(class{constructor(t){this.decorations=this.getDeco(t)}update(t){(t.docChanged||t.selectionSet)&&(this.decorations=this.getDeco(t.view))}getDeco(t){let e=-1,i=[]
for(let n of t.state.selection.ranges){let s=t.lineBlockAt(n.head)
s.from>e&&(i.push(wn.range(s.from)),e=s.from)}return rt.set(i)}},{decorations:t=>t.decorations})
class Sn extends st{constructor(t){super(),this.content=t}toDOM(){let t=document.createElement("span")
return t.className="cm-placeholder",t.style.pointerEvents="none",t.appendChild("string"==typeof this.content?document.createTextNode(this.content):this.content),"string"==typeof this.content?t.setAttribute("aria-label","placeholder "+this.content):t.setAttribute("aria-hidden","true"),t}ignoreEvent(){return!1}}const kn=2e3
function Qn(t,e){let i=t.posAtCoords({x:e.clientX,y:e.clientY},!1),s=t.state.doc.lineAt(i),r=i-s.from,o=r>kn?-1:r==s.length?function(t,e){let i=t.coordsAtPos(t.viewport.from)
return i?Math.round(Math.abs((i.left-e)/t.defaultCharacterWidth)):-1}(t,e.clientX):n.countColumn(s.text,t.state.tabSize,i-s.from)
return{line:s.number,col:o,off:r}}const Pn={Alt:[18,t=>t.altKey],Control:[17,t=>t.ctrlKey],Shift:[16,t=>t.shiftKey],Meta:[91,t=>t.metaKey]},Tn={style:"cursor: crosshair"},$n="-10000px"
class An{constructor(t,e,i){this.facet=e,this.createTooltipView=i,this.input=t.state.facet(e),this.tooltips=this.input.filter((t=>t)),this.tooltipViews=this.tooltips.map(i)}update(t){var e
let i=t.state.facet(this.facet),n=i.filter((t=>t))
if(i===this.input){for(let e of this.tooltipViews)e.update&&e.update(t)
return!1}let s=[]
for(let r=0;r<n.length;r++){let e=n[r],i=-1
if(e){for(let t=0;t<this.tooltips.length;t++){let n=this.tooltips[t]
n&&n.create==e.create&&(i=t)}if(i<0)s[r]=this.createTooltipView(e)
else{let e=s[r]=this.tooltipViews[i]
e.update&&e.update(t)}}}for(let r of this.tooltipViews)s.indexOf(r)<0&&(r.dom.remove(),null===(e=r.destroy)||void 0===e||e.call(r))
return this.input=i,this.tooltips=n,this.tooltipViews=s,!0}}function _n(t){let{win:e}=t
return{top:0,left:0,bottom:e.innerHeight,right:e.innerWidth}}const Cn=n.Facet.define({combine:t=>{var e,i,n
return{position:N.ios?"absolute":(null===(e=t.find((t=>t.position)))||void 0===e?void 0:e.position)||"fixed",parent:(null===(i=t.find((t=>t.parent)))||void 0===i?void 0:i.parent)||null,tooltipSpace:(null===(n=t.find((t=>t.tooltipSpace)))||void 0===n?void 0:n.tooltipSpace)||_n}}}),En=_t.fromClass(class{constructor(t){this.view=t,this.inView=!0,this.lastTransaction=0,this.measureTimeout=-1
let e=t.state.facet(Cn)
this.position=e.position,this.parent=e.parent,this.classes=t.themeClasses,this.createContainer(),this.measureReq={read:this.readMeasure.bind(this),write:this.writeMeasure.bind(this),key:this},this.manager=new An(t,Wn,(t=>this.createTooltip(t))),this.intersectionObserver="function"==typeof IntersectionObserver?new IntersectionObserver((t=>{Date.now()>this.lastTransaction-50&&t.length>0&&t[t.length-1].intersectionRatio<1&&this.measureSoon()}),{threshold:[1]}):null,this.observeIntersection(),t.win.addEventListener("resize",this.measureSoon=this.measureSoon.bind(this)),this.maybeMeasure()}createContainer(){this.parent?(this.container=document.createElement("div"),this.container.style.position="relative",this.container.className=this.view.themeClasses,this.parent.appendChild(this.container)):this.container=this.view.dom}observeIntersection(){if(this.intersectionObserver){this.intersectionObserver.disconnect()
for(let t of this.manager.tooltipViews)this.intersectionObserver.observe(t.dom)}}measureSoon(){this.measureTimeout<0&&(this.measureTimeout=setTimeout((()=>{this.measureTimeout=-1,this.maybeMeasure()}),50))}update(t){t.transactions.length&&(this.lastTransaction=Date.now())
let e=this.manager.update(t)
e&&this.observeIntersection()
let i=e||t.geometryChanged,n=t.state.facet(Cn)
if(n.position!=this.position){this.position=n.position
for(let t of this.manager.tooltipViews)t.dom.style.position=this.position
i=!0}if(n.parent!=this.parent){this.parent&&this.container.remove(),this.parent=n.parent,this.createContainer()
for(let t of this.manager.tooltipViews)this.container.appendChild(t.dom)
i=!0}else this.parent&&this.view.themeClasses!=this.classes&&(this.classes=this.container.className=this.view.themeClasses)
i&&this.maybeMeasure()}createTooltip(t){let e=t.create(this.view)
if(e.dom.classList.add("cm-tooltip"),t.arrow&&!e.dom.querySelector(".cm-tooltip > .cm-tooltip-arrow")){let t=document.createElement("div")
t.className="cm-tooltip-arrow",e.dom.appendChild(t)}return e.dom.style.position=this.position,e.dom.style.top=$n,this.container.appendChild(e.dom),e.mount&&e.mount(this.view),e}destroy(){var t,e
this.view.win.removeEventListener("resize",this.measureSoon)
for(let i of this.manager.tooltipViews)i.dom.remove(),null===(t=i.destroy)||void 0===t||t.call(i)
null===(e=this.intersectionObserver)||void 0===e||e.disconnect(),clearTimeout(this.measureTimeout)}readMeasure(){let t=this.view.dom.getBoundingClientRect()
return{editor:t,parent:this.parent?this.container.getBoundingClientRect():t,pos:this.manager.tooltips.map(((t,e)=>{let i=this.manager.tooltipViews[e]
return i.getCoords?i.getCoords(t.pos):this.view.coordsAtPos(t.pos)})),size:this.manager.tooltipViews.map((({dom:t})=>t.getBoundingClientRect())),space:this.view.state.facet(Cn).tooltipSpace(this.view)}}writeMeasure(t){let{editor:i,space:n}=t,s=[]
for(let r=0;r<this.manager.tooltips.length;r++){let o=this.manager.tooltips[r],a=this.manager.tooltipViews[r],{dom:l}=a,h=t.pos[r],c=t.size[r]
if(!h||h.bottom<=Math.max(i.top,n.top)||h.top>=Math.min(i.bottom,n.bottom)||h.right<Math.max(i.left,n.left)-.1||h.left>Math.min(i.right,n.right)+.1){l.style.top=$n
continue}let u=o.arrow?a.dom.querySelector(".cm-tooltip-arrow"):null,f=u?7:0,d=c.right-c.left,p=c.bottom-c.top,m=a.offset||In,g=this.view.textDirection==e.Direction.LTR,O=c.width>n.right-n.left?g?n.left:n.right-c.width:g?Math.min(h.left-(u?14:0)+m.x,n.right-d):Math.max(n.left,h.left-d+(u?14:0)-m.x),v=!!o.above
!o.strictSide&&(v?h.top-(c.bottom-c.top)-m.y<n.top:h.bottom+(c.bottom-c.top)+m.y>n.bottom)&&v==n.bottom-h.bottom>h.top-n.top&&(v=!v)
let y=(v?h.top-n.top:n.bottom-h.bottom)-f
if(y<p&&!1!==a.resize){if(y<this.view.defaultLineHeight){l.style.top=$n
continue}l.style.height=(p=y)+"px"}else l.style.height&&(l.style.height="")
let b=v?h.top-p-f-m.y:h.bottom+f+m.y,w=O+d
if(!0!==a.overlap)for(let t of s)t.left<w&&t.right>O&&t.top<b+p&&t.bottom>b&&(b=v?t.top-p-2-f:t.bottom+f+2)
"absolute"==this.position?(l.style.top=b-t.parent.top+"px",l.style.left=O-t.parent.left+"px"):(l.style.top=b+"px",l.style.left=O+"px"),u&&(u.style.left=h.left+(g?m.x:-m.x)-(O+14-7)+"px"),!0!==a.overlap&&s.push({left:O,top:b,right:w,bottom:b+p}),l.classList.toggle("cm-tooltip-above",v),l.classList.toggle("cm-tooltip-below",!v),a.positioned&&a.positioned(t.space)}}maybeMeasure(){if(this.manager.tooltips.length&&(this.view.inView&&this.view.requestMeasure(this.measureReq),this.inView!=this.view.inView&&(this.inView=this.view.inView,!this.inView)))for(let t of this.manager.tooltipViews)t.dom.style.top=$n}},{eventHandlers:{scroll(){this.maybeMeasure()}}}),Mn=Ei.baseTheme({".cm-tooltip":{zIndex:100,boxSizing:"border-box"},"&light .cm-tooltip":{border:"1px solid #bbb",backgroundColor:"#f5f5f5"},"&light .cm-tooltip-section:not(:first-child)":{borderTop:"1px solid #bbb"},"&dark .cm-tooltip":{backgroundColor:"#333338",color:"white"},".cm-tooltip-arrow":{height:"7px",width:"14px",position:"absolute",zIndex:-1,overflow:"hidden","&:before, &:after":{content:"''",position:"absolute",width:0,height:0,borderLeft:"7px solid transparent",borderRight:"7px solid transparent"},".cm-tooltip-above &":{bottom:"-7px","&:before":{borderTop:"7px solid #bbb"},"&:after":{borderTop:"7px solid #f5f5f5",bottom:"1px"}},".cm-tooltip-below &":{top:"-7px","&:before":{borderBottom:"7px solid #bbb"},"&:after":{borderBottom:"7px solid #f5f5f5",top:"1px"}}},"&dark .cm-tooltip .cm-tooltip-arrow":{"&:before":{borderTopColor:"#333338",borderBottomColor:"#333338"},"&:after":{borderTopColor:"transparent",borderBottomColor:"transparent"}}}),In={x:0,y:0},Wn=n.Facet.define({enables:[En,Mn]}),Rn=n.Facet.define()
class Zn{constructor(t){this.view=t,this.mounted=!1,this.dom=document.createElement("div"),this.dom.classList.add("cm-tooltip-hover"),this.manager=new An(t,Rn,(t=>this.createHostedView(t)))}static create(t){return new Zn(t)}createHostedView(t){let e=t.create(this.view)
return e.dom.classList.add("cm-tooltip-section"),this.dom.appendChild(e.dom),this.mounted&&e.mount&&e.mount(this.view),e}mount(t){for(let e of this.manager.tooltipViews)e.mount&&e.mount(t)
this.mounted=!0}positioned(t){for(let e of this.manager.tooltipViews)e.positioned&&e.positioned(t)}update(t){this.manager.update(t)}}const Dn=Wn.compute([Rn],(t=>{let e=t.facet(Rn).filter((t=>t))
return 0===e.length?null:{pos:Math.min(...e.map((t=>t.pos))),end:Math.max(...e.filter((t=>null!=t.end)).map((t=>t.end))),create:Zn.create,above:e[0].above,arrow:e.some((t=>t.arrow))}}))
class Vn{constructor(t,e,i,n,s){this.view=t,this.source=e,this.field=i,this.setHover=n,this.hoverTime=s,this.hoverTimeout=-1,this.restartTimeout=-1,this.pending=null,this.lastMove={x:0,y:0,target:t.dom,time:0},this.checkHover=this.checkHover.bind(this),t.dom.addEventListener("mouseleave",this.mouseleave=this.mouseleave.bind(this)),t.dom.addEventListener("mousemove",this.mousemove=this.mousemove.bind(this))}update(){this.pending&&(this.pending=null,clearTimeout(this.restartTimeout),this.restartTimeout=setTimeout((()=>this.startHover()),20))}get active(){return this.view.state.field(this.field)}checkHover(){if(this.hoverTimeout=-1,this.active)return
let t=Date.now()-this.lastMove.time
t<this.hoverTime?this.hoverTimeout=setTimeout(this.checkHover,this.hoverTime-t):this.startHover()}startHover(){clearTimeout(this.restartTimeout)
let{lastMove:t}=this,i=this.view.contentDOM.contains(t.target)?this.view.posAtCoords(t):null
if(null==i)return
let n=this.view.coordsAtPos(i)
if(null==n||t.y<n.top||t.y>n.bottom||t.x<n.left-this.view.defaultCharacterWidth||t.x>n.right+this.view.defaultCharacterWidth)return
let s=this.view.bidiSpans(this.view.state.doc.lineAt(i)).find((t=>t.from<=i&&t.to>=i)),r=s&&s.dir==e.Direction.RTL?-1:1,o=this.source(this.view,i,t.x<n.left?-r:r)
if(null==o?void 0:o.then){let t=this.pending={pos:i}
o.then((e=>{this.pending==t&&(this.pending=null,e&&this.view.dispatch({effects:this.setHover.of(e)}))}),(t=>Pt(this.view.state,t,"hover tooltip")))}else o&&this.view.dispatch({effects:this.setHover.of(o)})}mousemove(t){var e
this.lastMove={x:t.clientX,y:t.clientY,target:t.target,time:Date.now()},this.hoverTimeout<0&&(this.hoverTimeout=setTimeout(this.checkHover,this.hoverTime))
let i=this.active
if(i&&!Xn(this.lastMove.target)||this.pending){let{pos:n}=i||this.pending,s=null!==(e=null==i?void 0:i.end)&&void 0!==e?e:n;(n==s?this.view.posAtCoords(this.lastMove)==n:function(t,e,i,n,s,r){let o=document.createRange(),a=t.domAtPos(e),l=t.domAtPos(i)
o.setEnd(l.node,l.offset),o.setStart(a.node,a.offset)
let h=o.getClientRects()
o.detach()
for(let c=0;c<h.length;c++){let t=h[c]
if(Math.max(t.top-s,s-t.bottom,t.left-n,n-t.right)<=6)return!0}return!1}(this.view,n,s,t.clientX,t.clientY))||(this.view.dispatch({effects:this.setHover.of(null)}),this.pending=null)}}mouseleave(t){clearTimeout(this.hoverTimeout),this.hoverTimeout=-1,this.active&&!Xn(t.relatedTarget)&&this.view.dispatch({effects:this.setHover.of(null)})}destroy(){clearTimeout(this.hoverTimeout),this.view.dom.removeEventListener("mouseleave",this.mouseleave),this.view.dom.removeEventListener("mousemove",this.mousemove)}}function Xn(t){for(let e=t;e;e=e.parentNode)if(1==e.nodeType&&e.classList.contains("cm-tooltip"))return!0
return!1}const jn=n.StateEffect.define(),Ln=jn.of(null),Nn=n.Facet.define({combine(t){let e,i
for(let n of t)e=e||n.topContainer,i=i||n.bottomContainer
return{topContainer:e,bottomContainer:i}}}),Un=_t.fromClass(class{constructor(t){this.input=t.state.facet(zn),this.specs=this.input.filter((t=>t)),this.panels=this.specs.map((e=>e(t)))
let e=t.state.facet(Nn)
this.top=new qn(t,!0,e.topContainer),this.bottom=new qn(t,!1,e.bottomContainer),this.top.sync(this.panels.filter((t=>t.top))),this.bottom.sync(this.panels.filter((t=>!t.top)))
for(let i of this.panels)i.dom.classList.add("cm-panel"),i.mount&&i.mount()}update(t){let e=t.state.facet(Nn)
this.top.container!=e.topContainer&&(this.top.sync([]),this.top=new qn(t.view,!0,e.topContainer)),this.bottom.container!=e.bottomContainer&&(this.bottom.sync([]),this.bottom=new qn(t.view,!1,e.bottomContainer)),this.top.syncClasses(),this.bottom.syncClasses()
let i=t.state.facet(zn)
if(i!=this.input){let e=i.filter((t=>t)),n=[],s=[],r=[],o=[]
for(let i of e){let e,a=this.specs.indexOf(i)
a<0?(e=i(t.view),o.push(e)):(e=this.panels[a],e.update&&e.update(t)),n.push(e),(e.top?s:r).push(e)}this.specs=e,this.panels=n,this.top.sync(s),this.bottom.sync(r)
for(let t of o)t.dom.classList.add("cm-panel"),t.mount&&t.mount()}else for(let n of this.panels)n.update&&n.update(t)}destroy(){this.top.sync([]),this.bottom.sync([])}},{provide:t=>Ei.scrollMargins.of((e=>{let i=e.plugin(t)
return i&&{top:i.top.scrollMargin(),bottom:i.bottom.scrollMargin()}}))})
class qn{constructor(t,e,i){this.view=t,this.top=e,this.container=i,this.dom=void 0,this.classes="",this.panels=[],this.syncClasses()}sync(t){for(let e of this.panels)e.destroy&&t.indexOf(e)<0&&e.destroy()
this.panels=t,this.syncDOM()}syncDOM(){if(0==this.panels.length)return void(this.dom&&(this.dom.remove(),this.dom=void 0))
if(!this.dom){this.dom=document.createElement("div"),this.dom.className=this.top?"cm-panels cm-panels-top":"cm-panels cm-panels-bottom",this.dom.style[this.top?"top":"bottom"]="0"
let t=this.container||this.view.dom
t.insertBefore(this.dom,this.top?t.firstChild:null)}let t=this.dom.firstChild
for(let e of this.panels)if(e.dom.parentNode==this.dom){for(;t!=e.dom;)t=Yn(t)
t=t.nextSibling}else this.dom.insertBefore(e.dom,t)
for(;t;)t=Yn(t)}scrollMargin(){return!this.dom||this.container?0:Math.max(0,this.top?this.dom.getBoundingClientRect().bottom-Math.max(0,this.view.scrollDOM.getBoundingClientRect().top):Math.min(innerHeight,this.view.scrollDOM.getBoundingClientRect().bottom)-this.dom.getBoundingClientRect().top)}syncClasses(){if(this.container&&this.classes!=this.view.themeClasses){for(let t of this.classes.split(" "))t&&this.container.classList.remove(t)
for(let t of(this.classes=this.view.themeClasses).split(" "))t&&this.container.classList.add(t)}}}function Yn(t){let e=t.nextSibling
return t.remove(),e}const zn=n.Facet.define({enables:Un})
class Bn extends n.RangeValue{compare(t){return this==t||this.constructor==t.constructor&&this.eq(t)}eq(t){return!1}destroy(t){}}Bn.prototype.elementClass="",Bn.prototype.toDOM=void 0,Bn.prototype.mapMode=n.MapMode.TrackBefore,Bn.prototype.startSide=Bn.prototype.endSide=-1,Bn.prototype.point=!0
const Gn=n.Facet.define(),Fn={class:"",renderEmptyElements:!1,elementStyle:"",markers:()=>n.RangeSet.empty,lineMarker:()=>null,lineMarkerChange:null,initialSpacer:null,updateSpacer:null,domEventHandlers:{}},Hn=n.Facet.define(),Kn=n.Facet.define({combine:t=>t.some((t=>t))})
function Jn(t){let e=[ts]
return t&&!1===t.fixed&&e.push(Kn.of(!0)),e}const ts=_t.fromClass(class{constructor(t){this.view=t,this.prevViewport=t.viewport,this.dom=document.createElement("div"),this.dom.className="cm-gutters",this.dom.setAttribute("aria-hidden","true"),this.dom.style.minHeight=this.view.contentHeight+"px",this.gutters=t.state.facet(Hn).map((e=>new ss(t,e)))
for(let e of this.gutters)this.dom.appendChild(e.dom)
this.fixed=!t.state.facet(Kn),this.fixed&&(this.dom.style.position="sticky"),this.syncGutters(!1),t.scrollDOM.insertBefore(this.dom,t.contentDOM)}update(t){if(this.updateGutters(t)){let e=this.prevViewport,i=t.view.viewport,n=Math.min(e.to,i.to)-Math.max(e.from,i.from)
this.syncGutters(n<.8*(i.to-i.from))}t.geometryChanged&&(this.dom.style.minHeight=this.view.contentHeight+"px"),this.view.state.facet(Kn)!=!this.fixed&&(this.fixed=!this.fixed,this.dom.style.position=this.fixed?"sticky":""),this.prevViewport=t.view.viewport}syncGutters(t){let i=this.dom.nextSibling
t&&this.dom.remove()
let s=n.RangeSet.iter(this.view.state.facet(Gn),this.view.viewport.from),r=[],o=this.gutters.map((t=>new ns(t,this.view.viewport,-this.view.documentPadding.top)))
for(let n of this.view.viewportLineBlocks){let t
if(Array.isArray(n.type)){for(let i of n.type)if(i.type==e.BlockType.Text){t=i
break}}else t=n.type==e.BlockType.Text?n:void 0
if(t){r.length&&(r=[]),is(s,r,n.from)
for(let e of o)e.line(this.view,t,r)}}for(let e of o)e.finish()
t&&this.view.scrollDOM.insertBefore(this.dom,i)}updateGutters(t){let e=t.startState.facet(Hn),i=t.state.facet(Hn),s=t.docChanged||t.heightChanged||t.viewportChanged||!n.RangeSet.eq(t.startState.facet(Gn),t.state.facet(Gn),t.view.viewport.from,t.view.viewport.to)
if(e==i)for(let n of this.gutters)n.update(t)&&(s=!0)
else{s=!0
let n=[]
for(let s of i){let i=e.indexOf(s)
i<0?n.push(new ss(this.view,s)):(this.gutters[i].update(t),n.push(this.gutters[i]))}for(let t of this.gutters)t.dom.remove(),n.indexOf(t)<0&&t.destroy()
for(let t of n)this.dom.appendChild(t.dom)
this.gutters=n}return s}destroy(){for(let t of this.gutters)t.destroy()
this.dom.remove()}},{provide:t=>Ei.scrollMargins.of((i=>{let n=i.plugin(t)
return n&&0!=n.gutters.length&&n.fixed?i.textDirection==e.Direction.LTR?{left:n.dom.offsetWidth}:{right:n.dom.offsetWidth}:null}))})
function es(t){return Array.isArray(t)?t:[t]}function is(t,e,i){for(;t.value&&t.from<=i;)t.from==i&&e.push(t.value),t.next()}class ns{constructor(t,e,i){this.gutter=t,this.height=i,this.localMarkers=[],this.i=0,this.cursor=n.RangeSet.iter(t.markers,e.from)}line(t,e,i){this.localMarkers.length&&(this.localMarkers=[]),is(this.cursor,this.localMarkers,e.from)
let n=i.length?this.localMarkers.concat(i):this.localMarkers,s=this.gutter.config.lineMarker(t,e,n)
s&&n.unshift(s)
let r=this.gutter
if(0==n.length&&!r.config.renderEmptyElements)return
let o=e.top-this.height
if(this.i==r.elements.length){let i=new rs(t,e.height,o,n)
r.elements.push(i),r.dom.appendChild(i.dom)}else r.elements[this.i].update(t,e.height,o,n)
this.height=e.bottom,this.i++}finish(){let t=this.gutter
for(;t.elements.length>this.i;){let e=t.elements.pop()
t.dom.removeChild(e.dom),e.destroy()}}}class ss{constructor(t,e){this.view=t,this.config=e,this.elements=[],this.spacer=null,this.dom=document.createElement("div"),this.dom.className="cm-gutter"+(this.config.class?" "+this.config.class:"")
for(let i in e.domEventHandlers)this.dom.addEventListener(i,(n=>{let s=t.lineBlockAtHeight(n.clientY-t.documentTop)
e.domEventHandlers[i](t,s,n)&&n.preventDefault()}))
this.markers=es(e.markers(t)),e.initialSpacer&&(this.spacer=new rs(t,0,0,[e.initialSpacer(t)]),this.dom.appendChild(this.spacer.dom),this.spacer.dom.style.cssText+="visibility: hidden; pointer-events: none")}update(t){let e=this.markers
if(this.markers=es(this.config.markers(t.view)),this.spacer&&this.config.updateSpacer){let e=this.config.updateSpacer(this.spacer.markers[0],t)
e!=this.spacer.markers[0]&&this.spacer.update(t.view,0,0,[e])}let i=t.view.viewport
return!n.RangeSet.eq(this.markers,e,i.from,i.to)||!!this.config.lineMarkerChange&&this.config.lineMarkerChange(t)}destroy(){for(let t of this.elements)t.destroy()}}class rs{constructor(t,e,i,n){this.height=-1,this.above=0,this.markers=[],this.dom=document.createElement("div"),this.dom.className="cm-gutterElement",this.update(t,e,i,n)}update(t,e,i,n){this.height!=e&&(this.dom.style.height=(this.height=e)+"px"),this.above!=i&&(this.dom.style.marginTop=(this.above=i)?i+"px":""),function(t,e){if(t.length!=e.length)return!1
for(let i=0;i<t.length;i++)if(!t[i].compare(e[i]))return!1
return!0}(this.markers,n)||this.setMarkers(t,n)}setMarkers(t,e){let i="cm-gutterElement",n=this.dom.firstChild
for(let s=0,r=0;;){let o=r,a=s<e.length?e[s++]:null,l=!1
if(a){let t=a.elementClass
t&&(i+=" "+t)
for(let e=r;e<this.markers.length;e++)if(this.markers[e].compare(a)){o=e,l=!0
break}}else o=this.markers.length
for(;r<o;){let t=this.markers[r++]
if(t.toDOM){t.destroy(n)
let e=n.nextSibling
n.remove(),n=e}}if(!a)break
a.toDOM&&(l?n=n.nextSibling:this.dom.insertBefore(a.toDOM(t),n)),l&&r++}this.dom.className=i,this.markers=e}destroy(){this.setMarkers(null,[])}}const os=n.Facet.define(),as=n.Facet.define({combine:t=>n.combineConfig(t,{formatNumber:String,domEventHandlers:{}},{domEventHandlers(t,e){let i=Object.assign({},t)
for(let n in e){let t=i[n],s=e[n]
i[n]=t?(e,i,n)=>t(e,i,n)||s(e,i,n):s}return i}})})
class ls extends Bn{constructor(t){super(),this.number=t}eq(t){return this.number==t.number}toDOM(){return document.createTextNode(this.number)}}function hs(t,e){return t.state.facet(as).formatNumber(e,t.state)}const cs=Hn.compute([as],(t=>({class:"cm-lineNumbers",renderEmptyElements:!1,markers:t=>t.state.facet(os),lineMarker:(t,e,i)=>i.some((t=>t.toDOM))?null:new ls(hs(t,t.state.doc.lineAt(e.from).number)),lineMarkerChange:t=>t.startState.facet(as)!=t.state.facet(as),initialSpacer:t=>new ls(hs(t,us(t.state.doc.lines))),updateSpacer(t,e){let i=hs(e.view,us(e.view.state.doc.lines))
return i==t.number?t:new ls(i)},domEventHandlers:t.facet(as).domEventHandlers})))
function us(t){let e=9
for(;e<t;)e=10*e+9
return e}const fs=new class extends Bn{constructor(){super(...arguments),this.elementClass="cm-activeLineGutter"}},ds=Gn.compute(["selection"],(t=>{let e=[],i=-1
for(let n of t.selection.ranges){let s=t.doc.lineAt(n.head).from
s>i&&(i=s,e.push(fs.range(s)))}return n.RangeSet.of(e)})),ps=new Map
function ms(t){return _t.define((e=>({decorations:t.createDeco(e),update(e){this.decorations=t.updateDeco(e,this.decorations)}})),{decorations:t=>t.decorations})}const gs=ms(new un({regexp:/\t| +/g,decoration:t=>function(t){let e=ps.get(t)
return e||ps.set(t,e=rt.mark({attributes:"\t"===t?{class:"cm-highlightTab"}:{class:"cm-highlightSpace","data-display":t.replace(/ /g,"·")}})),e}(t[0]),boundary:/\S/})),Os=ms(new un({regexp:/\s+$/g,decoration:rt.mark({class:"cm-trailingSpace"}),boundary:/\S/})),vs={HeightMap:Ke,HeightOracle:ze,MeasuredHeights:Be,QueryType:Fe,ChangedRange:Dt,computeOrder:Ht,moveVisually:te}
e.BidiSpan=Gt,e.BlockInfo=Ge,e.Decoration=rt,e.EditorView=Ei,e.GutterMarker=Bn,e.MatchDecorator=un,e.RectangleMarker=qi,e.ViewPlugin=_t,e.ViewUpdate=Vt,e.WidgetType=st,e.__test=vs,e.closeHoverTooltips=Ln,e.crosshairCursor=function(t={}){let[e,i]=Pn[t.key||"Alt"],n=_t.fromClass(class{constructor(t){this.view=t,this.isDown=!1}set(t){this.isDown!=t&&(this.isDown=t,this.view.update([]))}},{eventHandlers:{keydown(t){this.set(t.keyCode==e||i(t))},keyup(t){t.keyCode!=e&&i(t)||this.set(!1)},mousemove(t){this.set(i(t))}}})
return[n,Ei.contentAttributes.of((t=>{var e
return(null===(e=t.plugin(n))||void 0===e?void 0:e.isDown)?Tn:null}))]},e.drawSelection=function(t={}){return[Ji.of(t),en,sn,on,St.of(!0)]},e.dropCursor=function(){return[ln,hn]},e.getPanel=function(t,e){let i=t.plugin(Un),n=i?i.specs.indexOf(e):-1
return n>-1?i.panels[n]:null},e.getTooltip=function(t,e){let i=t.plugin(En)
if(!i)return null
let n=i.manager.tooltips.indexOf(e)
return n<0?null:i.manager.tooltipViews[n]},e.gutter=function(t){return[Jn(),Hn.of(Object.assign(Object.assign({},Fn),t))]},e.gutterLineClass=Gn,e.gutters=Jn,e.hasHoverTooltips=function(t){return t.facet(Rn).some((t=>t))},e.highlightActiveLine=function(){return xn},e.highlightActiveLineGutter=function(){return ds},e.highlightSpecialChars=function(t={}){return[gn.of(t),On||(On=_t.fromClass(class{constructor(t){this.view=t,this.decorations=rt.none,this.decorationCache=Object.create(null),this.decorator=this.makeDecorator(t.state.facet(gn)),this.decorations=this.decorator.createDeco(t)}makeDecorator(t){return new un({regexp:t.specialChars,decoration:(e,i,s)=>{let{doc:r}=i.state,o=n.codePointAt(e[0],0)
if(9==o){let t=r.lineAt(s),e=i.state.tabSize,o=n.countColumn(t.text,e,s-t.from)
return rt.replace({widget:new yn((e-o%e)*this.view.defaultCharacterWidth)})}return this.decorationCache[o]||(this.decorationCache[o]=rt.replace({widget:new vn(t,o)}))},boundary:t.replaceTabs?void 0:/[^]/})}update(t){let e=t.state.facet(gn)
t.startState.facet(gn)!=e?(this.decorator=this.makeDecorator(e),this.decorations=this.decorator.createDeco(t.view)):this.decorations=this.decorator.updateDeco(t,this.decorations)}},{decorations:t=>t.decorations}))]},e.highlightTrailingWhitespace=function(){return Os},e.highlightWhitespace=function(){return gs},e.hoverTooltip=function(t,e={}){let i=n.StateEffect.define(),s=n.StateField.define({create:()=>null,update(t,s){if(t&&(e.hideOnChange&&(s.docChanged||s.selection)||e.hideOn&&e.hideOn(s,t)))return null
if(t&&s.docChanged){let e=s.changes.mapPos(t.pos,-1,n.MapMode.TrackDel)
if(null==e)return null
let i=Object.assign(Object.create(null),t)
i.pos=e,null!=t.end&&(i.end=s.changes.mapPos(t.end)),t=i}for(let e of s.effects)e.is(i)&&(t=e.value),e.is(jn)&&(t=null)
return t},provide:t=>Rn.from(t)})
return[s,_t.define((n=>new Vn(n,t,s,i,e.hoverTime||300))),Dn]},e.keymap=Xi,e.layer=Hi,e.lineNumberMarkers=os,e.lineNumbers=function(t={}){return[as.of(t),Jn(),cs]},e.logException=Pt,e.panels=function(t){return t?[Nn.of(t)]:[]},e.placeholder=function(t){return _t.fromClass(class{constructor(e){this.view=e,this.placeholder=rt.set([rt.widget({widget:new Sn(t),side:1}).range(0)])}get decorations(){return this.view.state.doc.length?rt.none:this.placeholder}},{decorations:t=>t.decorations})},e.rectangularSelection=function(t){let e=(null==t?void 0:t.eventFilter)||(t=>t.altKey&&0==t.button)
return Ei.mouseSelectionStyle.of(((t,i)=>e(i)?function(t,e){let i=Qn(t,e),s=t.state.selection
return i?{update(t){if(t.docChanged){let e=t.changes.mapPos(t.startState.doc.line(i.line).from),n=t.state.doc.lineAt(e)
i={line:n.number,col:i.col,off:Math.min(i.off,n.length)},s=s.map(t.changes)}},get(e,r,o){let a=Qn(t,e)
if(!a)return s
let l=function(t,e,i){let s=Math.min(e.line,i.line),r=Math.max(e.line,i.line),o=[]
if(e.off>kn||i.off>kn||e.col<0||i.col<0){let a=Math.min(e.off,i.off),l=Math.max(e.off,i.off)
for(let e=s;e<=r;e++){let i=t.doc.line(e)
i.length<=l&&o.push(n.EditorSelection.range(i.from+a,i.to+l))}}else{let a=Math.min(e.col,i.col),l=Math.max(e.col,i.col)
for(let e=s;e<=r;e++){let i=t.doc.line(e),s=n.findColumn(i.text,a,t.tabSize,!0)
if(s<0)o.push(n.EditorSelection.cursor(i.to))
else{let e=n.findColumn(i.text,l,t.tabSize)
o.push(n.EditorSelection.range(i.from+s,i.from+e))}}}return o}(t.state,i,a)
return l.length?o?n.EditorSelection.create(l.concat(s.ranges)):n.EditorSelection.create(l):s}}:null}(t,i):null))},e.repositionTooltips=function(t){var e
null===(e=t.plugin(En))||void 0===e||e.maybeMeasure()},e.runScopeHandlers=function(t,e,i){return Ui(Li(t.state),e,t,i)},e.scrollPastEnd=function(){return[bn,Mt.of((t=>{var e
return(null===(e=t.plugin(bn))||void 0===e?void 0:e.attrs)||null}))]},e.showPanel=zn,e.showTooltip=Wn,e.tooltips=function(t={}){return Cn.of(t)}},897:(t,e)=>{"use strict"
Object.defineProperty(e,"__esModule",{value:!0})
const i=1024
let n=0
class s{constructor(t,e){this.from=t,this.to=e}}class r{constructor(t={}){this.id=n++,this.perNode=!!t.perNode,this.deserialize=t.deserialize||(()=>{throw new Error("This node type doesn't define a deserialize function")})}add(t){if(this.perNode)throw new RangeError("Can't add per-node props to node types")
return"function"!=typeof t&&(t=l.match(t)),e=>{let i=t(e)
return void 0===i?null:[this,i]}}}r.closedBy=new r({deserialize:t=>t.split(" ")}),r.openedBy=new r({deserialize:t=>t.split(" ")}),r.group=new r({deserialize:t=>t.split(" ")}),r.contextHash=new r({perNode:!0}),r.lookAhead=new r({perNode:!0}),r.mounted=new r({perNode:!0})
class o{constructor(t,e,i){this.tree=t,this.overlay=e,this.parser=i}}const a=Object.create(null)
class l{constructor(t,e,i,n=0){this.name=t,this.props=e,this.id=i,this.flags=n}static define(t){let e=t.props&&t.props.length?Object.create(null):a,i=(t.top?1:0)|(t.skipped?2:0)|(t.error?4:0)|(null==t.name?8:0),n=new l(t.name||"",e,t.id,i)
if(t.props)for(let s of t.props)if(Array.isArray(s)||(s=s(n)),s){if(s[0].perNode)throw new RangeError("Can't store a per-node prop on a node type")
e[s[0].id]=s[1]}return n}prop(t){return this.props[t.id]}get isTop(){return(1&this.flags)>0}get isSkipped(){return(2&this.flags)>0}get isError(){return(4&this.flags)>0}get isAnonymous(){return(8&this.flags)>0}is(t){if("string"==typeof t){if(this.name==t)return!0
let e=this.prop(r.group)
return!!e&&e.indexOf(t)>-1}return this.id==t}static match(t){let e=Object.create(null)
for(let i in t)for(let n of i.split(" "))e[n]=t[i]
return t=>{for(let i=t.prop(r.group),n=-1;n<(i?i.length:0);n++){let s=e[n<0?t.name:i[n]]
if(s)return s}}}}l.none=new l("",Object.create(null),0,8)
class h{constructor(t){this.types=t
for(let e=0;e<t.length;e++)if(t[e].id!=e)throw new RangeError("Node type ids should correspond to array positions when creating a node set")}extend(...t){let e=[]
for(let i of this.types){let n=null
for(let e of t){let t=e(i)
t&&(n||(n=Object.assign({},i.props)),n[t[0].id]=t[1])}e.push(n?new l(i.name,n,i.id,i.flags):i)}return new h(e)}}const c=new WeakMap,u=new WeakMap
var f
e.IterMode=void 0,(f=e.IterMode||(e.IterMode={}))[f.ExcludeBuffers=1]="ExcludeBuffers",f[f.IncludeAnonymous=2]="IncludeAnonymous",f[f.IgnoreMounts=4]="IgnoreMounts",f[f.IgnoreOverlays=8]="IgnoreOverlays"
class d{constructor(t,e,i,n,s){if(this.type=t,this.children=e,this.positions=i,this.length=n,this.props=null,s&&s.length){this.props=Object.create(null)
for(let[t,e]of s)this.props["number"==typeof t?t:t.id]=e}}toString(){let t=this.prop(r.mounted)
if(t&&!t.overlay)return t.tree.toString()
let e=""
for(let i of this.children){let t=i.toString()
t&&(e&&(e+=","),e+=t)}return this.type.name?(/\W/.test(this.type.name)&&!this.type.isError?JSON.stringify(this.type.name):this.type.name)+(e.length?"("+e+")":""):e}cursor(t=0){return new k(this.topNode,t)}cursorAt(t,e=0,i=0){let n=c.get(this)||this.topNode,s=new k(n)
return s.moveTo(t,e),c.set(this,s._tree),s}get topNode(){return new y(this,0,0,null)}resolve(t,e=0){let i=v(c.get(this)||this.topNode,t,e,!1)
return c.set(this,i),i}resolveInner(t,e=0){let i=v(u.get(this)||this.topNode,t,e,!0)
return u.set(this,i),i}iterate(t){let{enter:i,leave:n,from:s=0,to:r=this.length}=t
for(let o=this.cursor((t.mode||0)|e.IterMode.IncludeAnonymous);;){let t=!1
if(o.from<=r&&o.to>=s&&(o.type.isAnonymous||!1!==i(o))){if(o.firstChild())continue
t=!0}for(;t&&n&&!o.type.isAnonymous&&n(o),!o.nextSibling();){if(!o.parent())return
t=!0}}}prop(t){return t.perNode?this.props?this.props[t.id]:void 0:this.type.prop(t)}get propValues(){let t=[]
if(this.props)for(let e in this.props)t.push([+e,this.props[e]])
return t}balance(t={}){return this.children.length<=8?this:$(l.none,this.children,this.positions,0,this.children.length,0,this.length,((t,e,i)=>new d(this.type,t,e,i,this.propValues)),t.makeTree||((t,e,i)=>new d(l.none,t,e,i)))}static build(t){return function(t){var e
let{buffer:n,nodeSet:s,maxBufferLength:o=i,reused:a=[],minRepeatType:l=s.types.length}=t,h=Array.isArray(n)?new p(n,n.length):n,c=s.types,u=0,f=0
function g(t,e,i,n,p){let{id:b,start:w,end:x,size:S}=h,k=f
for(;S<0;){if(h.next(),-1==S){let e=a[b]
return i.push(e),void n.push(w-t)}if(-3==S)return void(u=b)
if(-4==S)return void(f=b)
throw new RangeError(`Unrecognized record size: ${S}`)}let Q,P,T=c[b],A=w-t
if(x-w<=o&&(P=function(t,e){let i=h.fork(),n=0,s=0,r=0,a=i.end-o,c={size:0,start:0,skip:0}
t:for(let o=i.pos-t;i.pos>o;){let t=i.size
if(i.id==e&&t>=0){c.size=n,c.start=s,c.skip=r,r+=4,n+=4,i.next()
continue}let h=i.pos-t
if(t<0||h<o||i.start<a)break
let u=i.id>=l?4:0,f=i.start
for(i.next();i.pos>h;){if(i.size<0){if(-3!=i.size)break t
u+=4}else i.id>=l&&(u+=4)
i.next()}s=f,n+=t,r+=u}return(e<0||n==t)&&(c.size=n,c.start=s,c.skip=r),c.size>4?c:void 0}(h.pos-e,p))){let e=new Uint16Array(P.size-P.skip),i=h.pos-P.size,n=e.length
for(;h.pos>i;)n=y(P.start,e,n)
Q=new m(e,x-P.start,s),A=P.start-t}else{let t=h.pos-S
h.next()
let e=[],i=[],n=b>=l?b:-1,s=0,a=x
for(;h.pos>t;)n>=0&&h.id==n&&h.size>=0?(h.end<=a-o&&(O(e,i,w,s,h.end,a,n,k),s=e.length,a=h.end),h.next()):g(w,t,e,i,n)
if(n>=0&&s>0&&s<e.length&&O(e,i,w,s,w,a,n,k),e.reverse(),i.reverse(),n>-1&&s>0){let t=function(t){return(e,i,n)=>{let s,o,a=0,l=e.length-1
if(l>=0&&(s=e[l])instanceof d){if(!l&&s.type==t&&s.length==n)return s;(o=s.prop(r.lookAhead))&&(a=i[l]+s.length+o)}return v(t,e,i,n,a)}}(T)
Q=$(T,e,i,0,e.length,0,x-w,t,t)}else Q=v(T,e,i,x-w,k-x)}i.push(Q),n.push(A)}function O(t,e,i,n,r,o,a,l){let h=[],c=[]
for(;t.length>n;)h.push(t.pop()),c.push(e.pop()+i-r)
t.push(v(s.types[a],h,c,o-r,l-o)),e.push(r-i)}function v(t,e,i,n,s=0,o){if(u){let t=[r.contextHash,u]
o=o?[t].concat(o):[t]}if(s>25){let t=[r.lookAhead,s]
o=o?[t].concat(o):[t]}return new d(t,e,i,n,o)}function y(t,e,i){let{id:n,start:s,end:r,size:o}=h
if(h.next(),o>=0&&n<l){let a=i
if(o>4){let n=h.pos-(o-4)
for(;h.pos>n;)i=y(t,e,i)}e[--i]=a,e[--i]=r-t,e[--i]=s-t,e[--i]=n}else-3==o?u=n:-4==o&&(f=n)
return i}let b=[],w=[]
for(;h.pos>0;)g(t.start||0,t.bufferStart||0,b,w,-1)
let x=null!==(e=t.length)&&void 0!==e?e:b.length?w[0]+b[0].length:0
return new d(c[t.topID],b.reverse(),w.reverse(),x)}(t)}}d.empty=new d(l.none,[],[],0)
class p{constructor(t,e){this.buffer=t,this.index=e}get id(){return this.buffer[this.index-4]}get start(){return this.buffer[this.index-3]}get end(){return this.buffer[this.index-2]}get size(){return this.buffer[this.index-1]}get pos(){return this.index}next(){this.index-=4}fork(){return new p(this.buffer,this.index)}}class m{constructor(t,e,i){this.buffer=t,this.length=e,this.set=i}get type(){return l.none}toString(){let t=[]
for(let e=0;e<this.buffer.length;)t.push(this.childString(e)),e=this.buffer[e+3]
return t.join(",")}childString(t){let e=this.buffer[t],i=this.buffer[t+3],n=this.set.types[e],s=n.name
if(/\W/.test(s)&&!n.isError&&(s=JSON.stringify(s)),i==(t+=4))return s
let r=[]
for(;t<i;)r.push(this.childString(t)),t=this.buffer[t+3]
return s+"("+r.join(",")+")"}findChild(t,e,i,n,s){let{buffer:r}=this,o=-1
for(let a=t;a!=e&&!(g(s,n,r[a+1],r[a+2])&&(o=a,i>0));a=r[a+3]);return o}slice(t,e,i){let n=this.buffer,s=new Uint16Array(e-t),r=0
for(let o=t,a=0;o<e;){s[a++]=n[o++],s[a++]=n[o++]-i
let e=s[a++]=n[o++]-i
s[a++]=n[o++]-t,r=Math.max(r,e)}return new m(s,r,this.set)}}function g(t,e,i,n){switch(t){case-2:return i<e
case-1:return n>=e&&i<e
case 0:return i<e&&n>e
case 1:return i<=e&&n>e
case 2:return n>e
case 4:return!0}}function O(t,e){let i=t.childBefore(e)
for(;i;){let e=i.lastChild
if(!e||e.to!=i.to)break
e.type.isError&&e.from==e.to?(t=i,i=e.prevSibling):i=e}return t}function v(t,i,n,s){for(var r;t.from==t.to||(n<1?t.from>=i:t.from>i)||(n>-1?t.to<=i:t.to<i);){let e=!s&&t instanceof y&&t.index<0?null:t.parent
if(!e)return t
t=e}let o=s?0:e.IterMode.IgnoreOverlays
if(s)for(let e=t,a=e.parent;a;e=a,a=e.parent)e instanceof y&&e.index<0&&(null===(r=a.enter(i,n,o))||void 0===r?void 0:r.from)!=e.from&&(t=a)
for(;;){let e=t.enter(i,n,o)
if(!e)return t
t=e}}class y{constructor(t,e,i,n){this._tree=t,this.from=e,this.index=i,this._parent=n}get type(){return this._tree.type}get name(){return this._tree.type.name}get to(){return this.from+this._tree.length}nextChild(t,i,n,s,o=0){for(let a=this;;){for(let{children:l,positions:h}=a._tree,c=i>0?l.length:-1;t!=c;t+=i){let c=l[t],u=h[t]+a.from
if(g(s,n,u,u+c.length))if(c instanceof m){if(o&e.IterMode.ExcludeBuffers)continue
let r=c.findChild(0,c.buffer.length,i,n-u,s)
if(r>-1)return new S(new x(a,c,t,u),null,r)}else if(o&e.IterMode.IncludeAnonymous||!c.type.isAnonymous||Q(c)){let l
if(!(o&e.IterMode.IgnoreMounts)&&c.props&&(l=c.prop(r.mounted))&&!l.overlay)return new y(l.tree,u,t,a)
let h=new y(c,u,t,a)
return o&e.IterMode.IncludeAnonymous||!h.type.isAnonymous?h:h.nextChild(i<0?c.children.length-1:0,i,n,s)}}if(o&e.IterMode.IncludeAnonymous||!a.type.isAnonymous)return null
if(t=a.index>=0?a.index+i:i<0?-1:a._parent._tree.children.length,a=a._parent,!a)return null}}get firstChild(){return this.nextChild(0,1,0,4)}get lastChild(){return this.nextChild(this._tree.children.length-1,-1,0,4)}childAfter(t){return this.nextChild(0,1,t,2)}childBefore(t){return this.nextChild(this._tree.children.length-1,-1,t,-2)}enter(t,i,n=0){let s
if(!(n&e.IterMode.IgnoreOverlays)&&(s=this._tree.prop(r.mounted))&&s.overlay){let e=t-this.from
for(let{from:t,to:n}of s.overlay)if((i>0?t<=e:t<e)&&(i<0?n>=e:n>e))return new y(s.tree,s.overlay[0].from+this.from,-1,this)}return this.nextChild(0,1,t,i,n)}nextSignificantParent(){let t=this
for(;t.type.isAnonymous&&t._parent;)t=t._parent
return t}get parent(){return this._parent?this._parent.nextSignificantParent():null}get nextSibling(){return this._parent&&this.index>=0?this._parent.nextChild(this.index+1,1,0,4):null}get prevSibling(){return this._parent&&this.index>=0?this._parent.nextChild(this.index-1,-1,0,4):null}cursor(t=0){return new k(this,t)}get tree(){return this._tree}toTree(){return this._tree}resolve(t,e=0){return v(this,t,e,!1)}resolveInner(t,e=0){return v(this,t,e,!0)}enterUnfinishedNodesBefore(t){return O(this,t)}getChild(t,e=null,i=null){let n=b(this,t,e,i)
return n.length?n[0]:null}getChildren(t,e=null,i=null){return b(this,t,e,i)}toString(){return this._tree.toString()}get node(){return this}matchContext(t){return w(this,t)}}function b(t,e,i,n){let s=t.cursor(),r=[]
if(!s.firstChild())return r
if(null!=i)for(;!s.type.is(i);)if(!s.nextSibling())return r
for(;;){if(null!=n&&s.type.is(n))return r
if(s.type.is(e)&&r.push(s.node),!s.nextSibling())return null==n?r:[]}}function w(t,e,i=e.length-1){for(let n=t.parent;i>=0;n=n.parent){if(!n)return!1
if(!n.type.isAnonymous){if(e[i]&&e[i]!=n.name)return!1
i--}}return!0}class x{constructor(t,e,i,n){this.parent=t,this.buffer=e,this.index=i,this.start=n}}class S{get name(){return this.type.name}get from(){return this.context.start+this.context.buffer.buffer[this.index+1]}get to(){return this.context.start+this.context.buffer.buffer[this.index+2]}constructor(t,e,i){this.context=t,this._parent=e,this.index=i,this.type=t.buffer.set.types[t.buffer.buffer[i]]}child(t,e,i){let{buffer:n}=this.context,s=n.findChild(this.index+4,n.buffer[this.index+3],t,e-this.context.start,i)
return s<0?null:new S(this.context,this,s)}get firstChild(){return this.child(1,0,4)}get lastChild(){return this.child(-1,0,4)}childAfter(t){return this.child(1,t,2)}childBefore(t){return this.child(-1,t,-2)}enter(t,i,n=0){if(n&e.IterMode.ExcludeBuffers)return null
let{buffer:s}=this.context,r=s.findChild(this.index+4,s.buffer[this.index+3],i>0?1:-1,t-this.context.start,i)
return r<0?null:new S(this.context,this,r)}get parent(){return this._parent||this.context.parent.nextSignificantParent()}externalSibling(t){return this._parent?null:this.context.parent.nextChild(this.context.index+t,t,0,4)}get nextSibling(){let{buffer:t}=this.context,e=t.buffer[this.index+3]
return e<(this._parent?t.buffer[this._parent.index+3]:t.buffer.length)?new S(this.context,this._parent,e):this.externalSibling(1)}get prevSibling(){let{buffer:t}=this.context,e=this._parent?this._parent.index+4:0
return this.index==e?this.externalSibling(-1):new S(this.context,this._parent,t.findChild(e,this.index,-1,0,4))}cursor(t=0){return new k(this,t)}get tree(){return null}toTree(){let t=[],e=[],{buffer:i}=this.context,n=this.index+4,s=i.buffer[this.index+3]
if(s>n){let r=i.buffer[this.index+1]
t.push(i.slice(n,s,r)),e.push(0)}return new d(this.type,t,e,this.to-this.from)}resolve(t,e=0){return v(this,t,e,!1)}resolveInner(t,e=0){return v(this,t,e,!0)}enterUnfinishedNodesBefore(t){return O(this,t)}toString(){return this.context.buffer.childString(this.index)}getChild(t,e=null,i=null){let n=b(this,t,e,i)
return n.length?n[0]:null}getChildren(t,e=null,i=null){return b(this,t,e,i)}get node(){return this}matchContext(t){return w(this,t)}}class k{get name(){return this.type.name}constructor(t,e=0){if(this.mode=e,this.buffer=null,this.stack=[],this.index=0,this.bufferNode=null,t instanceof y)this.yieldNode(t)
else{this._tree=t.context.parent,this.buffer=t.context
for(let e=t._parent;e;e=e._parent)this.stack.unshift(e.index)
this.bufferNode=t,this.yieldBuf(t.index)}}yieldNode(t){return!!t&&(this._tree=t,this.type=t.type,this.from=t.from,this.to=t.to,!0)}yieldBuf(t,e){this.index=t
let{start:i,buffer:n}=this.buffer
return this.type=e||n.set.types[n.buffer[t]],this.from=i+n.buffer[t+1],this.to=i+n.buffer[t+2],!0}yield(t){return!!t&&(t instanceof y?(this.buffer=null,this.yieldNode(t)):(this.buffer=t.context,this.yieldBuf(t.index,t.type)))}toString(){return this.buffer?this.buffer.buffer.childString(this.index):this._tree.toString()}enterChild(t,e,i){if(!this.buffer)return this.yield(this._tree.nextChild(t<0?this._tree._tree.children.length-1:0,t,e,i,this.mode))
let{buffer:n}=this.buffer,s=n.findChild(this.index+4,n.buffer[this.index+3],t,e-this.buffer.start,i)
return!(s<0)&&(this.stack.push(this.index),this.yieldBuf(s))}firstChild(){return this.enterChild(1,0,4)}lastChild(){return this.enterChild(-1,0,4)}childAfter(t){return this.enterChild(1,t,2)}childBefore(t){return this.enterChild(-1,t,-2)}enter(t,i,n=this.mode){return this.buffer?!(n&e.IterMode.ExcludeBuffers)&&this.enterChild(1,t,i):this.yield(this._tree.enter(t,i,n))}parent(){if(!this.buffer)return this.yieldNode(this.mode&e.IterMode.IncludeAnonymous?this._tree._parent:this._tree.parent)
if(this.stack.length)return this.yieldBuf(this.stack.pop())
let t=this.mode&e.IterMode.IncludeAnonymous?this.buffer.parent:this.buffer.parent.nextSignificantParent()
return this.buffer=null,this.yieldNode(t)}sibling(t){if(!this.buffer)return!!this._tree._parent&&this.yield(this._tree.index<0?null:this._tree._parent.nextChild(this._tree.index+t,t,0,4,this.mode))
let{buffer:e}=this.buffer,i=this.stack.length-1
if(t<0){let t=i<0?0:this.stack[i]+4
if(this.index!=t)return this.yieldBuf(e.findChild(t,this.index,-1,0,4))}else{let t=e.buffer[this.index+3]
if(t<(i<0?e.buffer.length:e.buffer[this.stack[i]+3]))return this.yieldBuf(t)}return i<0&&this.yield(this.buffer.parent.nextChild(this.buffer.index+t,t,0,4,this.mode))}nextSibling(){return this.sibling(1)}prevSibling(){return this.sibling(-1)}atLastNode(t){let i,n,{buffer:s}=this
if(s){if(t>0){if(this.index<s.buffer.buffer.length)return!1}else for(let t=0;t<this.index;t++)if(s.buffer.buffer[t+3]<this.index)return!1;({index:i,parent:n}=s)}else({index:i,_parent:n}=this._tree)
for(;n;({index:i,_parent:n}=n))if(i>-1)for(let s=i+t,r=t<0?-1:n._tree.children.length;s!=r;s+=t){let t=n._tree.children[s]
if(this.mode&e.IterMode.IncludeAnonymous||t instanceof m||!t.type.isAnonymous||Q(t))return!1}return!0}move(t,e){if(e&&this.enterChild(t,0,4))return!0
for(;;){if(this.sibling(t))return!0
if(this.atLastNode(t)||!this.parent())return!1}}next(t=!0){return this.move(1,t)}prev(t=!0){return this.move(-1,t)}moveTo(t,e=0){for(;(this.from==this.to||(e<1?this.from>=t:this.from>t)||(e>-1?this.to<=t:this.to<t))&&this.parent(););for(;this.enterChild(1,t,e););return this}get node(){if(!this.buffer)return this._tree
let t=this.bufferNode,e=null,i=0
if(t&&t.context==this.buffer)t:for(let n=this.index,s=this.stack.length;s>=0;){for(let r=t;r;r=r._parent)if(r.index==n){if(n==this.index)return r
e=r,i=s+1
break t}n=this.stack[--s]}for(let n=i;n<this.stack.length;n++)e=new S(this.buffer,e,this.stack[n])
return this.bufferNode=new S(this.buffer,e,this.index)}get tree(){return this.buffer?null:this._tree._tree}iterate(t,e){for(let i=0;;){let n=!1
if(this.type.isAnonymous||!1!==t(this)){if(this.firstChild()){i++
continue}this.type.isAnonymous||(n=!0)}for(;n&&e&&e(this),n=this.type.isAnonymous,!this.nextSibling();){if(!i)return
this.parent(),i--,n=!0}}}matchContext(t){if(!this.buffer)return w(this.node,t)
let{buffer:e}=this.buffer,{types:i}=e.set
for(let n=t.length-1,s=this.stack.length-1;n>=0;s--){if(s<0)return w(this.node,t,n)
let r=i[e.buffer[this.stack[s]]]
if(!r.isAnonymous){if(t[n]&&t[n]!=r.name)return!1
n--}}return!0}}function Q(t){return t.children.some((t=>t instanceof m||!t.type.isAnonymous||Q(t)))}const P=new WeakMap
function T(t,e){if(!t.isAnonymous||e instanceof m||e.type!=t)return 1
let i=P.get(e)
if(null==i){i=1
for(let n of e.children){if(n.type!=t||!(n instanceof d)){i=1
break}i+=T(t,n)}P.set(e,i)}return i}function $(t,e,i,n,s,r,o,a,l){let h=0
for(let d=n;d<s;d++)h+=T(t,e[d])
let c=Math.ceil(1.5*h/8),u=[],f=[]
return function e(i,n,s,o,a){for(let h=s;h<o;){let s=h,d=n[h],p=T(t,i[h])
for(h++;h<o;h++){let e=T(t,i[h])
if(p+e>=c)break
p+=e}if(h==s+1){if(p>c){let t=i[s]
e(t.children,t.positions,0,t.children.length,n[s]+a)
continue}u.push(i[s])}else{let e=n[h-1]+i[h-1].length-d
u.push($(t,i,n,s,h,d,e,null,l))}f.push(d+a-r)}}(e,i,n,s,0),(a||l)(u,f,o)}class A{constructor(t,e,i,n,s=!1,r=!1){this.from=t,this.to=e,this.tree=i,this.offset=n,this.open=(s?1:0)|(r?2:0)}get openStart(){return(1&this.open)>0}get openEnd(){return(2&this.open)>0}static addTree(t,e=[],i=!1){let n=[new A(0,t.length,t,0,!1,i)]
for(let s of e)s.to>t.length&&n.push(s)
return n}static applyChanges(t,e,i=128){if(!e.length)return t
let n=[],s=1,r=t.length?t[0]:null
for(let o=0,a=0,l=0;;o++){let h=o<e.length?e[o]:null,c=h?h.fromA:1e9
if(c-a>=i)for(;r&&r.from<c;){let e=r
if(a>=e.from||c<=e.to||l){let t=Math.max(e.from,a)-l,i=Math.min(e.to,c)-l
e=t>=i?null:new A(t,i,e.tree,e.offset+l,o>0,!!h)}if(e&&n.push(e),r.to>c)break
r=s<t.length?t[s++]:null}if(!h)break
a=h.toA,l=h.toA-h.toB}return n}}class _{constructor(t){this.string=t}get length(){return this.string.length}chunk(t){return this.string.slice(t)}get lineChunks(){return!1}read(t,e){return this.string.slice(t,e)}}class C{constructor(t,e,i,n,s){this.parser=t,this.parse=e,this.overlay=i,this.target=n,this.ranges=s}}class E{constructor(t,e,i,n,s,r,o){this.parser=t,this.predicate=e,this.mounts=i,this.index=n,this.start=s,this.target=r,this.prev=o,this.depth=0,this.ranges=[]}}const M=new r({perNode:!0})
class I{constructor(t,e,i,n,s){this.nest=e,this.input=i,this.fragments=n,this.ranges=s,this.inner=[],this.innerDone=0,this.baseTree=null,this.stoppedAt=null,this.baseParse=t}advance(){if(this.baseParse){let t=this.baseParse.advance()
if(!t)return null
if(this.baseParse=null,this.baseTree=t,this.startInner(),null!=this.stoppedAt)for(let e of this.inner)e.parse.stopAt(this.stoppedAt)}if(this.innerDone==this.inner.length){let t=this.baseTree
return null!=this.stoppedAt&&(t=new d(t.type,t.children,t.positions,t.length,t.propValues.concat([[M,this.stoppedAt]]))),t}let t=this.inner[this.innerDone],e=t.parse.advance()
if(e){this.innerDone++
let i=Object.assign(Object.create(null),t.target.props)
i[r.mounted.id]=new o(e,t.overlay,t.parser),t.target.props=i}return null}get parsedPos(){if(this.baseParse)return 0
let t=this.input.length
for(let e=this.innerDone;e<this.inner.length;e++)this.inner[e].ranges[0].from<t&&(t=Math.min(t,this.inner[e].parse.parsedPos))
return t}stopAt(t){if(this.stoppedAt=t,this.baseParse)this.baseParse.stopAt(t)
else for(let e=this.innerDone;e<this.inner.length;e++)this.inner[e].parse.stopAt(t)}startInner(){let t=new V(this.fragments),i=null,n=null,r=new k(new y(this.baseTree,this.ranges[0].from,0,null),e.IterMode.IncludeAnonymous|e.IterMode.IgnoreMounts)
t:for(let e,o;null==this.stoppedAt||r.from<this.stoppedAt;){let a,l=!0
if(t.hasNode(r)){if(i){let t=i.mounts.find((t=>t.frag.from<=r.from&&t.frag.to>=r.to&&t.mount.overlay))
if(t)for(let e of t.mount.overlay){let n=e.from+t.pos,s=e.to+t.pos
n>=r.from&&s<=r.to&&!i.ranges.some((t=>t.from<s&&t.to>n))&&i.ranges.push({from:n,to:s})}}l=!1}else if(n&&(o=W(n.ranges,r.from,r.to)))l=2!=o
else if(!r.type.isAnonymous&&r.from<r.to&&(e=this.nest(r,this.input))){r.tree||Z(r)
let o=t.findMounts(r.from,e.parser)
if("function"==typeof e.overlay)i=new E(e.parser,e.overlay,o,this.inner.length,r.from,r.tree,i)
else{let t=X(this.ranges,e.overlay||[new s(r.from,r.to)])
t.length&&this.inner.push(new C(e.parser,e.parser.startParse(this.input,L(o,t),t),e.overlay?e.overlay.map((t=>new s(t.from-r.from,t.to-r.from))):null,r.tree,t)),e.overlay?t.length&&(n={ranges:t,depth:0,prev:n}):l=!1}}else i&&(a=i.predicate(r))&&(!0===a&&(a=new s(r.from,r.to)),a.from<a.to&&i.ranges.push(a))
if(l&&r.firstChild())i&&i.depth++,n&&n.depth++
else for(;!r.nextSibling();){if(!r.parent())break t
if(i&&!--i.depth){let t=X(this.ranges,i.ranges)
t.length&&this.inner.splice(i.index,0,new C(i.parser,i.parser.startParse(this.input,L(i.mounts,t),t),i.ranges.map((t=>new s(t.from-i.start,t.to-i.start))),i.target,t)),i=i.prev}n&&!--n.depth&&(n=n.prev)}}}}function W(t,e,i){for(let n of t){if(n.from>=i)break
if(n.to>e)return n.from<=e&&n.to>=i?2:1}return 0}function R(t,e,i,n,s,r){if(e<i){let o=t.buffer[e+1]
n.push(t.slice(e,i,o)),s.push(o-r)}}function Z(t){let{node:e}=t,i=0
do{t.parent(),i++}while(!t.tree)
let n=0,s=t.tree,r=0
for(;r=s.positions[n]+t.from,!(r<=e.from&&r+s.children[n].length>=e.to);n++);let o=s.children[n],a=o.buffer
s.children[n]=function t(i,n,s,l,h){let c=i
for(;a[c+2]+r<=e.from;)c=a[c+3]
let u=[],f=[]
R(o,i,c,u,f,l)
let p=a[c+1],m=a[c+2],g=p+r==e.from&&m+r==e.to&&a[c]==e.type.id
return u.push(g?e.toTree():t(c+4,a[c+3],o.set.types[a[c]],p,m-p)),f.push(p-l),R(o,a[c+3],n,u,f,l),new d(s,u,f,h)}(0,a.length,l.none,0,o.length)
for(let l=0;l<=i;l++)t.childAfter(e.from)}class D{constructor(t,i){this.offset=i,this.done=!1,this.cursor=t.cursor(e.IterMode.IncludeAnonymous|e.IterMode.IgnoreMounts)}moveTo(t){let{cursor:i}=this,n=t-this.offset
for(;!this.done&&i.from<n;)i.to>=t&&i.enter(n,1,e.IterMode.IgnoreOverlays|e.IterMode.ExcludeBuffers)||i.next(!1)||(this.done=!0)}hasNode(t){if(this.moveTo(t.from),!this.done&&this.cursor.from+this.offset==t.from&&this.cursor.tree)for(let e=this.cursor.tree;;){if(e==t.tree)return!0
if(!(e.children.length&&0==e.positions[0]&&e.children[0]instanceof d))break
e=e.children[0]}return!1}}class V{constructor(t){var e
if(this.fragments=t,this.curTo=0,this.fragI=0,t.length){let i=this.curFrag=t[0]
this.curTo=null!==(e=i.tree.prop(M))&&void 0!==e?e:i.to,this.inner=new D(i.tree,-i.offset)}else this.curFrag=this.inner=null}hasNode(t){for(;this.curFrag&&t.from>=this.curTo;)this.nextFrag()
return this.curFrag&&this.curFrag.from<=t.from&&this.curTo>=t.to&&this.inner.hasNode(t)}nextFrag(){var t
if(this.fragI++,this.fragI==this.fragments.length)this.curFrag=this.inner=null
else{let e=this.curFrag=this.fragments[this.fragI]
this.curTo=null!==(t=e.tree.prop(M))&&void 0!==t?t:e.to,this.inner=new D(e.tree,-e.offset)}}findMounts(t,e){var i
let n=[]
if(this.inner){this.inner.cursor.moveTo(t,1)
for(let t=this.inner.cursor.node;t;t=t.parent){let s=null===(i=t.tree)||void 0===i?void 0:i.prop(r.mounted)
if(s&&s.parser==e)for(let e=this.fragI;e<this.fragments.length;e++){let i=this.fragments[e]
if(i.from>=t.to)break
i.tree==this.curFrag.tree&&n.push({frag:i,pos:t.from-i.offset,mount:s})}}}return n}}function X(t,e){let i=null,n=e
for(let r=1,o=0;r<t.length;r++){let a=t[r-1].to,l=t[r].from
for(;o<n.length;o++){let t=n[o]
if(t.from>=l)break
t.to<=a||(i||(n=i=e.slice()),t.from<a?(i[o]=new s(t.from,a),t.to>l&&i.splice(o+1,0,new s(l,t.to))):t.to>l?i[o--]=new s(l,t.to):i.splice(o--,1))}}return n}function j(t,e,i,n){let r=0,o=0,a=!1,l=!1,h=-1e9,c=[]
for(;;){let u=r==t.length?1e9:a?t[r].to:t[r].from,f=o==e.length?1e9:l?e[o].to:e[o].from
if(a!=l){let t=Math.max(h,i),e=Math.min(u,f,n)
t<e&&c.push(new s(t,e))}if(h=Math.min(u,f),1e9==h)break
u==h&&(a?(a=!1,r++):a=!0),f==h&&(l?(l=!1,o++):l=!0)}return c}function L(t,e){let i=[]
for(let{pos:n,mount:r,frag:o}of t){let t=n+(r.overlay?r.overlay[0].from:0),a=t+r.tree.length,l=Math.max(o.from,t),h=Math.min(o.to,a)
if(r.overlay){let a=j(e,r.overlay.map((t=>new s(t.from+n,t.to+n))),l,h)
for(let e=0,n=l;;e++){let s=e==a.length,l=s?h:a[e].from
if(l>n&&i.push(new A(n,l,r.tree,-t,o.from>=n||o.openStart,o.to<=l||o.openEnd)),s)break
n=a[e].to}}else i.push(new A(l,h,r.tree,-t,o.from>=t||o.openStart,o.to<=a||o.openEnd))}return i}e.DefaultBufferLength=i,e.MountedTree=o,e.NodeProp=r,e.NodeSet=h,e.NodeType=l,e.NodeWeakMap=class{constructor(){this.map=new WeakMap}setBuffer(t,e,i){let n=this.map.get(t)
n||this.map.set(t,n=new Map),n.set(e,i)}getBuffer(t,e){let i=this.map.get(t)
return i&&i.get(e)}set(t,e){t instanceof S?this.setBuffer(t.context.buffer,t.index,e):t instanceof y&&this.map.set(t.tree,e)}get(t){return t instanceof S?this.getBuffer(t.context.buffer,t.index):t instanceof y?this.map.get(t.tree):void 0}cursorSet(t,e){t.buffer?this.setBuffer(t.buffer.buffer,t.index,e):this.map.set(t.tree,e)}cursorGet(t){return t.buffer?this.getBuffer(t.buffer.buffer,t.index):this.map.get(t.tree)}},e.Parser=class{startParse(t,e,i){return"string"==typeof t&&(t=new _(t)),i=i?i.length?i.map((t=>new s(t.from,t.to))):[new s(0,0)]:[new s(0,t.length)],this.createParse(t,e||[],i)}parse(t,e,i){let n=this.startParse(t,e,i)
for(;;){let t=n.advance()
if(t)return t}}},e.Tree=d,e.TreeBuffer=m,e.TreeCursor=k,e.TreeFragment=A,e.parseMixed=function(t){return(e,i,n,s)=>new I(e,t,i,n,s)}},48:(t,e,i)=>{"use strict"
Object.defineProperty(e,"__esModule",{value:!0})
var n=i(897)
let s=0
class r{constructor(t,e,i){this.set=t,this.base=e,this.modified=i,this.id=s++}static define(t){if(null==t?void 0:t.base)throw new Error("Can not derive from a modified tag")
let e=new r([],null,[])
if(e.set.push(e),t)for(let i of t.set)e.set.push(i)
return e}static defineModifier(){let t=new a
return e=>e.modified.indexOf(t)>-1?e:a.get(e.base||e,e.modified.concat(t).sort(((t,e)=>t.id-e.id)))}}let o=0
class a{constructor(){this.instances=[],this.id=o++}static get(t,e){if(!e.length)return t
let i=e[0].instances.find((i=>{return i.base==t&&(n=e,s=i.modified,n.length==s.length&&n.every(((t,e)=>t==s[e])))
var n,s}))
if(i)return i
let n=[],s=new r(n,t,e)
for(let r of e)r.instances.push(s)
let o=function(t){let e=[[]]
for(let i=0;i<t.length;i++)for(let n=0,s=e.length;n<s;n++)e.push(e[n].concat(t[i]))
return e.sort(((t,e)=>e.length-t.length))}(e)
for(let r of t.set)if(!r.modified.length)for(let t of o)n.push(a.get(r,t))
return s}}const l=new n.NodeProp
class h{constructor(t,e,i,n){this.tags=t,this.mode=e,this.context=i,this.next=n}get opaque(){return 0==this.mode}get inherit(){return 1==this.mode}sort(t){return!t||t.depth<this.depth?(this.next=t,this):(t.next=this.sort(t.next),t)}get depth(){return this.context?this.context.length:0}}function c(t,e){let i=Object.create(null)
for(let r of t)if(Array.isArray(r.tag))for(let t of r.tag)i[t.id]=r.class
else i[r.tag.id]=r.class
let{scope:n,all:s=null}=e||{}
return{style:t=>{let e=s
for(let n of t)for(let t of n.set){let n=i[t.id]
if(n){e=e?e+" "+n:n
break}}return e},scope:n}}h.empty=new h([],2,null)
class u{constructor(t,e,i){this.at=t,this.highlighters=e,this.span=i,this.class=""}startSpan(t,e){e!=this.class&&(this.flush(t),t>this.at&&(this.at=t),this.class=e)}flush(t){t>this.at&&this.class&&this.span(this.at,t,this.class)}highlightRange(t,e,i,s,r){let{type:o,from:a,to:l}=t
if(a>=i||l<=e)return
o.isTop&&(r=this.highlighters.filter((t=>!t.scope||t.scope(o))))
let c=s,u=f(t)||h.empty,d=function(t,e){let i=null
for(let n of t){let t=n.style(e)
t&&(i=i?i+" "+t:t)}return i}(r,u.tags)
if(d&&(c&&(c+=" "),c+=d,1==u.mode&&(s+=(s?" ":"")+d)),this.startSpan(t.from,c),u.opaque)return
let p=t.tree&&t.tree.prop(n.NodeProp.mounted)
if(p&&p.overlay){let n=t.node.enter(p.overlay[0].from+a,1),o=this.highlighters.filter((t=>!t.scope||t.scope(p.tree.type))),h=t.firstChild()
for(let u=0,f=a;;u++){let d=u<p.overlay.length?p.overlay[u]:null,m=d?d.from+a:l,g=Math.max(e,f),O=Math.min(i,m)
if(g<O&&h)for(;t.from<O&&(this.highlightRange(t,g,O,s,r),this.startSpan(Math.min(O,t.to),c),!(t.to>=m)&&t.nextSibling()););if(!d||m>i)break
f=d.to+a,f>e&&(this.highlightRange(n.cursor(),Math.max(e,d.from+a),Math.min(i,f),s,o),this.startSpan(f,c))}h&&t.parent()}else if(t.firstChild()){do{if(!(t.to<=e)){if(t.from>=i)break
this.highlightRange(t,e,i,s,r),this.startSpan(Math.min(i,t.to),c)}}while(t.nextSibling())
t.parent()}}}function f(t){let e=t.type.prop(l)
for(;e&&e.context&&!t.matchContext(e.context);)e=e.next
return e||null}const d=r.define,p=d(),m=d(),g=d(m),O=d(m),v=d(),y=d(v),b=d(v),w=d(),x=d(w),S=d(),k=d(),Q=d(),P=d(Q),T=d(),$={comment:p,lineComment:d(p),blockComment:d(p),docComment:d(p),name:m,variableName:d(m),typeName:g,tagName:d(g),propertyName:O,attributeName:d(O),className:d(m),labelName:d(m),namespace:d(m),macroName:d(m),literal:v,string:y,docString:d(y),character:d(y),attributeValue:d(y),number:b,integer:d(b),float:d(b),bool:d(v),regexp:d(v),escape:d(v),color:d(v),url:d(v),keyword:S,self:d(S),null:d(S),atom:d(S),unit:d(S),modifier:d(S),operatorKeyword:d(S),controlKeyword:d(S),definitionKeyword:d(S),moduleKeyword:d(S),operator:k,derefOperator:d(k),arithmeticOperator:d(k),logicOperator:d(k),bitwiseOperator:d(k),compareOperator:d(k),updateOperator:d(k),definitionOperator:d(k),typeOperator:d(k),controlOperator:d(k),punctuation:Q,separator:d(Q),bracket:P,angleBracket:d(P),squareBracket:d(P),paren:d(P),brace:d(P),content:w,heading:x,heading1:d(x),heading2:d(x),heading3:d(x),heading4:d(x),heading5:d(x),heading6:d(x),contentSeparator:d(w),list:d(w),quote:d(w),emphasis:d(w),strong:d(w),link:d(w),monospace:d(w),strikethrough:d(w),inserted:d(),deleted:d(),changed:d(),invalid:d(),meta:T,documentMeta:d(T),annotation:d(T),processingInstruction:d(T),definition:r.defineModifier(),constant:r.defineModifier(),function:r.defineModifier(),standard:r.defineModifier(),local:r.defineModifier(),special:r.defineModifier()},A=c([{tag:$.link,class:"tok-link"},{tag:$.heading,class:"tok-heading"},{tag:$.emphasis,class:"tok-emphasis"},{tag:$.strong,class:"tok-strong"},{tag:$.keyword,class:"tok-keyword"},{tag:$.atom,class:"tok-atom"},{tag:$.bool,class:"tok-bool"},{tag:$.url,class:"tok-url"},{tag:$.labelName,class:"tok-labelName"},{tag:$.inserted,class:"tok-inserted"},{tag:$.deleted,class:"tok-deleted"},{tag:$.literal,class:"tok-literal"},{tag:$.string,class:"tok-string"},{tag:$.number,class:"tok-number"},{tag:[$.regexp,$.escape,$.special($.string)],class:"tok-string2"},{tag:$.variableName,class:"tok-variableName"},{tag:$.local($.variableName),class:"tok-variableName tok-local"},{tag:$.definition($.variableName),class:"tok-variableName tok-definition"},{tag:$.special($.variableName),class:"tok-variableName2"},{tag:$.definition($.propertyName),class:"tok-propertyName tok-definition"},{tag:$.typeName,class:"tok-typeName"},{tag:$.namespace,class:"tok-namespace"},{tag:$.className,class:"tok-className"},{tag:$.macroName,class:"tok-macroName"},{tag:$.propertyName,class:"tok-propertyName"},{tag:$.operator,class:"tok-operator"},{tag:$.comment,class:"tok-comment"},{tag:$.meta,class:"tok-meta"},{tag:$.invalid,class:"tok-invalid"},{tag:$.punctuation,class:"tok-punctuation"}])
e.Tag=r,e.classHighlighter=A,e.getStyleTags=f,e.highlightTree=function(t,e,i,n=0,s=t.length){let r=new u(n,Array.isArray(e)?e:[e],i)
r.highlightRange(t.cursor(),n,s,"",r.highlighters),r.flush(s)},e.styleTags=function(t){let e=Object.create(null)
for(let i in t){let n=t[i]
Array.isArray(n)||(n=[n])
for(let t of i.split(" "))if(t){let i=[],s=2,r=t
for(let e=0;;){if("..."==r&&e>0&&e+3==t.length){s=1
break}let n=/^"(?:[^"\\]|\\.)*?"|[^\/!]+/.exec(r)
if(!n)throw new RangeError("Invalid path: "+t)
if(i.push("*"==n[0]?"":'"'==n[0][0]?JSON.parse(n[0]):n[0]),e+=n[0].length,e==t.length)break
let o=t[e++]
if(e==t.length&&"!"==o){s=0
break}if("/"!=o)throw new RangeError("Invalid path: "+t)
r=t.slice(e)}let o=i.length-1,a=i[o]
if(!a)throw new RangeError("Invalid path: "+t)
let l=new h(n,s,o>0?i.slice(0,o):null)
e[a]=l.sort(e[a])}}return l.add(e)},e.tagHighlighter=c,e.tags=$},88:(t,e,i)=>{"use strict"
Object.defineProperty(e,"__esModule",{value:!0})
var n=i(90),s=i(48)
const r=295,o=[9,10,11,12,13,32,133,160,5760,8192,8193,8194,8195,8196,8197,8198,8199,8200,8201,8202,8232,8233,8239,8287,12288],a=new n.ContextTracker({start:!1,shift:(t,e)=>4==e||5==e||299==e?t:300==e,strict:!1}),l=new n.ExternalTokenizer(((t,e)=>{let{next:i}=t;(125==i||-1==i||e.context)&&e.canShift(297)&&t.acceptToken(297)}),{contextual:!0,fallback:!0}),h=new n.ExternalTokenizer(((t,e)=>{let i,{next:n}=t
o.indexOf(n)>-1||(47!=n||47!=(i=t.peek(1))&&42!=i)&&125!=n&&59!=n&&-1!=n&&!e.context&&e.canShift(294)&&t.acceptToken(294)}),{contextual:!0}),c=new n.ExternalTokenizer(((t,e)=>{let{next:i}=t
if((43==i||45==i)&&(t.advance(),i==t.next)){t.advance()
let i=!e.context&&e.canShift(1)
t.acceptToken(i?1:2)}}),{contextual:!0}),u=new n.ExternalTokenizer((t=>{for(let e=!1,i=0;;i++){let{next:n}=t
if(n<0){i&&t.acceptToken(r)
break}if(96==n){i?t.acceptToken(r):t.acceptToken(296,1)
break}if(123==n&&e){1==i?t.acceptToken(3,1):t.acceptToken(r,-1)
break}if(10==n&&i){t.advance(),t.acceptToken(r)
break}92==n&&t.advance(),e=36==n,t.advance()}})),f=s.styleTags({"get set async static":s.tags.modifier,"for while do if else switch try catch finally return throw break continue default case":s.tags.controlKeyword,"in of await yield void typeof delete instanceof":s.tags.operatorKeyword,"let var const function class extends":s.tags.definitionKeyword,"import export from":s.tags.moduleKeyword,"with debugger as new":s.tags.keyword,TemplateString:s.tags.special(s.tags.string),super:s.tags.atom,BooleanLiteral:s.tags.bool,this:s.tags.self,null:s.tags.null,Star:s.tags.modifier,VariableName:s.tags.variableName,"CallExpression/VariableName TaggedTemplateExpression/VariableName":s.tags.function(s.tags.variableName),VariableDefinition:s.tags.definition(s.tags.variableName),Label:s.tags.labelName,PropertyName:s.tags.propertyName,PrivatePropertyName:s.tags.special(s.tags.propertyName),"CallExpression/MemberExpression/PropertyName":s.tags.function(s.tags.propertyName),"FunctionDeclaration/VariableDefinition":s.tags.function(s.tags.definition(s.tags.variableName)),"ClassDeclaration/VariableDefinition":s.tags.definition(s.tags.className),PropertyDefinition:s.tags.definition(s.tags.propertyName),PrivatePropertyDefinition:s.tags.definition(s.tags.special(s.tags.propertyName)),UpdateOp:s.tags.updateOperator,LineComment:s.tags.lineComment,BlockComment:s.tags.blockComment,Number:s.tags.number,String:s.tags.string,ArithOp:s.tags.arithmeticOperator,LogicOp:s.tags.logicOperator,BitOp:s.tags.bitwiseOperator,CompareOp:s.tags.compareOperator,RegExp:s.tags.regexp,Equals:s.tags.definitionOperator,Arrow:s.tags.function(s.tags.punctuation),": Spread":s.tags.punctuation,"( )":s.tags.paren,"[ ]":s.tags.squareBracket,"{ }":s.tags.brace,"InterpolationStart InterpolationEnd":s.tags.special(s.tags.brace),".":s.tags.derefOperator,", ;":s.tags.separator,"@":s.tags.meta,TypeName:s.tags.typeName,TypeDefinition:s.tags.definition(s.tags.typeName),"type enum interface implements namespace module declare":s.tags.definitionKeyword,"abstract global Privacy readonly override":s.tags.modifier,"is keyof unique infer":s.tags.operatorKeyword,JSXAttributeValue:s.tags.attributeValue,JSXText:s.tags.content,"JSXStartTag JSXStartCloseTag JSXSelfCloseEndTag JSXEndTag":s.tags.angleBracket,"JSXIdentifier JSXNameSpacedName":s.tags.tagName,"JSXAttribute/JSXIdentifier JSXAttribute/JSXNameSpacedName":s.tags.attributeName,"JSXBuiltin/JSXIdentifier":s.tags.standard(s.tags.tagName)}),d={__proto__:null,export:16,as:21,from:27,default:30,async:35,function:36,extends:46,this:50,true:58,false:58,null:68,void:72,typeof:76,super:92,new:126,await:143,yield:145,delete:146,class:156,public:211,private:211,protected:211,readonly:213,instanceof:232,satisfies:235,in:236,const:238,import:270,keyof:325,unique:329,infer:335,is:371,abstract:391,implements:393,type:395,let:398,var:400,interface:407,enum:411,namespace:417,module:419,declare:423,global:427,for:448,of:457,while:460,with:464,do:468,if:472,else:474,switch:478,case:484,try:490,catch:494,finally:498,return:502,throw:506,break:510,continue:514,debugger:518},p={__proto__:null,async:113,get:115,set:117,public:173,private:173,protected:173,static:175,abstract:177,override:179,readonly:185,accessor:187,new:375},m={__proto__:null,"<":133},g=n.LRParser.deserialize({version:14,states:"$>lO`QYOOO$}QYOOO&}Q`OOO*_Q$IvO'#CgO*fOSO'#DYO,qQYO'#D_O-RQYO'#DjO$}QYO'#DtO/VQYO'#DzOOQ$IU'#ES'#ESO/mQWO'#EPOOQO'#IW'#IWO/uQWO'#GfOOQO'#Ed'#EdO0QQWO'#EcO0VQWO'#EcO2XQ$IvO'#JQO4xQ$IvO'#JRO5fQWO'#FRO5kQ!bO'#FjOOQ$IU'#FZ'#FZO5vO#tO'#FZO6UQ&jO'#FqO7iQWO'#FpOOQ$IU'#JR'#JROOQ$IS'#JQ'#JQOOQQ'#Jl'#JlO7nQWO'#HzO7sQ$I[O'#H{OOQQ'#Iu'#IuOOQQ'#IO'#IOQ`QYOOO$}QYO'#DlO7{QWO'#GfO8QQ&jO'#ClO8`QWO'#EbO8kQWO'#EmO8pQ&jO'#FYO9[QWO'#GfO9aQWO'#GjO9lQWO'#GjO9zQWO'#GmO9zQWO'#GnO9zQWO'#GpO7{QWO'#GsO:kQWO'#GvO;|QWO'#CcO<^QWO'#HTO<fQWO'#HZO<fQWO'#H]O`QYO'#H_O<fQWO'#HaO<fQWO'#HdO<kQWO'#HjO<pQ$I]O'#HpO$}QYO'#HrO<{Q$I]O'#HtO=WQ$I]O'#HvO7sQ$I[O'#HxO=cQ$IvO'#CgO>PQ`O'#DdQOQWOOO>tQWO'#D{O8QQ&jO'#EbO?PQWO'#EbO?[QpO'#FYOOQO'#Ce'#CeOOQ$IS'#Di'#DiOOQ$IS'#JU'#JUO$}QYO'#JUO@bQ`O'#EZOOQ$IS'#EY'#EYO@lQ$IdO'#EZOAWQ`O'#EOOOQO'#JX'#JXOAiQ`O'#EOOAvQ`O'#EZOB^Q`O'#EaOBaQ`O'#EZO?dQ`O'#EZOAWQ`O'#EZO$}QYO'#DZOOOS'#IQ'#IQOBzOSO,59tOOQ$IU,59t,59tOCVQYO'#IROCjQWO'#JSOElQrO'#JSO*qQYO'#JSOEsQWO,59yOFZQWO'#EdOFhQWO'#JaOFsQWO'#J`OFsQWO'#J`OF{QWO,5;QOGQQWO'#J_OOQ$IU,5:U,5:UOGXQYO,5:UOIYQ$IvO,5:`OIyQWO,5:fOJOQWO'#J]OJxQ$I[O'#J^O9aQWO'#J]OKPQWO'#J]OKXQWO,5;POK^QWO'#J]OOQ$IU'#Cg'#CgO$}QYO'#DzOLQQpO,5:kOOQO'#JY'#JYOOQO-E<U-E<UO7{QWO,5=QOLhQWO,5=QOLmQYO,5:}ONmQ&jO'#E_O! }QWO,5:}O!#dQ&jO'#DnO!#kQYO'#DsO!#uQ`O,5;WO!#}Q`O,5;WO$}QYO,5;WOOQQ'#Ey'#EyOOQQ'#E{'#E{O$}QYO,5;XO$}QYO,5;XO$}QYO,5;XO$}QYO,5;XO$}QYO,5;XO$}QYO,5;XO$}QYO,5;XO$}QYO,5;XO$}QYO,5;XO$}QYO,5;XO$}QYO,5;XOOQQ'#FP'#FPO!$]QYO,5;jOOQ$IU,5;o,5;oOOQ$IU,5;p,5;pO!&]QWO,5;pOOQ$IU,5;q,5;qO$}QYO'#I^O!&eQ$I[O,5<^ONmQ&jO,5;XO!'SQ&jO,5;XO$}QYO,5;mO!'ZQ!bO'#F`O!(WQ!bO'#JeO!'rQ!bO'#JeO!(_Q!bO'#JeOOQO'#Je'#JeO!(sQ!bO,5;xOOOO,5<U,5<UO!)UQYO'#FlOOOO'#I]'#I]O5vO#tO,5;uO!)]Q!bO'#FnOOQ$IU,5;u,5;uO!)|Q,UO'#CrOOQ$IU'#Cv'#CvO!*aQWO'#CvO!*fOSO'#CzO!+SQ&jO,5<ZO!+ZQWO,5<]O!,mQ7[O'#F{O!,zQWO'#F|O!-PQWO'#F|O!-UQ7[O'#GQO!.TQ`O'#GUO!.vQ,UO'#I}OOQ$IU'#I}'#I}O!/QQWO'#I|O!/`QWO'#I{O!/hQWO'#CqOOQ$IU'#Ct'#CtOOQ$IU'#C}'#C}OOQ$IU'#DP'#DPO/pQWO'#DRO!!SQ&jO'#FsO!!SQ&jO'#FuO!/pQWO'#FwO!/uQWO'#FxO!-PQWO'#GOO!!SQ&jO'#GTO!/zQWO'#EeO!0fQWO,5<[O`QYO,5>fOOQQ'#Ix'#IxOOQQ,5>g,5>gOOQQ-E;|-E;|O!2eQ$IvO,5:WOOQ$IS'#Co'#CoO!3XQ&jO,5=QO!3gQ$I[O'#IyO7iQWO'#IyO<kQWO,59WO!3xQ`O,59WO!4QQ&jO,59WO8QQ&jO,59WO!4]QWO,5:}O!4eQWO'#HSO!4sQWO'#JpO$}QYO,5;rO!4{Q`O,5;tO!5QQWO,5=mO!5VQWO,5=mO!5[QWO,5=mO7sQ$I[O,5=mO!5jQWO'#EfO!6aQ`O'#EgOOQ$IS'#J_'#J_O!6hQ$I[O'#JmO7sQ$I[O,5=UO9zQWO,5=[OOQO'#Cr'#CrO!6sQ`O,5=XO!6{Q&jO,5=YO!7WQWO,5=[O!7]QpO,5=_O<kQWO'#GxO7{QWO'#GzO!7eQWO'#GzO8QQ&jO'#G}O!7jQWO'#G}OOQQ,5=b,5=bO!7oQWO'#HOO!7wQWO'#ClO!7|QWO,58}O!8WQWO,58}O!:]QYO,58}OOQQ,58},58}O!:jQ$I[O,58}O$}QYO,58}O!:uQYO'#HVOOQQ'#HW'#HWOOQQ'#HX'#HXO`QYO,5=oO!;VQWO,5=oO`QYO,5=uO`QYO,5=wO!;[QWO,5=yO`QYO,5={O!;aQWO,5>OO!;fQYO,5>UOOQQ,5>[,5>[O$}QYO,5>[O7sQ$I[O,5>^OOQQ,5>`,5>`O!?jQWO,5>`OOQQ,5>b,5>bO!?jQWO,5>bOOQQ,5>d,5>dO!?oQ`O'#DWO$}QYO'#JUO!@^Q`O'#JUO!@{Q`O'#DeO!A^Q`O'#DeO!CiQYO'#DeO!CpQWO'#JTO!CxQWO,5:OO!C}QWO'#EhO!D]QWO'#JbO!DeQWO,5;RO!D{Q`O'#DeO!EVQ`O'#D}OOQ$IU,5:g,5:gO$}QYO,5:gO!E^QWO,5:gO<kQWO,5:|O!3xQ`O,5:|O!4QQ&jO,5:|O8QQ&jO,5:|O!EfQWO,5?pO!EkQMhO,5:kO!FkQ$IdO,5:uOAWQ`O,5:jO!GVQ`O,5:jO!GdQ`O,5:uO!GzQ`O,5:uO!HeQ`O,5:uOAWQ`O,5:uO<kQWO,5:jOOQ$IS'#E^'#E^OOQO,5:u,5:uO$}QYO,5:uO!IUQ$I[O,5:uO!IaQ$I[O,5:uO!3xQ`O,5:jOOQO,5:{,5:{O!IoQ$I[O,5:uO!JTQpO,59uOOOS-E<O-E<OOOQ$IU1G/`1G/`O!JYQrO,5>mO*qQYO,5>mOOQO,5>s,5>sO!JdQYO'#IROOQO-E<P-E<PO!JqQWO,5?nO!JyQrO,5?nO!KQQWO,5?zOOQ$IU1G/e1G/eO$}QYO,5?{O!KYQWO'#IXOOQO-E<V-E<VO!KQQWO,5?zOOQ$IS1G0l1G0lOOQ$IU1G/p1G/pOOQ$IU1G0Q1G0QO!KnQWO,5?wO9aQWO,5?wO!KvQWO,5?wO$}QYO,5?xO!LUQ$I[O,5?xO!LgQ$I[O,5?xO!LnQWO'#IZO!KnQWO,5?wOOQ$IS1G0k1G0kO!#uQ`O,5:mO!$QQ`O,5:mOOQO,5:o,5:oO!M]QWO,5:oO!MeQ&jO1G2lO7{QWO1G2lOOQ$IU1G0i1G0iO!MsQ$IvO1G0iO!NxQ$ItO,5:yOOQ$IU'#Fz'#FzO# fQ$IvO'#I}OLmQYO1G0iO##nQ&jO'#JVO##xQWO,5:YO##}QrO'#JWO$}QYO'#JWO#$XQWO,5:_OOQ$IU'#DW'#DWOOQ$IU1G0r1G0rO$}QYO1G0rOOQ$IU1G1[1G1[O#$^QWO1G0rO#&uQ$IvO1G0sO#&|Q$IvO1G0sO#)gQ$IvO1G0sO#)nQ$IvO1G0sO#+xQ$IvO1G0sO#,`Q$IvO1G0sO#/YQ$IvO1G0sO#/aQ$IvO1G0sO#1zQ$IvO1G0sO#2RQ$IvO1G0sO#3yQ$IvO1G0sO#6yQ!LSO'#CgO#8wQ!LSO1G1UO#:uQ!LSO'#JRO!&`QWO1G1[O#;YQ$IvO,5>xOOQ$IS-E<[-E<[O#;|Q$IvO1G0sOOQ$IU1G0s1G0sO#>XQ$IvO1G1XO#>{Q!bO,5;|O#?TQ!bO,5;}O#?]Q!bO'#FeO#?tQWO'#FdOOQO'#Jf'#JfOOQO'#I['#I[O#?yQ!bO1G1dOOQ$IU1G1d1G1dOOOO1G1o1G1oO#@[Q!LSO'#JQO#@fQWO,5<WO!$]QYO,5<WOOOO-E<Z-E<ZOOQ$IU1G1a1G1aO#@kQ`O'#JeOOQ$IU,5<Y,5<YO#@sQ`O,5<YOOQ$IU,59b,59bONmQ&jO'#C|OOOS'#IP'#IPO#@xOSO,59fOOQ$IU,59f,59fO$}QYO1G1uO!/uQWO'#I`O#ATQWO,5<nOOQ$IU,5<k,5<kOOQO'#Ga'#GaO!!SQ&jO,5<zOOQO'#Gc'#GcO!!SQ&jO,5<|ONmQ&jO,5=OOOQO1G1w1G1wO#A`QpO'#CoO#AsQpO,5<gO#AzQWO'#JiO7{QWO'#JiO#BYQWO,5<iO!!SQ&jO,5<hO#B_QWO'#F}O#BjQWO,5<hO#BoQpO'#FzO#B|QpO'#JjO#CWQWO'#JjONmQ&jO'#JjO#C]QWO,5<lO#CbQ`O'#GVO!.OQ`O'#GVO#CsQWO'#GXO#CxQWO'#GZO!-PQWO'#G^O#C}Q$I[O'#IbO#DYQ`O,5<pOOQ$IU,5<p,5<pO#DaQ`O'#GVO#DoQ`O'#GWO#DwQ`O'#GWOOQ$IU,5=P,5=PO!!SQ&jO,5?hO!!SQ&jO,5?hO#D|QWO'#IcO#EXQWO,5?gO#EaQWO,59]O#FQQ&jO,59mOOQ$IU,59m,59mO#FsQ&jO,5<_O#GfQ&jO,5<aO#GpQWO,5<cOOQ$IU,5<d,5<dO#GuQWO,5<jO#GzQ&jO,5<oOLmQYO1G1vO#H[QWO1G1vOOQQ1G4Q1G4QOOQ$IU1G/r1G/rO!&]QWO1G/rOOQQ1G2l1G2lONmQ&jO1G2lO$}QYO1G2lO#HaQWO1G2lO#IvQ&jO'#E_OOQ$IS,5?e,5?eO#JQQ$I[O,5?eOOQQ1G.r1G.rO<kQWO1G.rO!3xQ`O1G.rO!4QQ&jO1G.rO#JcQWO1G0iO#JhQWO'#CgO#JsQWO'#JqO#J{QWO,5=nO#KQQWO'#JqO#KVQWO'#JqO#K_QWO'#IkO#KmQWO,5@[O#KuQrO1G1^OOQ$IU1G1`1G1`O7{QWO1G3XO#K|QWO1G3XO#LRQWO1G3XO#LWQWO1G3XOOQQ1G3X1G3XO9aQWO'#J`O9aQWO'#EhO$}QYO'#EhO9aQWO'#IeO#L]Q$I[O,5@XOOQQ1G2p1G2pO!7WQWO1G2vONmQ&jO1G2sO#LhQWO1G2sOOQQ1G2t1G2tONmQ&jO1G2tO#LmQWO1G2tO#LuQ`O'#GrOOQQ1G2v1G2vO!.OQ`O'#IgO!7]QpO1G2yOOQQ1G2y1G2yOOQQ,5=d,5=dO#L}Q&jO,5=fO7{QWO,5=fO#CxQWO,5=iO7iQWO,5=iO!3xQ`O,5=iO!4QQ&jO,5=iO8QQ&jO,5=iO#M]QWO'#JoO#MhQWO,5=jOOQQ1G.i1G.iO#MmQ$I[O1G.iO#MxQWO1G.iO#M}QWO1G.iO7sQ$I[O1G.iO#NVQrO,5@^O#NjQWO,5@^O#NuQYO,5=qO#N|QWO,5=qO9aQWO,5@^OOQQ1G3Z1G3ZO`QYO1G3ZOOQQ1G3a1G3aOOQQ1G3c1G3cO<fQWO1G3eO$ RQYO1G3gO$%PQYO'#HfOOQQ1G3j1G3jO$%^QWO'#HlO<kQWO'#HnOOQQ1G3p1G3pO$%fQYO1G3pO7sQ$I[O1G3vOOQQ1G3x1G3xOOQ$IS'#GR'#GRO7sQ$I[O1G3zO7sQ$I[O1G3|O$)gQWO,5?pO!$]QYO,5;SO9aQWO,5;SO<kQWO,5:PO!$]QYO,5:PO!3xQ`O,5:PO$)lQ!LSO,5:POOQO,5;S,5;SO$)vQ`O'#ISO$*^QWO,5?oOOQ$IU1G/j1G/jO$*fQ`O'#IYO$*pQWO,5?|OOQ$IS1G0m1G0mO!A^Q`O,5:POOQO'#IV'#IVO$*xQ`O,5:iOOQ$IU,5:i,5:iO!EaQWO1G0ROOQ$IU1G0R1G0RO$}QYO1G0ROOQ$IU1G0h1G0hO<kQWO1G0hO!3xQ`O1G0hO!4QQ&jO1G0hOOQ$IS1G5[1G5[O<kQWO1G0UOOQO1G0a1G0aO$}QYO1G0aO$+PQ$I[O1G0aO$+[Q$I[O1G0aO!3xQ`O1G0UOAWQ`O1G0UO$+jQ$IdO1G0aO$,UQ`O1G0UOAWQ`O1G0aO$,cQ`O1G0aO$,yQ`O1G0aO$-dQ$I[O1G0aOOQO1G0U1G0UO$-xQ$IvO1G0aOOOS1G/a1G/aO$.SQpO,5<^O$.[QrO1G4XOOQO1G4_1G4_O$}QYO,5>mO$.fQWO1G5YO$.nQWO1G5fO$.vQrO1G5gO9aQWO,5>sO$/QQWO1G5cO$/QQWO1G5cO9aQWO1G5cO$/YQ$IvO1G5dO$}QYO1G5dO$/jQ$I[O1G5dO$/{QWO,5>uO9aQWO,5>uOOQO,5>u,5>uO$0aQWO,5>uOOQO-E<X-E<XOOQO1G0X1G0XOOQO1G0Z1G0ZO!&`QWO1G0ZOOQQ7+(W7+(WONmQ&jO7+(WO$}QYO7+(WO$0oQWO7+(WO$0zQ&jO7+(WO$1YQ$IvO,59mO$3bQ$IvO,5<_O$5mQ$IvO,5<aO$7xQ$IvO,5<oOOQ$IU7+&T7+&TO$:ZQ$IvO7+&TO$:}Q&jO'#ITO$;XQWO,5?qOOQ$IU1G/t1G/tO$;aQYO'#IUO$;nQWO,5?rO$;vQrO,5?rOOQ$IU1G/y1G/yO$<QQWO7+&^OOQ$IU7+&^7+&^O$<VQ!LSO,5:`O$}QYO7+&pO$<aQ!LSO,5:WOOQ$IU7+&v7+&vOOQO1G1h1G1hOOQO1G1i1G1iO$<nQ!bO,5<PO!$]QYO,5<OOOQO-E<Y-E<YOOQ$IU7+'O7+'OOOOO7+'Z7+'ZOOOO1G1r1G1rO$<yQWO1G1rOOQ$IU1G1t1G1tO$=OQpO,59hOOOS-E;}-E;}OOQ$IU1G/Q1G/QO$=VQ$IvO7+'aOOQ$IU,5>z,5>zO$=yQWO,5>zOOQ$IU1G2Y1G2YP$>OQWO'#I`POQ$IU-E<^-E<^O$>oQ&jO1G2fO$?bQ&jO1G2hO$?lQpO1G2jOOQ$IU1G2R1G2RO$?sQWO'#I_O$@RQWO,5@TO$@RQWO,5@TO$@ZQWO,5@TO$@fQWO,5@TOOQO1G2T1G2TO$@tQ&jO1G2SO!!SQ&jO1G2SO$AUQ7[O'#IaO$AfQWO,5@UONmQ&jO,5@UO$AnQpO,5@UOOQ$IU1G2W1G2WOOQ$IS,5<q,5<qOOQ$IS,5<r,5<rO$AxQWO,5<rOARQWO,5<rO!3xQ`O,5<qOOQO'#GY'#GYO$A}QWO,5<sOOQ$IS,5<u,5<uO$AxQWO,5<xOOQO,5>|,5>|OOQO-E<`-E<`OOQ$IU1G2[1G2[O!.OQ`O,5<qO$BVQWO,5<rO#CsQWO,5<sO!.OQ`O,5<rO$BbQ&jO1G5SO$BlQ&jO1G5SOOQO,5>},5>}OOQO-E<a-E<aOOQO1G.w1G.wO!4{Q`O,59oO$}QYO,59oO$ByQWO1G1}O!!SQ&jO1G2UO$COQ$IvO7+'bOOQ$IU7+'b7+'bOLmQYO7+'bOOQ$IU7+%^7+%^O$CrQpO'#JkO!EaQWO7+(WO$C|QrO7+(WO$0rQWO7+(WO$DTQ$ItO'#CgO$DhQ$ItO,5<vO$EYQWO,5<vOOQ$IS1G5P1G5POOQQ7+$^7+$^O<kQWO7+$^O!3xQ`O7+$^OLmQYO7+&TO$E_QWO'#IjO$EpQWO,5@]OOQO1G3Y1G3YO7{QWO,5@]O$EpQWO,5@]O$ExQWO,5@]OOQO,5?V,5?VOOQO-E<i-E<iOOQ$IU7+&x7+&xO$E}QWO7+(sO7sQ$I[O7+(sO7{QWO7+(sO$FSQWO7+(sO$FXQWO,5;SOOQ$IS,5?P,5?POOQ$IS-E<c-E<cOOQQ7+(b7+(bO$F^Q$ItO7+(_ONmQ&jO7+(_O$FhQpO7+(`OOQQ7+(`7+(`ONmQ&jO7+(`O$FoQWO'#JnO$FzQWO,5=^OOQO,5?R,5?ROOQO-E<e-E<eOOQQ7+(e7+(eO$HTQ`O'#G{OOQQ1G3Q1G3QONmQ&jO1G3QO$}QYO1G3QO$H[QWO1G3QO$HgQ&jO1G3QO7sQ$I[O1G3TO#CxQWO1G3TO7iQWO1G3TO!3xQ`O1G3TO!4QQ&jO1G3TO$HuQWO'#IiO$IQQWO,5@ZO$IYQ`O,5@ZOOQ$IS1G3U1G3UOOQQ7+$T7+$TO$IbQWO7+$TO7sQ$I[O7+$TO$IgQWO7+$TO$}QYO1G5xO$}QYO1G5yO$IlQYO1G3]O$IsQWO1G3]O$IxQYO1G3]O$JPQ$I[O1G5xOOQQ7+(u7+(uO7sQ$I[O7+)PO`QYO7+)ROOQQ'#Jt'#JtOOQQ'#Il'#IlO$JZQYO,5>QOOQQ,5>Q,5>QO$}QYO'#HgO$JhQWO'#HiOOQQ,5>W,5>WO9aQWO,5>WOOQQ,5>Y,5>YOOQQ7+)[7+)[OOQQ7+)b7+)bOOQQ7+)f7+)fOOQQ7+)h7+)hO$JmQ`O1G5[O$KRQ!LSO1G0nO$K]QWO1G0nOOQO1G/k1G/kO$KhQ!LSO1G/kO<kQWO1G/kO!$]QYO'#DeOOQO,5>n,5>nOOQO-E<Q-E<QOOQO,5>t,5>tOOQO-E<W-E<WO!3xQ`O1G/kOOQO-E<T-E<TOOQ$IU1G0T1G0TOOQ$IU7+%m7+%mO!EaQWO7+%mOOQ$IU7+&S7+&SO<kQWO7+&SO!3xQ`O7+&SOOQO7+%p7+%pO$-xQ$IvO7+%{OOQO7+%{7+%{O$}QYO7+%{O$KrQ$I[O7+%{O<kQWO7+%pO!3xQ`O7+%pO$K}Q$I[O7+%{OAWQ`O7+%pO$L]Q$I[O7+%{O$LqQ$IdO7+%{O$L{Q`O7+%pOAWQ`O7+%{O$MYQ`O7+%{O$MpQWO7+*}O$MpQWO7+*}O$MxQ$IvO7++OO$}QYO7++OOOQO1G4a1G4aO9aQWO1G4aO$NYQWO1G4aOOQO7+%u7+%uO!EaQWO<<KrO$C|QrO<<KrO$NhQWO<<KrOOQQ<<Kr<<KrONmQ&jO<<KrO$}QYO<<KrO$NpQWO<<KrO$N{Q$IvO1G2fO%#WQ$IvO1G2hO%%cQ$IvO1G2SO%'tQ&jO,5>oOOQO-E<R-E<RO%(OQrO,5>pO$}QYO,5>pOOQO-E<S-E<SO%(YQWO1G5^OOQ$IU<<Ix<<IxO%(bQ!LSO1G0iO%*lQ!LSO1G0sO%*sQ!LSO1G0sO%,wQ!LSO1G0sO%-OQ!LSO1G0sO%.sQ!LSO1G0sO%/ZQ!LSO1G0sO%1nQ!LSO1G0sO%1uQ!LSO1G0sO%3yQ!LSO1G0sO%4QQ!LSO1G0sO%5xQ!LSO1G0sO%6]Q$IvO<<J[O%7bQ!LSO1G0sO%9WQ!LSO'#I}O%;ZQ!LSO1G1XO!$]QYO'#FgOOQO'#Jg'#JgOOQO1G1k1G1kO%;hQWO1G1jO%;mQ!LSO,5>xOOOO7+'^7+'^OOOS1G/S1G/SOOQ$IU1G4f1G4fO!!SQ&jO7+(UO%;wQWO,5>yO7{QWO,5>yOOQO-E<]-E<]O%<VQWO1G5oO%<VQWO1G5oO%<_QWO1G5oO%<jQ&jO7+'nO%<zQpO,5>{O%=UQWO,5>{ONmQ&jO,5>{OOQO-E<_-E<_O%=ZQpO1G5pO%=eQWO1G5pOOQ$IS1G2^1G2^O$AxQWO1G2^OOQ$IS1G2]1G2]O%=mQWO1G2_ONmQ&jO1G2_OOQ$IS1G2d1G2dO!3xQ`O1G2]OARQWO1G2^O%=rQWO1G2_O%=zQWO1G2^O!!SQ&jO7+*nOOQ$IU1G/Z1G/ZO%>VQWO1G/ZOOQ$IU7+'i7+'iO%>[Q&jO7+'pO%>lQ$IvO<<J|OOQ$IU<<J|<<J|ONmQ&jO'#IdO%?`QWO,5@VONmQ&jO1G2bOOQQ<<Gx<<GxO<kQWO<<GxO%?hQ$IvO<<IoOOQ$IU<<Io<<IoOOQO,5?U,5?UO%@[QWO,5?UO%@aQWO,5?UOOQO-E<h-E<hO%@iQWO1G5wO%@iQWO1G5wO7{QWO1G5wO%@qQWO<<L_OOQQ<<L_<<L_O%@vQWO<<L_O7sQ$I[O<<L_O%@{QWO1G0nOOQQ<<Ky<<KyO$F^Q$ItO<<KyOOQQ<<Kz<<KzO$FhQpO<<KzO%AQQ`O'#IfO%A]QWO,5@YO!$]QYO,5@YOOQQ1G2x1G2xO%AeQ$IdO'#JUO%BPQYO'#JUO%BWQ`O'#EZO%BqQ$I[O'#EZO@lQ$IdO'#EZO'|Q`O'#G|OOQO'#Ih'#IhO7sQ$I[O'#IhO%CVQ`O,5=gOOQQ,5=g,5=gO%C^Q`O'#EZO%BgQ`O'#EZO%CoQ`O'#EZO%DYQ`O'#EZO%DyQ`O'#G|O%E[QWO7+(lO%EaQWO7+(lOOQQ7+(l7+(lONmQ&jO7+(lO$}QYO7+(lO%EiQWO7+(lOOQQ7+(o7+(oO7sQ$I[O7+(oO#CxQWO7+(oO7iQWO7+(oO!3xQ`O7+(oO%EtQWO,5?TOOQO-E<g-E<gOOQO'#HP'#HPO%FPQWO1G5uO7sQ$I[O<<GoOOQQ<<Go<<GoO%FXQWO<<GoO%F^QWO7++dO%FcQWO7++eOOQQ7+(w7+(wO%FhQWO7+(wO%FmQYO7+(wO%FtQWO7+(wO$}QYO7++dO$}QYO7++eOOQQ<<Lk<<LkOOQQ<<Lm<<LmOOQQ-E<j-E<jOOQQ1G3l1G3lO%FyQWO,5>ROOQQ,5>T,5>TO%GOQWO1G3rO9aQWO7+&YO!$]QYO7+&YOOQO7+%V7+%VO%GTQ!LSO1G5gO<kQWO7+%VOOQ$IU<<IX<<IXOOQ$IU<<In<<InO<kQWO<<InOOQO<<Ig<<IgO$-xQ$IvO<<IgO$}QYO<<IgOOQO<<I[<<I[O<kQWO<<I[O%G_Q$I[O<<IgO!3xQ`O<<I[O%GjQ$I[O<<IgOAWQ`O<<I[O%GxQ$I[O<<IgO%H^Q$IdO<<IgO%HhQ`O<<I[OAWQ`O<<IgO%HuQWO<<NiO%H}Q$IvO<<NjOOQO7+){7+){O9aQWO7+){OOQQANA^ANA^O%I_QWOANA^ONmQ&jOANA^O!EaQWOANA^O$C|QrOANA^O$}QYOANA^O%IgQ$IvO7+'nO%KxQ$IvO7+'pO%NZQrO1G4[O%NeQ!LSO7+&TO%NrQ!LSO,59mO&!uQ!LSO,5<_O&$xQ!LSO,5<aO&&{Q!LSO,5<oO&(qQ!LSO7+'aO&)OQ!LSO7+'bO&)]QWO,5<ROOQO7+'U7+'UO&)bQ&jO<<KpOOQO1G4e1G4eO&)iQWO1G4eO&)tQWO1G4eO&*SQWO7++ZO&*SQWO7++ZONmQ&jO1G4gO&*[QpO1G4gO&*fQWO7++[OOQ$IS7+'x7+'xO$AxQWO7+'yO&*nQpO7+'yOOQ$IS7+'w7+'wO$AxQWO7+'xO&*uQWO7+'yONmQ&jO7+'yOARQWO7+'xO&*zQ&jO<<NYOOQ$IU7+$u7+$uO&+UQpO,5?OOOQO-E<b-E<bO&+`Q$ItO7+'|OOQQAN=dAN=dO7{QWO1G4pOOQO1G4p1G4pO&+pQWO1G4pO&+uQWO7++cO&+uQWO7++cO7sQ$I[OANAyO&+}QWOANAyOOQQANAyANAyOOQQANAeANAeOOQQANAfANAfO&,SQWO,5?QOOQO-E<d-E<dO&,_Q!LSO1G5tO#CxQWO,5=hO7iQWO,5=hO&.oQrO'#CgO&.yQ`O,5:uO&/TQ`O,5:uO&/bQ`O,5:uO!3xQ`O,5=hOOQO,5?S,5?SOOQO-E<f-E<fOOQQ1G3R1G3RO%BPQYO,5<sO%AeQ$IdO,5=hO!FkQ$IdO,5:uO'|Q`O,5=hO&/uQ`O,5=hO&0WQ`O,5:uOOQQ<<LW<<LWONmQ&jO<<LWO%E[QWO<<LWO&0qQWO<<LWO$}QYO<<LWOOQQ<<LZ<<LZO7sQ$I[O<<LZO#CxQWO<<LZO7iQWO<<LZO&0yQ`O1G4oO&1RQWO7++aOOQQAN=ZAN=ZO7sQ$I[OAN=ZOOQQ<= O<= OOOQQ<= P<= POOQQ<<Lc<<LcO&1ZQWO<<LcO&1`QYO<<LcO&1gQWO<= OO&1lQWO<= POOQQ1G3m1G3mO<kQWO7+)^O&1qQWO<<ItO&1|Q!LSO<<ItOOQO<<Hq<<HqOOQ$IUAN?YAN?YOOQOAN?RAN?RO$-xQ$IvOAN?ROOQOAN>vAN>vO$}QYOAN?RO<kQWOAN>vO&2WQ$I[OAN?RO!3xQ`OAN>vO&2cQ$I[OAN?ROAWQ`OAN>vO&2qQ$I[OAN?ROOQO<<Mg<<MgOOQQG26xG26xONmQ&jOG26xO!EaQWOG26xO&3VQWOG26xO$C|QrOG26xO&3_Q!LSO<<J[O&3lQ!LSO1G2SO&5bQ!LSO1G2fO&7eQ!LSO1G2hO&9hQ!LSO<<J|O&9uQ!LSO<<IoOOQO1G1m1G1mO!!SQ&jOANA[OOQO7+*P7+*PO&:SQWO7+*PO&:_QWO<<NuO&:gQpO7+*ROOQ$IS<<Ke<<KeO$AxQWO<<KeOOQ$IS<<Kd<<KdO&:qQpO<<KeO$AxQWO<<KdOOQO7+*[7+*[O7{QWO7+*[O&:xQWO<<N}OOQQG27eG27eO7sQ$I[OG27eO!$]QYO1G4lO&;QQWO7++`O7sQ$I[O1G3SO#CxQWO1G3SO&;YQ`O1G0aO&;dQ`O1G0aO7iQWO1G3SO!3xQ`O1G3SO'|Q`O1G3SO%AeQ$IdO1G3SO$+jQ$IdO1G0aO&;qQ`O1G3SO%E[QWOANArOOQQANArANArONmQ&jOANArO&<SQWOANArOOQQANAuANAuO7sQ$I[OANAuO#CxQWOANAuOOQO'#HQ'#HQOOQO7+*Z7+*ZOOQQG22uG22uOOQQANA}ANA}O&<[QWOANA}OOQQANDjANDjOOQQANDkANDkOOQQ<<Lx<<LxO!$]QYOAN?`OOQOG24mG24mO$-xQ$IvOG24mOOQOG24bG24bO$}QYOG24mO<kQWOG24bO&<aQ$I[OG24mO!3xQ`OG24bO&<lQ$I[OG24mO!EaQWOLD,dOOQQLD,dLD,dONmQ&jOLD,dO&<zQWOLD,dO&=SQ!LSO7+'nO&>xQ!LSO7+'pO&@nQ&jOG26vOOQO<<Mk<<MkOOQ$ISANAPANAPO$AxQWOANAPOOQ$ISANAOANAOOOQO<<Mv<<MvOOQQLD-PLD-PO&AOQ!LSO7+*WOOQO7+(n7+(nO7sQ$I[O7+(nO&AYQ`O7+%{O#CxQWO7+(nO7iQWO7+(nO!3xQ`O7+(nO'|Q`O7+(nOOQQG27^G27^O%E[QWOG27^ONmQ&jOG27^OOQQG27aG27aO7sQ$I[OG27aOOQQG27iG27iO&AdQ!LSOG24zOOQOLD*XLD*XO$-xQ$IvOLD*XOOQOLD)|LD)|O$}QYOLD*XO<kQWOLD)|O&AnQ$I[OLD*XOOQQ!$(!O!$(!OO!EaQWO!$(!OONmQ&jO!$(!OO&AyQ$IvOG26vOOQ$ISG26kG26kOOQO<<LY<<LYO7sQ$I[O<<LYO#CxQWO<<LYO7iQWO<<LYO!3xQ`O<<LYOOQQLD,xLD,xO%E[QWOLD,xOOQQLD,{LD,{OOQO!$'Ms!$'MsO$-xQ$IvO!$'MsOOQO!$'Mh!$'MhO$}QYO!$'MsOOQQ!)9Ej!)9EjO!EaQWO!)9EjOOQOANAtANAtO7sQ$I[OANAtO#CxQWOANAtO7iQWOANAtOOQQ!$(!d!$(!dOOQO!)9C_!)9C_O$-xQ$IvO!)9C_OOQQ!.K;U!.K;UO&D[Q!LSOG26vOOQOG27`G27`O7sQ$I[OG27`O#CxQWOG27`OOQO!.K8y!.K8yOOQOLD,zLD,zO7sQ$I[OLD,zOOQO!$(!f!$(!fO!$]QYO'#DtO/mQWO'#EPO&FQQrO'#JQO!$]QYO'#DlO&FXQrO'#CgO&HoQrO'#CgO&IPQYO,5:}O!$]QYO,5;XO!$]QYO,5;XO!$]QYO,5;XO!$]QYO,5;XO!$]QYO,5;XO!$]QYO,5;XO!$]QYO,5;XO!$]QYO,5;XO!$]QYO,5;XO!$]QYO,5;XO!$]QYO,5;XO!$]QYO'#I^O&KPQWO,5<^O&KXQ&jO,5;XO&LiQ&jO,5;XO!$]QYO,5;mO/pQWO'#DRO/pQWO'#DRONmQ&jO'#FsO&KXQ&jO'#FsONmQ&jO'#FuO&KXQ&jO'#FuONmQ&jO'#GTO&KXQ&jO'#GTO!$]QYO,5?{O&IPQYO1G0iO&LpQ!LSO'#CgO!$]QYO1G1uONmQ&jO,5<zO&KXQ&jO,5<zONmQ&jO,5<|O&KXQ&jO,5<|ONmQ&jO,5<hO&KXQ&jO,5<hO&IPQYO1G1vO!$]QYO7+&pONmQ&jO1G2SO&KXQ&jO1G2SONmQ&jO1G2UO&KXQ&jO1G2UO&IPQYO7+'bO&IPQYO7+&TONmQ&jOANA[O&KXQ&jOANA[O&LzQWO'#EcO&MPQWO'#EcO&MXQWO'#FRO&M^QWO'#EmO&McQWO'#JaO&MnQWO'#J_O&MyQWO,5:}O&NOQ&jO,5<ZO&NVQWO'#F|O&N[QWO'#F|O&NaQWO,5<[O&NiQWO,5:}O&NqQ!LSO1G1UO&NxQWO,5<hO&N}QWO,5<hO' SQWO,5<jO' XQWO,5<jO' ^QWO1G1vO' cQWO1G0iO' hQ&jO<<KpO' oQ&jO<<KpO6UQ&jO'#FqO7iQWO'#FpO?PQWO'#EbO!$]QYO,5;jO!-PQWO'#F|O!-PQWO'#F|O!-PQWO'#GOO!-PQWO'#GOO!!SQ&jO7+(UO!!SQ&jO7+(UO$?lQpO1G2jO$?lQpO1G2jONmQ&jO,5=OONmQ&jO,5=O",stateData:"'!w~O'gOS'hOSSOSTOS~OPVOQVOW!OO[hO^mOasObrOihOkVOlhOmhOrhOtVOvVO{TO!OhO!PhO!VUO!apO!fWO!iVO!jVO!kVO!lVO!mVO!pqO!tYO#kxO#{uO$PcO%ZvO%]yO%_wO%`wO%czO%e{O%h|O%i|O%k}O%x!PO&O!QO&Q!RO&S!SO&U!TO&X!UO&_!VO&e!WO&g!XO&i!YO&k!ZO&m![O'jRO'rSO'}XO([fO~OPVOQVO[hOa!bOb!aOihOkVOlhOmhOrhOtVOvVO{TO!OhO!PhO!V!^O!apO!fWO!iVO!jVO!kVO!lVO!mVO!p!`O#{!cO$PcO'j!]O'rSO'}XO([fO~O[!fO^!lOl!fO{!gO!Y!mO!Z!kO![!kO!t;SO!x!qO!y!oO!z!pO!{!nO#O!rO#P!rO'k!dO's!eO'}!iO~OPZXYZX^ZXkZXxZXyZX{ZX!TZX!cZX!dZX!fZX!lZX#SZX#_cX#bZX#cZX#dZX#eZX#fZX#gZX#hZX#iZX#jZX#lZX#nZX#pZX#qZX#vZX'eZX'rZX(OZX(VZX(WZX~O!_$uX~P(UOR!sO'c!tO'd!vO~OPVOQVO[hOa!bOb!aOihOkVOlhOmhOrhOtVOvVO{TO!OhO!PhO!V!^O!apO!fWO!iVO!jVO!kVO!lVO!mVO!p!`O#{!cO$PcO'j;VO'rSO'}XO([fO~O!S!zO!T!wO!Q'vP!Q(SP~P*qO!U#SO~P`OPVOQVO[hOa!bOb!aOihOkVOlhOmhOrhOtVOvVO{TO!OhO!PhO!V!^O!apO!fWO!iVO!jVO!kVO!lVO!mVO!p!`O#{!cO$PcO'rSO'}XO([fO~O!S#YO!tYO#]#]O#^#YO'j;WO!e(PP~P-YO!f#_O'j#^O~O!p#cO!tYO%Z#dO~O#_#eO~O!_#fO#_#eO~OP#|OY$TOk#qOx#jOy#kO{#lO!T$QO!c#sO!d#hO!f#iO!l#|O#b#oO#c#pO#d#pO#e#pO#f#rO#g#sO#h#sO#i$SO#j#sO#l#tO#n#vO#p#xO#q#yO'rSO(O#zO(V#mO(W#nO~O^'tX'e'tX'a'tX!e'tX!Q'tX!V'tX%['tX!_'tX~P0_O#S$UO#v$UOP'uXY'uXk'uXx'uXy'uX{'uX!T'uX!c'uX!f'uX!l'uX#b'uX#c'uX#d'uX#e'uX#f'uX#g'uX#h'uX#i'uX#j'uX#l'uX#n'uX#p'uX#q'uX'r'uX(O'uX(V'uX(W'uX!V'uX%['uX~O^'uX!d'uX'e'uX'a'uX!Q'uX!e'uXo'uX!_'uX~P2uO#S$UO~O$R$WO$T$VO$[$]O~O!V$^O$PcO$_$_O$a$aO~O[$dOi$sOk$eOl$dOm$dOr$tOt$uOv$vO{$lO!V$mO!a${O!f$iO#^$|O#{$yO$h$wO$j$xO$m$zO'j$cO'n$rO'r$fOd'oP~O!f$}O~O!_%PO~O^%QO'e%QO~O'j%UO~O!f$}O'j%UO'k!dO'n$rO~Ob%]O!f$}O'j%UO~O#j#sO~O[%fOx%bO!V%_O!f%aO%]%eO'j%UO'k!dO](dP~O!p#cO~O{%gO!V%hO'j%UO~O{%gO!V%hO%e%lO'j%UO~O'j%mO~O#kxO%]yO%_wO%`wO%czO%e{O%h|O%i|O~Oa%vOb%uO!p%sO%Z%tO%m%rO~P:POa%yObrO!V%xO!pqO!tYO#kxO%ZvO%_wO%`wO%czO%e{O%h|O%i|O%k}O~O_%|O#S&PO%]%zO'k!dO~P;OO!f&QO!i&UO~O!f#_O~O!VUO~O^%QO'b&^O'e%QO~O^%QO'b&aO'e%QO~O^%QO'b&cO'e%QO~O'aZX!QZXoZX!eZX%|ZX!VZX%[ZX!_ZX~P(UO[&gOl&gO{&fO!S&jO!Y&pO!Z&iO![&iO'k!dO's&eO!U'wP!U(UP~Og&sO!V&qO'j%UO~Ob&xO!f$}O'j%UO~Ox%bO!f%aO~O[!fOl!fO{!gO!Y&}O!Z&|O![&|O!y'PO!z'PO!{'OO#O'RO#P'RO'k!dO's!eO'}!iO~O!t;SO!x'QO~P?dO^%QO!_#fO!f$}O!l'XO#S'VO'e%QO'n$rO(O'TO~O[!fOl!fO{!gO's!eO'}!iO~O!Z&|O![&|O'k!dO~PAWO!Y&}O!Z&|O![&|O#O'RO#P'RO'k!dO~PAWO!VUO!Y&}O!Z&|O![&|O!{'OO#O'RO#P'RO'k!dO~PAWOR!sO'c!tO'd'_O~O!S'aO!Q&uX!Q&{X!T&uX!T&{X~P*qO!T'cO!Q'vX~OP#|OY$TOk#qOx#jOy#kO{#lO!T'cO!c#sO!d#hO!f#iO!l#|O#b#oO#c#pO#d#pO#e#pO#f#rO#g#sO#h#sO#i$SO#j#sO#l#tO#n#vO#p#xO#q#yO'rSO(O#zO(V#mO(W#nO~O!Q'vX~PCrO!Q'hO~O!Q(RX!T(RX!_(RX!e(RX(O(RX~O#S(RX#_#WX!U(RX~PExO#S'iO!Q(TX!T(TX~O!T'jO!Q(SX~O!Q'mO~O#S$UO~PExO!U'nO~P`Ox#jOy#kO{#lO!d#hO!f#iO'rSOP!haY!hak!ha!T!ha!c!ha!l!ha#b!ha#c!ha#d!ha#e!ha#f!ha#g!ha#h!ha#i!ha#j!ha#l!ha#n!ha#p!ha#q!ha(O!ha(V!ha(W!ha~O^!ha'e!ha'a!ha!Q!ha!e!hao!ha!V!ha%[!ha!_!ha~PG`O!e'oO~O{%gO!V%hO!tYO#]'rO#^'qO'j%UO~O!_#fO#S'sO(O'TO!T(QX^(QX'e(QX~O!e(QX~PJdO!T'vO!e(PX~O!e'xO~O{%gO!V%hO#^'qO'j%UO~Ox'yOy'zO!d#hO!f#iO!t!sa{!sa~O!p!sa%Z!sa!V!sa#]!sa#^!sa'j!sa~PKlO!p(OO~OPVOQVO[hOa!bOb!aOihOkVOlhOmhOrhOtVOvVO{TO!OhO!PhO!VUO!apO!fWO!iVO!jVO!kVO!lVO!mVO!p!`O#{!cO$PcO'j!]O'rSO'}XO([fO~O[$dOi$sOk$eOl$dOm$dOr$tOt$uOv;jO{$lO!V$mO!a<sO!f$iO#^;pO#{$yO$h;lO$j;nO$m$zO'j(SO'n$rO'r$fO~O#_(UO~O[$dOi$sOk$eOl$dOm$dOr$tOt$uOv$vO{$lO!V$mO!a${O!f$iO#^$|O#{$yO$h$wO$j$xO$m$zO'j(SO'n$rO'r$fO~Od'yP~P!!SO!S(YO!e'zP~P$}O's([O'}XO~O{(^O!f#iO's([O'}XO~OP;ROQ;RO[hOa<oOb!aOihOk;ROlhOmhOrhOt;ROv;RO{TO!OhO!PhO!V!^O!a;UO!fWO!i;RO!j;RO!k;RO!l;RO!m;RO!p!`O#{!cO$PcO'j(lO'rSO'}XO([<mO~Oy(oO!f#iO~O!T$QO^$fa'e$fa'a$fa!e$fa!Q$fa!V$fa%[$fa!_$fa~O#k(sO~PNmOx(vO!_(uO!V$SX$O$SX$R$SX$T$SX$[$SX~O!_(uO!V(XX$O(XX$R(XX$T(XX$[(XX~Ox(vO~P!'rOx(vO!V(XX$O(XX$R(XX$T(XX$[(XX~O!V(xO$O(|O$R(wO$T(wO$[(}O~O!S)QO~P!$]O$R$WO$T$VO$[)UO~Og$nXx$nX{$nX!d$nX(V$nX(W$nX~OdfXd$nXgfX!TfX#SfX~P!)hOl)WO~OR)XO'c)YO'd)[O~Og)eOx)^O{)_O(V)aO(W)cO~Od)]O~P!*qOd)fO~O[$dOi$sOk$eOl$dOm$dOr$tOt$uOv;jO{$lO!V$mO!a<sO!f$iO#^;pO#{$yO$h;lO$j;nO$m$zO'n$rO'r$fO~O!S)jO'j)gO!e(]P~P!+`O#_)lO~O!f)mO~O!S)rO'j)oO!Q(^P~P!+`Ok*OO{)vO!Y)|O!Z)uO![)uO!f)mO#O)}O%R)xO'k!dO's!eO~O!U){O~P!-cO!d#hOg'qXx'qX{'qX(V'qX(W'qX!T'qX#S'qX~Od'qX#t'qX~P!.[Og*RO#S*QOd'pX!T'pX~O!T*SOd'oX~O'j%mOd'oP~O!f*ZO~O'j(SO~O{%gO!S#YO!V%hO!tYO#]#]O#^#YO'j%UO!e(PP~O!_#fO#_*_O~OP#|OY$TOk#qOx#jOy#kO{#lO!c#sO!d#hO!f#iO!l#|O#b#oO#c#pO#d#pO#e#pO#f#rO#g#sO#h#sO#i$SO#j#sO#l#tO#n#vO#p#xO#q#yO'rSO(O#zO(V#mO(W#nO~O^!`a!T!`a'e!`a'a!`a!Q!`a!e!`ao!`a!V!`a%[!`a!_!`a~P!0nOg*fO!V&qO%[*eO'n$rO~O!_*hO!V'mX^'mX!T'mX'e'mX~O!f$}O'n$rO~O!f$}O'j%UO'n$rO~O!_#fO#_(UO~O[*sO%]*tO'j*pO!U(eP~O!T*uO](dX~O's([O~OY*yO~O]*zO~O!V%_O'j%UO'k!dO](dP~O{%gO!S+OO!T'jO!V%hO'j%UO!Q(SP~O[&mOl&mO{+QO!S+PO's([O~O!U(UP~P!6OO!T+RO^(aX'e(aX~O#S+VO'n$rO~Og+YO!V$mO'n$rO~O!V+[O~Ox+^O!VUO~O!p+cO~Ob+hO~O'j#^O!U(cP~Ob%]O~O%]yO'j%mO~P;OOY+nO]+mO~OPVOQVO[hOasObrOihOkVOlhOmhOrhOtVOvVO{TO!OhO!PhO!apO!fWO!iVO!jVO!kVO!lVO!mVO!pqO!tYO$PcO%ZvO'rSO'}XO([fO~O!V!^O#{!cO'j!]O~P!8`O]+mO^%QO'e%QO~O^+rO#k+tO%_+tO%`+tO~P$}O!f&QO~O&O+yO~O!V+{O~O&a+}O&c,OOP&^aQ&^aW&^a[&^a^&^aa&^ab&^ai&^ak&^al&^am&^ar&^at&^av&^a{&^a!O&^a!P&^a!V&^a!a&^a!f&^a!i&^a!j&^a!k&^a!l&^a!m&^a!p&^a!t&^a#k&^a#{&^a$P&^a%Z&^a%]&^a%_&^a%`&^a%c&^a%e&^a%h&^a%i&^a%k&^a%x&^a&O&^a&Q&^a&S&^a&U&^a&X&^a&_&^a&e&^a&g&^a&i&^a&k&^a&m&^a'a&^a'j&^a'r&^a'}&^a([&^a!U&^a&V&^a_&^a&[&^a~O'j,TO~O!TzX!T!]X!UzX!U!]X!_zX!_!]X!f!]X#SzX'n!]X~O!_,YO#S,XO!T#[X!T'xX!U#[X!U'xX!_'xX!f'xX'n'xX~O!_,[O!f$}O'n$rO!T!XX!U!XX~O[!fOl!fO{!gO's!eO~OP;ROQ;RO[hOa<oOb!aOihOk;ROlhOmhOrhOt;ROv;RO{TO!OhO!PhO!V!^O!a;UO!fWO!i;RO!j;RO!k;RO!l;RO!m;RO!p!`O#{!cO$PcO'rSO'}XO([<mO~O'j;tO~P!AlO!T,`O!U'wX~O!U,bO~O!_,YO#S,XO!T#[X!U#[X~O!T,cO!U(UX~O!U,eO~O[!fOl!fO{!gO'k!dO's!eO~O!Z,fO![,fO~P!DjO!U,iO~P&}Og,lO!V&qO~O!Q,qO~O[!sal!sa!Y!sa!Z!sa![!sa!x!sa!y!sa!z!sa!{!sa#O!sa#P!sa'k!sa's!sa'}!sa~PKlO^%QO!_#fO!f$}O!l,vO#S,tO'e%QO'n$rO(O'TO~O!Z,xO![,xO'k!dO~PAWO!Y,zO!Z,xO![,xO#O,{O#P,{O'k!dO~PAWO!Y,zO!Z,xO![,xO!{,|O#O,{O#P,{O'k!dO~PAWO!Y,zO!Z,xO![,xO!y,}O!z,}O!{,|O#O,{O#P,{O'k!dO~PAWO^%QO#S,tO'e%QO~O^%QO!_#fO#S,tO'e%QO~O^%QO!_#fO!l,vO#S,tO'e%QO(O'TO~Oo-RO~O!Q&ua!T&ua~P!0nO!S-VO!Q&uX!T&uX~P$}O!T'cO!Q'va~O!Q'va~PCrO!T'jO!Q(Sa~O{%gO!S-ZO!V%hO'j%UO!Q&{X!T&{X~O!T'vO!e(Pa~O{%gO!V%hO#^-^O'j%UO~O#S-`O!T(Qa!e(Qa^(Qa'e(Qa~O!_#fO~P!LUO{%gO!S-cO!V%hO!tYO#]-eO#^-cO'j%UO!T&}X!e&}X~Oy-iO!f#iO~Og-lO!V&qO%[-kO'n$rO~O^#Vi!T#Vi'e#Vi'a#Vi!Q#Vi!e#Vio#Vi!V#Vi%[#Vi!_#Vi~P!0nOg<yOx)^O{)_O(V)aO(W)cO~O#_#Ra^#Ra#S#Ra'e#Ra!T#Ra!e#Ra!V#Ra!Q#Ra~P!NgO#_'qXP'qXY'qX^'qXk'qXy'qX!c'qX!f'qX!l'qX#b'qX#c'qX#d'qX#e'qX#f'qX#g'qX#h'qX#i'qX#j'qX#l'qX#n'qX#p'qX#q'qX'e'qX'r'qX(O'qX!e'qX!Q'qX'a'qXo'qX!V'qX%['qX!_'qX~P!.[O!T-uOd'yX~P!*qOd-wO~O!T-xO!e'zX~P!0nO!e-{O~O!Q-}O~OP#|Ox#jOy#kO{#lO!d#hO!f#iO!l#|O'rSOY#ai^#aik#ai!T#ai!c#ai#c#ai#d#ai#e#ai#f#ai#g#ai#h#ai#i#ai#j#ai#l#ai#n#ai#p#ai#q#ai'e#ai(O#ai(V#ai(W#ai'a#ai!Q#ai!e#aio#ai!V#ai%[#ai!_#ai~O#b#ai~P#$cO#b#oO~P#$cOP#|Ox#jOy#kO{#lO!d#hO!f#iO!l#|O#b#oO#c#pO#d#pO#e#pO'rSOY#ai^#ai!T#ai!c#ai#f#ai#g#ai#h#ai#i#ai#j#ai#l#ai#n#ai#p#ai#q#ai'e#ai(O#ai(V#ai(W#ai'a#ai!Q#ai!e#aio#ai!V#ai%[#ai!_#ai~Ok#ai~P#'TOk#qO~P#'TOP#|Ok#qOx#jOy#kO{#lO!d#hO!f#iO!l#|O#b#oO#c#pO#d#pO#e#pO#f#rO'rSO^#ai!T#ai#l#ai#n#ai#p#ai#q#ai'e#ai(O#ai(V#ai(W#ai'a#ai!Q#ai!e#aio#ai!V#ai%[#ai!_#ai~OY#ai!c#ai#g#ai#h#ai#i#ai#j#ai~P#)uOY$TO!c#sO#g#sO#h#sO#i$SO#j#sO~P#)uOP#|OY$TOk#qOx#jOy#kO{#lO!c#sO!d#hO!f#iO!l#|O#b#oO#c#pO#d#pO#e#pO#f#rO#g#sO#h#sO#i$SO#j#sO#l#tO'rSO^#ai!T#ai#n#ai#p#ai#q#ai'e#ai(O#ai(W#ai'a#ai!Q#ai!e#aio#ai!V#ai%[#ai!_#ai~O(V#ai~P#,vO(V#mO~P#,vOP#|OY$TOk#qOx#jOy#kO{#lO!c#sO!d#hO!f#iO!l#|O#b#oO#c#pO#d#pO#e#pO#f#rO#g#sO#h#sO#i$SO#j#sO#l#tO#n#vO'rSO(V#mO^#ai!T#ai#p#ai#q#ai'e#ai(O#ai'a#ai!Q#ai!e#aio#ai!V#ai%[#ai!_#ai~O(W#ai~P#/hO(W#nO~P#/hOP#|OY$TOk#qOx#jOy#kO{#lO!c#sO!d#hO!f#iO!l#|O#b#oO#c#pO#d#pO#e#pO#f#rO#g#sO#h#sO#i$SO#j#sO#l#tO#n#vO#p#xO'rSO(V#mO(W#nO~O^#ai!T#ai#q#ai'e#ai(O#ai'a#ai!Q#ai!e#aio#ai!V#ai%[#ai!_#ai~P#2YOPZXYZXkZXxZXyZX{ZX!cZX!dZX!fZX!lZX#SZX#_cX#bZX#cZX#dZX#eZX#fZX#gZX#hZX#iZX#jZX#lZX#nZX#pZX#qZX#vZX'rZX(OZX(VZX(WZX!TZX!UZX~O#tZX~P#4sOP#|OY;hOk;[Ox#jOy#kO{#lO!c;^O!d#hO!f#iO!l#|O#b;YO#c;ZO#d;ZO#e;ZO#f;]O#g;^O#h;^O#i;gO#j;^O#l;_O#n;aO#p;cO#q;dO'rSO(O#zO(V#mO(W#nO~O#t.PO~P#7QOP'uXY'uXk'uXx'uXy'uX{'uX!c'uX!d'uX!f'uX!l'uX#b'uX#c'uX#d'uX#e'uX#f'uX#g'uX#h'uX#i'uX#l'uX#n'uX#p'uX#q'uX'r'uX(O'uX(V'uX(W'uX!T'uX~O#S;iO#v;iO#j'uX#t'uX!U'uX~P#9OO^'Qa!T'Qa'e'Qa'a'Qa!e'Qa!Q'Qao'Qa!V'Qa%['Qa!_'Qa~P!0nOP#aiY#ai^#aik#aiy#ai!T#ai!c#ai!d#ai!f#ai!l#ai#b#ai#c#ai#d#ai#e#ai#f#ai#g#ai#h#ai#i#ai#j#ai#l#ai#n#ai#p#ai#q#ai'e#ai'r#ai(O#ai'a#ai!Q#ai!e#aio#ai!V#ai%[#ai!_#ai~P!NgO^#ui!T#ui'e#ui'a#ui!Q#ui!e#uio#ui!V#ui%[#ui!_#ui~P!0nO$R.SO$T.SO~O$R.TO$T.TO~O!_(uO#S.UO!V$XX$O$XX$R$XX$T$XX$[$XX~O!S.VO~O!V(xO$O.XO$R(wO$T(wO$[.YO~O!T;eO!U'tX~P#7QO!U.ZO~O!_(uO$[(XX~O$[.]O~OR)XO'c)YO'd.`O~O[.cOl.cO!Q.dO~O!TcX!_cX!ecX!e$nX(OcX~P!)hO!e.jO~P!NgO!T.kO!_#fO(O'TO!e(]X~O!e.pO~O!S)jO'j%UO!e(]P~O#_.rO~O!Q$nX!T$nX!_$uX~P!)hO!T.sO!Q(^X~P!NgO!_.uO~O!Q.wO~Ok.{O!_#fO!f$}O'n$rO(O'TO~O'j.}O~O!_*hO~O^%QO!T/RO'e%QO~O!U/TO~P!-cO!Z/UO![/UO'k!dO's!eO~O{/WO's!eO~O#O/XO~O'j%mOd'VX!T'VX~O!T*SOd'oa~Od/^O~Ox/_Oy/_O{/`Ogua(Vua(Wua!Tua#Sua~Odua#tua~P#EfOx)^O{)_Og$ga(V$ga(W$ga!T$ga#S$ga~Od$ga#t$ga~P#F[Ox)^O{)_Og$ia(V$ia(W$ia!T$ia#S$ia~Od$ia#t$ia~P#F}O[/aO~O#_/bO~Od$wa!T$wa#S$wa#t$wa~P!*qO#_/eO~Og-lO!V&qO%[-kO~O[$dOk$eOl$dOm$dOr$tOt$uOv;jO{$lO!V$mO!a<sO!f$iO#^;pO#{$yO$h;lO$j;nO$m$zO'n$rO'r$fO~Oi/lO'j/kO~P#HlO!_*hO!V'ma^'ma!T'ma'e'ma~O#_/rO~OYZX!TcX!UcX~O!T/sO!U(eX~O!U/uO~OY/vO~O[/xO'j*pO~O!V%_O'j%UO]'_X!T'_X~O!T*uO](da~O!e/{O~P!0nO[/}O~OY0OO~O]0PO~O!T+RO^(aa'e(aa~O#S0VO~Og0YO!V$mO~O's([O!U(bP~Og0cO!V0`O%[0bO'n$rO~OY0mO!T0kO!U(cX~O!U0nO~O]0pO^%QO'e%QO~O[0qO~O[0rO'j#^O~O#S$UO#j0sO#v$UO%|0tO^'uX~P#9OO#S$UO#j0sO%|0tO~O^0uO~P$}O^0wO~O&V0{OP&TiQ&TiW&Ti[&Ti^&Tia&Tib&Tii&Tik&Til&Tim&Tir&Tit&Tiv&Ti{&Ti!O&Ti!P&Ti!V&Ti!a&Ti!f&Ti!i&Ti!j&Ti!k&Ti!l&Ti!m&Ti!p&Ti!t&Ti#k&Ti#{&Ti$P&Ti%Z&Ti%]&Ti%_&Ti%`&Ti%c&Ti%e&Ti%h&Ti%i&Ti%k&Ti%x&Ti&O&Ti&Q&Ti&S&Ti&U&Ti&X&Ti&_&Ti&e&Ti&g&Ti&i&Ti&k&Ti&m&Ti'a&Ti'j&Ti'r&Ti'}&Ti([&Ti!U&Ti_&Ti&[&Ti~O_1RO!U1PO&[1QO~P`O!VUO!f1TO~O&c,OOP&^iQ&^iW&^i[&^i^&^ia&^ib&^ii&^ik&^il&^im&^ir&^it&^iv&^i{&^i!O&^i!P&^i!V&^i!a&^i!f&^i!i&^i!j&^i!k&^i!l&^i!m&^i!p&^i!t&^i#k&^i#{&^i$P&^i%Z&^i%]&^i%_&^i%`&^i%c&^i%e&^i%h&^i%i&^i%k&^i%x&^i&O&^i&Q&^i&S&^i&U&^i&X&^i&_&^i&e&^i&g&^i&i&^i&k&^i&m&^i'a&^i'j&^i'r&^i'}&^i([&^i!U&^i&V&^i_&^i&[&^i~O!Q1ZO~O!T!Xa!U!Xa~P#7QO!S1aO!Y&pO!Z&iO![&iO!T&vX!U&vX~P!DjO!T,`O!U'wa~O!T&|X!U&|X~P!6OO!T,cO!U(Ua~O!U1hO~P&}O^%QO#S1qO'e%QO~O^%QO!_#fO#S1qO'e%QO~O^%QO!_#fO!f$}O!l1uO#S1qO'e%QO'n$rO(O'TO~O!Z1vO![1vO'k!dO~PAWO!Y1yO!Z1vO![1vO#O1zO#P1zO'k!dO~PAWO!Y1yO!Z1vO![1vO!{1{O#O1zO#P1zO'k!dO~PAWO^%QO!_#fO!l1uO#S1qO'e%QO(O'TO~O^%QO'e%QO~P!0nO!T$QOo$fa~O!Q&ui!T&ui~P!0nO!T'cO!Q'vi~O!T'jO!Q(Si~O!Q(Ti!T(Ti~P!0nO!T'vO!e(Pi~O!T(Qi!e(Qi^(Qi'e(Qi~P!0nO#S2PO!T(Qi!e(Qi^(Qi'e(Qi~O{%gO!V%hO!tYO#]2SO#^2RO'j%UO~O{%gO!V%hO#^2RO'j%UO~Og2ZO!V&qO%[2YO~Og2ZO!V&qO%[2YO'n$rO~O#_uaPuaYua^uakua!cua!dua!fua!lua#bua#cua#dua#eua#fua#gua#hua#iua#jua#lua#nua#pua#qua'eua'rua(Oua!eua!Qua'auaoua!Vua%[ua!_ua~P#EfO#_$gaP$gaY$ga^$gak$gay$ga!c$ga!d$ga!f$ga!l$ga#b$ga#c$ga#d$ga#e$ga#f$ga#g$ga#h$ga#i$ga#j$ga#l$ga#n$ga#p$ga#q$ga'e$ga'r$ga(O$ga!e$ga!Q$ga'a$gao$ga!V$ga%[$ga!_$ga~P#F[O#_$iaP$iaY$ia^$iak$iay$ia!c$ia!d$ia!f$ia!l$ia#b$ia#c$ia#d$ia#e$ia#f$ia#g$ia#h$ia#i$ia#j$ia#l$ia#n$ia#p$ia#q$ia'e$ia'r$ia(O$ia!e$ia!Q$ia'a$iao$ia!V$ia%[$ia!_$ia~P#F}O#_$waP$waY$wa^$wak$way$wa!T$wa!c$wa!d$wa!f$wa!l$wa#b$wa#c$wa#d$wa#e$wa#f$wa#g$wa#h$wa#i$wa#j$wa#l$wa#n$wa#p$wa#q$wa'e$wa'r$wa(O$wa!e$wa!Q$wa'a$wa#S$wao$wa!V$wa%[$wa!_$wa~P!NgO^#Vq!T#Vq'e#Vq'a#Vq!Q#Vq!e#Vqo#Vq!V#Vq%[#Vq!_#Vq~P!0nOd&wX!T&wX~P!!SO!T-uOd'ya~O!S2cO!T&xX!e&xX~P$}O!T-xO!e'za~O!T-xO!e'za~P!0nO!Q2fO~O#t!ha!U!ha~PG`O#t!`a!T!`a!U!`a~P#7QO!V2wO$PcO$Y2xO~O!U2|O~Oo2}O~P!NgO^$cq!T$cq'e$cq'a$cq!Q$cq!e$cqo$cq!V$cq%[$cq!_$cq~P!0nO!Q3OO~O[.cOl.cO~Ox)^O{)_O(W)cOg%Si(V%Si!T%Si#S%Si~Od%Si#t%Si~P$>WOx)^O{)_Og%Ui(V%Ui(W%Ui!T%Ui#S%Ui~Od%Ui#t%Ui~P$>yO(O#zO~P!NgO!S3RO'j%UO!T'RX!e'RX~O!T.kO!e(]a~O!T.kO!_#fO!e(]a~O!T.kO!_#fO(O'TO!e(]a~Od$pi!T$pi#S$pi#t$pi~P!*qO!S3ZO'j)oO!Q'TX!T'TX~P!+`O!T.sO!Q(^a~O!T.sO!Q(^a~P!NgO!_#fO~O!_#fO#j3cO~Ok3fO!_#fO(O'TO~Od'pi!T'pi~P!*qO#S3iOd'pi!T'pi~P!*qO!e3lO~O^$dq!T$dq'e$dq'a$dq!Q$dq!e$dqo$dq!V$dq%[$dq!_$dq~P!0nO!T3pO!V(_X~P!NgO!d#hO~P2uO!V$nX%PZX^$nX!T$nX'e$nX~P!)hO%P3rOghXxhX{hX!VhX(VhX(WhX^hX!ThX'ehX~O%P3rO~O[3xO%]3yO'j*pO!T'^X!U'^X~O!T/sO!U(ea~OY3}O~O]4OO~O[4RO~O!Q4SO~O^%QO'e%QO~P!NgO!V$mO~P!NgO!T4XO#S4ZO!U(bX~O!U4[O~O[!fOl!fO{4^O!Y4kO!Z4bO![4bO!t;SO!x4jO!y4iO!z4iO!{4hO#O4gO#P!rO'k!dO's!eO'}!iO~O!U4fO~P$GPOg4pO!V0`O%[4oO~Og4pO!V0`O%[4oO'n$rO~O'j#^O!T']X!U']X~O!T0kO!U(ca~O[4zO's4yO~O[4{O~O]4}O~O!e5QO~P$}O^5SO~O^5SO~P$}O#j5UO%|5VO~PJdO_1RO!U5ZO&[1QO~P`O!_5]O~O!_5_O!T'xi!U'xi!_'xi!f'xi'n'xi~O!T#[i!U#[i~P#7QO#S5`O!T#[i!U#[i~O!T!Xi!U!Xi~P#7QO^%QO#S5iO'e%QO~O^%QO!_#fO#S5iO'e%QO~O^%QO!_#fO!l5nO#S5iO'e%QO(O'TO~O!f$}O'n$rO~P$L]O!Z5oO![5oO'k!dO~PAWO!Y5rO!Z5oO![5oO#O5sO#P5sO'k!dO~PAWO!T'vO!e(Pq~O!T(Qq!e(Qq^(Qq'e(Qq~P!0nO{%gO!V%hO#^5wO'j%UO~O!V&qO%[5zO~Og5}O!V&qO%[5zO~O#_%SiP%SiY%Si^%Sik%Siy%Si!c%Si!d%Si!f%Si!l%Si#b%Si#c%Si#d%Si#e%Si#f%Si#g%Si#h%Si#i%Si#j%Si#l%Si#n%Si#p%Si#q%Si'e%Si'r%Si(O%Si!e%Si!Q%Si'a%Sio%Si!V%Si%[%Si!_%Si~P$>WO#_%UiP%UiY%Ui^%Uik%Uiy%Ui!c%Ui!d%Ui!f%Ui!l%Ui#b%Ui#c%Ui#d%Ui#e%Ui#f%Ui#g%Ui#h%Ui#i%Ui#j%Ui#l%Ui#n%Ui#p%Ui#q%Ui'e%Ui'r%Ui(O%Ui!e%Ui!Q%Ui'a%Uio%Ui!V%Ui%[%Ui!_%Ui~P$>yO#_$piP$piY$pi^$pik$piy$pi!T$pi!c$pi!d$pi!f$pi!l$pi#b$pi#c$pi#d$pi#e$pi#f$pi#g$pi#h$pi#i$pi#j$pi#l$pi#n$pi#p$pi#q$pi'e$pi'r$pi(O$pi!e$pi!Q$pi'a$pi#S$pio$pi!V$pi%[$pi!_$pi~P!NgOd&wa!T&wa~P!*qO!T&xa!e&xa~P!0nO!T-xO!e'zi~O#t#Vi!T#Vi!U#Vi~P#7QOP#|Ox#jOy#kO{#lO!d#hO!f#iO!l#|O'rSOY#aik#ai!c#ai#c#ai#d#ai#e#ai#f#ai#g#ai#h#ai#i#ai#j#ai#l#ai#n#ai#p#ai#q#ai#t#ai(O#ai(V#ai(W#ai!T#ai!U#ai~O#b#ai~P%(oO#b;YO~P%(oOP#|Ox#jOy#kO{#lO!d#hO!f#iO!l#|O#b;YO#c;ZO#d;ZO#e;ZO'rSOY#ai!c#ai#f#ai#g#ai#h#ai#i#ai#j#ai#l#ai#n#ai#p#ai#q#ai#t#ai(O#ai(V#ai(W#ai!T#ai!U#ai~Ok#ai~P%*zOk;[O~P%*zOP#|Ok;[Ox#jOy#kO{#lO!d#hO!f#iO!l#|O#b;YO#c;ZO#d;ZO#e;ZO#f;]O'rSO#l#ai#n#ai#p#ai#q#ai#t#ai(O#ai(V#ai(W#ai!T#ai!U#ai~OY#ai!c#ai#g#ai#h#ai#i#ai#j#ai~P%-VOY;hO!c;^O#g;^O#h;^O#i;gO#j;^O~P%-VOP#|OY;hOk;[Ox#jOy#kO{#lO!c;^O!d#hO!f#iO!l#|O#b;YO#c;ZO#d;ZO#e;ZO#f;]O#g;^O#h;^O#i;gO#j;^O#l;_O'rSO#n#ai#p#ai#q#ai#t#ai(O#ai(W#ai!T#ai!U#ai~O(V#ai~P%/qO(V#mO~P%/qOP#|OY;hOk;[Ox#jOy#kO{#lO!c;^O!d#hO!f#iO!l#|O#b;YO#c;ZO#d;ZO#e;ZO#f;]O#g;^O#h;^O#i;gO#j;^O#l;_O#n;aO'rSO(V#mO#p#ai#q#ai#t#ai(O#ai!T#ai!U#ai~O(W#ai~P%1|O(W#nO~P%1|OP#|OY;hOk;[Ox#jOy#kO{#lO!c;^O!d#hO!f#iO!l#|O#b;YO#c;ZO#d;ZO#e;ZO#f;]O#g;^O#h;^O#i;gO#j;^O#l;_O#n;aO#p;cO'rSO(V#mO(W#nO~O#q#ai#t#ai(O#ai!T#ai!U#ai~P%4XO^#ry!T#ry'e#ry'a#ry!Q#ry!e#ryo#ry!V#ry%[#ry!_#ry~P!0nOg<zOx)^O{)_O(V)aO(W)cO~OP#aiY#aik#aiy#ai!c#ai!d#ai!f#ai!l#ai#b#ai#c#ai#d#ai#e#ai#f#ai#g#ai#h#ai#i#ai#j#ai#l#ai#n#ai#p#ai#q#ai#t#ai'r#ai(O#ai!T#ai!U#ai~P%7PO!d#hOP'qXY'qXg'qXk'qXx'qXy'qX{'qX!c'qX!f'qX!l'qX#b'qX#c'qX#d'qX#e'qX#f'qX#g'qX#h'qX#i'qX#j'qX#l'qX#n'qX#p'qX#q'qX#t'qX'r'qX(O'qX(V'qX(W'qX!T'qX!U'qX~O#t#ui!T#ui!U#ui~P#7QO!U6ZO~O!T'Qa!U'Qa~P#7QO!_#fO(O'TO!T'Ra!e'Ra~O!T.kO!e(]i~O!T.kO!_#fO!e(]i~Od$pq!T$pq#S$pq#t$pq~P!*qO!Q'Ta!T'Ta~P!NgO!_6bO~O!T.sO!Q(^i~P!NgO!T.sO!Q(^i~O!Q6fO~O!_#fO#j6kO~Ok6lO!_#fO(O'TO~O!Q6nO~Od$rq!T$rq#S$rq#t$rq~P!*qO^$dy!T$dy'e$dy'a$dy!Q$dy!e$dyo$dy!V$dy%[$dy!_$dy~P!0nO!T3pO!V(_a~O^#Vy!T#Vy'e#Vy'a#Vy!Q#Vy!e#Vyo#Vy!V#Vy%[#Vy!_#Vy~P!0nOY6sO~O[6uO'j*pO~O!T/sO!U(ei~O[6xO~O]6yO~O!_5_O~O's([O!T'YX!U'YX~O!T4XO!U(ba~O!f$}O'n$rO^'xX!_'xX!l'xX#S'xX'e'xX(O'xX~O'j7SO~P-YO!t;SO!x7VO!y7UO!z7UO!{7TO#O'RO#P'RO~PAWO^%QO!_#fO!l'XO#S'VO'e%QO(O'TO~O!U7ZO~P$GPO[!fOl!fO{7[O's!eO'}!iO~O!Y7`O!Z7_O![7_O!{7TO#O'RO#P'RO'k!dO~PAWO!Y7`O!Z7_O![7_O!y7aO!z7aO!{7TO#O'RO#P'RO'k!dO~PAWO!Z7_O![7_O'k!dO's!eO'}!iO~O!V0`O~O!V0`O%[7cO~Og7fO!V0`O%[7cO~OY7kO!T']a!U']a~O!T0kO!U(ci~O[7nO~O!e7oO~O!e7pO~O!e7qO~O!e7qO~P$}O^7sO~O!_7vO~O!e7wO~O!T(Ti!U(Ti~P#7QO^%QO#S8PO'e%QO~O^%QO!_#fO#S8PO'e%QO~O^%QO!_#fO!l8TO#S8PO'e%QO(O'TO~O!f$}O'n$rO~P%GxO!Z8UO![8UO'k!dO~PAWO!T'vO!e(Py~O!T(Qy!e(Qy^(Qy'e(Qy~P!0nO!V&qO%[8YO~O#_$pqP$pqY$pq^$pqk$pqy$pq!T$pq!c$pq!d$pq!f$pq!l$pq#b$pq#c$pq#d$pq#e$pq#f$pq#g$pq#h$pq#i$pq#j$pq#l$pq#n$pq#p$pq#q$pq'e$pq'r$pq(O$pq!e$pq!Q$pq'a$pq#S$pqo$pq!V$pq%[$pq!_$pq~P!NgO#_$rqP$rqY$rq^$rqk$rqy$rq!T$rq!c$rq!d$rq!f$rq!l$rq#b$rq#c$rq#d$rq#e$rq#f$rq#g$rq#h$rq#i$rq#j$rq#l$rq#n$rq#p$rq#q$rq'e$rq'r$rq(O$rq!e$rq!Q$rq'a$rq#S$rqo$rq!V$rq%[$rq!_$rq~P!NgO!T&xi!e&xi~P!0nO#t#Vq!T#Vq!U#Vq~P#7QOx/_Oy/_O{/`OPuaYuaguakua!cua!dua!fua!lua#bua#cua#dua#eua#fua#gua#hua#iua#jua#lua#nua#pua#qua#tua'rua(Oua(Vua(Wua!Tua!Uua~Ox)^O{)_OP$gaY$gag$gak$gay$ga!c$ga!d$ga!f$ga!l$ga#b$ga#c$ga#d$ga#e$ga#f$ga#g$ga#h$ga#i$ga#j$ga#l$ga#n$ga#p$ga#q$ga#t$ga'r$ga(O$ga(V$ga(W$ga!T$ga!U$ga~Ox)^O{)_OP$iaY$iag$iak$iay$ia!c$ia!d$ia!f$ia!l$ia#b$ia#c$ia#d$ia#e$ia#f$ia#g$ia#h$ia#i$ia#j$ia#l$ia#n$ia#p$ia#q$ia#t$ia'r$ia(O$ia(V$ia(W$ia!T$ia!U$ia~OP$waY$wak$way$wa!c$wa!d$wa!f$wa!l$wa#b$wa#c$wa#d$wa#e$wa#f$wa#g$wa#h$wa#i$wa#j$wa#l$wa#n$wa#p$wa#q$wa#t$wa'r$wa(O$wa!T$wa!U$wa~P%7PO#t$cq!T$cq!U$cq~P#7QO#t$dq!T$dq!U$dq~P#7QO!U8dO~O#t8eO~P!*qO!_#fO!T'Ri!e'Ri~O!_#fO(O'TO!T'Ri!e'Ri~O!T.kO!e(]q~O!Q'Ti!T'Ti~P!NgO!T.sO!Q(^q~O!Q8kO~P!NgO!Q8kO~Od'py!T'py~P!*qO!T'Wa!V'Wa~P!NgO!V%Oq^%Oq!T%Oq'e%Oq~P!NgOY8pO~O!T/sO!U(eq~O[8sO~O#S8tO!T'Ya!U'Ya~O!T4XO!U(bi~P#7QOPZXYZXkZXxZXyZX{ZX!QZX!TZX!cZX!dZX!fZX!lZX#SZX#_cX#bZX#cZX#dZX#eZX#fZX#gZX#hZX#iZX#jZX#lZX#nZX#pZX#qZX#vZX'rZX(OZX(VZX(WZX~O!_$|X#j$|X~P&,iO#O,{O#P,{O~PAWO!{8xO#O,{O#P,{O~PAWO!y8yO!z8yO!{8xO#O,{O#P,{O~PAWO!Z8|O![8|O'k!dO's!eO'}!iO~O!Y9PO!Z8|O![8|O!{8xO#O,{O#P,{O'k!dO~PAWO!V0`O%[9SO~O[9YO's9XO~O!T0kO!U(cq~O!e9[O~O!e9[O~P$}O!e9^O~O!e9_O~O#S9aO!T#[y!U#[y~O!T#[y!U#[y~P#7QO^%QO#S9eO'e%QO~O^%QO!_#fO#S9eO'e%QO~O^%QO!_#fO!l9iO#S9eO'e%QO(O'TO~O!V&qO%[9lO~O#t#ry!T#ry!U#ry~P#7QOP$piY$pik$piy$pi!c$pi!d$pi!f$pi!l$pi#b$pi#c$pi#d$pi#e$pi#f$pi#g$pi#h$pi#i$pi#j$pi#l$pi#n$pi#p$pi#q$pi#t$pi'r$pi(O$pi!T$pi!U$pi~P%7POx)^O{)_O(W)cOP%SiY%Sig%Sik%Siy%Si!c%Si!d%Si!f%Si!l%Si#b%Si#c%Si#d%Si#e%Si#f%Si#g%Si#h%Si#i%Si#j%Si#l%Si#n%Si#p%Si#q%Si#t%Si'r%Si(O%Si(V%Si!T%Si!U%Si~Ox)^O{)_OP%UiY%Uig%Uik%Uiy%Ui!c%Ui!d%Ui!f%Ui!l%Ui#b%Ui#c%Ui#d%Ui#e%Ui#f%Ui#g%Ui#h%Ui#i%Ui#j%Ui#l%Ui#n%Ui#p%Ui#q%Ui#t%Ui'r%Ui(O%Ui(V%Ui(W%Ui!T%Ui!U%Ui~O#t$dy!T$dy!U$dy~P#7QO#t#Vy!T#Vy!U#Vy~P#7QO!_#fO!T'Rq!e'Rq~O!T.kO!e(]y~O!Q'Tq!T'Tq~P!NgO!Q9sO~P!NgO!T/sO!U(ey~O!T4XO!U(bq~O#O1zO#P1zO~PAWO!{9zO#O1zO#P1zO~PAWO!Z:OO![:OO'k!dO's!eO'}!iO~O!V0`O%[:RO~O!e:UO~O^%QO#S:ZO'e%QO~O^%QO!_#fO#S:ZO'e%QO~O!V&qO%[:`O~OP$pqY$pqk$pqy$pq!c$pq!d$pq!f$pq!l$pq#b$pq#c$pq#d$pq#e$pq#f$pq#g$pq#h$pq#i$pq#j$pq#l$pq#n$pq#p$pq#q$pq#t$pq'r$pq(O$pq!T$pq!U$pq~P%7POP$rqY$rqk$rqy$rq!c$rq!d$rq!f$rq!l$rq#b$rq#c$rq#d$rq#e$rq#f$rq#g$rq#h$rq#i$rq#j$rq#l$rq#n$rq#p$rq#q$rq#t$rq'r$rq(O$rq!T$rq!U$rq~P%7POd%W!Z!T%W!Z#S%W!Z#t%W!Z~P!*qO!T'Yq!U'Yq~P#7QO#O5sO#P5sO~PAWO!T#[!Z!U#[!Z~P#7QO^%QO#S:nO'e%QO~O#_%W!ZP%W!ZY%W!Z^%W!Zk%W!Zy%W!Z!T%W!Z!c%W!Z!d%W!Z!f%W!Z!l%W!Z#b%W!Z#c%W!Z#d%W!Z#e%W!Z#f%W!Z#g%W!Z#h%W!Z#i%W!Z#j%W!Z#l%W!Z#n%W!Z#p%W!Z#q%W!Z'e%W!Z'r%W!Z(O%W!Z!e%W!Z!Q%W!Z'a%W!Z#S%W!Zo%W!Z!V%W!Z%[%W!Z!_%W!Z~P!NgOP%W!ZY%W!Zk%W!Zy%W!Z!c%W!Z!d%W!Z!f%W!Z!l%W!Z#b%W!Z#c%W!Z#d%W!Z#e%W!Z#f%W!Z#g%W!Z#h%W!Z#i%W!Z#j%W!Z#l%W!Z#n%W!Z#p%W!Z#q%W!Z#t%W!Z'r%W!Z(O%W!Z!T%W!Z!U%W!Z~P%7POo'tX~P0_O!QcX!TcX#ScX~P&,iOPZXYZXkZXxZXyZX{ZX!TZX!TcX!cZX!dZX!fZX!lZX#SZX#ScX#_cX#bZX#cZX#dZX#eZX#fZX#gZX#hZX#iZX#jZX#lZX#nZX#pZX#qZX#vZX'rZX(OZX(VZX(WZX~O!_cX!eZX!ecX(OcX~P&FfOP;ROQ;RO[hOa<oOb!aOihOk;ROlhOmhOrhOt;ROv;RO{TO!OhO!PhO!VUO!a;UO!fWO!i;RO!j;RO!k;RO!l;RO!m;RO!p!`O#{!cO$PcO'j(lO'rSO'}XO([<mO~O!T;eO!U$fa~O[$dOi$sOk$eOl$dOm$dOr$tOt$uOv;kO{$lO!V$mO!a<tO!f$iO#^;qO#{$yO$h;mO$j;oO$m$zO'j(SO'n$rO'r$fO~O#k(sO~P&KXO!UZX!UcX~P&FfO#_;XO~O!_#fO#_;XO~O#S;iO~O#j;^O~O#S;rO!T(TX!U(TX~O#S;iO!T(RX!U(RX~O#_;sO~Od;uO~P!*qO#_;zO~O#_;{O~O!_#fO#_;|O~O!_#fO#_;sO~O#t;}O~P#7QO#_<OO~O#_<PO~O#_<QO~O#_<RO~O#_<SO~O#_<TO~O#t<UO~P!*qO#t<VO~P!*qO$P~!d!x!z!{#O#]#^#i([$h$j$m%P%Z%[%]%c%e%h%i%k%m~TS$P([#c!P'g'k#dl#b#ekx'h's'h'j$R$T$R~",goto:"$$n(iPPPPPPP(jP(zP*vPPPP.uPP/[P5S8sP9WP9WPPP9WP:v9WP9WP9WP:zPP;PP;j@YPPP@^PPPP@^CYPPPC`E`P@^PGvPPPPJR@^PPPPPL^@^P! m!!o!!tP!#f!#j!#fPPPP!&p!(uPP!)O!*YP!!o@^@^!-l!0q!5t!5t!9fPPP!9m@^PPPPPPPPPPP!<uP!>ZPP@^!?kP@^P@^@^@^@^P@^!AQPP!DTP!GSP!GW!Gb!Gf!GfP!DQP!Gj!GjP!JiP!Jm@^@^!Js!Mq9WP9WP9W9WP!N{9W9W#!u9W#%S9W#&v9W9W#'d#)`#)`#)d#)l#)`#)tP#)`P9W#*p9W#+x9W9W.uPPP#-TPP#-m#-mP#-mP#.S#-mPP#.YP#.PP#.P#.l!(z#.P#/W#/^#/a(j#/d(jP#/k#/k#/kP(jP(jP(jP(jPP(jP#/q#/tP#/t(jP#/xP#/{P(jP(jP(jP(jP(jP(j(jPP#0R#0]#0c#0i#0w#0}#1T#1_#1e#2a#2p#2v#3Y#3`#3f#3t#4Z#5k#5y#6P#6V#6]#6c#6m#6s#6y#7T#7g#7mPPPPPPPP#7sPP#8g#<RP#=n#=u#=}PP#BX#D}#KZ#K^#Ka#M^#Ma#Md#MkPP#Mq#Mu#Nn$ n$ r$!WPP$![$!b$!fP$!i$!m$!p$#f$#|$$R$$U$$X$$_$$b$$f$$jmmOUo!S#T%P&T&V&W&Y+v+{0{1OU!kQ&q,hQ%[rQ%cuQ%{!OS&i!^,`Q&w!a[&|!h!m!n!o!p!qS)u$m)zQ*n%]Q*{%eQ+g%uQ,f&pQ,p&xW,x&}'O'P'QQ/U)|Q0j+hU1v,z,|,}S4b0`4eS5o1y1{U7_4i4j4kQ8U5rS8|7`7aR:O9P$zaOPTUVWop!S!X!g!s!w!z#T#_#e#i#l#o#p#q#r#s#t#u#v#w#x#y$Q$U%P%a%|&P&T&V&W&Y&^&f&s'V'a'c'i's(U(Y(^)]*_+Q+r+v+{,l,t-V-`-x.P/`/e/r0c0s0t0u0w0{1O1Q1q2P2c4^4p5S5U5V5i7[7f7s8P9e:Z:nS#aY;S!l(n#{$^&j)Q,X,[.V1a2w4Z5`8t9a;R;U;X;Y;Z;[;];^;_;`;a;b;c;d;e;i;r;s;u;|;}<S<T<pQ*V$vQ*s%_Q+i%xQ+p&QQ-o;jQ/i*fQ/m*hQ/x*tQ0r+nQ2V-lQ3x/sQ4w0kQ5|2ZQ6S;kQ6u3yR8]5}pjOUo!O!S#T%P%z&T&V&W&Y+v+{0{1OR+k%|&l]OPUVops!S!X!b!g!s#T#_#e#i#l#o#p#q#r#s#t#u#v#w#x#y#{$Q$U$^%P%a%|&P&Q&T&V&W&Y&^&f&s'V'c'i's(U(Y(^)Q)]*_*f+Q+r+v+{,X,[,l,t-V-`-l-x.P.V/`/e/r0c0s0t0u0w0{1O1Q1a1q2P2Z2c2w4Z4^4p5S5U5V5`5i5}7[7f7s8P8t9a9e:Z:n;R;U;X;Y;Z;[;];^;_;`;a;b;c;d;e;i;r;s;u;|;}<S<T<o<p[!|TW!w!z&j'aQ%VqQ%ZrS%`u%e!U%iwx#W#Y#]$}%g'j'q'r'v+O+P+R+t,Y-Z-^-b-c-e1T2R2S5_5wQ%q|Q&t!`Q&v!aQ'}#cS)i$i)mS*m%[%]Q*q%_Q+b%sQ+f%uS,o&w&xQ-n(OQ.o)jQ/q*nQ/w*tQ/y*uQ/|*yQ0e+cS0i+g+hQ1m,pQ3Q.kQ3w/sQ3{/vQ4Q0OQ4v0jQ6_3RQ6t3yQ6w3}Q8o6sR9u8pv$kf#h$w$x$|)b)d)l*Q*R-u.r/b3P3i8e<m<u<v!`%Xr!a!j%Z%[%]&h&v&w&x&{'Y)t*m*n,],o,p,w,y.|/q1f1m1t1x3e5m5q8S9hQ*g%VQ+W%nQ+Z%oQ+e%uQ-m'}Q0d+bU0h+f+g+hQ2[-nQ4q0eS4u0i0jS7R4]4aQ7j4vU8z7W7]7^U9|8{8}9OQ:f9}Q:t:g!z<q#f$S$T$i$l)X)e)r*e*h+V+Y-k.s.u0V0Y0b2Y3Z3c3p3r4o5z6b6k7c8Y9S9l:R:`;l;n;p;v;x;z<O<Q<U<y<zg<r;g;h;m;o;q;w;y;{<P<R<VW$pf$r*S<mS%ny%zQ%ozQ%p{R+U%l$Z$of#f#h$S$T$i$l$w$x$|)X)b)d)e)l)r*Q*R*e*h+V+Y-k-u.r.s.u/b0V0Y0b2Y3P3Z3c3i3p3r4o5z6b6k7c8Y8e9S9l:R:`;g;h;l;m;n;o;p;q;v;w;x;y;z;{<O<P<Q<R<U<V<m<u<v<y<zT)Y$f)ZV*W$v;j;kU&m!^%h,cS(]#j#kQ*x%bS-g'y'zQ0Z+[Q3j/_R6}4X&rhOPTUVWop!S!X!g!s!w!z#T#_#e#i#l#o#p#q#r#s#t#u#v#w#x#y#{$Q$U$^%P%a%|&P&Q&T&V&W&Y&^&f&j&s'V'a'c'i's(U(Y(^)Q)]*_*f+Q+r+v+{,X,[,l,t-V-`-l-x.P.V/`/e/r0c0s0t0u0w0{1O1Q1a1q2P2Z2c2w4Z4^4p5S5U5V5`5i5}7[7f7s8P8t9a9e:Z:n;R;U;X;Y;Z;[;];^;_;`;a;b;c;d;e;i;r;s;u;|;}<S<T<p$c$P`!y#U%T'`'f(Q(X(a(b(c(d(e(f(g(h(i(j(k(m(p(t)O*w,^-Q-T-Y-_-t-z.O.Q.a/c1[1_1o2O2b2g2h2i2j2k2l2m2n2o2p2q2r2s2v2{3n3u5b5h5u6Q6R6W6X7P7y7}8^8b8c9c9w:V:X:l:w;T<dT!tS!u&shOPTUVWop!S!X!g!s!w!z#T#_#e#i#l#o#p#q#r#s#t#u#v#w#x#y#{$Q$U$^%P%a%|&P&Q&T&V&W&Y&^&f&j&s'V'a'c'i's(U(Y(^)Q)]*_*f+Q+r+v+{,X,[,l,t-V-`-l-x.P.V/`/e/r0c0s0t0u0w0{1O1Q1a1q2P2Z2c2w4Z4^4p5S5U5V5`5i5}7[7f7s8P8t9a9e:Z:n;R;U;X;Y;Z;[;];^;_;`;a;b;c;d;e;i;r;s;u;|;}<S<T<pQ&k!^R1b,`!z!fQ!^!h!k!m!n!o!p!q!r&i&p&q&|&}'O'P'Q'R,`,f,h,x,z,{,|,}1v1y1z1{4_4g4h5o5r5s7T7U7V8U8x8y9zS)t$m)zS.|)u)|Q/V)}Q0]+^Q3e/UQ3h/XS4]0`4eS7W4b4kS7]4i4jS8{7_7`Q8}7aS9}8|9PR:g:OlmOUo!S#T%P&T&V&W&Y+v+{0{1OQ&[!VQ'Z!oS(P#e;XQ*k%YQ+`%qQ+a%rQ,m&uQ-P'SS-s(U;sS/d*_;|Q/o*lQ0_+_Q1S+}Q1U,OQ1^,ZQ1k,nQ1n,rS3o/e<SQ3s/pS3v/r<TQ5a1`Q5e1lQ5j1sQ6r3tQ7z5cQ7{5fQ8O5kQ9`7wQ9d8QQ:Y9fR:m:[$^$O`!y#U'`'f(Q(X(a(b(c(d(e(f(g(h(i(j(k(m(p(t)O*w,^-Q-T-Y-_-t-z.O.a/c1[1_1o2O2b2g2h2i2j2k2l2m2n2o2p2q2r2s2v2{3n3u5b5h5u6Q6R6W6X7P7y7}8^8b8c9c9w:V:X:l:w;T<dS'|#`&zU*P$n(T2uS*c%T.QQ2W/iQ5y2VQ8[5|R9m8]$^#}`!y#U'`'f(Q(X(a(b(c(d(e(f(g(h(i(j(k(m(p(t)O*w,^-Q-T-Y-_-t-z.O.a/c1[1_1o2O2b2g2h2i2j2k2l2m2n2o2p2q2r2s2v2{3n3u5b5h5u6Q6R6W6X7P7y7}8^8b8c9c9w:V:X:l:w;T<dS'{#`&zS(_#k$OS*b%T.QS-h'z'|Q.R(oQ/f*cR2T-i&rhOPTUVWop!S!X!g!s!w!z#T#_#e#i#l#o#p#q#r#s#t#u#v#w#x#y#{$Q$U$^%P%a%|&P&Q&T&V&W&Y&^&f&j&s'V'a'c'i's(U(Y(^)Q)]*_*f+Q+r+v+{,X,[,l,t-V-`-l-x.P.V/`/e/r0c0s0t0u0w0{1O1Q1a1q2P2Z2c2w4Z4^4p5S5U5V5`5i5}7[7f7s8P8t9a9e:Z:n;R;U;X;Y;Z;[;];^;_;`;a;b;c;d;e;i;r;s;u;|;}<S<T<pS#aY;SQ&V!QQ&W!RQ&Y!TQ&Z!UR0z+yQ&r!`Q*d%VQ,k&tS-j'}*gQ1i,jW2X-m-n/h/jQ5d1jU5x2U2W2[S8X5y5{S9k8Z8[S:^9j9mQ:o:_R:x:pV!lQ&q,h!_ZOQUW[o!O!S!h#T#W$}%P%z%|&T&V&W&Y&q'v+v+{,h-b0`0{1O4_4eT#aY;S%UtOPTUVWop!S!X!g!s!w!z#T#_#e#i#l#o#p#q#r#s#t#u#v#w#x#y$Q$U%P%a%|&P&Q&T&V&W&Y&^&f&s'V'a'c'i's(U(Y(^)]*_*f+Q+r+v+{,l,t-V-`-l-x.P/`/e/r0c0s0t0u0w0{1O1Q1q2P2Z2c4^4p5S5U5V5i5}7[7f7s8P9e:Z:nS(]#j#kS-g'y'z!m<Z#{$^&j)Q,X,[.V1a2w4Z5`8t9a;R;U;X;Y;Z;[;];^;_;`;a;b;c;d;e;i;r;s;u;|;}<S<T<pU!jQ&q,hY&{!h!n!o!p!qS'Y!k!mW'[!r4_4g4hS,w&|&}U,y'O'P'QW-O'R7T7U7VS1t,x,zU1w,{8x8yS1x,|,}S4a0`4eS5m1v1yS5p1z9zQ5q1{S7W4b4kS7^4i4jS8S5o5rQ8V5sS8{7_7`Q9O7aQ9h8US9}8|9PR:g:OU!lQ&q,hT4c0`4eU'X!j4`4aS'u#X0xU,v&{'[7^Q.n)iQ.z)tU1u,y-O9OQ3V.oS3`.{/VS5n1w1xQ6^3QS6i3f3hS8T5p5qQ8g6_Q8n6lR9i8VQ#g_U'W!j4`4aS't#X0xQ*`%OQ*i%WQ*o%^W,u&{'X'[7^Q-a'uQ.m)iQ.y)tQ/P)wQ/n*jQ0f+dW1r,v,y-O9OS3U.n.oS3_.z/VQ3b/OQ3d/QQ4s0gU5l1u1w1xQ6]3QQ6a3VS6e3`3hQ6j3gQ7h4tU8R5n5p5qS8f6^6_Q8j6fQ8l6iQ8v7QQ9V7iS9g8T8VQ9q8gQ9r8kQ9t8nQ9y8wQ:T9WQ:]9iQ:b9sQ:d9{Q:r:eQ:{:sQ;P:|Q<^<XQ<i<bR<j<c%U^OPTUVWop!S!X!g!s!w!z#T#_#e#i#l#o#p#q#r#s#t#u#v#w#x#y$Q$U%P%a%|&P&Q&T&V&W&Y&^&f&s'V'a'c'i's(U(Y(^)]*_*f+Q+r+v+{,l,t-V-`-l-x.P/`/e/r0c0s0t0u0w0{1O1Q1q2P2Z2c4^4p5S5U5V5i5}7[7f7s8P9e:Z:nS#gs!b!l<W#{$^&j)Q,X,[.V1a2w4Z5`8t9a;R;U;X;Y;Z;[;];^;_;`;a;b;c;d;e;i;r;s;u;|;}<S<T<pR<^<o%U_OPTUVWop!S!X!g!s!w!z#T#_#e#i#l#o#p#q#r#s#t#u#v#w#x#y$Q$U%P%a%|&P&Q&T&V&W&Y&^&f&s'V'a'c'i's(U(Y(^)]*_*f+Q+r+v+{,l,t-V-`-l-x.P/`/e/r0c0s0t0u0w0{1O1Q1q2P2Z2c4^4p5S5U5V5i5}7[7f7s8P9e:Z:nQ%Og!`%Wr!a!j%Z%[%]&h&v&w&x&{'Y)t*m*n,],o,p,w,y.|/q1f1m1t1x3e5m5q8S9hS%^s!bQ*j%XQ+d%uW0g+e+f+g+hU4t0h0i0jS7Q4]4aS7i4u4vW8w7R7W7]7^Q9W7jW9{8z8{8}9OS:e9|9}S:s:f:gQ:|:t!l<X#{$^&j)Q,X,[.V1a2w4Z5`8t9a;R;U;X;Y;Z;[;];^;_;`;a;b;c;d;e;i;r;s;u;|;}<S<T<pQ<b<nR<c<o$xbOPUVop!S!X!g!s#T#_#e#i#l#o#p#q#r#s#t#u#v#w#x#y$Q$U%P%a%|&P&T&V&W&Y&^&f&s'V'c'i's(U(Y(^)]*_*f+Q+r+v+{,l,t-V-`-l-x.P/`/e/r0c0s0t0u0w0{1O1Q1q2P2Z2c4^4p5S5U5V5i5}7[7f7s8P9e:Z:nY#RTW!w!z'a!U%iwx#W#Y#]$}%g'j'q'r'v+O+P+R+t,Y-Z-^-b-c-e1T2R2S5_5wQ+q&Q!j<Y#{$^)Q,X,[.V1a2w4Z5`8t9a;R;U;X;Y;Z;[;];^;_;`;a;b;c;d;e;i;r;s;u;|;}<S<T<pR<]&jS&n!^%hR1d,c$zaOPTUVWop!S!X!g!s!w!z#T#_#e#i#l#o#p#q#r#s#t#u#v#w#x#y$Q$U%P%a%|&P&T&V&W&Y&^&f&s'V'a'c'i's(U(Y(^)]*_+Q+r+v+{,l,t-V-`-x.P/`/e/r0c0s0t0u0w0{1O1Q1q2P2c4^4p5S5U5V5i7[7f7s8P9e:Z:n!l(n#{$^&j)Q,X,[.V1a2w4Z5`8t9a;R;U;X;Y;Z;[;];^;_;`;a;b;c;d;e;i;r;s;u;|;}<S<T<pQ+p&QQ/i*fQ2V-lQ5|2ZR8]5}!l#u`!y%T'`'f(Q(X(h(i(j(k(p(t*w-Q-T-Y-_-t-z.a/c1o2O2b2s3n3u5h5u6Q7}9c:X:l:w;T!T;`(m)O,^.Q1[1_2g2o2p2q2r2v2{5b6R6W6X7P7y8^8b8c9w:V<d!h#w`!y%T'`'f(Q(X(j(k(p(t*w-Q-T-Y-_-t-z.a/c1o2O2b2s3n3u5h5u6Q7}9c:X:l:w;T!P;b(m)O,^.Q1[1_2g2q2r2v2{5b6R6W6X7P7y8^8b8c9w:V<d!d#{`!y%T'`'f(Q(X(p(t*w-Q-T-Y-_-t-z.a/c1o2O2b2s3n3u5h5u6Q7}9c:X:l:w;TQ3P.iz<p(m)O,^.Q1[1_2g2v2{5b6R6W6X7P7y8^8b8c9w:V<dQ<u<wR<v<x&rhOPTUVWop!S!X!g!s!w!z#T#_#e#i#l#o#p#q#r#s#t#u#v#w#x#y#{$Q$U$^%P%a%|&P&Q&T&V&W&Y&^&f&j&s'V'a'c'i's(U(Y(^)Q)]*_*f+Q+r+v+{,X,[,l,t-V-`-l-x.P.V/`/e/r0c0s0t0u0w0{1O1Q1a1q2P2Z2c2w4Z4^4p5S5U5V5`5i5}7[7f7s8P8t9a9e:Z:n;R;U;X;Y;Z;[;];^;_;`;a;b;c;d;e;i;r;s;u;|;}<S<T<pS$_e$`R2x.U&ydOPTUVWeop!S!X!g!s!w!z#T#_#e#i#l#o#p#q#r#s#t#u#v#w#x#y#{$Q$U$^$`%P%a%|&P&Q&T&V&W&Y&^&f&j&s'V'a'c'i's(U(Y(^)Q)]*_*f+Q+r+v+{,X,[,l,t-V-`-l-x.P.U.V/`/e/r0c0s0t0u0w0{1O1Q1a1q2P2Z2c2w4Z4^4p5S5U5V5`5i5}7[7f7s8P8t9a9e:Z:n;R;U;X;Y;Z;[;];^;_;`;a;b;c;d;e;i;r;s;u;|;}<S<T<pT$Zc$aQ$XcS(w$[({R)T$aT$Yc$aT(y$[({&yeOPTUVWeop!S!X!g!s!w!z#T#_#e#i#l#o#p#q#r#s#t#u#v#w#x#y#{$Q$U$^$`%P%a%|&P&Q&T&V&W&Y&^&f&j&s'V'a'c'i's(U(Y(^)Q)]*_*f+Q+r+v+{,X,[,l,t-V-`-l-x.P.U.V/`/e/r0c0s0t0u0w0{1O1Q1a1q2P2Z2c2w4Z4^4p5S5U5V5`5i5}7[7f7s8P8t9a9e:Z:n;R;U;X;Y;Z;[;];^;_;`;a;b;c;d;e;i;r;s;u;|;}<S<T<pT$_e$`Q$beR)S$`%UgOPTUVWop!S!X!g!s!w!z#T#_#e#i#l#o#p#q#r#s#t#u#v#w#x#y$Q$U%P%a%|&P&Q&T&V&W&Y&^&f&s'V'a'c'i's(U(Y(^)]*_*f+Q+r+v+{,l,t-V-`-l-x.P/`/e/r0c0s0t0u0w0{1O1Q1q2P2Z2c4^4p5S5U5V5i5}7[7f7s8P9e:Z:n!m<n#{$^&j)Q,X,[.V1a2w4Z5`8t9a;R;U;X;Y;Z;[;];^;_;`;a;b;c;d;e;i;r;s;u;|;}<S<T<p#aiOPUWo!S!X!g!s#T#_#l$^%P%|&P&Q&T&V&W&Y&^&f&s(^)Q*f+Q+r+v+{,l-l.V/`0c0s0t0u0w0{1O1Q2Z2w4^4p5S5U5V5}7[7f7sv$nf#h$w$x$|)b)d)l*Q*R-u.r/b3P3i8e<m<u<v!z(T#f$S$T$i$l)X)e)r*e*h+V+Y-k.s.u0V0Y0b2Y3Z3c3p3r4o5z6b6k7c8Y9S9l:R:`;l;n;p;v;x;z<O<Q<U<y<zQ*[$zQ.b)^g2u;g;h;m;o;q;w;y;{<P<R<Vv$jf#h$w$x$|)b)d)l*Q*R-u.r/b3P3i8e<m<u<vQ)n$kS)w$m)zQ*]${Q/Q)x!z<`#f$S$T$i$l)X)e)r*e*h+V+Y-k.s.u0V0Y0b2Y3Z3c3p3r4o5z6b6k7c8Y9S9l:R:`;l;n;p;v;x;z<O<Q<U<y<zf<a;g;h;m;o;q;w;y;{<P<R<VQ<e<qQ<f<rQ<g<sR<h<tv$nf#h$w$x$|)b)d)l*Q*R-u.r/b3P3i8e<m<u<v!z(T#f$S$T$i$l)X)e)r*e*h+V+Y-k.s.u0V0Y0b2Y3Z3c3p3r4o5z6b6k7c8Y9S9l:R:`;l;n;p;v;x;z<O<Q<U<y<zg2u;g;h;m;o;q;w;y;{<P<R<VlkOUo!S#T%P&T&V&W&Y+v+{0{1OQ)q$lQ,U&aQ,V&cR3Y.s$Y$of#f#h$S$T$i$l$w$x$|)X)b)d)e)l)r*Q*R*e*h+V+Y-k-u.r.s.u/b0V0Y0b2Y3P3Z3c3i3p3r4o5z6b6k7c8Y8e9S9l:R:`;g;h;l;m;n;o;p;q;v;w;x;y;z;{<O<P<Q<R<U<V<m<u<v<y<zQ+X%oQ0X+ZQ4V0WR6|4WT)y$m)zS)y$m)zT4d0`4eS/O)v4^T3g/W7[Q*i%WQ/P)wQ/n*jQ0f+dQ4s0gQ7h4tQ8v7QQ9V7iQ9y8wQ:T9WQ:d9{Q:r:eQ:{:sR;P:|n)b$g(V*^.q/Y/Z2`3W3m6[6m9p<_<k<l!W;v(R(r)h)p-r.^.i.v/g0U0W2_3X3]4U4W6O6P6c6g6o6q8i8m:a<w<x];w2t6V8_9n9o:yp)d$g(V*^.g.q/Y/Z2`3W3m6[6m9p<_<k<l!Y;x(R(r)h)p-r.^.i.v/g0U0W2]2_3X3]4U4W6O6P6c6g6o6q8i8m:a<w<x_;y2t6V8_8`9n9o:ypjOUo!O!S#T%P%z&T&V&W&Y+v+{0{1OQ%w}R+r&QpjOUo!O!S#T%P%z&T&V&W&Y+v+{0{1OR%w}Q+]%pR0T+UqjOUo!O!S#T%P%z&T&V&W&Y+v+{0{1OQ0a+bS4n0d0eU7b4l4m4qS9R7d7eS:P9Q9TQ:h:QR:u:iQ&O!OR+l%zR4z0mR9Y7kS%`u%eR/y*uQ&T!PR+v&UR+|&ZT0|+{1OR,Q&[Q,P&[R1V,QQoOQ#TUT%So#TQ)Z$fR._)ZQ!uSR'^!uQ!xTU'd!x'e-WQ'e!yR-W'fQ,a&kR1c,aQ-v(VR2a-vQ-y(XS2d-y2eR2e-zQ,h&qR1g,hr[OUo!O!S#T%P%z%|&T&V&W&Y+v+{0{1OU!hQ&q,hS#WW$}Y#b[!h#W-b4_Q-b'vT4_0`4eS#OT%gU'k#O'l-XQ'l#PR-X'gQ,d&nR1e,dQ'w#ZQ-['pW-f'w-[1|5tQ1|-]R5t1}Q({$[R.W({Q$`eR)R$`Q$R`U(q$R-S;fQ-S;TR;f)OQ.l)iW3S.l3T6`8hU3T.m.n.oS6`3U3VR8h6a#m)`$g(R(V(r)h)p*X*Y*^-p-q-r.^.g.h.i.q.v/Y/Z/g0U0W2]2^2_2`2t3W3X3]3m4U4W6O6P6T6U6V6[6c6g6m6o6q8_8`8a8i8m9n9o9p:a:y<_<k<l<w<xQ.t)pU3[.t3^6dQ3^.vR6d3]Q)z$mR/S)zQ*T$qR/]*TQ3q/gR6p3qQ+S%jR0S+SQ4Y0ZS7O4Y8uR8u7PQ+_%qR0^+_Q4e0`R7Y4eQ0l+iS4x0l7lR7l4zQ/t*qW3z/t3|6v8qQ3|/wQ6v3{R8q6wQ*v%`R/z*vQ1O+{R5Y1OWnOUo#TQ&X!SQ*a%PQ+u&TQ+w&VQ+x&WQ+z&YQ0y+vS0|+{1OR5X0{Q%RlQ&]!WQ&`!YQ&b!ZQ&d![U'U!j4`4aQ*}%fQ+T%kQ+k&OQ,S&_Y,s&{'W'X'[7^Q/R)yS0o+l+oQ1W,RQ1X,UQ1Y,V[1p,u,v,y-O-Q9OQ4P/}Q4T0UQ4r0fQ4|0qQ5W0zY5g1o1r1u1w1xQ6z4RQ6{4UQ7X4dQ7g4sQ7m4{Y7|5h5l5n5p5qQ8r6xQ9U7hQ9Z7nW9b7}8R8T8VQ9v8sQ9x8vQ:S9VU:W9c9g9iQ:c9yQ:j:TS:k:X:]Q:q:dQ:v:lQ:z:rQ:}:wQ;O:{R;Q;PQ%YrQ&u!aQ'S!jU*l%Z%[%]Q,Z&hU,n&v&w&xS,r&{'YQ.x)tS/p*m*nQ1`,]S1l,o,pS1s,w,yQ3a.|Q3t/qQ5c1fQ5f1mS5k1t1xQ6h3eS8Q5m5qQ9f8SR:[9hS$hf<mR*U$rU$qf$r<mR/[*SQ$gfS(R#f*hQ(V#hS(r$S$TQ)h$iQ)p$lQ*X$wQ*Y$xQ*^$|Q-p;lQ-q;nQ-r;pQ.^)XQ.g)bQ.h)dQ.i)eQ.q)lQ.v)rQ/Y*QQ/Z*Rh/g*e-k0b2Y4o5z7c8Y9S9l:R:`Q0U+VQ0W+YQ2];vQ2^;xQ2_;zQ2`-uS2t;g;hQ3W.rQ3X.sQ3].uQ3m/bQ4U0VQ4W0YQ6O<OQ6P<QQ6T;mQ6U;oQ6V;qQ6[3PQ6c3ZQ6g3cQ6m3iQ6o3pQ6q3rQ8_;{Q8`;wQ8a;yQ8i6bQ8m6kQ9n<PQ9o<RQ9p8eQ:a<UQ:y<VQ<_<mQ<k<uQ<l<vQ<w<yR<x<zllOUo!S#T%P&T&V&W&Y+v+{0{1OQ!_PS#VW#_Q&_!XU&y!g4^7[Q']!sQ(`#lQ)P$^S+o%|&PQ+s&QQ,R&^Q,W&fQ,j&sQ-|(^Q.[)QQ/j*fQ0Q+QQ0v+rQ1j,lQ2W-lQ2z.VQ3k/`Q4m0cQ5O0sQ5P0tQ5R0uQ5T0wQ5[1QQ5y2ZQ6Y2wQ7e4pQ7r5SQ7t5UQ7u5VQ8[5}Q9T7fR9]7s#U`OPUWo!S!X!g#T#_#l%P%|&P&Q&T&V&W&Y&^&f&s(^*f+Q+r+v+{,l-l/`0c0s0t0u0w0{1O1Q2Z4^4p5S5U5V5}7[7f7sQ!yTQ#UVQ%TpS'`!w'cQ'f!zQ(Q#eQ(X#iQ(a#oQ(b#pQ(c#qQ(d#rQ(e#sQ(f#tQ(g#uQ(h#vQ(i#wQ(j#xQ(k#yQ(m#{Q(p$QQ(t$UW)O$^)Q.V2wQ*w%aS,^&j1aQ-Q'VS-T'a-VQ-Y'iQ-_'sQ-t(UQ-z(YQ.O;RQ.Q;UQ.a)]Q/c*_Q1[,XQ1_,[Q1o,tQ2O-`Q2b-xQ2g;XQ2h;YQ2i;ZQ2j;[Q2k;]Q2l;^Q2m;_Q2n;`Q2o;aQ2p;bQ2q;cQ2r;dQ2s.PQ2v;iQ2{;eQ3n/eQ3u/rQ5b;rQ5h1qQ5u2PQ6Q2cQ6R;sQ6W;uQ6X;|Q7P4ZQ7y5`Q7}5iQ8^;}Q8b<SQ8c<TQ9c8PQ9w8tQ:V9aQ:X9eQ:l:ZQ:w:nQ;T!sR<d<pR!{TR&l!^U!jQ&q,hS&h!^,`Y&{!h!n!o!p!qS'Y!k!m['[!r4_4g4h4i4jS,]&i&pS,w&|&}U,y'O'P'QY-O'R7T7U7V7aQ1f,fS1t,x,zU1w,{8x8yS1x,|,}S4`0`4eS5m1v1yS5p1z9zQ5q1{S8S5o5rQ8V5sR9h8UR(W#hR(Z#iQ!_QT,g&q,hQ#`YR&z;ST#[W$}S#ZW$}U%jwx+tU'p#W#Y#]S-]'q'rQ-d'vQ0R+RQ1}-^U2Q-b-c-eS5v2R2SR8W5w`!}T!w!z%g'a'j+O-Zt#XWwx#W#Y#]$}'q'r'v+R-^-b-c-e2R2S5wQ0x+tQ1],YQ5^1TQ7x5_T<[&j+PT#QT%gS#PT%gS'b!w'jS'g!z+OS,_&j+PT-U'a-ZT&o!^%hQ$[cR)V$aT(z$[({R2y.UT)k$i)mR)s$lQ/h*eQ2U-kQ4l0bQ5{2YQ7d4oQ8Z5zQ9Q7cQ9j8YQ:Q9SQ:_9lQ:i:RR:p:`lmOUo!S#T%P&T&V&W&Y+v+{0{1OQ%}!OR+k%zV%kwx+tR0[+[R+j%xQ%duR*|%eR*r%_T&R!P&UT&S!P&UT0}+{1O",nodeNames:"⚠ ArithOp ArithOp InterpolationStart LineComment BlockComment Script ExportDeclaration export Star as VariableName String from ; default FunctionDeclaration async function VariableDefinition > TypeParamList TypeDefinition extends ThisType this LiteralType ArithOp Number BooleanLiteral TemplateType InterpolationEnd Interpolation NullType null VoidType void TypeofType typeof MemberExpression . ?. PropertyName [ TemplateString Interpolation super RegExp ] ArrayExpression Spread , } { ObjectExpression Property async get set PropertyDefinition Block : NewExpression new TypeArgList CompareOp < ) ( ArgList UnaryExpression await yield delete LogicOp BitOp ParenthesizedExpression ClassExpression class ClassBody MethodDeclaration Decorator @ MemberExpression PrivatePropertyName CallExpression Privacy static abstract override PrivatePropertyDefinition PropertyDeclaration readonly accessor Optional TypeAnnotation Equals StaticBlock FunctionExpression ArrowFunction ParamList ParamList ArrayPattern ObjectPattern PatternProperty Privacy readonly Arrow MemberExpression BinaryExpression ArithOp ArithOp ArithOp ArithOp BitOp CompareOp instanceof satisfies in const CompareOp BitOp BitOp BitOp LogicOp LogicOp ConditionalExpression LogicOp LogicOp AssignmentExpression UpdateOp PostfixExpression CallExpression TaggedTemplateExpression DynamicImport import ImportMeta JSXElement JSXSelfCloseEndTag JSXStartTag JSXSelfClosingTag JSXIdentifier JSXBuiltin JSXIdentifier JSXNamespacedName JSXMemberExpression JSXSpreadAttribute JSXAttribute JSXAttributeValue JSXEscape JSXEndTag JSXOpenTag JSXFragmentTag JSXText JSXEscape JSXStartCloseTag JSXCloseTag PrefixCast ArrowFunction TypeParamList SequenceExpression KeyofType keyof UniqueType unique ImportType InferredType infer TypeName ParenthesizedType FunctionSignature ParamList NewSignature IndexedType TupleType Label ArrayType ReadonlyType ObjectType MethodType PropertyType IndexSignature PropertyDefinition CallSignature TypePredicate is NewSignature new UnionType LogicOp IntersectionType LogicOp ConditionalType ParameterizedType ClassDeclaration abstract implements type VariableDeclaration let var TypeAliasDeclaration InterfaceDeclaration interface EnumDeclaration enum EnumBody NamespaceDeclaration namespace module AmbientDeclaration declare GlobalDeclaration global ClassDeclaration ClassBody MethodDeclaration AmbientFunctionDeclaration ExportGroup VariableName VariableName ImportDeclaration ImportGroup ForStatement for ForSpec ForInSpec ForOfSpec of WhileStatement while WithStatement with DoStatement do IfStatement if else SwitchStatement switch SwitchBody CaseLabel case DefaultLabel TryStatement try CatchClause catch FinallyClause finally ReturnStatement return ThrowStatement throw BreakStatement break ContinueStatement continue DebuggerStatement debugger LabeledStatement ExpressionStatement SingleExpression SingleClassItem",maxTerm:346,context:a,nodeProps:[["closedBy",3,"InterpolationEnd",43,"]",53,"}",68,")",139,"JSXSelfCloseEndTag JSXEndTag",155,"JSXEndTag"],["group",-26,7,14,16,60,194,198,201,202,204,207,210,221,223,229,231,233,235,238,244,250,252,254,256,258,260,261,"Statement",-30,11,12,25,28,29,34,44,46,47,49,54,62,70,76,77,98,99,108,109,126,129,131,132,133,134,136,137,157,158,160,"Expression",-23,24,26,30,33,35,37,161,163,165,166,168,169,170,172,173,174,176,177,178,188,190,192,193,"Type",-3,80,91,97,"ClassItem"],["openedBy",31,"InterpolationStart",48,"[",52,"{",67,"(",138,"JSXStartTag",150,"JSXStartTag JSXStartCloseTag"]],propSources:[f],skippedNodes:[0,4,5],repeatNodeCount:29,tokenData:"#2k~R!bOX%ZXY%uYZ'kZ[%u[]%Z]^'k^p%Zpq%uqr(Rrs)mst7]tu9guv<avw=bwx>lxyJcyzJyz{Ka{|Lm|}MW}!OLm!O!PMn!P!Q!$v!Q!R!Er!R![!G_![!]!Nc!]!^!N{!^!_# c!_!`#!`!`!a##d!a!b#%s!b!c#'h!c!}9g!}#O#(O#O#P%Z#P#Q#(f#Q#R#(|#R#S9g#S#T#)g#T#o#)}#o#p#,w#p#q#,|#q#r#-j#r#s#.S#s$f%Z$f$g%u$g#BY9g#BY#BZ#.j#BZ$IS9g$IS$I_#.j$I_$I|9g$I|$I}#1X$I}$JO#1X$JO$JT9g$JT$JU#.j$JU$KV9g$KV$KW#.j$KW&FU9g&FU&FV#.j&FV;'S9g;'S;=`<Z<%l?HT9g?HT?HU#.j?HUO9g`%`T$_`O!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z`%rP;=`<%l%Z7Z%|i$_`'g6yOX%ZXY%uYZ%ZZ[%u[p%Zpq%uq!^%Z!_#o%Z#p$f%Z$f$g%u$g#BY%Z#BY#BZ%u#BZ$IS%Z$IS$I_%u$I_$JT%Z$JT$JU%u$JU$KV%Z$KV$KW%u$KW&FU%Z&FU&FV%u&FV;'S%Z;'S;=`%o<%l?HT%Z?HT?HU%u?HUO%Z7Z'rT$_`'h6yO!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z,m(YU$_`!l,]O!^%Z!_!`(l!`#o%Z#p;'S%Z;'S;=`%o<%lO%Z,j(sU#l,Y$_`O!^%Z!_!`)V!`#o%Z#p;'S%Z;'S;=`%o<%lO%Z,j)^T#l,Y$_`O!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z*m)t]$_`[*TOY)mYZ*mZr)mrs,js!^)m!^!_-S!_#O)m#O#P1q#P#o)m#o#p-S#p;'S)m;'S;=`7V<%lO)mh*rX$_`Or*mrs+_s!^*m!^!_+u!_#o*m#o#p+u#p;'S*m;'S;=`,d<%lO*mh+fT$YW$_`O!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%ZW+xTOr+urs,Xs;'S+u;'S;=`,^<%lO+uW,^O$YWW,aP;=`<%l+uh,gP;=`<%l*m*m,sT$YW$_`[*TO!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z*]-XX[*TOY-SYZ+uZr-Srs-ts#O-S#O#P-{#P;'S-S;'S;=`1k<%lO-S*]-{O$YW[*T*].OUOr-Srs.bs;'S-S;'S;=`0y;=`<%l/R<%lO-S*].iW$YW[*TOY/RZr/Rrs/ps#O/R#O#P/u#P;'S/R;'S;=`0s<%lO/R*T/WW[*TOY/RZr/Rrs/ps#O/R#O#P/u#P;'S/R;'S;=`0s<%lO/R*T/uO[*T*T/xRO;'S/R;'S;=`0R;=`O/R*T0WX[*TOY/RZr/Rrs/ps#O/R#O#P/u#P;'S/R;'S;=`0s;=`<%l/R<%lO/R*T0vP;=`<%l/R*]1OX[*TOY/RZr/Rrs/ps#O/R#O#P/u#P;'S/R;'S;=`0s;=`<%l-S<%lO/R*]1nP;=`<%l-S*m1vY$_`Or)mrs2fs!^)m!^!_-S!_#o)m#o#p-S#p;'S)m;'S;=`6e;=`<%l/R<%lO)m*m2o]$YW$_`[*TOY3hYZ%ZZr3hrs4hs!^3h!^!_/R!_#O3h#O#P5O#P#o3h#o#p/R#p;'S3h;'S;=`6_<%lO3h*e3o]$_`[*TOY3hYZ%ZZr3hrs4hs!^3h!^!_/R!_#O3h#O#P5O#P#o3h#o#p/R#p;'S3h;'S;=`6_<%lO3h*e4oT$_`[*TO!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z*e5TW$_`O!^3h!^!_/R!_#o3h#o#p/R#p;'S3h;'S;=`5m;=`<%l/R<%lO3h*e5rX[*TOY/RZr/Rrs/ps#O/R#O#P/u#P;'S/R;'S;=`0s;=`<%l3h<%lO/R*e6bP;=`<%l3h*m6jX[*TOY/RZr/Rrs/ps#O/R#O#P/u#P;'S/R;'S;=`0s;=`<%l)m<%lO/R*m7YP;=`<%l)m&}7b]$_`Ot%Ztu8Zu!^%Z!_!c%Z!c!}8Z!}#R%Z#R#S8Z#S#T%Z#T#o8Z#p$g%Z$g;'S8Z;'S;=`9a<%lO8Z&}8b_$_`'}&mOt%Ztu8Zu!Q%Z!Q![8Z![!^%Z!_!c%Z!c!}8Z!}#R%Z#R#S8Z#S#T%Z#T#o8Z#p$g%Z$g;'S8Z;'S;=`9a<%lO8Z&}9dP;=`<%l8Z7Z9ra$_`'s&l'j1T$RWOt%Ztu9gu}%Z}!O:w!O!Q%Z!Q![9g![!^%Z!_!c%Z!c!}9g!}#R%Z#R#S9g#S#T%Z#T#o9g#p$g%Z$g;'S9g;'S;=`<Z<%lO9gh;Oa$_`$RWOt%Ztu:wu}%Z}!O:w!O!Q%Z!Q![:w![!^%Z!_!c%Z!c!}:w!}#R%Z#R#S:w#S#T%Z#T#o:w#p$g%Z$g;'S:w;'S;=`<T<%lO:wh<WP;=`<%l:w7Z<^P;=`<%l9g,j<hU$_`#d,YO!^%Z!_!`<z!`#o%Z#p;'S%Z;'S;=`%o<%lO%Z,j=RT$_`#v,YO!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z.n=iW(W.^$_`Ov%Zvw>Rw!^%Z!_!`<z!`#o%Z#p;'S%Z;'S;=`%o<%lO%Z,j>YU$_`#p,YO!^%Z!_!`<z!`#o%Z#p;'S%Z;'S;=`%o<%lO%Z*m>s]$_`[*TOY>lYZ?lZw>lwx,jx!^>l!^!_@|!_#O>l#O#PE_#P#o>l#o#p@|#p;'S>l;'S;=`J]<%lO>lh?qX$_`Ow?lwx+_x!^?l!^!_@^!_#o?l#o#p@^#p;'S?l;'S;=`@v<%lO?lW@aTOw@^wx,Xx;'S@^;'S;=`@p<%lO@^W@sP;=`<%l@^h@yP;=`<%l?l*]ARX[*TOY@|YZ@^Zw@|wx-tx#O@|#O#PAn#P;'S@|;'S;=`EX<%lO@|*]AqUOw@|wxBTx;'S@|;'S;=`Dg;=`<%lBt<%lO@|*]B[W$YW[*TOYBtZwBtwx/px#OBt#O#PCc#P;'SBt;'S;=`Da<%lOBt*TByW[*TOYBtZwBtwx/px#OBt#O#PCc#P;'SBt;'S;=`Da<%lOBt*TCfRO;'SBt;'S;=`Co;=`OBt*TCtX[*TOYBtZwBtwx/px#OBt#O#PCc#P;'SBt;'S;=`Da;=`<%lBt<%lOBt*TDdP;=`<%lBt*]DlX[*TOYBtZwBtwx/px#OBt#O#PCc#P;'SBt;'S;=`Da;=`<%l@|<%lOBt*]E[P;=`<%l@|*mEdY$_`Ow>lwxFSx!^>l!^!_@|!_#o>l#o#p@|#p;'S>l;'S;=`Ik;=`<%lBt<%lO>l*mF]]$YW$_`[*TOYGUYZ%ZZwGUwx4hx!^GU!^!_Bt!_#OGU#O#PHU#P#oGU#o#pBt#p;'SGU;'S;=`Ie<%lOGU*eG]]$_`[*TOYGUYZ%ZZwGUwx4hx!^GU!^!_Bt!_#OGU#O#PHU#P#oGU#o#pBt#p;'SGU;'S;=`Ie<%lOGU*eHZW$_`O!^GU!^!_Bt!_#oGU#o#pBt#p;'SGU;'S;=`Hs;=`<%lBt<%lOGU*eHxX[*TOYBtZwBtwx/px#OBt#O#PCc#P;'SBt;'S;=`Da;=`<%lGU<%lOBt*eIhP;=`<%lGU*mIpX[*TOYBtZwBtwx/px#OBt#O#PCc#P;'SBt;'S;=`Da;=`<%l>l<%lOBt*mJ`P;=`<%l>l5oJjT!f5_$_`O!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z$ZKQT!e#y$_`O!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z2yKjW$_`'k'_#e,YOz%Zz{LS{!^%Z!_!`<z!`#o%Z#p;'S%Z;'S;=`%o<%lO%Z,jLZU$_`#b,YO!^%Z!_!`<z!`#o%Z#p;'S%Z;'S;=`%o<%lO%Z0TLtU$_`k/sO!^%Z!_!`<z!`#o%Z#p;'S%Z;'S;=`%o<%lO%Z1gM_T!T1V$_`O!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z7ZMuX$_`x4QO!O%Z!O!PNb!P!Q%Z!Q![! d![!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z$XNgV$_`O!O%Z!O!PN|!P!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z$X! TT!S#w$_`O!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z*e! k]$_`l*TO!Q%Z!Q![! d![!^%Z!_!g%Z!g!h!!d!h#R%Z#R#S! d#S#X%Z#X#Y!!d#Y#o%Z#p;'S%Z;'S;=`%o<%lO%Z*e!!i]$_`O{%Z{|!#b|}%Z}!O!#b!O!Q%Z!Q![!$S![!^%Z!_#R%Z#R#S!$S#S#o%Z#p;'S%Z;'S;=`%o<%lO%Z*e!#gX$_`O!Q%Z!Q![!$S![!^%Z!_#R%Z#R#S!$S#S#o%Z#p;'S%Z;'S;=`%o<%lO%Z*e!$ZX$_`l*TO!Q%Z!Q![!$S![!^%Z!_#R%Z#R#S!$S#S#o%Z#p;'S%Z;'S;=`%o<%lO%Z7Z!$}b$_`#c,YOY!&VYZ%ZZz!&Vz{!-n{!P!&V!P!Q!BV!Q!^!&V!^!_!(f!_!`!Ch!`!a!Dm!a!}!&V!}#O!+T#O#P!,v#P#o!&V#o#p!(f#p;'S!&V;'S;=`!-h<%lO!&Va!&^^$_`!PPOY!&VYZ%ZZ!P!&V!P!Q!'Y!Q!^!&V!^!_!(f!_!}!&V!}#O!+T#O#P!,v#P#o!&V#o#p!(f#p;'S!&V;'S;=`!-h<%lO!&Va!'aa$_`!PPO!^%Z!_#Z%Z#Z#[!'Y#[#]%Z#]#^!'Y#^#a%Z#a#b!'Y#b#g%Z#g#h!'Y#h#i%Z#i#j!'Y#j#m%Z#m#n!'Y#n#o%Z#p;'S%Z;'S;=`%o<%lO%ZP!(kX!PPOY!(fZ!P!(f!P!Q!)W!Q!}!(f!}#O!)o#O#P!*n#P;'S!(f;'S;=`!*}<%lO!(fP!)]U!PP#Z#[!)W#]#^!)W#a#b!)W#g#h!)W#i#j!)W#m#n!)WP!)rVOY!)oZ#O!)o#O#P!*X#P#Q!(f#Q;'S!)o;'S;=`!*h<%lO!)oP!*[SOY!)oZ;'S!)o;'S;=`!*h<%lO!)oP!*kP;=`<%l!)oP!*qSOY!(fZ;'S!(f;'S;=`!*}<%lO!(fP!+QP;=`<%l!(fa!+Y[$_`OY!+TYZ%ZZ!^!+T!^!_!)o!_#O!+T#O#P!,O#P#Q!&V#Q#o!+T#o#p!)o#p;'S!+T;'S;=`!,p<%lO!+Ta!,TX$_`OY!+TYZ%ZZ!^!+T!^!_!)o!_#o!+T#o#p!)o#p;'S!+T;'S;=`!,p<%lO!+Ta!,sP;=`<%l!+Ta!,{X$_`OY!&VYZ%ZZ!^!&V!^!_!(f!_#o!&V#o#p!(f#p;'S!&V;'S;=`!-h<%lO!&Va!-kP;=`<%l!&V7Z!-u`$_`!PPOY!-nYZ!.wZz!-nz{!2U{!P!-n!P!Q!@m!Q!^!-n!^!_!4m!_!}!-n!}#O!;l#O#P!?o#P#o!-n#o#p!4m#p;'S!-n;'S;=`!@g<%lO!-n7Z!.|X$_`Oz!.wz{!/i{!^!.w!^!_!0w!_#o!.w#o#p!0w#p;'S!.w;'S;=`!2O<%lO!.w7Z!/nZ$_`Oz!.wz{!/i{!P!.w!P!Q!0a!Q!^!.w!^!_!0w!_#o!.w#o#p!0w#p;'S!.w;'S;=`!2O<%lO!.w7Z!0hT$_`T6yO!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z6y!0zTOz!0wz{!1Z{;'S!0w;'S;=`!1x<%lO!0w6y!1^VOz!0wz{!1Z{!P!0w!P!Q!1s!Q;'S!0w;'S;=`!1x<%lO!0w6y!1xOT6y6y!1{P;=`<%l!0w7Z!2RP;=`<%l!.w7Z!2]`$_`!PPOY!-nYZ!.wZz!-nz{!2U{!P!-n!P!Q!3_!Q!^!-n!^!_!4m!_!}!-n!}#O!;l#O#P!?o#P#o!-n#o#p!4m#p;'S!-n;'S;=`!@g<%lO!-n7Z!3ha$_`T6y!PPO!^%Z!_#Z%Z#Z#[!'Y#[#]%Z#]#^!'Y#^#a%Z#a#b!'Y#b#g%Z#g#h!'Y#h#i%Z#i#j!'Y#j#m%Z#m#n!'Y#n#o%Z#p;'S%Z;'S;=`%o<%lO%Z6y!4r[!PPOY!4mYZ!0wZz!4mz{!5h{!P!4m!P!Q!:b!Q!}!4m!}#O!6|#O#P!9r#P;'S!4m;'S;=`!:[<%lO!4m6y!5m[!PPOY!4mYZ!0wZz!4mz{!5h{!P!4m!P!Q!6c!Q!}!4m!}#O!6|#O#P!9r#P;'S!4m;'S;=`!:[<%lO!4m6y!6jUT6y!PP#Z#[!)W#]#^!)W#a#b!)W#g#h!)W#i#j!)W#m#n!)W6y!7PYOY!6|YZ!0wZz!6|z{!7o{#O!6|#O#P!9S#P#Q!4m#Q;'S!6|;'S;=`!9l<%lO!6|6y!7r[OY!6|YZ!0wZz!6|z{!7o{!P!6|!P!Q!8h!Q#O!6|#O#P!9S#P#Q!4m#Q;'S!6|;'S;=`!9l<%lO!6|6y!8mVT6yOY!)oZ#O!)o#O#P!*X#P#Q!(f#Q;'S!)o;'S;=`!*h<%lO!)o6y!9VVOY!6|YZ!0wZz!6|z{!7o{;'S!6|;'S;=`!9l<%lO!6|6y!9oP;=`<%l!6|6y!9uVOY!4mYZ!0wZz!4mz{!5h{;'S!4m;'S;=`!:[<%lO!4m6y!:_P;=`<%l!4m6y!:ga!PPOz!0wz{!1Z{#Z!0w#Z#[!:b#[#]!0w#]#^!:b#^#a!0w#a#b!:b#b#g!0w#g#h!:b#h#i!0w#i#j!:b#j#m!0w#m#n!:b#n;'S!0w;'S;=`!1x<%lO!0w7Z!;q^$_`OY!;lYZ!.wZz!;lz{!<m{!^!;l!^!_!6|!_#O!;l#O#P!>q#P#Q!-n#Q#o!;l#o#p!6|#p;'S!;l;'S;=`!?i<%lO!;l7Z!<r`$_`OY!;lYZ!.wZz!;lz{!<m{!P!;l!P!Q!=t!Q!^!;l!^!_!6|!_#O!;l#O#P!>q#P#Q!-n#Q#o!;l#o#p!6|#p;'S!;l;'S;=`!?i<%lO!;l7Z!={[$_`T6yOY!+TYZ%ZZ!^!+T!^!_!)o!_#O!+T#O#P!,O#P#Q!&V#Q#o!+T#o#p!)o#p;'S!+T;'S;=`!,p<%lO!+T7Z!>vZ$_`OY!;lYZ!.wZz!;lz{!<m{!^!;l!^!_!6|!_#o!;l#o#p!6|#p;'S!;l;'S;=`!?i<%lO!;l7Z!?lP;=`<%l!;l7Z!?tZ$_`OY!-nYZ!.wZz!-nz{!2U{!^!-n!^!_!4m!_#o!-n#o#p!4m#p;'S!-n;'S;=`!@g<%lO!-n7Z!@jP;=`<%l!-n7Z!@te$_`!PPOz!.wz{!/i{!^!.w!^!_!0w!_#Z!.w#Z#[!@m#[#]!.w#]#^!@m#^#a!.w#a#b!@m#b#g!.w#g#h!@m#h#i!.w#i#j!@m#j#m!.w#m#n!@m#n#o!.w#o#p!0w#p;'S!.w;'S;=`!2O<%lO!.w7Z!B^X$_`S6yOY!BVYZ%ZZ!^!BV!^!_!By!_#o!BV#o#p!By#p;'S!BV;'S;=`!Cb<%lO!BV6y!COSS6yOY!ByZ;'S!By;'S;=`!C[<%lO!By6y!C_P;=`<%l!By7Z!CeP;=`<%l!BV,k!Cq^$_`#v,Y!PPOY!&VYZ%ZZ!P!&V!P!Q!'Y!Q!^!&V!^!_!(f!_!}!&V!}#O!+T#O#P!,v#P#o!&V#o#p!(f#p;'S!&V;'S;=`!-h<%lO!&Vi!Dv^$OW$_`!PPOY!&VYZ%ZZ!P!&V!P!Q!'Y!Q!^!&V!^!_!(f!_!}!&V!}#O!+T#O#P!,v#P#o!&V#o#p!(f#p;'S!&V;'S;=`!-h<%lO!&V*e!Eyf$_`l*TO!O%Z!O!P! d!P!Q%Z!Q![!G_![!^%Z!_!g%Z!g!h!!d!h#R%Z#R#S!G_#S#U%Z#U#V!IR#V#X%Z#X#Y!!d#Y#b%Z#b#c!Hk#c#d!Js#d#l%Z#l#m!L_#m#o%Z#p;'S%Z;'S;=`%o<%lO%Z*e!Gfa$_`l*TO!O%Z!O!P! d!P!Q%Z!Q![!G_![!^%Z!_!g%Z!g!h!!d!h#R%Z#R#S!G_#S#X%Z#X#Y!!d#Y#b%Z#b#c!Hk#c#o%Z#p;'S%Z;'S;=`%o<%lO%Z*e!HrT$_`l*TO!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z*e!IWY$_`O!Q%Z!Q!R!Iv!R!S!Iv!S!^%Z!_#R%Z#R#S!Iv#S#o%Z#p;'S%Z;'S;=`%o<%lO%Z*e!I}[$_`l*TO!Q%Z!Q!R!Iv!R!S!Iv!S!^%Z!_#R%Z#R#S!Iv#S#b%Z#b#c!Hk#c#o%Z#p;'S%Z;'S;=`%o<%lO%Z*e!JxX$_`O!Q%Z!Q!Y!Ke!Y!^%Z!_#R%Z#R#S!Ke#S#o%Z#p;'S%Z;'S;=`%o<%lO%Z*e!KlZ$_`l*TO!Q%Z!Q!Y!Ke!Y!^%Z!_#R%Z#R#S!Ke#S#b%Z#b#c!Hk#c#o%Z#p;'S%Z;'S;=`%o<%lO%Z*e!Ld]$_`O!Q%Z!Q![!M]![!^%Z!_!c%Z!c!i!M]!i#R%Z#R#S!M]#S#T%Z#T#Z!M]#Z#o%Z#p;'S%Z;'S;=`%o<%lO%Z*e!Md_$_`l*TO!Q%Z!Q![!M]![!^%Z!_!c%Z!c!i!M]!i#R%Z#R#S!M]#S#T%Z#T#Z!M]#Z#b%Z#b#c!Hk#c#o%Z#p;'S%Z;'S;=`%o<%lO%Z.y!NlT!__$_`#t.YO!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Zg# ST^V$_`O!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z7Z# nR'n$h!c3W$Pi([P!P!Q# w!^!_# |!_!`#!Z`# |O$a`,Y#!RP#f,Y!_!`#!U,Y#!ZO#v,Y,Y#!`O#g,Y.y#!gV#S.i$_`O!^%Z!_!`(l!`!a#!|!a#o%Z#p;'S%Z;'S;=`%o<%lO%Z,k##TT#_,Z$_`O!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z.y##oVd#T#g,Y$[Y$_`O!^%Z!_!`#$U!`!a#$l!a#o%Z#p;'S%Z;'S;=`%o<%lO%Z,j#$]T#g,Y$_`O!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z,j#$sV#f,Y$_`O!^%Z!_!`<z!`!a#%Y!a#o%Z#p;'S%Z;'S;=`%o<%lO%Z,j#%aU#f,Y$_`O!^%Z!_!`<z!`#o%Z#p;'S%Z;'S;=`%o<%lO%Z2y#%zX(O,]$_`O!O%Z!O!P#&g!P!^%Z!_!a%Z!a!b#&}!b#o%Z#p;'S%Z;'S;=`%o<%lO%Z2w#&nTy2g$_`O!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z,j#'UU$_`#q,YO!^%Z!_!`<z!`#o%Z#p;'S%Z;'S;=`%o<%lO%Z'R#'oT!t&q$_`O!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z7R#(VT{6q$_`O!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z$Z#(mT!Q#y$_`O!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z,j#)TU#n,Y$_`O!^%Z!_!`<z!`#o%Z#p;'S%Z;'S;=`%o<%lO%Z0R#)nT$_`'r/qO!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z7Z#*Ya$_`'s&l'j1T$TWOt%Ztu#)}u}%Z}!O#+_!O!Q%Z!Q![#)}![!^%Z!_!c%Z!c!}#)}!}#R%Z#R#S#)}#S#T%Z#T#o#)}#p$g%Z$g;'S#)};'S;=`#,q<%lO#)}h#+fa$_`$TWOt%Ztu#+_u}%Z}!O#+_!O!Q%Z!Q![#+_![!^%Z!_!c%Z!c!}#+_!}#R%Z#R#S#+_#S#T%Z#T#o#+_#p$g%Z$g;'S#+_;'S;=`#,k<%lO#+_h#,nP;=`<%l#+_7Z#,tP;=`<%l#)}~#,|O!V~.n#-TV(V.^$_`O!^%Z!_!`<z!`#o%Z#p#q#&}#q;'S%Z;'S;=`%o<%lO%Z,m#-sT!U,XoS$_`O!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Za#.ZT!mP$_`O!^%Z!_#o%Z#p;'S%Z;'S;=`%o<%lO%Z7Z#.wt$_`'g6y's&l'j1T$RWOX%ZXY%uYZ%ZZ[%u[p%Zpq%uqt%Ztu9gu}%Z}!O:w!O!Q%Z!Q![9g![!^%Z!_!c%Z!c!}9g!}#R%Z#R#S9g#S#T%Z#T#o9g#p$f%Z$f$g%u$g#BY9g#BY#BZ#.j#BZ$IS9g$IS$I_#.j$I_$JT9g$JT$JU#.j$JU$KV9g$KV$KW#.j$KW&FU9g&FU&FV#.j&FV;'S9g;'S;=`<Z<%l?HT9g?HT?HU#.j?HUO9g7Z#1fa$_`'h6y's&l'j1T$RWOt%Ztu9gu}%Z}!O:w!O!Q%Z!Q![9g![!^%Z!_!c%Z!c!}9g!}#R%Z#R#S9g#S#T%Z#T#o9g#p$g%Z$g;'S9g;'S;=`<Z<%lO9g",tokenizers:[h,c,u,0,1,2,3,4,5,6,7,8,9,l],topRules:{Script:[0,6],SingleExpression:[1,262],SingleClassItem:[2,263]},dialects:{jsx:12734,ts:12736},dynamicPrecedences:{158:1,186:1},specialized:[{term:302,get:t=>d[t]||-1},{term:311,get:t=>p[t]||-1},{term:65,get:t=>m[t]||-1}],tokenPrec:12759})
e.parser=g},90:(t,e,i)=>{"use strict"
Object.defineProperty(e,"__esModule",{value:!0})
var n,s=i(897)
class r{constructor(t,e,i,n,s,r,o,a,l,h=0,c){this.p=t,this.stack=e,this.state=i,this.reducePos=n,this.pos=s,this.score=r,this.buffer=o,this.bufferBase=a,this.curContext=l,this.lookAhead=h,this.parent=c}toString(){return`[${this.stack.filter(((t,e)=>e%3==0)).concat(this.state)}]@${this.pos}${this.score?"!"+this.score:""}`}static start(t,e,i=0){let n=t.parser.context
return new r(t,[],e,i,i,0,[],0,n?new o(n,n.start):null,0,null)}get context(){return this.curContext?this.curContext.context:null}pushState(t,e){this.stack.push(this.state,e,this.bufferBase+this.buffer.length),this.state=t}reduce(t){let e=t>>19,i=65535&t,{parser:n}=this.p,s=n.dynamicPrecedence(i)
if(s&&(this.score+=s),0==e)return this.pushState(n.getGoto(this.state,i,!0),this.reducePos),i<n.minRepeatTerm&&this.storeNode(i,this.reducePos,this.reducePos,4,!0),void this.reduceContext(i,this.reducePos)
let r=this.stack.length-3*(e-1)-(262144&t?6:0),o=this.stack[r-2],a=this.stack[r-1],l=this.bufferBase+this.buffer.length-a
if(i<n.minRepeatTerm||131072&t){let t=n.stateFlag(this.state,1)?this.pos:this.reducePos
this.storeNode(i,o,t,l+4,!0)}if(262144&t)this.state=this.stack[r]
else{let t=this.stack[r-3]
this.state=n.getGoto(t,i,!0)}for(;this.stack.length>r;)this.stack.pop()
this.reduceContext(i,o)}storeNode(t,e,i,n=4,s=!1){if(0==t&&(!this.stack.length||this.stack[this.stack.length-1]<this.buffer.length+this.bufferBase)){let t=this,n=this.buffer.length
if(0==n&&t.parent&&(n=t.bufferBase-t.parent.bufferBase,t=t.parent),n>0&&0==t.buffer[n-4]&&t.buffer[n-1]>-1){if(e==i)return
if(t.buffer[n-2]>=e)return void(t.buffer[n-2]=i)}}if(s&&this.pos!=i){let s=this.buffer.length
if(s>0&&0!=this.buffer[s-4])for(;s>0&&this.buffer[s-2]>i;)this.buffer[s]=this.buffer[s-4],this.buffer[s+1]=this.buffer[s-3],this.buffer[s+2]=this.buffer[s-2],this.buffer[s+3]=this.buffer[s-1],s-=4,n>4&&(n-=4)
this.buffer[s]=t,this.buffer[s+1]=e,this.buffer[s+2]=i,this.buffer[s+3]=n}else this.buffer.push(t,e,i,n)}shift(t,e,i){let n=this.pos
if(131072&t)this.pushState(65535&t,this.pos)
else if(0==(262144&t)){let s=t,{parser:r}=this.p;(i>this.pos||e<=r.maxNode)&&(this.pos=i,r.stateFlag(s,1)||(this.reducePos=i)),this.pushState(s,n),this.shiftContext(e,n),e<=r.maxNode&&this.buffer.push(e,n,i,4)}else this.pos=i,this.shiftContext(e,n),e<=this.p.parser.maxNode&&this.buffer.push(e,n,i,4)}apply(t,e,i){65536&t?this.reduce(t):this.shift(t,e,i)}useNode(t,e){let i=this.p.reused.length-1;(i<0||this.p.reused[i]!=t)&&(this.p.reused.push(t),i++)
let n=this.pos
this.reducePos=this.pos=n+t.length,this.pushState(e,n),this.buffer.push(i,n,this.reducePos,-1),this.curContext&&this.updateContext(this.curContext.tracker.reuse(this.curContext.context,t,this,this.p.stream.reset(this.pos-t.length)))}split(){let t=this,e=t.buffer.length
for(;e>0&&t.buffer[e-2]>t.reducePos;)e-=4
let i=t.buffer.slice(e),n=t.bufferBase+e
for(;t&&n==t.bufferBase;)t=t.parent
return new r(this.p,this.stack.slice(),this.state,this.reducePos,this.pos,this.score,i,n,this.curContext,this.lookAhead,t)}recoverByDelete(t,e){let i=t<=this.p.parser.maxNode
i&&this.storeNode(t,this.pos,e,4),this.storeNode(0,this.pos,e,i?8:4),this.pos=this.reducePos=e,this.score-=190}canShift(t){for(let e=new a(this);;){let i=this.p.parser.stateSlot(e.state,4)||this.p.parser.hasAction(e.state,t)
if(0==i)return!1
if(0==(65536&i))return!0
e.reduce(i)}}recoverByInsert(t){if(this.stack.length>=300)return[]
let e=this.p.parser.nextStates(this.state)
if(e.length>8||this.stack.length>=120){let i=[]
for(let n,s=0;s<e.length;s+=2)(n=e[s+1])!=this.state&&this.p.parser.hasAction(n,t)&&i.push(e[s],n)
if(this.stack.length<120)for(let t=0;i.length<8&&t<e.length;t+=2){let n=e[t+1]
i.some(((t,e)=>1&e&&t==n))||i.push(e[t],n)}e=i}let i=[]
for(let n=0;n<e.length&&i.length<4;n+=2){let t=e[n+1]
if(t==this.state)continue
let s=this.split()
s.pushState(t,this.pos),s.storeNode(0,s.pos,s.pos,4,!0),s.shiftContext(e[n],this.pos),s.score-=200,i.push(s)}return i}forceReduce(){let t=this.p.parser.stateSlot(this.state,5)
if(0==(65536&t))return!1
let{parser:e}=this.p
if(!e.validAction(this.state,t)){let i=t>>19,n=65535&t,s=this.stack.length-3*i
if(s<0||e.getGoto(this.stack[s],n,!1)<0)return!1
this.storeNode(0,this.reducePos,this.reducePos,4,!0),this.score-=100}return this.reducePos=this.pos,this.reduce(t),!0}forceAll(){for(;!this.p.parser.stateFlag(this.state,2);)if(!this.forceReduce()){this.storeNode(0,this.pos,this.pos,4,!0)
break}return this}get deadEnd(){if(3!=this.stack.length)return!1
let{parser:t}=this.p
return 65535==t.data[t.stateSlot(this.state,1)]&&!t.stateSlot(this.state,4)}restart(){this.state=this.stack[0],this.stack.length=0}sameState(t){if(this.state!=t.state||this.stack.length!=t.stack.length)return!1
for(let e=0;e<this.stack.length;e+=3)if(this.stack[e]!=t.stack[e])return!1
return!0}get parser(){return this.p.parser}dialectEnabled(t){return this.p.parser.dialect.flags[t]}shiftContext(t,e){this.curContext&&this.updateContext(this.curContext.tracker.shift(this.curContext.context,t,this,this.p.stream.reset(e)))}reduceContext(t,e){this.curContext&&this.updateContext(this.curContext.tracker.reduce(this.curContext.context,t,this,this.p.stream.reset(e)))}emitContext(){let t=this.buffer.length-1;(t<0||-3!=this.buffer[t])&&this.buffer.push(this.curContext.hash,this.reducePos,this.reducePos,-3)}emitLookAhead(){let t=this.buffer.length-1;(t<0||-4!=this.buffer[t])&&this.buffer.push(this.lookAhead,this.reducePos,this.reducePos,-4)}updateContext(t){if(t!=this.curContext.context){let e=new o(this.curContext.tracker,t)
e.hash!=this.curContext.hash&&this.emitContext(),this.curContext=e}}setLookAhead(t){t>this.lookAhead&&(this.emitLookAhead(),this.lookAhead=t)}close(){this.curContext&&this.curContext.tracker.strict&&this.emitContext(),this.lookAhead>0&&this.emitLookAhead()}}class o{constructor(t,e){this.tracker=t,this.context=e,this.hash=t.strict?t.hash(e):0}}!function(t){t[t.Insert=200]="Insert",t[t.Delete=190]="Delete",t[t.Reduce=100]="Reduce",t[t.MaxNext=4]="MaxNext",t[t.MaxInsertStackDepth=300]="MaxInsertStackDepth",t[t.DampenInsertStackDepth=120]="DampenInsertStackDepth"}(n||(n={}))
class a{constructor(t){this.start=t,this.state=t.state,this.stack=t.stack,this.base=this.stack.length}reduce(t){let e=65535&t,i=t>>19
0==i?(this.stack==this.start.stack&&(this.stack=this.stack.slice()),this.stack.push(this.state,0,0),this.base+=3):this.base-=3*(i-1)
let n=this.start.p.parser.getGoto(this.stack[this.base-3],e,!0)
this.state=n}}class l{constructor(t,e,i){this.stack=t,this.pos=e,this.index=i,this.buffer=t.buffer,0==this.index&&this.maybeNext()}static create(t,e=t.bufferBase+t.buffer.length){return new l(t,e,e-t.bufferBase)}maybeNext(){let t=this.stack.parent
null!=t&&(this.index=this.stack.bufferBase-t.bufferBase,this.stack=t,this.buffer=t.buffer)}get id(){return this.buffer[this.index-4]}get start(){return this.buffer[this.index-3]}get end(){return this.buffer[this.index-2]}get size(){return this.buffer[this.index-1]}next(){this.index-=4,this.pos-=4,0==this.index&&this.maybeNext()}fork(){return new l(this.stack,this.pos,this.index)}}class h{constructor(){this.start=-1,this.value=-1,this.end=-1,this.extended=-1,this.lookAhead=0,this.mask=0,this.context=0}}const c=new h
class u{constructor(t,e){this.input=t,this.ranges=e,this.chunk="",this.chunkOff=0,this.chunk2="",this.chunk2Pos=0,this.next=-1,this.token=c,this.rangeIndex=0,this.pos=this.chunkPos=e[0].from,this.range=e[0],this.end=e[e.length-1].to,this.readNext()}resolveOffset(t,e){let i=this.range,n=this.rangeIndex,s=this.pos+t
for(;s<i.from;){if(!n)return null
let t=this.ranges[--n]
s-=i.from-t.to,i=t}for(;e<0?s>i.to:s>=i.to;){if(n==this.ranges.length-1)return null
let t=this.ranges[++n]
s+=t.from-i.to,i=t}return s}clipPos(t){if(t>=this.range.from&&t<this.range.to)return t
for(let e of this.ranges)if(e.to>t)return Math.max(t,e.from)
return this.end}peek(t){let e,i,n=this.chunkOff+t
if(n>=0&&n<this.chunk.length)e=this.pos+t,i=this.chunk.charCodeAt(n)
else{let n=this.resolveOffset(t,1)
if(null==n)return-1
if(e=n,e>=this.chunk2Pos&&e<this.chunk2Pos+this.chunk2.length)i=this.chunk2.charCodeAt(e-this.chunk2Pos)
else{let t=this.rangeIndex,n=this.range
for(;n.to<=e;)n=this.ranges[++t]
this.chunk2=this.input.chunk(this.chunk2Pos=e),e+this.chunk2.length>n.to&&(this.chunk2=this.chunk2.slice(0,n.to-e)),i=this.chunk2.charCodeAt(0)}}return e>=this.token.lookAhead&&(this.token.lookAhead=e+1),i}acceptToken(t,e=0){let i=e?this.resolveOffset(e,-1):this.pos
if(null==i||i<this.token.start)throw new RangeError("Token end out of bounds")
this.token.value=t,this.token.end=i}getChunk(){if(this.pos>=this.chunk2Pos&&this.pos<this.chunk2Pos+this.chunk2.length){let{chunk:t,chunkPos:e}=this
this.chunk=this.chunk2,this.chunkPos=this.chunk2Pos,this.chunk2=t,this.chunk2Pos=e,this.chunkOff=this.pos-this.chunkPos}else{this.chunk2=this.chunk,this.chunk2Pos=this.chunkPos
let t=this.input.chunk(this.pos),e=this.pos+t.length
this.chunk=e>this.range.to?t.slice(0,this.range.to-this.pos):t,this.chunkPos=this.pos,this.chunkOff=0}}readNext(){return this.chunkOff>=this.chunk.length&&(this.getChunk(),this.chunkOff==this.chunk.length)?this.next=-1:this.next=this.chunk.charCodeAt(this.chunkOff)}advance(t=1){for(this.chunkOff+=t;this.pos+t>=this.range.to;){if(this.rangeIndex==this.ranges.length-1)return this.setDone()
t-=this.range.to-this.pos,this.range=this.ranges[++this.rangeIndex],this.pos=this.range.from}return this.pos+=t,this.pos>=this.token.lookAhead&&(this.token.lookAhead=this.pos+1),this.readNext()}setDone(){return this.pos=this.chunkPos=this.end,this.range=this.ranges[this.rangeIndex=this.ranges.length-1],this.chunk="",this.next=-1}reset(t,e){if(e?(this.token=e,e.start=t,e.lookAhead=t+1,e.value=e.extended=-1):this.token=c,this.pos!=t){if(this.pos=t,t==this.end)return this.setDone(),this
for(;t<this.range.from;)this.range=this.ranges[--this.rangeIndex]
for(;t>=this.range.to;)this.range=this.ranges[++this.rangeIndex]
t>=this.chunkPos&&t<this.chunkPos+this.chunk.length?this.chunkOff=t-this.chunkPos:(this.chunk="",this.chunkOff=0),this.readNext()}return this}read(t,e){if(t>=this.chunkPos&&e<=this.chunkPos+this.chunk.length)return this.chunk.slice(t-this.chunkPos,e-this.chunkPos)
if(t>=this.chunk2Pos&&e<=this.chunk2Pos+this.chunk2.length)return this.chunk2.slice(t-this.chunk2Pos,e-this.chunk2Pos)
if(t>=this.range.from&&e<=this.range.to)return this.input.read(t,e)
let i=""
for(let n of this.ranges){if(n.from>=e)break
n.to>t&&(i+=this.input.read(Math.max(n.from,t),Math.min(n.to,e)))}return i}}class f{constructor(t,e){this.data=t,this.id=e}token(t,e){!function(t,e,i,n){let s=0,r=1<<n,{parser:o}=i.p,{dialect:a}=o
t:for(;0!=(r&t[s]);){let i=t[s+1]
for(let c=s+3;c<i;c+=2)if((t[c+1]&r)>0){let i=t[c]
if(a.allows(i)&&(-1==e.token.value||e.token.value==i||o.overrides(i,e.token.value))){e.acceptToken(i)
break}}let n=e.next,l=0,h=t[s+2]
if(!(e.next<0&&h>l&&65535==t[i+3*h-3]&&65535==t[i+3*h-3])){for(;l<h;){let r=l+h>>1,o=i+r+(r<<1),a=t[o],c=t[o+1]||65536
if(n<a)h=r
else{if(!(n>=c)){s=t[o+2],e.advance()
continue t}l=r+1}}break}s=t[i+3*h-1]}}(this.data,t,e,this.id)}}function d(t,e=Uint16Array){if("string"!=typeof t)return t
let i=null
for(let n=0,s=0;n<t.length;){let r=0
for(;;){let e=t.charCodeAt(n++),i=!1
if(126==e){r=65535
break}e>=92&&e--,e>=34&&e--
let s=e-32
if(s>=46&&(s-=46,i=!0),r+=s,i)break
r*=46}i?i[s++]=r:i=new e(r)}return i}f.prototype.contextual=f.prototype.fallback=f.prototype.extend=!1
const p="undefined"!=typeof process&&process.env&&/\bparse\b/.test(process.env.LOG)
let m=null
var g,O
function v(t,e,i){let n=t.cursor(s.IterMode.IncludeAnonymous)
for(n.moveTo(e);;)if(!(i<0?n.childBefore(e):n.childAfter(e)))for(;;){if((i<0?n.to<e:n.from>e)&&!n.type.isError)return i<0?Math.max(0,Math.min(n.to-1,e-25)):Math.min(t.length,Math.max(n.from+1,e+25))
if(i<0?n.prevSibling():n.nextSibling())break
if(!n.parent())return i<0?0:t.length}}!function(t){t[t.Margin=25]="Margin"}(g||(g={}))
class y{constructor(t,e){this.fragments=t,this.nodeSet=e,this.i=0,this.fragment=null,this.safeFrom=-1,this.safeTo=-1,this.trees=[],this.start=[],this.index=[],this.nextFragment()}nextFragment(){let t=this.fragment=this.i==this.fragments.length?null:this.fragments[this.i++]
if(t){for(this.safeFrom=t.openStart?v(t.tree,t.from+t.offset,1)-t.offset:t.from,this.safeTo=t.openEnd?v(t.tree,t.to+t.offset,-1)-t.offset:t.to;this.trees.length;)this.trees.pop(),this.start.pop(),this.index.pop()
this.trees.push(t.tree),this.start.push(-t.offset),this.index.push(0),this.nextStart=this.safeFrom}else this.nextStart=1e9}nodeAt(t){if(t<this.nextStart)return null
for(;this.fragment&&this.safeTo<=t;)this.nextFragment()
if(!this.fragment)return null
for(;;){let e=this.trees.length-1
if(e<0)return this.nextFragment(),null
let i=this.trees[e],n=this.index[e]
if(n==i.children.length){this.trees.pop(),this.start.pop(),this.index.pop()
continue}let r=i.children[n],o=this.start[e]+i.positions[n]
if(o>t)return this.nextStart=o,null
if(r instanceof s.Tree){if(o==t){if(o<this.safeFrom)return null
let t=o+r.length
if(t<=this.safeTo){let e=r.prop(s.NodeProp.lookAhead)
if(!e||t+e<this.fragment.to)return r}}this.index[e]++,o+r.length>=Math.max(this.safeFrom,t)&&(this.trees.push(r),this.start.push(o),this.index.push(0))}else this.index[e]++,this.nextStart=o+r.length}}}class b{constructor(t,e){this.stream=e,this.tokens=[],this.mainToken=null,this.actions=[],this.tokens=t.tokenizers.map((t=>new h))}getActions(t){let e=0,i=null,{parser:n}=t.p,{tokenizers:s}=n,r=n.stateSlot(t.state,3),o=t.curContext?t.curContext.hash:0,a=0
for(let l=0;l<s.length;l++){if(0==(1<<l&r))continue
let n=s[l],h=this.tokens[l]
if((!i||n.fallback)&&((n.contextual||h.start!=t.pos||h.mask!=r||h.context!=o)&&(this.updateCachedToken(h,n,t),h.mask=r,h.context=o),h.lookAhead>h.end+25&&(a=Math.max(h.lookAhead,a)),0!=h.value)){let s=e
if(h.extended>-1&&(e=this.addActions(t,h.extended,h.end,e)),e=this.addActions(t,h.value,h.end,e),!n.extend&&(i=h,e>s))break}}for(;this.actions.length>e;)this.actions.pop()
return a&&t.setLookAhead(a),i||t.pos!=this.stream.end||(i=new h,i.value=t.p.parser.eofTerm,i.start=i.end=t.pos,e=this.addActions(t,i.value,i.end,e)),this.mainToken=i,this.actions}getMainToken(t){if(this.mainToken)return this.mainToken
let e=new h,{pos:i,p:n}=t
return e.start=i,e.end=Math.min(i+1,n.stream.end),e.value=i==n.stream.end?n.parser.eofTerm:0,e}updateCachedToken(t,e,i){let n=this.stream.clipPos(i.pos)
if(e.token(this.stream.reset(n,t),i),t.value>-1){let{parser:e}=i.p
for(let n=0;n<e.specialized.length;n++)if(e.specialized[n]==t.value){let s=e.specializers[n](this.stream.read(t.start,t.end),i)
if(s>=0&&i.p.parser.dialect.allows(s>>1)){0==(1&s)?t.value=s>>1:t.extended=s>>1
break}}}else t.value=0,t.end=this.stream.clipPos(n+1)}putAction(t,e,i,n){for(let s=0;s<n;s+=3)if(this.actions[s]==t)return n
return this.actions[n++]=t,this.actions[n++]=e,this.actions[n++]=i,n}addActions(t,e,i,n){let{state:s}=t,{parser:r}=t.p,{data:o}=r
for(let a=0;a<2;a++)for(let t=r.stateSlot(s,a?2:1);;t+=3){if(65535==o[t]){if(1!=o[t+1]){0==n&&2==o[t+1]&&(n=this.putAction(P(o,t+2),e,i,n))
break}t=P(o,t+2)}o[t]==e&&(n=this.putAction(P(o,t+1),e,i,n))}return n}}!function(t){t[t.Distance=5]="Distance",t[t.MaxRemainingPerStep=3]="MaxRemainingPerStep",t[t.MinBufferLengthPrune=500]="MinBufferLengthPrune",t[t.ForceReduceLimit=10]="ForceReduceLimit",t[t.CutDepth=15e3]="CutDepth",t[t.CutTo=9e3]="CutTo"}(O||(O={}))
class w{constructor(t,e,i,n){this.parser=t,this.input=e,this.ranges=n,this.recovering=0,this.nextStackID=9812,this.minStackPos=0,this.reused=[],this.stoppedAt=null,this.stream=new u(e,n),this.tokens=new b(t,this.stream),this.topTerm=t.top[1]
let{from:s}=n[0]
this.stacks=[r.start(this,t.top[0],s)],this.fragments=i.length&&this.stream.end-s>4*t.bufferLength?new y(i,t.nodeSet):null}get parsedPos(){return this.minStackPos}advance(){let t,e,i=this.stacks,n=this.minStackPos,s=this.stacks=[]
for(let r=0;r<i.length;r++){let o=i[r]
for(;;){if(this.tokens.mainToken=null,o.pos>n)s.push(o)
else{if(this.advanceStack(o,s,i))continue
{t||(t=[],e=[]),t.push(o)
let i=this.tokens.getMainToken(o)
e.push(i.value,i.end)}}break}}if(!s.length){let e=t&&function(t){let e=null
for(let i of t){let t=i.p.stoppedAt;(i.pos==i.p.stream.end||null!=t&&i.pos>t)&&i.p.parser.stateFlag(i.state,2)&&(!e||e.score<i.score)&&(e=i)}return e}(t)
if(e)return this.stackToTree(e)
if(this.parser.strict)throw p&&t&&console.log("Stuck with token "+(this.tokens.mainToken?this.parser.getName(this.tokens.mainToken.value):"none")),new SyntaxError("No parse at "+n)
this.recovering||(this.recovering=5)}if(this.recovering&&t){let i=null!=this.stoppedAt&&t[0].pos>this.stoppedAt?t[0]:this.runRecovery(t,e,s)
if(i)return this.stackToTree(i.forceAll())}if(this.recovering){let t=1==this.recovering?1:3*this.recovering
if(s.length>t)for(s.sort(((t,e)=>e.score-t.score));s.length>t;)s.pop()
s.some((t=>t.reducePos>n))&&this.recovering--}else if(s.length>1)t:for(let r=0;r<s.length-1;r++){let t=s[r]
for(let e=r+1;e<s.length;e++){let i=s[e]
if(t.sameState(i)||t.buffer.length>500&&i.buffer.length>500){if(!((t.score-i.score||t.buffer.length-i.buffer.length)>0)){s.splice(r--,1)
continue t}s.splice(e--,1)}}}this.minStackPos=s[0].pos
for(let r=1;r<s.length;r++)s[r].pos<this.minStackPos&&(this.minStackPos=s[r].pos)
return null}stopAt(t){if(null!=this.stoppedAt&&this.stoppedAt<t)throw new RangeError("Can't move stoppedAt forward")
this.stoppedAt=t}advanceStack(t,e,i){let n=t.pos,{parser:r}=this,o=p?this.stackID(t)+" -> ":""
if(null!=this.stoppedAt&&n>this.stoppedAt)return t.forceReduce()?t:null
if(this.fragments){let e=t.curContext&&t.curContext.tracker.strict,i=e?t.curContext.hash:0
for(let a=this.fragments.nodeAt(n);a;){let n=this.parser.nodeSet.types[a.type.id]==a.type?r.getGoto(t.state,a.type.id):-1
if(n>-1&&a.length&&(!e||(a.prop(s.NodeProp.contextHash)||0)==i))return t.useNode(a,n),p&&console.log(o+this.stackID(t)+` (via reuse of ${r.getName(a.type.id)})`),!0
if(!(a instanceof s.Tree)||0==a.children.length||a.positions[0]>0)break
let l=a.children[0]
if(!(l instanceof s.Tree&&0==a.positions[0]))break
a=l}}let a=r.stateSlot(t.state,4)
if(a>0)return t.reduce(a),p&&console.log(o+this.stackID(t)+` (via always-reduce ${r.getName(65535&a)})`),!0
if(t.stack.length>=15e3)for(;t.stack.length>9e3&&t.forceReduce(););let l=this.tokens.getActions(t)
for(let s=0;s<l.length;){let a=l[s++],h=l[s++],c=l[s++],u=s==l.length||!i,f=u?t:t.split()
if(f.apply(a,h,c),p&&console.log(o+this.stackID(f)+` (via ${0==(65536&a)?"shift":`reduce of ${r.getName(65535&a)}`} for ${r.getName(h)} @ ${n}${f==t?"":", split"})`),u)return!0
f.pos>n?e.push(f):i.push(f)}return!1}advanceFully(t,e){let i=t.pos
for(;;){if(!this.advanceStack(t,null,null))return!1
if(t.pos>i)return x(t,e),!0}}runRecovery(t,e,i){let n=null,s=!1
for(let r=0;r<t.length;r++){let o=t[r],a=e[r<<1],l=e[1+(r<<1)],h=p?this.stackID(o)+" -> ":""
if(o.deadEnd){if(s)continue
if(s=!0,o.restart(),p&&console.log(h+this.stackID(o)+" (restarted)"),this.advanceFully(o,i))continue}let c=o.split(),u=h
for(let t=0;c.forceReduce()&&t<10&&(p&&console.log(u+this.stackID(c)+" (via force-reduce)"),!this.advanceFully(c,i));t++)p&&(u=this.stackID(c)+" -> ")
for(let t of o.recoverByInsert(a))p&&console.log(h+this.stackID(t)+" (via recover-insert)"),this.advanceFully(t,i)
this.stream.end>o.pos?(l==o.pos&&(l++,a=0),o.recoverByDelete(a,l),p&&console.log(h+this.stackID(o)+` (via recover-delete ${this.parser.getName(a)})`),x(o,i)):(!n||n.score<o.score)&&(n=o)}return n}stackToTree(t){return t.close(),s.Tree.build({buffer:l.create(t),nodeSet:this.parser.nodeSet,topID:this.topTerm,maxBufferLength:this.parser.bufferLength,reused:this.reused,start:this.ranges[0].from,length:t.pos-this.ranges[0].from,minRepeatType:this.parser.minRepeatTerm})}stackID(t){let e=(m||(m=new WeakMap)).get(t)
return e||m.set(t,e=String.fromCodePoint(this.nextStackID++)),e+t}}function x(t,e){for(let i=0;i<e.length;i++){let n=e[i]
if(n.pos==t.pos&&n.sameState(t))return void(e[i].score<t.score&&(e[i]=t))}e.push(t)}class S{constructor(t,e,i){this.source=t,this.flags=e,this.disabled=i}allows(t){return!this.disabled||0==this.disabled[t]}}const k=t=>t
class Q extends s.Parser{constructor(t){if(super(),this.wrappers=[],14!=t.version)throw new RangeError(`Parser version (${t.version}) doesn't match runtime version (14)`)
let e=t.nodeNames.split(" ")
this.minRepeatTerm=e.length
for(let s=0;s<t.repeatNodeCount;s++)e.push("")
let i=Object.keys(t.topRules).map((e=>t.topRules[e][1])),n=[]
for(let s=0;s<e.length;s++)n.push([])
function r(t,e,i){n[t].push([e,e.deserialize(String(i))])}if(t.nodeProps)for(let a of t.nodeProps){let t=a[0]
"string"==typeof t&&(t=s.NodeProp[t])
for(let e=1;e<a.length;){let i=a[e++]
if(i>=0)r(i,t,a[e++])
else{let n=a[e+-i]
for(let s=-i;s>0;s--)r(a[e++],t,n)
e++}}}this.nodeSet=new s.NodeSet(e.map(((e,r)=>s.NodeType.define({name:r>=this.minRepeatTerm?void 0:e,id:r,props:n[r],top:i.indexOf(r)>-1,error:0==r,skipped:t.skippedNodes&&t.skippedNodes.indexOf(r)>-1})))),t.propSources&&(this.nodeSet=this.nodeSet.extend(...t.propSources)),this.strict=!1,this.bufferLength=s.DefaultBufferLength
let o=d(t.tokenData)
this.context=t.context,this.specializerSpecs=t.specialized||[],this.specialized=new Uint16Array(this.specializerSpecs.length)
for(let s=0;s<this.specializerSpecs.length;s++)this.specialized[s]=this.specializerSpecs[s].term
this.specializers=this.specializerSpecs.map($),this.states=d(t.states,Uint32Array),this.data=d(t.stateData),this.goto=d(t.goto),this.maxTerm=t.maxTerm,this.tokenizers=t.tokenizers.map((t=>"number"==typeof t?new f(o,t):t)),this.topRules=t.topRules,this.dialects=t.dialects||{},this.dynamicPrecedences=t.dynamicPrecedences||null,this.tokenPrecTable=t.tokenPrec,this.termNames=t.termNames||null,this.maxNode=this.nodeSet.types.length-1,this.dialect=this.parseDialect(),this.top=this.topRules[Object.keys(this.topRules)[0]]}createParse(t,e,i){let n=new w(this,t,e,i)
for(let s of this.wrappers)n=s(n,t,e,i)
return n}getGoto(t,e,i=!1){let n=this.goto
if(e>=n[0])return-1
for(let s=n[e+1];;){let e=n[s++],r=1&e,o=n[s++]
if(r&&i)return o
for(let i=s+(e>>1);s<i;s++)if(n[s]==t)return o
if(r)return-1}}hasAction(t,e){let i=this.data
for(let n=0;n<2;n++)for(let s,r=this.stateSlot(t,n?2:1);;r+=3){if(65535==(s=i[r])){if(1!=i[r+1]){if(2==i[r+1])return P(i,r+2)
break}s=i[r=P(i,r+2)]}if(s==e||0==s)return P(i,r+1)}return 0}stateSlot(t,e){return this.states[6*t+e]}stateFlag(t,e){return(this.stateSlot(t,0)&e)>0}validAction(t,e){if(e==this.stateSlot(t,4))return!0
for(let i=this.stateSlot(t,1);;i+=3){if(65535==this.data[i]){if(1!=this.data[i+1])return!1
i=P(this.data,i+2)}if(e==P(this.data,i+1))return!0}}nextStates(t){let e=[]
for(let i=this.stateSlot(t,1);;i+=3){if(65535==this.data[i]){if(1!=this.data[i+1])break
i=P(this.data,i+2)}if(0==(1&this.data[i+2])){let t=this.data[i+1]
e.some(((e,i)=>1&i&&e==t))||e.push(this.data[i],t)}}return e}overrides(t,e){let i=T(this.data,this.tokenPrecTable,e)
return i<0||T(this.data,this.tokenPrecTable,t)<i}configure(t){let e=Object.assign(Object.create(Q.prototype),this)
if(t.props&&(e.nodeSet=this.nodeSet.extend(...t.props)),t.top){let i=this.topRules[t.top]
if(!i)throw new RangeError(`Invalid top rule name ${t.top}`)
e.top=i}return t.tokenizers&&(e.tokenizers=this.tokenizers.map((e=>{let i=t.tokenizers.find((t=>t.from==e))
return i?i.to:e}))),t.specializers&&(e.specializers=this.specializers.slice(),e.specializerSpecs=this.specializerSpecs.map(((i,n)=>{let s=t.specializers.find((t=>t.from==i.external))
if(!s)return i
let r=Object.assign(Object.assign({},i),{external:s.to})
return e.specializers[n]=$(r),r}))),t.contextTracker&&(e.context=t.contextTracker),t.dialect&&(e.dialect=this.parseDialect(t.dialect)),null!=t.strict&&(e.strict=t.strict),t.wrap&&(e.wrappers=e.wrappers.concat(t.wrap)),null!=t.bufferLength&&(e.bufferLength=t.bufferLength),e}hasWrappers(){return this.wrappers.length>0}getName(t){return this.termNames?this.termNames[t]:String(t<=this.maxNode&&this.nodeSet.types[t].name||t)}get eofTerm(){return this.maxNode+1}get topNode(){return this.nodeSet.types[this.top[1]]}dynamicPrecedence(t){let e=this.dynamicPrecedences
return null==e?0:e[t]||0}parseDialect(t){let e=Object.keys(this.dialects),i=e.map((()=>!1))
if(t)for(let s of t.split(" ")){let t=e.indexOf(s)
t>=0&&(i[t]=!0)}let n=null
for(let s=0;s<e.length;s++)if(!i[s])for(let t,i=this.dialects[e[s]];65535!=(t=this.data[i++]);)(n||(n=new Uint8Array(this.maxTerm+1)))[t]=1
return new S(t,i,n)}static deserialize(t){return new Q(t)}}function P(t,e){return t[e]|t[e+1]<<16}function T(t,e,i){for(let n,s=e;65535!=(n=t[s]);s++)if(n==i)return s-e
return-1}function $(t){if(t.external){let e=t.extend?1:0
return(i,n)=>t.external(i,n)<<1|e}return t.get}e.ContextTracker=class{constructor(t){this.start=t.start,this.shift=t.shift||k,this.reduce=t.reduce||k,this.reuse=t.reuse||k,this.hash=t.hash||(()=>0),this.strict=!1!==t.strict}},e.ExternalTokenizer=class{constructor(t,e={}){this.token=t,this.contextual=!!e.contextual,this.fallback=!!e.fallback,this.extend=!!e.extend}},e.InputStream=u,e.LRParser=Q,e.Stack=r},513:t=>{"use strict"
function e(t,i){if("string"==typeof i)t.appendChild(document.createTextNode(i))
else if(null==i);else if(null!=i.nodeType)t.appendChild(i)
else{if(!Array.isArray(i))throw new RangeError("Unsupported child node: "+i)
for(var n=0;n<i.length;n++)e(t,i[n])}}t.exports=function(){var t=arguments[0]
"string"==typeof t&&(t=document.createElement(t))
var i=1,n=arguments[1]
if(n&&"object"==typeof n&&null==n.nodeType&&!Array.isArray(n)){for(var s in n)if(Object.prototype.hasOwnProperty.call(n,s)){var r=n[s]
"string"==typeof r?t.setAttribute(s,r):null!=r&&(t[s]=r)}i++}for(;i<arguments.length;i++)e(t,arguments[i])
return t}},223:(t,e)=>{var i="undefined"==typeof Symbol?"__ͼ":Symbol.for("ͼ"),n="undefined"==typeof Symbol?"__styleSet"+Math.floor(1e8*Math.random()):Symbol("styleSet"),s="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:{},r=e.StyleModule=function(t,e){this.rules=[]
var i=(e||{}).finish
function n(t){return/^@/.test(t)?[t]:t.split(/,\s*/)}function s(t,e,r,o){var a=[],l=/^@(\w+)\b/.exec(t[0]),h=l&&"keyframes"==l[1]
if(l&&null==e)return r.push(t[0]+";")
for(var c in e){var u=e[c]
if(/&/.test(c))s(c.split(/,\s*/).map((function(e){return t.map((function(t){return e.replace(/&/,t)}))})).reduce((function(t,e){return t.concat(e)})),u,r)
else if(u&&"object"==typeof u){if(!l)throw new RangeError("The value of a property ("+c+") should be a primitive value.")
s(n(c),u,a,h)}else null!=u&&a.push(c.replace(/_.*/,"").replace(/[A-Z]/g,(function(t){return"-"+t.toLowerCase()}))+": "+u+";")}(a.length||h)&&r.push((!i||l||o?t:t.map(i)).join(", ")+" {"+a.join(" ")+"}")}for(var r in t)s(n(r),t[r],this.rules)}
r.prototype.getRules=function(){return this.rules.join("\n")},r.newName=function(){var t=s[i]||1
return s[i]=t+1,"ͼ"+t.toString(36)},r.mount=function(t,e){(t[n]||new a(t)).mount(Array.isArray(e)?e:[e])}
var o=null,a=function(t){if(!t.head&&t.adoptedStyleSheets&&"undefined"!=typeof CSSStyleSheet){if(o)return t.adoptedStyleSheets=[o.sheet].concat(t.adoptedStyleSheets),t[n]=o
this.sheet=new CSSStyleSheet,t.adoptedStyleSheets=[this.sheet].concat(t.adoptedStyleSheets),o=this}else{this.styleTag=(t.ownerDocument||t).createElement("style")
var e=t.head||t
e.insertBefore(this.styleTag,e.firstChild)}this.modules=[],t[n]=this}
a.prototype.mount=function(t){for(var e=this.sheet,i=0,n=0,s=0;s<t.length;s++){var r=t[s],o=this.modules.indexOf(r)
if(o<n&&o>-1&&(this.modules.splice(o,1),n--,o=-1),-1==o){if(this.modules.splice(n++,0,r),e)for(var a=0;a<r.rules.length;a++)e.insertRule(r.rules[a],i++)}else{for(;n<o;)i+=this.modules[n++].rules.length
i+=r.rules.length,n++}}if(!e){for(var l="",h=0;h<this.modules.length;h++)l+=this.modules[h].getRules()+"\n"
this.styleTag.textContent=l}}},691:(t,e)=>{"use strict"
Object.defineProperty(e,"__esModule",{value:!0})
for(var i={8:"Backspace",9:"Tab",10:"Enter",12:"NumLock",13:"Enter",16:"Shift",17:"Control",18:"Alt",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",44:"PrintScreen",45:"Insert",46:"Delete",59:";",61:"=",91:"Meta",92:"Meta",106:"*",107:"+",108:",",109:"-",110:".",111:"/",144:"NumLock",145:"ScrollLock",160:"Shift",161:"Shift",162:"Control",163:"Control",164:"Alt",165:"Alt",173:"-",186:";",187:"=",188:",",189:"-",190:".",191:"/",192:"`",219:"[",220:"\\",221:"]",222:"'"},n={48:")",49:"!",50:"@",51:"#",52:"$",53:"%",54:"^",55:"&",56:"*",57:"(",59:":",61:"+",173:"_",186:":",187:"+",188:"<",189:"_",190:">",191:"?",192:"~",219:"{",220:"|",221:"}",222:'"'},s="undefined"!=typeof navigator&&/Chrome\/(\d+)/.exec(navigator.userAgent),r=("undefined"!=typeof navigator&&/Gecko\/\d+/.test(navigator.userAgent),"undefined"!=typeof navigator&&/Mac/.test(navigator.platform)),o="undefined"!=typeof navigator&&/MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent),a=r||s&&+s[1]<57,l=0;l<10;l++)i[48+l]=i[96+l]=String(l)
for(l=1;l<=24;l++)i[l+111]="F"+l
for(l=65;l<=90;l++)i[l]=String.fromCharCode(l+32),n[l]=String.fromCharCode(l)
for(var h in i)n.hasOwnProperty(h)||(n[h]=i[h])
e.base=i,e.keyName=function(t){var e=!(a&&(t.ctrlKey||t.altKey||t.metaKey)||o&&t.shiftKey&&t.key&&1==t.key.length||"Unidentified"==t.key)&&t.key||(t.shiftKey?n:i)[t.keyCode]||t.key||"Unidentified"
return"Esc"==e&&(e="Escape"),"Del"==e&&(e="Delete"),"Left"==e&&(e="ArrowLeft"),"Up"==e&&(e="ArrowUp"),"Right"==e&&(e="ArrowRight"),"Down"==e&&(e="ArrowDown"),e},e.shift=n}}])

//# sourceMappingURL=chunk.55.8b9265b3d56a0da3bde9.map