import "./Editor.css";
import {
	ArrowsOutLineHorizontalIcon,
	ArrowsOutLineVerticalIcon,
	PaintBrushHouseholdIcon,
	PencilIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { addColumn, addRow, Diagram, get, height, paint, removeColumn, removeRow, set, width } from "../data/Diagram";
import type { Options } from "../data/Options";
import { type Segment, Tile, transformSegment, transformTile } from "../data/Tile";
import { invSymm, type Symmetry } from "../data/Transform";
import type { Workspace } from "../data/Workspace";
import { type Updater, useImmerState } from "../hooks";
import ColourSelect from "./ColourSelect";
import DiagramView, { type DiagramMouseEvent } from "./DiagramView";
import ZoomControls from "./ZoomControls";

export default function DiagramEditor(
	{ workspace, updateWorkspace, options, updateOptions, index }: {
		workspace: Workspace;
		updateWorkspace: Updater<Workspace>;
		options: Options;
		updateOptions: Updater<Options>;
		index: number;
	},
)
{
	const [coordinatedState, updateCoordinatedState] = useImmerState<CoordinatedState>(() => ({
		diagram: workspace.diagrams[index],
		drawToolState: undefined,
		rowCol: undefined,
	}));

	// Sync changes from this component's state back to the workspace.
	useEffect(() =>
	{
		updateWorkspace(w =>
		{
			w.diagrams[index] = coordinatedState.diagram;
		});
	}, [coordinatedState.diagram, index, updateWorkspace]);

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

	const cursor = useMemo(() =>
	{
		switch (tool)
		{
			case "column":
				return "col-resize";
			case "row":
				return "row-resize";
			default:
				return undefined;
		}
	}, [tool]);

	const [isDragging, setIsDragging] = useState(false);

	function onPointerDown(e: DiagramMouseEvent)
	{
		setIsDragging(true);

		if (tool === "paint")
		{
			updateCoordinatedState(s =>
			{
				paint(s.diagram, e.x, e.y, e.segment, colour);
			});
		}
	}

	function onPointerUp()
	{
		setIsDragging(false);

		updateCoordinatedState(s =>
		{
			s.drawToolState = undefined;
		});
	}

	function onPointerMove(e: DiagramMouseEvent)
	{
		switch (tool)
		{
			case "draw":
				onDraw(e);
				break;
			case "column":
				onDragRowCol(e.columnBorder);
				break;
			case "row":
				onDragRowCol(e.rowBorder);
				break;
		}
	}

	function onPointerLeave()
	{
		updateCoordinatedState(s =>
		{
			s.drawToolState = undefined;
			s.rowCol = undefined;
		});
	}

	function onDraw(e: DiagramMouseEvent)
	{
		updateCoordinatedState(s =>
		{
			if (e.raw.buttons & 2)
			{
				if (get(s.diagram, e) !== undefined)
					set(s.diagram, e, Tile(" "));
			}
			else if (e.raw.buttons & 1)
			{
				while (s.drawToolState !== undefined && (s.drawToolState.x !== e.x || s.drawToolState.y !== e.y))
				{
					if (s.drawToolState.x < e.x)
					{
						doDraw(s, "e");
						startDraw(s, s.drawToolState.x + 1, s.drawToolState.y, "w");
					}
					else if (s.drawToolState.x > e.x)
					{
						doDraw(s, "w");
						startDraw(s, s.drawToolState.x - 1, s.drawToolState.y, "e");
					}
					else if (s.drawToolState.y < e.y)
					{
						doDraw(s, "s");
						startDraw(s, s.drawToolState.x, s.drawToolState.y + 1, "n");
					}
					else if (s.drawToolState.y > e.y)
					{
						doDraw(s, "n");
						startDraw(s, s.drawToolState.x, s.drawToolState.y - 1, "s");
					}
				}

				if (s.drawToolState === undefined)
					startDraw(s, e.x, e.y, e.segment);
				else
					doDraw(s, e.segment);
			}
			else
			{
				s.drawToolState = undefined;
			}
		});
	}

	function startDraw(s: CoordinatedState, x: number, y: number, source: Segment)
	{
		const originalTile = get(s.diagram, { x, y });
		if (originalTile === undefined)
		{
			s.drawToolState = undefined;
			return;
		}

		let putSourceNorth: Symmetry;
		switch (source)
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
			case "c":
				s.drawToolState = undefined;
				return;
		}
		s.drawToolState = {
			x,
			y,
			putSourceNorth,
			originalTile: transformTile(originalTile, putSourceNorth),
		};
	}

	function doDraw(s: CoordinatedState, dest: Segment)
	{
		if (s.drawToolState === undefined)
			return;

		let newTile: Tile;
		const transformedSegment = transformSegment(dest, s.drawToolState.putSourceNorth);
		switch (transformedSegment)
		{
			case "c":
			case "n":
				return;
			case "e":
				newTile = Tile("b", colour);
				break;
			case "w":
				newTile = Tile("d", colour);
				break;
			case "s":
				switch (s.drawToolState.originalTile.type)
				{
					case " ":
					case "|":
					case "b":
					case "d":
					case "p":
					case "q":
						newTile = Tile("|", colour);
						break;
					case "-":
					case "%":
						newTile = Tile(
							"$",
							colour,
							s.drawToolState.originalTile.colours[0],
							s.drawToolState.originalTile.colours[0],
						);
						break;
					case "$":
						newTile = Tile(
							"$",
							colour,
							s.drawToolState.originalTile.colours[1],
							s.drawToolState.originalTile.colours[2],
						);
						break;
				}
				break;
		}

		const transformedTile = transformTile(newTile, invSymm(s.drawToolState.putSourceNorth));
		set(s.diagram, s.drawToolState, transformedTile);
	}

	function onDragRowCol(to: number)
	{
		updateCoordinatedState(s =>
		{
			if (!isDragging || s.rowCol === undefined)
				s.rowCol = to;
			else if (s.rowCol !== to)
			{
				if (s.rowCol === undefined)
					return;

				const [size, remove, add] = tool === "column"
					? [width, removeColumn, addColumn]
					: [height, removeRow, addRow];

				while (s.rowCol > to && s.rowCol > 0 && size(s.diagram) > 1)
				{
					s.rowCol--;
					remove(s.diagram, s.rowCol);
				}
				while (s.rowCol < to)
				{
					add(s.diagram, s.rowCol);
					s.rowCol++;
				}
			}
		});
	}

	return (
		<div className="flex column main" tabIndex={0}>
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
				<ColourSelect colour={colour} setColour={setColour} theme={options.theme} />
				{ZoomControls(updateOptions)}
			</div>
			<div className="editor">
				<DiagramView
					diagram={coordinatedState.diagram}
					dragColumn={tool === "column" ? coordinatedState.rowCol : undefined}
					dragRow={tool === "row" ? coordinatedState.rowCol : undefined}
					cursor={cursor}
					scale={options.scale}
					theme={options.theme}
					onPointerDown={onPointerDown}
					onPointerUp={onPointerUp}
					onPointerMove={onPointerMove}
					onPointerLeave={onPointerLeave}
				/>
			</div>
		</div>
	);
}

type CoordinatedState = {
	diagram: Diagram;
	drawToolState: {
		x: number;
		y: number;
		putSourceNorth: Symmetry;
		originalTile: Tile;
	} | undefined;
	rowCol: number | undefined;
};
