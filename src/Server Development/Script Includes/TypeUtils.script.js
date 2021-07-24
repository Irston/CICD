var TypeUtils = (function() {
	
	var __isObject = function(/*any*/ value) {
		var type = typeof value;

		return value != null && (type == 'object' || type == 'function');
	};

	var __isArray = function(/*any*/ value) {
		if (Array && Array.isArray) {
			return Array.isArray(value);
		}
		return Object.prototype.toString.call(value) === '[object Array]';
	};

	var __isBoolean = function(/*any*/ value) {
		return value === true || value === false;
	};

	var __isUndefined = function(/*any*/ value) {
		return value === undefined;
	};

	var __isNull = function(/*any*/ value) {
		return value === null;
	};

	var __isNil = function(/*any*/ value) {
		return value == null;
	};
	
	var __isNumber = function(/*any*/ value) {
		return typeof value === 'number';
	};

	var __isNaN = function(/*any*/ value) {
		return __isNumber(value) && value != +value;
	};

	var __isString = function(/*any*/ value) {
		return typeof value === 'string';
	};

	var __isFunction = function(/*any*/ value) {
		return typeof value === 'function';
	};

	var __isFinite = function(/*any*/ value) {
		return __isFunction(isFinite) && isFinite(value);
	};

	var __isFiniteNumber = function(/*any*/ value) {
		if (Number && Number.isFinite) {
			return Number.isFinite(value);
		}

		return __isNumber(value) && __isFinite(value);
	};

	var __isInteger = function(/*any*/ value) {
		if (Number && Number.isInteger) {
			return Number.isInteger(value);
		}

		return __isFiniteNumber(value) && Math.floor(value) === value;
	};

	var __isGlideRecord = function(/*any*/ value) {
		if(!__isObject(value)) {
			return false;
		}
		
		var sampleMethods = ['addQuery', 'getTableName', 'initialize', 'getEncodedQuery'];
		
		sampleMethods.forEach(function(methodName) {
			if(!__isFunction(value[methodName])) {
				return false;
			}
		});
		
		return true;
	};
	
	var __isCustomObjectType = function(/*any*/ value, /*string*/ type) {
		return __isObject(value) && !__isNil(value.type) && value.type == type;
	};
	
	var __isJSONString = function(/*any*/ value) {
		try {
			JSON.parse(value);
		} catch(err) {
			return false;
		}
		return true;
	};
	
	return {
		isObject: __isObject,
		isArray: __isArray,
		isBoolean: __isBoolean,
		isUndefined: __isUndefined,
		isNull: __isNull,
		isNil: __isNil,
		isFunction: __isFunction,
		isNumber: __isNumber,
		isNaN: __isNaN,
		isFinite: __isFinite,
		isFiniteNumber: __isFiniteNumber,
		isString: __isString,
		isInteger: __isInteger,
		isGlideRecord: __isGlideRecord,
		isCustomObjectType: __isCustomObjectType,
		isJSONString: __isJSONString
	};
})();
