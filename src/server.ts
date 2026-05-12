import app from "./app";

const port = Number(3001);

app.listen(port, () =>{ 
  console.log(`Server is running on port ${port}`);
})
