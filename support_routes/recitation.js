var Express = require('express');
var BodyParser = require('body-parser');
var When = require('when'); // used by sequential callback

exports.getRoute = function (s) {
    var router = Express.Router();

    var jsonParser = BodyParser.json({limit: '10kb'});

    router.post('/ajax/list-recitation-list', jsonParser, function (req, res, next) {
        var current_class = req.body.class;
        s.classConn.getRecitationsByClass(current_class).then((response) => {
                if (response) {
                    res.send({result: true, list: respnse, id: current_class});
                } else {
                    res.send({result: false, error: "nothing find in database"});
                }
            }
        ).catch((e) => {
            if (typeof e == "error") {
                res.send({result: false, error: e.message});
            } else {
                res.send({result: false, error: "error in class DB add class"});
            }
        });
    });


    router.post('/ajax/add-recitation', jsonParser, function (req, res, next) {


        s.classDB.addClass(req.body.name, req.body.startDate, req.body.endDate, req.body.owner).then((response) => {
            res.send({result: true});
        }).catch((e) => {
                if (typeof e == "error") {
                    res.send({reslut: false, error: e.message});
                } else {
                    res.send({result: false, error: "error in class DB add class"});
                }
            }
        );
        res.send({result: true});
    })

    public String addRecitation(HttpServletRequest request, HttpServletResponse response, @RequestBody String body) throws ParseException, NoSuchFieldException, EntityNotFoundException, IOException {
        JSONParser parser = new JSONParser();
        JSONObject jsonBody = (JSONObject) parser.parse(body);
        String name = (String) jsonBody.get("name");
        String classSource = (String) jsonBody.get("class");
        String startDate = (String) jsonBody.get("startDate");
        String endDate = (String) jsonBody.get("endDate");
        String createAt = (String) jsonBody.get("createAt");
        String className = (String) jsonBody.get("class");
        JSONObject resultJson = new JSONObject();


        Recitation recitation = new Recitation();
        RecitationInfo recitationInfo = new RecitationInfo();
        recitationInfo.setName(name);
        recitationInfo.setOwner(classSource);
        recitationInfo.setStartDate(startDate);
        recitationInfo.setEndDate(endDate);
        recitationInfo.setCreateAt(createAt);
        Key key = recitation.getClass(className);
        long id = recitation.getID(key);


        JSONObject json = new JSONObject();
        json.put("classNumber", id);
        JSONArray instructor_permissions = new JSONArray();
        instructor_permissions.put("slides");
        instructor_permissions.put("sound_control");
        instructor_permissions.put("chat");

        JSONObject role = new JSONObject();
        role.put("123",instructor_permissions);

        JSONArray student_permissions = new JSONArray();
        student_permissions.put("chat");
        role.put("234",student_permissions);

        json.put("privilege", role);

        json.put("name", name);
        json.put("startDate", startDate);
        json.put("endDate", endDate);
        json.put("status", "LIVE");


        CloseableHttpClient httpClient = HttpClientBuilder.create().build();

        try {
            HttpPost dispatch_request = new HttpPost("http://room.recilive.stream/dispatch_classroom");
            StringEntity params = new StringEntity(json.toString());
            dispatch_request.addHeader("content-type", "application/json");
            dispatch_request.setEntity(params);
            CloseableHttpResponse dispatch_response = httpClient.execute(dispatch_request);
            HttpEntity entity = dispatch_response.getEntity();

            // Read the contents of an entity and return it as a String.
            String content = EntityUtils.toString(entity);
            System.out.println(content);

        } catch (Exception ex) {
            ex.printStackTrace();
        } finally {
            httpClient.close();
        }




        if(key == null) {
            resultJson.put("result", false);
        }else {
            recitation.addRecitation(key, recitationInfo);
            resultJson.put("result", true);
            resultJson.put("id", id);
        }
        return resultJson.toString();
    }

    return router;
};
