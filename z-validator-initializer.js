'use strict';

module.exports = {
    run: function (app, next) {

        var validate = require("validate.js");

        app.validator = {
            buildErrorObject: function (errorArray) {
                if (errorArray && errorArray.length > 0) {
                    var errors = [];
                    for (var i in errorArray) {
                        errors.push({keyword: errorArray[i]});
                    }
                    return errors;
                } else {
                    return null;
                }
            },
            validate: function (data, type) {
                var fn = function (req, res, next) {

                    if (app.config.zValidator.log) {
                        app.logger.info("VALIDATE INCOMING PARAMS", req.body);
                    }

                    var errors = validate(req.body, data, {format: app.config.zValidator.format || "flat"});

                    if (app.config.zValidator.useZFormat) {
                        errors = app.validator.buildErrorObject(errors);
                    }

                    if (app.config.zValidator.log && errors && errors.length > 0) {
                        app.logger.info("VALIDATION FAILED", errors);
                        throw {errors: errors};
                    }

                    next();
                };
                return fn;
            }
        };

        app.utils.buildModulesInFolder(app, app.validator, app.folderPath.app.root + app.config.zValidator.rootDir + '/');

        next();
    }
};

