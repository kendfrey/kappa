import { EraserIcon } from "@phosphor-icons/react";

export default function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void; })
{
	return (
		<div
			className="flex column"
			style={{ height: "100vh", alignItems: "center", justifyContent: "center" }}
		>
			<span style={{ color: "red" }}>{error.toString()}</span>
			localStorage may be corrupted. You can try deleting your data:
			<button
				className="text-button"
				onClick={() =>
				{
					localStorage.removeItem("kappa-context");
					resetErrorBoundary();
				}}
			>
				<EraserIcon />
				Reset workspace to default
			</button>
			<button
				className="text-button"
				onClick={() =>
				{
					localStorage.removeItem("kappa-options");
					resetErrorBoundary();
				}}
			>
				<EraserIcon />
				Reset options to default
			</button>
		</div>
	);
}
