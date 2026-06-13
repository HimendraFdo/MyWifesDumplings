import { defineType, defineField } from "sanity";

export const extra = defineType({
  name: "extra",
  title: "Extra / Add-on",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "price",
      title: "Price (NZD)",
      type: "number",
      validation: (Rule) => Rule.required(),
    }),
  ],
});
