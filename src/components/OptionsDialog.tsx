import { useDebounceCallback } from "usehooks-ts";
import { defaultDarkTheme, defaultLightTheme, type Options } from "../data/Options";
import type { Updater } from "../hooks";
import { ColourInput } from "./ColourInput";

export default function OptionsDialog(
	{ options, updateOptions }: { options: Options; updateOptions: Updater<Options>; },
)
{
	const updateOptionsDebounced = useDebounceCallback(updateOptions, 0); // Even a delay of 0 fixes UI lag

	return (
		<>
			<label title="Select a UI theme">
				<span>Theme</span>
				<select
					value={options.theme.type}
					onChange={e =>
					{
						updateOptions(o =>
						{
							switch (e.target.value)
							{
								case "light":
									o.theme = defaultLightTheme;
									break;
								case "dark":
									o.theme = defaultDarkTheme;
									break;
								case "custom":
									o.theme.type = "custom";
									break;
							}
						});
					}}
				>
					<option value="light">Light</option>
					<option value="dark">Dark</option>
					<option value="custom">Custom</option>
				</select>
			</label>
			{options.theme.type === "custom" && (
				<div className="flex">
					<ColourInput
						value={options.theme.background}
						onChange={e =>
						{
							updateOptionsDebounced(o =>
							{
								o.theme.background = e.target.value;
							});
						}}
					/>
					{options.theme.colours.map((c, i) => (
						<ColourInput
							key={i}
							value={c}
							onChange={e =>
							{
								updateOptionsDebounced(o =>
								{
									o.theme.colours[i] = e.target.value;
								});
							}}
						/>
					))}
				</div>
			)}
		</>
	);
}
