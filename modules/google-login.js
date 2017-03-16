//match with google could and save google idtoken.
var matchGoogle = new function(IDToken,classNumber){
    userid = getUserIdByToken(IDToken);
    if(userid!=-1&&classroomList[classNUmber].studentlist.indexOf(userid)!=-1){
        console.log("student is inside class room");
        return true;
    }
    return false
};
//match student idtoken with the exsist IDTokenCash
var matchIDToken = new function(IDToken,classNumber){
    //classroom
    if(!classroomList[classNumber])
    //classroom not exsist
        console.log("classroom not exsist");
    return {status:"error",reason:4};
    if(classroomList[classNumber].IDTokenCash.indexOf(IDToken)!=-1){
        console.log('your ID Token not in ID token cash');
        if(matchGoogle(IDToken,classNumber))
            return {status:'od'};
        return {status:'error',reason:2};
    }
};