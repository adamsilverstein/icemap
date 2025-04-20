import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

registerBlockType('icemap/map', {
		title: __('Icemap', 'icemap'),
		icon: 'location-alt',
		category: 'widgets',
		attributes: {
				height: {
						type: 'string',
						default: '400px',
				},
		},
		edit: (props) => {
				const { attributes, setAttributes } = props;
				const { height } = attributes;

				return (
						<>
								<InspectorControls>
										<PanelBody title={__('Map Settings', 'icemap')}>
												<RangeControl
														label={__('Height', 'icemap')}
														value={parseInt(height)}
														onChange={(value) => setAttributes({ height: value + 'px' })}
														min={200}
														max={800}
												/>
										</PanelBody>
								</InspectorControls>
								<div style={{ height: height, backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
										<p>{__('Icemap will be displayed here', 'icemap')}</p>
								</div>
						</>
				);
		},
		save: () => {
				// Dynamic block, so return null
				return null;
		},
});
