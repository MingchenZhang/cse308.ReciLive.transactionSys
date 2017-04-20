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
                        }, {
                            "name": "third slide",
                            "pages": [
                                {
                                    "url": "http://www.recilive.stream/resource?blob-key=AMIfv97RlOQqbquyI69muulGOmWyxTY4Er3V8D_ljBe-d4KM91_iEL2I0igcxg2XnhvYfeqxIPRY4BwtCphV1PzK0cbr3sMdHVcVM64xlNSZndSGxUVQf63WFluKYah8FyHLmJkrDPj3Gp-Nwwa74mxEffF_YGUwOVtqlcs9ERx7HoF-S3AtL_xxDwFnMdD4YQ_CIZ3ksw9I6aPcSs2JlDHOh6aiI6EXlUY644XfO_JPikwSBwSd1irILwzdHVnBwnd883zXQBzUqsoyU3n-QxapMzGm4o4Q61M7MpZXSmY1LRN_rrgtYSndYUjgMc6xkagJjQqgt_o9iZB_ze19ro1hiqaYhycP0eXIwUfDNzfgywgLoLMz_38"
                                },
                                {
                                    "url": "http://www.recilive.stream/resource?blob-key=AMIfv97qSTxSG8q-QO2bllc-dWPK2RUHTjc6-Zklk3dxUHzrq8Euhm17LzGZjJLlgBf8T7gMYQLl9NtCNpFZ_w3yf_kgDhAnTqitX6rSnmDkuITaFPYxPFSchHZARa59NuB_bql4SpmSQE0jt2X3wujhb2HwprI2eTZoBHc6iweg0pOUaBLUPx2sFdtWlyamCYpqVd-U7GgFxWyjW9JWq9sc1HCBSkruKsq9fBRU_ZPhMHfKQTAhTzZg1jgpegRbXIUIfoI6O8SlcHTnmHpmmsfqVkbm9X5U2hkkT4j-dtCRtOuv8PHS2L0ezZnJuEmVyB2luqBn3bng-YTnovQ-iwvfyXNi1iSuN9mz3gmjiJaSJhC2l2sfy8s"
                                },
                                {
                                    "url": "http://www.recilive.stream/resource?blob-key=AMIfv97jn_V8Wtsu0q8NtkRzM-wn_uYDkkNxj2QEGSh2COgU2UiXDw0IQtsFz5map39_oZ3zUavN-nOl6dxD0vMWW9U-rJKOWak4IUevr_yKYxjg9uiLCmdODyHpJc3xX787Ag1rMzT2Gj70EifOJRBwD4K29uodmHSZyv6MX480IAJzaLP4qTRJFq0pWfa9isJ88A8Z3pSurCUKA0HVzLyx2VRP8-tl7B9JjvGXKl1ak_HmOTPmLCLEsD-4ghRVAQImApgoiqRFWokb38qnJhZY7vgQ70LsX8GS1OQj5zsLhnwNbK_WNL9BARohCuJFQOoo_ZLl46qDJWLovYoAAWGqWYkRjFcYca8rdWwKW897G3C-4vXHW7k"
                                }, {
                                    "url": "http://www.recilive.stream/resource?blob-key=AMIfv94TEUsdXNoMvImoJgoYam5BERugIDoZo-2LxubHtxOLQuQ2erVS0wtxkXXCnTvCquJ1W-IG9RIH8VBserqwbHOCbtfmiHbU2NFEC4_LBy4VhKtMayUYd1_FuFC1j9QgLbz3HiNi4Gu4U8yUszWG6NYbdOJI_HerEVcBFGET6dIB-XFmW62fkPApI2tauEgW80v_TtdK3jrInB6saAlbwL0mFJqjL_PMuJoG8B1SWb_Mlq6BckrM4UxwjlFR171_EXNfV4hfhk3kSWNLuclw2qWK7wfC1zKOViXVjTJoGBkmDSX-9YIjgel_lG0sekMS5NBrKCD2SH3c4Z-xEABSlgqINb8qDoMWgiveDHEw_hIa0pvNOEU"
                                }
                            ]
                        },
                        {
                            "name": "4th slide",
                            "pages": [
                                {
                                    "url": "http://www.recilive.stream/resource?blob-key=AMIfv94Lhjxkt0gJT8Z3sC6MMkt8mZlH9C6yU2z1v9zjYsPP-ljyKW6Mqf11iSA3LUVUa9hPBrcQ93NTpHfdfh1RE3oPJby_dd8eeTcDrEPYbdPGqbcG3l3NZ3bAtw-J25dqc4rTh8USBP0ckhWMneKDlgp29wBxT1pOT9-qZC1sIK5_LKd7lPGSU_YEaFdKyyZAReCqCtTvh37Lgsgxk2iWVbybFL0yP3wQhTYX0aav5Ew35a65tHwk_exe6tf0fxE2qnVaddzzN9PoICb24EKqhXGl7K6ok1dYY96qUs0lXUgwDuNhnk6E51y6AWqxmyzdmMuMhle9_2_OMlhIHivlYEkcrU2O732bbacABMcy2xaqT5RKuMw"

                                },
                                {
                                    "url": "http://www.recilive.stream/resource?blob-key=AMIfv97HYnWW9PoagDOOw38XW4vtQx9pw1XJ2bcTyywe05uqk1yuvT2demmR4oUnUGd--T6cSEkh5qiScSJGB_IskKahkx0yUHgWfBYCVolJFsz4rJ83ZNglTtRdHFOxIEelbhvIJIc1hox4zq-pZF5aTLbNdpu9i_DAEPnbPln8p3Odspjiw02nhGXJLRK9TU58PW7N1DMrI0b7WZoiMjHv0uyRFCidRR0oNKP8DoNJvjdZDU66Jq1R_c2pUGR9uYjSFGpJlILKfwbUrxndGKE1ZppkLbDRCoJvkfdWOtXcoDDEtv2huetQ8Xgho9KDovpjXrH0DdOe0nbAouDcFcHqHSQwIEANpDIvVXmZgw6-tOEATlqG4GM"
                                },
                                {
                                    "url": "http://www.recilive.stream/resource?blob-key=AMIfv96K2mPDpvpZwnH4FW55Q1VUuTzg6wwHOoG2zfxM_mCfliPYAqrNU2l_VJktxKg1eex8EGYsvlrplqiFrngj-ks_8q_YsubU9vncs0RA7K_U-NLY5hr_8uFD77nb6UfU0Lgh15X3Z5mUEGGKjSPz1u0mAFtkoOlmEntgVPjbKprmeHFU8GxxbbYdmwqGCoa-tqYSR5INJXZhD1r7BopYGKhG-pAp_WrJYaBvNWuoLcQsxD39acaZRM4PIGBh7aGoAy2M5SsD1IsHnY1bY3473Yhe8BXSF-6H9hWFdl34WUKsxLCRj6s3yIiJ_SoYe6c-B6LUv5DexpSw4Zkf8dYmO3tDnKP-4m_LS9EdtXQ47wd3bAVo3Lk"
                                }, {
                                    "url": "http://www.recilive.stream/resource?blob-key=AMIfv97btDZR78Fx1xZcZP0e3j_g1wpHJvNwKjSiwcKyl53Ufk8T3wClMdgMtgWTJ-SooQ4nBelOPd50F04Xabq_ULeGHny7TO4NIZpJR_2ed1p5PuZwVHB2O0P4WMRcQgEdF6t2OvyZbbyRKImaB9a06X3KCq0V-ZvhQHnUwbOeWDVB_sB61Sr2A0EA8EhkFqvs5S9lZeEVskl2p_d_wmvDhk9q86U29XMzioecxYQSygBPgj4DvhmJ2Ub6EKJi2pDbcWPUSQzRdNenZAurZRPJDW_38hzCt7EDrSiQz8QekQ69Hrr2Jt7yCNa2VecvlxQ9CHWF-ZEgiGuW5_11vg1lNO_TKotRkAIikJ4GG5M5Ne6Sc-CTpz0"
                                }
                            ]
                        },
                        {
                            "name": "5th slide",
                            "pages": [
                                {
                                    "url": "http://www.recilive.stream/resource?blob-key=AMIfv94JHQKBol6xhBkx2p3-YsiTk1K72SOhPDJvjqHUvzDJtYAeAkCZ_-MTNc8cEltWcxUqAVTAMCIonhxOXTZ1umJ-1BrEyHAmhacHKh42SAd2xJu7WKnsDq1C6uY5c__YuZKhm12gIE_KkPcSXj30rifrI8GZaYlEgfeB7Qymc8FAsFMZCcurMRZiJB6nE94O97JognnrxLKqID8TSaRE-f22hjlX3SpFnd8ycyfkWcjzx7Oog24SycsTzSJLkgDsiZrgv7nTzuOhFX8cLNVnaBWa7Z8iFu1berPU59I4AUuEn6TAg7oWSc4VQnPxae0jlvbWti1DKN8Ss_Vyt8luOIc45_t_fTD82gAwlb6L97x4rRyCfWU"
                                },
                                {
                                    "url": "http://www.recilive.stream/resource?blob-key=AMIfv97Ve1ZrrDYAMaoBIo-tySHDywWOi7uuk5AS7By1cm_PZiT1RTUR_heH64ER50HIGseU7WQhe_C-pRepnK1qGIdMKb5GLNgwzO_mEBrpwhxp8IhaxmRGIg6zlbxDTOizETxJ9Sfcq8Eie30xFR-iTVHtKi2oqEudxcisw8gwYU71qcl4hN0lodLfJxqKe5ajzA7agKbccShja1aay1sByJKsvnwuFah6UIEXP9zmIB0v5DL7H1aVcTz4OihCjvEusQlxr96Rdx8EZMzZbSO3xcoik097IR5iUqkjC47qy6zZ1LqfnS7fE0GjYHpfThymclqE9tUvmWpT9HKIP6WYtMT8aGjVqw5BxorXiyEVBXjjzp4Xzuc"
                                },
                                {
                                    "url": "http://www.recilive.stream/resource?blob-key=AMIfv95dzDvriYU8DwX2cvoB7cgq45Sb-HVopuugAxOUGsSl1aHnWqOJ2pwaTp3maxlXXQhEloe3vo7_U2rX2OlFWTet8T4epCEBeDv8l7FdPcPUTpDyticlyBbwhajtGj-Vwn-ArXH9u651SgG_cHUH7HJcMhopgRBK-2hljPB5mpJD8Foh-KVmF1owDI-m0qJ0iAYWdtCHoEvOPYQz0VuMKLQcrkWPC-wyAn0fWwWv1Lrs_u-RxdI4WkXO7x0x0r3rTk9xt6QNRFRJ16ABHU35ciJCtF81MK_e49Y4_roea43PNgo8nzGrIjXZGe7xqNuItyOVbjq5m06uEENcHUFG3j423Pwv27qcjQBDHmqTeNp2iQEhqAA"
                                }, {
                                    "url": "http://www.recilive.stream/resource?blob-key=AMIfv94gI-NaB4BbUfnZXC9rVRoejM1Ax_fhClg5SYUc5Pem220wDi6m_wlgvM1GR9pSnZa4o1wxRfaOxeCywIiZ_1m6q9PtoCJz1TtBxMdtzoJV8m8tR5znNCozpUA45oOQmv83YYHPvG0aZ4S5nAYD1buXJLGH-gCUm_cC0JgHVxvwABroq0eTgkkkL1j9k1sCbqNSdYE3Zr3tabx6WBjqSPlyfhPOAkmuV2Vh2wUS0E7wIdYYnTJrNNLI_p8A5BIMt5HZMw_33b6X-XBAptc0jUVKfTaon7s1kzeNynURvVSx5ni6sGUtL4fenfsYvHl83jSpc4QLw0ym1MUpk4q5a54bsc1TNxLvPE3hCiwr2lu6U30dkw4  "
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