import { CheckCircleIcon, CircleIcon } from "@phosphor-icons/react";
import { useRef } from "react";
import { useHover } from "usehooks-ts";

export default function Checkbox(
	{ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void; },
)
{
	const ref = useRef<HTMLLabelElement>(null);
	const hover = useHover(ref as React.RefObject<HTMLLabelElement>); // https://github.com/juliencrn/usehooks-ts/issues/663
	const weight = hover ? "fill" : undefined;

	return (
		<label
			ref={ref}
			className="flex"
			style={{ height: "fit-content", cursor: "pointer" }}
			onClick={e => e.stopPropagation()}
		>
			<input
				type="checkbox"
				checked={checked}
				onChange={e => onChange(e.target.checked)}
				style={{ width: 0, height: 0, margin: 0, marginRight: "calc(-1 * var(--gap))" }}
			/>
			{checked ? <CheckCircleIcon weight={weight} /> : <CircleIcon weight={weight} />}
			{label}
		</label>
	);
}
