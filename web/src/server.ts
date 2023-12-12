import express from 'express'
import path from "node:path";

const server = express()
server.use(express.static(path.join(__dirname, './')));

server.listen(3000);
console.log('listening on port 3000');