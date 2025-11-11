import type { Theme } from "../data/Options";
import "./ColourSelect.css";

export default function ColourSelect(
	{ colour, setColour, theme }: { colour: number; setColour: (c: number) => void; theme: Theme; },
)
{
	return (
		<select
			className="colour-select"
			value={colour}
			onChange={e => setColour(parseInt(e.target.value))}
			style={{ backgroundColor: theme.colours[colour] }}
		>
			{theme.colours.map((c, i) => <option key={i} value={i} style={{ backgroundColor: c }} />)}
		</select>
	);
}
