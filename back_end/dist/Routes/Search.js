"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SearchAccounts_1 = require("../Controllers/Search/SearchAccounts");
const SearchRoutes = (0, express_1.Router)();
SearchRoutes.get("/accounts", SearchAccounts_1.searchAccounts);
exports.default = SearchRoutes;
