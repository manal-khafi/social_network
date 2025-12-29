import express from "express";
import cors from 'cors';


const port= 3500;
const app= express();

app.use(express.json());


app.use(cors({
  origin: [
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept'
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));


app.listen(port, async ()=>{
    console.log(`port connected en http://localhost:${port}`)
})

app.get("/", (req, res) => {
  res.json({
    message: "Bienvenue sur l'api socielle network",
  });
});
