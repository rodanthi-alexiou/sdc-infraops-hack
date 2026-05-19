#!/usr/bin/env node
// Checks upstream GitHub sources for content drift against stored SHAs.
// Reads source list from tools/registry/ai-skill-sources.json and fetches the
// latest commit SHA for each tracked file via the GitHub REST API.
//
// Usage:
//   node check-skill-source-drift.mjs               # report only
//   node check-skill-source-drift.mjs --fail-on-drift     # exit 1 if drift detected
//   node check-skill-source-drift.mjs --update-baseline   # record current SHAs as baseline
//   node check-skill-source-drift.mjs --fail-on-drift --update-baseline  # both flags
//
// Authentication:
//   Set GH_TOKEN or GITHUB_TOKEN environment variable for authenticated requests
//   (5000 req/hour authenticated vs 60 req/hour unauthenticated).

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const SOURCES_FILE = join(
  process.cwd(),
  "tools/registry/ai-skill-sources.json",
);
const GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const FAIL_ON_DRIFT = process.argv.includes("--fail-on-drift");
const UPDATE_BASELINE = process.argv.includes("--update-baseline");

/**
 * Fetches the latest commit SHA for a file in a GitHub repo.
 * @param {string} owner
 * @param {string} repo
 * @param {string} branch
 * @param {string} path
 * @returns {Promise<{sha: string, date: string, url: string} | null>}
 */
async function getLatestCommitSha(owner, repo, branch, path) {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&path=${encodeURIComponent(path)}&per_page=1`;
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "apex-skill-drift-checker",
  };
  if (GH_TOKEN) {
    headers["Authorization"] = `Bearer ${GH_TOKEN}`;
  }

  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(30000),
  });

  if (res.status === 404) {
    // File or repo may not exist on that branch yet — not a fatal error
    return null;
  }
  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status} for ${url}`);
  }

  const commits = await res.json();
  if (!Array.isArray(commits) || commits.length === 0) {
    return null;
  }

  const [commit] = commits;
  return {
    sha: commit.sha,
    date: commit.commit.committer.date,
    url: commit.html_url,
  };
}

async function main() {
  const data = JSON.parse(readFileSync(SOURCES_FILE, "utf-8"));
  let driftCount = 0;
  let errorCount = 0;

  console.log(`Checking ${data.sources.length} upstream sources...\n`);

  for (const source of data.sources) {
    source.last_checked = new Date().toISOString();

    let latest;
    try {
      latest = await getLatestCommitSha(
        source.owner,
        source.repo,
        source.branch,
        source.path,
      );
    } catch (err) {
      console.warn(`⚠️  Could not fetch ${source.id}: ${err.message}`);
      errorCount++;
      continue;
    }

    if (!latest) {
      console.warn(
        `⚠️  No commits found for ${source.id} (${source.owner}/${source.repo}@${source.branch}:${source.path})`,
      );
      continue;
    }

    const hasDrift = source.last_sha !== latest.sha;

    if (hasDrift) {
      driftCount++;
      const isNew = source.last_sha === null;
      console.log(`${isNew ? "🆕 NEW" : "🔄 DRIFT"}: ${source.id}`);
      console.log(
        `   Repo:    ${source.owner}/${source.repo}@${source.branch}`,
      );
      console.log(`   File:    ${source.path}`);
      console.log(`   Commit:  ${latest.url}`);
      console.log(`   Date:    ${latest.date}`);
      console.log(`   Affects: ${source.skill_files.join(", ")}`);
      if (UPDATE_BASELINE) {
        source.last_sha = latest.sha;
        console.log(`   ✅ Baseline updated to ${latest.sha.slice(0, 7)}`);
      }
    } else {
      console.log(`✅ Current: ${source.id} (${latest.sha.slice(0, 7)})`);
    }
    console.log();
  }

  // Always write back — at minimum to update last_checked timestamps
  writeFileSync(SOURCES_FILE, JSON.stringify(data, null, 2) + "\n");

  // Summary
  console.log("─".repeat(60));
  if (driftCount === 0 && errorCount === 0) {
    console.log("✅ All sources are current.");
  } else {
    if (driftCount > 0) {
      console.log(`🔄 ${driftCount} source(s) have drifted from baseline.`);
      if (!UPDATE_BASELINE) {
        console.log("   Run with --update-baseline to record current SHAs.");
      }
    }
    if (errorCount > 0) {
      console.log(
        `⚠️  ${errorCount} source(s) could not be checked (see warnings above).`,
      );
    }
  }

  if (driftCount > 0 && FAIL_ON_DRIFT) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(2);
});
