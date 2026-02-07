#!/usr/bin/env node
import { execSync } from "node:child_process";

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

// Use repo-local hooks so CI/dev machines are consistent.
run("git config core.hooksPath .githooks");
process.stdout.write("hooks: configured core.hooksPath=.githooks\n");

