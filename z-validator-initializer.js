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

                    var bodyErrors = validate(req.body, rule.body, {format: "grouped"});
                    var queryErrors = validate(req.query, rule.query, {format: "grouped"});
                    var paramsErrors = validate(req.params, rule.params, {format: "grouped"});

                    var errors = app._.concat(bodyErrors, queryErrors, paramsErrors);

                    if (app.config.zValidator.useZFormat) {
                        errors = clearErrors (errors);
                    }

                    if (app.config.zValidator.log && errors) {
                        app.logger.info("VALIDATION FAILED", errors);
                    }

                    if(errors){
                        throw {errors: errors};
                    }

                    next();
                };
            }
        };

        function clearErrors (errorArray) {
            if (errorArray && errorArray.length > 0) {
                var errors = [];
                for (var i in errorArray) {
                    if(errorArray[i]){
                        errors.push(errorArray[i]);
                    }
                }
                return errors;
            } else {
                return null;
            }
        }

        app.utils.buildModulesInFolder(app, app.zValidator, app.folderPath.app.root + app.config.zValidator.rootDir + '/');

        next();
    }
};