import "./ColourInput.css";

export function ColourInput(
	{ value, onChange }: { value: string; onChange: React.ChangeEventHandler<HTMLInputElement>; },
)
{
	return (
		<div className="colour-input" style={{ backgroundColor: value }} title="Click to choose a colour">
			<input type="color" defaultValue={value} onChange={onChange} />
		</div>
	);
}
