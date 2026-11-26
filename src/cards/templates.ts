/**
 * PNG card templates. Each one is a front and a back picture in client/public/cards/<id>/.
 * To add a design: put front.png and back.png in a new folder there, then add one row below.
 * See README.md in this folder.
 */
export type TemplateGroup = "professional" | "anime";

export interface PngTemplate {
  /** Also travels inside the gift link, so never rename an id once gifts exist. */
  id: string;
  label: string;
  group: TemplateGroup;
  front: string;
  back: string;
}

const png = (id: string, label: string, group: TemplateGroup): PngTemplate => ({
  id,
  label,
  group,
  front: `/cards/${id}/front.png`,
  back: `/cards/${id}/back.png`,
});

export const PNG_TEMPLATES: PngTemplate[] = [
  // Professional
  png("obsidian", "Obsidian", "professional"),
  png("platinum", "Platinum", "professional"),
  png("ember", "Ember", "professional"),

  // Anime
  png("naruto-uzumaki", "Naruto", "anime"),
  png("naruto-team7", "Team 7", "anime"),
  png("naruto-uchiha", "Sasuke and Itachi", "anime"),
  png("naruto-itachi", "Itachi", "anime"),
  png("naruto-next-generation", "Boruto and Sarada", "anime"),
  png("naruto-kurama", "Kurama", "anime"),
];
