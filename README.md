# z-data-validator-initializer

rules example - using [validate.js](https://validatejs.org/)

**validators/api/example/hello/js**
```javascript
module.exports = function (app) {
    return {
        body: {
            "data": {
                presence: {
                    message: "^REQUIRED"
                }
            },
            "data.name": {
                presence: {
                    message: "^REQUIRED"
                },
                inclusion: {
                    within : ['VALUE1', 'VALUE2'],
                    message: "^INVALID_VALUE"
                }
            }
        },
        params: {
            "id": {
                presence: {
                    message: "^REQUIRED"
                }
            },
            "type": {
                presence: {
                    message: "^REQUIRED"
                }
            }
        },
        query: {
            "orderBy": {
                presence: {
                    message: "^REQUIRED"
                }
            }
        }
    };
};
```

**routes/api/example.js**
```javascript
'use strict';

module.exports = function (app) {

    var router = require('express').Router();

    router.post(
        '/hello/:id/:type',
        app.zValidator.validate(app.zValidator.api.example.hello),
        function (req, res, next) {
            app.service.example.hello(req, function (error, data) {
                error ? next(error) : res.json(data);
            });
        });

    return router;
};
```