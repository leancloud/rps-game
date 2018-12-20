import { Region } from "@leancloud/play";

export const REGION = Region.NorthChina;

const appId = process.env.LEANCLOUD_APP_ID!;
const appKey = process.env.LEANCLOUD_APP_KEY!;
if (appId === undefined) {
  throw new Error("LEANCLOUD_APP_ID not set");
}
if (appKey === undefined) {
  throw new Error("LEANCLOUD_APP_KEY not set");
}

const clientEngineServer =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "";

export const configs = {
  appId,
  appKey,
  clientEngineServer,
};
