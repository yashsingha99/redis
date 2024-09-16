// const { Redis } = require("ioredis");

// const client = new Redis({
//     port: process.env.REDIS_PORT,
//     host: process.env.REDIS_HOST,
//     username: process.env.REDIS_USER,
//     password: process.env.REDIS_PASSWORD
// })
// client.connect(() => console.log("redis connected"))
// module.exports = client
const dotenv = require('dotenv');

const { createClient } = require("redis");

dotenv.config();
exports.connectRedis = async () => {
  const redisConnect = await createClient({
    url: process.env.REDIS_URI
  })
  .on("error", (err) => console.log("Redis Client Error", err))
  .on("connect", () => console.log("Redis Client Connected"))
  .connect()
  return redisConnect;
}
