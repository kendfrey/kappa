export type Theme = {
	type: "light" | "dark" | "custom";
	background: string;
	colours: string[];
};

export const defaultLightTheme: Theme = {
	type: "light",
	background: "#ffffff",
	colours: ["#000000", "#e54051", "#347ffb", "#30a000", "#d7a446", "#d093df", "#15c5cc", "#7f7f7f"],
};

export const defaultDarkTheme: Theme = {
	type: "dark",
	background: "#1f1f1f",
	colours: ["#dfdfdf", "#e54051", "#347ffb", "#30a000", "#d7a446", "#d093df", "#15c5cc", "#7f7f7f"],
};

export type Options = {
	theme: Theme;
	selectedDiagramEditorTool: "draw" | "paint" | "column" | "row";
	selectedProofEditorTool: "column" | "row";
	selectedColour: number;
};

export const defaultOptions: Options = {
	theme: defaultLightTheme,
	selectedDiagramEditorTool: "draw",
	selectedProofEditorTool: "column",
	selectedColour: 0,
};
