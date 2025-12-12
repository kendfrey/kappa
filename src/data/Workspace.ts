import { Diagram, getSignature, isContinuous } from "./Diagram";
import { calculateAxioms, type Lemma } from "./Lemma";
import type { Proof } from "./Proof";
import { applyStep, isValid } from "./ProofStep";

export type Workspace = {
	lemmas: Lemma[];
	proofs: Proof[];
	diagrams: Diagram[];
	ignoredAxioms: Record<string, true>;
	collapsedLemmas: Record<string, true>;
};

export function validate(workspace: Workspace): string
{
	const validatedLemmas = [];

	for (const lemma of workspace.lemmas)
	{
		if (!isContinuous(lemma.lhs))
			return `The left-hand side of "${lemma.name}" is not continuous.`;
		if (!isContinuous(lemma.rhs))
			return `The right-hand side of "${lemma.name}" is not continuous.`;
		if (getSignature(lemma.lhs) !== getSignature(lemma.rhs))
			return `The left-hand side and right-hand side of "${lemma.name}" do not have the same perimeter.`;

		if (lemma.steps !== null)
		{
			const diagram = JSON.parse(JSON.stringify(lemma.lhs)) as Diagram;
			for (let i = 0; i < lemma.steps.length; i++)
			{
				const step = lemma.steps[i];
				const error = isValid(diagram, step, validatedLemmas);
				if (error !== undefined)
					return `Step at index ${i} in the proof of "${lemma.name}" is invalid: ${error}`;

				applyStep(diagram, step, validatedLemmas);
				if (!isContinuous(diagram))
					return `After step at index ${i} in the proof of "${lemma.name}", the diagram is not continuous.`;
			}
			if (JSON.stringify(diagram) !== JSON.stringify(lemma.rhs))
			{
				return `Applying the proof to the left-hand side of "${lemma.name}" `
					+ `does not result in the right-hand side.`;
			}

			const axioms = calculateAxioms(lemma.steps, validatedLemmas);
			for (const axiomId of Object.keys(axioms).concat(Object.keys(lemma.axioms)))
			{
				const actual = axioms[axiomId] ?? 0;
				const claimed = lemma.axioms[axiomId] ?? 0;
				if (actual !== claimed)
				{
					const axiomName = validatedLemmas.find(l => l.id === axiomId)?.name ?? axiomId;
					return `"${lemma.name}" uses axiom "${axiomName}" ${actual} `
						+ `times in its proof, but claims to use it ${claimed} times.`;
				}
			}
		}

		validatedLemmas.push(lemma);
	}

	for (let i = 0; i < workspace.proofs.length; i++)
	{
		const proof = workspace.proofs[i];
		if (proof.lhs !== null && !isContinuous(proof.lhs[0]))
			return `The left-hand side of the proof at index ${i} is not continuous.`;
		if (proof.rhs !== null && !isContinuous(proof.rhs[0]))
			return `The right-hand side of the proof at index ${i} is not continuous.`;
		if (proof.lhs !== null && proof.rhs !== null && getSignature(proof.lhs[0]) !== getSignature(proof.rhs[0]))
			return `The left-hand side and right-hand side of the proof at index ${i} do not have the same perimeter.`;

		for (const side of ["lhs", "rhs"] as const)
		{
			if (proof[side] === null)
				continue;

			const steps = proof[side][1];
			const diagram = JSON.parse(JSON.stringify(proof[side][0])) as Diagram;
			for (let j = 0; j < steps.length; j++)
			{
				const step = steps[j];
				const error = isValid(diagram, step, validatedLemmas);
				if (error !== undefined)
				{
					return `Step at index ${j} on the ${side === "lhs" ? "left" : "right"}-hand side `
						+ `of the proof at index ${i} is invalid: ${error}`;
				}

				applyStep(diagram, step, validatedLemmas);
				if (!isContinuous(diagram))
				{
					return `After step at index ${j} on the ${side === "lhs" ? "left" : "right"}-hand side `
						+ `of the proof at index ${i}, the diagram is not continuous.`;
				}
			}
		}
	}

	return "All proofs are correct!";
}
