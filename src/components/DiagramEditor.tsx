import "./Editor.css";
import {
	ArrowsOutLineHorizontalIcon,
	ArrowsOutLineVerticalIcon,
	PaintBrushHouseholdIcon,
	PencilIcon,
} from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import type { Context } from "../data/Context";
import { get, set } from "../data/Diagram";
import type { Options } from "../data/Options";
import { type Tile, transformSegment, transformTile } from "../data/Tile";
import { invSymm, type Symmetry } from "../data/Transform";
import { type Updater, useProjection } from "../immerHooks";
import DiagramView, { type DiagramPointerEvent } from "./DiagramView";

export default function DiagramEditor(
	{ context, updateContext, options, updateOptions, index }: {
		context: Context;
		updateContext: Updater<Context>;
		options: Options;
		updateOptions: Updater<Options>;
		index: number;
	},
)
{
	const [diagram, updateDiagram] = useProjection(
		context,
		updateContext,
		useCallback(c => c.diagrams[index], [index]),
	);

	const tool = options.selectedDiagramEditorTool;
	function setTool(t: Options["selectedDiagramEditorTool"])
	{
		updateOptions(o =>
		{
			o.selectedDiagramEditorTool = t;
		});
	}

	const colour = options.selectedColour;
	function setColour(c: number)
	{
		updateOptions(o =>
		{
			o.selectedColour = c;
		});
	}

	const [drawToolState, setDrawToolState] = useState<
		| {
			x: number;
			y: number;
			putSourceNorth: Symmetry;
			originalTile: Tile;
		}
		| undefined
	>();

	function onPointerMove(e: DiagramPointerEvent)
	{
		if (tool === "draw")
			onDraw(e);
	}

	function onDraw(e: DiagramPointerEvent)
	{
		if (e.raw.buttons & 2)
		{
			if (get(diagram, e) !== undefined)
			{
				updateDiagram(d =>
				{
					set(d, e, { type: " ", colours: [] });
				});
			}
		}
		else if (e.raw.buttons & 1)
		{
			if ((drawToolState?.x !== e.x || drawToolState?.y !== e.y) && e.segment !== "c")
			{
				const originalTile = get(diagram, e);
				if (originalTile === undefined)
				{
					setDrawToolState(undefined);
					return;
				}
				let putSourceNorth: Symmetry;
				switch (e.segment)
				{
					case "n":
						putSourceNorth = "0";
						break;
					case "e":
						putSourceNorth = "3";
						break;
					case "s":
						putSourceNorth = "2";
						break;
					case "w":
						putSourceNorth = "1";
						break;
				}
				setDrawToolState({
					x: e.x,
					y: e.y,
					putSourceNorth,
					originalTile: transformTile(originalTile, putSourceNorth),
				});
			}
			else if (drawToolState !== undefined)
			{
				let newTile: Tile;
				const transformedSegment = transformSegment(e.segment, drawToolState.putSourceNorth);
				switch (transformedSegment)
				{
					case "c":
					case "n":
						return;
					case "e":
						newTile = { type: "b", colours: [colour] };
						break;
					case "w":
						newTile = { type: "d", colours: [colour] };
						break;
					case "s":
						switch (drawToolState.originalTile.type)
						{
							case " ":
							case "|":
							case "b":
							case "d":
							case "p":
							case "q":
								newTile = { type: "|", colours: [colour] };
								break;
							case "-":
							case "%":
								newTile = {
									type: "$",
									colours: [
										colour,
										drawToolState.originalTile.colours[0],
										drawToolState.originalTile.colours[0],
									],
								};
								break;
							case "$":
								newTile = {
									type: "$",
									colours: [
										colour,
										drawToolState.originalTile.colours[1],
										drawToolState.originalTile.colours[2],
									],
								};
								break;
						}
						break;
				}

				const transformedTile = transformTile(newTile, invSymm(drawToolState.putSourceNorth));
				updateDiagram(d =>
				{
					set(d, drawToolState, transformedTile);
				});
			}
		}
		else
		{
			setDrawToolState(undefined);
		}
	}

	return (
		<>
			<div className="flex toolbar">
				<button onClick={() => setTool("draw")} data-selected={tool === "draw"}>
					<PencilIcon />
				</button>
				<button onClick={() => setTool("paint")} data-selected={tool === "paint"}>
					<PaintBrushHouseholdIcon />
				</button>
				<button onClick={() => setTool("column")} data-selected={tool === "column"}>
					<ArrowsOutLineHorizontalIcon />
				</button>
				<button onClick={() => setTool("row")} data-selected={tool === "row"}>
					<ArrowsOutLineVerticalIcon />
				</button>
				<select
					className="colour-select"
					value={colour}
					onChange={e => setColour(parseInt(e.target.value))}
					style={{ backgroundColor: options.theme.colours[colour] }}
				>
					{options.theme.colours.map((c, i) => <option key={i} value={i} style={{ backgroundColor: c }} />)}
				</select>
			</div>
			<div className="editor">
				<DiagramView diagram={diagram} scale={64} theme={options.theme} onPointerMove={onPointerMove} />
			</div>
		</>
	);
}
