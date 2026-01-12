import { Router } from "express";
import Create from "../Controllers/Compte/Create";


const ComptRouter = Router();

ComptRouter.post("/update/profile", Create);


export default ComptRouter;

