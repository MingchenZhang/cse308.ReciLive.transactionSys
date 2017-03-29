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
        exports.privilegeObjectTest(req.privilege) &&
        typeof req.index == 'number' &&
        typeof req.module == 'string' &&
        typeof req.description == 'string'
    );
};