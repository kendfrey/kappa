import { useLayoutEffect, useRef, useState } from "react";
import { type Diagram, get, height, width } from "../data/Diagram";
import type { DragRule } from "../data/Lemma";
import type { Theme } from "../data/Options";
import type { Point } from "../data/Point";
import type { Segment } from "../data/Tile";
import { unreachable } from "../util";

export interface DiagramMouseEvent
{
	x: number;
	y: number;
	segment: Segment;
	columnBorder: number;
	rowBorder: number;
	raw: React.MouseEvent<HTMLCanvasElement>;
}

export interface DiagramViewProps
{
	title?: string;
	diagram: Diagram;
	dragAnchor?: Point;
	dragColumn?: number;
	dragRow?: number;
	dragRules?: DragRule[];
	proposedDragRule?: DragRule;
	cursor?: string;
	scale: number;
	maxWidth?: number;
	theme: Theme;
	onPointerDown?: (e: DiagramMouseEvent) => void;
	onPointerUp?: (e: DiagramMouseEvent) => void;
	onPointerMove?: (e: DiagramMouseEvent) => void;
	onPointerLeave?: () => void;
}

export default function DiagramView(
	{
		title,
		diagram,
		dragAnchor,
		dragColumn,
		dragRow,
		dragRules,
		proposedDragRule,
		cursor,
		scale,
		maxWidth,
		theme,
		onPointerDown,
		onPointerUp,
		onPointerMove,
		onPointerLeave,
	}: DiagramViewProps,
)
{
	const ref = useRef<HTMLCanvasElement>(null);

	useLayoutEffect(() =>
	{
		if (!ref.current)
			return;

		const ctx = ref.current.getContext("2d")!;

		const w = width(diagram);
		const h = height(diagram);
		const cw = ref.current.width = w * scale;
		const ch = ref.current.height = h * scale;
		const lw = scale * 0.125;

		ctx.fillStyle = "transparent";
		ctx.fillRect(0, 0, cw, ch);

		ctx.lineWidth = lw;

		for (let y = 0; y < h; y++)
		{
			for (let x = 0; x < w; x++)
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

		if (dragAnchor !== undefined)
		{
			const tile = get(diagram, dragAnchor);
			if (tile !== undefined && tile.type !== " ")
			{
				ctx.fillStyle = theme.colours[tile.colours[0]];
				const r = scale * 0.1875;
				let cx = (dragAnchor.x + 0.5) * scale;
				let cy = (dragAnchor.y + 0.5) * scale;

				const cr = Math.sqrt(0.125);
				switch (tile.type)
				{
					case "b":
						cx = (dragAnchor.x + 1 - cr) * scale;
						cy = (dragAnchor.y + cr) * scale;
						break;
					case "d":
						cx = (dragAnchor.x + cr) * scale;
						cy = (dragAnchor.y + cr) * scale;
						break;
					case "p":
						cx = (dragAnchor.x + 1 - cr) * scale;
						cy = (dragAnchor.y + 1 - cr) * scale;
						break;
					case "q":
						cx = (dragAnchor.x + cr) * scale;
						cy = (dragAnchor.y + 1 - cr) * scale;
						break;
				}

				ctx.globalCompositeOperation = "destination-out";
				switch (tile.type)
				{
					case "%":
						ctx.beginPath();
						ctx.arc(cx, cy, r + lw * 0.5, Math.PI * 0.25, Math.PI * 0.75);
						ctx.arc(cx, cy, r + lw * 0.5, Math.PI * 1.75, Math.PI * 1.25, true);
						ctx.fill();
						break;
					case "$":
						ctx.beginPath();
						ctx.arc(cx, cy, r + lw * 0.5, Math.PI * -0.25, Math.PI * 0.25);
						ctx.arc(cx, cy, r + lw * 0.5, Math.PI * 1.25, Math.PI * 0.75, true);
						ctx.fill();
						break;
				}
				ctx.globalCompositeOperation = "source-over";

				ctx.beginPath();
				ctx.ellipse(cx, cy, r, r, 0, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		if (dragColumn !== undefined)
		{
			ctx.strokeStyle = theme.colours[0];
			ctx.fillStyle = theme.colours[0];
			ctx.lineWidth = 2;
			ctx.beginPath();
			const cx = Math.max(3, Math.min(cw - 3, dragColumn * scale));
			ctx.moveTo(cx, 0);
			ctx.lineTo(cx, ch);
			ctx.stroke();

			for (let y = 0; y < h * 2; y++)
			{
				const cy = (y + 0.5) * scale * 0.5;

				ctx.beginPath();
				ctx.moveTo(cx - 7, cy);
				ctx.lineTo(cx - 3, cy - 4);
				ctx.lineTo(cx - 3, cy + 4);
				ctx.closePath();
				ctx.fill();

				ctx.beginPath();
				ctx.moveTo(cx + 7, cy);
				ctx.lineTo(cx + 3, cy - 4);
				ctx.lineTo(cx + 3, cy + 4);
				ctx.closePath();
				ctx.fill();
			}
		}

		if (dragRow !== undefined)
		{
			ctx.strokeStyle = theme.colours[0];
			ctx.fillStyle = theme.colours[0];
			ctx.lineWidth = 2;
			ctx.beginPath();
			const cy = Math.max(3, Math.min(ch - 3, dragRow * scale));
			ctx.moveTo(0, cy);
			ctx.lineTo(cw, cy);
			ctx.stroke();

			for (let x = 0; x < w * 2; x++)
			{
				const cx = (x + 0.5) * scale * 0.5;
				ctx.beginPath();
				ctx.moveTo(cx, cy - 7);
				ctx.lineTo(cx - 4, cy - 3);
				ctx.lineTo(cx + 4, cy - 3);
				ctx.closePath();
				ctx.fill();

				ctx.beginPath();
				ctx.moveTo(cx, cy + 7);
				ctx.lineTo(cx - 4, cy + 3);
				ctx.lineTo(cx + 4, cy + 3);
				ctx.closePath();
				ctx.fill();
			}
		}

		if (dragRules !== undefined)
		{
			ctx.lineCap = "round";
			ctx.globalCompositeOperation = "destination-out";
			ctx.lineWidth = 4;
			drawDragRules();
			ctx.globalCompositeOperation = "source-over";
			ctx.lineWidth = 2;
			drawDragRules();
			ctx.lineCap = "butt";

			function drawDragRules()
			{
				if (dragRules === undefined)
					return;

				ctx.strokeStyle = theme.colours[0];
				ctx.fillStyle = ctx.strokeStyle;

				let shouldDelete = false;
				for (const rule of dragRules)
				{
					if (
						rule.from.x === proposedDragRule?.from.x
						&& rule.from.y === proposedDragRule?.from.y
						&& rule.to.x === proposedDragRule?.to.x
						&& rule.to.y === proposedDragRule?.to.y
					)
					{
						shouldDelete = true;
						continue;
					}

					drawDragRule(rule);
				}
				if (proposedDragRule !== undefined)
				{
					ctx.strokeStyle = shouldDelete ? theme.colours[1] : theme.colours[3];
					ctx.fillStyle = ctx.strokeStyle;
					drawDragRule(proposedDragRule);
				}

				function drawDragRule(rule: DragRule)
				{
					if (rule.from.x === rule.to.x && rule.from.y === rule.to.y)
					{
						ctx.beginPath();
						ctx.ellipse((rule.from.x + 0.5) * scale, (rule.from.y + 0.5) * scale, 4, 4, 0, 0, Math.PI * 2);
						ctx.fill();
						ctx.stroke();
					}
					else
					{
						if (rule.altMode)
							ctx.setLineDash([4, 6]);

						const angle = Math.atan2(rule.to.y - rule.from.y, rule.to.x - rule.from.x);
						const startX = (rule.from.x + 0.5) * scale + Math.cos(angle) * 8;
						const startY = (rule.from.y + 0.5) * scale + Math.sin(angle) * 8;
						const tipX = (rule.to.x + 0.5) * scale - Math.cos(angle) * 8;
						const tipY = (rule.to.y + 0.5) * scale - Math.sin(angle) * 8;
						ctx.beginPath();
						ctx.moveTo(startX, startY);
						ctx.lineTo(tipX, tipY);
						ctx.stroke();
						ctx.setLineDash([]);
						ctx.beginPath();
						ctx.moveTo(tipX, tipY);
						ctx.lineTo(tipX - Math.cos(angle - Math.PI / 6) * 4, tipY - Math.sin(angle - Math.PI / 6) * 4);
						ctx.lineTo(tipX - Math.cos(angle + Math.PI / 6) * 4, tipY - Math.sin(angle + Math.PI / 6) * 4);
						ctx.closePath();
						ctx.fill();
						ctx.stroke();
					}
				}
			}
		}
	}, [diagram, dragAnchor, dragColumn, dragRow, dragRules, proposedDragRule, scale, theme]);

	const [suppressContextMenu, setSuppressContextMenu] = useState(true);

	function getEvent(e: React.MouseEvent<HTMLCanvasElement>): DiagramMouseEvent
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
		const columnBorder = dx <= 0.5 ? x : x + 1;
		const rowBorder = dy <= 0.5 ? y : y + 1;

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
			title={title}
			style={{ display: "block", cursor: cursor ?? "revert-layer", maxWidth: maxWidth ?? "revert-layer" }}
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
			onPointerLeave={() =>
			{
				onPointerLeave?.();
			}}
			onContextMenu={e =>
			{
				if (suppressContextMenu)
					e.preventDefault();
			}}
		/>
	);
}
