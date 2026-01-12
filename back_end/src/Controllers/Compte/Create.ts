import { Request, Response } from "express";


const create = async(req:Request, res:Response)=>{
    try{
        console.log(req.body);
    }catch(error){
    }
}

export default create;