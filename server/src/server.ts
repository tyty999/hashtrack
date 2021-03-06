import "reflect-metadata"
import Koa from 'koa'
import cors from '@koa/cors'
import config from './config'
import { initGraphqlServer } from './graphql'
import dbConnection from './database'
import Container from "typedi"
import TweetService from "./services/tweet-service"
import log from "./logger"
import { initStaticFiles } from "./static"
import CleanupService from "./services/cleanup-service"

const app = new Koa()

app.use(cors())

async function run() {
    await dbConnection
    const tweetService = Container.get(TweetService)
    const http = app.listen(config.port)
    await initGraphqlServer(app, http)
    await initStaticFiles(app)
    log.info(`Listening on port ${config.port}`)

    await tweetService.refreshStream()

    setInterval(() =>
        tweetService.refreshStream(),
        config.twitter.refreshInterval * 1000)

    setInterval(() =>
        Container.get(CleanupService).cleanup(),
        config.cleanupInterval * 1000)
}

run().catch(error => {
    log.error(error.stack ?? error.message)
    process.exit(1)
})
