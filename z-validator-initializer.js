'use strict';

module.exports = {
    run: function (app, next) {

        var validate = require("validate.js");
        var fs = require('fs');

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
                return function (req, res, next) {
                    var parameters = app._.merge(req.params, req.body, req.query);

                    if (!data) {
                        var validatorPath = req.originalUrl.replace('/', '').replace(/\/$/, '');
                        validatorPath = validatorPath.replace(/\//g, '.');
                        data = app._.get(app.validator, validatorPath);
                    }

                    if (app.config.zValidator.log) {
                        app.logger.info("VALIDATE INCOMING PARAMS", parameters);
                    }

                    var errors = validate(parameters, data, {format: "grouped"});

                    if (app.config.zValidator.log && errors) {
                        app.logger.info("VALIDATION FAILED", errors);
                        throw castErrors(errors);
                    }

                    next();
                };
            }
        };

        function buildModulesInFolder(app, namespace, dir) {
            if (fs.existsSync(dir)) {
                var rootDir = fs.readdirSync(dir);

                if (rootDir && rootDir.length > 0) {
                    rootDir.forEach(function (file) {
                        var nameParts = file.split('/');
                        var name = nameParts[(nameParts.length - 1)].split(".")[0];
                        var filePath = dir + file;

                        if (fs.lstatSync(filePath).isDirectory()) {
                            namespace[name] = {};
                            return buildModulesInFolder(app, namespace[name], filePath + '/');
                        } else {
                            if (fs.existsSync(filePath)) {
                                var module = require(filePath);
                                namespace[name] = new module(app);
                            }
                        }
                    });
                }
            }
        }

        function castErrors(errorObj) {
            var errors = [];
            for (var i in errorObj) {
                var currErrorObj = errorObj[i];
                for (var j in currErrorObj) {
                    var error = currErrorObj[j];
                    errors.push({
                        keyword: error,
                        field: i
                    })
                }
            }
            return errors;
        }

        buildModulesInFolder(app, app.validator, app.folderPath.app.root + app.config.zValidator.rootDir + '/');

        next();
    }

};