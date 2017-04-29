var proxy = require('redbird')({port: 80});

proxy.register("recilive.stream", "http://localhost:3000");
proxy.register("room.recilive.stream", "http://localhost:3001");