import {IPlatformManager} from "./IPlatformManager";
import D1PlatformManager from "./D1PlatformManager";
import D2PlatformManager from "./D2PlatformManager";

export namespace Platform {

    const D1Manager: IPlatformManager = new D1PlatformManager();
    const D2Manager: IPlatformManager = new D2PlatformManager();

    export function get() {
        if (process.env.PLATFORM === "d1") { // Switch must be done properly.
            return D1Manager;
        } else if (process.env.PLATFORM === "d2") {
            return D2Manager;
        } else {
            throw new Error("Required environment variable PLATFORM not set or specifies invalid value.");
        }
    }

}
