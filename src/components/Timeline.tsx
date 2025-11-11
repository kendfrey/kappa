import { QuestionMarkIcon } from "@phosphor-icons/react";

const scale = 32;

export default function Timeline({ length, current, direction, onSetCurrent }: {
	length: number;
	current?: number;
	direction?: "ltr" | "rtl";
	onSetCurrent?: (index: number) => void;
})
{
	function onPointerDown(e: React.PointerEvent<HTMLDivElement>)
	{
		if (length < 1)
			return;

		e.currentTarget.setPointerCapture(e.pointerId);
		onPointerMove(e);
	}

	function onPointerMove(e: React.PointerEvent<HTMLDivElement>)
	{
		if (length < 1)
			return;

		if (e.currentTarget.hasPointerCapture(e.pointerId))
		{
			const rect = e.currentTarget.getBoundingClientRect();
			const x = e.clientX - rect.left - (scale * 0.5);
			const w = rect.width - scale;
			const fraction = direction === "rtl" ? 1 - x / w : x / w;
			onSetCurrent?.(Math.max(0, Math.min(length - 1, Math.round(fraction * (length - 1)))));
		}
	}

	return (
		<div
			style={{
				display: "grid",
				flex: 1,
				gridTemplateColumns: `${scale * 0.5}px
					${length > 1 ? `repeat(${length - 1}, 0 1fr)` : ""} 0
					${scale * 0.5}px`,
				placeItems: "center",
				justifyContent: "end",
				direction: direction ?? "ltr",
			}}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
		>
			{length > 1 && (
				<div
					style={{
						height: scale * 0.25,
						gridColumnStart: 2,
						gridColumnEnd: -2,
						gridRow: 1,
						backgroundColor: "var(--fg)",
						justifySelf: "stretch",
					}}
				>
				</div>
			)}
			{Array.from({ length }).map((_, i) =>
			{
				const size = i === current ? scale : scale * 0.5;
				return (
					<div
						key={i}
						style={{
							gridColumn: i * 2 + 2,
							gridRow: 1,
							width: size,
							height: size,
							borderRadius: "50%",
							backgroundColor: "var(--fg)",
						}}
					/>
				);
			})}
			{length < 1 && <QuestionMarkIcon />}
		</div>
	);
}
