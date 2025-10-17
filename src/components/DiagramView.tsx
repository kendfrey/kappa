import { useEffect, useRef, useState } from "react";
import { type Diagram, get, height, width } from "../data/Diagram";
import type { Theme } from "../data/Options";
import type { Segment } from "../data/Tile";
import { unreachable } from "../util";

export interface DiagramPointerEvent
{
	x: number;
	y: number;
	segment: Segment;
	columnBorder: number;
	rowBorder: number;
	raw: React.PointerEvent<HTMLCanvasElement>;
}

export interface DiagramViewProps
{
	diagram: Diagram;
	scale: number;
	theme: Theme;
	onPointerDown?: (e: DiagramPointerEvent) => void;
	onPointerUp?: (e: DiagramPointerEvent) => void;
	onPointerMove?: (e: DiagramPointerEvent) => void;
}

export default function DiagramView(
	{ diagram, scale, theme, onPointerDown, onPointerUp, onPointerMove }: DiagramViewProps,
)
{
	const ref = useRef<HTMLCanvasElement>(null);

	useEffect(() =>
	{
		if (!ref.current)
			return;

		const ctx = ref.current.getContext("2d")!;

		const w = ref.current.width = width(diagram) * scale;
		const h = ref.current.height = height(diagram) * scale;
		const lw = scale * 0.125;

		ctx.fillStyle = "transparent";
		ctx.fillRect(0, 0, w, h);

		ctx.lineWidth = lw;

		for (let y = 0; y < height(diagram); y++)
		{
			for (let x = 0; x < width(diagram); x++)
			{
				const tile = get(diagram, { x, y })!;
				switch (tile.type)
				{
					case " ":
						break;
					case "-":
						ctx.strokeStyle = theme.colours[tile.colours[0]];
						ctx.beginPath();
						ctx.moveTo(x * scale, y * scale + scale * 0.5);
						ctx.lineTo((x + 1) * scale, y * scale + scale * 0.5);
						ctx.stroke();
						break;
					case "|":
						ctx.strokeStyle = theme.colours[tile.colours[0]];
						ctx.beginPath();
						ctx.moveTo(x * scale + scale * 0.5, y * scale);
						ctx.lineTo(x * scale + scale * 0.5, (y + 1) * scale);
						ctx.stroke();
						break;
					case "b":
						ctx.strokeStyle = theme.colours[tile.colours[0]];
						ctx.beginPath();
						ctx.arc((x + 1) * scale, y * scale, scale * 0.5, Math.PI * 0.5, Math.PI);
						ctx.stroke();
						break;
					case "d":
						ctx.strokeStyle = theme.colours[tile.colours[0]];
						ctx.beginPath();
						ctx.arc(x * scale, y * scale, scale * 0.5, 0, Math.PI * 0.5);
						ctx.stroke();
						break;
					case "p":
						ctx.strokeStyle = theme.colours[tile.colours[0]];
						ctx.beginPath();
						ctx.arc((x + 1) * scale, (y + 1) * scale, scale * 0.5, Math.PI, Math.PI * 1.5);
						ctx.stroke();
						break;
					case "q":
						ctx.strokeStyle = theme.colours[tile.colours[0]];
						ctx.beginPath();
						ctx.arc(x * scale, (y + 1) * scale, scale * 0.5, Math.PI * 1.5, Math.PI * 2);
						ctx.stroke();
						break;
					case "%":
						ctx.strokeStyle = theme.colours[tile.colours[0]];
						ctx.beginPath();
						ctx.moveTo(x * scale, y * scale + scale * 0.5);
						ctx.lineTo((x + 1) * scale, y * scale + scale * 0.5);
						ctx.stroke();

						ctx.strokeStyle = theme.colours[tile.colours[1]];
						ctx.beginPath();
						ctx.moveTo(x * scale + scale * 0.5, y * scale);
						ctx.lineTo(x * scale + scale * 0.5, (y + 0.5) * scale - lw);
						ctx.stroke();

						ctx.strokeStyle = theme.colours[tile.colours[2]];
						ctx.beginPath();
						ctx.moveTo(x * scale + scale * 0.5, (y + 1) * scale);
						ctx.lineTo(x * scale + scale * 0.5, (y + 0.5) * scale + lw);
						ctx.stroke();
						break;
					case "$":
						ctx.strokeStyle = theme.colours[tile.colours[0]];
						ctx.beginPath();
						ctx.moveTo(x * scale + scale * 0.5, y * scale);
						ctx.lineTo(x * scale + scale * 0.5, (y + 1) * scale);
						ctx.stroke();

						ctx.strokeStyle = theme.colours[tile.colours[1]];
						ctx.beginPath();
						ctx.moveTo(x * scale, y * scale + scale * 0.5);
						ctx.lineTo((x + 0.5) * scale - lw, y * scale + scale * 0.5);
						ctx.stroke();

						ctx.strokeStyle = theme.colours[tile.colours[2]];
						ctx.beginPath();
						ctx.moveTo((x + 1) * scale, y * scale + scale * 0.5);
						ctx.lineTo((x + 0.5) * scale + lw, y * scale + scale * 0.5);
						ctx.stroke();
						break;
					default:
						unreachable(tile.type);
				}
			}
		}
	}, [diagram, scale, theme]);

	const [suppressContextMenu, setSuppressContextMenu] = useState(true);

	function getEvent(e: React.PointerEvent<HTMLCanvasElement>): DiagramPointerEvent
	{
		const { left, top } = ref.current!.getBoundingClientRect();
		const sx = (e.clientX - left) / scale;
		const sy = (e.clientY - top) / scale;
		const x = Math.floor(sx);
		const y = Math.floor(sy);
		const dx = sx - x;
		const dy = sy - y;
		let segment: "n" | "e" | "s" | "w" | "c";
		if (dx < 0.375)
		{
			if (dy < dx)
				segment = "n";
			else if (1 - dy < dx)
				segment = "s";
			else
				segment = "w";
		}
		else if (dx > 0.625)
		{
			if (dy < 1 - dx)
				segment = "n";
			else if (1 - dy < 1 - dx)
				segment = "s";
			else
				segment = "e";
		}
		else
		{
			if (dy < 0.375)
				segment = "n";
			else if (dy > 0.625)
				segment = "s";
			else
				segment = "c";
		}
		const columnBorder = dx < 0.5 ? x : x + 1;
		const rowBorder = dy < 0.5 ? y : y + 1;

		return {
			x,
			y,
			segment,
			columnBorder,
			rowBorder,
			raw: e,
		};
	}

	return (
		<canvas
			style={{ display: "block" }}
			ref={ref}
			onPointerDown={e =>
			{
				e.currentTarget.setPointerCapture(e.pointerId);
				setSuppressContextMenu(false);
				onPointerDown?.(getEvent(e));
			}}
			onPointerUp={e =>
			{
				onPointerUp?.(getEvent(e));
			}}
			onPointerMove={e =>
			{
				setSuppressContextMenu(true);
				onPointerMove?.(getEvent(e));
			}}
			onContextMenu={e =>
			{
				if (suppressContextMenu)
					e.preventDefault();
			}}
		/>
	);
}
