const Validator = require("better-validator");

const validator = new Validator();

const getResourceRule = (object) => {
    object.required().isObject((obj)=>{
        obj('resources').required().isObjectArray((obj)=>{
            obj("type").required().isString();
            obj("content").required()
        });
    });
};

exports.privilegeObjectTest = function (privilege) {
    if (typeof privilege != "object") return false;
    for (var key in privilege) {
        if (!privilege.hasOwnProperty(key)) continue;
        if (typeof key != "string") return false;
        var obj = privilege[key];
        if (obj != "all" && !Array.isArray(obj)) {
            return false;
        }
    }
    return true;
};
exports.dispatchRequest = function (req) {
    return (
        exports.privilegeObjectTest(req.privilege) &&
        typeof req.classNumber == "number" &&
        typeof req.name == "string" &&
        typeof req.startDate == "string" &&
        typeof req.endDate == "string" &&
        typeof req.status == "string"
    );
};

exports.transactionPush = function (req) {
    return (
        typeof req.index == 'number' &&
        typeof req.module == 'string'
    );
    // TODO: check object safety
};

exports.getResource = function (req) {
    return validator(req, getResourceRule).length = 0;
};