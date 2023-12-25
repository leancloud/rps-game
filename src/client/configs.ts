const appId = "OgE8zDRpOXNwsl3i38vccFqy-9Nh9j0Va";
const appKey = "TMkbH8yfIO2APRioG2joeety";
const apiServer = "https://oge8zdrp.lc-cn-n1-shared.com";

const clientEngineServer =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "";

export const configs = {
  appId,
  appKey,
  apiServer,
  clientEngineServer,
};
