//uses
var isFunction = global.TypeUtils.isFunction;

var Thennable = Class.create();

Thennable.prototype = {
	initialize: function(/*any*/ value) {
		this._val = value;
	},
	then: function(/*function*/ next) {
		var self = this;
		
		return new Thennable(isFunction(next) ? next(self._val) : undefined);
	},
	valueOf: function() {
		return this._val;
	},
	toString: function() {
		var self = this;

		return (
			self._val &&
			(isFunction(self._val.toString)
				? self._val.toString()
				: self._val + '')
		);
	},
	type: 'Thennable'
};
