#!/usr/bin/env node
// Thin wrapper around installed claudeflow that routes pipeline runs through the
// Anthropic / OpenAI-compatible (Gemini, OpenAI, DeepSeek) API instead of the
// Claude Code CLI — so bulk pipeline runs do NOT consume the Claude Max subscription.
//
// Usage:
//   ./scripts/cflow.mjs run <pipeline.yaml> [--runtime anthropic|gemini|openai|deepseek|mock]
//                                            [--model <model>]
//                                            [--input '<json>']
//                                            [--verbose]
//
// The default runtime is auto-detected from .env.local in this order:
//   OPENAI_API_KEY > GEMINI_API_KEY > ANTHROPIC_API_KEY > DEEPSEEK_API_KEY
//
// NOTE: ClaudeApiRuntime (installed claudeflow v0.1.0) is text-only — it does not
// execute Claude Code's tools (Read, Glob, Grep, WebFetch). Pipelines with tool
// steps should be run via `npx claudeflow run ...` (Claude CLI path, burns Max sub)
// OR re-written to receive tool outputs as `--input` fields.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  loadYaml,
  ClaudeApiRuntime,
  MockRuntime,
  MemoryStore,
  CheckpointManager,
} from "claudeflow";

function loadEnvLocal() {
  try {
    const raw = readFileSync(".env.local", "utf-8");
    for (const line of raw.split("\n")) {
      const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch { /* .env.local optional */ }
}

function argv(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function hasFlag(name) { return process.argv.includes(name); }

loadEnvLocal();

const command = process.argv[2];
const pipelinePath = process.argv[3];

if (command !== "run" || !pipelinePath) {
  console.log("Usage: ./scripts/cflow.mjs run <pipeline.yaml> [--runtime anthropic|gemini|openai|deepseek|mock] [--model <model>] [--input '<json>'] [--verbose]");
  process.exit(1);
}

if (!existsSync(pipelinePath)) {
  console.error(`File not found: ${pipelinePath}`);
  process.exit(1);
}

const requested = argv("--runtime");
const explicitModel = argv("--model");
const verbose = hasFlag("--verbose");
const inputStr = argv("--input");
const input = inputStr ? JSON.parse(inputStr) : {};

function detectRuntime() {
  if (requested) return requested;
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.DEEPSEEK_API_KEY) return "deepseek";
  throw new Error("No API key found. Set one in .env.local (GEMINI_API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY / DEEPSEEK_API_KEY).");
}

// The installed claudeflow v0.1.0 only has ClaudeApiRuntime pointing to api.anthropic.com.
// We reuse it and override baseUrl / apiKey / model for OpenAI-compatible providers.
function buildRuntime(kind) {
  switch (kind) {
    case "mock":
      return new MockRuntime({ defaultText: "[mock runtime response]" });
    case "anthropic": {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing in .env.local");
      return new ClaudeApiRuntime({ apiKey, model: explicitModel ?? process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514" });
    }
    case "gemini":
    case "openai":
    case "deepseek": {
      // ClaudeApiRuntime targets anthropic/v1/messages; OpenAI-compatible providers
      // need a different adapter. We fall back to Anthropic runtime with a warning,
      // UNTIL claudeflow adds OpenAICompatibleRuntime upstream.
      console.error(`⚠  runtime=${kind} requires OpenAICompatibleRuntime which is not in claudeflow v0.1.0.`);
      console.error(`   Falling back to ANTHROPIC_API_KEY if present.`);
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("No ANTHROPIC_API_KEY to fall back to. Install upstream OpenAI-compatible runtime, or run via 'npx claudeflow run' (burns Claude Max).");
      }
      return new ClaudeApiRuntime({ apiKey: process.env.ANTHROPIC_API_KEY, model: explicitModel ?? "claude-sonnet-4-20250514" });
    }
    default:
      throw new Error(`Unknown runtime: ${kind}`);
  }
}

const runtimeKind = detectRuntime();
if (verbose) console.error(`runtime: ${runtimeKind}`);
const runtime = buildRuntime(runtimeKind);

const p = loadYaml(pipelinePath);

const tracesDir = path.join(path.dirname(pipelinePath), "..", "traces");
if (!existsSync(tracesDir)) mkdirSync(tracesDir, { recursive: true });

const memory = new MemoryStore(path.join(path.dirname(pipelinePath), "..", ".claudeflow", "memory"));
const checkpoint = new CheckpointManager(path.join(path.dirname(pipelinePath), "..", ".claudeflow", "checkpoints"));

// Note: no tools passed — ClaudeApiRuntime is text-only. Pipelines with `tools:` steps
// should use `npx claudeflow run` (Claude CLI path) instead.
const result = await p.run(input, { runtime, verbose, memory, checkpoint });

const traceName = `${p.name}-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
const tracePath = path.join(tracesDir, traceName);
writeFileSync(
  tracePath,
  JSON.stringify(
    { ...result.trace, startedAt: result.trace.startedAt.toISOString(), finishedAt: result.trace.finishedAt.toISOString() },
    null, 2,
  ),
);

if (verbose) console.error(`\ntrace: ${tracePath}`);
console.error(`status: ${result.trace.status}`);
console.error(`duration: ${(result.trace.totalDurationMs / 1000).toFixed(1)}s`);
console.error(`cost: $${result.trace.totalCostUsd.toFixed(4)}`);
console.error(`trace_path: ${tracePath}`);

// Last step's output text to stdout so callers can pipe it
const lastStep = result.trace.steps[result.trace.steps.length - 1];
if (lastStep?.output) {
  const txt = typeof lastStep.output === "string" ? lastStep.output : JSON.stringify(lastStep.output, null, 2);
  process.stdout.write(txt + "\n");
}

if (result.trace.status === "failed") process.exit(1);
