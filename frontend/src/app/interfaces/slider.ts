export interface Slider {
  id: string,
  title: string,
  is_published: boolean,
  view_on_routs: string[],
  slides: Slide[],
  images?: string[],
  links?: string[],
  descriptions?: string[];
  keyword?: string;
}

export interface Slide {
  // image?: string,
  link?: string,
  desc?: string;
  image_id?: string;
  title?: string;
  image: {
    id: string,
    original: string
  },
  custom_data?: {
    alt?: string;
    title?: string;
    desc?: string;
  }
}