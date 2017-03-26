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
exports.dispatchRquest = function (req) {
    if (!exports.privilegeObjectTest(req.privilege) ||
        !typeof req.classNumber == "int" ||
        !typeof req.name == "string" ||
        !typeof req.startDate == "string" ||
        !typeof req.endDate == "string" ||
        !typeof req.status == "string")
        return false;
    else return true;
}