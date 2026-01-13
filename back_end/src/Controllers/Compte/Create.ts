import { Request, Response } from "express";


const create = async(req:Request, res:Response)=>{
    try{
        console.log(JSON.parse(req.body.userData));
          const userData = JSON.parse(req.body.userData);
         console.log(userData);
    }catch(error){
    }
}

export default create;