import { describe, expect, it } from "vite-plus/test";
import { customerFormSchema } from "./form-schemas";

const baseCustomer = {
  name: "Acme Buyer",
  avatar: [],
  status: "active",
  notes: "",
};

describe("customerFormSchema", () => {
  it("accepts blank optional contact fields", () => {
    const result = customerFormSchema.safeParse({
      ...baseCustomer,
      email: "   ",
      phone: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid email addresses", () => {
    const result = customerFormSchema.safeParse({
      ...baseCustomer,
      email: "not-an-email",
      phone: "",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected email validation to fail");
    }
    expect(result.error.issues[0]?.path).toEqual(["email"]);
    expect(result.error.issues[0]?.message).toBe("Invalid email address");
  });

  it("rejects invalid phone numbers", () => {
    const result = customerFormSchema.safeParse({
      ...baseCustomer,
      email: "buyer@example.com",
      phone: "12abc",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected phone validation to fail");
    }
    expect(result.error.issues[0]?.path).toEqual(["phone"]);
    expect(result.error.issues[0]?.message).toBe("Invalid phone number");
  });

  it("accepts formatted international phone numbers", () => {
    const result = customerFormSchema.safeParse({
      ...baseCustomer,
      email: "buyer@example.com",
      phone: "+1 (555) 123-4567 ext 89",
    });

    expect(result.success).toBe(true);
  });
});
