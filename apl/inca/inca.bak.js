// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['arguments'] = process['argv'].slice(2);

  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?\{ ?[^}]* ?\}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (vararg) return 8;
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    code = Pointer_stringify(code);
    if (code[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (code.indexOf('"', 1) === code.length-1) {
        code = code.substr(1, code.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + code + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + code + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }

  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;

// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    return rawList ? list : ret + flushList();
  }
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    return parse();
  } catch(e) {
    return func;
  }
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

var totalMemory = 4096;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be more reasonable');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===



STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 2944;


/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });




































/* memory initializer */ allocate([43,123,126,60,35,44,62,45,42,37,124,125,38,94,33,47,46,92,39,34,64,61,59,58,36,95,0,0,0,0,0,0,0,0,0,0,16,0,0,0,8,0,0,0,22,0,0,0,18,0,0,0,2,0,0,0,14,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,0,0,0,0,0,0,0,26,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,48,0,0,0,50,0,0,0,49,0,0,0,0,0,0,0,0,0,0,0,49,0,0,0,48,0,0,0,0,0,0,0,0,0,0,0,49,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,34,0,0,0,8,0,0,0,44,0,0,0,30,0,0,0,46,0,0,0,12,0,0,0,22,0,0,0,10,0,0,0,38,0,0,0,6,0,0,0,32,0,0,0,0,0,0,0,42,0,0,0,36,0,0,0,48,0,0,0,4,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,40,0,0,0,20,0,0,0,24,0,0,0,26,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,101,114,114,111,114,32,98,97,100,32,102,117,110,99,116,105,111,110,32,97,114,103,32,116,111,32,111,112,101,114,97,116,111,114,32,64,58,32,116,114,121,32,46,45,124,47,92,43,60,62,32,105,101,46,32,45,64,32,111,114,32,62,64,32,0,0,0,0,0,0,0,0,101,114,114,58,32,117,110,109,97,116,99,104,101,100,32,112,97,114,101,110,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,8,16,18,17,11,4,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,100,40,37,100,41,32,37,100,32,0,0,0,0,0,0,60,32,0,0,0,0,0,0,37,100,0,0,0,0,0,0,48,37,111,0,0,0,0,0,37,100,32,0,0,0,0,0,101,120,101,99,117,116,101,32,114,101,113,117,105,114,101,115,32,97,32,99,111,109,109,97,110,100,0,0,0,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);



var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


  var _llvm_pow_f64=Math_pow;

  
   
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;

  
  
  
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          fileStore.createIndex('timestamp', 'timestamp', { unique: false });
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function() {
          callback(this.error);
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function() { callback(this.error); };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');
  
          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;
  
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }
  
            entries[cursor.primaryKey] = { timestamp: cursor.key };
  
            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function() { callback(this.error); };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function() { done(this.error); };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          stream.position = position;
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },getStreamFromPtr:function (ptr) {
        return FS.streams[ptr - 1];
      },getPtrForStream:function (stream) {
        return stream ? stream.fd + 1 : 0;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            callback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=FS.getPtrForStream(stdin);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=FS.getPtrForStream(stdout);
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=FS.getPtrForStream(stderr);
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
  
              if (!hasByteServing) chunkSize = datalength;
  
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
  
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
  
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
  
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  
  
  
  
  function _mkport() { throw 'TODO' }var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
  
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
  
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
  
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
  
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
  
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
  
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
  
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
  
  
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
  
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
  
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
  
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
  
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
  
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
  
  
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
  
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
  
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
  
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
  
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
  
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
  
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
  
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
  
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
  
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
  
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
  
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
  
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
  
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
  
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
  
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
  
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
  
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
  
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
  
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
  
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
  
  
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
  
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _fileno(stream) {
      // int fileno(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fileno.html
      return FS.getStreamFromPtr(stream).fd;
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var fd = _fileno(stream);
      var bytesWritten = _write(fd, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStreamFromPtr(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  
  
   
  Module["_strlen"] = _strlen;
  
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
  
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
  
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
  
          // Handle precision.
          var precisionSet = false, precision = -1;
          if (next == 46) {
            precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          }
          if (precision < 0) {
            precision = 6; // Standard default.
            precisionSet = false;
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
  
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
  
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
  
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
  
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
  
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
  
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
  
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
  
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
  
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
  
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
  
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
  
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
  
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length;
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }

  function _isprint(chr) {
      return 0x1F < chr && chr < 0x7F;
    }

  var _ceil=Math_ceil;

  function _log10(x) {
      return Math.log(x) / Math.LN10;
    }

  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
    }


  
  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;

  
  function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      var fd = _fileno(stream);
      return _write(fd, s, _strlen(s));
    }
  
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr;
      var fd = _fileno(stream);
      var ret = _write(fd, _fputc.ret, 1);
      if (ret == -1) {
        var streamObj = FS.getStreamFromPtr(stream);
        if (streamObj) streamObj.error = true;
        return -1;
      } else {
        return chr;
      }
    }function _puts(s) {
      // int puts(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/puts.html
      // NOTE: puts() always writes an extra newline.
      var stdout = HEAP32[((_stdout)>>2)];
      var ret = _fputs(s, stdout);
      if (ret < 0) {
        return ret;
      } else {
        var newlineRet = _fputc(10, stdout);
        return (newlineRet < 0) ? -1 : ret + 1;
      }
    }

  function _putchar(c) {
      // int putchar(int c);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/putchar.html
      return _fputc(c, HEAP32[((_stdout)>>2)]);
    }

  function _abort() {
      Module['abort']();
    }

  function ___errno_location() {
      return ___errno_state;
    }

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }

  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }






  var Browser={mainLoop:{scheduler:null,method:"",shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
  
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        var errorInfo = '?';
        function onContextCreationError(event) {
          errorInfo = event.statusMessage || errorInfo;
        }
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
  
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
  
  
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          GLctx = Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
  
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        return Math.max(-1, Math.min(1, event.type === 'DOMMouseScroll' ? event.detail : -event.wheelDelta));
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (scrollX + rect.left);
              y = t.pageY - (scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (scrollX + rect.left);
            y = event.pageY - (scrollY + rect.top);
          }
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");


var Math_min = Math.min;
function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=+env.NaN;var n=+env.Infinity;var o=0;var p=0;var q=0;var r=0;var s=0,t=0,u=0,v=0,w=0.0,x=0,y=0,z=0,A=0.0;var B=0;var C=0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=global.Math.floor;var M=global.Math.abs;var N=global.Math.sqrt;var O=global.Math.pow;var P=global.Math.cos;var Q=global.Math.sin;var R=global.Math.tan;var S=global.Math.acos;var T=global.Math.asin;var U=global.Math.atan;var V=global.Math.atan2;var W=global.Math.exp;var X=global.Math.log;var Y=global.Math.ceil;var Z=global.Math.imul;var _=env.abort;var $=env.assert;var aa=env.asmPrintInt;var ba=env.asmPrintFloat;var ca=env.min;var da=env.invoke_iiiii;var ea=env.invoke_vi;var fa=env.invoke_ii;var ga=env.invoke_v;var ha=env.invoke_iii;var ia=env._sysconf;var ja=env._isprint;var ka=env._abort;var la=env._fprintf;var ma=env._printf;var na=env._fflush;var oa=env.__reallyNegative;var pa=env._strchr;var qa=env._fputc;var ra=env._puts;var sa=env.___setErrNo;var ta=env._fwrite;var ua=env._send;var va=env._write;var wa=env._fputs;var xa=env._log10;var ya=env.__formatString;var za=env._ceil;var Aa=env._emscripten_memcpy_big;var Ba=env._fileno;var Ca=env._pwrite;var Da=env._putchar;var Ea=env._llvm_pow_f64;var Fa=env._sbrk;var Ga=env.___errno_location;var Ha=env._mkport;var Ia=env._time;var Ja=0.0;
// EMSCRIPTEN_START_FUNCS
function Pa(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function Qa(){return i|0}function Ra(a){a=a|0;i=a}function Sa(a,b){a=a|0;b=b|0;if((o|0)==0){o=a;p=b}}function Ta(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function Ua(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function Va(a){a=a|0;B=a}function Wa(a){a=a|0;C=a}function Xa(a){a=a|0;D=a}function Ya(a){a=a|0;E=a}function Za(a){a=a|0;F=a}function _a(a){a=a|0;G=a}function $a(a){a=a|0;H=a}function ab(a){a=a|0;I=a}function bb(a){a=a|0;J=a}function cb(a){a=a|0;K=a}function db(){}function eb(a){a=a|0;var b=0,d=0;d=c[a>>2]|1;b=Yb(24)|0;c[b>>2]=d;c[b+4>>2]=0;c[b+20>>2]=a;return b|0}function fb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;if((c[a>>2]|0)==0){k=a;return k|0}d=c[a+4>>2]|0;if((d|0)==0){k=c[a+20>>2]|0;return k|0}if((d|0)>0){e=0;g=1;do{g=Z(c[a+8+(e<<2)>>2]|0,g)|0;e=e+1|0;}while((e|0)<(d|0))}else{g=1}h=c[a+20>>2]|0;k=Yb((g<<2)+20|0)|0;f=k;c[k>>2]=0;c[k+4>>2]=1;c[k+8>>2]=g;if((g|0)>0){d=0;e=1}else{k=f;return k|0}while(1){i=c[h+4>>2]|0;if((i|0)>0){k=0;j=1;do{j=Z(c[h+8+(k<<2)>>2]|0,j)|0;k=k+1|0;}while((k|0)<(i|0));if((j|0)>0){i=j;b=9}else{i=j}}else{i=1;b=9}if((b|0)==9){b=0;j=0;do{c[f+20+(j+d<<2)>>2]=c[h+20+(j<<2)>>2];j=j+1|0;}while((j|0)<(i|0))}if((e|0)>=(g|0)){break}h=c[a+20+(e<<2)>>2]|0;d=i+d|0;e=e+1|0}return f|0}function gb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;d=i;e=b;f=i;i=i+12|0;i=i+7&-8;g=c[a+4>>2]|0;if((g|0)==0){f=(c[b+4>>2]|0)-1|0;h=b+12|0;g=(f|0)>0;if(g){k=0;j=1;do{k=k+1|0;j=Z(c[b+8+(k<<2)>>2]|0,j)|0;}while((k|0)<(f|0));k=c[b>>2]|0;m=0;l=1;do{m=m+1|0;l=Z(c[b+8+(m<<2)>>2]|0,l)|0;}while((m|0)<(f|0));l=(l<<2)+20|0}else{l=24;j=1;k=c[b>>2]|0}l=Yb(l)|0;b=l;c[l>>2]=k;c[l+4>>2]=f;if(g){ac(l+8|0,h|0,f<<2)|0}if((j|0)<=0){o=b;i=d;return o|0}ac(l+20|0,e+(((Z(j,c[a+20>>2]|0)|0)<<2)+20)|0,j<<2)|0;o=b;i=d;return o|0}if((g|0)>0){h=0;e=1;do{e=Z(c[a+8+(h<<2)>>2]|0,e)|0;h=h+1|0;}while((h|0)<(g|0))}else{e=1}g=c[b+4>>2]|0;k=b+12|0;j=g-1|0;if((j|0)>0){l=0;h=1;do{l=l+1|0;h=Z(c[b+8+(l<<2)>>2]|0,h)|0;}while((l|0)<(j|0))}else{h=1}j=c[b>>2]|0;c[f>>2]=e;c[f+4>>2]=c[k>>2];c[f+8>>2]=c[b+16>>2];k=f;l=(g|0)>0;if(l){m=1;n=1;o=e;while(1){n=Z(o,n)|0;if((m|0)>=(g|0)){break}o=c[f+(m<<2)>>2]|0;m=m+1|0}f=(n<<2)+20|0}else{f=24}m=Yb(f)|0;f=m;c[m>>2]=j;c[m+4>>2]=g;if(l){ac(m+8|0,k|0,g<<2)|0}if(!((e|0)>0&(h|0)>0)){o=f;i=d;return o|0}g=h<<2;j=0;do{ac(m+((j<<2)+20)|0,b+20+((Z(h,c[a+20+(j<<2)>>2]|0)|0)<<2)|0,g)|0;j=j+1|0;}while((j|0)<(e|0));i=d;return f|0}function hb(a){a=a|0;var b=0,d=0,e=0;if((c[a>>2]&1|0)==0){b=c[a+20>>2]|0;d=Yb((b<<2)+20|0)|0;a=d;c[d>>2]=0;c[d+4>>2]=1;c[d+8>>2]=b;if((b|0)>0){d=0}else{d=a;return d|0}do{c[a+20+(d<<2)>>2]=d;d=d+1|0;}while((d|0)<(b|0));return a|0}else{b=c[(fb(a)|0)+20>>2]|0;d=Yb((b<<2)+20|0)|0;a=d;c[d>>2]=1;c[d+4>>2]=1;c[d+8>>2]=b;if((b|0)>0){d=0}else{d=a;return d|0}do{e=Yb(24)|0;c[e>>2]=0;c[e+4>>2]=0;c[e+20>>2]=d;c[a+20+(d<<2)>>2]=e;d=d+1|0;}while((d|0)<(b|0));return a|0}return 0}function ib(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;i=i+32|0;o=d|0;q=d+16|0;h=c[b+4>>2]|0;p=b+8|0;j=(h|0)>0;if(j){e=0;l=1;do{l=Z(c[b+8+(e<<2)>>2]|0,l)|0;e=e+1|0;}while((e|0)<(h|0))}else{l=1}f=Yb(24)|0;c[f>>2]=0;c[f+4>>2]=0;g=f+20|0;c[g>>2]=0;k=Yb(24)|0;c[k>>2]=0;c[k+4>>2]=0;c[k+20>>2]=0;e=h-1|0;s=b+12|0;if((e|0)>0){n=0;m=1;do{n=n+1|0;m=Z(c[b+8+(n<<2)>>2]|0,m)|0;}while((n|0)<(e|0))}else{m=1}t=a+4|0;r=a+8|0;u=c[a>>2]|0;n=c[b>>2]|0;e=n|u;n=(n&1|0)==0;if((u&1|0)!=0){a=fb(a)|0;if(n){t=ib(a,b)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}else{t=ib(a,fb(b)|0)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}}if(!n){if((h|0)==0){t=ib(a,fb(b)|0)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}u=Yb((l<<2)+20|0)|0;o=u;c[u>>2]=e;c[u+4>>2]=1;c[u+8>>2]=l;if((l|0)>0){e=0}else{u=o;i=d;return u|0}do{c[o+20+(e<<2)>>2]=ib(a,c[b+20+(e<<2)>>2]|0)|0;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}n=c[t>>2]|0;t=(h|0)>1;if((n|0)>1){l=c[r>>2]|0;if(!t){j=1;o=1;p=l;while(1){o=Z(p,o)|0;if((j|0)>=(n|0)){break}p=c[a+8+(j<<2)>>2]|0;j=j+1|0}j=Yb((o<<2)+20|0)|0;o=j;c[j>>2]=e;c[j+4>>2]=n;ac(j+8|0,r|0,n<<2)|0;e=(l|0)>0;if((h|0)==0){if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;k=0;do{c[g>>2]=k;m=ib(gb(f,a)|0,b)|0;if(e){ac(j+((Z(h,k)|0)+20)|0,m+20|0,h)|0}k=k+1|0;}while((k|0)<(l|0));i=d;return o|0}else{if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[g>>2]=m;n=gb(f,a)|0;n=ib(n,gb(k,b)|0)|0;if(e){ac(j+((Z(h,m)|0)+20)|0,n+20|0,h)|0}m=m+1|0;}while((m|0)<(l|0));i=d;return o|0}}r=c[p>>2]|0;t=(r|0)>1;if((l|0)<=1){if(!t){u=gb(k,a)|0;u=ib(u,gb(k,b)|0)|0;i=d;return u|0}if(j){l=1;o=1;n=r;while(1){o=Z(n,o)|0;if((l|0)>=(h|0)){break}n=c[b+8+(l<<2)>>2]|0;l=l+1|0}l=(o<<2)+20|0}else{l=24}l=Yb(l)|0;o=l;c[l>>2]=e;c[l+4>>2]=h;if(j){ac(l+8|0,p|0,h<<2)|0}if((r|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;j=0;do{c[g>>2]=j;m=gb(k,a)|0;m=ib(m,gb(f,b)|0)|0;if(e){ac(l+((Z(h,j)|0)+20)|0,m+20|0,h)|0}j=j+1|0;}while((j|0)<(r|0));i=d;return o|0}if(t){h=(n|0)>(h|0)?n:h;c[o>>2]=l;c[o+4>>2]=c[s>>2];c[o+8>>2]=c[b+16>>2];k=o;j=(h|0)>0;if(j){n=1;q=1;p=l;while(1){q=Z(p,q)|0;if((n|0)>=(h|0)){break}p=c[o+(n<<2)>>2]|0;n=n+1|0}n=(q<<2)+20|0}else{n=24}n=Yb(n)|0;o=n;c[n>>2]=e;c[n+4>>2]=h;if(j){ac(n+8|0,k|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}if((m|0)<=0){e=0;do{c[g>>2]=e;u=gb(f,a)|0;ib(u,gb(f,b)|0)|0;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}e=m<<2;h=0;do{c[g>>2]=h;u=gb(f,a)|0;ac(n+((Z(e,h)|0)+20)|0,(ib(u,gb(f,b)|0)|0)+20|0,e)|0;h=h+1|0;}while((h|0)<(l|0));i=d;return o|0}else{c[q>>2]=l;c[q+4>>2]=c[s>>2];c[q+8>>2]=c[b+16>>2];j=q;h=(n|0)>0;if(h){o=1;p=1;r=l;while(1){p=Z(r,p)|0;if((o|0)>=(n|0)){break}r=c[q+(o<<2)>>2]|0;o=o+1|0}o=(p<<2)+20|0}else{o=24}p=Yb(o)|0;o=p;c[p>>2]=e;c[p+4>>2]=n;if(h){ac(p+8|0,j|0,n<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}if((m|0)<=0){e=0;do{c[g>>2]=e;u=gb(f,a)|0;ib(u,gb(k,b)|0)|0;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}e=m<<2;h=0;do{c[g>>2]=h;u=gb(f,a)|0;ac(p+((Z(e,h)|0)+20)|0,(ib(u,gb(k,b)|0)|0)+20|0,e)|0;h=h+1|0;}while((h|0)<(l|0));i=d;return o|0}}if(t){l=c[p>>2]|0;o=1;r=1;q=l;while(1){r=Z(q,r)|0;if((o|0)>=(h|0)){break}q=c[b+8+(o<<2)>>2]|0;o=o+1|0}q=Yb((r<<2)+20|0)|0;o=q;c[q>>2]=e;c[q+4>>2]=h;if(j){ac(q+8|0,p|0,h<<2)|0}e=(l|0)>0;if((n|0)==0){if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;j=0;do{c[g>>2]=j;k=ib(a,gb(f,b)|0)|0;if(e){ac(q+((Z(h,j)|0)+20)|0,k+20|0,h)|0}j=j+1|0;}while((j|0)<(l|0));i=d;return o|0}else{if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;j=0;do{c[g>>2]=j;m=gb(k,a)|0;m=ib(m,gb(f,b)|0)|0;if(e){ac(q+((Z(h,j)|0)+20)|0,m+20|0,h)|0}j=j+1|0;}while((j|0)<(l|0));i=d;return o|0}}f=(n|0)==0;g=(h|0)==0;if(f|g){if(!g){if(j){f=0;g=1;do{g=Z(c[b+8+(f<<2)>>2]|0,g)|0;f=f+1|0;}while((f|0)<(h|0));f=(g<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,p|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}a=c[a+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(c[b+20+(e<<2)>>2]|0)+a;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}if(f){u=Yb(24)|0;c[u>>2]=e;c[u+4>>2]=0;c[u+20>>2]=(c[b+20>>2]|0)+(c[a+20>>2]|0);i=d;return u|0}f=(n|0)>0;do{if(f){h=0;g=1;do{g=Z(c[a+8+(h<<2)>>2]|0,g)|0;h=h+1|0;}while((h|0)<(n|0));if(f){j=0;h=1}else{h=24;break}do{h=Z(c[a+8+(j<<2)>>2]|0,h)|0;j=j+1|0;}while((j|0)<(n|0));h=(h<<2)+20|0}else{h=24;g=1}}while(0);h=Yb(h)|0;o=h;c[h>>2]=e;c[h+4>>2]=n;if(f){ac(h+8|0,r|0,n<<2)|0}if((g|0)<=0){u=o;i=d;return u|0}b=c[b+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=b+(c[a+20+(e<<2)>>2]|0);e=e+1|0;}while((e|0)<(g|0));i=d;return o|0}f=(c[r>>2]|0)>1;g=c[p>>2]|0;k=(g|0)>1;do{if(f){if(!k){break}if(j){f=1;k=1;while(1){k=Z(g,k)|0;if((f|0)>=(h|0)){break}g=c[b+8+(f<<2)>>2]|0;f=f+1|0}f=(k<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,p|0,h<<2)|0}if((l|0)>0){e=0}else{u=o;i=d;return u|0}do{c[o+20+(e<<2)>>2]=(c[b+20+(e<<2)>>2]|0)+(c[a+20+(e<<2)>>2]|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}else{if(!k){break}if(j){f=1;k=1;while(1){k=Z(g,k)|0;if((f|0)>=(h|0)){break}g=c[b+8+(f<<2)>>2]|0;f=f+1|0}f=(k<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,p|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}a=c[a+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(c[b+20+(e<<2)>>2]|0)+a;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}}while(0);if(j){k=1;m=1;while(1){m=Z(g,m)|0;if((k|0)>=(h|0)){break}g=c[b+8+(k<<2)>>2]|0;k=k+1|0}g=(m<<2)+20|0}else{g=24}g=Yb(g)|0;o=g;c[g>>2]=e;c[g+4>>2]=h;if(j){ac(g+8|0,p|0,h<<2)|0}e=(l|0)>0;if(!f){if(!e){u=o;i=d;return u|0}c[g+20>>2]=(c[b+20>>2]|0)+(c[a+20>>2]|0);u=o;i=d;return u|0}if(!e){u=o;i=d;return u|0}b=c[b+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=b+(c[a+20+(e<<2)>>2]|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}function jb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;i=i+32|0;o=d|0;q=d+16|0;h=c[b+4>>2]|0;p=b+8|0;j=(h|0)>0;if(j){e=0;l=1;do{l=Z(c[b+8+(e<<2)>>2]|0,l)|0;e=e+1|0;}while((e|0)<(h|0))}else{l=1}g=Yb(24)|0;c[g>>2]=0;c[g+4>>2]=0;f=g+20|0;c[f>>2]=0;k=Yb(24)|0;c[k>>2]=0;c[k+4>>2]=0;c[k+20>>2]=0;e=h-1|0;s=b+12|0;if((e|0)>0){n=0;m=1;do{n=n+1|0;m=Z(c[b+8+(n<<2)>>2]|0,m)|0;}while((n|0)<(e|0))}else{m=1}t=a+4|0;r=a+8|0;u=c[a>>2]|0;n=c[b>>2]|0;e=n|u;n=(n&1|0)==0;if((u&1|0)!=0){a=fb(a)|0;if(n){t=jb(a,b)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}else{t=jb(a,fb(b)|0)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}}if(!n){if((h|0)==0){t=jb(a,fb(b)|0)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}u=Yb((l<<2)+20|0)|0;o=u;c[u>>2]=e;c[u+4>>2]=1;c[u+8>>2]=l;if((l|0)>0){e=0}else{u=o;i=d;return u|0}do{c[o+20+(e<<2)>>2]=jb(a,c[b+20+(e<<2)>>2]|0)|0;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}n=c[t>>2]|0;t=(h|0)>1;if((n|0)>1){l=c[r>>2]|0;if(!t){j=1;p=1;o=l;while(1){p=Z(o,p)|0;if((j|0)>=(n|0)){break}o=c[a+8+(j<<2)>>2]|0;j=j+1|0}j=Yb((p<<2)+20|0)|0;o=j;c[j>>2]=e;c[j+4>>2]=n;ac(j+8|0,r|0,n<<2)|0;e=(l|0)>0;if((h|0)==0){if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[f>>2]=m;k=jb(gb(g,a)|0,b)|0;if(e){ac(j+((Z(h,m)|0)+20)|0,k+20|0,h)|0}m=m+1|0;}while((m|0)<(l|0));i=d;return o|0}else{if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;n=0;do{c[f>>2]=n;m=gb(g,a)|0;m=jb(m,gb(k,b)|0)|0;if(e){ac(j+((Z(h,n)|0)+20)|0,m+20|0,h)|0}n=n+1|0;}while((n|0)<(l|0));i=d;return o|0}}r=c[p>>2]|0;t=(r|0)>1;if((l|0)<=1){if(!t){u=gb(k,a)|0;u=jb(u,gb(k,b)|0)|0;i=d;return u|0}if(j){l=1;o=1;n=r;while(1){o=Z(n,o)|0;if((l|0)>=(h|0)){break}n=c[b+8+(l<<2)>>2]|0;l=l+1|0}l=(o<<2)+20|0}else{l=24}l=Yb(l)|0;o=l;c[l>>2]=e;c[l+4>>2]=h;if(j){ac(l+8|0,p|0,h<<2)|0}if((r|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;j=0;do{c[f>>2]=j;m=gb(k,a)|0;m=jb(m,gb(g,b)|0)|0;if(e){ac(l+((Z(h,j)|0)+20)|0,m+20|0,h)|0}j=j+1|0;}while((j|0)<(r|0));i=d;return o|0}if(!t){c[q>>2]=l;c[q+4>>2]=c[s>>2];c[q+8>>2]=c[b+16>>2];j=q;h=(n|0)>0;if(h){o=1;p=1;r=l;while(1){p=Z(r,p)|0;if((o|0)>=(n|0)){break}r=c[q+(o<<2)>>2]|0;o=o+1|0}o=(p<<2)+20|0}else{o=24}p=Yb(o)|0;o=p;c[p>>2]=e;c[p+4>>2]=n;if(h){ac(p+8|0,j|0,n<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;j=0;do{c[f>>2]=j;m=gb(g,a)|0;m=jb(m,gb(k,b)|0)|0;if(e){ac(p+((Z(h,j)|0)+20)|0,m+20|0,h)|0}j=j+1|0;}while((j|0)<(l|0));i=d;return o|0}h=(n|0)>(h|0)?n:h;c[o>>2]=l;c[o+4>>2]=c[s>>2];c[o+8>>2]=c[b+16>>2];k=o;j=(h|0)>0;if(j){n=1;q=1;p=l;while(1){q=Z(p,q)|0;if((n|0)>=(h|0)){break}p=c[o+(n<<2)>>2]|0;n=n+1|0}n=(q<<2)+20|0}else{n=24}n=Yb(n)|0;o=n;c[n>>2]=e;c[n+4>>2]=h;if(j){ac(n+8|0,k|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}if((m|0)<=0){e=0;do{c[f>>2]=e;u=gb(g,a)|0;jb(u,gb(g,b)|0)|0;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}e=m<<2;h=0;do{c[f>>2]=h;u=gb(g,a)|0;ac(n+((Z(e,h)|0)+20)|0,(jb(u,gb(g,b)|0)|0)+20|0,e)|0;h=h+1|0;}while((h|0)<(l|0));i=d;return o|0}if(t){l=c[p>>2]|0;o=1;r=1;q=l;while(1){r=Z(q,r)|0;if((o|0)>=(h|0)){break}q=c[b+8+(o<<2)>>2]|0;o=o+1|0}q=Yb((r<<2)+20|0)|0;o=q;c[q>>2]=e;c[q+4>>2]=h;if(j){ac(q+8|0,p|0,h<<2)|0}e=(l|0)>0;if((n|0)==0){if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;j=0;do{c[f>>2]=j;k=jb(a,gb(g,b)|0)|0;if(e){ac(q+((Z(h,j)|0)+20)|0,k+20|0,h)|0}j=j+1|0;}while((j|0)<(l|0));i=d;return o|0}else{if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;j=0;do{c[f>>2]=j;m=gb(k,a)|0;m=jb(m,gb(g,b)|0)|0;if(e){ac(q+((Z(h,j)|0)+20)|0,m+20|0,h)|0}j=j+1|0;}while((j|0)<(l|0));i=d;return o|0}}f=(n|0)==0;g=(h|0)==0;if(f|g){if(!g){if(j){g=0;f=1;do{f=Z(c[b+8+(g<<2)>>2]|0,f)|0;g=g+1|0;}while((g|0)<(h|0));f=(f<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,p|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}a=c[a+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=a-(c[b+20+(e<<2)>>2]|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}if(f){u=Yb(24)|0;c[u>>2]=e;c[u+4>>2]=0;c[u+20>>2]=(c[a+20>>2]|0)-(c[b+20>>2]|0);i=d;return u|0}f=(n|0)>0;do{if(f){h=0;g=1;do{g=Z(c[a+8+(h<<2)>>2]|0,g)|0;h=h+1|0;}while((h|0)<(n|0));if(f){h=0;j=1}else{h=24;break}do{j=Z(c[a+8+(h<<2)>>2]|0,j)|0;h=h+1|0;}while((h|0)<(n|0));h=(j<<2)+20|0}else{h=24;g=1}}while(0);h=Yb(h)|0;o=h;c[h>>2]=e;c[h+4>>2]=n;if(f){ac(h+8|0,r|0,n<<2)|0}if((g|0)<=0){u=o;i=d;return u|0}b=c[b+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(c[a+20+(e<<2)>>2]|0)-b;e=e+1|0;}while((e|0)<(g|0));i=d;return o|0}f=(c[r>>2]|0)>1;g=c[p>>2]|0;k=(g|0)>1;do{if(f){if(!k){break}if(j){f=1;k=1;while(1){k=Z(g,k)|0;if((f|0)>=(h|0)){break}g=c[b+8+(f<<2)>>2]|0;f=f+1|0}f=(k<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,p|0,h<<2)|0}if((l|0)>0){e=0}else{u=o;i=d;return u|0}do{c[o+20+(e<<2)>>2]=(c[a+20+(e<<2)>>2]|0)-(c[b+20+(e<<2)>>2]|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}else{if(!k){break}if(j){f=1;k=1;while(1){k=Z(g,k)|0;if((f|0)>=(h|0)){break}g=c[b+8+(f<<2)>>2]|0;f=f+1|0}f=(k<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,p|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}a=c[a+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=a-(c[b+20+(e<<2)>>2]|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}}while(0);if(j){k=1;m=1;while(1){m=Z(g,m)|0;if((k|0)>=(h|0)){break}g=c[b+8+(k<<2)>>2]|0;k=k+1|0}g=(m<<2)+20|0}else{g=24}g=Yb(g)|0;o=g;c[g>>2]=e;c[g+4>>2]=h;if(j){ac(g+8|0,p|0,h<<2)|0}e=(l|0)>0;if(!f){if(!e){u=o;i=d;return u|0}c[g+20>>2]=(c[a+20>>2]|0)-(c[b+20>>2]|0);u=o;i=d;return u|0}if(!e){u=o;i=d;return u|0}b=c[b+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(c[a+20+(e<<2)>>2]|0)-b;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}function kb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;i=i+32|0;o=d|0;p=d+16|0;h=c[b+4>>2]|0;q=b+8|0;k=(h|0)>0;if(k){e=0;j=1;do{j=Z(c[b+8+(e<<2)>>2]|0,j)|0;e=e+1|0;}while((e|0)<(h|0))}else{j=1}f=Yb(24)|0;c[f>>2]=0;c[f+4>>2]=0;g=f+20|0;c[g>>2]=0;l=Yb(24)|0;c[l>>2]=0;c[l+4>>2]=0;c[l+20>>2]=0;e=h-1|0;s=b+12|0;if((e|0)>0){n=0;m=1;do{n=n+1|0;m=Z(c[b+8+(n<<2)>>2]|0,m)|0;}while((n|0)<(e|0))}else{m=1}t=a+4|0;r=a+8|0;u=c[a>>2]|0;n=c[b>>2]|0;e=n|u;n=(n&1|0)==0;if((u&1|0)!=0){a=fb(a)|0;if(n){t=kb(a,b)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}else{t=kb(a,fb(b)|0)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}}if(!n){if((h|0)==0){t=kb(a,fb(b)|0)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}u=Yb((j<<2)+20|0)|0;o=u;c[u>>2]=e;c[u+4>>2]=1;c[u+8>>2]=j;if((j|0)>0){e=0}else{u=o;i=d;return u|0}do{c[o+20+(e<<2)>>2]=kb(a,c[b+20+(e<<2)>>2]|0)|0;e=e+1|0;}while((e|0)<(j|0));i=d;return o|0}n=c[t>>2]|0;t=(h|0)>1;if((n|0)>1){j=c[r>>2]|0;if(!t){k=1;o=1;p=j;while(1){o=Z(p,o)|0;if((k|0)>=(n|0)){break}p=c[a+8+(k<<2)>>2]|0;k=k+1|0}k=Yb((o<<2)+20|0)|0;o=k;c[k>>2]=e;c[k+4>>2]=n;ac(k+8|0,r|0,n<<2)|0;e=(j|0)>0;if((h|0)==0){if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;l=0;do{c[g>>2]=l;m=kb(gb(f,a)|0,b)|0;if(e){ac(k+((Z(h,l)|0)+20)|0,m+20|0,h)|0}l=l+1|0;}while((l|0)<(j|0));i=d;return o|0}else{if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[g>>2]=m;n=gb(f,a)|0;n=kb(n,gb(l,b)|0)|0;if(e){ac(k+((Z(h,m)|0)+20)|0,n+20|0,h)|0}m=m+1|0;}while((m|0)<(j|0));i=d;return o|0}}r=c[q>>2]|0;t=(r|0)>1;if((j|0)<=1){if(!t){u=gb(l,a)|0;u=kb(u,gb(l,b)|0)|0;i=d;return u|0}if(k){j=1;o=1;n=r;while(1){o=Z(n,o)|0;if((j|0)>=(h|0)){break}n=c[b+8+(j<<2)>>2]|0;j=j+1|0}j=(o<<2)+20|0}else{j=24}j=Yb(j)|0;o=j;c[j>>2]=e;c[j+4>>2]=h;if(k){ac(j+8|0,q|0,h<<2)|0}if((r|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;k=0;do{c[g>>2]=k;m=gb(l,a)|0;m=kb(m,gb(f,b)|0)|0;if(e){ac(j+((Z(h,k)|0)+20)|0,m+20|0,h)|0}k=k+1|0;}while((k|0)<(r|0));i=d;return o|0}if(t){h=(n|0)>(h|0)?n:h;c[o>>2]=j;c[o+4>>2]=c[s>>2];c[o+8>>2]=c[b+16>>2];k=o;l=(h|0)>0;if(l){n=1;p=1;q=j;while(1){p=Z(q,p)|0;if((n|0)>=(h|0)){break}q=c[o+(n<<2)>>2]|0;n=n+1|0}n=(p<<2)+20|0}else{n=24}n=Yb(n)|0;o=n;c[n>>2]=e;c[n+4>>2]=h;if(l){ac(n+8|0,k|0,h<<2)|0}if((j|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;l=0;do{c[g>>2]=l;k=gb(f,a)|0;k=kb(k,gb(f,b)|0)|0;if(e){ac(n+((Z(h,l)|0)+20)|0,k+20|0,h)|0}l=l+1|0;}while((l|0)<(j|0));i=d;return o|0}else{c[p>>2]=j;c[p+4>>2]=c[s>>2];c[p+8>>2]=c[b+16>>2];h=p;k=(n|0)>0;if(k){o=1;r=1;q=j;while(1){r=Z(q,r)|0;if((o|0)>=(n|0)){break}q=c[p+(o<<2)>>2]|0;o=o+1|0}o=(r<<2)+20|0}else{o=24}p=Yb(o)|0;o=p;c[p>>2]=e;c[p+4>>2]=n;if(k){ac(p+8|0,h|0,n<<2)|0}if((j|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;k=0;do{c[g>>2]=k;m=gb(f,a)|0;m=kb(m,gb(l,b)|0)|0;if(e){ac(p+((Z(h,k)|0)+20)|0,m+20|0,h)|0}k=k+1|0;}while((k|0)<(j|0));i=d;return o|0}}if(t){j=c[q>>2]|0;o=1;p=1;r=j;while(1){p=Z(r,p)|0;if((o|0)>=(h|0)){break}r=c[b+8+(o<<2)>>2]|0;o=o+1|0}p=Yb((p<<2)+20|0)|0;o=p;c[p>>2]=e;c[p+4>>2]=h;if(k){ac(p+8|0,q|0,h<<2)|0}e=(j|0)>0;if((n|0)==0){if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;k=0;do{c[g>>2]=k;l=kb(a,gb(f,b)|0)|0;if(e){ac(p+((Z(h,k)|0)+20)|0,l+20|0,h)|0}k=k+1|0;}while((k|0)<(j|0));i=d;return o|0}else{if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;k=0;do{c[g>>2]=k;m=gb(l,a)|0;m=kb(m,gb(f,b)|0)|0;if(e){ac(p+((Z(h,k)|0)+20)|0,m+20|0,h)|0}k=k+1|0;}while((k|0)<(j|0));i=d;return o|0}}g=(n|0)==0;f=(h|0)==0;if(g|f){if(!f){if(k){f=0;g=1;do{g=Z(c[b+8+(f<<2)>>2]|0,g)|0;f=f+1|0;}while((f|0)<(h|0));f=(g<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(k){ac(f+8|0,q|0,h<<2)|0}if((j|0)<=0){u=o;i=d;return u|0}a=(c[a+20>>2]|0)==0;f=0;do{if(a){e=0}else{e=(c[b+20+(f<<2)>>2]|0)!=0|0}c[o+20+(f<<2)>>2]=e;f=f+1|0;}while((f|0)<(j|0));i=d;return o|0}if(g){f=Yb(24)|0;c[f>>2]=e;c[f+4>>2]=0;if((c[a+20>>2]|0)==0){b=0}else{b=(c[b+20>>2]|0)!=0|0}c[f+20>>2]=b;u=f;i=d;return u|0}g=(n|0)>0;do{if(g){h=0;f=1;do{f=Z(c[a+8+(h<<2)>>2]|0,f)|0;h=h+1|0;}while((h|0)<(n|0));if(g){j=0;h=1}else{h=24;break}do{h=Z(c[a+8+(j<<2)>>2]|0,h)|0;j=j+1|0;}while((j|0)<(n|0));h=(h<<2)+20|0}else{h=24;f=1}}while(0);h=Yb(h)|0;o=h;c[h>>2]=e;c[h+4>>2]=n;if(g){ac(h+8|0,r|0,n<<2)|0}if((f|0)<=0){u=o;i=d;return u|0}b=b+20|0;g=0;do{if((c[a+20+(g<<2)>>2]|0)==0){e=0}else{e=(c[b>>2]|0)!=0|0}c[o+20+(g<<2)>>2]=e;g=g+1|0;}while((g|0)<(f|0));i=d;return o|0}g=(c[r>>2]|0)>1;f=c[q>>2]|0;l=(f|0)>1;do{if(g){if(!l){break}if(k){g=1;l=1;while(1){l=Z(f,l)|0;if((g|0)>=(h|0)){break}f=c[b+8+(g<<2)>>2]|0;g=g+1|0}f=(l<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(k){ac(f+8|0,q|0,h<<2)|0}if((j|0)>0){f=0}else{u=o;i=d;return u|0}do{if((c[a+20+(f<<2)>>2]|0)==0){e=0}else{e=(c[b+20+(f<<2)>>2]|0)!=0|0}c[o+20+(f<<2)>>2]=e;f=f+1|0;}while((f|0)<(j|0));i=d;return o|0}else{if(!l){break}if(k){g=1;l=1;while(1){l=Z(f,l)|0;if((g|0)>=(h|0)){break}f=c[b+8+(g<<2)>>2]|0;g=g+1|0}f=(l<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(k){ac(f+8|0,q|0,h<<2)|0}if((j|0)<=0){u=o;i=d;return u|0}a=(c[a+20>>2]|0)==0;f=0;do{if(a){e=0}else{e=(c[b+20+(f<<2)>>2]|0)!=0|0}c[o+20+(f<<2)>>2]=e;f=f+1|0;}while((f|0)<(j|0));i=d;return o|0}}while(0);if(k){l=1;m=1;while(1){m=Z(f,m)|0;if((l|0)>=(h|0)){break}f=c[b+8+(l<<2)>>2]|0;l=l+1|0}f=(m<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(k){ac(f+8|0,q|0,h<<2)|0}e=(j|0)>0;if(!g){if(!e){u=o;i=d;return u|0}e=f+20|0;b=b+20|0;if((c[a+20>>2]|0)==0){b=0}else{a=0;while(1){a=a+1|0;if((a|0)>=(j|0)){b=(c[b>>2]|0)!=0|0;break}}}c[e>>2]=b;u=o;i=d;return u|0}if(!e){u=o;i=d;return u|0}b=b+20|0;e=0;do{if((c[a+20+(e<<2)>>2]|0)==0){f=0}else{f=(c[b>>2]|0)!=0|0}c[o+20+(e<<2)>>2]=f;e=e+1|0;}while((e|0)<(j|0));i=d;return o|0}function lb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;i=i+32|0;o=d|0;q=d+16|0;h=c[b+4>>2]|0;p=b+8|0;k=(h|0)>0;if(k){e=0;j=1;do{j=Z(c[b+8+(e<<2)>>2]|0,j)|0;e=e+1|0;}while((e|0)<(h|0))}else{j=1}f=Yb(24)|0;c[f>>2]=0;c[f+4>>2]=0;g=f+20|0;c[g>>2]=0;l=Yb(24)|0;c[l>>2]=0;c[l+4>>2]=0;c[l+20>>2]=0;e=h-1|0;s=b+12|0;if((e|0)>0){n=0;m=1;do{n=n+1|0;m=Z(c[b+8+(n<<2)>>2]|0,m)|0;}while((n|0)<(e|0))}else{m=1}t=a+4|0;r=a+8|0;u=c[a>>2]|0;n=c[b>>2]|0;e=n|u;n=(n&1|0)==0;if((u&1|0)!=0){a=fb(a)|0;if(n){t=lb(a,b)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}else{t=lb(a,fb(b)|0)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}}if(!n){if((h|0)==0){t=lb(a,fb(b)|0)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}u=Yb((j<<2)+20|0)|0;o=u;c[u>>2]=e;c[u+4>>2]=1;c[u+8>>2]=j;if((j|0)>0){e=0}else{u=o;i=d;return u|0}do{c[o+20+(e<<2)>>2]=lb(a,c[b+20+(e<<2)>>2]|0)|0;e=e+1|0;}while((e|0)<(j|0));i=d;return o|0}n=c[t>>2]|0;t=(h|0)>1;if((n|0)>1){j=c[r>>2]|0;if(!t){k=1;p=1;o=j;while(1){p=Z(o,p)|0;if((k|0)>=(n|0)){break}o=c[a+8+(k<<2)>>2]|0;k=k+1|0}k=Yb((p<<2)+20|0)|0;o=k;c[k>>2]=e;c[k+4>>2]=n;ac(k+8|0,r|0,n<<2)|0;e=(j|0)>0;if((h|0)==0){if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;l=0;do{c[g>>2]=l;m=lb(gb(f,a)|0,b)|0;if(e){ac(k+((Z(h,l)|0)+20)|0,m+20|0,h)|0}l=l+1|0;}while((l|0)<(j|0));i=d;return o|0}else{if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[g>>2]=m;n=gb(f,a)|0;n=lb(n,gb(l,b)|0)|0;if(e){ac(k+((Z(h,m)|0)+20)|0,n+20|0,h)|0}m=m+1|0;}while((m|0)<(j|0));i=d;return o|0}}r=c[p>>2]|0;t=(r|0)>1;if((j|0)<=1){if(!t){u=gb(l,a)|0;u=lb(u,gb(l,b)|0)|0;i=d;return u|0}if(k){j=1;o=1;n=r;while(1){o=Z(n,o)|0;if((j|0)>=(h|0)){break}n=c[b+8+(j<<2)>>2]|0;j=j+1|0}j=(o<<2)+20|0}else{j=24}j=Yb(j)|0;o=j;c[j>>2]=e;c[j+4>>2]=h;if(k){ac(j+8|0,p|0,h<<2)|0}if((r|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;k=0;do{c[g>>2]=k;m=gb(l,a)|0;m=lb(m,gb(f,b)|0)|0;if(e){ac(j+((Z(h,k)|0)+20)|0,m+20|0,h)|0}k=k+1|0;}while((k|0)<(r|0));i=d;return o|0}if(t){h=(n|0)>(h|0)?n:h;c[o>>2]=j;c[o+4>>2]=c[s>>2];c[o+8>>2]=c[b+16>>2];k=o;l=(h|0)>0;if(l){n=1;p=1;q=j;while(1){p=Z(q,p)|0;if((n|0)>=(h|0)){break}q=c[o+(n<<2)>>2]|0;n=n+1|0}n=(p<<2)+20|0}else{n=24}n=Yb(n)|0;o=n;c[n>>2]=e;c[n+4>>2]=h;if(l){ac(n+8|0,k|0,h<<2)|0}if((j|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;l=0;do{c[g>>2]=l;k=gb(f,a)|0;k=lb(k,gb(f,b)|0)|0;if(e){ac(n+((Z(h,l)|0)+20)|0,k+20|0,h)|0}l=l+1|0;}while((l|0)<(j|0));i=d;return o|0}else{c[q>>2]=j;c[q+4>>2]=c[s>>2];c[q+8>>2]=c[b+16>>2];k=q;h=(n|0)>0;if(h){o=1;r=1;p=j;while(1){r=Z(p,r)|0;if((o|0)>=(n|0)){break}p=c[q+(o<<2)>>2]|0;o=o+1|0}o=(r<<2)+20|0}else{o=24}p=Yb(o)|0;o=p;c[p>>2]=e;c[p+4>>2]=n;if(h){ac(p+8|0,k|0,n<<2)|0}if((j|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;k=0;do{c[g>>2]=k;m=gb(f,a)|0;m=lb(m,gb(l,b)|0)|0;if(e){ac(p+((Z(h,k)|0)+20)|0,m+20|0,h)|0}k=k+1|0;}while((k|0)<(j|0));i=d;return o|0}}if(t){j=c[p>>2]|0;o=1;r=1;q=j;while(1){r=Z(q,r)|0;if((o|0)>=(h|0)){break}q=c[b+8+(o<<2)>>2]|0;o=o+1|0}q=Yb((r<<2)+20|0)|0;o=q;c[q>>2]=e;c[q+4>>2]=h;if(k){ac(q+8|0,p|0,h<<2)|0}e=(j|0)>0;if((n|0)==0){if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;k=0;do{c[g>>2]=k;l=lb(a,gb(f,b)|0)|0;if(e){ac(q+((Z(h,k)|0)+20)|0,l+20|0,h)|0}k=k+1|0;}while((k|0)<(j|0));i=d;return o|0}else{if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[g>>2]=m;k=gb(l,a)|0;k=lb(k,gb(f,b)|0)|0;if(e){ac(q+((Z(h,m)|0)+20)|0,k+20|0,h)|0}m=m+1|0;}while((m|0)<(j|0));i=d;return o|0}}g=(n|0)==0;f=(h|0)==0;if(g|f){if(!f){if(k){g=0;f=1;do{f=Z(c[b+8+(g<<2)>>2]|0,f)|0;g=g+1|0;}while((g|0)<(h|0));f=(f<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(k){ac(f+8|0,p|0,h<<2)|0}if((j|0)<=0){u=o;i=d;return u|0}a=(c[a+20>>2]|0)==0;f=0;do{if(a){e=(c[b+20+(f<<2)>>2]|0)!=0|0}else{e=1}c[o+20+(f<<2)>>2]=e;f=f+1|0;}while((f|0)<(j|0));i=d;return o|0}if(g){f=Yb(24)|0;c[f>>2]=e;c[f+4>>2]=0;if((c[a+20>>2]|0)==0){b=(c[b+20>>2]|0)!=0|0}else{b=1}c[f+20>>2]=b;u=f;i=d;return u|0}g=(n|0)>0;do{if(g){h=0;f=1;do{f=Z(c[a+8+(h<<2)>>2]|0,f)|0;h=h+1|0;}while((h|0)<(n|0));if(g){h=0;j=1}else{h=24;break}do{j=Z(c[a+8+(h<<2)>>2]|0,j)|0;h=h+1|0;}while((h|0)<(n|0));h=(j<<2)+20|0}else{h=24;f=1}}while(0);h=Yb(h)|0;o=h;c[h>>2]=e;c[h+4>>2]=n;if(g){ac(h+8|0,r|0,n<<2)|0}if((f|0)<=0){u=o;i=d;return u|0}b=b+20|0;g=0;do{if((c[a+20+(g<<2)>>2]|0)==0){e=(c[b>>2]|0)!=0|0}else{e=1}c[o+20+(g<<2)>>2]=e;g=g+1|0;}while((g|0)<(f|0));i=d;return o|0}g=(c[r>>2]|0)>1;f=c[p>>2]|0;l=(f|0)>1;do{if(g){if(!l){break}if(k){g=1;l=1;while(1){l=Z(f,l)|0;if((g|0)>=(h|0)){break}f=c[b+8+(g<<2)>>2]|0;g=g+1|0}f=(l<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(k){ac(f+8|0,p|0,h<<2)|0}if((j|0)>0){f=0}else{u=o;i=d;return u|0}do{if((c[a+20+(f<<2)>>2]|0)==0){e=(c[b+20+(f<<2)>>2]|0)!=0|0}else{e=1}c[o+20+(f<<2)>>2]=e;f=f+1|0;}while((f|0)<(j|0));i=d;return o|0}else{if(!l){break}if(k){g=1;l=1;while(1){l=Z(f,l)|0;if((g|0)>=(h|0)){break}f=c[b+8+(g<<2)>>2]|0;g=g+1|0}f=(l<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(k){ac(f+8|0,p|0,h<<2)|0}if((j|0)<=0){u=o;i=d;return u|0}a=(c[a+20>>2]|0)==0;f=0;do{if(a){e=(c[b+20+(f<<2)>>2]|0)!=0|0}else{e=1}c[o+20+(f<<2)>>2]=e;f=f+1|0;}while((f|0)<(j|0));i=d;return o|0}}while(0);if(k){l=1;m=1;while(1){m=Z(f,m)|0;if((l|0)>=(h|0)){break}f=c[b+8+(l<<2)>>2]|0;l=l+1|0}f=(m<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(k){ac(f+8|0,p|0,h<<2)|0}e=(j|0)>0;if(g){if(!e){u=o;i=d;return u|0}b=b+20|0;e=0;do{if((c[a+20+(e<<2)>>2]|0)==0){f=(c[b>>2]|0)!=0|0}else{f=1}c[o+20+(e<<2)>>2]=f;e=e+1|0;}while((e|0)<(j|0));i=d;return o|0}if(!e){u=o;i=d;return u|0}a=(c[a+20>>2]|0)==0;b=b+20|0;f=f+20|0;g=0;do{if(a){e=(c[b>>2]|0)!=0|0}else{e=1}g=g+1|0;}while((g|0)<(j|0));c[f>>2]=e;u=o;i=d;return u|0}function mb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;i=i+32|0;o=d|0;p=d+16|0;h=c[b+4>>2]|0;q=b+8|0;j=(h|0)>0;if(j){e=0;l=1;do{l=Z(c[b+8+(e<<2)>>2]|0,l)|0;e=e+1|0;}while((e|0)<(h|0))}else{l=1}g=Yb(24)|0;c[g>>2]=0;c[g+4>>2]=0;f=g+20|0;c[f>>2]=0;k=Yb(24)|0;c[k>>2]=0;c[k+4>>2]=0;c[k+20>>2]=0;e=h-1|0;s=b+12|0;if((e|0)>0){n=0;m=1;do{n=n+1|0;m=Z(c[b+8+(n<<2)>>2]|0,m)|0;}while((n|0)<(e|0))}else{m=1}t=a+4|0;r=a+8|0;u=c[a>>2]|0;n=c[b>>2]|0;e=n|u;n=(n&1|0)==0;if((u&1|0)!=0){a=fb(a)|0;if(n){t=mb(a,b)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}else{t=mb(a,fb(b)|0)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}}if(!n){if((h|0)==0){t=mb(a,fb(b)|0)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}u=Yb((l<<2)+20|0)|0;o=u;c[u>>2]=e;c[u+4>>2]=1;c[u+8>>2]=l;if((l|0)>0){e=0}else{u=o;i=d;return u|0}do{c[o+20+(e<<2)>>2]=mb(a,c[b+20+(e<<2)>>2]|0)|0;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}n=c[t>>2]|0;t=(h|0)>1;if((n|0)>1){l=c[r>>2]|0;if(!t){j=1;p=1;o=l;while(1){p=Z(o,p)|0;if((j|0)>=(n|0)){break}o=c[a+8+(j<<2)>>2]|0;j=j+1|0}j=Yb((p<<2)+20|0)|0;o=j;c[j>>2]=e;c[j+4>>2]=n;ac(j+8|0,r|0,n<<2)|0;e=(l|0)>0;if((h|0)==0){if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[f>>2]=m;k=mb(gb(g,a)|0,b)|0;if(e){ac(j+((Z(h,m)|0)+20)|0,k+20|0,h)|0}m=m+1|0;}while((m|0)<(l|0));i=d;return o|0}else{if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[f>>2]=m;n=gb(g,a)|0;n=mb(n,gb(k,b)|0)|0;if(e){ac(j+((Z(h,m)|0)+20)|0,n+20|0,h)|0}m=m+1|0;}while((m|0)<(l|0));i=d;return o|0}}r=c[q>>2]|0;t=(r|0)>1;if((l|0)<=1){if(!t){u=gb(k,a)|0;u=mb(u,gb(k,b)|0)|0;i=d;return u|0}if(j){l=1;n=1;o=r;while(1){n=Z(o,n)|0;if((l|0)>=(h|0)){break}o=c[b+8+(l<<2)>>2]|0;l=l+1|0}l=(n<<2)+20|0}else{l=24}l=Yb(l)|0;o=l;c[l>>2]=e;c[l+4>>2]=h;if(j){ac(l+8|0,q|0,h<<2)|0}if((r|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;j=0;do{c[f>>2]=j;m=gb(k,a)|0;m=mb(m,gb(g,b)|0)|0;if(e){ac(l+((Z(h,j)|0)+20)|0,m+20|0,h)|0}j=j+1|0;}while((j|0)<(r|0));i=d;return o|0}if(t){h=(n|0)>(h|0)?n:h;c[o>>2]=l;c[o+4>>2]=c[s>>2];c[o+8>>2]=c[b+16>>2];k=o;j=(h|0)>0;if(j){n=1;q=1;p=l;while(1){q=Z(p,q)|0;if((n|0)>=(h|0)){break}p=c[o+(n<<2)>>2]|0;n=n+1|0}n=(q<<2)+20|0}else{n=24}n=Yb(n)|0;o=n;c[n>>2]=e;c[n+4>>2]=h;if(j){ac(n+8|0,k|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;k=0;do{c[f>>2]=k;j=gb(g,a)|0;j=mb(j,gb(g,b)|0)|0;if(e){ac(n+((Z(h,k)|0)+20)|0,j+20|0,h)|0}k=k+1|0;}while((k|0)<(l|0));i=d;return o|0}else{c[p>>2]=l;c[p+4>>2]=c[s>>2];c[p+8>>2]=c[b+16>>2];j=p;h=(n|0)>0;if(h){o=1;q=1;r=l;while(1){q=Z(r,q)|0;if((o|0)>=(n|0)){break}r=c[p+(o<<2)>>2]|0;o=o+1|0}o=(q<<2)+20|0}else{o=24}p=Yb(o)|0;o=p;c[p>>2]=e;c[p+4>>2]=n;if(h){ac(p+8|0,j|0,n<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;j=0;do{c[f>>2]=j;m=gb(g,a)|0;m=mb(m,gb(k,b)|0)|0;if(e){ac(p+((Z(h,j)|0)+20)|0,m+20|0,h)|0}j=j+1|0;}while((j|0)<(l|0));i=d;return o|0}}if(t){l=c[q>>2]|0;o=1;p=1;r=l;while(1){p=Z(r,p)|0;if((o|0)>=(h|0)){break}r=c[b+8+(o<<2)>>2]|0;o=o+1|0}p=Yb((p<<2)+20|0)|0;o=p;c[p>>2]=e;c[p+4>>2]=h;if(j){ac(p+8|0,q|0,h<<2)|0}e=(l|0)>0;if((n|0)==0){if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;k=0;do{c[f>>2]=k;j=mb(a,gb(g,b)|0)|0;if(e){ac(p+((Z(h,k)|0)+20)|0,j+20|0,h)|0}k=k+1|0;}while((k|0)<(l|0));i=d;return o|0}else{if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[f>>2]=m;j=gb(k,a)|0;j=mb(j,gb(g,b)|0)|0;if(e){ac(p+((Z(h,m)|0)+20)|0,j+20|0,h)|0}m=m+1|0;}while((m|0)<(l|0));i=d;return o|0}}g=(n|0)==0;f=(h|0)==0;if(g|f){if(!f){if(j){f=0;g=1;do{g=Z(c[b+8+(f<<2)>>2]|0,g)|0;f=f+1|0;}while((f|0)<(h|0));f=(g<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,q|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}a=c[a+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=Z(c[b+20+(e<<2)>>2]|0,a)|0;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}if(g){u=Yb(24)|0;c[u>>2]=e;c[u+4>>2]=0;c[u+20>>2]=Z(c[b+20>>2]|0,c[a+20>>2]|0)|0;i=d;return u|0}f=(n|0)>0;do{if(f){h=0;g=1;do{g=Z(c[a+8+(h<<2)>>2]|0,g)|0;h=h+1|0;}while((h|0)<(n|0));if(f){j=0;h=1}else{h=24;break}do{h=Z(c[a+8+(j<<2)>>2]|0,h)|0;j=j+1|0;}while((j|0)<(n|0));h=(h<<2)+20|0}else{h=24;g=1}}while(0);h=Yb(h)|0;o=h;c[h>>2]=e;c[h+4>>2]=n;if(f){ac(h+8|0,r|0,n<<2)|0}if((g|0)<=0){u=o;i=d;return u|0}b=c[b+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=Z(b,c[a+20+(e<<2)>>2]|0)|0;e=e+1|0;}while((e|0)<(g|0));i=d;return o|0}f=(c[r>>2]|0)>1;g=c[q>>2]|0;k=(g|0)>1;do{if(f){if(!k){break}if(j){f=1;k=1;while(1){k=Z(g,k)|0;if((f|0)>=(h|0)){break}g=c[b+8+(f<<2)>>2]|0;f=f+1|0}f=(k<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,q|0,h<<2)|0}if((l|0)>0){e=0}else{u=o;i=d;return u|0}do{c[o+20+(e<<2)>>2]=Z(c[b+20+(e<<2)>>2]|0,c[a+20+(e<<2)>>2]|0)|0;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}else{if(!k){break}if(j){f=1;k=1;while(1){k=Z(g,k)|0;if((f|0)>=(h|0)){break}g=c[b+8+(f<<2)>>2]|0;f=f+1|0}f=(k<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,q|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}a=c[a+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=Z(c[b+20+(e<<2)>>2]|0,a)|0;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}}while(0);if(j){k=1;m=1;while(1){m=Z(g,m)|0;if((k|0)>=(h|0)){break}g=c[b+8+(k<<2)>>2]|0;k=k+1|0}g=(m<<2)+20|0}else{g=24}g=Yb(g)|0;o=g;c[g>>2]=e;c[g+4>>2]=h;if(j){ac(g+8|0,q|0,h<<2)|0}e=(l|0)>0;if(!f){if(!e){u=o;i=d;return u|0}c[g+20>>2]=Z(c[b+20>>2]|0,c[a+20>>2]|0)|0;u=o;i=d;return u|0}if(!e){u=o;i=d;return u|0}b=c[b+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=Z(b,c[a+20+(e<<2)>>2]|0)|0;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}function nb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;a:while(1){h=a|0;while(1){g=b+4|0;j=c[g>>2]|0;i=b+8|0;k=(j|0)>0;if(k){f=0;e=1;do{e=Z(c[b+8+(f<<2)>>2]|0,e)|0;f=f+1|0;}while((f|0)<(j|0));f=0;l=1;do{l=Z(c[b+8+(f<<2)>>2]|0,l)|0;f=f+1|0;}while((f|0)<(j|0));f=(l<<2)+20|0}else{f=24;e=1}l=Yb(f)|0;f=l;c[l>>2]=0;c[l+4>>2]=j;if(k){ac(l+8|0,i|0,j<<2)|0}i=(c[b>>2]|0)==0;if((c[h>>2]|0)!=0){break}if(i){break a}b=fb(b)|0}a=fb(a)|0;if(!i){d=13;break}}if((d|0)==13){k=nb(a,fb(b)|0)|0;j=c[k>>2]|1;l=Yb(24)|0;c[l>>2]=j;c[l+4>>2]=0;c[l+20>>2]=k;return l|0}d=c[a+4>>2]|0;g=(c[g>>2]|0)==0;if((d|0)==0){if(g){c[l+20>>2]=~~+O(+(+(c[a+20>>2]|0)),+(+(c[b+20>>2]|0)));l=f;return l|0}if((e|0)<=0){l=f;return l|0}a=c[a+20>>2]|0;d=0;do{c[f+20+(d<<2)>>2]=~~+O(+(+(a|0)),+(+(c[b+20+(d<<2)>>2]|0)));d=d+1|0;}while((d|0)<(e|0));return f|0}if(!g){if((e|0)>0){d=0}else{l=f;return l|0}do{c[f+20+(d<<2)>>2]=~~+O(+(+(c[a+20+(d<<2)>>2]|0)),+(+(c[b+20+(d<<2)>>2]|0)));d=d+1|0;}while((d|0)<(e|0));return f|0}f=a+8|0;e=(d|0)>0;do{if(e){h=0;g=1;do{g=Z(c[a+8+(h<<2)>>2]|0,g)|0;h=h+1|0;}while((h|0)<(d|0));if(e){i=0;h=1}else{h=24;i=f;break}do{h=Z(c[a+8+(i<<2)>>2]|0,h)|0;i=i+1|0;}while((i|0)<(d|0));h=(h<<2)+20|0;i=f}else{h=24;g=1;i=f}}while(0);h=Yb(h)|0;f=h;c[h>>2]=0;c[h+4>>2]=d;if(e){ac(h+8|0,i|0,d<<2)|0}if((g|0)<=0){l=f;return l|0}b=b+20|0;d=0;do{c[f+20+(d<<2)>>2]=~~+O(+(+(c[a+20+(d<<2)>>2]|0)),+(+(c[b>>2]|0)));d=d+1|0;}while((d|0)<(g|0));return f|0}function ob(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;i=i+32|0;o=d|0;p=d+16|0;h=c[b+4>>2]|0;q=b+8|0;j=(h|0)>0;if(j){e=0;l=1;do{l=Z(c[b+8+(e<<2)>>2]|0,l)|0;e=e+1|0;}while((e|0)<(h|0))}else{l=1}g=Yb(24)|0;c[g>>2]=0;c[g+4>>2]=0;f=g+20|0;c[f>>2]=0;k=Yb(24)|0;c[k>>2]=0;c[k+4>>2]=0;c[k+20>>2]=0;e=h-1|0;s=b+12|0;if((e|0)>0){n=0;m=1;do{n=n+1|0;m=Z(c[b+8+(n<<2)>>2]|0,m)|0;}while((n|0)<(e|0))}else{m=1}t=a+4|0;r=a+8|0;u=c[a>>2]|0;n=c[b>>2]|0;e=n|u;n=(n&1|0)==0;if((u&1|0)!=0){a=fb(a)|0;if(n){t=ob(a,b)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}else{t=ob(a,fb(b)|0)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}}if(!n){if((h|0)==0){t=ob(a,fb(b)|0)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}u=Yb((l<<2)+20|0)|0;o=u;c[u>>2]=e;c[u+4>>2]=1;c[u+8>>2]=l;if((l|0)>0){e=0}else{u=o;i=d;return u|0}do{c[o+20+(e<<2)>>2]=ob(a,c[b+20+(e<<2)>>2]|0)|0;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}n=c[t>>2]|0;t=(h|0)>1;if((n|0)>1){l=c[r>>2]|0;if(!t){j=1;p=1;o=l;while(1){p=Z(o,p)|0;if((j|0)>=(n|0)){break}o=c[a+8+(j<<2)>>2]|0;j=j+1|0}j=Yb((p<<2)+20|0)|0;o=j;c[j>>2]=e;c[j+4>>2]=n;ac(j+8|0,r|0,n<<2)|0;e=(l|0)>0;if((h|0)==0){if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[f>>2]=m;k=ob(gb(g,a)|0,b)|0;if(e){ac(j+((Z(h,m)|0)+20)|0,k+20|0,h)|0}m=m+1|0;}while((m|0)<(l|0));i=d;return o|0}else{if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[f>>2]=m;n=gb(g,a)|0;n=ob(n,gb(k,b)|0)|0;if(e){ac(j+((Z(h,m)|0)+20)|0,n+20|0,h)|0}m=m+1|0;}while((m|0)<(l|0));i=d;return o|0}}r=c[q>>2]|0;t=(r|0)>1;if((l|0)<=1){if(!t){u=gb(k,a)|0;u=ob(u,gb(k,b)|0)|0;i=d;return u|0}if(j){l=1;n=1;o=r;while(1){n=Z(o,n)|0;if((l|0)>=(h|0)){break}o=c[b+8+(l<<2)>>2]|0;l=l+1|0}l=(n<<2)+20|0}else{l=24}l=Yb(l)|0;o=l;c[l>>2]=e;c[l+4>>2]=h;if(j){ac(l+8|0,q|0,h<<2)|0}if((r|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;j=0;do{c[f>>2]=j;m=gb(k,a)|0;m=ob(m,gb(g,b)|0)|0;if(e){ac(l+((Z(h,j)|0)+20)|0,m+20|0,h)|0}j=j+1|0;}while((j|0)<(r|0));i=d;return o|0}if(t){h=(n|0)>(h|0)?n:h;c[o>>2]=l;c[o+4>>2]=c[s>>2];c[o+8>>2]=c[b+16>>2];k=o;j=(h|0)>0;if(j){n=1;q=1;p=l;while(1){q=Z(p,q)|0;if((n|0)>=(h|0)){break}p=c[o+(n<<2)>>2]|0;n=n+1|0}n=(q<<2)+20|0}else{n=24}n=Yb(n)|0;o=n;c[n>>2]=e;c[n+4>>2]=h;if(j){ac(n+8|0,k|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;k=0;do{c[f>>2]=k;j=gb(g,a)|0;j=ob(j,gb(g,b)|0)|0;if(e){ac(n+((Z(h,k)|0)+20)|0,j+20|0,h)|0}k=k+1|0;}while((k|0)<(l|0));i=d;return o|0}else{c[p>>2]=l;c[p+4>>2]=c[s>>2];c[p+8>>2]=c[b+16>>2];j=p;h=(n|0)>0;if(h){o=1;q=1;r=l;while(1){q=Z(r,q)|0;if((o|0)>=(n|0)){break}r=c[p+(o<<2)>>2]|0;o=o+1|0}o=(q<<2)+20|0}else{o=24}p=Yb(o)|0;o=p;c[p>>2]=e;c[p+4>>2]=n;if(h){ac(p+8|0,j|0,n<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;j=0;do{c[f>>2]=j;m=gb(g,a)|0;m=ob(m,gb(k,b)|0)|0;if(e){ac(p+((Z(h,j)|0)+20)|0,m+20|0,h)|0}j=j+1|0;}while((j|0)<(l|0));i=d;return o|0}}if(t){l=c[q>>2]|0;o=1;p=1;r=l;while(1){p=Z(r,p)|0;if((o|0)>=(h|0)){break}r=c[b+8+(o<<2)>>2]|0;o=o+1|0}p=Yb((p<<2)+20|0)|0;o=p;c[p>>2]=e;c[p+4>>2]=h;if(j){ac(p+8|0,q|0,h<<2)|0}e=(l|0)>0;if((n|0)==0){if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;k=0;do{c[f>>2]=k;j=ob(a,gb(g,b)|0)|0;if(e){ac(p+((Z(h,k)|0)+20)|0,j+20|0,h)|0}k=k+1|0;}while((k|0)<(l|0));i=d;return o|0}else{if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[f>>2]=m;j=gb(k,a)|0;j=ob(j,gb(g,b)|0)|0;if(e){ac(p+((Z(h,m)|0)+20)|0,j+20|0,h)|0}m=m+1|0;}while((m|0)<(l|0));i=d;return o|0}}g=(n|0)==0;f=(h|0)==0;if(g|f){if(!f){if(j){f=0;g=1;do{g=Z(c[b+8+(f<<2)>>2]|0,g)|0;f=f+1|0;}while((f|0)<(h|0));f=(g<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,q|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}a=c[a+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(a|0)/(c[b+20+(e<<2)>>2]|0)|0;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}if(g){u=Yb(24)|0;c[u>>2]=e;c[u+4>>2]=0;c[u+20>>2]=(c[a+20>>2]|0)/(c[b+20>>2]|0)|0;i=d;return u|0}f=(n|0)>0;do{if(f){h=0;g=1;do{g=Z(c[a+8+(h<<2)>>2]|0,g)|0;h=h+1|0;}while((h|0)<(n|0));if(f){j=0;h=1}else{h=24;break}do{h=Z(c[a+8+(j<<2)>>2]|0,h)|0;j=j+1|0;}while((j|0)<(n|0));h=(h<<2)+20|0}else{h=24;g=1}}while(0);h=Yb(h)|0;o=h;c[h>>2]=e;c[h+4>>2]=n;if(f){ac(h+8|0,r|0,n<<2)|0}if((g|0)<=0){u=o;i=d;return u|0}b=c[b+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(c[a+20+(e<<2)>>2]|0)/(b|0)|0;e=e+1|0;}while((e|0)<(g|0));i=d;return o|0}f=(c[r>>2]|0)>1;g=c[q>>2]|0;k=(g|0)>1;do{if(f){if(!k){break}if(j){f=1;k=1;while(1){k=Z(g,k)|0;if((f|0)>=(h|0)){break}g=c[b+8+(f<<2)>>2]|0;f=f+1|0}f=(k<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,q|0,h<<2)|0}if((l|0)>0){e=0}else{u=o;i=d;return u|0}do{c[o+20+(e<<2)>>2]=(c[a+20+(e<<2)>>2]|0)/(c[b+20+(e<<2)>>2]|0)|0;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}else{if(!k){break}if(j){f=1;k=1;while(1){k=Z(g,k)|0;if((f|0)>=(h|0)){break}g=c[b+8+(f<<2)>>2]|0;f=f+1|0}f=(k<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,q|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}a=c[a+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(a|0)/(c[b+20+(e<<2)>>2]|0)|0;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}}while(0);if(j){k=1;m=1;while(1){m=Z(g,m)|0;if((k|0)>=(h|0)){break}g=c[b+8+(k<<2)>>2]|0;k=k+1|0}g=(m<<2)+20|0}else{g=24}g=Yb(g)|0;o=g;c[g>>2]=e;c[g+4>>2]=h;if(j){ac(g+8|0,q|0,h<<2)|0}e=(l|0)>0;if(!f){if(!e){u=o;i=d;return u|0}c[g+20>>2]=(c[a+20>>2]|0)/(c[b+20>>2]|0)|0;u=o;i=d;return u|0}if(!e){u=o;i=d;return u|0}b=c[b+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(c[a+20+(e<<2)>>2]|0)/(b|0)|0;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}function pb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;i=i+32|0;o=d|0;p=d+16|0;h=c[b+4>>2]|0;q=b+8|0;j=(h|0)>0;if(j){e=0;l=1;do{l=Z(c[b+8+(e<<2)>>2]|0,l)|0;e=e+1|0;}while((e|0)<(h|0))}else{l=1}g=Yb(24)|0;c[g>>2]=0;c[g+4>>2]=0;f=g+20|0;c[f>>2]=0;k=Yb(24)|0;c[k>>2]=0;c[k+4>>2]=0;c[k+20>>2]=0;e=h-1|0;s=b+12|0;if((e|0)>0){n=0;m=1;do{n=n+1|0;m=Z(c[b+8+(n<<2)>>2]|0,m)|0;}while((n|0)<(e|0))}else{m=1}t=a+4|0;r=a+8|0;u=c[a>>2]|0;n=c[b>>2]|0;e=n|u;n=(n&1|0)==0;if((u&1|0)!=0){a=fb(a)|0;if(n){t=pb(a,b)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}else{t=pb(a,fb(b)|0)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}}if(!n){if((h|0)==0){t=pb(a,fb(b)|0)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}u=Yb((l<<2)+20|0)|0;o=u;c[u>>2]=e;c[u+4>>2]=1;c[u+8>>2]=l;if((l|0)>0){e=0}else{u=o;i=d;return u|0}do{c[o+20+(e<<2)>>2]=pb(a,c[b+20+(e<<2)>>2]|0)|0;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}n=c[t>>2]|0;t=(h|0)>1;if((n|0)>1){l=c[r>>2]|0;if(!t){j=1;p=1;o=l;while(1){p=Z(o,p)|0;if((j|0)>=(n|0)){break}o=c[a+8+(j<<2)>>2]|0;j=j+1|0}j=Yb((p<<2)+20|0)|0;o=j;c[j>>2]=e;c[j+4>>2]=n;ac(j+8|0,r|0,n<<2)|0;e=(l|0)>0;if((h|0)==0){if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[f>>2]=m;k=pb(gb(g,a)|0,b)|0;if(e){ac(j+((Z(h,m)|0)+20)|0,k+20|0,h)|0}m=m+1|0;}while((m|0)<(l|0));i=d;return o|0}else{if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[f>>2]=m;n=gb(g,a)|0;n=pb(n,gb(k,b)|0)|0;if(e){ac(j+((Z(h,m)|0)+20)|0,n+20|0,h)|0}m=m+1|0;}while((m|0)<(l|0));i=d;return o|0}}r=c[q>>2]|0;t=(r|0)>1;if((l|0)<=1){if(!t){u=gb(k,a)|0;u=pb(u,gb(k,b)|0)|0;i=d;return u|0}if(j){l=1;n=1;o=r;while(1){n=Z(o,n)|0;if((l|0)>=(h|0)){break}o=c[b+8+(l<<2)>>2]|0;l=l+1|0}l=(n<<2)+20|0}else{l=24}l=Yb(l)|0;o=l;c[l>>2]=e;c[l+4>>2]=h;if(j){ac(l+8|0,q|0,h<<2)|0}if((r|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;j=0;do{c[f>>2]=j;m=gb(k,a)|0;m=pb(m,gb(g,b)|0)|0;if(e){ac(l+((Z(h,j)|0)+20)|0,m+20|0,h)|0}j=j+1|0;}while((j|0)<(r|0));i=d;return o|0}if(t){h=(n|0)>(h|0)?n:h;c[o>>2]=l;c[o+4>>2]=c[s>>2];c[o+8>>2]=c[b+16>>2];k=o;j=(h|0)>0;if(j){n=1;q=1;p=l;while(1){q=Z(p,q)|0;if((n|0)>=(h|0)){break}p=c[o+(n<<2)>>2]|0;n=n+1|0}n=(q<<2)+20|0}else{n=24}n=Yb(n)|0;o=n;c[n>>2]=e;c[n+4>>2]=h;if(j){ac(n+8|0,k|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;k=0;do{c[f>>2]=k;j=gb(g,a)|0;j=pb(j,gb(g,b)|0)|0;if(e){ac(n+((Z(h,k)|0)+20)|0,j+20|0,h)|0}k=k+1|0;}while((k|0)<(l|0));i=d;return o|0}else{c[p>>2]=l;c[p+4>>2]=c[s>>2];c[p+8>>2]=c[b+16>>2];j=p;h=(n|0)>0;if(h){o=1;q=1;r=l;while(1){q=Z(r,q)|0;if((o|0)>=(n|0)){break}r=c[p+(o<<2)>>2]|0;o=o+1|0}o=(q<<2)+20|0}else{o=24}p=Yb(o)|0;o=p;c[p>>2]=e;c[p+4>>2]=n;if(h){ac(p+8|0,j|0,n<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;j=0;do{c[f>>2]=j;m=gb(g,a)|0;m=pb(m,gb(k,b)|0)|0;if(e){ac(p+((Z(h,j)|0)+20)|0,m+20|0,h)|0}j=j+1|0;}while((j|0)<(l|0));i=d;return o|0}}if(t){l=c[q>>2]|0;o=1;p=1;r=l;while(1){p=Z(r,p)|0;if((o|0)>=(h|0)){break}r=c[b+8+(o<<2)>>2]|0;o=o+1|0}p=Yb((p<<2)+20|0)|0;o=p;c[p>>2]=e;c[p+4>>2]=h;if(j){ac(p+8|0,q|0,h<<2)|0}e=(l|0)>0;if((n|0)==0){if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;k=0;do{c[f>>2]=k;j=pb(a,gb(g,b)|0)|0;if(e){ac(p+((Z(h,k)|0)+20)|0,j+20|0,h)|0}k=k+1|0;}while((k|0)<(l|0));i=d;return o|0}else{if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[f>>2]=m;j=gb(k,a)|0;j=pb(j,gb(g,b)|0)|0;if(e){ac(p+((Z(h,m)|0)+20)|0,j+20|0,h)|0}m=m+1|0;}while((m|0)<(l|0));i=d;return o|0}}g=(n|0)==0;f=(h|0)==0;if(g|f){if(!f){if(j){f=0;g=1;do{g=Z(c[b+8+(f<<2)>>2]|0,g)|0;f=f+1|0;}while((f|0)<(h|0));f=(g<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,q|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}a=c[a+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(a|0)==(c[b+20+(e<<2)>>2]|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}if(g){u=Yb(24)|0;c[u>>2]=e;c[u+4>>2]=0;c[u+20>>2]=(c[a+20>>2]|0)==(c[b+20>>2]|0);i=d;return u|0}f=(n|0)>0;do{if(f){h=0;g=1;do{g=Z(c[a+8+(h<<2)>>2]|0,g)|0;h=h+1|0;}while((h|0)<(n|0));if(f){j=0;h=1}else{h=24;break}do{h=Z(c[a+8+(j<<2)>>2]|0,h)|0;j=j+1|0;}while((j|0)<(n|0));h=(h<<2)+20|0}else{h=24;g=1}}while(0);h=Yb(h)|0;o=h;c[h>>2]=e;c[h+4>>2]=n;if(f){ac(h+8|0,r|0,n<<2)|0}if((g|0)<=0){u=o;i=d;return u|0}b=c[b+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(c[a+20+(e<<2)>>2]|0)==(b|0);e=e+1|0;}while((e|0)<(g|0));i=d;return o|0}f=(c[r>>2]|0)>1;g=c[q>>2]|0;k=(g|0)>1;do{if(f){if(!k){break}if(j){f=1;k=1;while(1){k=Z(g,k)|0;if((f|0)>=(h|0)){break}g=c[b+8+(f<<2)>>2]|0;f=f+1|0}f=(k<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,q|0,h<<2)|0}if((l|0)>0){e=0}else{u=o;i=d;return u|0}do{c[o+20+(e<<2)>>2]=(c[a+20+(e<<2)>>2]|0)==(c[b+20+(e<<2)>>2]|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}else{if(!k){break}if(j){f=1;k=1;while(1){k=Z(g,k)|0;if((f|0)>=(h|0)){break}g=c[b+8+(f<<2)>>2]|0;f=f+1|0}f=(k<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,q|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}a=c[a+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(a|0)==(c[b+20+(e<<2)>>2]|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}}while(0);if(j){k=1;m=1;while(1){m=Z(g,m)|0;if((k|0)>=(h|0)){break}g=c[b+8+(k<<2)>>2]|0;k=k+1|0}g=(m<<2)+20|0}else{g=24}g=Yb(g)|0;o=g;c[g>>2]=e;c[g+4>>2]=h;if(j){ac(g+8|0,q|0,h<<2)|0}e=(l|0)>0;if(!f){if(!e){u=o;i=d;return u|0}c[g+20>>2]=(c[a+20>>2]|0)==(c[b+20>>2]|0);u=o;i=d;return u|0}if(!e){u=o;i=d;return u|0}b=c[b+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(c[a+20+(e<<2)>>2]|0)==(b|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}function qb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;i=i+32|0;o=d|0;p=d+16|0;h=c[b+4>>2]|0;q=b+8|0;j=(h|0)>0;if(j){e=0;l=1;do{l=Z(c[b+8+(e<<2)>>2]|0,l)|0;e=e+1|0;}while((e|0)<(h|0))}else{l=1}g=Yb(24)|0;c[g>>2]=0;c[g+4>>2]=0;f=g+20|0;c[f>>2]=0;k=Yb(24)|0;c[k>>2]=0;c[k+4>>2]=0;c[k+20>>2]=0;e=h-1|0;s=b+12|0;if((e|0)>0){n=0;m=1;do{n=n+1|0;m=Z(c[b+8+(n<<2)>>2]|0,m)|0;}while((n|0)<(e|0))}else{m=1}t=a+4|0;r=a+8|0;u=c[a>>2]|0;n=c[b>>2]|0;e=n|u;n=(n&1|0)==0;if((u&1|0)!=0){a=fb(a)|0;if(n){t=qb(a,b)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}else{t=qb(a,fb(b)|0)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}}if(!n){if((h|0)==0){t=qb(a,fb(b)|0)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}u=Yb((l<<2)+20|0)|0;o=u;c[u>>2]=e;c[u+4>>2]=1;c[u+8>>2]=l;if((l|0)>0){e=0}else{u=o;i=d;return u|0}do{c[o+20+(e<<2)>>2]=qb(a,c[b+20+(e<<2)>>2]|0)|0;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}n=c[t>>2]|0;t=(h|0)>1;if((n|0)>1){l=c[r>>2]|0;if(!t){j=1;p=1;o=l;while(1){p=Z(o,p)|0;if((j|0)>=(n|0)){break}o=c[a+8+(j<<2)>>2]|0;j=j+1|0}j=Yb((p<<2)+20|0)|0;o=j;c[j>>2]=e;c[j+4>>2]=n;ac(j+8|0,r|0,n<<2)|0;e=(l|0)>0;if((h|0)==0){if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[f>>2]=m;k=qb(gb(g,a)|0,b)|0;if(e){ac(j+((Z(h,m)|0)+20)|0,k+20|0,h)|0}m=m+1|0;}while((m|0)<(l|0));i=d;return o|0}else{if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[f>>2]=m;n=gb(g,a)|0;n=qb(n,gb(k,b)|0)|0;if(e){ac(j+((Z(h,m)|0)+20)|0,n+20|0,h)|0}m=m+1|0;}while((m|0)<(l|0));i=d;return o|0}}r=c[q>>2]|0;t=(r|0)>1;if((l|0)<=1){if(!t){u=gb(k,a)|0;u=qb(u,gb(k,b)|0)|0;i=d;return u|0}if(j){l=1;n=1;o=r;while(1){n=Z(o,n)|0;if((l|0)>=(h|0)){break}o=c[b+8+(l<<2)>>2]|0;l=l+1|0}l=(n<<2)+20|0}else{l=24}l=Yb(l)|0;o=l;c[l>>2]=e;c[l+4>>2]=h;if(j){ac(l+8|0,q|0,h<<2)|0}if((r|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;j=0;do{c[f>>2]=j;m=gb(k,a)|0;m=qb(m,gb(g,b)|0)|0;if(e){ac(l+((Z(h,j)|0)+20)|0,m+20|0,h)|0}j=j+1|0;}while((j|0)<(r|0));i=d;return o|0}if(t){h=(n|0)>(h|0)?n:h;c[o>>2]=l;c[o+4>>2]=c[s>>2];c[o+8>>2]=c[b+16>>2];k=o;j=(h|0)>0;if(j){n=1;q=1;p=l;while(1){q=Z(p,q)|0;if((n|0)>=(h|0)){break}p=c[o+(n<<2)>>2]|0;n=n+1|0}n=(q<<2)+20|0}else{n=24}n=Yb(n)|0;o=n;c[n>>2]=e;c[n+4>>2]=h;if(j){ac(n+8|0,k|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;k=0;do{c[f>>2]=k;j=gb(g,a)|0;j=qb(j,gb(g,b)|0)|0;if(e){ac(n+((Z(h,k)|0)+20)|0,j+20|0,h)|0}k=k+1|0;}while((k|0)<(l|0));i=d;return o|0}else{c[p>>2]=l;c[p+4>>2]=c[s>>2];c[p+8>>2]=c[b+16>>2];j=p;h=(n|0)>0;if(h){o=1;q=1;r=l;while(1){q=Z(r,q)|0;if((o|0)>=(n|0)){break}r=c[p+(o<<2)>>2]|0;o=o+1|0}o=(q<<2)+20|0}else{o=24}p=Yb(o)|0;o=p;c[p>>2]=e;c[p+4>>2]=n;if(h){ac(p+8|0,j|0,n<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;j=0;do{c[f>>2]=j;m=gb(g,a)|0;m=qb(m,gb(k,b)|0)|0;if(e){ac(p+((Z(h,j)|0)+20)|0,m+20|0,h)|0}j=j+1|0;}while((j|0)<(l|0));i=d;return o|0}}if(t){l=c[q>>2]|0;o=1;p=1;r=l;while(1){p=Z(r,p)|0;if((o|0)>=(h|0)){break}r=c[b+8+(o<<2)>>2]|0;o=o+1|0}p=Yb((p<<2)+20|0)|0;o=p;c[p>>2]=e;c[p+4>>2]=h;if(j){ac(p+8|0,q|0,h<<2)|0}e=(l|0)>0;if((n|0)==0){if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;k=0;do{c[f>>2]=k;j=qb(a,gb(g,b)|0)|0;if(e){ac(p+((Z(h,k)|0)+20)|0,j+20|0,h)|0}k=k+1|0;}while((k|0)<(l|0));i=d;return o|0}else{if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[f>>2]=m;j=gb(k,a)|0;j=qb(j,gb(g,b)|0)|0;if(e){ac(p+((Z(h,m)|0)+20)|0,j+20|0,h)|0}m=m+1|0;}while((m|0)<(l|0));i=d;return o|0}}g=(n|0)==0;f=(h|0)==0;if(g|f){if(!f){if(j){f=0;g=1;do{g=Z(c[b+8+(f<<2)>>2]|0,g)|0;f=f+1|0;}while((f|0)<(h|0));f=(g<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,q|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}a=c[a+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(a|0)!=(c[b+20+(e<<2)>>2]|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}if(g){u=Yb(24)|0;c[u>>2]=e;c[u+4>>2]=0;c[u+20>>2]=(c[a+20>>2]|0)!=(c[b+20>>2]|0);i=d;return u|0}f=(n|0)>0;do{if(f){h=0;g=1;do{g=Z(c[a+8+(h<<2)>>2]|0,g)|0;h=h+1|0;}while((h|0)<(n|0));if(f){j=0;h=1}else{h=24;break}do{h=Z(c[a+8+(j<<2)>>2]|0,h)|0;j=j+1|0;}while((j|0)<(n|0));h=(h<<2)+20|0}else{h=24;g=1}}while(0);h=Yb(h)|0;o=h;c[h>>2]=e;c[h+4>>2]=n;if(f){ac(h+8|0,r|0,n<<2)|0}if((g|0)<=0){u=o;i=d;return u|0}b=c[b+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(c[a+20+(e<<2)>>2]|0)!=(b|0);e=e+1|0;}while((e|0)<(g|0));i=d;return o|0}f=(c[r>>2]|0)>1;g=c[q>>2]|0;k=(g|0)>1;do{if(f){if(!k){break}if(j){f=1;k=1;while(1){k=Z(g,k)|0;if((f|0)>=(h|0)){break}g=c[b+8+(f<<2)>>2]|0;f=f+1|0}f=(k<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,q|0,h<<2)|0}if((l|0)>0){e=0}else{u=o;i=d;return u|0}do{c[o+20+(e<<2)>>2]=(c[a+20+(e<<2)>>2]|0)!=(c[b+20+(e<<2)>>2]|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}else{if(!k){break}if(j){f=1;k=1;while(1){k=Z(g,k)|0;if((f|0)>=(h|0)){break}g=c[b+8+(f<<2)>>2]|0;f=f+1|0}f=(k<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,q|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}a=c[a+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(a|0)!=(c[b+20+(e<<2)>>2]|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}}while(0);if(j){k=1;m=1;while(1){m=Z(g,m)|0;if((k|0)>=(h|0)){break}g=c[b+8+(k<<2)>>2]|0;k=k+1|0}g=(m<<2)+20|0}else{g=24}g=Yb(g)|0;o=g;c[g>>2]=e;c[g+4>>2]=h;if(j){ac(g+8|0,q|0,h<<2)|0}e=(l|0)>0;if(!f){if(!e){u=o;i=d;return u|0}c[g+20>>2]=(c[a+20>>2]|0)!=(c[b+20>>2]|0);u=o;i=d;return u|0}if(!e){u=o;i=d;return u|0}b=c[b+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(c[a+20+(e<<2)>>2]|0)!=(b|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}function rb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;i=i+32|0;o=d|0;p=d+16|0;h=c[b+4>>2]|0;q=b+8|0;j=(h|0)>0;if(j){e=0;l=1;do{l=Z(c[b+8+(e<<2)>>2]|0,l)|0;e=e+1|0;}while((e|0)<(h|0))}else{l=1}g=Yb(24)|0;c[g>>2]=0;c[g+4>>2]=0;f=g+20|0;c[f>>2]=0;k=Yb(24)|0;c[k>>2]=0;c[k+4>>2]=0;c[k+20>>2]=0;e=h-1|0;s=b+12|0;if((e|0)>0){n=0;m=1;do{n=n+1|0;m=Z(c[b+8+(n<<2)>>2]|0,m)|0;}while((n|0)<(e|0))}else{m=1}t=a+4|0;r=a+8|0;u=c[a>>2]|0;n=c[b>>2]|0;e=n|u;n=(n&1|0)==0;if((u&1|0)!=0){a=fb(a)|0;if(n){t=rb(a,b)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}else{t=rb(a,fb(b)|0)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}}if(!n){if((h|0)==0){t=rb(a,fb(b)|0)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}u=Yb((l<<2)+20|0)|0;o=u;c[u>>2]=e;c[u+4>>2]=1;c[u+8>>2]=l;if((l|0)>0){e=0}else{u=o;i=d;return u|0}do{c[o+20+(e<<2)>>2]=rb(a,c[b+20+(e<<2)>>2]|0)|0;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}n=c[t>>2]|0;t=(h|0)>1;if((n|0)>1){l=c[r>>2]|0;if(!t){j=1;p=1;o=l;while(1){p=Z(o,p)|0;if((j|0)>=(n|0)){break}o=c[a+8+(j<<2)>>2]|0;j=j+1|0}j=Yb((p<<2)+20|0)|0;o=j;c[j>>2]=e;c[j+4>>2]=n;ac(j+8|0,r|0,n<<2)|0;e=(l|0)>0;if((h|0)==0){if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[f>>2]=m;k=rb(gb(g,a)|0,b)|0;if(e){ac(j+((Z(h,m)|0)+20)|0,k+20|0,h)|0}m=m+1|0;}while((m|0)<(l|0));i=d;return o|0}else{if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[f>>2]=m;n=gb(g,a)|0;n=rb(n,gb(k,b)|0)|0;if(e){ac(j+((Z(h,m)|0)+20)|0,n+20|0,h)|0}m=m+1|0;}while((m|0)<(l|0));i=d;return o|0}}r=c[q>>2]|0;t=(r|0)>1;if((l|0)<=1){if(!t){u=gb(k,a)|0;u=rb(u,gb(k,b)|0)|0;i=d;return u|0}if(j){l=1;n=1;o=r;while(1){n=Z(o,n)|0;if((l|0)>=(h|0)){break}o=c[b+8+(l<<2)>>2]|0;l=l+1|0}l=(n<<2)+20|0}else{l=24}l=Yb(l)|0;o=l;c[l>>2]=e;c[l+4>>2]=h;if(j){ac(l+8|0,q|0,h<<2)|0}if((r|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;j=0;do{c[f>>2]=j;m=gb(k,a)|0;m=rb(m,gb(g,b)|0)|0;if(e){ac(l+((Z(h,j)|0)+20)|0,m+20|0,h)|0}j=j+1|0;}while((j|0)<(r|0));i=d;return o|0}if(t){h=(n|0)>(h|0)?n:h;c[o>>2]=l;c[o+4>>2]=c[s>>2];c[o+8>>2]=c[b+16>>2];k=o;j=(h|0)>0;if(j){n=1;q=1;p=l;while(1){q=Z(p,q)|0;if((n|0)>=(h|0)){break}p=c[o+(n<<2)>>2]|0;n=n+1|0}n=(q<<2)+20|0}else{n=24}n=Yb(n)|0;o=n;c[n>>2]=e;c[n+4>>2]=h;if(j){ac(n+8|0,k|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;k=0;do{c[f>>2]=k;j=gb(g,a)|0;j=rb(j,gb(g,b)|0)|0;if(e){ac(n+((Z(h,k)|0)+20)|0,j+20|0,h)|0}k=k+1|0;}while((k|0)<(l|0));i=d;return o|0}else{c[p>>2]=l;c[p+4>>2]=c[s>>2];c[p+8>>2]=c[b+16>>2];j=p;h=(n|0)>0;if(h){o=1;q=1;r=l;while(1){q=Z(r,q)|0;if((o|0)>=(n|0)){break}r=c[p+(o<<2)>>2]|0;o=o+1|0}o=(q<<2)+20|0}else{o=24}p=Yb(o)|0;o=p;c[p>>2]=e;c[p+4>>2]=n;if(h){ac(p+8|0,j|0,n<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;j=0;do{c[f>>2]=j;m=gb(g,a)|0;m=rb(m,gb(k,b)|0)|0;if(e){ac(p+((Z(h,j)|0)+20)|0,m+20|0,h)|0}j=j+1|0;}while((j|0)<(l|0));i=d;return o|0}}if(t){l=c[q>>2]|0;o=1;p=1;r=l;while(1){p=Z(r,p)|0;if((o|0)>=(h|0)){break}r=c[b+8+(o<<2)>>2]|0;o=o+1|0}p=Yb((p<<2)+20|0)|0;o=p;c[p>>2]=e;c[p+4>>2]=h;if(j){ac(p+8|0,q|0,h<<2)|0}e=(l|0)>0;if((n|0)==0){if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;k=0;do{c[f>>2]=k;j=rb(a,gb(g,b)|0)|0;if(e){ac(p+((Z(h,k)|0)+20)|0,j+20|0,h)|0}k=k+1|0;}while((k|0)<(l|0));i=d;return o|0}else{if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[f>>2]=m;j=gb(k,a)|0;j=rb(j,gb(g,b)|0)|0;if(e){ac(p+((Z(h,m)|0)+20)|0,j+20|0,h)|0}m=m+1|0;}while((m|0)<(l|0));i=d;return o|0}}g=(n|0)==0;f=(h|0)==0;if(g|f){if(!f){if(j){f=0;g=1;do{g=Z(c[b+8+(f<<2)>>2]|0,g)|0;f=f+1|0;}while((f|0)<(h|0));f=(g<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,q|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}a=c[a+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(a|0)<(c[b+20+(e<<2)>>2]|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}if(g){u=Yb(24)|0;c[u>>2]=e;c[u+4>>2]=0;c[u+20>>2]=(c[a+20>>2]|0)<(c[b+20>>2]|0);i=d;return u|0}f=(n|0)>0;do{if(f){h=0;g=1;do{g=Z(c[a+8+(h<<2)>>2]|0,g)|0;h=h+1|0;}while((h|0)<(n|0));if(f){j=0;h=1}else{h=24;break}do{h=Z(c[a+8+(j<<2)>>2]|0,h)|0;j=j+1|0;}while((j|0)<(n|0));h=(h<<2)+20|0}else{h=24;g=1}}while(0);h=Yb(h)|0;o=h;c[h>>2]=e;c[h+4>>2]=n;if(f){ac(h+8|0,r|0,n<<2)|0}if((g|0)<=0){u=o;i=d;return u|0}b=c[b+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(c[a+20+(e<<2)>>2]|0)<(b|0);e=e+1|0;}while((e|0)<(g|0));i=d;return o|0}f=(c[r>>2]|0)>1;g=c[q>>2]|0;k=(g|0)>1;do{if(f){if(!k){break}if(j){f=1;k=1;while(1){k=Z(g,k)|0;if((f|0)>=(h|0)){break}g=c[b+8+(f<<2)>>2]|0;f=f+1|0}f=(k<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,q|0,h<<2)|0}if((l|0)>0){e=0}else{u=o;i=d;return u|0}do{c[o+20+(e<<2)>>2]=(c[a+20+(e<<2)>>2]|0)<(c[b+20+(e<<2)>>2]|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}else{if(!k){break}if(j){f=1;k=1;while(1){k=Z(g,k)|0;if((f|0)>=(h|0)){break}g=c[b+8+(f<<2)>>2]|0;f=f+1|0}f=(k<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,q|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}a=c[a+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(a|0)<(c[b+20+(e<<2)>>2]|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}}while(0);if(j){k=1;m=1;while(1){m=Z(g,m)|0;if((k|0)>=(h|0)){break}g=c[b+8+(k<<2)>>2]|0;k=k+1|0}g=(m<<2)+20|0}else{g=24}g=Yb(g)|0;o=g;c[g>>2]=e;c[g+4>>2]=h;if(j){ac(g+8|0,q|0,h<<2)|0}e=(l|0)>0;if(!f){if(!e){u=o;i=d;return u|0}c[g+20>>2]=(c[a+20>>2]|0)<(c[b+20>>2]|0);u=o;i=d;return u|0}if(!e){u=o;i=d;return u|0}b=c[b+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(c[a+20+(e<<2)>>2]|0)<(b|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}function sb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;i=i+32|0;o=d|0;p=d+16|0;h=c[b+4>>2]|0;q=b+8|0;j=(h|0)>0;if(j){e=0;l=1;do{l=Z(c[b+8+(e<<2)>>2]|0,l)|0;e=e+1|0;}while((e|0)<(h|0))}else{l=1}g=Yb(24)|0;c[g>>2]=0;c[g+4>>2]=0;f=g+20|0;c[f>>2]=0;k=Yb(24)|0;c[k>>2]=0;c[k+4>>2]=0;c[k+20>>2]=0;e=h-1|0;s=b+12|0;if((e|0)>0){n=0;m=1;do{n=n+1|0;m=Z(c[b+8+(n<<2)>>2]|0,m)|0;}while((n|0)<(e|0))}else{m=1}t=a+4|0;r=a+8|0;u=c[a>>2]|0;n=c[b>>2]|0;e=n|u;n=(n&1|0)==0;if((u&1|0)!=0){a=fb(a)|0;if(n){t=sb(a,b)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}else{t=sb(a,fb(b)|0)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}}if(!n){if((h|0)==0){t=sb(a,fb(b)|0)|0;s=c[t>>2]|1;u=Yb(24)|0;c[u>>2]=s;c[u+4>>2]=0;c[u+20>>2]=t;i=d;return u|0}u=Yb((l<<2)+20|0)|0;o=u;c[u>>2]=e;c[u+4>>2]=1;c[u+8>>2]=l;if((l|0)>0){e=0}else{u=o;i=d;return u|0}do{c[o+20+(e<<2)>>2]=sb(a,c[b+20+(e<<2)>>2]|0)|0;e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}n=c[t>>2]|0;t=(h|0)>1;if((n|0)>1){l=c[r>>2]|0;if(!t){j=1;p=1;o=l;while(1){p=Z(o,p)|0;if((j|0)>=(n|0)){break}o=c[a+8+(j<<2)>>2]|0;j=j+1|0}j=Yb((p<<2)+20|0)|0;o=j;c[j>>2]=e;c[j+4>>2]=n;ac(j+8|0,r|0,n<<2)|0;e=(l|0)>0;if((h|0)==0){if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[f>>2]=m;k=sb(gb(g,a)|0,b)|0;if(e){ac(j+((Z(h,m)|0)+20)|0,k+20|0,h)|0}m=m+1|0;}while((m|0)<(l|0));i=d;return o|0}else{if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[f>>2]=m;n=gb(g,a)|0;n=sb(n,gb(k,b)|0)|0;if(e){ac(j+((Z(h,m)|0)+20)|0,n+20|0,h)|0}m=m+1|0;}while((m|0)<(l|0));i=d;return o|0}}r=c[q>>2]|0;t=(r|0)>1;if((l|0)<=1){if(!t){u=gb(k,a)|0;u=sb(u,gb(k,b)|0)|0;i=d;return u|0}if(j){l=1;n=1;o=r;while(1){n=Z(o,n)|0;if((l|0)>=(h|0)){break}o=c[b+8+(l<<2)>>2]|0;l=l+1|0}l=(n<<2)+20|0}else{l=24}l=Yb(l)|0;o=l;c[l>>2]=e;c[l+4>>2]=h;if(j){ac(l+8|0,q|0,h<<2)|0}if((r|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;j=0;do{c[f>>2]=j;m=gb(k,a)|0;m=sb(m,gb(g,b)|0)|0;if(e){ac(l+((Z(h,j)|0)+20)|0,m+20|0,h)|0}j=j+1|0;}while((j|0)<(r|0));i=d;return o|0}if(t){h=(n|0)>(h|0)?n:h;c[o>>2]=l;c[o+4>>2]=c[s>>2];c[o+8>>2]=c[b+16>>2];k=o;j=(h|0)>0;if(j){n=1;q=1;p=l;while(1){q=Z(p,q)|0;if((n|0)>=(h|0)){break}p=c[o+(n<<2)>>2]|0;n=n+1|0}n=(q<<2)+20|0}else{n=24}n=Yb(n)|0;o=n;c[n>>2]=e;c[n+4>>2]=h;if(j){ac(n+8|0,k|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;k=0;do{c[f>>2]=k;j=gb(g,a)|0;j=sb(j,gb(g,b)|0)|0;if(e){ac(n+((Z(h,k)|0)+20)|0,j+20|0,h)|0}k=k+1|0;}while((k|0)<(l|0));i=d;return o|0}else{c[p>>2]=l;c[p+4>>2]=c[s>>2];c[p+8>>2]=c[b+16>>2];j=p;h=(n|0)>0;if(h){o=1;q=1;r=l;while(1){q=Z(r,q)|0;if((o|0)>=(n|0)){break}r=c[p+(o<<2)>>2]|0;o=o+1|0}o=(q<<2)+20|0}else{o=24}p=Yb(o)|0;o=p;c[p>>2]=e;c[p+4>>2]=n;if(h){ac(p+8|0,j|0,n<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;j=0;do{c[f>>2]=j;m=gb(g,a)|0;m=sb(m,gb(k,b)|0)|0;if(e){ac(p+((Z(h,j)|0)+20)|0,m+20|0,h)|0}j=j+1|0;}while((j|0)<(l|0));i=d;return o|0}}if(t){l=c[q>>2]|0;o=1;p=1;r=l;while(1){p=Z(r,p)|0;if((o|0)>=(h|0)){break}r=c[b+8+(o<<2)>>2]|0;o=o+1|0}p=Yb((p<<2)+20|0)|0;o=p;c[p>>2]=e;c[p+4>>2]=h;if(j){ac(p+8|0,q|0,h<<2)|0}e=(l|0)>0;if((n|0)==0){if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;k=0;do{c[f>>2]=k;j=sb(a,gb(g,b)|0)|0;if(e){ac(p+((Z(h,k)|0)+20)|0,j+20|0,h)|0}k=k+1|0;}while((k|0)<(l|0));i=d;return o|0}else{if(!e){u=o;i=d;return u|0}e=(m|0)>0;h=m<<2;m=0;do{c[f>>2]=m;j=gb(k,a)|0;j=sb(j,gb(g,b)|0)|0;if(e){ac(p+((Z(h,m)|0)+20)|0,j+20|0,h)|0}m=m+1|0;}while((m|0)<(l|0));i=d;return o|0}}g=(n|0)==0;f=(h|0)==0;if(g|f){if(!f){if(j){f=0;g=1;do{g=Z(c[b+8+(f<<2)>>2]|0,g)|0;f=f+1|0;}while((f|0)<(h|0));f=(g<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,q|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}a=c[a+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(a|0)>(c[b+20+(e<<2)>>2]|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}if(g){u=Yb(24)|0;c[u>>2]=e;c[u+4>>2]=0;c[u+20>>2]=(c[a+20>>2]|0)>(c[b+20>>2]|0);i=d;return u|0}f=(n|0)>0;do{if(f){h=0;g=1;do{g=Z(c[a+8+(h<<2)>>2]|0,g)|0;h=h+1|0;}while((h|0)<(n|0));if(f){j=0;h=1}else{h=24;break}do{h=Z(c[a+8+(j<<2)>>2]|0,h)|0;j=j+1|0;}while((j|0)<(n|0));h=(h<<2)+20|0}else{h=24;g=1}}while(0);h=Yb(h)|0;o=h;c[h>>2]=e;c[h+4>>2]=n;if(f){ac(h+8|0,r|0,n<<2)|0}if((g|0)<=0){u=o;i=d;return u|0}b=c[b+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(c[a+20+(e<<2)>>2]|0)>(b|0);e=e+1|0;}while((e|0)<(g|0));i=d;return o|0}f=(c[r>>2]|0)>1;g=c[q>>2]|0;k=(g|0)>1;do{if(f){if(!k){break}if(j){f=1;k=1;while(1){k=Z(g,k)|0;if((f|0)>=(h|0)){break}g=c[b+8+(f<<2)>>2]|0;f=f+1|0}f=(k<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,q|0,h<<2)|0}if((l|0)>0){e=0}else{u=o;i=d;return u|0}do{c[o+20+(e<<2)>>2]=(c[a+20+(e<<2)>>2]|0)>(c[b+20+(e<<2)>>2]|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}else{if(!k){break}if(j){f=1;k=1;while(1){k=Z(g,k)|0;if((f|0)>=(h|0)){break}g=c[b+8+(f<<2)>>2]|0;f=f+1|0}f=(k<<2)+20|0}else{f=24}f=Yb(f)|0;o=f;c[f>>2]=e;c[f+4>>2]=h;if(j){ac(f+8|0,q|0,h<<2)|0}if((l|0)<=0){u=o;i=d;return u|0}a=c[a+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(a|0)>(c[b+20+(e<<2)>>2]|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}}while(0);if(j){k=1;m=1;while(1){m=Z(g,m)|0;if((k|0)>=(h|0)){break}g=c[b+8+(k<<2)>>2]|0;k=k+1|0}g=(m<<2)+20|0}else{g=24}g=Yb(g)|0;o=g;c[g>>2]=e;c[g+4>>2]=h;if(j){ac(g+8|0,q|0,h<<2)|0}e=(l|0)>0;if(!f){if(!e){u=o;i=d;return u|0}c[g+20>>2]=(c[a+20>>2]|0)>(c[b+20>>2]|0);u=o;i=d;return u|0}if(!e){u=o;i=d;return u|0}b=c[b+20>>2]|0;e=0;do{c[o+20+(e<<2)>>2]=(c[a+20+(e<<2)>>2]|0)>(b|0);e=e+1|0;}while((e|0)<(l|0));i=d;return o|0}function tb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;d=i;i=i+32|0;o=d|0;p=d+16|0;f=c[b+4>>2]|0;n=b+8|0;j=(f|0)>0;if(j){e=0;l=1;do{l=Z(c[b+8+(e<<2)>>2]|0,l)|0;e=e+1|0;}while((e|0)<(f|0))}else{l=1}h=Yb(24)|0;c[h>>2]=0;c[h+4>>2]=0;g=h+20|0;c[g>>2]=0;k=Yb(24)|0;c[k>>2]=0;c[k+4>>2]=0;c[k+20>>2]=0;e=f-1|0;if((e|0)>0){q=0;m=1;do{q=q+1|0;m=Z(c[b+8+(q<<2)>>2]|0,m)|0;}while((q|0)<(e|0))}else{m=1}s=a+4|0;r=a+8|0;q=c[a>>2]|0;t=c[b>>2]|0;e=t|q;q=(q&1|0)==0;if((t&1|0)!=0){b=fb(b)|0;if(q){s=tb(b,a)|0;r=c[s>>2]|1;t=Yb(24)|0;c[t>>2]=r;c[t+4>>2]=0;c[t+20>>2]=s;i=d;return t|0}else{s=tb(b,fb(a)|0)|0;r=c[s>>2]|1;t=Yb(24)|0;c[t>>2]=r;c[t+4>>2]=0;c[t+20>>2]=s;i=d;return t|0}}if(!q){if((c[s>>2]|0)==0){s=tb(b,fb(a)|0)|0;r=c[s>>2]|1;t=Yb(24)|0;c[t>>2]=r;c[t+4>>2]=0;c[t+20>>2]=s;i=d;return t|0}t=Yb((l<<2)+20|0)|0;j=t;c[t>>2]=e;c[t+4>>2]=1;c[t+8>>2]=l;if((l|0)>0){e=0}else{t=j;i=d;return t|0}do{c[j+20+(e<<2)>>2]=tb(b,c[a+20+(e<<2)>>2]|0)|0;e=e+1|0;}while((e|0)<(l|0));i=d;return j|0}q=c[s>>2]|0;s=(q|0)>1;if((f|0)>1){l=c[n>>2]|0;if(!s){j=1;p=1;o=l;while(1){p=Z(o,p)|0;if((j|0)>=(f|0)){break}o=c[b+8+(j<<2)>>2]|0;j=j+1|0}o=Yb((p<<2)+20|0)|0;j=o;c[o>>2]=e;c[o+4>>2]=f;ac(o+8|0,n|0,f<<2)|0;e=(l|0)>0;if((q|0)==0){if(!e){t=j;i=d;return t|0}e=(m|0)>0;f=m<<2;k=0;do{c[g>>2]=k;m=tb(gb(h,b)|0,a)|0;if(e){ac(o+((Z(f,k)|0)+20)|0,m+20|0,f)|0}k=k+1|0;}while((k|0)<(l|0));i=d;return j|0}else{if(!e){t=j;i=d;return t|0}e=(m|0)>0;f=m<<2;n=0;do{c[g>>2]=n;m=gb(h,b)|0;m=tb(m,gb(k,a)|0)|0;if(e){ac(o+((Z(f,n)|0)+20)|0,m+20|0,f)|0}n=n+1|0;}while((n|0)<(l|0));i=d;return j|0}}r=(c[r>>2]|0)>1;if((l|0)<=1){if(!r){t=gb(k,b)|0;t=tb(t,gb(k,a)|0)|0;i=d;return t|0}if(j){o=1;q=1;p=l;while(1){q=Z(p,q)|0;if((o|0)>=(f|0)){break}p=c[b+8+(o<<2)>>2]|0;o=o+1|0}o=(q<<2)+20|0}else{o=24}o=Yb(o)|0;p=o;c[o>>2]=e;c[o+4>>2]=f;if(j){ac(o+8|0,n|0,f<<2)|0}if((l|0)<=0){t=p;i=d;return t|0}e=(m|0)>0;f=m<<2;m=0;while(1){c[g>>2]=m;j=gb(k,b)|0;j=tb(j,gb(h,a)|0)|0;if(e){ac(o+((Z(f,m)|0)+20)|0,j+20|0,f)|0}m=m+1|0;if((m|0)>=(l|0)){j=p;break}}i=d;return j|0}if(r){n=(f|0)>(q|0)?f:q;c[o>>2]=l;c[o+4>>2]=c[a+12>>2];c[o+8>>2]=c[a+16>>2];f=o;k=(n|0)>0;if(k){j=1;p=1;q=l;while(1){p=Z(q,p)|0;if((j|0)>=(n|0)){break}q=c[o+(j<<2)>>2]|0;j=j+1|0}j=(p<<2)+20|0}else{j=24}o=Yb(j)|0;j=o;c[o>>2]=e;c[o+4>>2]=n;if(k){ac(o+8|0,f|0,n<<2)|0}if((l|0)<=0){t=j;i=d;return t|0}e=(m|0)>0;f=m<<2;k=0;do{c[g>>2]=k;m=gb(h,b)|0;m=tb(m,gb(h,a)|0)|0;if(e){ac(o+((Z(f,k)|0)+20)|0,m+20|0,f)|0}k=k+1|0;}while((k|0)<(l|0));i=d;return j|0}else{c[p>>2]=l;c[p+4>>2]=c[a+12>>2];c[p+8>>2]=c[a+16>>2];n=p;if(j){o=1;r=1;q=l;while(1){r=Z(q,r)|0;if((o|0)>=(f|0)){break}q=c[p+(o<<2)>>2]|0;o=o+1|0}o=(r<<2)+20|0}else{o=24}p=Yb(o)|0;o=p;c[p>>2]=e;c[p+4>>2]=f;if(j){ac(p+8|0,n|0,f<<2)|0}if((l|0)<=0){t=o;i=d;return t|0}e=(m|0)>0;f=m<<2;j=0;while(1){c[g>>2]=j;m=gb(h,b)|0;m=tb(m,gb(k,a)|0)|0;if(e){ac(p+((Z(f,j)|0)+20)|0,m+20|0,f)|0}j=j+1|0;if((j|0)>=(l|0)){j=o;break}}i=d;return j|0}}if(s){l=c[n>>2]|0;if(j){o=1;p=1;q=l;while(1){p=Z(q,p)|0;if((o|0)>=(f|0)){break}q=c[b+8+(o<<2)>>2]|0;o=o+1|0}o=(p<<2)+20|0}else{o=24}o=Yb(o)|0;p=o;c[o>>2]=e;c[o+4>>2]=f;do{if(j){ac(o+8|0,n|0,f<<2)|0}else{if((f|0)!=0){break}if((l|0)<=0){t=p;i=d;return t|0}e=(m|0)>0;f=m<<2;k=0;while(1){c[g>>2]=k;j=tb(b,gb(h,a)|0)|0;if(e){ac(o+((Z(f,k)|0)+20)|0,j+20|0,f)|0}k=k+1|0;if((k|0)>=(l|0)){j=p;break}}i=d;return j|0}}while(0);if((l|0)<=0){t=p;i=d;return t|0}e=(m|0)>0;f=m<<2;j=0;while(1){c[g>>2]=j;m=gb(k,b)|0;m=tb(m,gb(h,a)|0)|0;if(e){ac(o+((Z(f,j)|0)+20)|0,m+20|0,f)|0}j=j+1|0;if((j|0)>=(l|0)){j=p;break}}i=d;return j|0}g=(f|0)==0;h=(q|0)==0;if(g|h){if(!h){if(j){g=0;h=1;do{h=Z(c[b+8+(g<<2)>>2]|0,h)|0;g=g+1|0;}while((g|0)<(f|0));g=(h<<2)+20|0}else{g=24}h=Yb(g)|0;g=h;c[h>>2]=e;c[h+4>>2]=f;if(j){ac(h+8|0,n|0,f<<2)|0}if((l|0)<=0){t=g;i=d;return t|0}b=c[b+20>>2]|0;e=0;while(1){c[g+20+(e<<2)>>2]=(b|0)%(c[a+20+(e<<2)>>2]|0)|0;e=e+1|0;if((e|0)>=(l|0)){j=g;break}}i=d;return j|0}if(g){t=Yb(24)|0;c[t>>2]=e;c[t+4>>2]=0;c[t+20>>2]=(c[b+20>>2]|0)%(c[a+20>>2]|0)|0;i=d;return t|0}do{if(j){h=0;g=1;do{g=Z(c[b+8+(h<<2)>>2]|0,g)|0;h=h+1|0;}while((h|0)<(f|0));if(j){k=0;h=1}else{h=24;break}do{h=Z(c[b+8+(k<<2)>>2]|0,h)|0;k=k+1|0;}while((k|0)<(f|0));h=(h<<2)+20|0}else{h=24;g=1}}while(0);k=Yb(h)|0;h=k;c[k>>2]=e;c[k+4>>2]=f;if(j){ac(k+8|0,n|0,f<<2)|0}if((g|0)<=0){t=h;i=d;return t|0}a=c[a+20>>2]|0;e=0;while(1){c[h+20+(e<<2)>>2]=(c[b+20+(e<<2)>>2]|0)%(a|0)|0;e=e+1|0;if((e|0)>=(g|0)){j=h;break}}i=d;return j|0}h=c[n>>2]|0;g=(h|0)>1;k=(c[r>>2]|0)>1;do{if(g){if(!k){break}if(j){g=1;k=1;while(1){k=Z(h,k)|0;if((g|0)>=(f|0)){break}h=c[b+8+(g<<2)>>2]|0;g=g+1|0}g=(k<<2)+20|0}else{g=24}h=Yb(g)|0;g=h;c[h>>2]=e;c[h+4>>2]=f;if(j){ac(h+8|0,n|0,f<<2)|0}if((l|0)>0){e=0}else{t=g;i=d;return t|0}while(1){c[g+20+(e<<2)>>2]=(c[b+20+(e<<2)>>2]|0)%(c[a+20+(e<<2)>>2]|0)|0;e=e+1|0;if((e|0)>=(l|0)){j=g;break}}i=d;return j|0}else{if(!k){break}if(j){g=1;k=1;while(1){k=Z(h,k)|0;if((g|0)>=(f|0)){break}h=c[b+8+(g<<2)>>2]|0;g=g+1|0}g=(k<<2)+20|0}else{g=24}h=Yb(g)|0;g=h;c[h>>2]=e;c[h+4>>2]=f;if(j){ac(h+8|0,n|0,f<<2)|0}if((l|0)<=0){t=g;i=d;return t|0}b=c[b+20>>2]|0;e=0;while(1){c[g+20+(e<<2)>>2]=(b|0)%(c[a+20+(e<<2)>>2]|0)|0;e=e+1|0;if((e|0)>=(l|0)){j=g;break}}i=d;return j|0}}while(0);if(j){k=1;m=1;while(1){m=Z(h,m)|0;if((k|0)>=(f|0)){break}h=c[b+8+(k<<2)>>2]|0;k=k+1|0}h=(m<<2)+20|0}else{h=24}k=Yb(h)|0;h=k;c[k>>2]=e;c[k+4>>2]=f;if(j){ac(k+8|0,n|0,f<<2)|0}e=(l|0)>0;if(!g){if(!e){t=h;i=d;return t|0}c[k+20>>2]=(c[b+20>>2]|0)%(c[a+20>>2]|0)|0;t=h;i=d;return t|0}if(!e){t=h;i=d;return t|0}a=c[a+20>>2]|0;e=0;while(1){c[h+20+(e<<2)>>2]=(c[b+20+(e<<2)>>2]|0)%(a|0)|0;e=e+1|0;if((e|0)>=(l|0)){j=h;break}}i=d;return j|0}function ub(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=c[a+4>>2]|0;e=a+8|0;d=(b|0)>0;if(d){g=0;f=1;do{f=Z(c[a+8+(g<<2)>>2]|0,f)|0;g=g+1|0;}while((g|0)<(b|0));h=0;g=1;do{g=Z(c[a+8+(h<<2)>>2]|0,g)|0;h=h+1|0;}while((h|0)<(b|0));g=(g<<2)+20|0}else{g=24;f=1}h=Yb(g)|0;g=h;c[h>>2]=0;c[h+4>>2]=b;if(d){ac(h+8|0,e|0,b<<2)|0}if((f|0)>0){b=0}else{return g|0}do{d=c[a+20+(b<<2)>>2]|0;c[g+20+(b<<2)>>2]=(d|0)>-1?d:-d|0;b=b+1|0;}while((b|0)<(f|0));return g|0}function vb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=c[a+4>>2]|0;e=a+8|0;d=(b|0)>0;if(d){g=0;f=1;do{f=Z(c[a+8+(g<<2)>>2]|0,f)|0;g=g+1|0;}while((g|0)<(b|0));g=0;h=1;do{h=Z(c[a+8+(g<<2)>>2]|0,h)|0;g=g+1|0;}while((g|0)<(b|0));g=(h<<2)+20|0}else{g=24;f=1}h=Yb(g)|0;g=h;c[h>>2]=0;c[h+4>>2]=b;if(d){ac(h+8|0,e|0,b<<2)|0}if((f|0)>0){b=0}else{return g|0}do{c[g+20+(b<<2)>>2]=(c[a+20+(b<<2)>>2]|0)==0;b=b+1|0;}while((b|0)<(f|0));return g|0}function wb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;e=c[a+4>>2]|0;d=c[b+4>>2]|0;if((d|e|0)==0){a=((c[a+20>>2]|0)==(c[b+20>>2]|0)|48)-48|0;if(a>>>0>9>>>0){g=0;return g|0}g=Yb(24)|0;c[g>>2]=0;c[g+4>>2]=0;c[g+20>>2]=a;return g|0}do{if((e|0)==(d|0)){f=(e|0)>0;if(f){g=0;d=1;do{d=Z(c[a+8+(g<<2)>>2]|0,d)|0;g=g+1|0;}while((g|0)<(e|0));if(f){f=0;g=1;do{g=Z(c[b+8+(f<<2)>>2]|0,g)|0;f=f+1|0;}while((f|0)<(e|0))}else{g=1}if((d|0)!=(g|0)){break}}else{d=1}e=0;while(1){if((e|0)>=(d|0)){a=12;break}if((c[a+20+(e<<2)>>2]|0)==(c[b+20+(e<<2)>>2]|0)){e=e+1|0}else{a=11;break}}if((a|0)==11){g=Yb(24)|0;c[g>>2]=0;c[g+4>>2]=0;c[g+20>>2]=0;return g|0}else if((a|0)==12){g=Yb(24)|0;c[g>>2]=0;c[g+4>>2]=0;c[g+20>>2]=1;return g|0}}}while(0);g=Yb(24)|0;c[g>>2]=0;c[g+4>>2]=0;c[g+20>>2]=0;return g|0}function xb(a){a=a|0;var b=0,d=0,e=0;b=c[a+4>>2]|0;if((b|0)>0){d=0;e=1;do{e=Z(c[a+8+(d<<2)>>2]|0,e)|0;d=d+1|0;}while((d|0)<(b|0))}else{e=1}d=Yb((e<<2)+20|0)|0;b=d;c[d>>2]=0;c[d+4>>2]=1;c[d+8>>2]=e;if((e|0)<=0){return b|0}ac(d+20|0,a+20|0,e<<2)|0;return b|0}function yb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;e=c[a+4>>2]|0;if((e|0)>0){f=0;d=1;do{d=Z(c[a+8+(f<<2)>>2]|0,d)|0;f=f+1|0;}while((f|0)<(e|0))}else{d=1}e=c[b+4>>2]|0;if((e|0)>0){g=0;f=1;do{f=Z(c[b+8+(g<<2)>>2]|0,f)|0;g=g+1|0;}while((g|0)<(e|0))}else{f=1}h=f+d|0;i=c[b>>2]|0;g=Yb((h<<2)+20|0)|0;e=g;c[g>>2]=i;c[g+4>>2]=1;c[g+8>>2]=h;if((d|0)>0){ac(g+20|0,a+20|0,d<<2)|0}if((f|0)<=0){return e|0}ac(g+((d<<2)+20)|0,b+20|0,f<<2)|0;return e|0}function zb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;i=i+8|0;u=d|0;v=u;p=i;i=i+8|0;q=p;j=i;i=i+12|0;i=i+7&-8;h=i;i=i+8|0;t=i;i=i+8|0;o=t;s=i;i=i+8|0;r=s;k=i;i=i+12|0;i=i+7&-8;m=i;i=i+12|0;i=i+7&-8;l=i;i=i+12|0;i=i+7&-8;n=i;i=i+12|0;i=i+7&-8;f=c[a>>2]&3&c[b>>2];g=c[a+4>>2]|0;do{if((g|0)==0){g=c[b+4>>2]|0;if((g|0)==1){c[p>>2]=2;v=c[b+8>>2]|0;c[q+4>>2]=v;j=Yb((v<<3)+20|0)|0;c[j>>2]=f;c[j+4>>2]=2;g=j+8|0;u=c[p+4>>2]|0;c[g>>2]=c[p>>2];c[g+4>>2]=u;g=Yb((v<<2)+20|0)|0;c[g>>2]=f;c[g+4>>2]=1;c[g+8>>2]=v;c[g+20>>2]=c[a+20>>2];_b(g+24|0,0,v-1|0)|0;a=g;g=1;break}else if((g|0)==0){c[u>>2]=2;c[v+4>>2]=1;j=Yb(28)|0;c[j>>2]=f;c[j+4>>2]=2;g=j+8|0;v=c[u+4>>2]|0;c[g>>2]=c[u>>2];c[g+4>>2]=v;g=0;break}else{q=(c[b+8>>2]|0)+1|0;c[j>>2]=q;k=c[b+12>>2]|0;c[j+4>>2]=k;m=c[b+16>>2]|0;c[j+8>>2]=m;n=j;l=(g|0)>0;if(l){o=1;p=1;while(1){p=Z(q,p)|0;if((o|0)>=(g|0)){break}q=c[j+(o<<2)>>2]|0;o=o+1|0}j=(p<<2)+20|0}else{j=24}o=Yb(j)|0;j=o;c[o>>2]=f;c[o+4>>2]=g;if(l){ac(o+8|0,n|0,g<<2)|0}l=g-1|0;c[h>>2]=k;c[h+4>>2]=m;n=h;m=(l|0)>0;if(m){o=1;p=1;while(1){p=Z(k,p)|0;if((o|0)>=(l|0)){break}k=c[h+(o<<2)>>2]|0;o=o+1|0}h=(p<<2)+20|0}else{h=24}h=Yb(h)|0;k=h;c[h>>2]=f;c[h+4>>2]=l;if(m){f=h+8|0;ac(f|0,n|0,l<<2)|0;c[h+20>>2]=c[a+20>>2];a=0;m=1;do{m=Z(c[f+(a<<2)>>2]|0,m)|0;a=a+1|0;}while((a|0)<(l|0));f=m-1|0}else{c[h+20>>2]=c[a+20>>2];f=0}_b(h+24|0,0,f|0)|0;a=k;break}}else if((g|0)==1){g=c[b+4>>2]|0;if((g|0)==1){c[s>>2]=2;j=c[a+8>>2]|0;c[r+4>>2]=j;j=Yb((j<<3)+20|0)|0;c[j>>2]=f;c[j+4>>2]=2;g=j+8|0;v=c[s+4>>2]|0;c[g>>2]=c[s>>2];c[g+4>>2]=v;g=1;break}else if((g|0)==0){c[t>>2]=2;j=c[a+8>>2]|0;c[o+4>>2]=j;j=Yb((j<<3)+20|0)|0;c[j>>2]=f;c[j+4>>2]=2;g=j+8|0;v=c[t+4>>2]|0;c[g>>2]=c[t>>2];c[g+4>>2]=v;g=0;break}else{n=(c[b+8>>2]|0)+1|0;c[k>>2]=n;c[k+4>>2]=c[b+12>>2];c[k+8>>2]=c[b+16>>2];l=k;h=(g|0)>0;if(h){j=1;m=1;while(1){m=Z(n,m)|0;if((j|0)>=(g|0)){break}n=c[k+(j<<2)>>2]|0;j=j+1|0}j=(m<<2)+20|0}else{j=24}k=Yb(j)|0;j=k;c[k>>2]=f;c[k+4>>2]=g;if(!h){break}ac(k+8|0,l|0,g<<2)|0;break}}else{h=c[b+4>>2]|0;if((h|0)==1){n=(c[a+8>>2]|0)+1|0;c[l>>2]=n;c[l+4>>2]=c[a+12>>2];c[l+8>>2]=c[a+16>>2];k=l;h=(g|0)>0;if(h){j=1;m=1;while(1){m=Z(n,m)|0;if((j|0)>=(g|0)){break}n=c[l+(j<<2)>>2]|0;j=j+1|0}j=(m<<2)+20|0}else{j=24}l=Yb(j)|0;j=l;c[l>>2]=f;c[l+4>>2]=g;if(!h){g=1;break}ac(l+8|0,k|0,g<<2)|0;g=1;break}else if((h|0)==0){n=(c[a+8>>2]|0)+1|0;c[m>>2]=n;c[m+4>>2]=c[a+12>>2];c[m+8>>2]=c[a+16>>2];k=m;h=(g|0)>0;if(h){j=1;l=1;while(1){l=Z(n,l)|0;if((j|0)>=(g|0)){break}n=c[m+(j<<2)>>2]|0;j=j+1|0}j=(l<<2)+20|0}else{j=24}l=Yb(j)|0;j=l;c[l>>2]=f;c[l+4>>2]=g;if(!h){g=0;break}ac(l+8|0,k|0,g<<2)|0;g=0;break}else{o=(c[b+8>>2]|0)+(c[a+8>>2]|0)|0;c[n>>2]=o;c[n+4>>2]=c[a+12>>2];c[n+8>>2]=c[a+16>>2];k=n;l=(g|0)>0;if(l){j=1;m=1;while(1){m=Z(o,m)|0;if((j|0)>=(g|0)){break}o=c[n+(j<<2)>>2]|0;j=j+1|0}j=(m<<2)+20|0}else{j=24}m=Yb(j)|0;j=m;c[m>>2]=f;c[m+4>>2]=g;if(!l){g=h;break}ac(m+8|0,k|0,g<<2)|0;g=h;break}}}while(0);f=j;h=c[a+4>>2]|0;if((h|0)>0){l=0;k=1;do{k=Z(c[a+8+(l<<2)>>2]|0,k)|0;l=l+1|0;}while((l|0)<(h|0));if((k|0)>0){e=52}else{a=k}}else{k=1;e=52}if((e|0)==52){ac(j+20|0,a+20|0,(k|0)>1?k<<2:4)|0;a=k}do{if((g|0)>0){e=0;h=1;do{h=Z(c[b+8+(e<<2)>>2]|0,h)|0;e=e+1|0;}while((e|0)<(g|0));if((h|0)>0){break}i=d;return j|0}else{h=1}}while(0);ac(f+((a<<2)+20)|0,b+20|0,(h|0)>1?h<<2:4)|0;i=d;return j|0}function Ab(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;do{if((c[a+4>>2]|0)==0){e=1;d=a+20|0;g=3}else{e=c[a+8>>2]|0;d=a+20|0;if((e|0)>0){g=3;break}f=24;a=0;h=1;i=c[b>>2]|0}}while(0);if((g|0)==3){a=0;h=1;do{h=Z(c[d+(a<<2)>>2]|0,h)|0;a=a+1|0;}while((a|0)<(e|0));i=c[b>>2]|0;a=0;f=1;do{f=Z(c[d+(a<<2)>>2]|0,f)|0;a=a+1|0;}while((a|0)<(e|0));f=(f<<2)+20|0;a=1}g=Yb(f)|0;f=g;c[g>>2]=i;c[g+4>>2]=e;if(a){ac(g+8|0,d|0,e<<2)|0}if((h|0)<=0){return f|0}ac(g+20|0,b+20|0,h<<2)|0;return f|0}function Bb(a){a=a|0;var b=0,d=0,e=0;e=c[a+4>>2]|0;d=Yb((e<<2)+20|0)|0;b=d;c[d>>2]=0;c[d+4>>2]=1;c[d+8>>2]=e;if((e|0)<=0){return b|0}ac(d+20|0,a+8|0,e<<2)|0;return b|0}function Cb(a){a=a|0;return a|0}function Db(a){a=a|0;var b=0,d=0,e=0;e=c[a+4>>2]|0;d=Yb((e<<2)+20|0)|0;b=d;c[d>>2]=0;c[d+4>>2]=1;c[d+8>>2]=e;if((e|0)<=0){return b|0}ac(d+20|0,a+8|0,e<<2)|0;return b|0}function Eb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;h=c[a+4>>2]|0;f=a+8|0;do{if((h|0)>0){g=0;e=1;do{e=Z(c[a+8+(g<<2)>>2]|0,e)|0;g=g+1|0;}while((g|0)<(h|0));if((h|0)<=1){if((e|0)>0){d=5;break}else{f=0;g=0;break}}e=Yb(24)|0;c[e>>2]=0;c[e+4>>2]=0;d=e+20|0;c[d>>2]=0;if((c[f>>2]|0)==0){h=0;return h|0}i=Eb(gb(e,a)|0,b)|0;j=c[i>>2]|1;g=Yb(24)|0;h=g;c[g>>2]=j;c[g+4>>2]=0;c[g+20>>2]=i;f=(c[f>>2]|0)-1|0;if((f|0)>0){g=0}else{j=h;return j|0}while(1){g=g+1|0;c[d>>2]=g;i=Eb(gb(e,a)|0,b)|0;k=c[i>>2]|1;j=Yb(24)|0;c[j>>2]=k;c[j+4>>2]=0;c[j+20>>2]=i;h=zb(h,j)|0;if((g|0)>=(f|0)){d=h;break}}return d|0}else{e=1;d=5}}while(0);if((d|0)==5){d=0;f=0;while(1){f=((c[a+20+(d<<2)>>2]|0)!=0)+f|0;d=d+1|0;if((d|0)>=(e|0)){g=1;break}}}k=Yb((f<<2)+20|0)|0;d=k;c[k>>2]=0;c[k+4>>2]=1;c[k+8>>2]=f;if(g){g=0;f=0}else{k=d;return k|0}do{if((c[a+20+(g<<2)>>2]|0)!=0){c[d+20+(f<<2)>>2]=c[b+20+(g<<2)>>2];f=f+1|0}g=g+1|0;}while((g|0)<(e|0));return d|0}function Fb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;d=c[a+4>>2]|0;e=a+8|0;if((d|0)>0){g=0;f=1;do{f=Z(c[a+8+(g<<2)>>2]|0,f)|0;g=g+1|0;}while((g|0)<(d|0));g=0;h=1;do{h=Z(c[a+8+(g<<2)>>2]|0,h)|0;g=g+1|0;}while((g|0)<(d|0));g=(h<<2)+20|0;h=1}else{g=24;f=1;h=0}i=Yb(g)|0;g=i;c[i>>2]=0;c[i+4>>2]=d;if(h){ac(i+8|0,e|0,d<<2)|0}if((f|0)>0){d=0}else{return g|0}do{if((c[a+20+(d<<2)>>2]|0)==0){e=0}else{e=c[b+20+(d<<2)>>2]|0}c[g+20+(d<<2)>>2]=e;d=d+1|0;}while((d|0)<(f|0));return g|0}function Gb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;d=c[b+4>>2]|0;if((d|0)>0){g=0;f=1;do{f=Z(c[b+8+(g<<2)>>2]|0,f)|0;g=g+1|0;}while((g|0)<(d|0))}else{f=1}d=c[a+4>>2]|0;if((d|0)==0){a=a+20|0;d=0;while(1){if((d|0)>=(f|0)){h=0;e=17;break}if((c[a>>2]|0)==(c[b+20+(d<<2)>>2]|0)){break}else{d=d+1|0}}if((e|0)==17){return h|0}j=Yb(24)|0;c[j>>2]=0;c[j+4>>2]=0;c[j+20>>2]=d;return j|0}i=a+8|0;f=(d|0)>0;if(f){g=0;e=1;do{e=Z(c[a+8+(g<<2)>>2]|0,e)|0;g=g+1|0;}while((g|0)<(d|0))}else{e=1}g=Yb(24)|0;c[g>>2]=0;c[g+4>>2]=0;c[g+20>>2]=0;if(f){h=0;j=1;do{j=Z(c[a+8+(h<<2)>>2]|0,j)|0;h=h+1|0;}while((h|0)<(d|0));h=(j<<2)+20|0}else{h=24}j=Yb(h)|0;h=j;c[j>>2]=0;c[j+4>>2]=d;if(f){ac(j+8|0,i|0,d<<2)|0}if((e|0)>0){d=0}else{j=h;return j|0}do{c[g+20>>2]=d;g=Gb(gb(g,a)|0,b)|0;c[h+20+(d<<2)>>2]=c[g+20>>2];d=d+1|0;}while((d|0)<(e|0));return h|0}function Hb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=c[a+4>>2]|0;d=a+8|0;if((b|0)>0){f=0;e=1;do{e=Z(c[a+8+(f<<2)>>2]|0,e)|0;f=f+1|0;}while((f|0)<(b|0));f=0;g=1;do{g=Z(c[a+8+(f<<2)>>2]|0,g)|0;f=f+1|0;}while((f|0)<(b|0));f=(g<<2)+20|0;g=1}else{f=24;e=1;g=0}h=Yb(f)|0;f=h;c[h>>2]=0;c[h+4>>2]=b;if(g){ac(h+8|0,d|0,b<<2)|0}if((e|0)<=0){return f|0}b=e-1|0;d=0;do{c[f+20+(d<<2)>>2]=c[a+20+(b-d<<2)>>2];d=d+1|0;}while((d|0)<(e|0));return f|0}function Ib(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;d=b;f=c[b+4>>2]|0;e=b+8|0;if((f|0)>0){h=0;g=1;do{g=Z(c[b+8+(h<<2)>>2]|0,g)|0;h=h+1|0;}while((h|0)<(f|0));a=c[a+20>>2]|0;h=0;i=1;do{i=Z(c[b+8+(h<<2)>>2]|0,i)|0;h=h+1|0;}while((h|0)<(f|0));h=(i<<2)+20|0;i=a;j=1}else{h=24;g=1;i=c[a+20>>2]|0;j=0}h=Yb(h)|0;a=h;c[h>>2]=0;c[h+4>>2]=f;if(j){ac(h+8|0,e|0,f<<2)|0}e=(((i|0)<0?g:0)+i|0)%(g|0)|0;f=g-e|0;if((f|0)>0){ac(h+20|0,d+((e<<2)+20)|0,f<<2)|0}if((e|0)<=0){return a|0}ac(h+((f<<2)+20)|0,b+20|0,e<<2)|0;return a|0}function Jb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;d=Yb(24)|0;c[d>>2]=0;c[d+4>>2]=0;e=d+20|0;c[e>>2]=0;if((c[a>>2]&2|0)==0){ma(2312,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0)|0;i=h;h=d;i=b;return h|0}if((c[a+4>>2]|0)<=1){h=Kb(a+20|0)|0;i=b;return h|0}f=c[a+8>>2]|0;if((f|0)>0){h=0}else{h=0;i=b;return h|0}do{c[e>>2]=h;g=Kb((gb(d,a)|0)+20|0)|0;h=h+1|0;}while((h|0)<(f|0));i=b;return g|0}function Kb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0.0,q=0.0;b=i;f=a+4|0;d=c[a>>2]|0;if((d|0)==32){e=a;while(1){a=e+4|0;d=c[a>>2]|0;if((d|0)==32){e=a}else{break}}f=e+8|0}a:while(1){e=c[f>>2]|0;if((d|0)==40){d=1;f=1;do{e=c[a+(f<<2)>>2]|0;if((e|0)==41){d=d-1|0}else if((e|0)==0){break}else if((e|0)==40){d=d+1|0}f=f+1|0;}while((d|0)!=0);e=f-1|0;d=a+(e<<2)|0;if((c[d>>2]|0)!=41){h=13;break}g=Yb(e<<2)|0;if((e|0)>0){h=0;while(1){j=h+1|0;c[g+(h<<2)>>2]=c[a+(j<<2)>>2];if((j|0)<(e|0)){h=j}else{break}}}c[g+(f-2<<2)>>2]=0;f=a+(f<<2)|0;a=d;d=Kb(g)|0;continue}else if((d|0)==24){d=0;h=5;break}else if((d|0)==19){h=17;break}if((d|0)>95){if((d|0)<123&(e|0)==4){h=33;break}}if(d>>>0<27>>>0){f=c[264+(d<<2)>>2]|0;if((f|0)!=0){h=37;break}if((c[40+(d<<2)>>2]|0)!=0){h=37;break}}if((e|0)==20){h=50;break}else if((e|0)==0){h=196;break}if(e>>>0<27>>>0){g=264+(e<<2)|0;if((c[g>>2]|0)!=0){h=80;break}if((c[40+(e<<2)>>2]|0)!=0){h=80;break}}f=d-96|0;if(f>>>0<27>>>0){g=c[2344+(f<<2)>>2]|0;f=c[g+4>>2]|0;h=g+8|0;if((f|0)>0){d=0;k=1;do{k=Z(c[g+8+(d<<2)>>2]|0,k)|0;d=d+1|0;}while((d|0)<(f|0));j=c[g>>2]|0;d=0;l=1;do{l=Z(c[g+8+(d<<2)>>2]|0,l)|0;d=d+1|0;}while((d|0)<(f|0));d=(l<<2)+20|0;l=1}else{d=24;k=1;j=c[g>>2]|0;l=0}d=Yb(d)|0;c[d>>2]=j;c[d+4>>2]=f;if(l){ac(d+8|0,h|0,f<<2)|0}if((k|0)>0){ac(d+20|0,g+20|0,k<<2)|0}}if((e|0)!=32){f=d;g=e-96|0;if(g>>>0<27>>>0){g=c[2344+(g<<2)>>2]|0;j=c[g+4>>2]|0;h=g+8|0;if((j|0)>0){e=0;l=1;do{l=Z(c[g+8+(e<<2)>>2]|0,l)|0;e=e+1|0;}while((e|0)<(j|0));k=c[g>>2]|0;m=0;e=1;do{e=Z(c[g+8+(m<<2)>>2]|0,e)|0;m=m+1|0;}while((m|0)<(j|0));e=(e<<2)+20|0;m=1}else{e=24;l=1;k=c[g>>2]|0;m=0}e=Yb(e)|0;c[e>>2]=k;c[e+4>>2]=j;if(m){ac(e+8|0,h|0,j<<2)|0}if((l|0)>0){ac(e+20|0,g+20|0,l<<2)|0}}g=e;if((c[f+4>>2]|0)!=0){h=196;break}if((c[g+4>>2]|0)!=0){h=196;break}p=+(c[f+20>>2]|0);d=g+20|0;f=c[d>>2]|0;if((((f|0)>-1?f:-f|0)|0)>1){q=+(~~+Y(+xa(+(+(f|0)+1.0)))|0);f=c[d>>2]|0}else{q=1.0}c[d>>2]=~~(p*+O(+10.0,+q)+ +(f|0));f=a+8|0;a=a+4|0;d=e;continue}f=a+8|0;e=c[f>>2]|0;if((e|0)==0){h=196;break}do{if(e>>>0<27>>>0){if((c[264+(e<<2)>>2]|0)==0){if((c[40+(e<<2)>>2]|0)==0){break}}a=a+4|0;continue a}}while(0);if((e|0)==40){f=1;e=1;do{g=c[a+(f+2<<2)>>2]|0;if((g|0)==0){break}else if((g|0)==40){e=e+1|0}else if((g|0)==41){e=e-1|0}f=f+1|0;}while((e|0)!=0);h=f-1|0;e=a+(f+1<<2)|0;if((c[e>>2]|0)!=41){h=125;break}j=Yb(h<<2)|0;if((h|0)>0){g=0;do{c[j+(g<<2)>>2]=c[a+(g+3<<2)>>2];g=g+1|0;}while((g|0)<(h|0))}c[j+(f-2<<2)>>2]=0;g=Kb(j)|0;h=d;d=c[h+4>>2]|0;if((d|0)>0){k=0;j=1;do{j=Z(c[h+8+(k<<2)>>2]|0,j)|0;k=k+1|0;}while((k|0)<(d|0))}else{j=1}d=c[g+4>>2]|0;if((d|0)>0){k=0;l=1;do{l=Z(c[g+8+(k<<2)>>2]|0,l)|0;k=k+1|0;}while((k|0)<(d|0))}else{l=1}o=l+j|0;n=c[g>>2]|0;d=Yb((o<<2)+20|0)|0;c[d>>2]=n;c[d+4>>2]=1;c[d+8>>2]=o;if((j|0)>0){ac(d+20|0,h+20|0,j<<2)|0}if((l|0)>0){ac(d+((j<<2)+20)|0,g+20|0,l<<2)|0}f=a+(f+2<<2)|0;a=e;continue}g=e-96|0;if(g>>>0<27>>>0){h=c[2344+(g<<2)>>2]|0;g=c[h+4>>2]|0;j=h+8|0;if((g|0)>0){e=0;l=1;do{l=Z(c[h+8+(e<<2)>>2]|0,l)|0;e=e+1|0;}while((e|0)<(g|0));e=c[h>>2]|0;m=0;k=1;do{k=Z(c[h+8+(m<<2)>>2]|0,k)|0;m=m+1|0;}while((m|0)<(g|0));k=(k<<2)+20|0;m=e;n=1}else{k=24;l=1;m=c[h>>2]|0;n=0}e=Yb(k)|0;c[e>>2]=m;c[e+4>>2]=g;if(n){ac(e+8|0,j|0,g<<2)|0}if((l|0)>0){ac(e+20|0,h+20|0,l<<2)|0}}g=c[a+12>>2]|0;b:do{if((g|0)!=0){a=f;while(1){if(g>>>0<27>>>0){if((c[264+(g<<2)>>2]|0)!=0){f=a;break b}f=(c[40+(g<<2)>>2]|0)==0}else{f=1}if(!(f&(g|0)!=32)){f=a;break b}f=g-96|0;if(f>>>0<27>>>0){f=c[2344+(f<<2)>>2]|0;g=c[f+4>>2]|0;h=f+8|0;if((g|0)>0){k=0;j=1;do{j=Z(c[f+8+(k<<2)>>2]|0,j)|0;k=k+1|0;}while((k|0)<(g|0));k=c[f>>2]|0;l=0;m=1;do{m=Z(c[f+8+(l<<2)>>2]|0,m)|0;l=l+1|0;}while((l|0)<(g|0));l=(m<<2)+20|0;m=1}else{l=24;j=1;k=c[f>>2]|0;m=0}l=Yb(l)|0;c[l>>2]=k;c[l+4>>2]=g;if(m){ac(l+8|0,h|0,g<<2)|0}if((j|0)>0){ac(l+20|0,f+20|0,j<<2)|0}g=l}f=g;if((c[f+4>>2]|0)!=0){f=a;break b}p=+(c[e+20>>2]|0);e=f+20|0;f=c[e>>2]|0;if((((f|0)>-1?f:-f|0)|0)>1){q=+(~~+Y(+xa(+(+(f|0)+1.0)))|0);f=c[e>>2]|0}else{q=1.0}c[e>>2]=~~(p*+O(+10.0,+q)+ +(f|0));f=a+4|0;h=c[a+8>>2]|0;if((h|0)==0){e=g;break}else{e=g;a=f;g=h}}}}while(0);a=d;d=c[a+4>>2]|0;if((d|0)>0){h=0;g=1;do{g=Z(c[a+8+(h<<2)>>2]|0,g)|0;h=h+1|0;}while((h|0)<(d|0))}else{g=1}d=c[e+4>>2]|0;if((d|0)>0){j=0;h=1;do{h=Z(c[e+8+(j<<2)>>2]|0,h)|0;j=j+1|0;}while((j|0)<(d|0))}else{h=1}o=h+g|0;n=c[e>>2]|0;d=Yb((o<<2)+20|0)|0;c[d>>2]=n;c[d+4>>2]=1;c[d+8>>2]=o;if((g|0)>0){ac(d+20|0,a+20|0,g<<2)|0}if((h|0)>0){ac(d+((g<<2)+20)|0,e+20|0,h<<2)|0}a=f;f=f+4|0}if((h|0)==5){while(1){h=d+1|0;if((c[a+(h<<2)>>2]|0)==0){break}else{d=h;h=5}}f=Yb((h<<2)+20|0)|0;g=f;c[f>>2]=2;c[f+4>>2]=1;c[f+8>>2]=h;f=f+20|0;if((h|0)>0){d=0}else{o=g;i=b;return o|0}while(1){e=d+1|0;c[f+(d<<2)>>2]=c[a+(e<<2)>>2];if((e|0)<(h|0)){d=e}else{break}}i=b;return g|0}else if((h|0)==13){ra(448)|0;o=Yb(24)|0;c[o>>2]=0;c[o+4>>2]=0;c[o+20>>2]=0;i=b;return o|0}else if((h|0)==17){do{if((e|0)>95){if((e|0)>=123){d=19;break}a=a+4|0;d=c[2344+(e-96<<2)>>2]|0}else{if((e|0)==40){f=1;g=1}else{d=19;break}while(1){e=g+1|0;d=c[a+(e<<2)>>2]|0;if((d|0)==41){f=f-1|0}else if((d|0)==0){break}else if((d|0)==40){f=f+1|0}ma(2264,(o=i,i=i+24|0,c[o>>2]=g,c[o+8>>2]=f,c[o+16>>2]=d,o)|0)|0;i=o;if((f|0)==0){g=e;break}else{g=e}}f=g-1|0;e=a+(g<<2)|0;if((c[e>>2]|0)!=41){ra(448)|0;o=Yb(24)|0;c[o>>2]=0;c[o+4>>2]=0;c[o+20>>2]=0;i=b;return o|0}j=Yb((f<<2)+20|0)|0;h=j;c[j>>2]=2;c[j+4>>2]=1;c[j+8>>2]=f;d=j;j=j+20|0;if((f|0)>0){k=0;do{c[j+(k<<2)>>2]=c[a+(k+2<<2)>>2];k=k+1|0;}while((k|0)<(f|0))}c[h+20+(g-2<<2)>>2]=0;a=e}}while(0);a=Kb(a+4|0)|0;n=c[611]|0;o=c[612]|0;c[611]=a;c[612]=0;d=Jb(d)|0;a=c[612]|0;c[611]=n;c[612]=o;o=(a|0)==0?d:a;i=b;return o|0}else if((h|0)==33){o=Kb(a+8|0)|0;c[2344+(d-96<<2)>>2]=o;i=b;return o|0}else if((h|0)==37){if((e|0)==32){while(1){g=a+4|0;e=c[a+8>>2]|0;if((e|0)==32){a=g}else{a=g;break}}}do{if(e>>>0<27>>>0){g=c[1256+(e<<2)>>2]|0;if((g|0)==0){break}if((pa(472+(e*28|0)|0,d|0)|0)==0){break}o=Kb(a+8|0)|0;o=Oa[g&63](o,d)|0;i=b;return o|0}}while(0);e=c[40+(d<<2)>>2]|0;do{if((e|0)==0){d=c[152+(d<<2)>>2]|0;if((d|0)==0){break}d=d-48|0;if(d>>>0>9>>>0){d=0}else{o=Yb(24)|0;c[o>>2]=0;c[o+4>>2]=0;c[o+20>>2]=d;d=o}o=Kb(a+4|0)|0;o=Oa[f&63](d,o)|0;i=b;return o|0}}while(0);o=Kb(a+4|0)|0;o=Ma[e&31](o)|0;i=b;return o|0}else if((h|0)==50){f=a+8|0;e=c[f>>2]|0;do{if((e|0)>95){if((e|0)<123){a=f;e=c[2344+(e-96<<2)>>2]|0;break}else{a=a+4|0;break}}else{if((e|0)==40){e=1;j=1}else{a=a+4|0;break}do{f=c[a+(j+2<<2)>>2]|0;if((f|0)==41){e=e-1|0}else if((f|0)==40){e=e+1|0}else if((f|0)==0){break}j=j+1|0;}while((e|0)!=0);g=j-1|0;h=a+(j+1<<2)|0;if((c[h>>2]|0)!=41){ra(448)|0;o=Yb(24)|0;c[o>>2]=0;c[o+4>>2]=0;c[o+20>>2]=0;i=b;return o|0}f=Yb((g<<2)+20|0)|0;k=f;c[f>>2]=2;c[f+4>>2]=1;c[f+8>>2]=g;e=f;f=f+20|0;if((g|0)>0){l=0;do{c[f+(l<<2)>>2]=c[a+(l+3<<2)>>2];l=l+1|0;}while((l|0)<(g|0))}c[k+20+(j-2<<2)>>2]=0;a=h}}while(0);f=d-96|0;if(f>>>0<27>>>0){h=c[2344+(f<<2)>>2]|0;g=c[h+4>>2]|0;f=h+8|0;if((g|0)>0){d=0;k=1;do{k=Z(c[h+8+(d<<2)>>2]|0,k)|0;d=d+1|0;}while((d|0)<(g|0));d=c[h>>2]|0;j=0;l=1;do{l=Z(c[h+8+(j<<2)>>2]|0,l)|0;j=j+1|0;}while((j|0)<(g|0));j=(l<<2)+20|0;l=d;m=1}else{j=24;k=1;l=c[h>>2]|0;m=0}d=Yb(j)|0;c[d>>2]=l;c[d+4>>2]=g;if(m){ac(d+8|0,f|0,g<<2)|0}if((k|0)>0){ac(d+20|0,h+20|0,k<<2)|0}}a=Kb(a+4|0)|0;m=c[610]|0;n=c[611]|0;o=c[612]|0;c[610]=d;c[611]=a;c[612]=0;a=Jb(e)|0;d=c[612]|0;c[610]=m;c[611]=n;c[612]=o;o=(d|0)==0?a:d;i=b;return o|0}else if((h|0)==80){while(1){j=a+8|0;h=c[j>>2]|0;if((h|0)==32){a=a+4|0;h=80}else{break}}do{if(h>>>0<27>>>0){f=2152+(h<<2)|0;if((c[f>>2]|0)==0){break}if((pa(1368+(h*28|0)|0,e|0)|0)==0){break}while(1){g=a+12|0;if((c[g>>2]|0)==32){a=a+4|0}else{break}}a=Kb(a+16|0)|0;h=d-96|0;if(h>>>0<27>>>0){k=c[2344+(h<<2)>>2]|0;h=c[k+4>>2]|0;j=k+8|0;if((h|0)>0){d=0;l=1;do{l=Z(c[k+8+(d<<2)>>2]|0,l)|0;d=d+1|0;}while((d|0)<(h|0));d=c[k>>2]|0;m=0;n=1;do{n=Z(c[k+8+(m<<2)>>2]|0,n)|0;m=m+1|0;}while((m|0)<(h|0));m=(n<<2)+20|0;o=d;n=1}else{m=24;l=1;o=c[k>>2]|0;n=0}d=Yb(m)|0;c[d>>2]=o;c[d+4>>2]=h;if(n){ac(d+8|0,j|0,h<<2)|0}if((l|0)>0){ac(d+20|0,k+20|0,l<<2)|0}}o=Ka[c[f>>2]&3](d,e,c[g>>2]|0,a)|0;i=b;return o|0}}while(0);a=Kb(j)|0;e=d-96|0;if(e>>>0<27>>>0){d=c[2344+(e<<2)>>2]|0}o=Oa[c[g>>2]&63](d,a)|0;i=b;return o|0}else if((h|0)==125){ra(448)|0;o=Yb(24)|0;c[o>>2]=0;c[o+4>>2]=0;c[o+20>>2]=0;i=b;return o|0}else if((h|0)==196){a=d-96|0;if(a>>>0<27>>>0){a=c[2344+(a<<2)>>2]|0;f=c[a+4>>2]|0;e=a+8|0;if((f|0)>0){d=0;h=1;do{h=Z(c[a+8+(d<<2)>>2]|0,h)|0;d=d+1|0;}while((d|0)<(f|0));g=c[a>>2]|0;j=0;d=1;do{d=Z(c[a+8+(j<<2)>>2]|0,d)|0;j=j+1|0;}while((j|0)<(f|0));d=(d<<2)+20|0;j=1}else{d=24;h=1;g=c[a>>2]|0;j=0}d=Yb(d)|0;c[d>>2]=g;c[d+4>>2]=f;if(j){ac(d+8|0,e|0,f<<2)|0}if((h|0)>0){ac(d+20|0,a+20|0,h<<2)|0}}if((d|0)==0){o=Yb(24)|0;c[o>>2]=0;c[o+4>>2]=0;c[o+20>>2]=0;i=b;return o|0}else{o=d;i=b;return o|0}}return 0}function Lb(a){a=a|0;var b=0;b=a|0;c[b>>2]=c[b>>2]&-4|2;return a|0}function Mb(a){a=a|0;return 0}function Nb(a,b){a=a|0;b=b|0;return 0}function Ob(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=(c[a+4>>2]|0)<2;if((b|0)==21){if(f){a=Qb(a,18)|0;e=Qb(Qb(e,18)|0,18)|0}e=Oa[c[264+(d<<2)>>2]&63](a,e)|0;return e|0}else{if(f){a=Qb(a,18)|0;e=Qb(Qb(e,18)|0,18)|0}e=Pb(Oa[c[264+(d<<2)>>2]&63](a,e)|0,b)|0;return e|0}return 0}function Pb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;f=c[a+4>>2]|0;e=a+8|0;if((f|0)>0){g=0;d=1;do{d=Z(c[a+8+(g<<2)>>2]|0,d)|0;g=g+1|0;}while((g|0)<(f|0))}else{d=1}g=(c[152+(b<<2)>>2]|0)-48|0;if(g>>>0>9>>>0){g=0}else{i=Yb(24)|0;c[i>>2]=0;c[i+4>>2]=0;c[i+20>>2]=g;g=i}f=(f|0)!=0;if((c[a>>2]&1|0)!=0){if(!f){i=Oa[c[264+(b<<2)>>2]&63](g,c[a+20>>2]|0)|0;return i|0}if((c[e>>2]|0)==0){i=g;return i|0}i=Pb(c[a+20>>2]|0,b)|0;d=d-1|0;if((d|0)>0){e=0}else{return i|0}do{e=e+1|0;i=zb(i,Pb(c[a+20+(e<<2)>>2]|0,b)|0)|0;}while((e|0)<(d|0));return i|0}if(!f){i=Oa[c[264+(b<<2)>>2]&63](g,a)|0;return i|0}if((c[e>>2]|0)==0){i=g;return i|0}g=Yb(24)|0;c[g>>2]=0;c[g+4>>2]=0;e=g+20|0;f=d-1|0;c[e>>2]=f;i=gb(g,a)|0;if((f|0)<=0){return i|0}d=d-2|0;b=264+(b<<2)|0;h=0;do{c[e>>2]=d-h;k=c[b>>2]|0;j=gb(g,a)|0;i=Oa[k&63](j,i)|0;h=h+1|0;}while((h|0)<(f|0));return i|0}function Qb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;d=i;i=i+16|0;f=d|0;e=d+8|0;g=c[a+4>>2]|0;do{if((g|0)==0){c[f>>2]=1;c[f+4>>2]=1;m=Yb(24)|0;c[m>>2]=0;c[m+4>>2]=2;l=m+8|0;k=c[f+4>>2]|0;c[l>>2]=c[f>>2];c[l+4>>2]=k;c[m+20>>2]=c[a+20>>2];a=m}else if((g|0)==1){c[e>>2]=1;f=c[a+8>>2]|0;c[e+4>>2]=f;g=Yb((f<<2)+20|0)|0;h=g;c[g>>2]=0;c[g+4>>2]=2;m=g+8|0;l=c[e+4>>2]|0;c[m>>2]=c[e>>2];c[m+4>>2]=l;if((f|0)<=0){a=h;break}ac(g+20|0,a+20|0,f<<2)|0;a=h}}while(0);switch(b|0){case 17:{break};case 8:{g=c[a+4>>2]|0;b=a+8|0;f=b;h=(g|0)>0;if(h){e=0;j=1;do{j=Z(c[a+8+(e<<2)>>2]|0,j)|0;e=e+1|0;}while((e|0)<(g|0));e=(j<<2)+20|0}else{e=24}j=Yb(e)|0;e=j;c[j>>2]=0;c[j+4>>2]=g;if(!h){m=e;i=d;return m|0}ac(j+8|0,f|0,g<<2)|0;f=c[j+12>>2]|0;if((f|0)<=0){m=e;i=d;return m|0}g=j+8|0;h=a+12|0;l=0;do{j=c[g>>2]|0;if((j|0)>0){k=0;do{m=c[h>>2]|0;c[e+20+((Z(m,k)|0)+l<<2)>>2]=c[a+20+((Z((c[b>>2]|0)+~k|0,m)|0)+l<<2)>>2];k=k+1|0;}while((k|0)<(j|0))}l=l+1|0;}while((l|0)<(f|0));i=d;return e|0};case 16:{g=c[a+4>>2]|0;b=a+8|0;h=b;f=(g|0)>0;if(f){e=0;j=1;do{j=Z(c[a+8+(e<<2)>>2]|0,j)|0;e=e+1|0;}while((e|0)<(g|0));e=(j<<2)+20|0}else{e=24}j=Yb(e)|0;e=j;c[j>>2]=0;c[j+4>>2]=g;k=j+8|0;if(!f){m=e;i=d;return m|0}ac(k|0,h|0,g<<2)|0;m=k;l=c[m>>2]|0;h=j+12|0;g=c[h>>2]|0;c[m>>2]=g;c[h>>2]=l;if((g|0)<=0){m=e;i=d;return m|0}f=a+12|0;j=0;while(1){if((l|0)>0){k=~j;m=0;do{n=c[b>>2]|0;o=c[f>>2]|0;c[e+20+((Z(n,j)|0)+m<<2)>>2]=c[a+20+(o+k+(Z(n+~m|0,o)|0)<<2)>>2];m=m+1|0;}while((m|0)<(l|0))}j=j+1|0;if((j|0)>=(g|0)){break}l=c[h>>2]|0}i=d;return e|0};case 1:{o=Qb(Qb(a,8)|0,11)|0;i=d;return o|0};case 11:{f=c[a+4>>2]|0;b=a+8|0;g=(f|0)>0;if(g){e=0;h=1;do{h=Z(c[a+8+(e<<2)>>2]|0,h)|0;e=e+1|0;}while((e|0)<(f|0));e=(h<<2)+20|0}else{e=24}h=Yb(e)|0;e=h;c[h>>2]=0;c[h+4>>2]=f;if(!g){o=e;i=d;return o|0}ac(h+8|0,b|0,f<<2)|0;b=c[h+12>>2]|0;if((b|0)<=0){o=e;i=d;return o|0}f=h+8|0;g=a+12|0;l=0;do{k=c[f>>2]|0;if((k|0)>0){j=~l;h=0;do{n=c[g>>2]|0;o=Z(n,h)|0;c[e+20+(o+l<<2)>>2]=c[a+20+(n+j+o<<2)>>2];h=h+1|0;}while((h|0)<(k|0))}l=l+1|0;}while((l|0)<(b|0));i=d;return e|0};case 4:{o=Qb(Qb(a,8)|0,16)|0;i=d;return o|0};case 7:{o=Qb(Qb(a,8)|0,18)|0;i=d;return o|0};case 18:{f=c[a+4>>2]|0;b=a+8|0;h=b;g=(f|0)>0;if(g){j=0;e=1;do{e=Z(c[a+8+(j<<2)>>2]|0,e)|0;j=j+1|0;}while((j|0)<(f|0));e=(e<<2)+20|0}else{e=24}j=Yb(e)|0;e=j;c[j>>2]=0;c[j+4>>2]=f;k=j+8|0;if(!g){o=e;i=d;return o|0}ac(k|0,h|0,f<<2)|0;o=k;k=c[o>>2]|0;f=j+12|0;h=c[f>>2]|0;c[o>>2]=h;c[f>>2]=k;if((h|0)<=0){o=e;i=d;return o|0}g=a+12|0;j=0;l=k;while(1){if((l|0)>0){k=0;do{o=c[a+20+((Z(c[g>>2]|0,k)|0)+j<<2)>>2]|0;c[e+20+((Z(c[b>>2]|0,j)|0)+k<<2)>>2]=o;k=k+1|0;}while((k|0)<(l|0))}j=j+1|0;if((j|0)>=(h|0)){break}l=c[f>>2]|0}i=d;return e|0};default:{ra(376)|0}}f=c[a+4>>2]|0;b=a+8|0;g=(f|0)>0;if(g){e=0;h=1;do{h=Z(c[a+8+(e<<2)>>2]|0,h)|0;e=e+1|0;}while((e|0)<(f|0));e=(h<<2)+20|0}else{e=24}h=Yb(e)|0;e=h;c[h>>2]=0;c[h+4>>2]=f;if(!g){o=e;i=d;return o|0}ac(h+8|0,b|0,f<<2)|0;b=c[h+12>>2]|0;if((b|0)<=0){o=e;i=d;return o|0}g=h+8|0;f=a+12|0;j=0;do{k=c[g>>2]|0;if((k|0)>0){h=0;do{o=(Z(c[f>>2]|0,h)|0)+j|0;c[e+20+(o<<2)>>2]=c[a+20+(o<<2)>>2];h=h+1|0;}while((h|0)<(k|0))}j=j+1|0;}while((j|0)<(b|0));i=d;return e|0}function Rb(a){a=a|0;var b=0,d=0;b=i;ma(2304,(d=i,i=i+8|0,c[d>>2]=a,d)|0)|0;i=d;i=b;return}function Sb(){Da(10)|0;return}function Tb(){return}function Ub(b){b=b|0;var d=0,e=0;d=i;if((b|0)==0){Da(10)|0;i=d;return}e=(b|0)>-1?b:-b|0;if((e|0)<27){Da(a[8+(e-1)|0]|0)|0;i=d;return}if((e|0)>=255){ma(2288,(e=i,i=i+8|0,c[e>>2]=c[b+20>>2],e)|0)|0;i=e;i=d;return}if((ja(b|0)|0)==0){ma(2296,(e=i,i=i+8|0,c[e>>2]=b,e)|0)|0;i=e;i=d;return}else{Da(b|0)|0;i=d;return}}function Vb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;b=i;f=c[a+4>>2]|0;e=a+8|0;d=(f|0)>0;do{if(d){g=0;h=1;do{h=Z(c[a+8+(g<<2)>>2]|0,h)|0;g=g+1|0;}while((g|0)<(f|0));if(d){d=0}else{break}do{ma(2304,(o=i,i=i+8|0,c[o>>2]=c[a+8+(d<<2)>>2],o)|0)|0;i=o;d=d+1|0;}while((d|0)<(f|0))}else{h=1}}while(0);Da(10)|0;j=c[a>>2]|0;d=(j|0)==2;g=d?2:4;d=d?4:2;if((j&1|0)!=0){if((h|0)>0){d=0}else{i=b;return}do{ma(2280,(o=i,i=i+1|0,i=i+7&-8,c[o>>2]=0,o)|0)|0;i=o;Vb(c[a+20+(d<<2)>>2]|0);d=d+1|0;}while((d|0)<(h|0));i=b;return}if((f|0)==0){La[d&7](c[a+20>>2]|0);Na[g&7]();i=b;return}else if((f|0)==1){if((h|0)>0){e=0;do{La[d&7](c[a+20+(e<<2)>>2]|0);e=e+1|0;}while((e|0)<(h|0))}Na[g&7]();i=b;return}else if((f|0)==2){e=c[e>>2]|0;if((e|0)<=0){i=b;return}f=a+12|0;h=0;do{j=c[f>>2]|0;a:do{if((j|0)>0){l=0;k=j;while(1){o=c[a+20+((Z(k,h)|0)+l<<2)>>2]|0;La[d&7](o);l=l+1|0;if((l|0)>=(j|0)){break a}k=c[f>>2]|0}}}while(0);Na[g&7]();h=h+1|0;}while((h|0)<(e|0));i=b;return}else if((f|0)==3){e=c[e>>2]|0;if((e|0)<=0){i=b;return}f=a+12|0;l=g;m=a+16|0;k=0;do{j=c[f>>2]|0;if((j|0)>0){h=0;do{g=c[m>>2]|0;b:do{if((g|0)>0){n=0;o=g;while(1){o=c[a+20+((Z((Z(c[f>>2]|0,k)|0)+h|0,o)|0)+n<<2)>>2]|0;La[d&7](o);n=n+1|0;if((n|0)>=(g|0)){break b}o=c[m>>2]|0}}}while(0);Na[l&7]();h=h+1|0;}while((h|0)<(j|0))}Na[l&7]();Na[l&7]();k=k+1|0;}while((k|0)<(e|0));i=b;return}else{i=b;return}}function Wb(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=0;do{p=Yb(24)|0;c[p>>2]=0;c[p+4>>2]=0;c[p+20>>2]=0;c[2344+(f<<2)>>2]=p;f=f+1|0;}while(f>>>0<28>>>0);o=b-1|0;p=Yb((o<<2)+20|0)|0;c[p>>2]=3;c[p+4>>2]=1;c[p+8>>2]=o;c[587]=p;if((b|0)>1){f=1}else{return 0}do{l=c[d+(f<<2)>>2]|0;k=($b(l|0)|0)+1|0;g=Yb((k<<2)+20|0)|0;c[g>>2]=2;c[g+4>>2]=1;c[g+8>>2]=k;k=$b(l|0)|0;h=Yb((k<<2)+4|0)|0;j=h;if((k|0)>0){i=0;do{n=a[l+i|0]|0;m=n<<24>>24;o=m-48|0;if(o>>>0>9>>>0){p=0;e=7}else{p=Yb(24)|0;c[p>>2]=0;c[p+4>>2]=0;c[p+20>>2]=o;if((p|0)==0){p=0;e=7}}if((e|0)==7){while(1){e=0;o=a[8+p|0]|0;if(o<<24>>24==0){p=0;break}p=p+1|0;if(o<<24>>24==n<<24>>24){break}else{e=7}}p=(p|0)==0?m:p}c[j+(i<<2)>>2]=p;i=i+1|0;}while((i|0)<(k|0))}c[j+(k<<2)>>2]=0;i=$b(l|0)|0;if((i+1|0)>0){ac(g+20|0,h|0,(i<<2)+4|0)|0}c[(c[587]|0)+20+(f-1<<2)>>2]=g;f=f+1|0;}while((f|0)<(b|0));return 0}function Xb(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=$b(b|0)|0;g=Yb((e<<2)+4|0)|0;if((e|0)>0){f=0}else{k=g+(e<<2)|0;c[k>>2]=0;k=Kb(g)|0;j=k;c[586]=j;Vb(k);return}do{i=a[b+f|0]|0;h=i<<24>>24;k=h-48|0;if(k>>>0>9>>>0){k=0;d=4}else{j=Yb(24)|0;c[j>>2]=0;c[j+4>>2]=0;c[j+20>>2]=k;if((j|0)==0){k=0;d=4}}if((d|0)==4){while(1){d=0;j=a[8+k|0]|0;if(j<<24>>24==0){k=0;break}k=k+1|0;if(j<<24>>24==i<<24>>24){break}else{d=4}}j=(k|0)==0?h:k}c[g+(f<<2)>>2]=j;f=f+1|0;}while((f|0)<(e|0));k=g+(e<<2)|0;c[k>>2]=0;k=Kb(g)|0;j=k;c[586]=j;Vb(k);return}function Yb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;do{if(a>>>0<245>>>0){if(a>>>0<11>>>0){a=16}else{a=a+11&-8}f=a>>>3;d=c[620]|0;e=d>>>(f>>>0);if((e&3|0)!=0){h=(e&1^1)+f|0;b=h<<1;e=2520+(b<<2)|0;b=2520+(b+2<<2)|0;g=c[b>>2]|0;f=g+8|0;a=c[f>>2]|0;do{if((e|0)==(a|0)){c[620]=d&~(1<<h)}else{if(a>>>0<(c[624]|0)>>>0){ka();return 0}d=a+12|0;if((c[d>>2]|0)==(g|0)){c[d>>2]=e;c[b>>2]=a;break}else{ka();return 0}}}while(0);r=h<<3;c[g+4>>2]=r|3;r=g+(r|4)|0;c[r>>2]=c[r>>2]|1;r=f;return r|0}if(!(a>>>0>(c[622]|0)>>>0)){break}if((e|0)!=0){i=2<<f;i=e<<f&(i|-i);i=(i&-i)-1|0;b=i>>>12&16;i=i>>>(b>>>0);h=i>>>5&8;i=i>>>(h>>>0);e=i>>>2&4;i=i>>>(e>>>0);g=i>>>1&2;i=i>>>(g>>>0);f=i>>>1&1;f=(h|b|e|g|f)+(i>>>(f>>>0))|0;i=f<<1;g=2520+(i<<2)|0;i=2520+(i+2<<2)|0;e=c[i>>2]|0;b=e+8|0;h=c[b>>2]|0;do{if((g|0)==(h|0)){c[620]=d&~(1<<f)}else{if(h>>>0<(c[624]|0)>>>0){ka();return 0}d=h+12|0;if((c[d>>2]|0)==(e|0)){c[d>>2]=g;c[i>>2]=h;break}else{ka();return 0}}}while(0);f=f<<3;d=f-a|0;c[e+4>>2]=a|3;r=e;e=r+a|0;c[r+(a|4)>>2]=d|1;c[r+f>>2]=d;f=c[622]|0;if((f|0)!=0){a=c[625]|0;g=f>>>3;h=g<<1;f=2520+(h<<2)|0;i=c[620]|0;g=1<<g;do{if((i&g|0)==0){c[620]=i|g;g=f;h=2520+(h+2<<2)|0}else{h=2520+(h+2<<2)|0;g=c[h>>2]|0;if(!(g>>>0<(c[624]|0)>>>0)){break}ka();return 0}}while(0);c[h>>2]=a;c[g+12>>2]=a;c[a+8>>2]=g;c[a+12>>2]=f}c[622]=d;c[625]=e;r=b;return r|0}d=c[621]|0;if((d|0)==0){break}f=(d&-d)-1|0;q=f>>>12&16;f=f>>>(q>>>0);p=f>>>5&8;f=f>>>(p>>>0);r=f>>>2&4;f=f>>>(r>>>0);d=f>>>1&2;f=f>>>(d>>>0);e=f>>>1&1;e=c[2784+((p|q|r|d|e)+(f>>>(e>>>0))<<2)>>2]|0;f=e;d=e;e=(c[e+4>>2]&-8)-a|0;while(1){h=c[f+16>>2]|0;if((h|0)==0){h=c[f+20>>2]|0;if((h|0)==0){break}}i=(c[h+4>>2]&-8)-a|0;g=i>>>0<e>>>0;f=h;d=g?h:d;e=g?i:e}g=d;i=c[624]|0;if(g>>>0<i>>>0){ka();return 0}r=g+a|0;f=r;if(!(g>>>0<r>>>0)){ka();return 0}h=c[d+24>>2]|0;j=c[d+12>>2]|0;do{if((j|0)==(d|0)){k=d+20|0;j=c[k>>2]|0;if((j|0)==0){k=d+16|0;j=c[k>>2]|0;if((j|0)==0){j=0;break}}while(1){l=j+20|0;m=c[l>>2]|0;if((m|0)!=0){j=m;k=l;continue}m=j+16|0;l=c[m>>2]|0;if((l|0)==0){break}else{j=l;k=m}}if(k>>>0<i>>>0){ka();return 0}else{c[k>>2]=0;break}}else{k=c[d+8>>2]|0;if(k>>>0<i>>>0){ka();return 0}l=k+12|0;if((c[l>>2]|0)!=(d|0)){ka();return 0}i=j+8|0;if((c[i>>2]|0)==(d|0)){c[l>>2]=j;c[i>>2]=k;break}else{ka();return 0}}}while(0);a:do{if((h|0)!=0){k=c[d+28>>2]|0;i=2784+(k<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=j;if((j|0)!=0){break}c[621]=c[621]&~(1<<k);break a}else{if(h>>>0<(c[624]|0)>>>0){ka();return 0}i=h+16|0;if((c[i>>2]|0)==(d|0)){c[i>>2]=j}else{c[h+20>>2]=j}if((j|0)==0){break a}}}while(0);if(j>>>0<(c[624]|0)>>>0){ka();return 0}c[j+24>>2]=h;h=c[d+16>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[624]|0)>>>0){ka();return 0}else{c[j+16>>2]=h;c[h+24>>2]=j;break}}}while(0);h=c[d+20>>2]|0;if((h|0)==0){break}if(h>>>0<(c[624]|0)>>>0){ka();return 0}else{c[j+20>>2]=h;c[h+24>>2]=j;break}}}while(0);if(e>>>0<16>>>0){r=e+a|0;c[d+4>>2]=r|3;r=g+(r+4)|0;c[r>>2]=c[r>>2]|1}else{c[d+4>>2]=a|3;c[g+(a|4)>>2]=e|1;c[g+(e+a)>>2]=e;h=c[622]|0;if((h|0)!=0){g=c[625]|0;k=h>>>3;i=k<<1;h=2520+(i<<2)|0;j=c[620]|0;k=1<<k;do{if((j&k|0)==0){c[620]=j|k;j=h;i=2520+(i+2<<2)|0}else{i=2520+(i+2<<2)|0;j=c[i>>2]|0;if(!(j>>>0<(c[624]|0)>>>0)){break}ka();return 0}}while(0);c[i>>2]=g;c[j+12>>2]=g;c[g+8>>2]=j;c[g+12>>2]=h}c[622]=e;c[625]=f}d=d+8|0;if((d|0)==0){break}return d|0}else{if(a>>>0>4294967231>>>0){a=-1;break}d=a+11|0;a=d&-8;e=c[621]|0;if((e|0)==0){break}f=-a|0;d=d>>>8;do{if((d|0)==0){g=0}else{if(a>>>0>16777215>>>0){g=31;break}q=(d+1048320|0)>>>16&8;r=d<<q;p=(r+520192|0)>>>16&4;r=r<<p;g=(r+245760|0)>>>16&2;g=14-(p|q|g)+(r<<g>>>15)|0;g=a>>>((g+7|0)>>>0)&1|g<<1}}while(0);h=c[2784+(g<<2)>>2]|0;b:do{if((h|0)==0){d=0;j=0}else{if((g|0)==31){i=0}else{i=25-(g>>>1)|0}d=0;i=a<<i;j=0;while(1){l=c[h+4>>2]&-8;k=l-a|0;if(k>>>0<f>>>0){if((l|0)==(a|0)){d=h;f=k;j=h;break b}else{d=h;f=k}}k=c[h+20>>2]|0;h=c[h+16+(i>>>31<<2)>>2]|0;j=(k|0)==0|(k|0)==(h|0)?j:k;if((h|0)==0){break}else{i=i<<1}}}}while(0);if((j|0)==0&(d|0)==0){r=2<<g;e=e&(r|-r);if((e|0)==0){break}r=(e&-e)-1|0;o=r>>>12&16;r=r>>>(o>>>0);n=r>>>5&8;r=r>>>(n>>>0);p=r>>>2&4;r=r>>>(p>>>0);q=r>>>1&2;r=r>>>(q>>>0);j=r>>>1&1;j=c[2784+((n|o|p|q|j)+(r>>>(j>>>0))<<2)>>2]|0}if((j|0)!=0){while(1){g=(c[j+4>>2]&-8)-a|0;e=g>>>0<f>>>0;f=e?g:f;d=e?j:d;e=c[j+16>>2]|0;if((e|0)!=0){j=e;continue}j=c[j+20>>2]|0;if((j|0)==0){break}}}if((d|0)==0){break}if(!(f>>>0<((c[622]|0)-a|0)>>>0)){break}e=d;j=c[624]|0;if(e>>>0<j>>>0){ka();return 0}h=e+a|0;g=h;if(!(e>>>0<h>>>0)){ka();return 0}i=c[d+24>>2]|0;k=c[d+12>>2]|0;do{if((k|0)==(d|0)){l=d+20|0;k=c[l>>2]|0;if((k|0)==0){l=d+16|0;k=c[l>>2]|0;if((k|0)==0){k=0;break}}while(1){m=k+20|0;n=c[m>>2]|0;if((n|0)!=0){k=n;l=m;continue}m=k+16|0;n=c[m>>2]|0;if((n|0)==0){break}else{k=n;l=m}}if(l>>>0<j>>>0){ka();return 0}else{c[l>>2]=0;break}}else{l=c[d+8>>2]|0;if(l>>>0<j>>>0){ka();return 0}j=l+12|0;if((c[j>>2]|0)!=(d|0)){ka();return 0}m=k+8|0;if((c[m>>2]|0)==(d|0)){c[j>>2]=k;c[m>>2]=l;break}else{ka();return 0}}}while(0);c:do{if((i|0)!=0){l=c[d+28>>2]|0;j=2784+(l<<2)|0;do{if((d|0)==(c[j>>2]|0)){c[j>>2]=k;if((k|0)!=0){break}c[621]=c[621]&~(1<<l);break c}else{if(i>>>0<(c[624]|0)>>>0){ka();return 0}j=i+16|0;if((c[j>>2]|0)==(d|0)){c[j>>2]=k}else{c[i+20>>2]=k}if((k|0)==0){break c}}}while(0);if(k>>>0<(c[624]|0)>>>0){ka();return 0}c[k+24>>2]=i;i=c[d+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[624]|0)>>>0){ka();return 0}else{c[k+16>>2]=i;c[i+24>>2]=k;break}}}while(0);i=c[d+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[624]|0)>>>0){ka();return 0}else{c[k+20>>2]=i;c[i+24>>2]=k;break}}}while(0);do{if(f>>>0<16>>>0){r=f+a|0;c[d+4>>2]=r|3;r=e+(r+4)|0;c[r>>2]=c[r>>2]|1}else{c[d+4>>2]=a|3;c[e+(a|4)>>2]=f|1;c[e+(f+a)>>2]=f;i=f>>>3;if(f>>>0<256>>>0){h=i<<1;f=2520+(h<<2)|0;j=c[620]|0;i=1<<i;do{if((j&i|0)==0){c[620]=j|i;i=f;h=2520+(h+2<<2)|0}else{h=2520+(h+2<<2)|0;i=c[h>>2]|0;if(!(i>>>0<(c[624]|0)>>>0)){break}ka();return 0}}while(0);c[h>>2]=g;c[i+12>>2]=g;c[e+(a+8)>>2]=i;c[e+(a+12)>>2]=f;break}g=f>>>8;do{if((g|0)==0){k=0}else{if(f>>>0>16777215>>>0){k=31;break}q=(g+1048320|0)>>>16&8;r=g<<q;p=(r+520192|0)>>>16&4;r=r<<p;k=(r+245760|0)>>>16&2;k=14-(p|q|k)+(r<<k>>>15)|0;k=f>>>((k+7|0)>>>0)&1|k<<1}}while(0);g=2784+(k<<2)|0;c[e+(a+28)>>2]=k;c[e+(a+20)>>2]=0;c[e+(a+16)>>2]=0;j=c[621]|0;i=1<<k;if((j&i|0)==0){c[621]=j|i;c[g>>2]=h;c[e+(a+24)>>2]=g;c[e+(a+12)>>2]=h;c[e+(a+8)>>2]=h;break}if((k|0)==31){i=0}else{i=25-(k>>>1)|0}i=f<<i;g=c[g>>2]|0;while(1){if((c[g+4>>2]&-8|0)==(f|0)){break}j=g+16+(i>>>31<<2)|0;k=c[j>>2]|0;if((k|0)==0){b=151;break}else{i=i<<1;g=k}}if((b|0)==151){if(j>>>0<(c[624]|0)>>>0){ka();return 0}else{c[j>>2]=h;c[e+(a+24)>>2]=g;c[e+(a+12)>>2]=h;c[e+(a+8)>>2]=h;break}}i=g+8|0;j=c[i>>2]|0;f=c[624]|0;if(g>>>0<f>>>0){ka();return 0}if(j>>>0<f>>>0){ka();return 0}else{c[j+12>>2]=h;c[i>>2]=h;c[e+(a+8)>>2]=j;c[e+(a+12)>>2]=g;c[e+(a+24)>>2]=0;break}}}while(0);d=d+8|0;if((d|0)==0){break}return d|0}}while(0);d=c[622]|0;if(!(a>>>0>d>>>0)){b=d-a|0;e=c[625]|0;if(b>>>0>15>>>0){r=e;c[625]=r+a;c[622]=b;c[r+(a+4)>>2]=b|1;c[r+d>>2]=b;c[e+4>>2]=a|3}else{c[622]=0;c[625]=0;c[e+4>>2]=d|3;r=e+(d+4)|0;c[r>>2]=c[r>>2]|1}r=e+8|0;return r|0}d=c[623]|0;if(a>>>0<d>>>0){p=d-a|0;c[623]=p;r=c[626]|0;q=r;c[626]=q+a;c[q+(a+4)>>2]=p|1;c[r+4>>2]=a|3;r=r+8|0;return r|0}do{if((c[614]|0)==0){d=ia(30)|0;if((d-1&d|0)==0){c[616]=d;c[615]=d;c[617]=-1;c[618]=-1;c[619]=0;c[731]=0;c[614]=(Ia(0)|0)&-16^1431655768;break}else{ka();return 0}}}while(0);h=a+48|0;e=c[616]|0;g=a+47|0;d=e+g|0;e=-e|0;f=d&e;if(!(f>>>0>a>>>0)){r=0;return r|0}i=c[730]|0;do{if((i|0)!=0){q=c[728]|0;r=q+f|0;if(r>>>0<=q>>>0|r>>>0>i>>>0){d=0}else{break}return d|0}}while(0);d:do{if((c[731]&4|0)==0){i=c[626]|0;e:do{if((i|0)==0){b=181}else{m=2928;while(1){l=m|0;j=c[l>>2]|0;if(!(j>>>0>i>>>0)){k=m+4|0;if((j+(c[k>>2]|0)|0)>>>0>i>>>0){break}}m=c[m+8>>2]|0;if((m|0)==0){b=181;break e}}if((m|0)==0){b=181;break}i=d-(c[623]|0)&e;if(!(i>>>0<2147483647>>>0)){e=0;break}j=Fa(i|0)|0;b=(j|0)==((c[l>>2]|0)+(c[k>>2]|0)|0);d=b?j:-1;e=b?i:0;b=190}}while(0);do{if((b|0)==181){d=Fa(0)|0;if((d|0)==-1){e=0;break}i=d;j=c[615]|0;e=j-1|0;if((e&i|0)==0){i=f}else{i=f-i+(e+i&-j)|0}j=c[728]|0;e=j+i|0;if(!(i>>>0>a>>>0&i>>>0<2147483647>>>0)){e=0;break}k=c[730]|0;if((k|0)!=0){if(e>>>0<=j>>>0|e>>>0>k>>>0){e=0;break}}j=Fa(i|0)|0;b=(j|0)==(d|0);d=b?d:-1;e=b?i:0;b=190}}while(0);f:do{if((b|0)==190){b=-i|0;if(!((d|0)==-1)){b=201;break d}do{if((j|0)!=-1&i>>>0<2147483647>>>0&i>>>0<h>>>0){d=c[616]|0;d=g-i+d&-d;if(!(d>>>0<2147483647>>>0)){break}if((Fa(d|0)|0)==-1){Fa(b|0)|0;break f}else{i=d+i|0;break}}}while(0);if(!((j|0)==-1)){e=i;d=j;b=201;break d}}}while(0);c[731]=c[731]|4;b=198}else{e=0;b=198}}while(0);do{if((b|0)==198){if(!(f>>>0<2147483647>>>0)){break}d=Fa(f|0)|0;f=Fa(0)|0;if(!((f|0)!=-1&(d|0)!=-1&d>>>0<f>>>0)){break}f=f-d|0;g=f>>>0>(a+40|0)>>>0;d=g?d:-1;if(!((d|0)==-1)){e=g?f:e;b=201}}}while(0);do{if((b|0)==201){f=(c[728]|0)+e|0;c[728]=f;if(f>>>0>(c[729]|0)>>>0){c[729]=f}f=c[626]|0;g:do{if((f|0)==0){r=c[624]|0;if((r|0)==0|d>>>0<r>>>0){c[624]=d}c[732]=d;c[733]=e;c[735]=0;c[629]=c[614];c[628]=-1;b=0;do{r=b<<1;q=2520+(r<<2)|0;c[2520+(r+3<<2)>>2]=q;c[2520+(r+2<<2)>>2]=q;b=b+1|0;}while(b>>>0<32>>>0);b=d+8|0;if((b&7|0)==0){b=0}else{b=-b&7}r=e-40-b|0;c[626]=d+b;c[623]=r;c[d+(b+4)>>2]=r|1;c[d+(e-36)>>2]=40;c[627]=c[618]}else{g=2928;do{h=c[g>>2]|0;i=g+4|0;j=c[i>>2]|0;if((d|0)==(h+j|0)){b=213;break}g=c[g+8>>2]|0;}while((g|0)!=0);do{if((b|0)==213){if((c[g+12>>2]&8|0)!=0){break}g=f;if(!(g>>>0>=h>>>0&g>>>0<d>>>0)){break}c[i>>2]=j+e;b=(c[623]|0)+e|0;d=f+8|0;if((d&7|0)==0){d=0}else{d=-d&7}r=b-d|0;c[626]=g+d;c[623]=r;c[g+(d+4)>>2]=r|1;c[g+(b+4)>>2]=40;c[627]=c[618];break g}}while(0);if(d>>>0<(c[624]|0)>>>0){c[624]=d}g=d+e|0;i=2928;do{h=i|0;if((c[h>>2]|0)==(g|0)){b=223;break}i=c[i+8>>2]|0;}while((i|0)!=0);do{if((b|0)==223){if((c[i+12>>2]&8|0)!=0){break}c[h>>2]=d;f=i+4|0;c[f>>2]=(c[f>>2]|0)+e;f=d+8|0;if((f&7|0)==0){f=0}else{f=-f&7}g=d+(e+8)|0;if((g&7|0)==0){k=0}else{k=-g&7}n=d+(k+e)|0;m=n;g=f+a|0;i=d+g|0;h=i;j=n-(d+f)-a|0;c[d+(f+4)>>2]=a|3;do{if((m|0)==(c[626]|0)){r=(c[623]|0)+j|0;c[623]=r;c[626]=h;c[d+(g+4)>>2]=r|1}else{if((m|0)==(c[625]|0)){r=(c[622]|0)+j|0;c[622]=r;c[625]=h;c[d+(g+4)>>2]=r|1;c[d+(r+g)>>2]=r;break}l=e+4|0;p=c[d+(l+k)>>2]|0;if((p&3|0)==1){a=p&-8;o=p>>>3;h:do{if(p>>>0<256>>>0){l=c[d+((k|8)+e)>>2]|0;n=c[d+(e+12+k)>>2]|0;p=2520+(o<<1<<2)|0;do{if((l|0)!=(p|0)){if(l>>>0<(c[624]|0)>>>0){ka();return 0}if((c[l+12>>2]|0)==(m|0)){break}ka();return 0}}while(0);if((n|0)==(l|0)){c[620]=c[620]&~(1<<o);break}do{if((n|0)==(p|0)){o=n+8|0}else{if(n>>>0<(c[624]|0)>>>0){ka();return 0}o=n+8|0;if((c[o>>2]|0)==(m|0)){break}ka();return 0}}while(0);c[l+12>>2]=n;c[o>>2]=l}else{m=c[d+((k|24)+e)>>2]|0;o=c[d+(e+12+k)>>2]|0;do{if((o|0)==(n|0)){q=k|16;p=d+(l+q)|0;o=c[p>>2]|0;if((o|0)==0){p=d+(q+e)|0;o=c[p>>2]|0;if((o|0)==0){o=0;break}}while(1){q=o+20|0;r=c[q>>2]|0;if((r|0)!=0){o=r;p=q;continue}q=o+16|0;r=c[q>>2]|0;if((r|0)==0){break}else{o=r;p=q}}if(p>>>0<(c[624]|0)>>>0){ka();return 0}else{c[p>>2]=0;break}}else{q=c[d+((k|8)+e)>>2]|0;if(q>>>0<(c[624]|0)>>>0){ka();return 0}r=q+12|0;if((c[r>>2]|0)!=(n|0)){ka();return 0}p=o+8|0;if((c[p>>2]|0)==(n|0)){c[r>>2]=o;c[p>>2]=q;break}else{ka();return 0}}}while(0);if((m|0)==0){break}p=c[d+(e+28+k)>>2]|0;q=2784+(p<<2)|0;do{if((n|0)==(c[q>>2]|0)){c[q>>2]=o;if((o|0)!=0){break}c[621]=c[621]&~(1<<p);break h}else{if(m>>>0<(c[624]|0)>>>0){ka();return 0}p=m+16|0;if((c[p>>2]|0)==(n|0)){c[p>>2]=o}else{c[m+20>>2]=o}if((o|0)==0){break h}}}while(0);if(o>>>0<(c[624]|0)>>>0){ka();return 0}c[o+24>>2]=m;n=k|16;m=c[d+(n+e)>>2]|0;do{if((m|0)!=0){if(m>>>0<(c[624]|0)>>>0){ka();return 0}else{c[o+16>>2]=m;c[m+24>>2]=o;break}}}while(0);l=c[d+(l+n)>>2]|0;if((l|0)==0){break}if(l>>>0<(c[624]|0)>>>0){ka();return 0}else{c[o+20>>2]=l;c[l+24>>2]=o;break}}}while(0);m=d+((a|k)+e)|0;j=a+j|0}a=m+4|0;c[a>>2]=c[a>>2]&-2;c[d+(g+4)>>2]=j|1;c[d+(j+g)>>2]=j;a=j>>>3;if(j>>>0<256>>>0){e=a<<1;b=2520+(e<<2)|0;i=c[620]|0;a=1<<a;do{if((i&a|0)==0){c[620]=i|a;a=b;e=2520+(e+2<<2)|0}else{e=2520+(e+2<<2)|0;a=c[e>>2]|0;if(!(a>>>0<(c[624]|0)>>>0)){break}ka();return 0}}while(0);c[e>>2]=h;c[a+12>>2]=h;c[d+(g+8)>>2]=a;c[d+(g+12)>>2]=b;break}a=j>>>8;do{if((a|0)==0){e=0}else{if(j>>>0>16777215>>>0){e=31;break}q=(a+1048320|0)>>>16&8;r=a<<q;p=(r+520192|0)>>>16&4;r=r<<p;e=(r+245760|0)>>>16&2;e=14-(p|q|e)+(r<<e>>>15)|0;e=j>>>((e+7|0)>>>0)&1|e<<1}}while(0);a=2784+(e<<2)|0;c[d+(g+28)>>2]=e;c[d+(g+20)>>2]=0;c[d+(g+16)>>2]=0;h=c[621]|0;k=1<<e;if((h&k|0)==0){c[621]=h|k;c[a>>2]=i;c[d+(g+24)>>2]=a;c[d+(g+12)>>2]=i;c[d+(g+8)>>2]=i;break}if((e|0)==31){e=0}else{e=25-(e>>>1)|0}e=j<<e;a=c[a>>2]|0;while(1){if((c[a+4>>2]&-8|0)==(j|0)){break}k=a+16+(e>>>31<<2)|0;h=c[k>>2]|0;if((h|0)==0){b=296;break}else{e=e<<1;a=h}}if((b|0)==296){if(k>>>0<(c[624]|0)>>>0){ka();return 0}else{c[k>>2]=i;c[d+(g+24)>>2]=a;c[d+(g+12)>>2]=i;c[d+(g+8)>>2]=i;break}}b=a+8|0;e=c[b>>2]|0;h=c[624]|0;if(a>>>0<h>>>0){ka();return 0}if(e>>>0<h>>>0){ka();return 0}else{c[e+12>>2]=i;c[b>>2]=i;c[d+(g+8)>>2]=e;c[d+(g+12)>>2]=a;c[d+(g+24)>>2]=0;break}}}while(0);r=d+(f|8)|0;return r|0}}while(0);g=f;k=2928;while(1){j=c[k>>2]|0;if(!(j>>>0>g>>>0)){i=c[k+4>>2]|0;h=j+i|0;if(h>>>0>g>>>0){break}}k=c[k+8>>2]|0}k=j+(i-39)|0;if((k&7|0)==0){k=0}else{k=-k&7}i=j+(i-47+k)|0;i=i>>>0<(f+16|0)>>>0?g:i;j=i+8|0;k=d+8|0;if((k&7|0)==0){k=0}else{k=-k&7}r=e-40-k|0;c[626]=d+k;c[623]=r;c[d+(k+4)>>2]=r|1;c[d+(e-36)>>2]=40;c[627]=c[618];c[i+4>>2]=27;c[j>>2]=c[732];c[j+4>>2]=c[733];c[j+8>>2]=c[734];c[j+12>>2]=c[735];c[732]=d;c[733]=e;c[735]=0;c[734]=j;d=i+28|0;c[d>>2]=7;if((i+32|0)>>>0<h>>>0){while(1){e=d+4|0;c[e>>2]=7;if((d+8|0)>>>0<h>>>0){d=e}else{break}}}if((i|0)==(g|0)){break}e=i-f|0;r=g+(e+4)|0;c[r>>2]=c[r>>2]&-2;c[f+4>>2]=e|1;c[g+e>>2]=e;g=e>>>3;if(e>>>0<256>>>0){d=g<<1;b=2520+(d<<2)|0;e=c[620]|0;g=1<<g;do{if((e&g|0)==0){c[620]=e|g;e=b;d=2520+(d+2<<2)|0}else{d=2520+(d+2<<2)|0;e=c[d>>2]|0;if(!(e>>>0<(c[624]|0)>>>0)){break}ka();return 0}}while(0);c[d>>2]=f;c[e+12>>2]=f;c[f+8>>2]=e;c[f+12>>2]=b;break}d=f;g=e>>>8;do{if((g|0)==0){i=0}else{if(e>>>0>16777215>>>0){i=31;break}q=(g+1048320|0)>>>16&8;r=g<<q;p=(r+520192|0)>>>16&4;r=r<<p;i=(r+245760|0)>>>16&2;i=14-(p|q|i)+(r<<i>>>15)|0;i=e>>>((i+7|0)>>>0)&1|i<<1}}while(0);g=2784+(i<<2)|0;c[f+28>>2]=i;c[f+20>>2]=0;c[f+16>>2]=0;j=c[621]|0;h=1<<i;if((j&h|0)==0){c[621]=j|h;c[g>>2]=d;c[f+24>>2]=g;c[f+12>>2]=f;c[f+8>>2]=f;break}if((i|0)==31){h=0}else{h=25-(i>>>1)|0}h=e<<h;g=c[g>>2]|0;while(1){if((c[g+4>>2]&-8|0)==(e|0)){break}j=g+16+(h>>>31<<2)|0;i=c[j>>2]|0;if((i|0)==0){b=331;break}else{h=h<<1;g=i}}if((b|0)==331){if(j>>>0<(c[624]|0)>>>0){ka();return 0}else{c[j>>2]=d;c[f+24>>2]=g;c[f+12>>2]=f;c[f+8>>2]=f;break}}h=g+8|0;e=c[h>>2]|0;b=c[624]|0;if(g>>>0<b>>>0){ka();return 0}if(e>>>0<b>>>0){ka();return 0}else{c[e+12>>2]=d;c[h>>2]=d;c[f+8>>2]=e;c[f+12>>2]=g;c[f+24>>2]=0;break}}}while(0);b=c[623]|0;if(!(b>>>0>a>>>0)){break}p=b-a|0;c[623]=p;r=c[626]|0;q=r;c[626]=q+a;c[q+(a+4)>>2]=p|1;c[r+4>>2]=a|3;r=r+8|0;return r|0}}while(0);c[(Ga()|0)>>2]=12;r=0;return r|0}



function Zb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if((a|0)==0){return}p=a-8|0;s=p;q=c[624]|0;if(p>>>0<q>>>0){ka()}n=c[a-4>>2]|0;m=n&3;if((m|0)==1){ka()}h=n&-8;k=a+(h-8)|0;j=k;a:do{if((n&1|0)==0){u=c[p>>2]|0;if((m|0)==0){return}p=-8-u|0;s=a+p|0;m=s;n=u+h|0;if(s>>>0<q>>>0){ka()}if((m|0)==(c[625]|0)){b=a+(h-4)|0;if((c[b>>2]&3|0)!=3){b=m;l=n;break}c[622]=n;c[b>>2]=c[b>>2]&-2;c[a+(p+4)>>2]=n|1;c[k>>2]=n;return}t=u>>>3;if(u>>>0<256>>>0){b=c[a+(p+8)>>2]|0;l=c[a+(p+12)>>2]|0;o=2520+(t<<1<<2)|0;do{if((b|0)!=(o|0)){if(b>>>0<q>>>0){ka()}if((c[b+12>>2]|0)==(m|0)){break}ka()}}while(0);if((l|0)==(b|0)){c[620]=c[620]&~(1<<t);b=m;l=n;break}do{if((l|0)==(o|0)){r=l+8|0}else{if(l>>>0<q>>>0){ka()}o=l+8|0;if((c[o>>2]|0)==(m|0)){r=o;break}ka()}}while(0);c[b+12>>2]=l;c[r>>2]=b;b=m;l=n;break}r=c[a+(p+24)>>2]|0;u=c[a+(p+12)>>2]|0;do{if((u|0)==(s|0)){u=a+(p+20)|0;t=c[u>>2]|0;if((t|0)==0){u=a+(p+16)|0;t=c[u>>2]|0;if((t|0)==0){o=0;break}}while(1){w=t+20|0;v=c[w>>2]|0;if((v|0)!=0){t=v;u=w;continue}v=t+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{t=w;u=v}}if(u>>>0<q>>>0){ka()}else{c[u>>2]=0;o=t;break}}else{t=c[a+(p+8)>>2]|0;if(t>>>0<q>>>0){ka()}q=t+12|0;if((c[q>>2]|0)!=(s|0)){ka()}v=u+8|0;if((c[v>>2]|0)==(s|0)){c[q>>2]=u;c[v>>2]=t;o=u;break}else{ka()}}}while(0);if((r|0)==0){b=m;l=n;break}q=c[a+(p+28)>>2]|0;t=2784+(q<<2)|0;do{if((s|0)==(c[t>>2]|0)){c[t>>2]=o;if((o|0)!=0){break}c[621]=c[621]&~(1<<q);b=m;l=n;break a}else{if(r>>>0<(c[624]|0)>>>0){ka()}q=r+16|0;if((c[q>>2]|0)==(s|0)){c[q>>2]=o}else{c[r+20>>2]=o}if((o|0)==0){b=m;l=n;break a}}}while(0);if(o>>>0<(c[624]|0)>>>0){ka()}c[o+24>>2]=r;q=c[a+(p+16)>>2]|0;do{if((q|0)!=0){if(q>>>0<(c[624]|0)>>>0){ka()}else{c[o+16>>2]=q;c[q+24>>2]=o;break}}}while(0);p=c[a+(p+20)>>2]|0;if((p|0)==0){b=m;l=n;break}if(p>>>0<(c[624]|0)>>>0){ka()}else{c[o+20>>2]=p;c[p+24>>2]=o;b=m;l=n;break}}else{b=s;l=h}}while(0);m=b;if(!(m>>>0<k>>>0)){ka()}n=a+(h-4)|0;o=c[n>>2]|0;if((o&1|0)==0){ka()}do{if((o&2|0)==0){if((j|0)==(c[626]|0)){w=(c[623]|0)+l|0;c[623]=w;c[626]=b;c[b+4>>2]=w|1;if((b|0)!=(c[625]|0)){return}c[625]=0;c[622]=0;return}if((j|0)==(c[625]|0)){w=(c[622]|0)+l|0;c[622]=w;c[625]=b;c[b+4>>2]=w|1;c[m+w>>2]=w;return}l=(o&-8)+l|0;n=o>>>3;b:do{if(o>>>0<256>>>0){g=c[a+h>>2]|0;h=c[a+(h|4)>>2]|0;a=2520+(n<<1<<2)|0;do{if((g|0)!=(a|0)){if(g>>>0<(c[624]|0)>>>0){ka()}if((c[g+12>>2]|0)==(j|0)){break}ka()}}while(0);if((h|0)==(g|0)){c[620]=c[620]&~(1<<n);break}do{if((h|0)==(a|0)){i=h+8|0}else{if(h>>>0<(c[624]|0)>>>0){ka()}a=h+8|0;if((c[a>>2]|0)==(j|0)){i=a;break}ka()}}while(0);c[g+12>>2]=h;c[i>>2]=g}else{i=c[a+(h+16)>>2]|0;n=c[a+(h|4)>>2]|0;do{if((n|0)==(k|0)){n=a+(h+12)|0;j=c[n>>2]|0;if((j|0)==0){n=a+(h+8)|0;j=c[n>>2]|0;if((j|0)==0){g=0;break}}while(1){p=j+20|0;o=c[p>>2]|0;if((o|0)!=0){j=o;n=p;continue}o=j+16|0;p=c[o>>2]|0;if((p|0)==0){break}else{j=p;n=o}}if(n>>>0<(c[624]|0)>>>0){ka()}else{c[n>>2]=0;g=j;break}}else{o=c[a+h>>2]|0;if(o>>>0<(c[624]|0)>>>0){ka()}p=o+12|0;if((c[p>>2]|0)!=(k|0)){ka()}j=n+8|0;if((c[j>>2]|0)==(k|0)){c[p>>2]=n;c[j>>2]=o;g=n;break}else{ka()}}}while(0);if((i|0)==0){break}n=c[a+(h+20)>>2]|0;j=2784+(n<<2)|0;do{if((k|0)==(c[j>>2]|0)){c[j>>2]=g;if((g|0)!=0){break}c[621]=c[621]&~(1<<n);break b}else{if(i>>>0<(c[624]|0)>>>0){ka()}j=i+16|0;if((c[j>>2]|0)==(k|0)){c[j>>2]=g}else{c[i+20>>2]=g}if((g|0)==0){break b}}}while(0);if(g>>>0<(c[624]|0)>>>0){ka()}c[g+24>>2]=i;i=c[a+(h+8)>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[624]|0)>>>0){ka()}else{c[g+16>>2]=i;c[i+24>>2]=g;break}}}while(0);h=c[a+(h+12)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[624]|0)>>>0){ka()}else{c[g+20>>2]=h;c[h+24>>2]=g;break}}}while(0);c[b+4>>2]=l|1;c[m+l>>2]=l;if((b|0)!=(c[625]|0)){break}c[622]=l;return}else{c[n>>2]=o&-2;c[b+4>>2]=l|1;c[m+l>>2]=l}}while(0);g=l>>>3;if(l>>>0<256>>>0){a=g<<1;d=2520+(a<<2)|0;h=c[620]|0;g=1<<g;do{if((h&g|0)==0){c[620]=h|g;f=d;e=2520+(a+2<<2)|0}else{h=2520+(a+2<<2)|0;g=c[h>>2]|0;if(!(g>>>0<(c[624]|0)>>>0)){f=g;e=h;break}ka()}}while(0);c[e>>2]=b;c[f+12>>2]=b;c[b+8>>2]=f;c[b+12>>2]=d;return}e=b;f=l>>>8;do{if((f|0)==0){a=0}else{if(l>>>0>16777215>>>0){a=31;break}v=(f+1048320|0)>>>16&8;w=f<<v;u=(w+520192|0)>>>16&4;w=w<<u;a=(w+245760|0)>>>16&2;a=14-(u|v|a)+(w<<a>>>15)|0;a=l>>>((a+7|0)>>>0)&1|a<<1}}while(0);f=2784+(a<<2)|0;c[b+28>>2]=a;c[b+20>>2]=0;c[b+16>>2]=0;h=c[621]|0;g=1<<a;do{if((h&g|0)==0){c[621]=h|g;c[f>>2]=e;c[b+24>>2]=f;c[b+12>>2]=b;c[b+8>>2]=b}else{if((a|0)==31){g=0}else{g=25-(a>>>1)|0}g=l<<g;f=c[f>>2]|0;while(1){if((c[f+4>>2]&-8|0)==(l|0)){break}h=f+16+(g>>>31<<2)|0;a=c[h>>2]|0;if((a|0)==0){d=129;break}else{g=g<<1;f=a}}if((d|0)==129){if(h>>>0<(c[624]|0)>>>0){ka()}else{c[h>>2]=e;c[b+24>>2]=f;c[b+12>>2]=b;c[b+8>>2]=b;break}}h=f+8|0;g=c[h>>2]|0;d=c[624]|0;if(f>>>0<d>>>0){ka()}if(g>>>0<d>>>0){ka()}else{c[g+12>>2]=e;c[h>>2]=e;c[b+8>>2]=g;c[b+12>>2]=f;c[b+24>>2]=0;break}}}while(0);w=(c[628]|0)-1|0;c[628]=w;if((w|0)==0){b=2936}else{return}while(1){b=c[b>>2]|0;if((b|0)==0){break}else{b=b+8|0}}c[628]=-1;return}function _b(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;i=b&3;h=d|d<<8|d<<16|d<<24;g=f&~3;if(i){i=b+4-i|0;while((b|0)<(i|0)){a[b]=d;b=b+1|0}}while((b|0)<(g|0)){c[b>>2]=h;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}return b-e|0}function $b(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function ac(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((e|0)>=4096)return Aa(b|0,d|0,e|0)|0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function bc(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return Ka[a&3](b|0,c|0,d|0,e|0)|0}function cc(a,b){a=a|0;b=b|0;La[a&7](b|0)}function dc(a,b){a=a|0;b=b|0;return Ma[a&31](b|0)|0}function ec(a){a=a|0;Na[a&7]()}function fc(a,b,c){a=a|0;b=b|0;c=c|0;return Oa[a&63](b|0,c|0)|0}function gc(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;_(0);return 0}function hc(a){a=a|0;_(1)}function ic(a){a=a|0;_(2);return 0}function jc(){_(3)}function kc(a,b){a=a|0;b=b|0;_(4);return 0}




// EMSCRIPTEN_END_FUNCS
var Ka=[gc,gc,Ob,gc];var La=[hc,hc,Rb,hc,Ub,hc,hc,hc];var Ma=[ic,ic,Bb,ic,fb,ic,Lb,ic,Db,ic,ub,ic,Jb,ic,xb,ic,Cb,ic,eb,ic,vb,ic,hb,ic,Mb,ic,Hb,ic,ic,ic,ic,ic];var Na=[jc,jc,Tb,jc,Sb,jc,jc,jc];var Oa=[kc,kc,Fb,kc,Eb,kc,ob,kc,gb,kc,jb,kc,yb,kc,Pb,kc,mb,kc,wb,kc,Ib,kc,sb,kc,pb,kc,zb,kc,Qb,kc,rb,kc,tb,kc,ib,kc,lb,kc,nb,kc,Nb,kc,kb,kc,Gb,kc,Ab,kc,qb,kc,kc,kc,kc,kc,kc,kc,kc,kc,kc,kc,kc,kc,kc,kc];return{_strlen:$b,_free:Zb,_main:Wb,_memset:_b,_process:Xb,_malloc:Yb,_memcpy:ac,runPostSets:db,stackAlloc:Pa,stackSave:Qa,stackRestore:Ra,setThrew:Sa,setTempRet0:Va,setTempRet1:Wa,setTempRet2:Xa,setTempRet3:Ya,setTempRet4:Za,setTempRet5:_a,setTempRet6:$a,setTempRet7:ab,setTempRet8:bb,setTempRet9:cb,dynCall_iiiii:bc,dynCall_vi:cc,dynCall_ii:dc,dynCall_v:ec,dynCall_iii:fc}})


// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_iiiii": invoke_iiiii, "invoke_vi": invoke_vi, "invoke_ii": invoke_ii, "invoke_v": invoke_v, "invoke_iii": invoke_iii, "_sysconf": _sysconf, "_isprint": _isprint, "_abort": _abort, "_fprintf": _fprintf, "_printf": _printf, "_fflush": _fflush, "__reallyNegative": __reallyNegative, "_strchr": _strchr, "_fputc": _fputc, "_puts": _puts, "___setErrNo": ___setErrNo, "_fwrite": _fwrite, "_send": _send, "_write": _write, "_fputs": _fputs, "_log10": _log10, "__formatString": __formatString, "_ceil": _ceil, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_fileno": _fileno, "_pwrite": _pwrite, "_putchar": _putchar, "_llvm_pow_f64": _llvm_pow_f64, "_sbrk": _sbrk, "___errno_location": ___errno_location, "_mkport": _mkport, "_time": _time, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "NaN": NaN, "Infinity": Infinity }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _main = Module["_main"] = asm["_main"];
var _memset = Module["_memset"] = asm["_memset"];
var _process = Module["_process"] = asm["_process"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];

Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };

// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;

// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    var data = Module['readBinary'](memoryInitializer);
    HEAPU8.set(data, STATIC_BASE);
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      HEAPU8.set(data, STATIC_BASE);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    ensureInitRuntime();

    preMain();

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371

  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}


run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}






