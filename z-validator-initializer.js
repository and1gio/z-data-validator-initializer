'use strict';

module.exports = {
    run: function (app, next) {

        var validate = require("validate.js");

        app.zValidator = {
            validate: function (rule) {
                return function (req, res, next) {
                    if (!rule) {
                        var validatorPath = req.originalUrl.replace('/', '').replace(/\/$/, '');
                        validatorPath = validatorPath.replace(/\//g, '.');
                        rule = app._.get(app.zValidator, validatorPath);
                    }

                    if(!rule){
                        app.logger.warn("VALIDATION RULE NOT FOUND", validatorPath);
                        return next();
                    }

                    if (app.config.zValidator.log) {
                        app.logger.info("VALIDATE INCOMING REQUEST BODY", req.body);
                        app.logger.info("VALIDATE INCOMING QUERY", req.query);
                        app.logger.info("VALIDATE INCOMING PARAMS ", req.params);
                    }

                    var errors = [];

                    var bodyErrors = validate(req.body, rule.body, {format: "grouped"});
                    buildErrors (errors, bodyErrors, "requestBody");


                    var queryErrors = validate(req.query, rule.query, {format: "grouped"});
                    buildErrors (errors, queryErrors, "query");

                    var paramsErrors = validate(req.params, rule.params, {format: "grouped"});
                    buildErrors (errors, paramsErrors, "params");

                    if (app.config.zValidator.log && errors && errors.length > 0) {
                        app.logger.info("VALIDATION FAILED", errors);
                    }

                    if(errors && errors.length > 0){
                        throw {errors: errors};
                    }

                    next();
                };
            }
        };

        function buildErrors (result, validatedResult, type) {
            if(validatedResult){
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