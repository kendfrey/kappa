import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import App from "./components/App.tsx";
import ErrorFallback from "./components/ErrorFallback.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<ErrorBoundary FallbackComponent={ErrorFallback}>
			<App />
		</ErrorBoundary>
	</StrictMode>,
);
