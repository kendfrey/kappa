import { MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from "@phosphor-icons/react";
import type { Options } from "../data/Options";
import type { Updater } from "../hooks";

export default function ZoomControls(updateOptions: Updater<Options>)
{
	return (
		<>
			<button
				title="Zoom out"
				onClick={() =>
					updateOptions(o =>
					{
						o.scale = Math.max(16, o.scale >> 1);
					})}
			>
				<MagnifyingGlassMinusIcon />
			</button>
			<button
				title="Zoom in"
				onClick={() =>
					updateOptions(o =>
					{
						o.scale = Math.min(256, o.scale << 1);
					})}
			>
				<MagnifyingGlassPlusIcon />
			</button>
		</>
	);
}
