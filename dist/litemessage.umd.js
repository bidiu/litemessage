/*! v0.3.0-7-g32a1cfa */
!function(e,r){"object"==typeof exports&&"object"==typeof module?module.exports=r():"function"==typeof define&&define.amd?define([],r):"object"==typeof exports?exports.litemessage=r():e.litemessage=r()}(window,function(){return function(e){var r={};function t(n){if(r[n])return r[n].exports;var o=r[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,t),o.l=!0,o.exports}return t.m=e,t.c=r,t.d=function(e,r,n){t.o(e,r)||Object.defineProperty(e,r,{enumerable:!0,get:n})},t.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},t.t=function(e,r){if(1&r&&(e=t(e)),8&r)return e;if(4&r&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(t.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&r&&"string"!=typeof e)for(var o in e)t.d(n,o,function(r){return e[r]}.bind(null,o));return n},t.n=function(e){var r=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(r,"a",r),r},t.o=function(e,r){return Object.prototype.hasOwnProperty.call(e,r)},t.p="",t(t.s=4)}([function(e,r){e.exports=require("babel-runtime/core-js/get-iterator")},function(e,r){e.exports=require("babel-runtime/helpers/extends")},function(e,r){e.exports=require("babel-runtime/helpers/toConsumableArray")},function(e,r){e.exports=require("babel-runtime/core-js/object/freeze")},function(e,r,t){"use strict";t.r(r),function(e){var r=t(1),n=t.n(r);e.exports=exports=n()({},exports,t(6))}.call(this,t(5)(e))},function(e,r){e.exports=function(e){if(!e.webpackPolyfill){var r=Object.create(e);r.children||(r.children=[]),Object.defineProperty(r,"loaded",{enumerable:!0,get:function(){return r.l}}),Object.defineProperty(r,"id",{enumerable:!0,get:function(){return r.i}}),Object.defineProperty(r,"exports",{enumerable:!0}),r.webpackPolyfill=1}return r}},function(e,r,t){"use strict";t.r(r);var n=t(0),o=t.n(n),i=t(2),u=t.n(i),f=t(3),l=t.n(f),c=t(7),a=t(8).Buffer,s=l()([128,64,32,16,8,4,2,1]),p=function e(r){if(0===r.length)throw new Error("Cannot calcuate merkle root from 0 leaf.");r.length%2==1&&(r=[].concat(u()(r),[r[r.length-1]]));for(var t=[],n=0;n<r.length;n+=2)t.push(c(""+r[n]+r[n+1]));return 1===t.length?t[0]:e(t)},y=function(e,r){return e===p(r)},b=function(e){"string"==typeof e&&(e=a.from(e,"hex"));for(var r=0,t=0;0===e[t];t++)r+=8;for(var n=0;n<8&&!(e[t]&s[n]);n++)r+=1;return r},v=function(e){if(!e)return!1;var r=e.ver,t=e.time,n=e.litemsg,o=e.sig,i=e.pubKey,u=e.hash;return"number"==typeof r&&("number"==typeof t&&("string"==typeof n&&u===c(""+r+t+n+o+i)))},d=function(e,r){if(!e)return!1;var t=e.ver,n=e.time,i=e.height,u=e.merkleRoot,f=e.bits,l=e.nonce,a=e.litemsgs;if("number"!=typeof t)return!1;if("number"!=typeof n)return!1;if("number"!=typeof i||i<0||0===i&&void 0!==e.prevBlock||0!==i&&void 0===e.prevBlock)return!1;if(!(a instanceof Array&&a.length))return!1;if("string"!=typeof u||!y(u,a.map(function(e){return e.hash})))return!1;if("number"!=typeof f||"number"!=typeof l||l<0||"string"!=typeof e.hash)return!1;var s=c(""+t+n+i+e.prevBlock+u+f+l);if(s!==e.hash||b(s)<f)return!1;var p=!0,d=!1,h=void 0;try{for(var m,x=o()(a);!(p=(m=x.next()).done);p=!0){var g=m.value;if(!v(g))return!1}}catch(e){d=!0,h=e}finally{try{!p&&x.return&&x.return()}finally{if(d)throw h}}if(void 0!==r){if("string"!=typeof e.prevBlock||r.hash!==e.prevBlock)return!1;if(r.height+1!==i)return!1}return!0};exports.sha256=c,exports.calcMerkleRoot=p,exports.verifyMerkleRoot=y,exports.leadingZeroBits=b,exports.verifyLitemsg=v,exports.verifyBlock=d,exports.verifySubchain=function(e,r){var t=!0,n=!1,i=void 0;try{for(var u,f=o()(e);!(t=(u=f.next()).done);t=!0){var l=u.value;if(!d(l,r))return!1;r=l}}catch(e){n=!0,i=e}finally{try{!t&&f.return&&f.return()}finally{if(n)throw i}}return!0}},function(e,r){e.exports=require("js-sha256")},function(e,r){e.exports=require("buffer/")}])});
//# sourceMappingURL=litemessage.umd.js.map