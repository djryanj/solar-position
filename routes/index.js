'use strict';
const express = require("express");
const router = express.Router();
const getAngles = require("../components/solarangles");
const vars = require("../components/vars");
const { userValidationRules, validate, getBoolean } = require('../components/validate.js')

router.get("/", userValidationRules(), validate, async (req, res, next) => {
        try {
            const values = getValues(req);
            const result = await getAngles(values.year, values.month, values.day, values.hour, values.minute, values.second, values.tz, values.latitude, values.longitude, values.elevation, values.avg_pressure, values.avg_temperature, values.slope, values.azm_rotation, values.atmos_refract, values.function);
            result.version = vars.vers;
            result.hostname = vars.hostname;
            result.azureBuildNumber = vars.azureBuildNumber;
            if (getBoolean(req.query.json)) {
                res.json(result);
            } else {
                res.render("index", {result: result});
            }
        } catch (e) {
            next(e);
        }
    }
);

// views to implement:
// graphs (limited params)
// different function types in request? table of data or single

router.post("/", userValidationRules(), validate, async (req, res, next) => {

    try {
        const values = getValues(req);
        const result = await getAngles(values.year, values.month, values.day, values.hour, values.minute, values.second, values.tz, values.latitude, values.longitude, values.elevation, values.avg_pressure, values.avg_temperature, values.slope, values.azm_rotation, values.atmos_refract, values.function);
        result.version = vars.vers;
        result.hostname = vars.hostname;
        result.azureBuildNumber = vars.azureBuildNumber;

        if (getBoolean(req.body.json)) {
            res.json(result);
        } else {
            res.render("index", {result: result});
        }
    } catch (e) {
        next(e);
    }
});

function getValues(req) {
    var rightNow = new Date();

    // map values into their proper spots
    // provide some sane defaults for things not passed
    const newReq = req.method === "GET" ? req.query : req.body;
    const values = {};

    values.latitude = newReq.latitude || 53.5461;
    values.longitude = newReq.longitude || -113.4938;
    if (!newReq.tz) {
        values.tz = parseFloat(-(rightNow.getTimezoneOffset())/60) // note the inverted sign
    } else {
        values.tz = newReq.tz; 
    }
    values.elevation = newReq.elevation || 645;
    values.avg_pressure = newReq.avg_pressure || 1018;
    values.avg_temperature = newReq.avg_temperature || 2.7;
    values.year = newReq.year || rightNow.getFullYear();
    values.month = newReq.month || rightNow.getMonth() + 1; // javascript uses 0 indexed months because wat
    values.day = newReq.day  || rightNow.getDate();
    values.hour = newReq.hour || rightNow.getHours();
    // provide a couple of sensible defaults
    if (values.hour == 24 && !newReq.minute) {
        values.minute = 0;
    } else if (!newReq.minute) {
        values.minute = rightNow.getMinutes();
    } else {
        values.minute = newReq.minute;
    }
    if (values.hour == 24 && !newReq.second) {
        values.second = 0;
    } else if (!newReq.second) {
        values.second = rightNow.getSeconds();
    } else {
        values.second = newReq.minute;
    }
    values.slope = newReq.slope || 0;
    values.azm_rotation = newReq.azm_rotation || 0;
    values.atmos_refract = newReq.atmos_refract || 0.5667;
    values.function = getFunction(newReq.function) || vars.SPA_ALL;

    return values;
}

function getFunction(value) {

    switch(value){
        case "SPA_ZA_INC":
        case "1":
        case 1:
            return vars.SPA_ZA_INC;
        case "SPA_ZA_RTS":
        case "2":
        case 2:
            return vars.SPA_ZA_RTS;
        case "SPA_ALL":
        case "3":
        case 3:
            return vars.SPA_ALL;
        default: 
            return vars.SPA_ALL;
    }
}

module.exports = router;