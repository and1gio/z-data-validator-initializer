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
                var fn = function (req, res, next) {

                    if(!data){
                        var validatorPath = req.originalUrl.replace('/', '').replace(/\/$/, '');
                        validatorPath = validatorPath.replace(/\//g, '.');
                        data = app._.get(app.validator, validatorPath);
                    }

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

        function buildModulesInFolder (app, namespace, dir) {
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

        buildModulesInFolder(app, app.validator, app.folderPath.app.root + app.config.zValidator.rootDir + '/');

        next();
    }
};

