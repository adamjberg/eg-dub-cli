// OH HI again
import axios from "axios";
import { promisify } from "util";
import fs from "fs";
import tar from "tar";
import FormData from "form-data";
import { program } from "commander";

program.name("eg").description("CLI for remote deployments").version("0.0.1");

program.command("deploy").action(async () => {
  let engramData = "{}";
  try {
    engramData = fs.readFileSync(".engram", "utf-8");
  } catch (err) {}

  const { lastDeployMs } = JSON.parse(engramData || "{}");

  const zipFilePath = "dist.tar.gz";

  await tar.create(
    {
      gzip: true,
      file: zipFilePath,
      filter: (path, stat) => {
        if (stat.mtimeMs < lastDeployMs) {
          return false;
        }

        if ([".git", "node_modules", zipFilePath].includes(path)) {
          return false;
        }

        return true;
      },
    },
    ["./"]
  );

  const form = new FormData();
  form.append("zipFile", fs.createReadStream(zipFilePath));

  const url = "http://localhost:3000/api/deploy";

  const getLengthAsync = promisify(form.getLength.bind(form));
  const contentLength = await getLengthAsync();
  // This is an ugly hack to deal with an Ubuntu 20 issue
  form.getLengthSync = null;

  await axios.post(url, form, {
    headers: {
      ...form.getHeaders(),
      "Content-Length": contentLength,
    },
  });

  fs.writeFileSync(
    ".engram",
    JSON.stringify({
      lastDeployMs: new Date().getTime(),
    })
  );
});

program.parse();
