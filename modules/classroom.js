var Express = require('express');
var BodyParser = require('body-parser');
var When = require('when');
var ParameterChecker = require('./parameterChecker');
var MongoEscape = require('mongo-escape').escape;
var Request = require("request");

exports.getRoute = function (s) {
    var router = Express.Router({mergeParams: true});

    var jsonParser = BodyParser.json({limit: '10mb'});

    // classroom page
    router.get('/', function (req, res, next) {
        res.render("live", {
            username: req.userLoginInfo.name,
            classroomNumber: req.classroomNumber,
            userID: req.userLoginInfo.userID
        });
    });

    router.post('/transaction_post', jsonParser, function (req, res, next) {
        var index = req.body.index;
        var module = req.body.module;
        var description = MongoEscape(req.body.description);
        var payload = MongoEscape(req.body.payload);

        if (!ParameterChecker.transactionPush(req.body))
            return res.status(400).send({status: 'error', reason: 5});

        var createdBy = req.userLoginInfo.userID;

        req.classroomSession.addTransaction({
            index,
            module,
            description,
            payload,
            createdBy,
        }).then(() => {
            res.send({status: 'ok'});
        }).catch((err) => {
            var message = {status: 'error'};
            if (err.reason) message.reason = err.reason;
            else err.reason = 7;
            if (!s.inProduction) message.detail = err;
            res.send(message);
        });
    });

    router.get('/my_privilege', function (req, res, next) {
        var privilege = req.classroomSession.privilege[req.userLoginInfo.userID];
        if (privilege) return res.send({status: 'ok', privilege: privilege});
        else return res.send({status: 'error', reason: 2});
    });

    router.get('/get_resource', function (req, res, next) {
        res.send({
            "resources": [
                {
                    "type": "slide",
                    "content": [
                        {
                            "name": "first slide",
                            "pages": [
                                {
                                    "url": "https://www.recilive.stream/resource?blob-key=AMIfv96jJlBqUmUFdeZg7tgZMGUXD8af_iP29csY9o5NXhcyosBDTVRAQnq3efwVK7aEAZMHvw_-WfyWc3qhNifPbmrkkNeyD6r0jwMurW5dLLp-gGKH_xALYL-CGTHclVRKYzzi6yy-MoFnKa0rvVJ5JWVdwZzH8utsBCqfthAZ2rsSieCoONVi2E9eSTtcSa_FaSBMTnpupUUQywn_oq4JrPBgAZuqjmClpb_wmqVtYohi-KSuFWkoYIVjOXt56xOJOX689fYQy2t8x0Lmlo1-9zrf4j6Lhu2zZwJun8MoPyBDnR2jSY3X_shy7Sz6BdWACcUFVxQZ3wU3vBF4YCpDTwdi1nEz8TCxGZ6IBlRxf2q9mPyEHSg"
                                },
                                {
                                    "url": "https://www.recilive.stream/resource?blob-key=AMIfv96F93djcgO--WsKMZ0C7YAoiQLYzKiercGLrF0nOWvIcqUcsNPreFj9ww4AL_tVo9uk37MtYpxF3Fb74OhzbCWjf8b_tooBN7DPWZRzLqOB9b8dfF86XKY1lvYD_Pvmh9yU70Ekl5EdZTrS10otVSxpKqifG830yArk-gUKIXY9MwRxhFTgGNr9b3FyHJ8DCGK4pI8oRw9wuTWvupHMyWH0y76_FCfte4hEW5vxHpLVCASIpMwXISdMkvgPWJtVpwl3LzqfpltMLYFFrbda0XahwVhS5AmA0o6CVfRzNYzdc3OmsD0UdedtXjgK-tHnA460NcdlML2nPw5hV2G7rih0SKQaqJq5rZ8asCn-lIJ9AgTKA3g"
                                },
                                {
                                    "url": "https://www.recilive.stream/resource?blob-key=AMIfv96r-z4QbdAMQCvGL6b_08pMdHdmiiH8jRK1g-eJ78DJ3G3Cm42X-P9issU5l4ToiEYBwHAw6Gj_Lhp7apWNcy_A1Wgq4fDoLk3GlrudCHTAchaQuZhp57L25hl3cr2Nwb7WqvovU9ltxPQ1U5FVrqxNZrUreYE6Z9QTPPx-l0kCNpbwMWTbi0tqUuaBTXI7Dl6AMqKnmIqmLDk_IMv8X1NDDdwfdL4Qq950Sdr--jz07VR-sQYyUeTPKhDBP7vBkfrDHvOBsa39mnh2D9y5aID7fJhfXoK_XwuxN2HyNWWuksUxNKr71-AEzi2DJtz1ipA3hhWs3rohDo_OYq9QvXGgY5QKT-x1BW_U5aQbc-ttZw42IZQ"
                                },
                                {
                                    "url": "https://www.recilive.stream/resource?blob-key=AMIfv97GoCm0RtiSj8SMjU2MPXFOTmJPEBzBQu4qH_p4tDkgPj1MGXpmLc4TqVpD9k8RkSz2IbPuX7FZL1cjj9IFCJ1UmpdIyNy2owh5D5Xyu9p7Nw6ttfhdA1pfEPXlamvm-xx9o8UXmOdat6tHioypfjmseHWA3SUGRKF1RaxU4mYenAVH_EM9WVy8AtXoun1WWvVNQqFEpJic1nFlRTbK71Tfz3b_XMKdsv2GfQSjXKpqLfd5l90D5rHl5pSeIce9VCIlp5r3bOB85_PsfEg_QPR9IeYFxnF0VRpTTapDoHn435e1T3hbkZ8xQYrM47EG9d2X9d1FjrCB5UMeH5oG9sv-EQEWM4oiKhMkrNEfgDUI8n8mGE4"
                                }
                            ]
                        },
                        {
                            "name": "second slide",
                            "pages": [
                                {
                                    "url": "https://www.recilive.stream/resource?blob-key=AMIfv96oyr1kDawk9cxhyqefjLjy1UOOboaMHRqCm77HBJWU4tYp8GqRhu6utKPyxKJphnmLF4U3aLAZ7eUCnTMbGJD1LkzCoik87K4-YxkHPzpXclNcd0gTZSdKGcKeoFl5SWj1Y0nSWwPH1YdmsQw4hlDsZfCrSPTzImLCxeN98aRUJNs-NyOAQfrOKu_kUPrRFYKe1LXUfaAR7KBMx9bXeb1lC8Oei_73aibWmnA2UdVbJ8cfxPU4QUyOXRHCBagE1iLyqeB-Wx5zxyPHB9COQtRQi86pdiNWx9fVMPBxCSN4T0hJ2QYbk_NbCouNQJAKpYNmprDOz-GpPEzfmhPftWx1rmjkP5HtTNfJqOBpnnAd7KowJqQ"
                                },
                                {
                                    "url": "https://www.recilive.stream/resource?blob-key=AMIfv96K0FiHRWV0NMuE3R556XdJ6rnBy8qw7vvONT525-U-cuNA2RpxYoYEh4ZRyUtcQkL8W1n8nQsllWXavx_Jd2NXfZipZWJfGHuDb-5ywnAHpbt38eFM1VqncXttNiK5txWGpV8ORKyIOPX7C9TUcobksgl-4XuSadMsiLrQVvDC1rpCVLDPA4LYvhXKsYu_0uIF4H3JUHHI11Otu6qn-o-VS5gx3oMKgzxHgImgbC2hVXaT8Xe-TPj6FNVRYq8cRfuSs-PNZeFfcGa-oQOOH0kaCBsQJIUOBm3BtvvFonHxI410is1hmabpw86i_UyzK8EOfmzDt8oNKQaxdV0PBQ2ewajsqwNqAIzSiHWV2S7q_dzM4ss"
                                },
                                {
                                    "url": "https://www.recilive.stream/resource?blob-key=AMIfv94y6MrbeRUPUx_O_2nYBHUk7UD4ASG5QU0-eMy-t1tcqXw07lMNEVo3sNLs8KO2VtAEv1RZd94Bir_ejWY44Nt8PKPJPfLigqSitzlu4P380WeW6UYq4_tJQfi5t1VKUQWyW0BlUNe84BbidMIFbVRyGE-HfKJ5LdArP29oKryDPDN9K4lqkVRgceHCElkgxUCi1v2F47teS93Obl47uNsUL7xJ7TGo464xEH-tzNFYtbtyfPyPDC95Cv6AqFmE5ECAm9gjkriYCAqbvvNuQSrO0KngGNI9cKmlP3Vh6Xcz4DKT8YTzqzWGJRwcZvA1R7vDpIyUghDjANP4gjauPvFQ_YKfVCc7xyg8BTfDUxAThG1zRW0"
                                }
                            ]
                        }
                    ]
                }
            ]
        });
        // Request({
        //     method: 'POST',
        //     url:"https://recilive.stream/get_resource",
        //     json: {classNumber: req.classroomNumber}
        // }, (error, response, body)=>{
        //     if(error) return res.status(500).send({status:"error", error, statusCode: response.statusCode});
        //     return res.send(body);
        // });
    });

    return router;
};