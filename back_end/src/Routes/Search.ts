import { Router } from "express";
import { searchAccounts } from "../Controllers/Search/SearchAccounts";

const SearchRoutes = Router();

SearchRoutes.get("/accounts", searchAccounts);

export default SearchRoutes;
