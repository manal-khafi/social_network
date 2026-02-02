"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketServer = exports.setSocketServer = void 0;
let ioRef = null;
const setSocketServer = (io) => {
    ioRef = io;
};
exports.setSocketServer = setSocketServer;
const getSocketServer = () => ioRef;
exports.getSocketServer = getSocketServer;
