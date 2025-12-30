import express from "express";
import cors from 'cors';
import dotenv from "dotenv";
import registerRoutes from "./routes/registerRoutes";

dotenv.config();

const port = process.env.PORT || 3500;
const app= express();


app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());



app.use("/api/auth", registerRoutes);



app.listen(port, async ()=>{
    console.log(`port connected en http://localhost:${port}`)
})

app.get("/", (req, res) => {
  res.json({
    message: "Bienvenue sur l'api socielle network",
  });
});
