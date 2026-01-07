import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const tempDirs: string[] = [];

function runValidator(plan: unknown) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "clix-api-trigger-plan-"));
  tempDirs.push(tmpDir);
  const planPath = path.join(tmpDir, "api-trigger-plan.json");
  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2) + "\n", "utf8");

  const scriptPath = path.resolve(
    __dirname,
    "..",
    "skills",
    "api-triggered-campaigns",
    "scripts",
    "validate-api-trigger-plan.sh"
  );

  const result = spawnSync("bash", [scriptPath, planPath], { encoding: "utf8" });
  return { result, planPath, scriptPath };
}

describe("validate-api-trigger-plan.sh", () => {
  afterEach(() => {
    for (const tmpDir of tempDirs) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup errors
      }
    }
    tempDirs.length = 0;
  });

  it("passes a minimal valid api-trigger plan", () => {
    const { result } = runValidator({
      campaign_id: "019aa002-1d0e-7407-a0c5-5bfa8dd2be30",
      audience: { mode: "broadcast" },
      dynamic_filter_keys: ["store_location"],
      properties: {
        store_location: { type: "string", required: true, example: "San Francisco" },
        order_id: { type: "string", required: true, example: "ORD-12345" },
        item_count: { type: "number", required: true, example: 3 },
        pickup_time: { type: "string", required: false, example: "2:30 PM" },
      },
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("✅ api-trigger-plan validation passed");
  });

  it("fails if campaign_id is missing", () => {
    const { result } = runValidator({
      audience: { mode: "broadcast" },
      dynamic_filter_keys: ["store_location"],
      properties: { store_location: { type: "string", required: true } },
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("campaign_id must be a non-empty string");
  });

  it("fails if dynamic_filter_keys has more than 3 entries", () => {
    const { result } = runValidator({
      campaign_id: "019aa002-1d0e-7407-a0c5-5bfa8dd2be30",
      dynamic_filter_keys: ["a", "b", "c", "d"],
      properties: { store_location: { type: "string", required: true } },
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("dynamic_filter_keys must contain at most 3 entries");
  });

  it("fails if property key is not snake_case", () => {
    const { result } = runValidator({
      campaign_id: "019aa002-1d0e-7407-a0c5-5bfa8dd2be30",
      properties: { storeLocation: { type: "string", required: true } },
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("must be snake_case");
  });

  it("fails if property type is invalid", () => {
    const { result } = runValidator({
      campaign_id: "019aa002-1d0e-7407-a0c5-5bfa8dd2be30",
      properties: { store_location: { type: "str", required: true } },
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("must be one of: string, number, boolean, datetime");
  });

  it("fails if number example is boolean", () => {
    const { result } = runValidator({
      campaign_id: "019aa002-1d0e-7407-a0c5-5bfa8dd2be30",
      properties: { item_count: { type: "number", required: true, example: true } },
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("properties['item_count'].example must be a number");
  });

  it("fails when audience.mode is targets but targets is missing", () => {
    const { result } = runValidator({
      campaign_id: "019aa002-1d0e-7407-a0c5-5bfa8dd2be30",
      audience: { mode: "targets" },
      properties: { order_id: { type: "string", required: true } },
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("audience.targets must be a non-empty array");
  });

  it("fails when a target specifies both project_user_id and device_id", () => {
    const { result } = runValidator({
      campaign_id: "019aa002-1d0e-7407-a0c5-5bfa8dd2be30",
      audience: {
        mode: "targets",
        targets: [{ project_user_id: "user_1", device_id: "device_1" }],
      },
      properties: { order_id: { type: "string", required: true } },
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("must specify exactly one of project_user_id or device_id");
  });
});
