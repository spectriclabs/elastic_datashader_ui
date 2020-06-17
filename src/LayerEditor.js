import React, { Fragment } from 'react';
import {
  EuiForm,
  EuiFormRow,
  EuiHorizontalRule,
  EuiSuperSelect,
  EuiSwitch,
} from '@elastic/eui';
import '@elastic/eui/dist/eui_theme_dark.css';
import './App.css';
import {
  colorKeyOptions,
  colorRampOptions,
  ellipseModeOptions,
  ellipseSearchDistances,
  ellipseUnitsOptions,
  gridResolutionOptions,
  pointModeOptions,
  spanRangeOptions,
  spreadRangeOptions,
} from './options';

/**
 * Wrapper around `handlePropertyChange` callback
 *
 * @param {function(string, any): void} handlePropertyChange
 * @param {string} propertyName
 * @returns {function(any): void}
 */
const onSelectChange = (handlePropertyChange, propertyName) => {
  return (selectedValue) => handlePropertyChange(propertyName, selectedValue);
};

const renderStyleConfiguration = (properties, handlePropertyChange) => {
  const {
    showEllipses,
    spanRange,
    spread,
    gridResolution,
    ellipseUnits,
    ellipseSearchDistance,
    numericFields,
  } = properties;
  const ellipsesSwitch = (
    <EuiFormRow label="Render Mode" display="columnCompressed">
      <EuiSwitch
        label="Show ellipses"
        checked={showEllipses}
        onChange={(e) => handlePropertyChange('showEllipses', e.target.checked)}
        compressed
      />
    </EuiFormRow>
  );

  const pointStyleConfiguration = (
    <Fragment>
      <EuiFormRow label="Dynamic Range" display="rowCompressed">
        <EuiSuperSelect
          label="Span Range"
          options={spanRangeOptions}
          valueOfSelected={spanRange}
          onChange={onSelectChange(handlePropertyChange, 'spanRange')}
        />
      </EuiFormRow>
      <EuiFormRow label="Point Size" display="rowCompressed">
        <EuiSuperSelect
          label="Point Size"
          options={spreadRangeOptions}
          valueOfSelected={spread}
          onChange={onSelectChange(handlePropertyChange, 'spread')}
        />
      </EuiFormRow>
      <EuiFormRow label="Grid resolution" display="rowCompressed">
        <EuiSuperSelect
          label="Grid resolution"
          options={gridResolutionOptions}
          valueOfSelected={gridResolution}
          onChange={onSelectChange(handlePropertyChange, 'gridResolution')}
        />
      </EuiFormRow>
    </Fragment>
  );

  const ellipseStyleConfiguration = (
    <Fragment>
      <EuiFormRow label="Dynamic Range" display="rowCompressed">
        <EuiSuperSelect
          label="Span Range"
          options={spanRangeOptions}
          valueOfSelected={spanRange}
          onChange={onSelectChange(handlePropertyChange, 'spanRange')}
        />
      </EuiFormRow>
      <EuiFormRow label="Ellipse Major" display="rowCompressed">
        <EuiSuperSelect
          label="Ellipse Major"
          options={numericFields}
          valueOfSelected={''}
          onChange={onSelectChange(handlePropertyChange, 'spanRange')}
        />
      </EuiFormRow>
      <EuiFormRow label="Ellipse Minor" display="rowCompressed">
        <EuiSuperSelect
          label="Ellipse Minor"
          options={numericFields}
          valueOfSelected={''}
          onChange={onSelectChange(handlePropertyChange, 'spanRange')}
        />
      </EuiFormRow>
      <EuiFormRow label="Ellipse Tilt" display="rowCompressed">
        <EuiSuperSelect
          label="Ellipse Tilt"
          options={numericFields}
          valueOfSelected={''}
          onChange={onSelectChange(handlePropertyChange, 'spanRange')}
        />
      </EuiFormRow>
      <EuiFormRow label="Ellipse Units" display="rowCompressed">
        <EuiSuperSelect
          label="Ellipse Units"
          options={ellipseUnitsOptions}
          valueOfSelected={ellipseUnits}
          onChange={onSelectChange(handlePropertyChange, 'ellipseUnits')}
        />
      </EuiFormRow>
      <EuiFormRow label="Ellipse Search Distance" display="rowCompressed">
        <EuiSuperSelect
          label="Ellipse Search Distance"
          options={ellipseSearchDistances}
          valueOfSelected={ellipseSearchDistance}
          onChange={onSelectChange(
            handlePropertyChange,
            'ellipseSearchDistance'
          )}
        />
      </EuiFormRow>
    </Fragment>
  );

  return (
    <Fragment>
      {ellipsesSwitch}
      {!showEllipses ? pointStyleConfiguration : ellipseStyleConfiguration}
    </Fragment>
  );
};

/**
 *
 *
 * @param {string} colorRampName
 * @param {function(string, any): void} handlePropertyChange
 * @returns {*}
 */
const renderHeatColorStyleConfiguration = (
  colorRampName,
  handlePropertyChange
) => {
  return (
    <EuiFormRow label="Color Map" display="rowCompressed">
      <EuiSuperSelect
        options={colorRampOptions}
        onChange={onSelectChange(handlePropertyChange, 'colorRampName')}
        valueOfSelected={colorRampName}
        hasDividers={true}
        compressed
      />
    </EuiFormRow>
  );
};

const renderCategoricalColorStyleConfiguration = (
  colorKeyName,
  handlePropertyChange,
  selectedIndexFields,
  selectedIndexField
) => {
  const displayableIndexFields = selectedIndexFields.map((field) => {
    return {
      value: field.name,
      inputDisplay: field.name,
    };
  });
  return (
    <Fragment>
      <EuiFormRow label="Value" display="rowCompressed">
        <EuiSuperSelect
          options={displayableIndexFields}
          onChange={onSelectChange(handlePropertyChange, 'selectedIndexField')}
          valueOfSelected={selectedIndexField}
          compressed
        />
      </EuiFormRow>
      <EuiFormRow label="Color Map" display="rowCompressed">
        <EuiSuperSelect
          options={colorKeyOptions}
          onChange={onSelectChange(handlePropertyChange, 'colorKeyName')}
          valueOfSelected={colorKeyName}
          hasDividers={true}
          compressed
        />
      </EuiFormRow>
    </Fragment>
  );
};

const renderColorStyleConfiguration = (properties, handlePropertyChange) => {
  const {
    colorRampName,
    showEllipses,
    mode,
    colorKeyName,
    selectedIndexFields,
  } = properties;
  const styleConfig =
    mode === 'heat'
      ? renderHeatColorStyleConfiguration(colorRampName, handlePropertyChange)
      : renderCategoricalColorStyleConfiguration(
          colorKeyName,
          handlePropertyChange,
          selectedIndexFields
        );
  return (
    <Fragment>
      <EuiFormRow label="Color" display="rowCompressed">
        <EuiSuperSelect
          label="Color Mode"
          options={!showEllipses ? pointModeOptions : ellipseModeOptions}
          valueOfSelected={mode}
          hasDividers={true}
          compressed
          onChange={onSelectChange(handlePropertyChange, 'mode')}
        />
      </EuiFormRow>
      {styleConfig}
    </Fragment>
  );
};

function LayerEditor({ properties, handlePropertyChange }) {
  return (
    <EuiForm component="form">
      {renderColorStyleConfiguration(properties, handlePropertyChange)}
      <EuiHorizontalRule margin="xs" />
      {renderStyleConfiguration(properties, handlePropertyChange)}
    </EuiForm>
  );
}

export default LayerEditor;
