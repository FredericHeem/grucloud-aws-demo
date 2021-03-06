const assert = require("assert");
const ping = require("ping");
const path = require("path");
const Client = require("ssh2").Client;
const { retryCall } = require("@grucloud/core").Retry;

const testPing = ({ host }) =>
  ping.promise.probe(host, {
    timeout: 10,
  });

const readPrivateKey = ({ keyName }) =>
  require("fs").readFileSync(path.resolve(__dirname, `${keyName}.pem`));

const testSsh = async ({ host, username = "ec2-user", keyName }) =>
  await new Promise((resolve, reject) => {
    const conn = new Client();
    conn
      .on("ready", function () {
        //console.log(`ssh to ${host} ok`);
        conn.end();
        resolve();
      })
      .on("error", function (error) {
        console.log(`cannot ssh to ${host}`, error);
        reject(error);
      })
      .connect({
        host,
        port: 22,
        username,
        //agent: process.env.SSH_AUTH_SOCK,
        privateKey: readPrivateKey({ keyName }),
      });
  });

module.exports = ({ resources: { eip, ec2Instance }, provider }) => {
  assert(provider);
  return {
    onDeployed: {
      init: async () => {
        const eipLive = await eip.getLive();
        const serverLive = await ec2Instance.getLive();
        assert(serverLive, "server should be alive");
        //Static checks
        assert.equal(serverLive.PublicIpAddress, eipLive.PublicIp);

        const host = eipLive.PublicIp;
        return {
          host,
        };
      },
      actions: [
        //Cannot ping from CircleCI
        /*{
          name: "Ping",
          command: async ({ host }) => {
            const alive = await retryCall({
              name: `ping ${host}`,
              fn: async () => {
                const { alive } = await testPing({ host });
                if (!alive) {
                  throw Error(`cannot ping ${host} yet`);
                }
                return alive;
              },
              shouldRetryOnException: () => true,
              retryCount: 40,
              retryDelay: 5e3,
            });
            assert(alive, `cannot ping ${host}`);
          },
        },*/
      ],
    },
    onDestroyed: {
      init: () => {
        //console.log("ec2 onDestroyed");
      },
    },
  };
};
