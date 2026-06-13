import { defineType, defineField } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "heroHeading",
      title: "Hero heading",
      type: "string",
      initialValue: "My Wife's Dumplings",
    }),
    defineField({
      name: "heroSubheading",
      title: "Hero subheading",
      type: "string",
    }),
    defineField({
      name: "aboutText",
      title: "About / Story text",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "orderFormUrl",
      title: "Google Form order URL",
      type: "url",
    }),
    defineField({
      name: "instagramUrl",
      title: "Instagram URL",
      type: "url",
    }),
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "image",
      options: { hotspot: true },
    }),
  ],
});
