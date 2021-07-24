//uses
var TypeUtils = global.TypeUtils;

var StringTemplate = Class.create();

StringTemplate.variablesFromTemplate = function (/*string*/ template) {
    var variables = [];
    var expression = /\{{([^}]+)\}}/g;
    var currMatch;

    while ((currMatch = expression.exec(template))) {
        variables.push(currMatch[1]);
    }

    return variables
        .map(function (variableName) {
            return variableName.trim();
        })
        .filter(function (variableName, index, self) {
            return self.indexOf(variableName) == index;
        });
};

StringTemplate.inject = function (/*string*/ template, /*object*/ data) {
    var variables = StringTemplate.variablesFromTemplate(template);
    var result = '' + template;
    variables.forEach(function (variableName) {
        var SPLIT = '{{' + variableName + '}}';
        result = result.split(SPLIT).join(data[variableName] + '');
    });

    return result;
};

StringTemplate.prototype = {
    initialize: function (/*string*/ template, /*object*/ data) {
        this.template(template);
        this.data(data);
    },
    template: function (/*optional string*/ template) {
        if (TypeUtils.isString(template)) {
            this._template = template;
            this._variables =
                StringTemplate.variablesFromTemplate(template) || [];
            return this;
        }
        this._template = this._template || '';
        return this._template;
    },
    data: function (/*optional object*/ data) {
        if (TypeUtils.isObject(data)) {
            this._data = data;
            return this;
        }
        this._data = this._data || {};
        return this._data;
    },
    variableNames: function () {
        return this._variables || [];
    },
    toString: function () {
        return StringTemplate.inject(this.template(), this.data());
    },
    type: 'StringTemplate',
};
