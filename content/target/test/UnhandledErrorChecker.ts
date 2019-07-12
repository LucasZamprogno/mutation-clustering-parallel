import Log from "./Util";

Log.info("AutoTest: Adding Unhandled Error Checkers");

process.on('unhandledRejection', function (err: any, promise: any) {
    Log.error('MAJOR PROBLEM (probably): AutoTest caught an unhandled rejection (promise: ' + promise + ', reason: ', err);
});

process.on('uncaughtException', function (err: any) {
    Log.error('MAJOR PROBLEM (probably): AutoTest caught an unhandled exception: ', err);
});