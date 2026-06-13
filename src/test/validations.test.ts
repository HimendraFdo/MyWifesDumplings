import { describe, it, expect } from "vitest";
import { contactSchema } from "@/lib/validations";

describe("contactSchema", () => {
  it("accepts valid data", () => {
    const result = contactSchema.safeParse({
      name: "Jane Smith",
      email: "jane@example.com",
      quantity: "20",
      flavours: ["pork_chives"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    const result = contactSchema.safeParse({
      name: "Jane",
      quantity: "20",
      flavours: ["pork_cabbage"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty flavours", () => {
    const result = contactSchema.safeParse({
      name: "Jane",
      email: "jane@example.com",
      quantity: "60",
      flavours: [],
    });
    expect(result.success).toBe(false);
  });
});
