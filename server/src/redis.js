const { Redis } = require("ioredis");

const client = new Redis({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASSWORD
})
client.connect(() => console.log("redis connected"))
module.exports = client
