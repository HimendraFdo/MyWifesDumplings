import { defineType, defineField } from "sanity";

export const pricingTier = defineType({
  name: "pricingTier",
  title: "Pricing Tier",
  type: "document",
  fields: [
    defineField({
      name: "quantity",
      title: "Quantity (pcs)",
      type: "number",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "price",
      title: "Price (NZD)",
      type: "number",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "includes",
      title: "Includes (extras bundled in)",
      type: "array",
      of: [{ type: "string" }],
      description: "e.g. '2 dumpling soups', 'wife's secret sauce'",
    }),
    defineField({
      name: "featured",
      title: "Featured tier",
      type: "boolean",
      initialValue: false,
    }),
  ],
});
