export interface Content {
  desc: string,
  is_document: boolean,
  comments: Array<string>,
  created_at: string,
  first_body: string,
  group: "BLOG" | "PAGE" | "NEWS",
  id: string,
  images: Array<string>,
  published: boolean,
  is_published: boolean,
  is_main: boolean,
  slug: string,
  store: string,
  tags: Array<string>,
  name: string
}
