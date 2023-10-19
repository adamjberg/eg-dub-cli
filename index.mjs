// OH HI again
import axios, { all } from "axios";
import { promisify } from "util";
import path from "path";
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

  const getFilesToTar = () => {
    let allFiles = [];

    addFilesToTar("./", allFiles);

    return allFiles;
  };

  const addFilesToTar = (dir, archive) => {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const fileStat = fs.statSync(filePath);

      if (fileStat.mtimeMs < lastDeployMs) {
        continue; // Skip files with mtimeMs older than the last deployment
      }

      if ([".git", "node_modules", zipFilePath].includes(file)) {
        continue; // Skip .git, node_modules, and the target zip file
      }

      if (fileStat.isDirectory()) {
        // Recursively add files from subdirectories
        addFilesToTar(filePath, archive);
      } else {
        // Add individual files to the archive
        archive.push(filePath);
      }
    }
  };

  const filesToDeploy = getFilesToTar();
  if (!filesToDeploy.length) {
    console.log("Nothing to deploy");
    return;
  }

  await tar.create(
    {
      gzip: true,
      file: zipFilePath,
    },
    filesToDeploy
  );

  const form = new FormData();
  form.append("zipFile", fs.createReadStream(zipFilePath));

  const url = "http://5.78.69.52:3000/api/deploy";

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
