import { Argv } from "yargs";
import signale, { error, success } from "signale";
import { getLogger } from "../../../logger";
import { DnsCreateTxtRecordCommand } from "./dns-command.type";
import { getErrorMessage, highlight } from "../../../utils";
import { request } from "../../../implementations/utils/web-request";

const { trace } = getLogger("dns:txt-record");

export const command = "create [options]";

export const describe = "Creates an Issuer's DNS entry in OpenAttestation's sandbox environment for tutorial purposes";

export const builder = (yargs: Argv): Argv =>
  yargs
    .option("address", {
      alias: "a",
      description: "Contract address of the Document Store or Token Registry",
      type: "string",
      demandOption: false,
      conflicts: "publicKey",
    })
    .option("networkId", {
      description: "Ethereum network (chain ID) that this record is for",
      type: "number",
      demandOption: false,
      conflicts: "publicKey",
    })
    .option("public-key", {
      description: "Did that this record is for",
      type: "string",
      demandOption: false,
      conflicts: ["networkId", "address"],
    })
    .option("sandbox-endpoint", {
      description: "Sandbox address to create record at",
      default: "https://sandbox.openattestation.com",
      alias: "t",
      demandOption: false,
      type: "string",
    });

export const handler = async (args: DnsCreateTxtRecordCommand): Promise<string | undefined> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  if (!args.publicKey && !(args.address && args.networkId)) {
    signale.error("You need to provided a public key or an address with a networkId");
    return;
  }
  const baseUrl = args.sandboxEndpoint;
  try {
    const { executionId } = await request(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...(args.publicKey ? { algorithm: "dns-did", publicKey: args.publicKey } : args) }),
    });
    const { name, expiryDate } = await request(`${baseUrl}/execution/${executionId}`);
    success(
      `Record created at ${highlight(name)} and will stay valid until ${highlight(new Date(expiryDate).toString())}`
    );
    return name;
  } catch (e) {
    error(getErrorMessage(e));
  }
};
