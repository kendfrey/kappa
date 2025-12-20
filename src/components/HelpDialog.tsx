import {
	ArrowsLeftRightIcon,
	ArrowsOutLineHorizontalIcon,
	ArrowsOutLineVerticalIcon,
	CirclesThreeIcon,
	GithubLogoIcon,
	HandIcon,
	HandTapIcon,
	LinkSimpleHorizontalIcon,
	PaintBrushHouseholdIcon,
	PencilIcon,
	PlusIcon,
	QuestionMarkIcon,
	ScribbleIcon,
	TrashIcon,
} from "@phosphor-icons/react";

export default function HelpDialog()
{
	return (
		<div className="scroll" style={{ lineHeight: "24px" }}>
			<p>
				Kappa is a tool for manipulating knot diagrams (and more generally, tangle diagrams). Manipulating a
				diagram generates a proof, which can be replayed. The allowed manipulations are defined by lemmas.
			</p>
			<p>
				Kappa is Knot A Proper Proof Assistant.
			</p>
			<h3>Diagrams</h3>
			<p>
				Every proof begins with a diagram, which is a grid-based representation of a knot, link, or tangle. To
				create a new diagram, click the <PlusIcon /> New Diagram button in the sidebar.
			</p>
			<h4>Editing Diagrams</h4>
			<ul>
				<li>
					The <PencilIcon />{" "}
					Draw tool adds arcs to the diagram by clicking and dragging. Using the right mouse button erases
					arcs.
				</li>
				<li>
					The <PaintBrushHouseholdIcon /> Paint tool sets the colour of arcs by clicking on them.
				</li>
				<li>
					The <ArrowsOutLineHorizontalIcon /> Columns and <ArrowsOutLineVerticalIcon />{" "}
					Rows tools add or remove columns and rows by clicking and dragging.
				</li>
			</ul>
			<h3>Proofs</h3>
			<p>
				Proofs are where diagrams are manipulated to demonstrate equivalences. To create a new proof from a
				diagram, drag that diagram from the Diagrams section and drop it onto the Proofs section header in the
				sidebar. Diagrams used in proofs must be continuous; every arc must end at a crossing or the edge of the
				diagram, and must be a single colour.
			</p>
			<h4>Editing Proofs</h4>
			<ul>
				<li>
					The <HandIcon /> Drag tool rearranges arcs by clicking and dragging.
					<ul>
						<li>
							The only built-in move is to slide a straight segment of arc perpendicular to itself. This
							takes precedence over lemmas but can be disabled by holding Ctrl.
						</li>
						<li>
							Other moves (e.g. Reidemeister moves) are defined by lemmas containing drag rules.
						</li>
						<li>
							Holding the Shift key makes secondary drag rules take precedence; for example, to choose the
							"under" variant of the second Reidemeister move.
						</li>
					</ul>
				</li>
				<li>
					The <HandTapIcon /> Poke tool applies lemmas by clicking, using the poke rules defined in lemmas.
				</li>
				<li>
					The <PaintBrushHouseholdIcon /> Paint tool sets the colour of arcs by clicking on them.
				</li>
				<li>
					The <ArrowsOutLineHorizontalIcon /> Columns and <ArrowsOutLineVerticalIcon />{" "}
					Rows tools add or remove columns and rows by clicking and dragging.
				</li>
				<li>
					The proof may contain both start and end diagrams. To set the unset side, drag a diagram from the
					Diagrams section onto the <QuestionMarkIcon />{" "}
					icon on the proof in the sidebar. The diagram must have a matching perimeter, in order to be a valid
					rewrite rule. To remove the diagram from either side, click the <TrashIcon />{" "}
					button at the bottom of the proof editor. To reverse the direction of the proof, click the{" "}
					<ArrowsLeftRightIcon /> button.
				</li>
				<li>
					The horizontal timeline bar allows you to navigate through the steps of the proof so far. Steps may
					be added to both sides, and the proof is complete when both sides converge on the same diagram. The
					left and right arrow keys, A, D, Home, and End keys can also be used for navigation. Ctrl+Z or
					Backspace will remove steps.
				</li>
				<li>
					Once both sides of the proof converge on the same diagram, or when only one side is set and the
					steps result in a diagram that has the same perimeter as the beginning diagram, the{" "}
					<CirclesThreeIcon weight="fill" /> Make Lemma button can be used to create a new lemma.
				</li>
				<li>
					When both sides of a proof are set, and there are no steps yet, the <LinkSimpleHorizontalIcon />
					{" "}
					Make Axiom button can be used to create a new axiom lemma.
				</li>
				<li>
					The <ScribbleIcon /> button opens the current diagram as a new diagram in the workspace.
				</li>
			</ul>
			<h3>Lemmas</h3>
			<p>
				Lemmas are rewrite rules that can be applied in proofs to manipulate diagrams. An axiom is a lemma with
				no proof.
			</p>
			<h4>Editing Lemmas</h4>
			<ul>
				<li>
					Each lemma must have a unique name. Dots (.) define namespaces for organizing lemmas in the sidebar.
				</li>
				<li>
					An axiom can track the number of times it is used. Each proof and lemma will then display the number
					of times the axiom has been invoked.
				</li>
				<li>
					Drag rules (shown as arrows) can be added to the left- and right-hand diagrams of the lemma by
					clicking and dragging. Secondary drag rules can be added by holding the Shift key while dragging.
					The lemma will be applied when the user drags from the start to the end of a drag rule in the proof
					editor, on any location matching the lemma diagram (up to rotation and reflection).
				</li>
				<li>
					Poke rules (shown as dots) can be added by clicking. Poke rules are applied in the proof editor by
					clicking on the corresponding location using the Poke tool.
				</li>
				<li>
					The horizontal timeline bar allows you to navigate through the proof of the lemma. The left and
					right arrow keys, A, D, Home, and End keys can also be used for navigation.
				</li>
				<li>
					The <ScribbleIcon /> button opens the current diagram as a new diagram in the workspace.
				</li>
				<li>
					The <CirclesThreeIcon weight="fill" />{" "}
					button opens the proof of the lemma as a new proof in the workspace.
				</li>
				<li>
					If a lemma is disabled using the checkbox in the sidebar, it won't be used when editing proofs.
				</li>
			</ul>
			<h3>About</h3>
			<p>
				<GithubLogoIcon /> <a href="https://github.com/kendfrey/kappa">Source code</a>
			</p>
			<h4>References</h4>
			<ol>
				<li>
					Brittenham, M., & Hermiller, S. (2025). Unknotting number is not additive under connected sum.{" "}
					<a href="https://arxiv.org/abs/2506.24088">https://arxiv.org/abs/2506.24088</a>
				</li>
				<li>
					Burton, B. A., Chang, H. C., Löffler, M., Maria, C., de Mesmay, A., Schleimer, S., Sedgwick, E., &
					Spreer, J. (2021). Hard diagrams of the unknot.{" "}
					<a href="https://arxiv.org/abs/2104.14076">https://arxiv.org/abs/2104.14076</a>
				</li>
			</ol>
		</div>
	);
}
