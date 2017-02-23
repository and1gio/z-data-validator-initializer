'use strict';

module.exports = {
    run: function (app, next) {

        var validate = require("validate.js");

        app.zValidator = {
            validate: function (requestBody, requestParams, requestQuery, rule) {

                if (!rule) {
                    app.logger.warn("VALIDATION RULE NOT FOUND");
                    throw [{"keyword": "VALIDATION_RULE_NOT_FOUND"}];
                }

                if (app.config.zValidator.log) {
                    app.logger.info("VALIDATE INCOMING REQUEST BODY", requestBody);
                    app.logger.info("VALIDATE INCOMING PARAMS ", requestParams);
                    app.logger.info("VALIDATE INCOMING QUERY", requestQuery);
                }

                var errors = [];

                var bodyErrors = validate(requestBody, rule.body, {format: "grouped"});
                buildErrors(errors, bodyErrors, "requestBody");

                var paramsErrors = validate(requestParams, rule.params, {format: "grouped"});
                buildErrors(errors, paramsErrors, "params");

                var queryErrors = validate(requestQuery, rule.query, {format: "grouped"});
                buildErrors(errors, queryErrors, "query");

                if (app.config.zValidator.log && errors && errors.length > 0) {
                    app.logger.info("VALIDATION FAILED", errors);
                }

                if (errors && errors.length > 0) {
                    throw {errors: errors};
                }
            },

            check: function (rule) {
                return function (req, res, next) {
                    if (!rule) {
                        var validatorPath = req.originalUrl.replace('/', '').replace(/\/$/, '');
                        validatorPath = validatorPath.replace(/\//g, '.');
                        rule = app._.get(app.zValidator, validatorPath);
                    }

                    app.zValidator.validate(req.body, req.params, req.query, rule);

                    next();
                };
            }
        };

        function buildErrors(result, validatedResult, type) {
            if (validatedResult) {
                for (var key in validatedResult) {
                    result.push({
                        from: type,
                        param: key,
                        keyword: validatedResult[key][0]
                    });
                }
            }
        }

        app.utils.buildModulesInFolder(app, app.zValidator, app.folderPath.app.root + app.config.zValidator.rootDir + '/');

        next();
    }
};