import Server from "./rest/Server";
import Log from "./Util";
import {Platform} from "./controller/platform/Platform";
import * as fs from "fs-extra";

/**
 * Main app class that is run with the node command. Starts the server.
 */
export class App {
    public async initServer(port: number) {
        Log.info("App::initServer( " + port + " ) - start");

        // Clear any cached data before starting
        try {
            await fs.remove("./data");
            Log.info("App::initServer(..) - Cached cleared.");
        } catch (err) {
            // Do nothing
        }

        // Not required for students, only for running the UI service
        return Platform.get().preloadDatasets().then(() => {
            return this.startServer(port);
        }).catch(function (err: any) {
            Log.error("Error adding datasets and starting server" + err);
        });
    }

    private startServer(port: number) {
        const server = new Server(port);
        server.start().then(function (val: boolean) {
            Log.info("App::initServer() - started: " + val);
        }).catch(function (err: Error) {
            Log.error("App::initServer() - ERROR: " + err.message);
        });
    }
}

// This ends up starting the whole system and listens on a hardcoded port (11315)
(async () => {
    Log.info("App - starting");
    const app = new App();
    await app.initServer(11315);
})();

