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
    let rightNow = new Date();
    var re = /(^\d*)([hms]?$)/gi;

    // map values into their proper spots
    // provide some sane defaults for things not passed
    const newReq = req.method === "GET" ? req.query : req.body;
    let values = {};

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
    if (values.hour === 24) {
        values.minute = 0;
    } else if (!newReq.minute) {
        values.minute = rightNow.getMinutes();
    } else {
        values.minute = newReq.minute;
    }
    if (values.hour === 24) {
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
    values.multi = newReq.multi;
    values.start_hour = newReq.start_hour;
    values.end_hour = newReq.end_hour;
    if (!newReq.start_minute) {
        values.start_minute = 0;
    } else {
        values.start_minute = newReq.start_minute;
    }
    if (values.end_hour === 24 || !newReq.end_minute) {
        values.end_minute = 0;
    } else {
        values.end_minute = newReq.end_minute;
    }
    if (!newReq.start_second) {
        values.start_second = 0;
    } else {
        values.start_second = newReq.start_second;
    }
    if (values.end_hour === 24) {
        values.end_second = 0;
    } else {
        values.end_second = newReq.end_second;
    }

    values.interval = [...newReq.interval.matchAll(re)]; // this needs testing
    console.log(values.interval);

// multi, start_hour, end_hour, start_minute, end_minute, start_second, end_second, interval
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