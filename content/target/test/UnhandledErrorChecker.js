"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("./Util");
Util_1.default.info("AutoTest: Adding Unhandled Error Checkers");
process.on('unhandledRejection', function (err, promise) {
    Util_1.default.error('MAJOR PROBLEM (probably): AutoTest caught an unhandled rejection (promise: ' + promise + ', reason: ', err);
});
process.on('uncaughtException', function (err) {
    Util_1.default.error('MAJOR PROBLEM (probably): AutoTest caught an unhandled exception: ', err);
});
//# sourceMappingURL=UnhandledErrorChecker.js.map