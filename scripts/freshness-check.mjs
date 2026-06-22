// Daily freshness check for data/companies.json.
// For each company, fetches its `website` URL, records whether it's
// reachable, and hashes the page text to flag content that changed
// since the last run. No external dependencies — uses Node's global
// fetch (Node 18+) and crypto.
//
// Writes back:
//   - data/companies.json: adds/updates lastChecked, status, contentHash
//   - data/flags.json: a summary of anything non-"ok" for the Action
//     to turn into a GitHub issue.

import { readFile, writeFile } from "fs/promises";
import { createHash } from "crypto";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "..", "data", "companies.json");
const FLAGS_PATH = path.join(__dirname, "..", "data", "flags.json");

const TIMEOUT_MS = 12000;
const CONCURRENCY = 5;
const USER_AGENT =
  "RemoteIndexLinkChecker/1.0 (+https://github.com/sivolko/remotejobs)";

function normalize(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function hash(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

async function checkOne(company) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(company.website, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT }
    });
    clearTimeout(timer);

    if (!res.ok) {
      if (res.status === 401 || res.status === 403 || res.status === 429) {
        return { status: "blocked", httpStatus: res.status };
      }
      return { status: "broken", httpStatus: res.status };
    }

    const text = await res.text();
    const newHash = hash(normalize(text).slice(0, 20000));
    const prevHash = company.contentHash;
    const changed = Boolean(prevHash) && prevHash !== newHash;

    return {
      status: changed ? "changed" : "ok",
      httpStatus: res.status,
      contentHash: newHash
    };
  } catch (err) {
    clearTimeout(timer);
    return { status: "unreachable", error: String((err && err.message) || err) };
  }
}

async function main() {
  const raw = await readFile(DATA_PATH, "utf8");
  const companies = JSON.parse(raw);
  const today = new Date().toISOString().slice(0, 10);
  const flags = [];

  let idx = 0;
  async function worker() {
    while (idx < companies.length) {
      const i = idx++;
      const c = companies[i];
      const result = await checkOne(c);

      c.lastChecked = today;
      c.status = result.status;
      if (result.contentHash) c.contentHash = result.contentHash;

      if (result.status !== "ok" && result.status !== "blocked") {
        flags.push({
          id: c.id,
          name: c.name,
          website: c.website,
          status: result.status,
          httpStatus: result.httpStatus,
          error: result.error
        });
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  await writeFile(DATA_PATH, JSON.stringify(companies, null, 2) + "\n");
  await writeFile(
    FLAGS_PATH,
    JSON.stringify({ checkedAt: today, flags }, null, 2) + "\n"
  );

  console.log(`Checked ${companies.length} companies. ${flags.length} flagged.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
