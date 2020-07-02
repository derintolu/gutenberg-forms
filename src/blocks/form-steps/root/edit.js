import React, { useEffect, useState } from "react";
import {
	getLinearChildAttributes,
	addInnerBlock,
} from "../../../block/functions";
import { map, get, isEqual, each } from "lodash";
import {
	Button,
	IconButton,
	Placeholder,
	SelectControl,
	PanelBody,
} from "@wordpress/components";
import { TEXT_DOMAIN } from "../../../block/constants";
import Toolbar from "./toolbar";
import Icon from "../../../block/Icon";

const { updateBlockAttributes } = wp.data.dispatch("core/block-editor"); // for updating the label of steps
const { InnerBlocks, RichText, InspectorControls } = wp.blockEditor;
const { __ } = wp.i18n;

function edit(props) {
	const [childAttributes, updateChildAttributes] = useState([]), // initializing child attributes state
		[step, setStep] = useState(0),
		[blocksLoaded, setBlockLoaded] = useState(false),
		{ clientId, attributes, setAttributes } = props,
		{ currentStep, multiStepEffect } = attributes;

	const refreshAttributes = () => {
		const updatedChildAttributes = getLinearChildAttributes(clientId, "label"); // getting the label of all the child steps

		if (!isEqual(updatedChildAttributes, childAttributes)) {
			// checking if the child attributes is updated

			updateChildAttributes(updatedChildAttributes); // updating the labels to the with latest ones
		}
		setStep(currentStep); // setting the current step when the block loads
		handleStepVisibility(updatedChildAttributes);
	};

	const handleStepVisibility = (attributes = childAttributes) => {
		// showing and hiding step logic

		setBlockLoaded(false);

		each(attributes, (child, index) => {
			const childClientId = get(child, "clientId");

			if (isEqual(index, step)) {
				updateBlockAttributes(childClientId, {
					hideStep: false,
				}).then(() => {
					setBlockLoaded(true);
				});
			} else {
				updateBlockAttributes(childClientId, {
					hideStep: true,
				}).then(() => {
					setLoading(true);
				});
			}
		});
	};

	const addStep = () => {
		addInnerBlock(clientId, "cwp/form-step"); // updating the innerBlocks
		refreshAttributes(); // refreshing the attributes
		const newStepIndex = childAttributes.length;
		setStep(newStepIndex);
	};

	useEffect(() => {
		setBlockLoaded(false);
		refreshAttributes();
	}, []); // refreshing the attributes when block loads
	useEffect(() => {
		setAttributes({ currentStep: step }); // updating the attributes whenever the active step changes
		handleStepVisibility();
	}, [step]);

	const multiStepEffects = [
		{
			label: "No Effect",
			value: "cwp-noEffect-step",
		},
		{
			label: "Fade",
			value: "cwp-fade-step",
		},
		{
			label: "Slide",
			value: "cwp-slide-step",
		},
	];

	return [
		<div className="cwp-form-steps-wrapper">
			<div className="cwp-form-steps-labels">
				{map(childAttributes, (attr, index) => {
					const label = get(attr, "attributes.label");
					const blockId = get(attr, "clientId"); //? indicates if the current step is equal to the active step
					const className = isEqual(index, step) ? "is-active-step" : "";

					return (
						<div
							className="cwp-step-label-root"
							onClick={() => setStep(index)} // setting the current step active
						>
							<RichText
								tagName="a"
								className={className}
								key={index}
								formattingControls={[]}
								value={label}
								placeholder={__("Form Step", TEXT_DOMAIN)}
								onChange={
									(newLabel) =>
										updateBlockAttributes(blockId, { label: newLabel }) // updating the form step label
								}
							/>
						</div>
					);
				})}
				{blocksLoaded && (
					<IconButton
						icon={__(<Icon icon="addOutline" />, TEXT_DOMAIN)}
						onClick={addStep}
					/>
				)}
			</div>
			{!blocksLoaded ? (
				<Placeholder
					icon="editor-help"
					label={__("No Steps Found!", TEXT_DOMAIN)}
					instructions={__(
						"Please add some steps to create a multistep form",
						TEXT_DOMAIN
					)}
				>
					<Button isPrimary onClick={addStep}>
						Add Step
					</Button>
				</Placeholder>
			) : (
				<InnerBlocks
					isSmall
					isDefault
					allowedBlocks={["cwp/form-step"]}
					renderAppender={() => null}
				/>
			)}
		</div>,
		<Toolbar
			{...props}
			selectedStep={currentStep}
			childAttributes={childAttributes}
			refreshAttributes={refreshAttributes}
			setStep={setStep}
		/>, // toolbar controls
		<InspectorControls>
			<PanelBody title={__("Settings", TEXT_DOMAIN)}>
				<SelectControl
					label={__("Effect", TEXT_DOMAIN)}
					value={multiStepEffect}
					options={multiStepEffects}
					onChange={(multiStepEffect) => setAttributes({ multiStepEffect })}
				/>
			</PanelBody>
		</InspectorControls>,
	];
}

export default edit;